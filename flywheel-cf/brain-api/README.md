# Brain API Endpoints

## Configuration
- `GET /api/brain/config/{branch}` — Get agent configuration for a branch
- `POST /api/brain/config/{branch}` — Update configuration

## Memory
- `GET /api/brain/memory/{branch}/{key}` — Retrieve specific memory
- `GET /api/brain/memory/{branch}?limit=N` — List memories
- `POST /api/brain/remember/{branch}/{key}` — Store memory
- `GET /api/brain/lessons/{branch}?limit=N` — Get learned lessons

## Agent Integration
- `GET /api/brain/agent-config/{branch}` — Get agent configuration with scaffolding
- `POST /api/brain/agent-remember` — Memory from any agent

## GraphQL Endpoint (planned)
- `POST /api/brain/graphql` — Full GraphQL API

## Usage Example

```bash
# Get configuration for cnei branch
curl https://cnei.datro.xyz/api/brain/config/cnei

# Store a memory
curl -X POST https://cnei.datro.xyz/api/brain/remember/cnei/my_key \
  -H "Content-Type: application/json" \
  -d '{"content": "learned something", "tags": ["lesson"]}'

# Retrieve memories
curl https://cnei.datro.xyz/api/brain/memory/cnei?limit=20
```

## Environment Variables (for CF Worker)
- `BRAIN_ENDPOINT` — Base URL for brain API
- `HONCHO_API_KEY` — Honcho API key
- `HONCHO_APP_NAME` — Honcho app name
- `GH_PAT` / `GITHUB_TOKEN` — GitHub access