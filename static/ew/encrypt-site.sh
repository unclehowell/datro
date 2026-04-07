#!/usr/bin/env bash
set -euo pipefail

INPUT="site.html"            # local plaintext (git-ignored)
OUTPUT="index.html"          # final file to push / host (loader + ciphertext)
NODE_SCRIPT="encrypt-site.js"

# cleanup old artifacts that may confuse you
rm -f encrypted.bin encrypted.html index.html || true

if [ ! -f "$NODE_SCRIPT" ]; then
  echo "❌ Node script not found: $NODE_SCRIPT"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "❌ Plaintext input not found: $INPUT"
  echo "Create $INPUT (your HTML) and try again."
  exit 1
fi

# prompt for passphrase silently
read -s -p "Enter passphrase to encrypt $INPUT: " PASS
echo
read -s -p "Confirm passphrase: " PASS2
echo
if [ "$PASS" != "$PASS2" ]; then
  echo "❌ Passphrases do not match. Aborting."
  exit 1
fi

# remove existing output to avoid leftover plaintext
rm -f "$OUTPUT"

# ensure node deps installed
if [ ! -d "node_modules/crypto-js" ]; then
  echo "Installing crypto-js (npm)..."
  npm install --no-audit --no-fund crypto-js >/dev/null 2>&1 || { echo "npm install failed — install manually"; exit 1; }
fi

# call node with passphrase via env (not written to shell history)
PASSPHRASE="$PASS" node "$NODE_SCRIPT" "$INPUT" "$OUTPUT"

# set safe permissions
chmod 644 "$OUTPUT" || true

# clear sensitive vars
PASS=""
PASS2=""
unset PASSPHRASE

echo "✅ Done. Open $OUTPUT in a browser to unlock with the passphrase."
