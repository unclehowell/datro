---
name: project-delivery
description: End-to-end project delivery methodology combining PRINCE2 governance, AI agent workflows, recursive self-improvement, and Honcho memory. Use for any multi-step project requiring structured delivery with quality gates, stage-gate progression, exception management, and learning capture. Supersedes standalone PRINCE2 for day-to-day work.
version: 2.0.0
author: Hermes Agent (enhanced with PRINCE2 7th Edition, recursive self-improvement research, Honcho memory integration, stage-gate automation)
metadata:
  hermes:
    tags: [project-management, delivery, prInce2, self-improvement, quality, stages]
    related_skills: [prince2, recursive-self-improvement, writing-plans, subagent-driven-development, requesting-code-review]
---

# Project Delivery Methodology

## Overview

Merges PRINCE2 governance with AI agent execution patterns into a single delivery framework. 
Follow this for all multi-step tasks (>3 tool calls).

## The Delivery Pipeline (PRINCE2 7th Edition + AI Agent Workflow)

```
MANDATE → BRIEF → PLAN → EXECUTE → CHECKPOINT → DEBRIEF
                ↑          ↓                    ↓
         (Quality Gates)  (Self-Improve)    (Benefits Review)
```

### Phase 1: MANDATE (Starting Up — SU)
- What exactly are we building? (product, not activities — Focus on Products principle)
- Success criteria: measurable, testable
- Constraints: time, budget, technical
- Stakeholders: who decides, who reviews (Defined Roles & Responsibilities)
- Validate business justification (Continued Business Justification principle)
- Draft initial Product Breakdown Structure (PBS)

### Phase 2: BRIEF (Initiating — IP) — **Present BEFORE coding**
- Product Breakdown Structure: System → Module → Component → Tests + Docs
- Work packages with clear deliverables
- Risk assessment with mitigations (Risk theme)
- Quality criteria per deliverable (Quality theme)
- Estimated timeline with tolerance margins (±5% time, ±10% cost)
- Define tolerances for quality, scope (MoSCoW), risk exposure
- **Get explicit approval before proceeding** (Directing process)

### Phase 3: PLAN (Stage Planning)
- Decompose work packages into tasks with dependencies
- Assign to agent or subagent (subagent-driven-development skill)
- Set quality gates: lint, type-check, test coverage ≥80%, security scan
- Define tolerance thresholds per stage
- Generate hierarchical task graph with milestones

### Phase 4: EXECUTE (Controlling Stage + Managing Delivery — CS/MP)
- Bite-sized increments per work package
- Mini cycle: implement → test → review → commit (TDD cycle)
- Quality gates at stage boundaries
- Real-time status tracking: 🟢 on track / 🟡 approaching tolerance / 🔴 breached
- Monitor tolerances continuously (Manage by Exception principle)
- Multi-path exploration for complex problems: 3-5 candidates, score, merge best
- Log work packages, track progress, update quality register

### Phase 5: CHECKPOINT (Stage Boundary — SB)
- Validate all deliverables against product descriptions
- Run automated gate checks (test coverage ≥80%, zero P0/P1 defects, clean lint)
- Update progress metrics and business case
- Update risk register with current exposure
- Generate highlight report:
  - What's done / planned next / risks / tolerance status
  - Benefits status: 🟢 on track / 🟡 partial / 🔴 missed

### Phase 6: DEBRIEF (Closing — CP) + Benefits Realization
- Final status: planned vs actual across all dimensions
- Validate all quality register entries complete
- Benefits realization review: compare baseline vs actual KPIs
- What went well / what could be improved
- Archive learnings to brain and session memory
- Update skills with new patterns (recursive-self-improvement skill)
- Generate post-project review document
- Schedule post-deployment benefits tracking (if applicable)

## Quality Gates (Mandatory)

| Gate | Criteria |
|------|----------|
| **Entry** | Requirements clear, PBS defined, tolerances set |
| **Code** | Tests pass, lint/type-clean, no security warnings, coverage ≥ 80% |
| **Review** | Spec compliance + code quality review approved |
| **Exit** | Docs updated, lessons archived, handover ready |

