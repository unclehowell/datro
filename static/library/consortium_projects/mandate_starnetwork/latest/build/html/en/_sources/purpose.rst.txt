Purpose
=======

This document formally states the requirements, objectives, and constraints
for the StarSync Network project. It represents the authoritative statement
of what the client (DATRO Consortium) wants to achieve, why the project is
needed, and the conditions under which the work will be accepted.

The mandate serves as the foundation upon which the Brief (detailed
approach) and Plan (execution strategy) are built.

Standardised Task Documentation Protocol
==========================================

ALL future tasks assigned to any Hermes agent on the three machines
(laptop, aws-command, aws-ai) MUST follow this documentation protocol:

1. **Mandate** - What the client wants and why. The authoritative client
   requirement. This document must exist and be approved before any work
   commences.

2. **Brief** - The proposed solution approach. How the agent intends to
   satisfy the mandate requirements. Includes architecture, technical
   decisions, and work packages.

3. **Plan** - The detailed execution strategy with phases, tasks,
   timelines, resource assignments, and success criteria.

4. **PR Preview** - After writing the Mandate, Brief, and Plan documents,
   the agent commits them to a branch and creates a pull request. A preview
   URL (via Cloudflare Pages serving ``datro/static/library``) is generated
   and sent to the person or agent who gave the instruction.

5. **Client Review** - The client reviews the rendered documents at the
   preview URL or PR. Changes may be requested.

6. **Semantic Versioning** - When changes are requested:

   - Clone the current ``latest`` directory to its semver number
     (e.g., 0.0.0, 0.0.1) as a backup
   - Update ``latest`` to the next semantic version
   - Apply the requested changes
   - Note: changes cascade downward -- a mandate change requires brief and
     plan updates; a brief change requires plan updates; plan changes
     are usually isolated

7. **Approval** - Once the client confirms the documents, execution proceeds
   according to the Plan.

8. **Highlight Report** - After execution, a Highlight Report documents
   actual outcomes versus the Plan, including any deviations, issues logged,
   and lessons learned.

This standing order applies to ALL tasks, not just this project. The
documents must be placed in:
``datro/static/library/consortium_projects/{mandate,brief,plan,highlight}_<project>/``
