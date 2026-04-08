# Hermes Configuration Clean Up - Summary

## Changes Made

### 1. Resolved "Two Default Profiles" Confusion
- **Before**: Both `model.default` and `profiles.default` existed, causing confusion
- **After**: Renamed `profiles.default` → `profiles.primary`
  - Location: `~/.hermes/config.yaml` (now symlinked to `datro/.hermes-live/`)
  - All profiles functional and healthy

### 2. Moved .hermes into datro Repo
```bash
mv ~/.hermes ~/datro/.hermes-live
ln -sf ~/datro/.hermes-live ~/.hermes
```
Now tracked in git while maintaining symlink for Hermes compatibility.

### 3. Secured API Keys for Public Repo
- **Removed plain text secrets** from config.yaml
- **Replaced with environment variables**:
  - `HERMES_CUSTOM_KIMI-K2-THINKING_KEY`
  - `HERMES_CUSTOM_QWEN3-32B_KEY`
  - `HERMES_CUSTOM_GLM-4.7-FLASH_KEY`
  - `HERMES_CUSTOM_GEMINI-2.0-FLASH_KEY`
  - `HONCHO_API_KEY` (already env-based)
  - `NVIDIA_API_KEY` (already env-based)

### 4. Restored PR Preview Table Format
- Created: `static/projects.tsv` with all 13 projects
- PRs will now show preview links like PR #266 format

### 5. Merged/Cleaned Pull Requests
- **Merged**: #264 (static/ui), #265 (StarSync docs)
- **Closed**: #257, #259, #266 (stale auto-PRs from Feb-Apr)

## Required Environment Variables

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
# Hermes API Keys (replace with actual keys)
export HERMES_CUSTOM_KIMI-K2-THINKING_KEY="your-nvidia-or-kimi-key"
export HERMES_CUSTOM_QWEN3-32B_KEY="your-groq-key"
export HERMES_CUSTOM_GLM-4.7-FLASH_KEY="your-ollama-key"
export HERMES_CUSTOM_GEMINI-2.0-FLASH_KEY="your-gemini-key"
export NVIDIA_API_KEY="your-nvidia-key"
export HONCHO_API_KEY="your-honcho-key"
```

Then reload: `source ~/.bashrc`

## Profiles Status

All 7 profiles healthy:
- primary, fallback, maintainlaptop, microwave, nvidia, reposync, unclehowell

## Next Steps

1. Set the environment variables above
2. Test Hermes: `hermes --config ~/.hermes/config.yaml`
3. Commit changes to datro repo:
   ```bash
   cd ~/datro
   git add .hermes-live/config.yaml static/projects.tsv
   git commit -m "feat: track Hermes config with secured secrets"
   git push
   ```
