#!/bin/bash
# FinanceCheque — Child Proxy Installer (LEGACY REDIRECT)
#
# ⚠️  DEPRECATED. All install logic now lives in `public/fcukproxy/install.sh`
# (the canonical one-line installer advertised on the website and in the README).
# This file exists only so older URLs / bookmarks that pointed at
# `public/install.sh` keep working. It is a thin redirect; do not add logic here.
#
# One-liner (canonical):
#   curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash

set -euo pipefail

REPO="unclehowell/datro"
BRANCH="financecheque"
echo "[fcukproxy] Installing via canonical installer (public/fcukproxy/install.sh)..."
curl -fsSL "https://raw.githubusercontent.com/$REPO/$BRANCH/public/fcukproxy/install.sh" | bash