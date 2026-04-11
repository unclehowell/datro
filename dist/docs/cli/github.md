# GitHub CLI

## Installation
```bash
# Install gh CLI
curl -s https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

## Authentication
```bash
gh auth login
```

## Usage
```bash
# Clone repo
gh repo clone owner/repo

# Create PR
gh pr create --title "..." --body "..."

# Check status
gh status
```

## OAuth Flow for Integrations
When connecting GitHub as an integration:
1. OAuth callback stores token in integrations.json
2. SSH keypair generated in /opt/hermes/keys/
3. Public key registered with GitHub via API

## GitHub Token
The GitHub PAT is stored in your brain's .env file: `~/brain/.env`

For CI/CD or scripts, you can also create tokens at:
https://github.com/settings/tokens

## OAuth Flow for Integrations
When connecting GitHub as an integration:
1. OAuth callback stores token in integrations.json
2. SSH keypair generated in /opt/hermes/keys/
3. Public key registered with GitHub via API

## References
- Token: ~/brain/.env (GITHUB_TOKEN)
- Integration config: /opt/hermes/config/integrations.json (on AWS)
- SSH keys: /opt/hermes/keys/ (on AWS server)
