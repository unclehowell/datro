# cnei — Quick Start & Safe Usage

## What is cnei?
cnei is the meta-branch of datro. It runs the **Flywheel Worker** (auto-improvement engine) and the **dashboard** (web GUI at port 3000). Wing files in `static/cnei/` define how the AI should behave for this branch.

## Quick Start
1. **Start the dashboard:** `node static/cnei/dashboard/server.js`
2. **Open the UI:** Navigate to `http://localhost:3000`
3. **View wing files:** The branch tree panel shows all 16 wing files (4 types × 4 sides)
4. **Steer the flywheel:** Use the 2D pad — drag bias left/right, risk up/down
5. **Edit a wing:** Click any file in the tree, make changes, save

## Safe Features (Low Risk)
- **Viewing wing files** — read-only, no side effects
- **Editing low-risk TASKS** — adding completion checks, fixing typos
- **Adjusting bias/risk** — values between -0.3 and +0.3 are safe
- **Browsing MEMORY.md** — historical cycle log, read-only

## File Structure
```
static/cnei/
  SPEC.{side}.md    — Technical specification
  AGENT.{side}.md   — AI behavior profile
  TASKS.{side}.md   — Task checklists
  README.{side}.md  — Public-facing docs
  MEMORY.md         — Flywheel cycle history
  dashboard/        — Local web GUI
```

## Tips
- Start with Low wing edits to get comfortable
- Use the Right wing for conservative validation
- Never edit `SPEC.high.md` or `AGENT.high.md` until you understand the risks
- The flywheel runs automatically every 30 min — no manual trigger needed
