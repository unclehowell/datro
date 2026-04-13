---
name: prince2
description: PRINCE2 methodology — mandatory framework for all software projects and delegated tasks. Covers 7 principles, 7 themes, 7 processes mapped to AI agent workflows with stage-gate delivery, product-based planning, exception management, quality gates, tolerance thresholds, CI/CD integration, and benefits realization tracking.
version: 3.4.0
author: Hermes Agent (enhanced with PRINCE2 7th Edition 2023 updates, People theme, sustainability mandate, Agile/digital mapping, Honcho-integrated memory, industry best practices, benefits realization tracking, and AI-native automation patterns)
metadata:
  hermes:
    tags: [project-management, governance, planning, quality, risk, delivery]
    related_skills: [writing-plans, subagent-driven-development, requesting-code-review, plan]
---

# PRINCE2 — Project Management for AI Agents

## Overview

PRINCE2 (PRojects IN Controlled Environments) is a process-driven, product-focused project management framework. This skill maps its 7 principles, 7 themes, and 7 processes to AI coding agent workflows for structured, high-quality delivery.

**This skill is MANDATORY for all delegated work and multi-step projects.**

---

## The 7 Principles (Mandatory Foundations)

### PRINCE2 7th Edition (2023) Key Updates
- **Outputs → Outcomes**: Focus shifted from product delivery to value delivery. Always ask "why" before "what".
- **Sustainability mandate**: Every project must address environmental, social, and economic impacts.
- **Human-centric focus**: Team psychology, emotional intelligence, and remote/hybrid dynamics are now core concerns.
- **Elevated tailoring**: Framework is significantly less prescriptive — strip unnecessary controls for digital/Agile environments.

Note: The "Organization" theme has been replaced by "**People**" (see themes below). The 7 principles remain structurally the same but with updated guidance emphasizing outcomes over outputs and value over products.

No project proceeds unless ALL 7 principles are satisfied:

| # | Principle | AI Agent Implementation |
|---|-----------|------------------------|
| 1 | **Continued Business Justification** | Before starting, validate: acceptance criteria are clear, success metrics defined, ROI viable. Halt if scope drifts from value. Revalidate at each stage gate. |
| 2 | **Learn from Experience** | Consult knowledge base (brain files, session history, past PRs) before coding. Append new learnings after completion. Maintain failure pattern library. |
| 3 | **Defined Roles & Responsibilities** | Operate within permission scopes. Clear escalation: agent implements/reviews → human approves/merges. Never self-approve production changes. Maintain RACI matrix. |
| 4 | **Manage by Stages** | Work partitioned into phases (Design → Implement → Test → Deploy). Each stage has entry/exit criteria and a gate check. Timeboxed or deliverable-linked stages. |
| 5 | **Manage by Exception** | Define tolerances per stage (time, complexity, test coverage, security score). See Exception Tolerance Table below. Breaches = automatic pause + escalation. |
| 6 | **Focus on Products** | Start with Product Breakdown Structure (PBS). Derive tasks from tangible deliverables (APIs, modules, tests, docs), not activity lists. Activity alone is never "done". |
| 7 | **Tailor to Environment** | Scale rigor to project size: lightweight for POCs, strict compliance for production agents, CI/CD, and critical services. Automate compliance where possible. |

---

## The 7 Themes (Continuously Managed)

| Theme | What It Means | AI Agent Practice |
|-------|--------------|-------------------|
| **Business Case** | Why are we doing this? | Tag tasks with value metrics. De-scope low-ROI work. Update business case at each gate with actual vs forecast (cost, velocity, defects). Validate viability ≥ 3 KPIs. |
| **People** (was Organization, 7th Edition 2023) | Who does what + team dynamics | Use role templates. RACI matrix. Team psychology, conflict resolution, psychological safety. Remote/hybrid working considerations. |
| **Organization** | [Legacy] Who does what? | Use role templates (Architect, Implementer, Reviewer, QA). RACI matrix for AI vs human decisions. Maintain stakeholder communication matrix. |
| **Quality** | What does "good" look like? | Codify quality gates: lint, type-check, test coverage, security scan. Self-validate before submission. Maintain quality register tracking all checks. |
| **Plans** | How, when, by whom? | Generate hierarchical task graphs with dependencies, time budgets, milestones. Update based on actual velocity. Decompose product descriptions into tickets. |
| **Risk** | What could go wrong? | Pre-scan: dependency conflicts, breaking changes, tech debt. Maintain risk register with probability × impact scoring. Auto-execute mitigations or escalate cumulative exposure > threshold. |
| **Change** | How do we handle deviations? | Formal PR/MR workflows with impact analysis, migration scripts, rollback plans. No scope creep. Require CR link for any scope deviation. CR → commit → release → quality register traceability. |
| **Progress** | Where are we vs. plan? | Track: planned vs actual, test pass rate, code churn, defect density. Alert on tolerance breaches. Generate highlight reports with checkpoint assessments. |

