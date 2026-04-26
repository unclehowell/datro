#!/usr/bin/env sh
# Bootstrap wrapper so users can run:
#   curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh
set -eu
curl -fsSL "https://pirateclaw.datro.xyz/pirateclaw/install.sh" | sh -s -- "$@"
