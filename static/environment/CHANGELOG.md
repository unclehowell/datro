# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [environment.01] - Q1/2026

### Added
Mar-25 - Initial commit: Complete Ansible playbook for laptop environment recovery including:
  - Base packages (build-essential, git, python3, nodejs, golang, cargo, rustc, docker)
  - Cinnamon desktop environment
  - NPM global packages (OpenClaw, Codex, Gemini CLI, Groq, etc.)
  - Python packages (pip)
  - Go tools (zeroclaw, ollama)
  - System configuration (fstab for SD card as home)
  - Cron jobs (health monitor, system optimizer)
  - Custom scripts (health-monitor.sh, system-optimizer.sh, etc.)
  - Application configs (Hermes, OpenClaw, Gemini)
  - Skills directory structure
