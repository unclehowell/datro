# Skill: Local Agent Discharge
When a node reports it can run local agentic CLIs (opencode/kilo), prefer
discharging real work there before falling back to a cloud LLM. This keeps
long-horizon campaigns running on node compute and lowers per-lead LLM cost.

- **opencode available** → use `opencode --non-interactive -m "<task>"`.
- **kilo available** → use `kilo run "<task>"`.
- **Neither** → route through the local agent's `/v1/chat/completions`.
- Capability probe: `command -v opencode`, `command -v kilo`.
- Always write full outputs to the order's `strategy/` dir; only summaries
  enter the prompt context on later iterations.