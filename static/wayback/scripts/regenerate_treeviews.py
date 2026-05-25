#!/usr/bin/env python3
"""
Regenerate _treeview.json files in static/archives/ subdirectories.

For each subdirectory (txt, image, pdf, other, video, html, script):
  1. Read the existing _treeview.json
  2. For each entry, check if the file at 'path' still exists
  3. Remove entries for files that no longer exist
  4. Write the updated treeview back

For the root static/archives/_treeview.json:
  Regenerate from scratch by scanning all subdirectory treeviews.
"""

import json
import os
import sys
from pathlib import Path

ARCHIVES_DIR = Path(__file__).resolve().parent.parent / "static" / "archives"
SUBDIRS = ["txt", "image", "pdf", "other", "video", "html", "script"]

# Entries with these path values are structural/navigation placeholders to keep.
PLACEHOLDER_PATHS = {"javascript:void(0)"}

def clean_subdir_treeview(subdir: str) -> list:
    """Clean a subdirectory's _treeview.json, returning filtered entries."""
    treeview_path = ARCHIVES_DIR / subdir / "_treeview.json"

    if not treeview_path.exists():
        print(f"  [SKIP] {subdir}/_treeview.json does not exist")
        return []

    with open(treeview_path, "r", encoding="utf-8") as f:
        try:
            entries = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  [ERROR] {subdir}/_treeview.json: invalid JSON - {e}")
            return []

    if not isinstance(entries, list):
        print(f"  [ERROR] {subdir}/_treeview.json: root is not a list")
        return []

    subdir_path = ARCHIVES_DIR / subdir
    kept = []
    removed_count = 0

    for entry in entries:
        if not isinstance(entry, dict):
            kept.append(entry)
            continue

        path = entry.get("path", "")

        # Keep structural/navigation placeholders
        if path in PLACEHOLDER_PATHS:
            kept.append(entry)
            continue

        # Check if the referenced file exists
        file_path = subdir_path / path
        if file_path.exists():
            kept.append(entry)
        else:
            removed_count += 1
            print(f"  [REMOVE] {subdir}/{path}")

    # Write back if anything changed
    if removed_count > 0 or len(kept) != len(entries):
        with open(treeview_path, "w", encoding="utf-8") as f:
            json.dump(kept, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"  [UPDATE] {subdir}/_treeview.json: {len(entries)} -> {len(kept)} entries "
              f"({removed_count} removed)")
    else:
        print(f"  [OK] {subdir}/_treeview.json: {len(kept)} entries, no changes")

    return kept

def regenerate_root_treeview(subdir_entries: dict[str, list]) -> None:
    """Regenerate the root static/archives/_treeview.json from subdirectory entries."""
    root_path = ARCHIVES_DIR / "_treeview.json"

    # Build list of subdirectories that have file entries
    # (i.e. more than just placeholder entries like javascript:void(0))
    active_subdirs = []
    for subdir in SUBDIRS:
        entries = subdir_entries.get(subdir, [])
        # Count real file entries (non-placeholder)
        real_entries = [e for e in entries
                        if isinstance(e, dict) and e.get("path", "") not in PLACEHOLDER_PATHS]
        if real_entries:
            active_subdirs.append(subdir)

    # Build the navigation entries
    root_entries = []

    # Title header
    root_entries.append({
        "name": "<div class='title-line title-disable'><div class='icon f-datro'></div>File Types</div>",
        "path": "javascript:void(0)",
        "_links": {
            "html": "javascript:void(0)"
        }
    })

    # One entry per active subdirectory
    label_map = {
        "txt": "TXT's",
        "pdf": "PDF's",
        "video": "Video's",
        "image": "Image's",
        "html": "HTML's",
        "script": "Script's",
        "other": "Other",
    }

    for subdir in active_subdirs:
        label = label_map.get(subdir, subdir.capitalize())
        root_entries.append({
            "name": f"<div class='subtitle-line enable-link caps'>{label}</div>",
            "path": f"./{subdir}",
            "_links": {
                "html": f"./{subdir}"
            }
        })

    # Scroll fix footer
    root_entries.append({
        "name": "<div class='page-scroll-fix'></div>",
        "path": "javascript:void(0)",
        "_links": {
            "html": "javascript:void(0)"
        }
    })

    with open(root_path, "w", encoding="utf-8") as f:
        json.dump(root_entries, f, indent=2, ensure_ascii=False)
        f.write("\n")

    dirs_str = ", ".join(active_subdirs) if active_subdirs else "(none)"
    print(f"  [UPDATE] Root _treeview.json: {len(root_entries)} entries "
          f"(active subdirs: {dirs_str})")

def main():
    print("=" * 60)
    print("Regenerating _treeview.json files")
    print("=" * 60)

    if not ARCHIVES_DIR.exists():
        print(f"ERROR: Archives directory not found: {ARCHIVES_DIR}")
        sys.exit(1)

    print(f"\nArchives directory: {ARCHIVES_DIR}\n")

    # Phase 1: Clean each subdirectory's _treeview.json
    print("--- Phase 1: Cleaning subdirectory treeviews ---")
    subdir_entries = {}
    for subdir in SUBDIRS:
        entries = clean_subdir_treeview(subdir)
        subdir_entries[subdir] = entries

    # Phase 2: Regenerate the root _treeview.json
    print("\n--- Phase 2: Regenerating root treeview ---")
    regenerate_root_treeview(subdir_entries)

    print("\n" + "=" * 60)
    print("Done.")
    print("=" * 60)

if __name__ == "__main__":
    main()
