#!/usr/bin/env python3
"""
Standardise bpvsbuckler archive filenames to the strict schema:

    YYYY-MM-DD_category-subcategory_bpvsbuckler__language_v0-0-1.ext

Where:
  - YYYY-MM-DD  = date extracted from file content (not filename)
  - category    = source category (e.g. consortium)
  - subcategory = topic (e.g. legal, newspaper, foi, formal_notice, …)
  - bpvsbuckler = fixed case identifier
  - language    = en or cy
  - v0-0-1      = fixed version
  - .ext        = original file extension

Date extraction priority:
  1. .txt files: parse Date: header from email content
  2. .pdf files: extract date from PDF metadata, or text content
  3. Images: find date patterns in OCR text, or fall back to filename date
  4. Fallback: use YYYY-MM-DD prefix from current filename

Usage:
  python3 scripts/standardise_filenames.py               # dry-run
  python3 scripts/standardise_filenames.py --execute      # actually rename
"""

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# ── Library availability ──────────────────────────────────────────────

HAS_PDF = False
HAS_OCR = False
HAS_DOCX = False

try:
    import fitz
    HAS_PDF = True
except ImportError:
    pass

try:
    import pytesseract
    from PIL import Image
    HAS_OCR = True
except ImportError:
    pass

try:
    import docx
    HAS_DOCX = True
except ImportError:
    pass

# Check antiword for legacy .doc files
HAS_DOC = False
try:
    import subprocess
    if subprocess.run(["which", "antiword"], capture_output=True).returncode == 0:
        HAS_DOC = True
except Exception:
    pass

# ── Paths ──────────────────────────────────────────────────────────────

