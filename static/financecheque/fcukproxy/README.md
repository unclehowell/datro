# FCUK Proxy

A distributed LLM proxy system with parent-child architecture. Makes any device (laptop, phone, server) a child proxy on the financecheque.uk network.

## Quick Start

```bash
# Basic child proxy (chat mode)
curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash

# Agentic node (for compute offload - e.g., phone)
AGENT_ROLE=agent curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
```

## Architecture

Parent Proxy (financecheque.uk) handles LLM API responses and routes agentic prompts. Child proxies forward requests and fallback to local LLM after 3 retries.

## Routing Policy

- X-Forwarded: true → LOCAL LLM ONLY (loop prevention)
- X-Agentic: true → route to designated child (phone)
- X-Chat-Only: true → respond via LLM APIs
- Otherwise → route to available child (not source)

## Endpoints

| Endpoint | Method |
|----------|--------|
| /fcukproxy/install.sh | GET |
| /fcukproxy/child-proxy.mjs | GET |
| /api/proxy?action=register | POST |
| /api/proxy?action=heartbeat | POST |
| /api/proxy?action=health | GET |
| /api/proxy/v1/chat/completions | POST |
