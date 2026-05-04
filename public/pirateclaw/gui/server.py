#!/usr/bin/env python3
"""
PirateClaw STP-Inspired LLM Proxy
- Spanning Tree Protocol for dynamic LLM routing
- Proxy discovery via UDP broadcast
- Chat-only routing between machines
- Round-robin with fallback
"""
import os
import sys
import json
import time
import socket
import struct
import hashlib
import threading
import logging
import asyncio
from pathlib import Path
from aiohttp import web
import requests
from datetime import datetime
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("pirateclaw-stp")

# Configuration
PROXY_PORT = int(os.getenv("PROXY_PORT", "6000"))
DASH_PORT = int(os.getenv("DASH_PORT", "8080"))
PARENT = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")
DISCOVERY_PORT = 6001
MULTICAST_GROUP = "239.255.255.250"

# STP Constants
BPDU_INTERVAL = 5  # seconds
PROXY_TIMEOUT = 30  # seconds
PATH_COST_BASE = 1000
CHAT_ONLY_MODE = True  # Remote execution disabled by default

class ProxyNode:
    def __init__(self, node_id, ip, port, is_local=False, capabilities=None):
        self.node_id = node_id
        self.ip = ip
        self.port = port
        self.is_local = is_local
        self.capabilities = capabilities or ["chat", "execute"] if is_local else ["chat"]
        self.last_seen = time.time()
        self.path_cost = 0 if is_local else PATH_COST_BASE
        self.state = "forwarding"  # forwarding, blocking, learning
        self.llm_available = True
        self.latency = 0

    def to_dict(self):
        return {
            "node_id": self.node_id[:8],
            "ip": self.ip,
            "port": self.port,
            "is_local": self.is_local,
            "capabilities": self.capabilities,
            "state": self.state,
            "path_cost": self.path_cost,
            "last_seen": int(self.last_seen),
            "llm_available": self.llm_available,
            "latency": self.latency
        }

class STPController:
    def __init__(self, local_ip=None):
        self.node_id = str(uuid.uuid4())
        self.local_ip = local_ip or self._get_local_ip()
        self.root_bridge = PARENT
        self.root_id = None
        self.bridge_id = self.node_id
        self.is_root = False
        self.proxies = {}
        self.lock = threading.Lock()
        self.round_robin_index = 0
        self._register_local_proxy()

    def _get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def _register_local_proxy(self):
        local = ProxyNode(
            node_id=self.node_id,
            ip=self.local_ip,
            port=PROXY_PORT,
            is_local=True,
            capabilities=["chat", "execute", "local_llm"]
        )
        with self.lock:
            self.proxies[self.node_id] = local
        logger.info(f"Registered local proxy: {self.local_ip}:{PROXY_PORT}")

    def register_proxy(self, node_id, ip, port, capabilities=None):
        if node_id == self.node_id:
            return
        
        with self.lock:
            if node_id not in self.proxies:
                proxy = ProxyNode(node_id, ip, port, is_local=False, capabilities=capabilities)
                self.proxies[node_id] = proxy
                logger.info(f"Discovered proxy: {ip}:{port} (capabilities: {capabilities})")
            else:
                self.proxies[node_id].last_seen = time.time()

    def update_proxy_health(self, node_id, llm_available, latency):
        with self.lock:
            if node_id in self.proxies:
                self.proxies[node_id].llm_available = llm_available
                self.proxies[node_id].latency = latency
                self.proxies[node_id].last_seen = time.time()

    def remove_proxy(self, node_id):
        with self.lock:
            if node_id in self.proxies and not self.proxies[node_id].is_local:
                del self.proxies[node_id]
                logger.info(f"Proxy removed: {node_id[:8]}")

    def prune_stale_proxies(self):
        now = time.time()
        with self.lock:
            stale = [nid for nid, p in self.proxies.items() 
                    if not p.is_local and now - p.last_seen > PROXY_TIMEOUT]
            for nid in stale:
                del self.proxies[nid]
                logger.info(f"Pruned stale proxy: {nid[:8]}")

    def get_best_proxy(self, chat_only=False):
        """Get best available proxy using STP path cost"""
        with self.lock:
            available = [
                p for p in self.proxies.values()
                if p.state == "forwarding" and p.llm_available
                and (not chat_only or "chat" in p.capabilities)
            ]
            
            if not available:
                return None
            
            # Sort by path_cost (lower is better), then by latency
            available.sort(key=lambda p: (p.path_cost, p.latency))
            
            # Round-robin among same-cost proxies
            cost = available[0].path_cost
            same_cost = [p for p in available if p.path_cost == cost]
            
            proxy = same_cost[self.round_robin_index % len(same_cost)]
            self.round_robin_index += 1
            return proxy

    def get_all_proxies(self, chat_only=False):
        """Get all proxies for debugging/status"""
        with self.lock:
            return [p.to_dict() for p in self.proxies.values() 
                    if p.state == "forwarding" and (not chat_only or "chat" in p.capabilities)]

    def get_fallback_chain(self):
        """Get fallback chain: parent -> local -> discovered"""
        chain = []
        
        # 1. Parent proxy
        chain.append({"url": f"{PARENT}/v1/chat/completions", "type": "cloud", "cost": 0})
        
        # 2. Local proxy (if has local LLM)
        with self.lock:
            local = self.proxies.get(self.node_id)
            if local and local.llm_available:
                chain.append({
                    "url": f"http://{self.local_ip}:{PROXY_PORT}/v1/chat/completions",
                    "type": "local",
                    "cost": 0
                })
        
        return chain