ARCHIVE_DIR = Path("/home/unclehowell/datro/static/archives")
CACHE_DIR = Path("/tmp/opencode/vet_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

SUBDIRS = ["txt", "pdf", "image", "other"]

# ── Category ───────────────────────────────────────────────────────────
# All current bpvsbuckler files belong to the consortium category.

CATEGORY = "consortium"

# ── Subcategory rules ──────────────────────────────────────────────────
# Each rule: (compiled regex, subcategory_name)
# Rules are checked in order; the FIRST match wins.
# Order matters: more specific patterns come before generic fallbacks.

SUBCATEGORY_RULES = [
    # --- Specific legal / procedural categories ---
    (re.compile(r'(?i)formal_notice'),                        "formal_notice"),
    (re.compile(r'(?i)\bfoi\b|freedom_of_information'),       "foi"),
    (re.compile(r'(?i)whistleblower|whistleblow'),            "whistleblower"),
    # --- Media ---
    (re.compile(r'(?i)newspaper'),                            "newspaper"),
    # --- Land registry ---
    (re.compile(r'(?i)land_registry|(?<![a-z])title_|mdr_entries'), "land_registry"),
    # --- Public records ---
    (re.compile(r'(?i)\bdeath\b|burial|census|probate|coroner'), "public_record"),
    # --- Welsh petitions / legal requests ---
    (re.compile(r'(?i)cais_am_ddeiseb|ymchwiliad_cyhoeddus'), "petition"),
    (re.compile(r'(?i)cais_am_gyngor_cyfreithiol|cyngor_cyfreithiol'), "legal_request"),
    # --- Order forms ---
    (re.compile(r'(?i)les08_order_form|les16_price_list'),    "order_form"),
    # --- Evidence (fallback for case-specific content) ---
    (re.compile(r'(?i)resolution_of_historical'),             "evidence"),
    (re.compile(r'(?i)title_fraud|procedural_concealment'),   "evidence"),
    (re.compile(r'(?i)great_house_farm|bp_vs_buckler'),      "evidence"),
]

# Directory-based subcategory fallback (used when filename patterns don't match)
DIR_SUBCATEGORY = {
    "txt":   "correspondence",
    "pdf":   "evidence",
    "image": "evidence",
    "other": "evidence",
}

# Content-based subcategory detection (scored keywords, used when filename
# gives no match and directory fallback is too generic).
CONTENT_SUBCATEGORY_PATTERNS = {
    "foi":             [r'(?i)freedom of information', r'(?i)\bfoi\b(?!\w)',
                        r'(?i)information request', r'(?i)foi request',
                        r'(?i)under the freedom of information act'],
    "formal_notice":   [r'(?i)formal notice', r'(?i)formal allegation',
                        r'(?i)formal report of'],
    "whistleblower":   [r'(?i)whistleblower', r'(?i)whistleblow'],
    "petition":        [r'(?i)cais am ddeiseb', r'(?i)ymchwiliad cyhoeddus',
                        r'(?i)deiseb'],
    "legal_request":   [r'(?i)cais am gyngor', r'(?i)cyngor cyfreithiol'],
    "land_registry":   [r'(?i)land register', r'(?i)title register',
                        r'(?i)land registry', r'(?i)hm land registry',
                        r'(?i)title number'],
    "public_record":   [r'(?i)death certificate', r'(?i)burial',
                        r'(?i)census', r'(?i)probate', r'(?i)coroner'],
    "newspaper":       [r'(?i)newspaper', r'(?i)daily mail', r'(?i)the guardian',
                        r'(?i)wales online', r'(?i)bbc news'],
    "order_form":      [r'(?i)order form', r'(?i)price list',
                        r'(?i)les08', r'(?i)les16'],
    "evidence":        [r'(?i)great house farm', r'(?i)bp vs buckler',
                        r'(?i)bp properties.*buckler', r'(?i)adverse possession',
                        r'(?i)title fraud', r'(?i)dispossession',
                        r'(?i)llandough', r'(?i)ty mawr', r'(?i)marconi'],
    "correspondence":  [r'(?i)dear\s+(?:sir|madam|mr|mrs|ms|dr)',
                        r'(?i)yours?\s+(?:sincerely|faithfully)',
                        r'(?i)from:\s+\S+@'],
}

# ═══════════════════════════════════════════════════════════════════════
#  Content extraction helpers
# ═══════════════════════════════════════════════════════════════════════

def _cache_key(filepath: Path, suffix: str = "") -> str:
    stat = filepath.stat()
    raw = f"{filepath}:{stat.st_size}:{stat.st_mtime}:{suffix}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]

def _cache_get(key: str) -> str | None:
    p = CACHE_DIR / key
    return p.read_text() if p.exists() else None

def _cache_put(key: str, text: str) -> None:
    try:
        (CACHE_DIR / key).write_text(text)
    except Exception:
        pass

def extract_txt(filepath: Path) -> str:
    try:
        return filepath.read_text(errors="replace")
    except Exception:
        return ""

def extract_docx(filepath: Path) -> str:
    if not HAS_DOCX:
        return ""
    try:
        d = docx.Document(str(filepath))
        return "\n".join(p.text for p in d.paragraphs)
    except Exception:
        return ""

def extract_doc(filepath: Path) -> str:
    """Extract text from legacy .doc via antiword."""
    if not HAS_DOC:
        return ""
    try:
        r = subprocess.run(
            ["antiword", str(filepath)],
            capture_output=True, text=True, timeout=15,
        )
        if r.returncode == 0:
            return r.stdout
    except Exception:
        pass
    return ""

def extract_pdf_text(filepath: Path) -> str:
    if not HAS_PDF:
        return ""
    try:
        doc = fitz.open(str(filepath))
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception:
        return ""

def ocr_image(filepath: Path, timeout: int = 30) -> str:
    if not HAS_OCR:
        return ""
    ck = _cache_key(filepath, "_ocr")
    cached = _cache_get(ck)
    if cached is not None:
        return cached
    try:
        img = Image.open(str(filepath))
        w, h = img.size
        if w * h > 4000 * 3000:
            img.thumbnail((2000, 2000), Image.LANCZOS)
        text = pytesseract.image_to_string(img, lang="eng+cym", timeout=timeout)
        _cache_put(ck, text)
        return text
    except Exception:
        return ""

def ocr_pdf_pages(filepath: Path) -> str:
    """OCR each page of a scanned PDF."""
    if not HAS_PDF or not HAS_OCR:
        return ""
    ck = _cache_key(filepath, "_pdfocr")
    cached = _cache_get(ck)
    if cached is not None:
        return cached
    try:
        doc = fitz.open(str(filepath))
        texts = []
        for page in doc:
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            tmp.write(img_data)
            tmp_path = tmp.name
            tmp.close()
            try:
                t = pytesseract.image_to_string(
                    Image.open(tmp_path), lang="eng+cym", timeout=15
                )
                texts.append(t)
            except Exception:
                texts.append("")
            finally:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass
        doc.close()
        result = "\n".join(texts)
        _cache_put(ck, result)
        return result
    except Exception:
        return ""

def extract_content(filepath: Path) -> str:
    """Extract all readable text from a file using the best available method.

    For images and scanned PDFs, only returns cached OCR text (avoids running
    expensive OCR operations, since filename-based fallbacks are sufficient
    for date and subcategory determination).
    """
    ext = filepath.suffix.lower()

    if ext == ".txt":
        return extract_txt(filepath)
    elif ext == ".docx":
        return extract_docx(filepath)
    elif ext == ".doc":
        return extract_doc(filepath)
    elif ext == ".pdf":
        text = extract_pdf_text(filepath)
        if not text.strip():
            # Only use cached OCR for scanned PDFs – avoids slow re-OCR
            ck = _cache_key(filepath, "_pdfocr")
            cached = _cache_get(ck)
            if cached is not None:
                text = cached
        return text
    elif ext in (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp"):
        # Only return cached OCR – avoids running expensive tesseract
        ck = _cache_key(filepath, "_ocr")
        cached = _cache_get(ck)
        return cached if cached is not None else ""
    else:
        # Try reading as text for unknown types
        try:
            return filepath.read_text(errors="replace")
        except Exception:
            return ""

# ═══════════════════════════════════════════════════════════════════════
#  Date extraction
# ═══════════════════════════════════════════════════════════════════════

# Regex for email Date: header
_EMAIL_DATE_RE = re.compile(r'^Date:\s*(.+)$', re.MULTILINE)

# Date formats to try for email headers (most specific first)
_EMAIL_DATE_FORMATS = [
    '%a, %d %b %Y %H:%M:%S %z',
    '%a, %d %b %Y %H:%M:%S %Z',
    '%d %b %Y %H:%M:%S %z',
    '%d %b %Y %H:%M:%S %Z',
    '%a, %d %b %Y',
    '%d %b %Y',
]

# Patterns for finding dates in general text (e.g. PDFs, OCR)
_TEXT_DATE_PATTERNS = [
    # ISO date YYYY-MM-DD
    (r'\b(\d{4})-(\d{2})-(\d{2})\b', None),
    # DD Mon YYYY
    (r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b',
     '%d %b %Y'),
    # Mon DD, YYYY
    (r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b',
     '%b %d %Y'),
]

_MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
}

def _parse_email_date(text: str) -> str | None:
    """Parse Date: header from email content. Returns YYYY-MM-DD or None."""
    m = _EMAIL_DATE_RE.search(text)
    if not m:
        return None
    date_str = m.group(1).strip()
    for fmt in _EMAIL_DATE_FORMATS:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

def _find_date_in_text(text: str) -> str | None:
    """Search for a date string in arbitrary text. Returns YYYY-MM-DD or None."""
    for pattern, fmt in _TEXT_DATE_PATTERNS:
        for m in re.finditer(pattern, text):
            if fmt is None:
                # Direct ISO date capture
                return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
            try:
                dt = datetime.strptime(m.group(0), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                # Try flexible month-name parsing
                try:
                    parts = m.groups()
                    if len(parts) == 3:
                        if parts[0].isdigit():
                            day, mon, year = int(parts[0]), parts[1][:3].lower(), int(parts[2])
                        else:
                            mon, day, year = parts[0][:3].lower(), int(parts[1]), int(parts[2])
                        if 1 <= day <= 31 and mon in _MONTH_MAP and 1900 <= year <= 2100:
                            return f"{year:04d}-{_MONTH_MAP[mon]:02d}-{day:02d}"
                except Exception:
                    continue
    return None

def _extract_pdf_metadata_date(filepath: Path) -> str | None:
    """Extract date from PDF document metadata."""
    if not HAS_PDF:
        return None
    try:
        doc = fitz.open(str(filepath))
        meta = doc.metadata
        doc.close()
        for key in ('creationDate', 'modDate'):
            val = meta.get(key, "")
            # PDF date format: D:YYYYMMDDHHMMSS+HH'MM'
            m = re.match(r'D:(\d{4})(\d{2})(\d{2})', val)
            if m:
                return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    except Exception:
        pass
    return None

def _extract_date_from_filename(filename: str) -> str | None:
    """Extract the YYYY-MM-DD prefix from the current filename."""
    m = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
    return m.group(1) if m else None

def get_date(filepath: Path, content: str = "") -> str:
    """Determine the best date for a file following priority rules.

    Priority:
      1. .txt: Date: header
      2. .pdf: metadata, then text content
      3. Images: OCR text, then filename
      4. Other: try content date, then filename
      5. Fallback: filename date prefix
    """
    name = filepath.name
    ext = filepath.suffix.lower()

    # Priority 1: .txt -> Date: header
    if ext == ".txt":
        if not content:
            content = extract_txt(filepath)
        d = _parse_email_date(content)
        if d:
            return d

    # Priority 2: .pdf -> metadata, then text
    if ext == ".pdf":
        d = _extract_pdf_metadata_date(filepath)
        if d:
            return d
        # content was already extracted via extract_content (includes cached OCR)
        d = _find_date_in_text(content) if content else None
        if d:
            return d

    # Priority 3: Images -> OCR text (only if already cached)
    if ext in (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp"):
        # content was already extracted via extract_content (cached OCR only)
        d = _find_date_in_text(content) if content else None
        if d:
            return d

    # Priority 4: Other content types
    if ext in (".docx", ".doc"):
        if not content:
            content = extract_content(filepath)
        d = _find_date_in_text(content)
        if d:
            return d

    # Fallback: filename date prefix
    d = _extract_date_from_filename(name)
    if d:
        return d

    return "0000-00-00"

# ═══════════════════════════════════════════════════════════════════════
#  Subcategory determination
# ═══════════════════════════════════════════════════════════════════════

def determine_subcategory(filepath: Path, content: str = "") -> str:
    """Determine the best subcategory for a file.

    Priority:
      1. Filename pattern match (first matching rule wins)
      2. Content keyword scoring (if no filename match)
      3. Directory-based fallback
      4. Ultimate fallback: 'evidence'
    """
    name = filepath.name
    subdir = filepath.parent.name

    # Priority 1: Check filename against explicit patterns
    for pattern, subcat in SUBCATEGORY_RULES:
        if pattern.search(name):
            return subcat

    # Priority 2: Content-based scoring (override directory default)
    if content:
        scores: dict[str, int] = {}
        for subcat, patterns in CONTENT_SUBCATEGORY_PATTERNS.items():
            score = 0
            for pat in patterns:
                score += len(re.findall(pat, content))
            if score > 0:
                scores[subcat] = score
        if scores:
            return max(scores, key=scores.get)

    # Priority 3: Directory-based fallback
    if subdir in DIR_SUBCATEGORY:
        return DIR_SUBCATEGORY[subdir]

    return "evidence"

# ═══════════════════════════════════════════════════════════════════════
#  Language detection
# ═══════════════════════════════════════════════════════════════════════

def detect_language(filename: str) -> str:
    """Detect language code from the current filename."""
    # Check for Welsh language marker
    if re.search(r'_cy_v0-0-1|_cy_v\d', filename):
        return "cy"
    return "en"

# ═══════════════════════════════════════════════════════════════════════
#  Core renaming logic
# ═══════════════════════════════════════════════════════════════════════

def build_new_name(filepath: Path, content: str = "") -> str:
    """Build the new standardized filename for *filepath*."""
    name = filepath.name
    ext = filepath.suffix.lower()

    date = get_date(filepath, content)
    subcat = determine_subcategory(filepath, content)
    lang = detect_language(name)

    return f"{date}_{CATEGORY}-{subcat}_bpvsbuckler__{lang}_v0-0-1{ext}"

def is_already_correct(filepath: Path, new_name: str) -> bool:
    """Return True if *filepath* already conforms to the target schema."""
    return filepath.name == new_name

# ═══════════════════════════════════════════════════════════════════════
#  File discovery
# ═══════════════════════════════════════════════════════════════════════

def collect_files() -> list[Path]:
    """Collect all bpvsbuckler files from archive subdirectories."""
    files: list[Path] = []
    for subdir in SUBDIRS:
        d = ARCHIVE_DIR / subdir
        if d.exists():
            for f in sorted(d.iterdir()):
                if f.is_file() and "bpvsbuckler" in f.name.lower():
                    # Skip dotfiles / internal files
                    if f.name.startswith("_") or f.name in ("index.html",):
                        continue
                    files.append(f)
    return files

# ═══════════════════════════════════════════════════════════════════════
#  Treeview JSON handling
# ═══════════════════════════════════════════════════════════════════════

def load_treeviews() -> dict[str, list]:
    """Load all subdirectory _treeview.json files.

    Returns dict mapping subdir name -> list of entries.
    """
    treeviews: dict[str, list] = {}
    for subdir in SUBDIRS:
        tv_path = ARCHIVE_DIR / subdir / "_treeview.json"
        if tv_path.exists():
            try:
                data = json.loads(tv_path.read_text(encoding="utf-8"))
                treeviews[subdir] = data if isinstance(data, list) else []
            except (json.JSONDecodeError, Exception):
                treeviews[subdir] = []
    return treeviews

def update_treeviews(
    renamed: list[tuple[Path, str]],
) -> int:
    """Update _treeview.json files after renaming.

    For each renamed file (old_path -> new_name), update the corresponding
    treeview entry's *path* and *_links.html* fields to point to the new name.

    Returns the number of treeview entries updated.
    """
    # Build lookup: (subdir, old_name) -> new_name
    rename_map: dict[tuple[str, str], str] = {}
    for old_path, new_name in renamed:
        rename_map[(old_path.parent.name, old_path.name)] = new_name

    treeviews = load_treeviews()
    total_updates = 0

    for subdir, entries in treeviews.items():
        updated: list = []
        changed = 0
        for entry in entries:
            if not isinstance(entry, dict):
                updated.append(entry)
                continue
            path = entry.get("path", "")
            key = (subdir, path)
            if key in rename_map:
                new_name = rename_map[key]
                entry["path"] = new_name
                if "_links" in entry and isinstance(entry["_links"], dict):
                    entry["_links"]["html"] = new_name
                changed += 1
            updated.append(entry)

        if changed > 0:
            tv_path = ARCHIVE_DIR / subdir / "_treeview.json"
            with open(tv_path, "w", encoding="utf-8") as f:
                json.dump(updated, f, indent=2, ensure_ascii=False)
                f.write("\n")
            total_updates += changed

    return total_updates

# ═══════════════════════════════════════════════════════════════════════
#  Duplicate handling
# ═══════════════════════════════════════════════════════════════════════

def _disambiguate(
    candidates: list[tuple[Path, str, str]],
) -> list[tuple[Path, str]]:
    """Resolve duplicate new-names by appending _001, _002 etc.

    *candidates* is a list of (filepath, new_name, base_without_suffix).  We
    group by final new_name and append counters where needed.

    Returns list of (filepath, final_new_name).
    """
    # First pass – detect collisions
    name_counts: dict[str, int] = {}
    for _, new_name, _ in candidates:
        name_counts[new_name] = name_counts.get(new_name, 0) + 1

    result: list[tuple[Path, str]] = []
    counters: dict[str, int] = {}

    for filepath, new_name, base in candidates:
        if name_counts.get(new_name, 0) == 1:
            # No collision – use as-is
            result.append((filepath, new_name))
        else:
            c = counters.get(new_name, 0)
            counters[new_name] = c + 1
            if c == 0:
                # First occurrence keeps the clean name
                result.append((filepath, new_name))
            else:
                stem, ext = os.path.splitext(new_name)
                disambig = f"{stem}_{c:03d}{ext}"
                result.append((filepath, disambig))

    return result

# ═══════════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Standardise bpvsbuckler archive filenames",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually rename files (default: dry-run only)",
    )
    args = parser.parse_args()

    really_rename = args.execute

    print("=" * 72)
    print("  STANDARDISE BPVSBUCKLER ARCHIVE FILENAMES")
    print("  Schema: YYYY-MM-DD_category-subcategory_bpvsbuckler__language_v0-0-1.ext")
    print()
    print(f"  Libraries:  PDF={'yes' if HAS_PDF else 'no'},  "
          f"OCR={'yes' if HAS_OCR else 'no'},  "
          f"DOCX={'yes' if HAS_DOCX else 'no'},  "
          f"DOC={'yes' if HAS_DOC else 'no'}")
    print(f"  Mode:       {'EXECUTE' if really_rename else 'DRY RUN'}")
    print("=" * 72)

    files = collect_files()
    if not files:
        print("\n  No bpvsbuckler files found.")
        return

    print(f"\n  Found {len(files)} bpvsbuckler file(s) to process.\n")

    renamed: list[tuple[Path, str]] = []      # (old_path, new_name)
    failed: list[str] = []
    skipped = 0

    # Pre-compute content for files that need it (non-trivial extraction)
    # We process sequentially so we can log progress.
    candidates: list[tuple[Path, str, str]] = []   # (path, new_name, base_for_disambig)

    for i, filepath in enumerate(files, 1):
        name = filepath.name
        rel = filepath.relative_to(ARCHIVE_DIR)

        try:
            content = extract_content(filepath)
            new_name = build_new_name(filepath, content)

            if is_already_correct(filepath, new_name):
                print(f"  [{i:3d}/{len(files)}]  ✓  {rel}  (already correct)")
                skipped += 1
                continue

            candidates.append((filepath, new_name, new_name))

        except Exception as exc:
            print(f"  [{i:3d}/{len(files)}]  ✗  {rel}")
            print(f"       ERROR: {exc}")
            failed.append(name)

    # ── Disambiguate collisions ────────────────────────────────────
    resolved = _disambiguate(candidates)

    # ── Report ─────────────────────────────────────────────────────
    print()
    print("-" * 72)
    print("  RENAME PLAN")
    print("-" * 72)

    for filepath, final_name in resolved:
        rel = filepath.relative_to(ARCHIVE_DIR)
        if filepath.name != final_name:
            print(f"  {rel}")
            print(f"    →  {final_name}")
        else:
            print(f"  {rel}  (already correct, included for treeview update)")

    # ── Final summary ──────────────────────────────────────────────
    print()
    print("=" * 72)
    renames_to_do = sum(1 for fp, fn in resolved if fp.name != fn)
    print(f"  Files to rename:  {renames_to_do}")
    print(f"  Already correct:  {skipped}")
    print(f"  Failed:           {len(failed)}")
    if failed:
        for f in failed:
            print(f"    - {f}")

    # ── Execute ────────────────────────────────────────────────────
    if really_rename and resolved:
        print(f"\n  Renaming files ...")
        renamed_ok: list[tuple[Path, str]] = []
        for filepath, final_name in resolved:
            if filepath.name == final_name:
                continue  # skip if already correct
            new_path = filepath.parent / final_name
            try:
                filepath.rename(new_path)
                renamed_ok.append((filepath, final_name))
                print(f"    ✔  {filepath.name}")
                print(f"       → {final_name}")
            except Exception as exc:
                print(f"    ✗  {filepath.name}  RENAME FAILED: {exc}")

        # ── Update treeview JSONs ──────────────────────────────────
        if renamed_ok:
            print(f"\n  Updating _treeview.json files ...")
            tv_count = update_treeviews(renamed_ok)
            print(f"    Updated {tv_count} treeview entr(ies).")

        print(f"\n  Done. {len(renamed_ok)} file(s) renamed.")

    elif not really_rename:
        print(f"\n  Dry-run complete.  Run with --execute to apply changes.")

    print("=" * 72)

if __name__ == "__main__":
    main()
