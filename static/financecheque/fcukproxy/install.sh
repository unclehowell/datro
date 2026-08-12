#!/usr/bin/env bash
# FinanceCheque Child Proxy — One-line Installer
# Served at: https://www.financecheque.uk/fcukproxy/install.sh
# Source:    https://github.com/unclehowell/datro/blob/financecheque/public/install.sh
#
# Usage:
#   curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
#
# This script is a thin redirect. All install logic lives in public/install.sh
# which is fetched and executed directly so the user always gets the latest.

set -e
INSTALLER="https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/install.sh"
echo "[fcukproxy] Fetching installer from GitHub..."
curl -fsSL "$INSTALLER" | bash