class BPDUHandler:
    """Handles Bridge Protocol Data Units for proxy discovery"""
    def __init__(self, controller):
        self.controller = controller
        self.sock = None
        self.running = False

    def start(self):
        """Start BPDU listener"""
        self.running = True
        
        # UDP socket for sending
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.sock.bind(('', DISCOVERY_PORT))
            self.sock.settimeout(1)
        except Exception as e:
            logger.warning(f"Discovery socket failed: {e}")
            self.sock = None
        
        # Start listener thread
        threading.Thread(target=self._listen_loop, daemon=True).start()
        
        # Start announcer thread
        threading.Thread(target=self._announce_loop, daemon=True).start()

    def stop(self):
        self.running = False
        if self.sock:
            self.sock.close()

    def _listen_loop(self):
        """Listen for BPDU announcements from other proxies"""
        while self.running:
            try:
                if self.sock:
                    data, addr = self.sock.recvfrom(1024)
                    self._process_bpdu(data, addr)
            except socket.timeout:
                pass
            except Exception as e:
                logger.debug(f"BPDU listen error: {e}")

    def _process_bpdu(self, data, addr):
        """Process incoming BPDU"""
        try:
            msg = json.loads(data.decode())
            node_id = msg.get("node_id")
            ip = msg.get("ip") or addr[0]
            port = msg.get("port", PROXY_PORT)
            capabilities = msg.get("capabilities", ["chat"])
            
            self.controller.register_proxy(node_id, ip, port, capabilities)
            
            # Send acknowledgment
            ack = json.dumps({"type": "bpdu_ack", "node_id": self.controller.node_id})
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                sock.sendto(ack.encode(), addr)
                sock.close()
            except:
                pass
                
        except Exception as e:
            logger.debug(f"BPDU parse error: {e}")

    def _announce_loop(self):
        """Periodically announce this proxy"""
        while self.running:
            try:
                bpdu = {
                    "type": "bpdu",
                    "node_id": self.controller.node_id,
                    "ip": self.controller.local_ip,
                    "port": PROXY_PORT,
                    "capabilities": ["chat", "execute"] if CHAT_ONLY_MODE else ["chat"],
                    "version": "0.0.1.39"
                }
                
                if self.sock:
                    self.sock.sendto(
                        json.dumps(bpdu).encode(),
                        (MULTICAST_GROUP, DISCOVERY_PORT)
                    )
                
                # Also try direct broadcast
                for target in [("255.255.255.255", DISCOVERY_PORT), 
                              (self.controller.root_bridge.replace("https://", "").split("/")[0], DISCOVERY_PORT)]:
                    try:
                        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                        sock.sendto(json.dumps(bpdu).encode(), target)
                        sock.close()
                    except:
                        pass
                        
            except Exception as e:
                logger.debug(f"BPDU announce error: {e}")
            
            time.sleep(BPDU_INTERVAL)

