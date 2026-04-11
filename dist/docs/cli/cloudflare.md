# Cloudflare CLI

## Installation
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

## Authentication
Cloudflare credentials stored locally in `~/.cloudflared/`:
- `cert.pem` - Origin certificate (DO NOT commit to git)
- `<tunnel-id>.json` - Tunnel credentials (DO NOT commit to git)

## Tunnel Management
```bash
# Login (requires browser - runs locally on your machine)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create <name>

# List tunnels
cloudflared tunnel list

# Run tunnel (on server)
cloudflared tunnel run --url localhost:80 <tunnel-name>
```

## Tunnel Details
- **Tunnel Name**: hermes-client
- **Tunnel ID**: 0c40f457-6470-4aad-b774-58e4c2521c80
- **Zone**: financecheque.uk

## Subdomain Creation (on AWS)
```bash
sudo /usr/local/bin/create-subdomain <name>
```
This creates `<name>.financecheque.uk` pointing to the tunnel.

## Environment Variables (stored LOCALLY, NOT in brain)
- TUNNEL_ORIGIN_CERT - Path to cert.pem
- TUNNEL_SECRET - Path to tunnel credentials

## References
- Credentials: ~/.cloudflared/ (local machine)
- Tunnel credentials: /root/.cloudflared/ (on AWS server 13.135.142.244)
- Script: /usr/local/bin/create-subdomain (on AWS)
