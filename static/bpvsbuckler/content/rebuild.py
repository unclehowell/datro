#!/usr/bin/env python3
"""
Rebuild script for bpvsbuckler.datro.xyz content.

Usage:
    python3 content/rebuild.py              # patch JS bundle from data.json
    python3 content/rebuild.py --extract    # extract current JS bundle into data.json

Edit content/data.json to update timeline entries, splash page items, or claim text,
then run this script without flags to patch the bundle.

DO NOT edit the JS bundle directly — edit data.json and run this script.
"""
import json, re, os, sys

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

def find_bundle():
    for f in os.listdir(ASSETS_DIR):
        if f.startswith('index-') and f.endswith('.js'):
            return os.path.join(ASSETS_DIR, f)
    raise FileNotFoundError(f"No index-*.js bundle found in {ASSETS_DIR}")

def extract():
    bundle_path = find_bundle()
    with open(bundle_path, 'r') as f:
        content = f.read()

    sk_start = content.find('Sk=`')
    sk_end = content.find('`,', sk_start)
    sk = content[sk_start+3:sk_end]

    f1_start = content.find('F1={splash')
    f1_end = content.find('}},_k=e=>', f1_start) + 2
    f1_raw = content[f1_start:f1_end+1]

    f4_start = content.find('F4=[{year:')
    f4_end = content.find('}],a1=[{', f4_start) + 3
    f4_raw = content[f4_start:f4_end+1]

    a1_start = content.find('a1=[{year:')
    a1_end = content.find('],ji=a1&&', a1_start) + 1
    a1_raw = content[a1_start:a1_end]

    data = {
        "version": "0.0.0.08",
        "sk": sk,
        "f1": f1_raw,
        "f4": f4_raw,
        "a1": a1_raw,
        "timeline_entries_count": a1_raw.count('year:"'),
        "last_updated": "2026-05-29",
        "notes": "Edit this file to change timeline/splash/claim content, then run content/rebuild.py to patch the JS bundle"
    }

    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Extracted {a1_raw.count('year:\"')} timeline entries from {os.path.basename(bundle_path)}")

def rebuild():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    bundle_path = find_bundle()
    with open(bundle_path, 'r') as f:
        content = f.read()

    # Patch Sk
    sk_start = content.find('Sk=`')
    sk_end = content.find('`,', sk_start)
    content = content[:sk_start+3] + data['sk'] + content[sk_end:]

    # Patch F1
    f1_start = content.find('F1={splash')
    f1_end = content.find('}},_k=e=>', f1_start) + 2
    content = content[:f1_start] + data['f1'] + content[f1_end+1:]

    # Patch F4
    f4_start = content.find('F4=[{year:')
    f4_end = content.find('}],a1=[{', f4_start) + 3
    content = content[:f4_start] + data['f4'] + content[f4_end+1:]

    # Patch a1
    a1_start = content.find('a1=[{year:')
    a1_end = content.find('],ji=a1&&', a1_start) + 1
    content = content[:a1_start] + data['a1'] + content[a1_end:]

    with open(bundle_path, 'w') as f:
        f.write(content)

    print(f"Patched {os.path.basename(bundle_path)} — {data['a1'].count('year:\"')} timeline entries")

    # Regenerate API/LLM/robots/sitemap files
    script_dir = os.path.dirname(__file__)
    print("Generating agent-friendly files...")
    ret = os.system(f'node {os.path.join(script_dir, "generate-api.js")}')
    if ret == 0:
        print("Agent files regenerated.")
    else:
        print(f"Warning: agent file generation exited with code {ret}")

if __name__ == '__main__':
    if '--extract' in sys.argv:
        extract()
    else:
        rebuild()