---

## The 7 Processes (Chronological Flow)

| Process | Phase | AI Agent Action |
|---------|-------|----------------|
| 1. **Starting Up** (SU) | Pre-project | Context initialization. Verify repo access, env configs, ticket alignment. Draft PBS. Set stage tolerances. Create `.prince2/` directory for artifacts. |
| 2. **Initiating** (IP) | Project setup | Generate initiation doc: architecture brief, quality/risk/change strategies, baseline plan, approval gates. Store in `.prince2/initiation.md`. |
| 3. **Directing** (DP) | Governance | Submit stage-end reports, exception requests, change proposals. Await authorization before proceeding. Gate: auto-check CI/CD + report generation. |
| 4. **Controlling a Stage** (CS) | Execution | Assign work packages. Track progress. Log issues. Monitor tolerances in real-time. Trigger exception workflows on breach. Update quality register. |
| 5. **Managing Delivery** (MP) | Core dev loop | Implement per quality criteria. Run unit/integration tests. Package artifacts. Submit for review. Auto-generate test suites from acceptance criteria (Given/When/Then → Pytest/Jest). |
| 6. **Stage Boundary** (SB) | Between phases | Validate all deliverables. Update business case and risk register. Capture lessons learned. Draft next stage plan for approval. Re-baseline if required. |
| 7. **Closing** (CP) | Project end | Final audit (quality register review, coverage check). Generate documentation. Compile post-project review. Archive learnings to brain. Deactivate ephemeral resources. |

---

## Exception Management — Tolerance Thresholds

When tolerances breach, follow this protocol:

| Dimension | Default Tolerance | AI Action on Breach |
|-----------|------------------|---------------------|
| **Time** | ±5% per stage | Flag, adjust priority, propose re-baseline or descope |
| **Cost** | ±10% | Alert, pause non-essential work, request budget CR |
| **Quality** | 0 P0 defects, ≤3 P1, coverage ≥ threshold | Block promotion, auto-assign fix tickets |
| **Scope** | MoSCoW boundaries enforced | Route CR workflow, generate impact analysis, await approval |
| **Risk** | Cumulative exposure score threshold | Trigger mitigation playbook, escalate if unresolvable |
| **Benefits** | KPI deviation >15% from forecast | Update business case, propose pivot or stage extension |

### Exception Workflow
1. **Detect** — AI monitors tolerances continuously (on commit or daily)
2. **Pause** — Stop work on current task. Do NOT proceed while tolerances are violated
3. **Assess** — Generate `Exception Report`: cause, impact, affected downstream tasks, recovery options
4. **Escalate** — Present 3 options:
   - Option A: Revised plan with new tolerances
   - Option B: Scope reduction to meet original tolerances
   - Option C: Abort and reassess feasibility
5. **Wait** — Do NOT proceed until direction is received
6. **Resume** — Execute approved direction, log outcome in audit trail

---

## Stage-Gate Delivery in Software Workflows

Each stage ends with a formal gate where progression is approved or blocked.

### Gate Artifacts (generated automatically)
- Stage report with actual vs planned metrics
- Updated business case + risk register
- Quality register status
- Exception log
- Next stage plan

### Automated Gate Checks (CI/CD integrated)
| Check | Criteria |
|-------|----------|
| **Test coverage** | ≥ configured threshold (default 80%) |
| **Security scan** | Zero critical/high vulnerabilities (SAST/DAST) |
| **Linting/typing** | Clean pass — no warnings |
| **Performance** | Benchmarks within tolerance (p95 response time) |
| **Acceptance** | All stage deliverables meet product description criteria |
| **Business case** | KPI viability confirmed — cost, velocity, defect density |

### Gate Decision
```yaml
gate_criteria:
  time_variance: "≤ 5%"
  cost_variance: "≤ 8%"
  quality:
    coverage: "≥ 80%"
    p0_defects: 0
  proceed_if: ALL_MET
  escalate_if: ANY_FAILED
```

---

## Product-Based Planning

PRINCE2 prioritizes **what** is delivered over **how**. AI agents thrive on this structure.

### Product Breakdown Structure (PBS)
Hierarchical deliverable tree: `System → Module → Component → Tests + Docs`

