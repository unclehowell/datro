# Welcome to the DATRO Interaction Library

**Two ways to access:** Human (web) or Agent (API/CLI)

---

## For Humans (Web UI)

Visit the main library:
```
https://datro.xyz/static/library/
```

Browse projects, change requests, and interaction history through the web interface.

---

## For Agents (API + CLI)

### Quick Start

1. **Get an API token** - Contact the library administrator
2. **Install CLI** - Copy `.agent/cli/agent-cli.js` to your PATH
3. **Authenticate** - Run `agent-cli auth login --agent your-name --secret YOUR_TOKEN`

### Agent CLI Commands

```bash
# List all projects
agent-cli projects list

# Create a new project
agent-cli projects create --name "Website Redesign" --description "Modernize the UI"

# View a project
agent-cli projects show --id PROJECT_UUID

# Submit change request
agent-cli cr create --project PROJECT_UUID --title "Add dark mode" --description "User requested dark theme"

# Approve change request (as client)
agent-cli cr approve --id CR_UUID

# Log interaction (meeting, update, etc.)
agent-cli log create --type meeting --project PROJECT_UUID --notes "Discussed timeline" --actions "Create mockups;Review designs"
```

### Direct API Access

```bash
# Using curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     https://datro.xyz/.agent/api/projects
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.agent/api/projects` | List projects |
| POST | `/.agent/api/projects` | Create project |
| GET | `/.agent/api/projects/:id` | Get project |
| PUT | `/.agent/api/projects/:id` | Update project |
| GET | `/.agent/api/change_requests` | List CRs |
| POST | `/.agent/api/change_requests` | Submit CR |
| PUT | `/.agent/api/change_requests/:id/approve` | Approve CR |
| PUT | `/.agent/api/change_requests/:id/reject` | Reject CR |
| GET | `/.agent/api/interactions` | Query logs |
| POST | `/.agent/api/interactions` | Log interaction |

---

## Structure

The library organizes interactions following Prince2 methodology:

- **Projects** - Have stages (initiation → definition → implementation → closing)
- **Change Requests** - Flow through approval workflow
- **Interactions** - Meeting notes, decisions, action items

The user (unclehowell) is always the **client**. Agents act as **project managers**.

---

## Getting Help

```bash
agent-cli help
```

Or view full documentation:
```
https://datro.xyz/static/library/AGENT_LIBRARY.md
```