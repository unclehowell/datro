# -*- coding: utf-8 -*-
"""Place pictures on storyboard scenes by DATE, and refuse to build if any
picture falls outside its scene's period.

Called from content/graph/build_graph.py just before src/data/story.json is
written (so the CI step "Build the Q&A graph" fails on a bad placement), and
runnable on its own:

    python3 content/scene_media.py            # check src/data/story.json
    python3 content/scene_media.py --report   # also print every placement

Rules
- A scene's period comes from its 'date' and every date in its 'when' text
  ("1536 - 1793", "c. 1840", "12th - 14th century", "29 - 30 November 1988").
- A picture's date is the date of what it shows, from media_register.py.
  Pictures with no established date are never shown on a dated scene.
- Curated pictures (a scene's 'image' and its evidence 'image's) must be in
  the register and inside the period, with a tolerance of one year either side
  (two years for a "c." date). A records-era scene (2025 or later) may show a
  record released inside its period (e.g. the 1988 Cadw photographs released
  under ATISN 27021 in 2026).
- Archive pictures are added only when their date falls inside the scene's
  own window (day-level for dated scenes, plus up to 14 days for press
  reports), a year-only picture goes to the single closest scene of that year,
  and no picture is borrowed by an earlier or later scene.
- Undated "Stating the obvious" and "Today" scenes show only curated pictures,
  and those must still be dated.
"""
import calendar, datetime as dt, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from media_register import REGISTER

TOL_YEARS = 1          # build-check tolerance either side of a scene's period
PRESS_LAG_DAYS = 14    # a report may follow the event it reports
LEAD_DAYS = 2
MAX_EXTRA = 6          # archive pictures per scene, beyond curated ones

MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_abbr) if m})
ORD = {'early': (0, 33), 'mid': (33, 66), 'late': (66, 99)}


def _d(y, m=1, d=1):
    return dt.date(max(1, min(9999, y)), m, d)


def _end(y, m=None, d=None):
    if d: return _d(y, m, d)
    if m: return _d(y, m, calendar.monthrange(max(1, y), m)[1])
    return _d(y, 12, 31)


def media_range(date, approx=False):
    """(start, end, precision) of a register date string, or None."""
    if not date: return None
    p = [int(x) for x in date.split('-')]
    y = p[0]
    if len(p) == 3: s, e, prec = _d(*p), _d(*p), 'day'
    elif len(p) == 2: s, e, prec = _d(y, p[1]), _end(y, p[1]), 'month'
    else: s, e, prec = _d(y), _end(y), 'year'
    if approx and prec != 'year':
        s, e = s - dt.timedelta(days=3), e + dt.timedelta(days=3)
    return s, e, prec