### Product Description Template (AI-parseable)
Every deliverable must have:
```yaml
product_id: AUTH_MODULE_V2
purpose: Enable OAuth2 login with MFA
composition: ["oauth_handler.py", "mfa_service.ts", "tests/", "docs/"]
quality_criteria:
  - "response_time < 300ms p95"
  - "test_coverage >= 85%"
  - "passes OWASP ZAP baseline"
acceptance_criteria:
  - "GIVEN valid token WHEN request THEN 200 OK"
  - "GIVEN expired token THEN 401 with rotate_prompt"
reviewers: ["lead_architect", "security_engineer"]
review_method: "Automated CI + Peer review"
```

### AI Implementation
Parse product descriptions → auto-generate GitHub Issues → attach acceptance tests → track completion in quality register → Block PR merge if acceptance tests fail.

---

## Quality Management Approach

### Three Pillars
1. **Quality Planning** — Define standards, acceptance criteria, review methods
2. **Quality Control** — Execute checks (tests, reviews, scans), track in register
3. **Quality Assurance** — Audit the quality system itself

### Quality Register
Maintain a living register tracking all quality activities:
| Product | Review Type | Status | Defects Open | Acceptance Met |
|---------|------------|--------|-------------|---------------|
| API Gateway | Automated + Peer | PASSED | 1 (P2) | ✓ |

### Quality Gates (Mandatory)
| Gate | Criteria |
|------|----------|
| **Entry Gate** | Requirements clear, PBS defined, tolerances set, acceptance criteria documented |
| **Code Gate** | All tests pass, lint/type-clean, no security warnings, coverage meets threshold |
| **Review Gate** | Spec compliance check passed, code quality review approved |
| **Exit Gate** | Documentation updated, lessons archived, handover packages ready |

---

## Risk Management

### The Flow
Identify → Assess (Probability × Impact) → Plan (Avoid/Reduce/Transfer/Accept/Share) → Implement → Monitor

### AI Automation
- Scrape repos, incident logs, dependency trackers for risk signals
- Maintain `risk_register.yaml` with triggers and playbooks
- Auto-execute mitigations (rollback, feature flag disable, model fallback)
- Escalate cumulative risk exposure > threshold

---

## Change Control

### Workflow
```
Change Request → Impact Analysis → Approval → Implementation → Verification → Baseline Update
```

### AI Enforcement
- Require CR link for any scope/tolerance deviation
- Auto-generate impact report (timeline, cost, dependencies, quality impact)
- Block unapproved changes in CI/CD
- Trace: CR → commit → release → quality register

---

## The 5-Phase Delivery Framework

### PHASE 1: MANDATE — Capture exact requirements
- Exact description of what to achieve
- Measurable success criteria
- Constraints (budget, timeline, technical)

### PHASE 2: BRIEF — Present proposed solution for approval ⚠️ BEFORE work
- Product Breakdown Structure (PBS)
- Work Packages with task groupings
- Risk assessment with mitigations
- Quality criteria and gate checks
- Estimated timeline with tolerance margins

### PHASE 3: PLAN — Execute with structured progress tracking
- Bite-sized increments per work package
- Mini cycle: implement → test → review per package
- Quality gates at stage boundaries
- Real-time status tracking with color indicators

### PHASE 4: HIGHLIGHT REPORTS — Periodic structured updates
Each checkpoint reports:
- What's done since last report
- What's planned next
- Risks/issues discovered
- Tolerance status: 🟢 within / 🟡 approaching / 🔴 breached

### PHASE 5: DEBRIEF — Final status and lessons learned
- Final status: planned vs actual
- What went well / what could be improved
- Recommendations for future similar tasks
- Archive learnings to brain

---

## Visual Status Format

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECT: [Project Name]                              Status: 🟢 Active │
├─────────────────────────────────────────────────────────────────────────┤
│  MANDATE: [Brief description of what we want to achieve]               │
├─────────────────────────────────────────────────────────────────────────┤
│  Work Package     │ 1 (11%) │ 2 (22%) │ 3 (33%) │ 4 (44%) │ 5 (55%)    │
│  ─────────────────┼─────────┼─────────┼─────────┼─────────┼─────────── │
│  Status           │   🟢    │   🟡    │   ⚪    |   ⚪    |   ⚪       │
│  Task             │ Complete│ In Prog │  Pending│  Pending│  Pending  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Color Schema
| Icon | Meaning |
|------|---------|
| 🟢 | Complete |
| 🟡 | In Progress |
| 🔴 | Blocked — needs help |
| ⚪ | Pending |
| 🟣 | On Hold |

### Project Status Icons
- 🟢 Active — Work ongoing
- 🟡 On Hold — Waiting on user/dependency
- 🔴 Blocked — Need intervention
- ✅ Complete — Finished
- ⚪ Not Started

---

## Usage