## Exception Management

When tolerances are breached (time >±5%, quality <threshold, scope beyond MoSCoW):
1. **Pause** — stop current work
2. **Assess** — generate exception report with cause, impact, recovery options
3. **Escalate** — present 3 options (revise plan / reduce scope / abort)
4. **Wait** — do NOT proceed until direction received
5. **Resume** — execute approved direction, log outcome

### Configurable Tolerance Patterns (2026 Update)
Use machine-readable tolerance thresholds for AI agent workflows:
```json
{
  "tolerances": {
    "cost_usd": {"max": 15.00, "alert_at": 12.00},
    "latency_ms": {"max": 3000, "alert_at": 2500},
    "quality_score": {"min": 0.85, "alert_at": 0.90}
  },
  "process_gates": {
    "stage_boundary": {"requires_approval": true, "auto_archive": true},
    "exception": {"route_to": "human_supervisor", "pause_pipeline": true}
  }
}
```

### AI-Specific Exception Patterns
- **Compute runaway**: auto-simplify prompts, switch to cheaper model, escalate if still OOB
- **Quality degradation**: route to reviewer agent, apply fallback validation, flag for human review
- **Scope expansion**: enforce MoSCoW strictly, generate change request, defer nice-to-haves

## Self-Improvement Loop

After every task:
1. **Archive** — save what worked, what failed, why
2. **Update Skills** — promote successful patterns to skills
3. **Score Memories** — bump access_count on used facts
4. **Check Convergence** — are we getting faster/fewer iterations across dimensions?

Track across ≥2 orthogonal dimensions: pass rate, token cost, iteration count, regression rate.

## Exception Patterns (AI Agent Specific)

Common exception scenarios and automated responses:

| Exception Trigger | Auto-Response | Escalation |
|---|---|---|
| Compute budget exceeded | Switch to cheaper model, simplify approach | If still OOB after 2 attempts |
| Quality gate failure | Revert, analyze root cause, retry with fixed approach | If 3 retries fail |
| Scope expansion detected | Enforce MoSCoW, defer non-critical items | If user insists on scope change |
| Dependency conflict | Isolate in sandbox, find alternative | If no alternative exists |
| Service unavailable | Retry with exponential backoff (max 3) | If all retries fail |

## Multi-Agent Delegation Patterns

When using `delegate_task` for project execution:

1. **Task decomposition**: Break work packages into independent sub-tasks with `tasks` array (max 3 parallel)
2. **Context passing**: Include all needed file paths, error messages, constraints in `context` field
3. **Toolset selection**: Use `toolsets=["web"]` for research, `toolsets=["terminal"]` for execution
4. **Validation**: Each sub-agent returns structured output; validate against product descriptions
5. **Integration**: Merge outputs, run quality gates, produce stage boundary report

## Research-Backed Improvements (2026-04-07)

### From Recursive Self-Improvement Research
- **Trace collection**: Log `(input, decision_path, tool_calls, test_results)` for successful tasks
- **Reflexion loop**: After failure → error analysis → revised plan → retry (max 3 depth)
- **Asymmetric update cadence**: Fast (prompts/memory), Slow (tool routing), Rare (architecture)
- **Confidence calibration**: Output `p_success` before execution, track calibration over time
- **Adversarial verification**: Dedicated verification pass before marking tasks complete

### From Honcho Memory Research
- **Hybrid retrieval**: Metadata filter → vector search → rerank by relevancy
- **Chunk normalization**: Store facts as self-contained assertions, < 200 words
- **Deduplication on ingest**: Cosine similarity > 0.85 triggers merge/skip
- **TTL management**: Set `expires_at` during creation for auto-eviction
- **Cross-context sharing**: Use shared `app_id` + differentiated metadata for agent-to-agent memory

---

## Usage

1. Start at MANDATE for any multi-step task
2. Build PBS before coding
3. Present BRIEF for approval
4. Execute through quality gates
5. Close with DEBRIEF
6. Load `prince2` skill for detailed governance reference
7. Load `recursive-self-improvement` for meta-learning patterns