def scene_period(scene):
    """(start, end) dates of a scene, or None for undated scenes (9998/9999)."""
    date = scene.get('date') or ''
    m = re.match(r'^(-?\d{4})-(\d{2})-(\d{2})$', date)
    if not m: return None
    y0 = int(m.group(1))
    if y0 >= 9998: return None
    when = (scene.get('when') or '').replace('\u2013', '-').replace('\u2014', '-')
    starts, ends = [], []
    if y0 > 0:
        starts.append(_d(y0, int(m.group(2)), int(m.group(3))))
    else:                                   # BC: no picture can match
        return (dt.date.min, dt.date.min)
    # centuries: "12th - 14th century", "Mid 16th - late 18th century", "early 19th century"
    for q, n in re.findall(r'(?:(early|mid|late)\s+)?(\d{1,2})(?:st|nd|rd|th)(?=[^0-9]*century)', when, re.I):
        base = (int(n) - 1) * 100
        lo, hi = ORD.get(q.lower(), (0, 99)) if q else (0, 99)
        starts.append(_d(base + lo)); ends.append(_end(base + hi))
    # decades: "1970s"
    for dec in re.findall(r'\b(1\d{2}0|20\d0)s\b', when):
        starts.append(_d(int(dec))); ends.append(_end(int(dec) + 9))
    approx = bool(re.search(r'\b(c\.|circa|approx)', when, re.I))
    # full dates and month-years
    for d, mon, y in re.findall(r'(?:(\d{1,2})\s+)?([A-Za-z]{3,9})\s+(\d{4})', when):
        if mon.lower() not in MONTHS: continue
        y, mo = int(y), MONTHS[mon.lower()]
        starts.append(_d(y, mo, int(d)) if d else _d(y, mo)); ends.append(_end(y, mo, int(d) if d else None))
    # day ranges sharing a month: "29 - 30 November 1988", "19 April - 25 May 2026"
    for d1, d2, mon, y in re.findall(r'\b(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})', when):
        if mon.lower() in MONTHS:
            starts.append(_d(int(y), MONTHS[mon.lower()], int(d1)))
    # month ranges sharing a year: "January - March 1989"
    for m1, m2, y in re.findall(r'\b([A-Za-z]{3,9})\s*-\s*([A-Za-z]{3,9})\s+(\d{4})', when):
        if m1.lower() in MONTHS: starts.append(_d(int(y), MONTHS[m1.lower()]))
    # bare years (not part of a "Month YYYY" already handled -> harmless duplicates)
    has_day_or_month = any(mon.lower() in MONTHS for _, mon, _ in re.findall(r'(?:(\d{1,2})\s+)?([A-Za-z]{3,9})\s+(\d{4})', when))
    for y in re.findall(r'(?<![\d/])(1\d{3}|20\d{2})(?![\ds\d])', when):
        y = int(y)
        if has_day_or_month and any(e.year == y for e in ends):
            continue
        starts.append(_d(y)); ends.append(_end(y))
    # short year ranges: "1952 - 53", "c. 1948 - 49", "1994 - 96"
    for y1, y2 in re.findall(r'\b(1\d{3}|20\d{2})\s*-\s*(\d{2})\b(?!\d)', when):
        y2 = int(y1[:2] + y2)
        if y2 >= int(y1): starts.append(_d(int(y1))); ends.append(_end(y2))
    if not ends:
        ends.append(starts[0] if re.match(r'^\d{4}-\d{2}-\d{2}$', date) and re.search(r'\d{1,2}\s+[A-Za-z]+\s+\d{4}', when) else _end(y0))
    s, e = min(starts), max(ends + [starts[0]])
    if approx:
        s, e = _d(s.year - 3), _end(e.year + 3)
    return s, e


def _overlap(a0, a1, b0, b1):
    return a0 <= b1 and b0 <= a1


def _norm(url):
    return (url or '').strip()


REG = {}
for row in REGISTER:
    REG.setdefault(_norm(row['url']), row)


def check_one(scene, period, row, curated):
    """None if the picture may sit on this scene, else the reason it may not."""
    if row is None:
        return 'not in media_register.py (date not established)'
    if row.get('exclude'):
        return 'excluded: ' + row['exclude']
    rng = media_range(row.get('date'), row.get('approx'))
    rel = media_range(row.get('released'))
    if period is None:                      # undated scene: curated + dated only
        if not curated: return 'archive pictures are not added to undated scenes'
        return None if (rng or rel) else 'picture has no established date'
    s, e = period
    tol = TOL_YEARS + (1 if row.get('approx') else 0)
    lo, hi = _d(s.year - tol), _end(e.year + tol)
    if rng and _overlap(rng[0], rng[1], lo, hi):
        return None
    if rel and s.year >= 2025 and _overlap(rel[0], rel[1], lo, hi):
        return None
    if not rng and not rel:
        return 'picture has no established date'
    what = row.get('date') or ('released ' + row['released'])
    return 'picture dated %s is outside the scene period %s to %s' % (what, s.isoformat(), e.isoformat())