When receiving a new task:
1. Check if project context exists (mandate, brief, plan). If not, start at MANDATE.
2. Build the PBS before coding — know WHAT you're building before HOW.
3. Present the BRIEF for approval — get explicit go-ahead.
4. Execute with structured progress tracking and quality gates.
5. Deliver a DEBRIEF — archive learnings to brain and session memory.

---

## Agile & Digital Mapping (7th Edition 2023)

| PRINCE2 Concept | Agile/Digital Equivalent |
|-----------------|-------------------------|
| Management Stages | Releases (collections of features) |
| Work Packages | Sprints |
| Team Plans | Scrum/Kanban boards |
| Checkpoint Reports | Daily stand-ups / burn-down reviews |
| Risk Register | Risk Burndown charts in Jira/Azure DevOps |
| Tolerances | Sprint boundaries + Definition of Done |

### Software-Specific Pitfalls & Mitigations

| Pitfall | Mitigation |
|---------|-----------|
| Heavy documentation bloat (100-page PID for a small feature) | Tailor PID — use lightweight Project Mandate + Product Backlog, keep docs "just barely sufficient" |
| Waterfall delivery within stages | Shorten stages to 2-4 weeks, deliver MVP at stage end for continuous justification |
| Change control bottlenecks on minor UI/backlog tweaks | Set broad tolerances for team — pre-approve backlog grooming within sprint |
| Ignoring technical debt (quality theme focuses only on UAT) | Include non-functional requirements (coverage, refactoring, security, latency) as quality criteria |
| Role collision (PO vs Senior User, Scrum vs PM) | Unify roles: PM=Scrum Master, Senior User=PO, Senior Supplier=Lead Architect |

## Anti-Patterns (Avoid These)

- ❌ Coding before understanding the product (violates Focus on Products / Value Focus)
- ❌ Changing scope without approval (violates Change Control)
- ❌ Proceeding after tolerance breach (violates Manage by Exception)
- ❌ Skipping quality gates to "move fast" (violates Quality Management)
- ❌ Not documenting how things went (violates Learn from Experience)
- ❌ Self-approving production changes (violates Defined Roles / People theme)
- ❌ Creating 100-page PIDs for small features (violates Tailoring to Environment)
- ❌ Ignoring technical debt and non-functional requirements (violates Quality theme scope)

---
---

## Benefits Realization Management

PRINCE2 requires tracking not just delivery success but **whether the project actually delivers value**.

### Benefits Tracking Flow
```
Baseline → Measure → Compare → Act → Report
```

### Key Practices
1. **Define benefits upfront** — tie each deliverable to measurable outcomes (ROI, user satisfaction, performance improvement)
2. **Measure post-delivery** — don't assume benefits are realized just because deliverables shipped
3. **Track leading indicators** — usage metrics, adoption rates, error rates as proxies for benefit realization
4. **Close the loop** — feed actual benefits vs forecast back into the Business Case theme
5. **Document in DEBRIEF** — final review includes benefits realization status, not just delivery status

### AI Agent Integration
- Tag deliverables with expected benefit metrics in product descriptions
- Set up monitoring for post-deployment metrics
- Generate benefits realization reports at stage boundaries
- Include benefits status in highlight reports: `Benefits: 🟢 on track / 🟡 partial / 🔴 missed`

### Example Benefits Register
| Benefit | Metric | Baseline | Target | Actual | Status |
|---------|--------|----------|--------|--------|--------|
| Faster auth | Login time (p95) | 2.1s | <500ms | 480ms | 🟢 |
| Reduced tickets | Support volume | 50/day | <20/day | 18/day | 🟢 |
| Better UX | Task completion rate | 65% | >85% | 72% | 🟡 |

## Honcho Memory Integration

Honcho (honcho.app) provides persistent memory scoped by `app_id`, `user_id`, and `session_id`.
When running in multi-context environments (multiple projects, profiles, sessions):

### Scoping Rules
- Use `app_id` per project — isolates memories to prevent cross-project leakage
- Tag memories with metadata: `{project: "x", context: "planning", status: "active"}`
- Query with semantic search + metadata filter for precise retrieval

### Memory Lifecycle
1. **At project start**: Save mandate, PBS, tolerances as `context:persistent` memories
2. **During execution**: Log exceptions, quality register updates, progress snapshots
3. **At stage boundary**: Archive stage report, update running memory with new baseline
4. **At close**: Final debrief → tagged memory with `status:archived` for future retrieval

### Conflict Prevention
- Honcho is append-first — use `memory_id` for explicit updates, never blind overwrites
- Deduplicate: semantic similarity > 0.85 triggers merge/skip
- Tag cross-session memories with `context:global` for persistence beyond session lifetime
