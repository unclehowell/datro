# Stripe API Key Reference

This document references the Stripe API key stored securely in the system.

## Location

The Stripe live API key is stored in:
- **Location**: `~/.hermes/.env`
- **Protection**: File is gitignored and has 600 permissions

## Usage in Hermes

The key is available as environment variable:
```bash
$STRIPE_SECRET_KEY
```

Use it in scripts:
```python
import os
stripe_key = os.getenv('STRIPE_SECRET_KEY')
```

## Security

- ✅ Stored in .env (not committed to git)
- ✅ File permissions: 600 (read/write only by owner)
- ✅ .gitignore protects .env files
- ✅ Key never appears in logs or repos

## Rotation

If you need to rotate this key:
1. Update in `~/.hermes/.env`
2. Update reference if key ID changes
3. Restart Hermes to load new key

Last updated: 2026-04-09
