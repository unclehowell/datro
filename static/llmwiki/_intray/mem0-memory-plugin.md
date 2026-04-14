# Mem0 Memory Provider for Hermes Agent

This plugin integrates mem0.ai with Hermes Agent as an additional memory provider.

## Configuration

Add to your Hermes config:

```yaml
memory:
  providers:
    - type: mem0
      user_id: hermes_user  # Optional: defaults to 'hermes_user'
      api_key: ${MEM0_API_KEY}  # Or hardcode (not recommended)
      base_url: https://api.mem0.ai  # Optional
```

## Environment Variables

- `MEM0_API_KEY`: Your mem0 API key

## Installation

Install the mem0 Python package:
```bash
pip install mem0ai
```

## How it works

Mem0 serves as a **complementary** memory provider alongside Honcho:
- **Honcho**: Stores structured peer observations about the user, durable facts
- **Mem0**: Provides semantic search over conversation history, recent context

Both can run simultaneously - Hermes queries all configured memory providers.
