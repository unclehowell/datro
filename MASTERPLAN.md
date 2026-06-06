# DATRO Flywheel — Master Plan

## Architecture Overview

The flywheel is an autonomous agentic system running on Cloudflare Workers that continuously improves all branches of the DATRO monorepo.

## Key Components

### 1. Agentic Loop (ReAct Pattern)
Replaces the old single-prompt AI flow. Each release cycle runs a chain-of-thought agent:
- **Think**: Agent recieves full context (HTML, wing files, brain memory, Honcho, research)
- **Tool Call**: Agent picks a tool to investigate or modify the codebase
- **Observe**: Tool results are fed back to the agent
- **Repeat**: Up to 6 iterations per cycle
- **Done**: Agent outputs SUMMARY and commits are tagged/released

### 2. MCP Tool System
The agent has these tools at its disposal:
| Tool | Description |
|------|-------------|
| `read_file` | Read any file from any branch |
| `write_file` | Write + commit changes to any branch |
| `list_branches` | List all branches and their latest commit |
| `search_code` | Search codebase for patterns |
| `run_scan` | Run EAA WCAG / AccessScore scans |
| `honcho_memory` | Read/write Honcho memory per branch |
| `wallet_info` | Get crypto wallet + compute budget |
| `brainstorm` | Ask LLM for creative thinking |

### 3. Deterministic Crypto Wallets (per Branch)
Each branch gets a unique deterministic wallet derived via HKDF-SHA256:
```
MASTER_SEED + HKDF(salt="agentic-flywheel-v2", info="branch:<name>") → 256 bits
  ├── First 32 bytes → Wallet private key
  └── Last 4 bytes → Compute budget (0-9999 units)
```
Wallets are cached in KV for 24h. Used for:
- Compute emulation (higher budget → faster gear)
- Branch identity verification
- Future: signing releases, proof-of-work

### 4. Compressed Release Cycle
- **Cron**: `*/10 * * * *` (every 10 min, down from 30 min)
- **Gear 1 cooldown**: 600s (10 min, down from 3600s)
- **Gear 10 cooldown**: 35s
- **Burst Mode**: Progressive bias (1-2) → gear +2; High risk (4-5) → gear +1; High compute → gear +1
- **cnei**: Gets half-gear cooldown for faster self-improvement
- **No-branch fallback**: Forces cnei when all regular branches are on cooldown

### 5. Honcho Integration
- Read per-branch memory for durable facts
- Write observations after each release cycle
- Used in system prompt for agent context

### 6. Brain / Memory System
- **MEMORY.md** per branch: Records each cycle's changes
- **BRAIN_CONSOLIDATED.md** on `brain` branch: Aggregated memory from all branches
- **Honcho**: Durable facts that persist across deploys
- **KV**: State (rotation, bias, config, wallets, MCP cache)

### 7. Release Pipeline
```
Cron trigger (10 min)
  → Acquire lock (KV)
  → aggregateMemory to brain branch
  → Check bias/risk/wallet for burst mode
  → Find available branch (off cooldown)
  → processBranch():
    1. Apply self-improvements (cnei only)
    2. Run MCP scans (EAA, AccessScore)
    3. Inject master record visuals from wing files
    4. Run agentic loop (ReAct, up to 6 iterations)
    5. OR fallback to best-practice engine
    6. OR audit-only release
    7. Create git tag + GitHub release
  → Save state + release lock
```

## Wallet System (Compute Emulation)

Each branch wallet's `computeBudget` (0-9999) is derived from the deterministic seed. When computeBudget > 5000, the gear advances by 1, giving faster releases to branches with "more compute."

Wallet addresses are hex strings derived from SHA-256 of the per-branch key (first 20 bytes, lowercased).

To inspect: `GET /__wallet?branch=<name>` or `GET /__wallets`

## Future Roadmap
- [ ] MCP server endpoint for external tool access
- [ ] Agent-to-agent communication between branches
- [ ] Merge request generation via cnei
- [ ] Distributed compute across branches (Kruskal's / Merkle)
- [ ] Honcho background reasoning for cross-branch insights
- [ ] Auto-deploy cnei improvements to production flywheel
