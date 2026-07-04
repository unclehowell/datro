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

```
┌────────────────────────────────────────────┐
│   Parent Proxy (financecheque.uk)          │
│   - Routes to LLM APIs (OPENAI_API_KEY)    │
│   - Agentic → designated child (phone)      │
└────────────────────┬───────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Laptop   │ │ Phone    │ │ Other    │
   │ Child    │ │ Agentic  │ │ Child    │
   └──────────┘ └──────────┘ └──────────┘
```

## Routing Policy

### Boolean Logic
- `C` = Chat-only (header: `X-Chat-Only: true`)
- `F` = X-Forwarded (indicates request came from parent)
- `A` = Agentic prompt (header: `X-Agentic: true`)

### Child Proxy Behavior
```
IF X-Forwarded == true:
  → Use LOCAL LLM ONLY (loop prevention)
ELSE:
  → Forward to parent proxy
  → Fallback to local LLM after 3 retries/timeouts
```

### Parent Proxy Behavior
```
IF X-Forwarded == true:
  → Reject (prevents loop)
 
ELSE IF X-Agentic == true:
  → Route to agentic child (e.g., phone)
 
ELSE IF X-Chat-Only == true:
  → Respond via LLM APIs
 
ELSE:
  → Route to available child (not source)
```

## Endpoints

| Endpoint | Description | Method |
|----------|-------------|--------|
| `/fcukproxy/install.sh` | Child proxy installer | GET |
| `/fcukproxy/child-proxy.mjs` | Child proxy source | GET |
| `/api/proxy?action=register` | Register child node | POST |
| `/api/proxy?action=heartbeat` | Report alive status | POST |
| `/api/proxy?action=health` | List active children | GET |
| `/api/proxy/v1/chat/completions` | Chat completions | POST |

## Headers

| Header | Purpose |
|--------|---------|
| `X-Chat-Only: true` | Chat query (no agentic) |
| `X-Forwarded: true` | Loop prevention |
| `X-Agentic: true` | Agentic prompt for agent processing |
| `X-Source-Machine` | Identifies requesting child |