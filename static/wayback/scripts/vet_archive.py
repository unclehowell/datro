#!/usr/bin/env python3
"""
Forensic archive vetter: extracts actual document content via OCR (images),
PDF text extraction, and DOCX parsing, then scores each file on multiple
case-relevance dimensions. Only files with strong content-based evidence
signals are kept.

Usage:
  python3 scripts/vet_archive.py              # dry run
  python3 scripts/vet_archive.py --execute    # actually delete
  python3 scripts/vet_archive.py -v           # verbose (show each file)
  python3 scripts/vet_archive.py -q           # quiet (summary only)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import traceback
import hashlib
import pickle
from pathlib import Path

# ── dependencies ──────────────────────────────────────────────────────
HAS_PDF = False
HAS_OCR = False
HAS_DOCX = False
HAS_DOC = False

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

# Check for antiword (old .doc files)
if subprocess.run(["which", "antiword"], capture_output=True).returncode == 0:
    HAS_DOC = True


ARCHIVE_DIR = Path("/home/unclehowell/datro/static/archives")
REPO_DIR = Path("/home/unclehowell/datro")
CACHE_DIR = Path("/tmp/opencode/vet_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

OCR_TIMEOUT = 15       # seconds per image
PDF_PAGE_OCR_TIMEOUT = 10  # seconds per page for scanned PDF OCR

# ── CASE-SPECIFIC KEYWORDS (scored) ───────────────────────────────────
# High-weight: directly identify this specific case
DIRECT_CASE = [
    r"bp\s*vs?\s*buckler",
    r"bp\s+properties\s*(?:ltd|limited)?\s*v[\.\s]*s[\.\s]*\s*buckler",
    r"bp\s+properties\s*v\w*\s*buckler",
    r"bpvsbuckler",
    r"bp\s*vs\s*buckler\s*1987",
]

# Medium-high: case parties, locations, subject matter
CASE_ENTITIES = [
    r"great\s+house\s+farm",
    r"llandough",
    r"ty\s*mawr",
    r"marconi\s*farm",
    r"marconi",
    r"williams\s*family",
    r"church\s+view\s+close",
    r"manor\s+of\s+llandough",
    r"llandough\s+manor",
    r"sion\s+buckler",
    r"buckler\s+family",
]

# Public records (death, birth, marriage, census) — genealogical evidence
PUBLIC_RECORDS = [
    r"death[s]?\s+(?:mar|jun|sep|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)",
    r"deaths?\s+\d{4}",
    r"death\s+certificate",
    r"birth[s]?\s+(?:mar|jun|sep|dec)",
    r"marriage[s]?\s+(?:mar|jun|sep|dec)",
    r"register\s+of\s+death",
    r"certificate\s+of\s+death",
    r"coroner",
    r"burial",
    r"probate",
    r"census",
    r"electoral\s+register",
    r"land\s+register",
    r"title\s+register",
    r"conveyance",
    r"indenture",
    r"deed\s+of\s+(?:transfer|grant|sale)",
]

# Legal / procedural keywords indicating formal case evidence
LEGAL_DOC_TYPES = [
    r"freedom\s+of\s+information",
    r"foi[\s\-]",
    r"formal\s+notice",
    r"formal\s+(?:report|allegation|complaint)",
    r"court\s+(?:document|order|judgment|record)",
    r"judicial\s+review",
    r"whistleblower",
    r"affidavit",
    r"statutory\s+declaration",
    r"land\s+registry",
    r"title\s+(?:deed|register|search)",
    r"hm\s+land\s+registry",
    r"adverse\s+possession",
    r"title\s+fraud",
    r"unlawful\s+(?:dispossession|eviction)",
    r"procedural\s+concealment",
    r"dispossession",
    r"restitution",
    r"reparation",
    r"forensic\s+(?:evaluation|restitution|questions)",
    r"evidence\s*hub",
    r"systemic\s+governance",
    r"indigenous\s+dispossession",
    r"restorative\s+justice",
    r"state.sanctioned\s+(?:dispossession|erasure)",
    r"resolution\s+of\s+historical",
    r"setting\s+aside",
]

# Case reference numbers / identifiers
CASE_REFS = [
    r"wa231076",
    r"to130237",
    r"f260213",
    r"lpb\s*26\s*0781",
    r"cas[\s\-]*315609",
    r"cas[\s\-]*009700964",
    r"rc25[\s\-]*0464",
    r"hmc\s*9\s*311",
    r"edd.*wa231076",
    r"ref:\s*to130237",
    r"enquiry\s+ref.*marconi",
]

# Geographic: places in/near the case area
GEOGRAPHIC = [
    r"penarth",
    r"cardiff",
    r"vale\s+of\s+glamorgan",
    r"bro\s+morgannwg",
    r"wales",
    r"cymru",
    r"llantwit\s+major",
    r"llanfair",
    r"dinas\s+powys",
]

# Welsh language case-related terms
WELSH_CASE = [
    r"cais\s+am\s+ddeiseb",
    r"ymchwiliad\s+cyhoeddus",
    r"cyngor\s+cyfreithiol",
    r"deiseb",
    r"cyhoeddus",
]

# Newspaper / publication indicators
NEWS_INDICATORS = [
    r"newspaper",
    r"article",
    r"published",
    r"reporter",
    r"correspondent",
    r"daily\s+(?:mail|telegraph|mirror|express|post|record)",
    r"guardian",
    r"times\s+(?:newspaper|law\s+report)",
    r"bbc\s+news",
    r"wales\s+online",
    r"welsh\s+news",
]

# Passport / identity document MRZ pattern — always remove (sensitive PII)
# OCR often garbles '<' into special chars, so be flexible
PASSPORT_MRZ = re.compile(
    r"P[<\u20ac\u00ab\s]{1,3}[A-Za-z]{3}[A-Za-z<>\u20ac\u00ab\s]{10,}"
    r"[<>\u20ac\u00ab]{2,}[A-Za-z<>\u20ac\u00ab]+[0-9]{7,}",
    re.IGNORECASE,
)
# Also catch explicit passport keywords
PASSPORT_KEYWORDS = re.compile(
    r"(?:passport|british\s+citizen|brit\s*1\s*sh\w*citizen|"
    r"passport\s*no[.:]?\s*\d{7,9}|"
    r"united\s+kingdom\s+of\s+great\s+britain|"
    r"p<[a-z]{3})",
    re.IGNORECASE,
)

# Strong negative indicators (spam, social, personal)
NEGATIVE_STRONG = [
    r"linkedin",
    r"profile\s*views?",
    r"new\s+invitation",
    r"reacted\s+to\s+your",
    r"your\s+posts?\s+got\s+\d+\s+impressions",
    r"meet\s+kimberly",
    r"add\s+(?:bert\s+moortgat|samantha\s+cassells|andy\s+watterson)",
    r"portfolio\s+director",
    r"managing\s+director",
    r"creative\s+director",
    r"loan\s+(?:offer|pre.approval)",
    r"larger\s+loan",
    r"car\s+finance\s+cheque",
    r"western\s+union.*(?:cancel|refund)",
    r"voxer\s+support",
    r"akaunting\s+update",
    r"incognito.*scam",
    r"armed\s+forces\s+day.*clothing",
    r"drive\s+safer.*bank\s+holiday",
    r"time\s+for\s+an\s+upgrade",
    r"product\s+updates.*may",
    r"save\s+up\s+to.*summer\s+stays",
    r"capture\s+what\s+others\s+miss",
    r"convert\s+american\s+express",
    r"developer.*grido.*hired.*roles",
    r"going\s+live.*dubai\s+luxury",
    r"real\s+drivers.*real\s+stories",
    r"create\s+with\s+strategic\s+intent",
    r"request\s+received.*car\s+finance",
    r"recharged.*coins\s+on",
    r"update.*penarth\s+charter",
    r"you['\u2019]?re\s+now\s+a\s+member\s+of\s+(?:welsh\s+)?poli",
    r"no\s+proof.*no\s+protection",
    r"invoice.*groq",
    r"your\s+invoice\s+from",
    r"we['\u2019]?re\s+back\s+in\s+play",
    r"new\s+message\s+\d+\s+in\s+mailbox",
    r"online\s+pitching\s+session",
    r"out\s+of\s+office",
    r"auto.reply",
    r"delivery\s+(?:status|failure|notification)",
    r"undeliverable",
    r"diverst\b",
    r"song\s+lyrics",
    r"coch\s+gwyn\sa\s+gwyrdd",
    r"hey\s+kiro",
    r"satisfaction\s+survey",
    r"incognito_may",
    r"outlook[_ ]",
    r"facebook",
    r"instagram",
    r"twitter",
    r"youtube",
    r"tiktok",
    r"snapchat",
    r"pinterest",
    r"_icon_",
    r"warning.triangle",
    r"banner",
    r"32bxfcjr",
    r"voicemail",
    r"new.message.\d+.in.mailbox",
    r"msg\d{4}_wav",
    r"gw_invest",
    r"two_live_investment",
]

# Filename patterns that are always junk
EXCLUDE_FILENAME = [
    r"outlook[-_]",
    r"facebook",
    r"instagram",
    r"linkedin",
    r"twitter",
    r"youtube",
    r"tiktok",
    r"snapchat",
    r"pinterest",
    r"_icon_",
    r"_warning_triangle_",
    r"banner",
    r"32bxfcjr",
    r"image\d{3,}",
    r"new_message_\d+_in_mailbox",
    r"msg\d{4}_wav",
    r"voicemail",
    r"undeliverable",
    r"delivery_status",
    r"automatic_reply",
    r"out of office",
    r"auto_reply",
    r"gw_invest",
    r"two_live_investment",
    r"loan_offer",
    r"larger_loan",
    r"product_updates",
    r"incognito.*scam",
    r"akaunting_update",
    r"profile_views",
    r"new_invitation",
    r"reacted_to",
    r"portfolio_director",
    r"managing_director",
    r"creative_director",
    r"add_bert_moortgat",
    r"add_samantha_cassells",
    r"add_andy_watterson",
    r"meet_kimberly",
    r"drive_safer",
    r"armed_forces_day.*clothing",
    r"save_up_to.*summer_stays",
    r"capture_what_others_miss",
    r"convert_american_express",
    r"developer.*grido.*hired",
    r"going_live.*dubai_luxury",
    r"real_drivers.*real_stories",
    r"create_with_strategic_intent",
    r"car_finance_cheque",
    r"voxer_support",
    r"request_received.*car_finance",
    r"recharged.*coins_on",
    r"western_union.*cancel",
    r"time_for_an_upgrade",
    r"you_re_invited.*online_pitching",
    r"your_invoice_from",
    r"invoice.*groq",
    r"groq.*taas",
    r"update.*penarth_charter",
    r"you_re_now_a_member_of",
    r"no_proof.*no_protection",
    r"we_re_back_in_play",
    r"diverst\b",
    r"hey_kiro",
    r"coch_gwyn_a_gwyrdd",
    r"song_lyrics",
    r"satisfaction_survey",
    r"online_pitching",
    r"incognito_may",
]

SCORE_THRESHOLD = 10  # minimum total score to keep


# ── Content extraction helpers ────────────────────────────────────────

def content_cache_key(filepath: Path) -> str:
    """Generate a cache key based on file path, size, and mtime."""
    stat = filepath.stat()
    raw = f"{filepath}:{stat.st_size}:{stat.st_mtime}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def cache_get(key: str) -> str | None:
    p = CACHE_DIR / key
    if p.exists():
        try:
            return p.read_text()
        except Exception:
            return None
    return None


def cache_put(key: str, text: str):
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
    if not HAS_DOC:
        return ""
    try:
        r = subprocess.run(
            ["antiword", str(filepath)],
            capture_output=True, text=True, timeout=15
        )
        if r.returncode == 0:
            return r.stdout
    except Exception:
        pass
    return ""


def extract_pdf_text(filepath: Path) -> str:
    """Extract text from PDF using PyMuPDF."""
    if not HAS_PDF:
        return ""
    try:
        text_parts = []
        doc = fitz.open(str(filepath))
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts)
    except Exception:
        return ""


def ocr_image(filepath: Path, timeout_sec: int = OCR_TIMEOUT) -> str:
    """Run OCR on an image using Tesseract with timeout."""
    if not HAS_OCR:
        return ""
    ck = content_cache_key(filepath) + "_ocr"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    try:
        img = Image.open(str(filepath))
        # Resize very large images to speed up OCR
        w, h = img.size
        if w * h > 4000 * 3000:
            img.thumbnail((2000, 2000), Image.LANCZOS)
        text = pytesseract.image_to_string(img, lang="eng+cym", timeout=timeout_sec)
        cache_put(ck, text)
        return text
    except RuntimeError as e:
        if "timeout" in str(e).lower():
            cache_put(ck, "")
            return ""
        return ""
    except Exception:
        return ""


def ocr_pdf_page(page_img_bytes: bytes) -> str:
    """OCR a single PDF page image."""
    if not HAS_OCR:
        return ""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(page_img_bytes)
        tmp_path = tmp.name
    try:
        text = pytesseract.image_to_string(
            Image.open(tmp_path), lang="eng+cym", timeout=PDF_PAGE_OCR_TIMEOUT
        )
        return text
    except Exception:
        return ""
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def extract_content(filepath: Path) -> str:
    """Extract all readable text content from a file using the best available method."""
    ext = filepath.suffix.lower()
    name_lower = filepath.name.lower()

    # Skip obviously non-textual files
    if ext == ".wav":
        return ""
    if ext == ".bin":
        return ""
    if ext == ".mp4" or ext == ".mov" or ext == ".avi":
        return ""

    if ext == ".txt":
        return extract_txt(filepath)
    elif ext == ".docx":
        return extract_docx(filepath)
    elif ext == ".doc":
        return extract_doc(filepath)
    elif ext in (".pdf",):
        text = extract_pdf_text(filepath)
        # If PDF has no extractable text (scanned), try OCR
        if not text.strip() and HAS_OCR:
            text = ocr_pdf(filepath)
        return text
    elif ext in (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp"):
        return ocr_image(filepath)
    else:
        return ""


def ocr_pdf(filepath: Path) -> str:
    """OCR each page of a PDF (scanned document)."""
    if not HAS_PDF or not HAS_OCR:
        return ""
    ck = content_cache_key(filepath) + "_pdfocr"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    try:
        doc = fitz.open(str(filepath))
        texts = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            text = ocr_pdf_page(img_data)
            texts.append(text)
        doc.close()
        result = "\n".join(texts)
        cache_put(ck, result)
        return result
    except Exception:
        return ""


# ── Scoring engine ────────────────────────────────────────────────────

def detect_passport(text: str) -> bool:
    """Detect passport MRZ (Machine Readable Zone) data in OCR text."""
    if PASSPORT_MRZ.search(text):
        return True
    # Count passport keyword signals — need 2+ for confirmation
    matches = list(PASSPORT_KEYWORDS.finditer(text))
    return len(matches) >= 2


def score_content(text: str) -> dict:
    """Score extracted text against case-relevance dimensions.
    Returns dict with score breakdown.
    """
    if not text or not text.strip():
        return {"total": 0, "breakdown": {}, "matched_patterns": []}

    t = text.lower()
    breakdown = {}
    matched = []

    # Passport detection — flag immediately
    if detect_passport(text):
        return {
            "total": -999,
            "breakdown": {"passport": -999},
            "matched_patterns": [("passport", "MRZ detected")],
            "has_negative": True,
            "is_passport": True,
        }

    def count_matches(patterns, label, weight=10, cap=3):
        score = 0
        hits = 0
        for pat in patterns:
            found = list(re.finditer(pat, t))
            if found:
                hits += len(found)
                for m in found:
                    if len(matched) < 20:
                        matched.append((label, m.group()))
        score = min(hits * weight, cap * weight)
        if score > 0:
            breakdown[label] = score
        return score

    s = 0
    s += count_matches(DIRECT_CASE, "direct_case", weight=25, cap=4)
    s += count_matches(CASE_ENTITIES, "case_entities", weight=15, cap=4)
    s += count_matches(LEGAL_DOC_TYPES, "legal_doc_type", weight=15, cap=4)
    s += count_matches(CASE_REFS, "case_refs", weight=20, cap=3)
    s += count_matches(GEOGRAPHIC, "geographic", weight=5, cap=3)
    s += count_matches(WELSH_CASE, "welsh_case", weight=10, cap=3)
    s += count_matches(NEWS_INDICATORS, "news_indicators", weight=10, cap=3)
    s += count_matches(PUBLIC_RECORDS, "public_records", weight=10, cap=3)

    # Negative: subtract
    neg_score = 0
    for pat in NEGATIVE_STRONG:
        if re.search(pat, t):
            neg_score += 30
    if neg_score > 0:
        breakdown["negative"] = -neg_score
        s -= neg_score

    return {
        "total": max(s, 0),
        "breakdown": breakdown,
        "matched_patterns": matched[:20],
        "has_negative": neg_score > 0,
    }


def score_filename(name: str) -> int:
    """Bonus score based on filename analysis (before content extraction)."""
    n = name.lower()
    score = 0

    # Filename patterns that strongly suggest case evidence
    if re.search(r"newspaper", n):
        score += 15
    if re.search(r"bpvsbuckler|bp_vs_buckler|bp\s*vs\s*buckler", n):
        score += 10
    if re.search(r"great_house_farm|llandough|ty_mawr|marconi", n):
        score += 8
    if re.search(r"foi|formal_notice|whistleblower|court", n):
        score += 8
    if re.search(r"land_registry|title_|adverse_possession|conveyance|deed_", n):
        score += 8
    if re.search(r"death|certificate|coroner|burial|probate|census", n):
        score += 12
    if re.search(r"newspaper|article|press|news_", n):
        score += 8

    return score


def check_filename_junk(name: str) -> bool:
    n = name.lower()
    for pat in EXCLUDE_FILENAME:
        if re.search(pat, n):
            return True
    return False


# ── File-level vetting ────────────────────────────────────────────────

def vet_file(filepath: Path) -> dict:
    """Vet a single file by extracting its content and scoring it.
    Returns dict with keep, score, reason, evidence_type.
    """
    name = filepath.name
    rel = filepath.relative_to(ARCHIVE_DIR)

    # If filename matches junk patterns, reject immediately
    if check_filename_junk(name):
        return {
            "keep": False,
            "score": 0,
            "reason": "Filename matches junk patterns",
            "evidence_type": "junk",
            "content_preview": "",
            "matched_patterns": [],
        }

    # Extract content
    content = extract_content(filepath)
    content_preview = content[:300].replace("\n", " | ") if content else "(no extractable content)"
    ext = filepath.suffix.lower()

    # Score content
    result = score_content(content)
    fn_score = score_filename(name)
    total_score = result["total"] + fn_score

    # Auto-reject passport / identity documents
    if result.get("is_passport"):
        return {
            "keep": False,
            "score": -999,
            "reason": "Passport MRZ detected — sensitive PII",
            "evidence_type": "pii",
            "content_preview": content_preview,
            "matched_patterns": result.get("matched_patterns", []),
        }

    # Images with no extractable OCR text need higher filename confidence to keep
    if ext in (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".webp"):
        if not content or not content.strip():
            # No OCR text: require stronger filename evidence
            if fn_score < 15:
                return {
                    "keep": False,
                    "score": total_score,
                    "reason": f"Image with no OCR text and low filename score (fn={fn_score})",
                    "evidence_type": "no_content",
                    "content_preview": content_preview,
                    "matched_patterns": result.get("matched_patterns", []),
                }
            # If filename strongly indicates relevance but OCR failed, keep
            return {
                "keep": True,
                "score": total_score,
                "reason": f"Filename suggests relevance (fn={fn_score}), OCR gave no text",
                "evidence_type": "filename_only",
                "content_preview": content_preview,
                "matched_patterns": result.get("matched_patterns", []),
            }

    # Decision logic — negative content reduces score but doesn't auto-reject.
    # Some forwarded emails contain both case evidence and LinkedIn/social notifications.
    if total_score >= SCORE_THRESHOLD:
        # Classify evidence type
        matched_labels = {m[0] for m in result.get("matched_patterns", [])}
        if "direct_case" in matched_labels or "case_refs" in matched_labels:
            etype = "primary"
        elif "news_indicators" in matched_labels:
            etype = "news"
        else:
            etype = "correspondence"
        return {
            "keep": True,
            "score": total_score,
            "reason": f"Content score {total_score} >= threshold",
            "evidence_type": etype,
            "content_preview": content_preview,
            "matched_patterns": result.get("matched_patterns", []),
        }
    else:
        return {
            "keep": False,
            "score": total_score,
            "reason": f"Content score {total_score} < threshold ({SCORE_THRESHOLD})",
            "evidence_type": "low_score",
            "content_preview": content_preview,
            "matched_patterns": result.get("matched_patterns", []),
        }


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Forensic archive vetting with OCR and content extraction"
    )
    parser.add_argument("--execute", action="store_true", help="Actually delete files")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show file details")
    parser.add_argument("-q", "--quiet", action="store_true", help="Summary only")
    args = parser.parse_args()

    really_delete = args.execute

    print("=" * 70)
    print("FORENSIC ARCHIVE VETTING")
    print(f"  Content extraction: PDF={'yes' if HAS_PDF else 'no'}, "
          f"OCR={'yes' if HAS_OCR else 'no'}, "
          f"DOCX={'yes' if HAS_DOCX else 'no'}, "
          f"DOC={'yes' if HAS_DOC else 'no'}")
    print(f"  Mode: {'EXECUTE' if really_delete else 'DRY RUN'}")
    print(f"  Score threshold: {SCORE_THRESHOLD}")
    print("=" * 70)

    dirs_to_check = ["txt", "image", "pdf", "other", "video"]
    all_results = []
    kept = 0
    removed = 0
    non_bpv_removed = 0

    # Phase 1: Vet bpvsbuckler files with content extraction
    print("\n── Phase 1: Content-based vetting of bpvsbuckler files ──")
    for subdir in dirs_to_check:
        d = ARCHIVE_DIR / subdir
        if not d.exists():
            continue
        bpv_files = sorted(d.glob("*bpvsbuckler*"))
        if not bpv_files:
            continue
        print(f"\n  {subdir}/ ({len(bpv_files)} files)")

        for f in bpv_files:
            rel = f.relative_to(ARCHIVE_DIR)
            result = vet_file(f)
            result["file"] = str(rel)
            all_results.append(result)

            if result["keep"]:
                kept += 1
                if args.verbose:
                    print(f"  ✓ KEEP   score={result['score']:3d}  {rel}")
            else:
                removed += 1
                if args.verbose:
                    print(f"  ✗ REMOVE score={result['score']:3d}  {rel}")
                elif not args.quiet:
                    print(f"  REMOVE {rel}  ({result['reason']})")
                if really_delete:
                    f.unlink()

    # Phase 2: Remove non-bpvsbuckler files from archive dirs
    print("\n── Phase 2: Remove non-bpvsbuckler files ──")
    for subdir in dirs_to_check:
        d = ARCHIVE_DIR / subdir
        if not d.exists():
            continue
        for f in sorted(d.iterdir()):
            if f.is_dir() or f.name.startswith("_") or f.name in (
                "index.html", ".directory.json", ".document.json"
            ):
                continue
            if "bpvsbuckler" not in f.name.lower():
                rel = f.relative_to(ARCHIVE_DIR)
                if not args.quiet:
                    print(f"  REMOVE {rel} (non-bpvsbuckler)")
                if really_delete:
                    f.unlink()
                removed += 1
                non_bpv_removed += 1

    # Summary
    print(f"\n{'=' * 70}")
    print(f"  SCORING SUMMARY (kept files)")
    print(f"{'=' * 70}")

    kept_results = [r for r in all_results if r["keep"]]
    if not args.quiet and kept_results:
        # Group by evidence type
        by_type = {}
        for r in kept_results:
            by_type.setdefault(r["evidence_type"], []).append(r)
        for etype, files in sorted(by_type.items()):
            print(f"\n  [{etype.upper()}] ({len(files)} files)")
            for r in sorted(files, key=lambda x: -x["score"]):
                score_str = f"score={r['score']:3d}"
                matched = ", ".join(m[1] for m in r.get("matched_patterns", [])[:3])
                print(f"    {score_str}  {r['file']}")
                if matched:
                    print(f"            matches: {matched}")
                if r.get("content_preview"):
                    preview = r["content_preview"][:120]
                    print(f"            preview: {preview}")

    # Bar chart of scores
    if kept_results:
        scores = [r["score"] for r in kept_results]
        print(f"\n  Score distribution (kept files):")
        print(f"    Range: {min(scores)}-{max(scores)}  Median: {sorted(scores)[len(scores)//2]}")
        # Simple histogram
        buckets = {f"{i:02d}-{i+9:02d}": 0 for i in range(0, 110, 10)}
        for s in scores:
            key = f"{max(0, (s//10)*10):02d}-{min(99, (s//10)*10+9):02d}"
            if key in buckets:
                buckets[key] += 1
        for k in sorted(buckets.keys()):
            if buckets[k] > 0:
                bar = "█" * buckets[k]
                print(f"    {k}: {bar} ({buckets[k]})")

    print(f"\n{'=' * 70}")
    for subdir in dirs_to_check:
        sub_kept = len([r for r in kept_results if r["file"].startswith(subdir)])
        sub_removed = len([r for r in all_results if not r["keep"] and r["file"].startswith(subdir)])
        if sub_kept or sub_removed:
            print(f"  {subdir}/: {sub_kept} KEPT, {sub_removed} REMOVED")
    print(f"  Non-bpvsbuckler: {non_bpv_removed} REMOVED")
    print(f"  TOTAL: {kept} KEPT, {removed} REMOVED")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