def attach_media(scenes, strict=True):
    """Add scene['media'] (ordered list) to every scene. Raise SystemExit on any
    out-of-period curated picture when strict."""
    errors, placements = [], []
    periods = {sc['id']: scene_period(sc) for sc in scenes}
    used_items = {sc['id']: set() for sc in scenes}
    for sc in scenes:
        period = periods[sc['id']]
        media = []
        curated = []
        if sc.get('image'): curated.append((sc['image'], 'scene image'))
        for ev in sc.get('evidence') or []:
            if ev.get('image'): curated.append((ev['image'], 'evidence: ' + (ev.get('title') or '')))
        for url, why in curated:
            row = REG.get(_norm(url))
            bad = check_one(sc, period, row, True)
            if bad:
                errors.append('%s (%s): %s -> %s' % (sc['id'], sc.get('when'), url, bad)); continue
            if any(m['url'] == url for m in media): continue
            used_items[sc['id']].add(row['item'])
            media.append({'url': url, 'title': row['title'], 'date': row.get('date'), 'released': row.get('released'),
                          'item': row['item'], 'source': 'curated', 'basis': row['basis']})
        sc['media'] = media
    # archive pictures: place each dated record on the scene(s) whose window holds it
    by_item = {}
    for row in REGISTER:
        if row.get('exclude') or not row.get('date'): continue
        if row['url'].startswith('/media/'): continue        # site copies are curated-only
        by_item.setdefault(row['item'], []).append(row)
    dated = [sc for sc in scenes if periods[sc['id']] and periods[sc['id']][0] != dt.date.min]
    for item, rows in by_item.items():
        row = rows[0]
        s0, e0, prec = media_range(row['date'], row.get('approx'))
        cands = []
        for sc in dated:
            ps, pe = periods[sc['id']]
            if prec == 'year':
                if not _overlap(s0, e0, ps, pe): continue
            else:
                if not _overlap(s0, e0, ps - dt.timedelta(days=LEAD_DAYS), pe + dt.timedelta(days=PRESS_LAG_DAYS)): continue
            span = (pe - ps).days
            dist = 0 if ps <= s0 <= pe else min(abs((s0 - ps).days), abs((s0 - pe).days))
            cands.append((dist, span, sc))
        if not cands: continue
        cands.sort(key=lambda c: (c[0], c[1]))
        if prec == 'year':
            cands = cands[:1]
        else:
            best = cands[0][0]
            cands = [c for c in cands if c[0] <= best + 1][:3]
        for _, _, sc in cands:
            if item in used_items[sc['id']]: continue
            extra = [m for m in sc['media'] if m['source'] == 'archive']
            if len(extra) >= MAX_EXTRA: continue
            bad = check_one(sc, periods[sc['id']], row, False)
            if bad:
                errors.append('%s: archive %s -> %s' % (sc['id'], row['url'], bad)); continue
            used_items[sc['id']].add(item)
            sc['media'].append({'url': row['url'], 'title': row['title'], 'date': row['date'], 'released': row.get('released'),
                                'item': item, 'source': 'archive', 'basis': row['basis']})
    # final independent re-check of everything placed
    for sc in scenes:
        period = periods[sc['id']]
        for m in sc['media']:
            bad = check_one(sc, period, REG.get(_norm(m['url'])), m['source'] == 'curated')
            if bad: errors.append('%s: %s -> %s' % (sc['id'], m['url'], bad))
        for m in sc['media']:
            placements.append((sc['id'], sc.get('when'), m['url'], m.get('date') or m.get('released')))
    if errors and strict:
        sys.stderr.write('Scene media date check FAILED (%d):\n  %s\n' % (len(errors), '\n  '.join(errors)))
        raise SystemExit(1)
    return errors, placements


def write_manifest(scenes, path):
    out = {'rule': 'Pictures are placed by the date of what they show; undated pictures are not shown on dated scenes.',
           'tolerance_years': TOL_YEARS,
           'scenes': [{'id': sc['id'], 'when': sc.get('when'),
                       'period': [p.isoformat() for p in scene_period(sc)] if scene_period(sc) and scene_period(sc)[0] != dt.date.min else None,
                       'media': sc.get('media', [])} for sc in scenes]}
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    story = json.load(open(os.path.join(SITE, 'src/data/story.json'), encoding='utf-8'))
    for sc in story['scenes']:
        sc.pop('media', None)
    errors, placements = attach_media(story['scenes'], strict=False)
    if '--report' in sys.argv:
        for p in placements: print('\t'.join(str(x) for x in p))
    if errors:
        print('FAILED:\n  ' + '\n  '.join(errors)); sys.exit(1)
    print('Scene media date check passed: %d placements on %d scenes.' % (len(placements), len(story['scenes'])))