# Global controller
stp = STPController()

class ProxyHandler:
    def __init__(self):
        self.stp = stp

    async def handle_chat(self, request):
        """Handle chat completion with STP routing"""
        try:
            body = await request.json()
        except:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]}

        # Get fallback chain
        chain = self.stp.get_fallback_chain()
        
        # Try each endpoint in order
        for endpoint in chain:
            try:
                resp = requests.post(
                    endpoint["url"],
                    json=body,
                    headers=headers,
                    timeout=30
                )
                if resp.status_code == 200:
                    result = resp.json()
                    result["_routed_via"] = endpoint["type"]
                    return web.json_response(result)
            except Exception as e:
                logger.debug(f"{endpoint['type']} failed: {e}")
                continue

        return web.json_response(
            {"error": "All proxies failed", "detail": "No LLM available"},
            status=503
        )

    async def handle_status(self, request):
        """Return STP topology status"""
        self.stp.prune_stale_proxies()
        return web.json_response({
            "service": "pirateclaw-stp",
            "version": "0.0.1.39",
            "node_id": self.stp.node_id[:8],
            "local_ip": self.stp.local_ip,
            "is_root": self.stp.is_root,
            "parent": PARENT,
            "proxies": self.stp.get_all_proxies(),
            "chat_only_mode": CHAT_ONLY_MODE,
            "uptime": int(time.time())
        })

    async def handle_proxies(self, request):
        """List all discovered proxies"""
        self.stp.prune_stale_proxies()
        return web.json_response({
            "proxies": self.stp.get_all_proxies(),
            "count": len(self.stp.proxies)
        })

    async def handle_route(self, request):
        """Manual route selection"""
        try:
            body = await request.json()
            target_ip = body.get("target_ip")
            target_port = body.get("target_port", PROXY_PORT)
            chat_only = body.get("chat_only", CHAT_ONLY_MODE)
        except:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        if target_ip:
            # Route to specific proxy
            url = f"http://{target_ip}:{target_port}/v1/chat/completions"
            if chat_only:
                url += "/chat"
            
            try:
                resp = requests.post(
                    url,
                    json=body,
                    timeout=30
                )
                return web.json_response(resp.json())
            except Exception as e:
                return web.json_response({"error": str(e)}, status=503)
        else:
            return web.json_response({"error": "target_ip required"}, status=400)

async def init_app():
    app = web.Application()
    
    handler = ProxyHandler()
    
    app.router.add_post("/v1/chat/completions", handler.handle_chat)
    app.router.add_post("/v1/chat/completions/chat", handler.handle_chat)
    app.router.add_get("/status", handler.handle_status)
    app.router.add_get("/proxies", handler.handle_proxies)
    app.router.add_post("/route", handler.handle_route)
    app.router.add_get("/health", handler.handle_status)
    app.router.add_get("/", handler.handle_status)
    
    return app

def main():
    # Start BPDU handler
    bpdu = BPDUHandler(stp)
    bpdu.start()
    
    logger.info(f"PirateClaw STP Proxy")
    logger.info(f"  Local IP: {stp.local_ip}")
    logger.info(f"  Proxy Port: {PROXY_PORT}")
    logger.info(f"  Discovery Port: {DISCOVERY_PORT}")
    logger.info(f"  Parent: {PARENT}")
    logger.info(f"  Chat Only Mode: {CHAT_ONLY_MODE}")
    
    app = init_app()
    web.run_app(app, host="0.0.0.0", port=PROXY_PORT, print=None)

if __name__ == "__main__":
    main()