#!/usr/bin/env node
import { createServer } from "http";
import { spawn } from "child_process";

const PORT = 27272;
spawn("fuser", ["-k", `${PORT}/tcp`], { stdio: "ignore" });

createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "Access-Control-Allow-Origin": "*" });

  if (req.url === "/status") {
    const p = spawn("systemctl", ["is-active", "--quiet", "jellyfin"]);
    p.on("close", c => res.end(c === 0 ? "active" : "inactive"));
    return;
  }

  const cmd = req.url === "/run/install" ? "/usr/local/bin/dashboard-install-jellyfin" :
              req.url === "/run/uninstall" ? "/usr/local/bin/dashboard-uninstall-jellyfin" : null;
  if (!cmd) { res.end(); return; }

  const child = spawn("sudo", [cmd]);
  child.stdout.on("data", d => d.toString().split("\n").filter(l=>l.trim()).forEach(l=>res.write(`data: ${l}\n\n`)));
  child.stderr.on("data", d => d.toString().split("\n").filter(l=>l.trim()).forEach(l=>res.write(`data: ${l}\n\n`)));
  child.on("close", () => res.end());

}).listen(PORT, () => console.log("Helper running"));
