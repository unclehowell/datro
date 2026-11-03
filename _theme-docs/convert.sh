#!/usr/bin/env bash
# Convert Markdown / HTML / DOCX into RST for a document (DOCS-STANDARD.md §11). Needs pandoc locally; never runs on Cloudflare.
# Usage: _theme-docs/convert.sh <input file> <collection>/<document> <N-chapter-name>
# — Sion's Tab agent
set -euo pipefail
in="$1"; doc="$2"; name="$3"
src="$doc/latest/source"
[ -d "$src" ] || { echo "no $src"; exit 1; }
case "${in##*.}" in md|markdown) from=markdown;; html|htm) from=html;; docx) from=docx;; rst) cp "$in" "$src/$name.rst"; exit 0;; *) echo "unknown type"; exit 1;; esac
pandoc -f "$from" -t rst --wrap=none --extract-media="$src/_static/images" "$in" -o "$src/$name.rst"
echo "wrote $src/$name.rst — now fix headings (= - ~ ^), add it to index.rst's toctree and run build.py --update-po $doc"
