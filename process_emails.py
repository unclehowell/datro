#!/usr/bin/env python3
"""
Process Gmail messages: download PDF attachments and save plain text bodies.
Checks for existing files to avoid duplicates.
"""

import json
import os
import subprocess
import sys
import base64
import re
import time
from pathlib import Path

GWS = "/home/unclehowell/.npm-global/bin/gws"
PDF_DIR = "/home/unclehowell/datro/wayback/pdf"
TEXT_DIR = "/home/unclehowell/datro/wayback/text"

# Which message IDs belong to which queries (for reporting)
QUERY_LABELS = {
    "land registry": set(),
    "FOI": set(),
    "Great House Farm": set(),
    "Llandough": set(),
    "Mrs Williams": set(),
    "BP vs Buckler": set(),
}

def load_query_ids():
    """Load message IDs for each query from files."""
    query_files = {
        "land registry": "/tmp/land_registry_ids.txt",
        "FOI": "/tmp/foi_ids.txt",
        "Great House Farm": "/tmp/ghf_ids.txt",
        "Llandough": "/tmp/llandough_ids.txt",
        "Mrs Williams": "/tmp/mrs_williams_ids.txt",
        "BP vs Buckler": "/tmp/bpvsbuckler_ids.txt",
    }
    for qname, fpath in query_files.items():
        if os.path.exists(fpath):
            with open(fpath) as f:
                for line in f:
                    QUERY_LABELS[qname].add(line.strip())

def run_gws(cmd_args):
    """Run a gws command and return (stdout, stderr, returncode)."""
    try:
        result = subprocess.run(
            [GWS] + cmd_args,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "timeout", -1
    except Exception as e:
        return "", str(e), -1

def get_gws_json(cmd_args):
    """Run a gws command and return the parsed JSON output from stdout."""
    stdout, stderr, rc = run_gws(cmd_args)
    if rc != 0:
        if stderr:
            return None
    output = stdout
    # Skip the "Using keyring backend:" line if present
    if output.startswith("Using keyring backend"):
        lines = output.split("\n", 1)
        if len(lines) > 1:
            output = lines[1]
        else:
            output = ""
    if not output.strip():
        return None
    try:
        return json.loads(output)
    except json.JSONDecodeError as e:
        print(f"    JSON error: {e}", file=sys.stderr)
        return None

def find_text_in_parts(parts):
    """Recursively search for text/plain content in message parts."""
    for p in parts:
        mime = p.get("mimeType", "")
        if mime == "text/plain":
            body = p.get("body", {})
            data = body.get("data", "")
            if data:
                try:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
                except Exception:
                    pass
        # Check sub-parts
        sub_parts = p.get("parts", [])
        if sub_parts:
            result = find_text_in_parts(sub_parts)
            if result:
                return result
    return None

def find_attachments(parts):
    """Recursively find all attachment parts with attachmentId and filename."""
    attachments = []
    for p in parts or []:
        fn = p.get("filename", "")
        mime = p.get("mimeType", "")
        body = p.get("body", {})
        aid = body.get("attachmentId", "")
        if fn and aid:
            attachments.append({
                "filename": fn,
                "mimeType": mime,
                "attachmentId": aid,
                "size": body.get("size", 0),
            })
        # Check sub-parts recursively
        sub_parts = p.get("parts", [])
        if sub_parts:
            attachments.extend(find_attachments(sub_parts))
    return attachments

def sanitize_filename(fname):
    """Sanitize a filename for saving."""
    fname = re.sub(r'[/\\:*?"<>|]', '_', fname)
    if len(fname) > 200:
        name, ext = os.path.splitext(fname)
        fname = name[:196] + ext
    return fname

def download_attachment(msg_id, attachment_id, filename):
    """Download an attachment by extracting base64 data from JSON output."""
    safe_name = sanitize_filename(filename)
    filepath = os.path.join(PDF_DIR, safe_name)
    
    # Check if file already exists
    if os.path.exists(filepath):
        print(f"    EXISTS: {safe_name}")
        return False, None
    
    # Get the attachment data as JSON
    stdout, stderr, rc = run_gws([
        "gmail", "users", "messages", "attachments", "get",
        "--params", json.dumps({"userId": "me", "messageId": msg_id, "id": attachment_id}),
    ])
    
    if rc != 0 or not stdout.strip():
        print(f"    FAILED: {safe_name} - {stderr[:100] if stderr else 'no output'}")
        return False, stderr
    
    # Strip the keyring message if present
    output = stdout
    if output.startswith("Using keyring backend"):
        lines = output.split("\n", 1)
        if len(lines) > 1:
            output = lines[1]
        else:
            output = ""
    
    if not output.strip():
        print(f"    FAILED: {safe_name} - empty output")
        return False, "empty output"
    
    try:
        data_json = json.loads(output)
    except json.JSONDecodeError as e:
        print(f"    FAILED: {safe_name} - JSON parse error: {e}")
        return False, str(e)
    
    raw_data = data_json.get("data", "")
    if not raw_data:
        print(f"    FAILED: {safe_name} - no data field in response")
        return False, "no data field"
    
    try:
        decoded = base64.urlsafe_b64decode(raw_data.encode("ascii"))
    except Exception as e:
        print(f"    FAILED: {safe_name} - base64 decode error: {e}")
        return False, str(e)
    
    with open(filepath, "wb") as f:
        f.write(decoded)
    
    print(f"    DOWNLOADED: {safe_name} ({len(decoded)} bytes)")
    return True, None

def save_text_body(msg_id, subject, text_content):
    """Save the plain text body of an email."""
    safe_subj = sanitize_filename(subject) if subject else "no_subject"
    if len(safe_subj) > 100:
        safe_subj = safe_subj[:100]
    fname = f"{safe_subj}_{msg_id}.txt"
    filepath = os.path.join(TEXT_DIR, fname)
    
    if os.path.exists(filepath):
        print(f"    TEXT EXISTS: {fname}")
        return False
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text_content)
    print(f"    TEXT SAVED: {fname} ({len(text_content)} chars)")
    return True

