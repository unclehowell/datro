# DATRO Agent Interaction Library

**Purpose:** Agent-readable document library for project management, change requests, and interaction logging where agents act as Prince2 project managers and the user is the client.

---

## Architecture Overview

```
library/
├── .agent/                    # Agent API & tools
│   ├── api/                   # REST endpoints for agents
│   ├── tokens/                # API key management
│   ├── webhooks/              # Event triggers
│   └── schema/                # JSON schemas for interactions
├── projects/                  # Active projects
├── change_requests/           # Change requests queue
├── interactions/               # Agent ↔ client logs
└── index.html                 # Human UI entry point
```

---

## Agent Access Methods

### 1. REST API
```
GET    /.agent/api/projects           # List projects
POST   /.agent/api/projects           # Create project
GET    /.agent/api/projects/{id}     # Get project details
POST   /.agent/api/change_requests   # Submit change request
GET    /.agent/api/interactions      # Query interaction history
```

### 2. CLI Tools
```bash
# List active projects
agent-cli projects list

# Create new project
agent-cli project create --name "New Project" --client "unclehowell"

# Submit change request
agent-cli change request --project {id} --description "..."

# Log interaction
agent-cli log --type meeting --notes "..."
```

### 3. WebSocket (Real-time)
```
ws://hostname/.agent/ws
```

---

## JSON Schemas

### Project Schema
```json
{
  "id": "uuid",
  "name": "string",
  "client": "unclehowell",
  "agent_manager": "agent-id",
  "status": "planning|active|completed|on_hold",
  "stage": "initiation|definition|implementation|closing",
  "created": "ISO8601",
  "deliverables": []
}
```

### Change Request Schema
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "client": "unclehowell",
  "type": "enhancement|bug_fix|new_feature",
  "description": "string",
  "priority": "low|medium|high|critical",
  "status": "pending|approved|rejected|in_progress",
  "requested": "ISO8601",
  "resolved": "ISO8601|null"
}
```

### Interaction Log Schema
```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "type": "meeting|change_request|update|escalation",
  "agent": "agent-id",
  "client": "unclehowell",
  "project_id": "uuid|null",
  "notes": "markdown",
  "actions": [
    {"owner": "agent-id", "description": "...", "due": "ISO8601"}
  ]
}
```

---

## Agent Authentication

### API Keys
- **Location:** `.agent/tokens/`
- **Format:** `agent-name.token` (file with secret)
- **Rate limiting:** Per-token limits in `limits.json`

### Usage
```bash
# Include in request header
Authorization: Bearer <token>

# Or as query param
GET /.agent/api/projects?token=<token>
```

---

## Webhook Events

### Available Events
- `project.created`
- `project.stage_changed`
- `change_request.created`
- `change_request.approved`
- `change_request.rejected`
- `interaction.logged`

### Webhook Config (`.agent/webhooks/config.json`)
```json
{
  "webhooks": [
    {"url": "https://agent-endpoint/on_event", "events": ["change_request.approved"]}
  ]
}
```

---

## Prince2 Project Stages

| Stage | Description |
|-------|-------------|
| **Initiation** | Project definition, objectives, business case |
| **Definition** | Detailed planning, deliverables, resources |
| **Implementation** | Execution, monitoring, change control |
| **Closing** | Handover, evaluation, benefits realized |

---

## Usage Examples

### Agent Creates Project
```bash
curl -X POST https://library/.agent/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Website Redesign", "client": "unclehowell"}'
```

### Agent Logs Interaction
```bash
curl -X POST https://library/.agent/api/interactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "meeting",
    "project_id": "project-uuid",
    "notes": "Discussed new dashboard features",
    "actions": [
      {"owner": "agent", "description": "Create mockups", "due": "2026-04-15"}
    ]
  }'
```

### Client (Human) Views Projects
```
Visit: https://datro.xyz/static/library/consortium_projects/
```

---

## For Developers

### Register New Agent
1. Create token file: `echo "secret" > .agent/tokens/{agent-name}.token`
2. Add to allowed list in `config.json`
3. Agent can now use API

### Add Custom Webhook
1. Edit `.agent/webhooks/config.json`
2. Add endpoint URL and events
3. Webhook fires on those events

---

*Last Updated: 2026-04-13*
*This library supports both human UI access and programmatic agent API access.*