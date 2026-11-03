#!/usr/bin/env python3
"""Gmail read-only verification for the emails site. For each seed thread, search Gmail (q) and read the
headers (Date, From, Subject) of the newest few messages, so last-sent / last-received dates come from the mailbox.
Usage: python3 gmail_verify.py --taskdir /home/user/tab/tasks/<current task id> [--only id,id]
Writes work/emails-site/gmail-verify.json (merged; one entry per thread id). Never writes to Gmail."""
import json, os, sys, time, subprocess, argparse, email.utils, datetime
W = os.path.dirname(os.path.abspath(__file__))
ME = 'hywelapbuckler@gmail.com'
_last = [0.0]
def ws(req, rq, tries=6):
    for a in range(tries):
        d = 4.0 - (time.time() - _last[0])
        if d > 0: time.sleep(d)
        req = dict(req); req.setdefault('query', {}); req['query'] = dict(req['query'], _ts='%s-%d' % (time.time(), a))
        p = os.path.join(rq, 'emails-site-gmail-req-%d.json' % os.getpid()); open(p, 'w').write(json.dumps(req))
        r = subprocess.run(['timeout', '-k', '5', '100', '/usr/bin/node', '/home/user/tab/workspace-cli.mjs', 'workspace.request', p], capture_output=True, text=True)
        _last[0] = time.time()
        try: o = json.loads(r.stdout); res = o.get('result', o)
        except Exception: res = {}
        st = res.get('status')
        if st in (200, 204):
            b = res.get('body')
            if isinstance(b, str):
                try: b = json.loads(b)
                except Exception: pass
            return b if b is not None else {}
        if st == 429 or st is None or (isinstance(st, int) and st >= 500):
            time.sleep(10 * (a + 1)); continue
        print('ERR', st, str(res)[:200], file=sys.stderr, flush=True); return None
    return None
def verify(t, rq, n=4):
    b = ws({'method': 'GET', 'url': 'https://gmail.googleapis.com/gmail/v1/users/me/messages', 'query': {'q': t['q'] + ' -in:drafts', 'maxResults': str(n)}}, rq)
    if b is None: return {'ok': False, 'why': 'search failed'}
    out = {'ok': True, 'q': t['q'], 'count_shown': len(b.get('messages', []) or []), 'estimate': b.get('resultSizeEstimate'), 'msgs': []}
    for m in (b.get('messages') or [])[:n]:
        md = ws({'method': 'GET', 'url': 'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m['id'], 'query': {'format': 'metadata', 'metadataHeaders': ['Date', 'From', 'Subject'], 'fields': 'id,threadId,labelIds,internalDate,payload/headers'}}, rq)
        if not md: continue
        h = {x['name'].lower(): x['value'] for x in md.get('payload', {}).get('headers', [])}
        dt = datetime.datetime.fromtimestamp(int(md.get('internalDate', '0')) / 1000, datetime.timezone.utc)
        frm = h.get('from', '')
        out['msgs'].append({'id': m['id'], 'thread': md.get('threadId'), 'date': dt.date().isoformat(), 'at': dt.isoformat(timespec='minutes'),
                            'mine': ME in frm.lower() or 'SENT' in (md.get('labelIds') or []), 'from_domain': (email.utils.parseaddr(frm)[1].split('@')[-1] if '@' in frm else ''), 'subject': (h.get('subject') or '')[:140]})
    mine = [x for x in out['msgs'] if x['mine']]; theirs = [x for x in out['msgs'] if not x['mine']]
    out['last_sent'] = max((x['date'] for x in mine), default=None)
    out['last_received'] = max((x['date'] for x in theirs), default=None)
    out['last_received_subject'] = next((x['subject'] for x in sorted(theirs, key=lambda x: x['at'], reverse=True)), None)
    out['checked_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes')
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--taskdir', required=True); ap.add_argument('--only', default='')
    a = ap.parse_args(); os.makedirs(a.taskdir, exist_ok=True)
    seed = json.load(open(os.path.join(W, 'seed.json')))
    only = set(filter(None, a.only.split(',')))
    path = os.path.join(W, 'gmail-verify.json')
    res = json.load(open(path)) if os.path.exists(path) else {}
    for t in seed:
        if only and t['id'] not in only: continue
        if not t.get('q'): continue
        r = verify(t, a.taskdir)
        res[t['id']] = r
        json.dump(res, open(path + '.tmp', 'w'), indent=1, ensure_ascii=False); os.replace(path + '.tmp', path)
        print(t['id'], r.get('ok'), r.get('last_sent'), r.get('last_received'), (r.get('last_received_subject') or '')[:60], flush=True)
    print('done', flush=True)
if __name__ == '__main__': main()