def get_subject_from_payload(payload):
    """Extract subject from payload headers."""
    headers = payload.get("headers", [])
    for h in headers:
        if h["name"] == "Subject":
            return h["value"]
    return "No Subject"

def process_message(msg_id):
    """Process a single message: find attachments and text body."""
    data = get_gws_json([
        "gmail", "users", "messages", "get",
        "--params", json.dumps({"userId": "me", "id": msg_id, "format": "full"})
    ])
    if not data:
        return {"subject": "Unknown", "downloaded_pdfs": [], "saved_texts": [], "error": "no data"}
    
    payload = data.get("payload", {})
    subject = get_subject_from_payload(payload)
    parts = payload.get("parts", [])
    
    result = {"subject": subject, "downloaded_pdfs": [], "saved_texts": [], "error": None}
    
    # Find and download PDF attachments
    attachments = find_attachments(parts)
    pdf_attachments = [a for a in attachments if a["mimeType"] == "application/pdf"]
    
    for att in pdf_attachments:
        success, err = download_attachment(msg_id, att["attachmentId"], att["filename"])
        if success:
            result["downloaded_pdfs"].append(att["filename"])
        elif err and not result["error"]:
            result["error"] = err
    
    # Save plain text body for all queried messages
    text_content = find_text_in_parts(parts)
    if not text_content:
        # Try the top-level body (for simple messages)
        body = payload.get("body", {})
        data = body.get("data", "")
        if data:
            try:
                text_content = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
            except Exception:
                pass
    
    if text_content:
        success = save_text_body(msg_id, subject, text_content)
        if success:
            result["saved_texts"].append(subject)
    
    return result

def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(TEXT_DIR, exist_ok=True)
    
    load_query_ids()
    
    # Load all unique IDs
    if not os.path.exists("/tmp/all_unique_ids.txt"):
        print("ERROR: /tmp/all_unique_ids.txt not found")
        sys.exit(1)
    
    with open("/tmp/all_unique_ids.txt") as f:
        all_ids = [line.strip() for line in f if line.strip()]
    
    print(f"Total unique messages to process: {len(all_ids)}")
    print(f"PDF output dir: {PDF_DIR}")
    print(f"Text output dir: {TEXT_DIR}")
    print()
    
    # Stats
    stats = {
        "total_processed": 0,
        "total_errors": 0,
        "downloaded_pdfs": [],
        "saved_texts": [],
        "per_query": {},
    }
    
    for qname in QUERY_LABELS:
        stats["per_query"][qname] = {
            "total": len(QUERY_LABELS[qname]),
            "downloaded_pdfs": [],
            "saved_texts": [],
            "errors": 0,
        }
    
    for idx, msg_id in enumerate(all_ids):
        # Determine which queries this message belongs to
        queries_for_msg = [q for q, ids in QUERY_LABELS.items() if msg_id in ids]
        queries_str = ", ".join(queries_for_msg) if queries_for_msg else "other"
        
        print(f"[{idx+1}/{len(all_ids)}] ID={msg_id} ({queries_str})")
        sys.stdout.flush()
        
        result = process_message(msg_id)
        
        stats["total_processed"] += 1
        stats["downloaded_pdfs"].extend(result["downloaded_pdfs"])
        stats["saved_texts"].extend(result["saved_texts"])
        
        if result["error"]:
            stats["total_errors"] += 1
        
        # Update per-query stats
        for qname in queries_for_msg:
            stats["per_query"][qname]["downloaded_pdfs"].extend(result["downloaded_pdfs"])
            stats["per_query"][qname]["saved_texts"].extend(result["saved_texts"])
            if result["error"]:
                stats["per_query"][qname]["errors"] += 1
        
        # Brief pause to avoid rate limiting
        if idx % 10 == 9:
            time.sleep(0.3)
    
    # Report
    print("\n" + "=" * 70)
    print("FINAL REPORT")
    print("=" * 70)
    print(f"\nTotal unique messages processed: {stats['total_processed']}")
    print(f"Errors encountered: {stats['total_errors']}")
    print()
    
    for qname, qstat in stats["per_query"].items():
        unique_pdfs = sorted(set(qstat["downloaded_pdfs"]))
        unique_texts = sorted(set(qstat["saved_texts"]))
        print(f"\n--- {qname} ---")
        print(f"  Messages found in search: {qstat['total']}")
        print(f"  New PDFs downloaded: {len(unique_pdfs)}")
        for f in unique_pdfs:
            print(f"    - {f}")
        print(f"  New text files saved: {len(unique_texts)}")
        for s in unique_texts:
            print(f"    - {s}")
        if qstat["errors"]:
            print(f"  Errors: {qstat['errors']}")
    
    unique_all_pdfs = sorted(set(stats["downloaded_pdfs"]))
    unique_all_texts = sorted(set(stats["saved_texts"]))
    print(f"\n--- Overall Summary ---")
    print(f"Total unique new PDFs downloaded: {len(unique_all_pdfs)}")
    for f in unique_all_pdfs:
        print(f"  {f}")
    print(f"Total unique new text files saved: {len(unique_all_texts)}")
    print(f"Total errors: {stats['total_errors']}")

if __name__ == "__main__":
    main()
