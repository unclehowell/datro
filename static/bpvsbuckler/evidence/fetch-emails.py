#!/usr/bin/env python3
"""
Fetch BP vs Buckler / Great House Farm emails from Gmail via gws CLI
and update data.json with evidence references for wayback.datro.xyz.

Usage:
    python3 fetch-emails.py              # fetch and print summary
    python3 fetch-emails.py --update     # fetch and update data.json
    python3 fetch-emails.py --output-dir ./emails   # save email bodies locally
"""
import json
import subprocess
import base64
import os
import sys
import re
import hashlib
from datetime import datetime

DATA_JSON = os.path.join(os.path.dirname(__file__), 'data.json')
WAYBACK_BASE = 'https://wayback.datro.xyz/bpvsbuckler/evidence'

def gws(*args):
    result = subprocess.run(['gws'] + list(args), capture_output=True, text=True)
    if result.returncode != 0:
        print(f"gws error: {result.stderr}")
        return None
    return json.loads(result.stdout)

def get_body(payload):
    if 'body' in payload and payload['body'].get('data'):
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='replace')
    if 'parts' in payload:
        for part in payload['parts']:
            result = get_body(part)
            if result:
                return result
    return ''

def extract_year(email_date):
    match = re.search(r'\b(20\d{2})\b', email_date)
    return match.group(1) if match else '2026'

def email_to_evidence(msg_id, subject, sender, recipient, date, snippet, body):
    year = extract_year(date)
    safe_id = hashlib.md5(msg_id.encode()).hexdigest()[:8]
    email_id = f"email-{year}-{safe_id}"
    return {
        'year': year,
        'subject': subject,
        'content': f"Email from {sender} to {recipient} on {date}.\n\nSubject: {subject}\n\n{body[:500]}...",
        'evidence': [{
            'type': 'email',
            'title': subject[:60],
            'url': f"{WAYBACK_BASE}/emails/{email_id}.eml",
            'thumbnail': None
        }]
    }

def fetch_emails(query="Great House Farm", max_results=30):
    print(f"Searching Gmail for: '{query}' (max {max_results})...")
    resp = gws('gmail', 'users', 'messages', 'list', '--params',
               json.dumps({"userId": "me", "q": query, "maxResults": max_results}))
    if not resp or 'messages' not in resp:
        print("No messages found or API error.")
        return []
    
    msgs = resp['messages']
    results = []
    print(f"Found {len(msgs)} messages. Fetching details...")
    
    for i, m in enumerate(msgs):
        msg = gws('gmail', 'users', 'messages', 'get', '--params',
                  json.dumps({"userId": "me", "id": m['id'], "format": "full"}))
        if not msg:
            continue
        
        headers = {h['name']: h['value'] for h in msg['payload']['headers']}
        subject = headers.get('Subject', '')
        sender = headers.get('From', '')
        recipient = headers.get('To', '')
        date = headers.get('Date', '')
        snippet = msg.get('snippet', '')
        body = get_body(msg['payload'])
        
        results.append({
            'id': m['id'],
            'thread': m.get('threadId', ''),
            'subject': subject,
            'from': sender,
            'to': recipient,
            'date': date,
            'snippet': snippet,
            'body': body
        })
        print(f"  [{i+1}/{len(msgs)}] {date[:20]} - {subject[:60]}...")
    
    return results

def group_by_year(emails):
    groups = {}
    for e in emails:
        year = extract_year(e['date'])
        if year not in groups:
            groups[year] = []
        groups[year].append(e)
    return groups

def update_data_json(emails):
    if not os.path.exists(DATA_JSON):
        print(f"ERROR: {DATA_JSON} not found")
        return
    
    with open(DATA_JSON) as f:
        data = json.load(f)
    
    groups = group_by_year(emails)
    
    for year, year_emails in groups.items():
        if year not in data:
            data[year] = []
        
        existing_subjects = {e['subject'] for e in data[year]}
        
        for e in year_emails:
            if e['subject'] not in existing_subjects:
                evidence_item = email_to_evidence(
                    e['id'], e['subject'], e['from'],
                    e['to'], e['date'], e['snippet'], e['body']
                )
                data[year].append({
                    'subject': evidence_item['subject'],
                    'content': evidence_item['content'],
                    'evidence': evidence_item['evidence']
                })
                existing_subjects.add(e['subject'])
                print(f"  + Added email: {e['subject'][:60]}")
        data[year] = sorted(data[year], key=lambda x: x['subject'])
    
    with open(DATA_JSON, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nUpdated {DATA_JSON}")

def save_emails_local(emails, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for e in emails:
        safe_id = hashlib.md5(e['id'].encode()).hexdigest()[:8]
        year = extract_year(e['date'])
        fname = f"email-{year}-{safe_id}.eml"
        path = os.path.join(output_dir, fname)
        with open(path, 'w') as f:
            f.write(f"From: {e['from']}\n")
            f.write(f"To: {e['to']}\n")
            f.write(f"Date: {e['date']}\n")
            f.write(f"Subject: {e['subject']}\n")
            f.write(f"\n{e['body']}\n")
        print(f"  Saved: {fname}")

if __name__ == '__main__':
    do_update = '--update' in sys.argv
    output_dir = None
    if '--output-dir' in sys.argv:
        idx = sys.argv.index('--output-dir')
        if idx + 1 < len(sys.argv):
            output_dir = sys.argv[idx + 1]
    
    print("=" * 60)
    print(f"BP vs Buckler — Gmail Evidence Fetcher")
    print(f"Date: {datetime.now().isoformat()}")
    print("=" * 60)
    
    emails = fetch_emails()
    
    if not emails:
        print("No emails found.")
        sys.exit(0)
    
    print(f"\nFetched {len(emails)} emails total.")
    
    if do_update:
        print("\nUpdating data.json...")
        update_data_json(emails)
    
    if output_dir:
        print(f"\nSaving emails to {output_dir}...")
        save_emails_local(emails, output_dir)
    
    if not do_update and not output_dir:
        print(f"\nUse --update to write to data.json")
        print(f"Use --output-dir <dir> to save email files locally")
PYEOF