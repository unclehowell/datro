# Hermes Integration Config

## AWS Server
- **IP**: 13.135.142.244
- **SSH Key**: ~/.ssh/paperclip-hermes-nvidia-key.pem

## Files on AWS Server
- Config: `/opt/hermes/config/integrations.json`
- SSH keys: `/opt/hermes/keys/`
- Startup: `/opt/hermes/start.sh`
- OAuth server: `/var/www/html/oauth/server.js` (port 3300)

## Integrations JSON Structure
```json
{
  "email": {
    "connected": false,
    "provider": null,
    "access_token": null,
    "refresh_token": null,
    "expires_at": null
  },
  "cloudflare": {
    "connected": false,
    "account_id": null,
    "access_token": null,
    "expires_at": null
  },
  "mailchimp": {
    "connected": false,
    "dc": null,
    "api_key": null,
    "server_prefix": null
  },
  "github": {
    "connected": false,
    "username": null,
    "access_token": null,
    "ssh_key_fingerprint": null,
    "ssh_private_key_path": null
  }
}
```

## OAuth Endpoints
On your server (port 3300):
- `GET /oauth/connect/<provider>` - Start OAuth flow
- `GET /oauth/callback/<provider>?code=<code>` - Handle callback

## Providers
1. **Email (Google)** - Gmail read/send permissions
2. **Cloudflare** - DNS management
3. **Mailchimp** - Email marketing
4. **GitHub** - Repo access + SSH key registration

## GitHub SSH Key Flow
When GitHub is connected:
1. Generate ED25519 keypair in `/opt/hermes/keys/`
2. Register public key with GitHub API (POST /user/keys)
3. Store private key path in integrations.json
4. Hermes uses this key for GitHub operations

## Environment Variables Required
Set these on YOUR server for OAuth to work (stored locally on server, NOT in brain):
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- CLOUDFLARE_CLIENT_ID, CLOUDFLARE_CLIENT_SECRET
- MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

## References
- SSH to server: ssh -i ~/.ssh/paperclip-hermes-nvidia-key.pem ubuntu@13.135.142.244
- Config: /opt/hermes/config/integrations.json
- Keys: /opt/hermes/keys/
- OAuth: /var/www/html/oauth/server.js
