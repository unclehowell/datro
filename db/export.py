#!/usr/bin/env python3
"""Export the dartboard section database (public/_db/section.sqlite) to src/data/section-db.json, which the
front end imports. The database is the source; the JSON is generated from it and never edited by hand.
Usage: python3 db/export.py   (also rewrites db/section.sql, the diffable text dump)"""
import json, os, sqlite3
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
con = sqlite3.connect(os.path.join(ROOT, 'public/_db/section.sqlite'))
rows = con.execute('SELECT kind, id, seq, data FROM records ORDER BY seq').fetchall()
meta = dict(con.execute('SELECT k, v FROM meta').fetchall())
out = {'db': 'public/_db/section.sqlite', 'meta': meta, 'records': [{**json.loads(d), 'kind': k, 'id': i, 'seq': s} for k, i, s, d in rows]}
with open(os.path.join(ROOT, 'src/data/section-db.json'), 'w') as f: json.dump(out, f, ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, 'db/section.sql'), 'w') as f:
    for line in con.iterdump(): f.write(line + '\n')
print(len(rows), 'records exported')
