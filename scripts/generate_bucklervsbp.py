#!/usr/bin/env python3
"""
Generate static HTML site for bucklervsbp.datro.xyz
Reads source data from static/bpvsbuckler/ and generates static/bucklervsbp/
"""

import json
import os
import re
import shutil
import html
from datetime import date

BASE_DIR = "/tmp/bucklervsbp-rerelease"
SRC_DIR = f"{BASE_DIR}/static/bpvsbuckler"
DST_DIR = f"{BASE_DIR}/static/bucklervsbp"
SCRIPTS_DIR = "/home/unclehowell/scripts"

# ============================================================
# HELPERS
# ============================================================

def slugify(text):
    """Create a URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def h(text):
    """HTML-escape text."""
    return html.escape(str(text))

def parse_a1_array(raw_string):
    """Parse the a1=... JS-like array string safely without eval()."""
    # Remove "a1=" prefix
    if raw_string.startswith("a1="):
        raw_string = raw_string[2:]
    # Try parsing as JSON (the data might be valid JSON)
    try:
        return json.loads(raw_string)
    except json.JSONDecodeError:
        pass
    # Fix common JS-to-JSON issues
    # Replace single quotes with double quotes (but be careful with strings containing quotes)
    # Actually, let's try a more robust approach using regex to extract the array
    # The array starts with [ and ends with ]
    try:
        # Use Python's ast.literal_eval which can parse Python literals
        # But first convert JS-style to Python-style
        s = raw_string
        # Replace true/false/null with Python equivalents
        s = re.sub(r':\s*true', ': True', s)
        s = re.sub(r':\s*false', ': False', s)
        s = re.sub(r':\s*null', ': None', s)
        # Try literal_eval
        import ast
        return ast.literal_eval(s)
    except:
        pass
    # Last resort: try to use json with some preprocessing
    try:
        # Replace single quotes with double quotes for keys
        s = re.sub(r"'", '"', raw_string)
        return json.loads(s)
    except:
        return []

def read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def read_text(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Wrote: {path}")

# ============================================================
# CSS STYLESHEET (shared)
# ============================================================

CSS = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Courier Prime', 'Courier New', monospace;
    background-color: #0f172a;
    color: #cbd5e1;
    line-height: 1.7;
    font-size: 16px;
}
a { color: #f59e0b; text-decoration: none; transition: color 0.2s; }
a:hover { color: #fbbf24; text-decoration: underline; }
a:visited { color: #d97706; }
.container { max-width: 1000px; margin: 0 auto; padding: 20px; }
header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-bottom: 2px solid #f59e0b;
    padding: 20px 0;
    margin-bottom: 30px;
}
header .container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
header h1 { font-size: 1.3em; color: #f59e0b; }
header h1 a { color: #f59e0b; }
header h1 a:hover { text-decoration: none; color: #fbbf24; }
header nav { display: flex; gap: 8px; flex-wrap: wrap; }
header nav a {
    color: #94a3b8; font-size: 0.85em; padding: 4px 10px;
    border: 1px solid #334155; border-radius: 4px;
    transition: all 0.2s;
}
header nav a:hover { color: #f59e0b; border-color: #f59e0b; text-decoration: none; }
h1 { font-size: 2em; color: #f59e0b; margin-bottom: 20px; }
h2 { font-size: 1.5em; color: #fbbf24; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 1px solid #334155; }
h3 { font-size: 1.2em; color: #f59e0b; margin: 20px 0 10px; }
h4 { font-size: 1.05em; color: #e2e8f0; margin: 15px 0 8px; }
p { margin-bottom: 15px; }
ul, ol { margin: 10px 0 15px 25px; }
li { margin-bottom: 6px; }
hr { border: none; border-top: 1px solid #334155; margin: 30px 0; }
blockquote {
    border-left: 3px solid #f59e0b; padding: 10px 15px; margin: 15px 0;
    background: #1e293b; border-radius: 0 6px 6px 0;
    font-style: italic; color: #94a3b8;
}
code { background: #1e293b; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; color: #fbbf24; }
pre { background: #1e293b; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 15px 0; font-size: 0.85em; }
table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 0.9em; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #1e293b; color: #f59e0b; font-weight: bold; position: sticky; top: 0; }
tr:hover { background: #1e293b; }
tr:nth-child(even) { background: #0c1222; }
tr:nth-child(even):hover { background: #1e293b; }
.card {
    background: #1e293b; border: 1px solid #334155; border-radius: 8px;
    padding: 20px; margin-bottom: 20px;
}
.card h3 { margin-top: 0; }
.card:hover { border-color: #f59e0b; }
.badge {
    display: inline-block; background: #f59e0b; color: #0f172a;
    padding: 2px 8px; border-radius: 3px; font-size: 0.75em; font-weight: bold;
}
.badge-blue { background: #3b82f6; color: #fff; }
.badge-red { background: #ef4444; color: #fff; }
.badge-green { background: #22c55e; color: #fff; }
.badge-purple { background: #a855f7; color: #fff; }
.year-marker {
    display: inline-block; background: #334155; color: #f59e0b;
    padding: 2px 10px; border-radius: 12px; font-size: 0.8em; font-weight: bold;
    margin-right: 5px;
}
.evidence-id {
    display: inline-block; background: #f59e0b; color: #0f172a;
    padding: 1px 6px; border-radius: 3px; font-size: 0.75em; font-weight: bold;
    font-family: monospace;
}
.contradiction-card {
    border-left: 4px solid #ef4444; padding-left: 15px; margin: 15px 0;
}
.question-card {
    border-left: 4px solid #3b82f6; padding-left: 15px; margin: 15px 0;
}
.issue-card {
    border-left: 4px solid #a855f7; padding-left: 15px; margin: 15px 0;
}
.nav-breadcrumb { margin-bottom: 20px; font-size: 0.85em; color: #64748b; }
.nav-breadcrumb a { color: #94a3b8; }
.nav-breadcrumb a:hover { color: #f59e0b; }
footer {
    margin-top: 50px; padding: 30px 0; text-align: center;
    border-top: 1px solid #334155; color: #64748b; font-size: 0.85em;
}
footer a { color: #94a3b8; }
footer a:hover { color: #f59e0b; }
.print-only { display: none; }
@media print {
    body { background: #fff; color: #000; font-size: 12pt; }
    header, footer, nav, .no-print { display: none !important; }
    a { color: #000; text-decoration: underline; }
    .print-only { display: block; }
    .card, blockquote, pre { border: 1px solid #ccc; background: #f9f9f9; }
    .container { max-width: none; padding: 0; }
    h1, h2, h3, h4 { color: #000; }
    th { background: #eee; color: #000; }
    .badge, .evidence-id, .year-marker { background: #eee; color: #000; }
    table { font-size: 10pt; }
}
@media (max-width: 768px) {
    .container { padding: 12px; }
    header .container { flex-direction: column; text-align: center; }
    header h1 { font-size: 1.1em; }
    header nav { justify-content: center; }
    h1 { font-size: 1.5em; }
    h2 { font-size: 1.3em; }
    table { font-size: 0.8em; }
    th, td { padding: 6px 8px; }
    pre { font-size: 0.75em; }
    .card { padding: 12px; }
}
"""

# ============================================================
# LOAD DATA
# ============================================================

print("Loading source data...")

evidence_data = read_json(f"{SRC_DIR}/evidence/data.json")
content_data = read_json(f"{SRC_DIR}/content/data.json")

# Parse a1 array (timeline entries) — use the pre-parsed timeline.json if available
timeline_api_path = f"{SRC_DIR}/api/timeline.json"
if os.path.exists(timeline_api_path):
    timeline_api = read_json(timeline_api_path)
    timeline_entries = timeline_api.get("entries", [])
    print(f"  Loaded {len(timeline_entries)} timeline entries from api/timeline.json")
else:
    # Fallback: parse a1 string manually
    a1_raw = content_data.get("a1", "[]")
    timeline_entries = parse_a1_array(a1_raw)
    print(f"  Loaded {len(timeline_entries)} timeline entries from a1 string (fallback)")

# Get claim text
claim_text = content_data.get("sk", "")

# Load research files
research_files = {}
research_dir = f"{SRC_DIR}/research"
if os.path.isdir(research_dir):
    for fname in sorted(os.listdir(research_dir)):
        if fname.endswith(".txt"):
            fpath = os.path.join(research_dir, fname)
            research_files[fname] = read_text(fpath)

# Build evidence list with IDs
evidence_list = []
eid = 1
for year in sorted(evidence_data.keys(), key=lambda y: int(y) if y.isdigit() else 9999):
    entries = evidence_data[year]
    for entry in entries:
        eid_str = f"E{eid:03d}"
        evidence_list.append({
            "id": eid_str,
            "year": year,
            "subject": entry.get("subject", ""),
            "content": entry.get("content", ""),
            "evidence": entry.get("evidence", [])
        })
        eid += 1

# ============================================================
# ADDITIONAL EVIDENCE ENTRIES (from primary research, not in bpvsbuckler source)
# ============================================================

additional_evidence = [
    {
        "id": f"E{eid:03d}",
        "year": "2026",
        "subject": "FOI Request: MOD Involvement in 1988 Eviction (FOI2026.09019)",
        "content": "FOI request filed by Sion Buckler to Ministry of Defence on 1 May 2026. Requests information on whether UK Armed Forces/SAS were involved in the 1988 eviction, involving up to 30 police officers. MOD responded 29 May 2026. Response document not publicly viewable.",
        "evidence": [{"url": "https://www.whatdotheyknow.com/request/1988_dispossession_of_great_hous", "title": "FOI Request - WhatDoTheyKnow", "type": "FOI"}]
    },
    {
        "id": f"E{eid+1:03d}",
        "year": "2005",
        "subject": "Holbrook & Thomas (2005) — An Early-Medieval Monastic Cemetery at Llandough",
        "content": "Academic publication in Medieval Archaeology XLIX (2005), pp. 1-92. Reports on the 1994 excavation of 1,026 burials at Great House Farm. Confirms Roman villa beneath site, Iron Age roundhouse, 11-year delay between excavation and publication due to funding constraints. Planning permission granted in 1992 without archaeological condition despite medium-high potential designation. Downloadable at https://sci-hub.ru/10.1179/007660905x54044",
        "evidence": [{"url": "https://sci-hub.ru/10.1179/007660905x54044", "title": "Full PDF via Sci-Hub", "type": "PDF"}, {"url": "https://cotswoldarchaeology.co.uk/wp-content/uploads/2011/07/llandough-pdf-1.pdf", "title": "Higher-res PDF (Cotswold Archaeology)", "type": "PDF"}]
    },
    {
        "id": f"E{eid+2:03d}",
        "year": "2005",
        "subject": "Knight (2005) — From Villa to Monastery: Llandough in Context",
        "content": "Academic publication in Medieval Archaeology XLIX (2005), pp. 93-107. Examines evidence for re-use of Roman villa sites for burial in post-Roman period. Concludes: 'The facts, taken together with the other evidence, archaeological and literary, for Early Christian activity at Llandough, strongly suggest continuity of occupation into the post-Roman period.' Downloadable at https://sci-hub.ru/10.1179/007660905x54053",
        "evidence": [{"url": "https://sci-hub.ru/10.1179/007660905x54053", "title": "Full PDF via Sci-Hub", "type": "PDF"}]
    },
    {
        "id": f"E{eid+3:03d}",
        "year": "1980",
        "subject": "Hansard: Ted Rowlands MP Condemns BP Pension Fund (22 May 1980)",
        "content": "Edward 'Ted' Rowlands MP spoke in the House of Commons debate on the Leasehold Reform Act amendments, describing Western Ground Rents and the BP Pension Fund as 'rapacious' and 'unfeeling.' Key quote: 'the most rapacious ground landlord, Western Ground Rents, has been bought by the BP pension fund, which is behaving in the same rapacious and, at times, unfeeling and uncaring way... It is regrettable that a distinguished company, which is half owned by the Government, should behave in that way.'",
        "evidence": [{"url": "https://hansard.parliament.uk/Commons/1980-05-22", "title": "Hansard HC Deb 22 May 1980 vol 985 cc723-65", "type": "Hansard"}]
    },
    {
        "id": f"E{eid+4:03d}",
        "year": "1994",
        "subject": "GGAT HER Assessment — 'Incompletely Understood' Building",
        "content": "The Glamorgan-Gwent Archaeological Trust's Historic Environment Record assessment (PRN 00768s) notes that Great House Farm was 'incompletely understood' due to its 'sudden destruction' in 1988. Following the demolition, GGAT entered discussions with Debenham Tewson (agents for BP Properties Ltd) about archaeological implications. The building was demolished before any proper archaeological recording could take place.",
        "evidence": [{"url": "https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301361628", "title": "WalesHER Record", "type": "HER"}]
    },
    {
        "id": f"E{eid+5:03d}",
        "year": "1979",
        "subject": "Roman Villa Discovery and Destruction (1979)",
        "content": "Emergency excavations by GGAT in April-May 1979 uncovered a Roman villa at Great House Farm (NPRN 400051). The villa had a hypocaust system, sunken cold plunge bath, painted plaster walls, and tessellated mosaic flooring. It dated from the 2nd-4th century AD. A skeleton of a Romano-British family was found. Despite a last-minute bid to save it, the site was destroyed for housing development of flats named Corinthian Close and Tuscan Close.",
        "evidence": [{"url": "https://coflein.gov.uk/en/site/400051", "title": "Coflein Record for Roman Villa", "type": "NMR"}, {"url": "https://en.wikipedia.org/wiki/Llandough,_Penarth", "title": "Wikipedia Article", "type": "Reference"}]
    },
    {
        "id": f"E{eid+6:03d}",
        "year": "1994",
        "subject": "Archwilio HER — Early Christian Cemetery GGAT02272s",
        "content": "The Archwilio HER record for the Early Christian Cemetery at Great House Farm (GGAT02272s) documents 105 sherds of Roman pottery from stratified contexts, a 1st-century AD Colchester-derivative brooch found in a burial, hobnails evidencing Roman burial traditions, Roman coins of AD 330-350 in multiple graves, and imported Bii amphorae (AD 475-550). The report states: 'The possibility of the post-Roman cemetery having Roman origins cannot easily be dismissed.'",
        "evidence": [{"url": "https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02272s", "title": "Archwilio HER GGAT02272s", "type": "HER"}]
    },
    {
        "id": f"E{eid+7:03d}",
        "year": "1984",
        "subject": "Missing Deed of Transfer — Cardiff Library (1984)",
        "content": "The 'Deed of Transfer between Daniel Thomas and Bute Estate,' along with the index card, was held at Cardiff Library's local history section. In 1984 — three years before the Court of Appeal case and four years before demolition — these documents went missing. The deed documented the equitable title arrangement that established the Williams family's claim to Great House Farm. The timing of the disappearance is notable as it prevented the family from producing crucial evidence in the 1985-1987 proceedings.",
        "evidence": [{"url": "https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html", "title": "The Great House Farm Story blog", "type": "Narrative"}]
    },
]

eid_counter = eid

# Process additional_evidence first (they use inline eid..eid+7 values for IDs)
for ae in additional_evidence:
    evidence_list.append(ae)
    eid_counter += 1

# Now eid_counter = eid + len(additional_evidence) = 40, correct starting point for new entries

# New evidence entries from comprehensive web research (June 2026)
new_research_evidence = [
    {
        "id": f"E{eid_counter:03d}",
        "year": "1891",
        "subject": "People's Collection Wales / NLW — Great House Farm Photographs",
        "content": "Three known photographs of Great House Farm held by the National Library of Wales via People's Collection Wales: (1) External view of the farmhouse with barn, showing a Chapel Sale of Work event with a chute slide and refreshment tent (undated, c.1900-1930); (2) Tree planting at Llandough, Great House Farm, showing John Williams (grandfather) planting trees on the land to prove ownership (undated, c.1890s); (3) Additional tree planting photograph. A fourth photograph exists on Wikipedia Commons showing the farmhouse exterior with whitewashed stone walls and slate roof before demolition, with St Dochdwy's churchyard wall visible. The Cowbridge History Society holds a photo of the farm from 1891.",
        "evidence": [{"url": "https://www.peoplescollection.wales/items/871431", "title": "Photo: Chapel Sale at Great House Farm", "type": "Photograph"}, {"url": "https://www.peoplescollection.wales/items/871416", "title": "Photo: Tree planting by John Williams", "type": "Photograph"}, {"url": "https://www.peoplescollection.wales/collections/1230311", "title": "Cowbridge History Society album", "type": "Collection"}, {"url": "https://en.wikipedia.org/wiki/Llandough,_Penarth#/media/File:Great_House_Farm,_Llandough.jpg", "title": "Wikipedia Commons: Farmhouse before demolition", "type": "Photograph"}]
    },
    {
        "id": f"E{eid_counter+1:03d}",
        "year": "2004",
        "subject": "ADS Archaeology Data Service — Llandough Excavation Archive (10.5284/1000252)",
        "content": "Full excavation archive of the Early Medieval Monastic Cemetery at Llandough, Glamorgan, published by the Archaeology Data Service (ADS). Contains the complete Holbrook & Thomas (2005) excavation report, stratigraphic data, finds catalogues, and osteological analysis by Dr Louise Loe. Funded by Cadw: Welsh Historic Monuments for post-excavation analysis. DOI: 10.5284/1000252. The ADS archive states: 'Following completion of the fieldwork, post-excavation analysis was generously funded by Cadw, whilst the human bones were analysed by Dr Louise Loe as part of a PhD scholarship from the University of Bristol.'",
        "evidence": [{"url": "https://archaeologydataservice.ac.uk/archives/view/llandough_cadw_2004/", "title": "ADS Archive: Llandough Excavation", "type": "Archive"}, {"url": "https://doi.org/10.5284/1000252", "title": "DOI: 10.5284/1000252", "type": "DOI"}]
    },
    {
        "id": f"E{eid_counter+2:03d}",
        "year": "2005",
        "subject": "National Museum Wales — Early Medieval Human Remains Collection",
        "content": "National Museum Wales holds human remains from the Great House Farm, Llandough excavation (1994) in its collections. Accession record: 'Early Medieval human remains from the cemetery at Great House Farm, Llandough. Grid Ref: ST 1681 7331. Collection Method: Excavation, 1994.' The collection includes multiple skeletons from the 1,026 burials excavated by Cotswold Archaeological Trust. Also held at National Museum Wales: medieval ironwork from the same site.",
        "evidence": [{"url": "https://museum.wales/collections/online/object/878c562b-e638-3462-b87c-a24ee36b3566/Early-Medieval-human-remains/", "title": "NMW Collection: Human Remains", "type": "Museum"}]
    },
    {
        "id": f"E{eid_counter+3:03d}",
        "year": "2003",
        "subject": "GGAT Early Medieval Ecclesiastical Sites Report for Cadw — Grade A Classification",
        "content": "Dr Edith Evans' report for Cadw (GGAT Report 2003/030) classifies early medieval ecclesiastical sites across Wales. Llandough-juxta-Penarth is listed as a Grade A (nationally important) early medieval ecclesiastical site. The report states: 'The developed cemeteries are Llandough-juxta-Penarth (Thomas and Holbrook 1994)… The excavated area of the Llandough cemetery, immediately to the north of St Dochdwy's church, contained by far the largest number of burials (858)… The prime example here is Llandough, where the church (PRN 00075s) lies immediately adjacent to the villa (PRN 00768s) and the cemetery has been shown to have originated in the late Roman period but to have its main floruit in the Early Medieval period.' This confirms the site is of national importance, yet the farmhouse was demolished without heritage protection 15 years earlier.",
        "evidence": [{"url": "https://www.ggat.org.uk/cadw/churches/pdfs/GGAT%2073%20Early%20Medieval%20Ecclesistical%20Sites%20Yr1.pdf", "title": "GGAT Report 2003/030 for Cadw", "type": "PDF"}]
    },
    {
        "id": f"E{eid_counter+4:03d}",
        "year": "1974",
        "subject": "Press and TV Campaign Against Eviction of Mary Williams (Autumn 1974)",
        "content": "Following Judge Watkin Powell's order in 1974, a significant press and television campaign broke out in South Wales against the threatened eviction of Mary Williams from Great House Farm. The Court of Appeal judgment records at paragraph 12: 'as soon as Judge Watkin Powell's order was known, a press campaign broke out in South Wales, with some support on television, against the threatened eviction of Mrs Buckler. Mrs Buckler was described as an elderly widow, confined to a wheelchair, who was being thrown out of the cottage her family had occupied for centuries, so that the historic cottage could be bulldozed to the ground and developers could build executive houses on the site.' This confirms the case had significant public visibility in the South Wales Echo, Western Mail, and HTV/BBC Wales.",
        "evidence": [{"url": "https://www.bailii.org/ew/cases/EWCA/Civ/1987/2.html", "title": "BP v Buckler [1987] EWCA Civ 2, para 12", "type": "Judgment"}, {"url": "https://www.newspapers.com/paper/south-wales-echo/29489/", "title": "South Wales Echo (1901-1999) on Newspapers.com", "type": "Archive"}]
    },
]

for nre in new_research_evidence:
    evidence_list.append(nre)
    eid_counter += 1

# ============================================================
# ADDITIONAL TIMELINE ENTRIES (from primary research)
# ============================================================

additional_timeline_entries = [
    {"year": "1897", "location": "Great House Farm / Lavernock Point", "description": "Guglielmo Marconi stays at Great House Farm. Williams family transports him and equipment by horse and cart to Lavernock Point for first wireless communication over open sea (Lavernock Point to Flat Holm, 8.7 miles/14km).", "narration": "Guglielmo Marconi slept at Great House Farm in a four-poster bed in May 1897 while conducting his wireless telegraphy experiments. Between 11-13 May 1897, the Williams family rode Marconi and his equipment by horse and cart to Lavernock Point to conduct his famous experiment — the first wireless communication over open sea.", "sources": ["https://en.wikipedia.org/wiki/Llandough,_Penarth", "https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html"]},
    {"year": "1915", "location": "Great House Farm / Grangetown", "description": "Daniel Thomas dies. Bute Estates attempts to evict Williams family but drops case when family proves equitable title.", "narration": "Daniel Thomas, a quarryman in Grangetown who had obtained equitable title from Bute Estate in exchange for his own land in Llandaff, died in 1915. Bute Estates attempted to evict the Williams family from Great House Farm but the family proved they were the equitable title holders and the case was dropped immediately.", "sources": ["https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html"]},
    {"year": "1950s", "location": "Great House Farm", "description": "Land deeds stolen from blanket box. Water supply denied by Cardiff Corporation under Western Ground Rents influence.", "narration": "Gregory Joy (Western Ground Rents estate agent) persuaded Esther Williams to support a man named 'Bruce', an itinerant alcoholic. Bruce was given work and accommodation at the farm but soon left, stealing the contents of the farm's blanket box which contained the land deeds. Western Ground Rents also used influence to persuade Cardiff Corporation to deny Great House Farm a water supply; the dairy herd was depleted by cattle drowning in the River Ely seeking water.", "sources": ["https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html"]},
    {"year": "1963", "location": "Great House Farm", "description": "First archaeological excavation on site by Barry and Vale Archaeological Group. Corner of substantial 12th-13th century house uncovered.", "narration": "The Barry and Vale Archaeological Group conducted the first recorded excavation on the Great House Farm site. They uncovered the corner of a substantial 12th- or 13th-century house, along with a gully containing three human skeletons of possible 13th-century date. This was the first indication of the site's medieval archaeological significance.", "sources": ["https://docslib.org/doc/9237348/an-early-medieval-monastic-cemetery-at-llandough-glamorgan-excavations-in-1994"]},
    {"year": "1979", "location": "Great House Farm", "description": "Roman villa discovered and excavated by GGAT. Villa had hypocaust, sunken bath, mosaic floors. Destroyed for housing development.", "narration": "Emergency excavations by Glamorgan-Gwent Archaeological Trust (GGAT) in April-May 1979 uncovered a previously unrecorded Roman villa at Great House Farm (NPRN 400051). The villa included at least five rooms, a hypocaust system, a cold plunge bath complex, tessellated mosaic flooring, painted plaster walls, and Pennant sandstone roof tiles. A skeleton of a Romano-British family was found on the site. Despite a last-minute campaign to save it, the villa was destroyed and flats (Corinthian Close and Tuscan Close) were built on the site.", "sources": ["https://coflein.gov.uk/en/site/400051", "https://en.wikipedia.org/wiki/Llandough,_Penarth"]},
    {"year": "1974", "location": "Great House Farm / Cardiff County Court", "description": "1,700-signature preservation petition; BP issues unilateral licence letters; Mary refuses: 'It's my land. It's not your permission to give.'", "narration": "1,700 people signed a petition for the preservation of Great House Farm. Meanwhile, BP Pension Trust Ltd obtained leave to execute the 1962 possession order. On 31 October 1974, BP wrote letters to Mary Williams (addressed as 'Mrs Buckler') granting her a rent-free licence to remain in the farmhouse for life. Mary Williams replied: 'It's my land. It's not your permission to give.' The letters were sent to her solicitor and received on 4 November 1974. A press campaign broke out in South Wales against the threatened eviction. These letters became the central legal basis for the 1987 Court of Appeal ruling that ended adverse possession.", "sources": ["http://www.bailii.org/ew/cases/EWCA/Civ/1987/2.html", "https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html"]},
    {"year": "1980", "location": "House of Commons", "description": "Ted Rowlands MP condemns BP Pension Fund as 'rapacious' and 'unfeeling' in Parliament.", "narration": "Edward 'Ted' Rowlands MP spoke during the Leasehold Reform Act amendments debate in the House of Commons. He described Western Ground Rents and the BP Pension Fund as 'the most rapacious ground landlord' and said it was 'regrettable that a distinguished company, which is half owned by the Government, should behave in that way.' Hansard HC Deb 22 May 1980 vol 985 cc723-65.", "sources": ["https://hansard.parliament.uk/Commons/1980-05-22"]},
    {"year": "1984", "location": "Cardiff Library", "description": "Copies of the deed of transfer from Bute Estate to Daniel Thomas go missing from Cardiff Library.", "narration": "The deed of transfer from Bute Estate to Daniel Thomas — the document establishing the equitable title arrangement for the Williams family — along with the index card went missing from Cardiff Library's local history section. Their removal occurred three years before the Court of Appeal case and four years before demolition, preventing the family from producing this crucial evidence.", "sources": ["https://unitedtechnocracy.blogspot.com/2012/08/the-great-house-farm-story.html"]},
    {"year": "1990", "location": "Great House Farm", "description": "GGAT evaluates site with 8 trenches. Designated 'medium-high archaeological potential.'", "narration": "Following the demolition, Glamorgan-Gwent Archaeological Trust (GGAT) excavated eight evaluation trenches across the proposed development area. The site was designated as being of 'medium-high archaeological potential.' Despite this, full planning permission granted in March 1992 contained no condition requiring further archaeological work.", "sources": ["https://docslib.org/doc/9237348/an-early-medieval-monastic-cemetery-at-llandough-glamorgan-excavations-in-1994"]},
    {"year": "1992", "location": "Great House Farm", "description": "Full planning permission granted for residential development with NO archaeological condition.", "narration": "Full planning permission was obtained for the residential development of the Great House Farm site. Despite GGAT's 1990 evaluation designating the site of 'medium-high archaeological potential,' the planning permission contained no condition requiring further archaeological work. The developer, Ideal Homes Wales Ltd, voluntarily sponsored the 1994 excavation.", "sources": ["https://docslib.org/doc/9237348/an-early-medieval-monastic-cemetery-at-llandough-glamorgan-excavations-in-1994"]},
    {"year": "1994", "location": "Great House Farm", "description": "Cotswold Archaeology excavates monastic cemetery. 1,026 burials found — largest Early Christian cemetery excavation in Wales.", "narration": "Cotswold Archaeological Trust (CAT, now Cotswold Archaeology) commissioned by Ideal Homes Wales Ltd to excavate the site. Originally planned for 0.1 ha, expanded to 0.22 ha. Work ceased September 1994. Total: 1,026 inhumation burials (814 excavated + 212 disarticulated bone groups). Burials dated from 4th-12th century AD. The excavation extended when it became clear the site contained numerous burials beyond the agreed area. Total cost to developer increased more than fivefold from original budget.", "sources": ["https://sci-hub.ru/10.1179/007660905x54044", "https://cotswoldarchaeology.co.uk/wp-content/uploads/2011/07/llandough-pdf-1.pdf"]},
    {"year": "1998", "location": "Great House Farm / Cardiff", "description": "Cadw funds post-excavation stratigraphic analysis. Louise Loe begins PhD osteological study of 801 skeletons.", "narration": "Cadw: Welsh Historic Monuments provided funding for full stratigraphic analysis of the 1994 excavation. The Ancient Monuments Board for Wales discussed the desirability of full post-excavation analysis. National Museums & Galleries of Wales agreed to produce artefact reports. Louise Loe began her PhD scholarship at Bristol University's Rheumatology Unit for osteological examination of the 801 skeletons.", "sources": ["https://docslib.org/doc/9237348/an-early-medieval-monastic-cemetery-at-llandough-glamorgan-excavations-in-1994"]},
    {"year": "2005", "location": "Academic Publication", "description": "Holbrook & Thomas and Knight papers published in Medieval Archaeology XLIX — 11 years after excavation.", "narration": "The definitive excavation report by Neil Holbrook and Alan Thomas was published in Medieval Archaeology XLIX (2005), pp. 1-92 — eleven years after the 1994 excavation. The companion paper by Jeremy Knight, 'From Villa to Monastery: Llandough in Context,' appeared in the same volume. The delay was attributed to funding constraints: the developer had already increased their contribution more than fivefold to cover excavation costs and could not legitimately be asked to bear further costs.", "sources": ["https://sci-hub.ru/10.1179/007660905x54044", "https://sci-hub.ru/10.1179/007660905x54053"]},
    {"year": "2026", "location": "Ministry of Defence / WhatDoTheyKnow", "description": "Sion Buckler files FOI to MOD about SAS involvement in 1988 eviction. MOD responds but document not made public.", "narration": "Sion Buckler (Ret'd Sgt, Manor of Llandough) filed a Freedom of Information request to the Ministry of Defence on 1 May 2026, asking about any involvement of UK Armed Forces personnel, including UK Special Forces (e.g. SAS), in the 1988 eviction. The request referenced up to 30 police officers and described it as an 'SAS-style operation.' The MOD responded on 29 May 2026 with reference FOI2026.09019, attaching a response document. The content of the response is not publicly viewable.", "sources": ["https://www.whatdotheyknow.com/request/1988_dispossession_of_great_hous"]},
    {"year": "1830", "location": "Great House Farm", "description": "David Thomas of Great House Farm recorded in family history notes. First-person account of 19th-century farming life in the Vale of Glamorgan.", "narration": "David Thomas of Great House Farm, Llandough, is documented in the notes of his granddaughter, Mrs Mary Ellis Joshua, titled 'My Childhood: Glimpses into Life Amongst the Farming Community in the Vale of Glamorgan [c. 1830] as related to me by my paternal grandfather Mr David Thomas of Great House Farm, Llandough, nr. Cowbridge' (1975). The document is held at the Cowbridge and District Local History Society and referenced in NLW/GENUKI records.", "sources": ["https://www.genuki.org.uk/big/wal/GLA/LlandoughJuxtaCowbridge"]},
    {"year": "1891", "location": "Great House Farm", "description": "Earliest known photograph of Great House Farm taken. Cowbridge History Society holds the image in its archives.", "narration": "The earliest known photograph of Great House Farm, taken in 1891, is held in the Cowbridge History Society archives via People's Collection Wales. Additional photographs from the late 19th to early 20th century show: (1) John Williams planting trees to prove land ownership; (2) A chapel sale of work event on the farm grounds with a chute slide and refreshment tent.", "sources": ["https://www.peoplescollection.wales/collections/1230311", "https://www.peoplescollection.wales/items/871431", "https://www.peoplescollection.wales/items/871416"]},
    {"year": "2003", "location": "Cadw / GGAT", "description": "GGAT classifies Llandough-juxta-Penarth as Grade A (nationally important) early medieval ecclesiastical site in report for Cadw.", "narration": "Dr Edith Evans' report for Cadw (GGAT Report 2003/030) classifies early medieval ecclesiastical sites across Wales. Llandough-juxta-Penarth is listed as Grade A — the highest category, denoting national importance. The report states: 'The developed cemeteries are Llandough-juxta-Penarth (Thomas and Holbrook 1994)… The excavated area of the Llandough cemetery, immediately to the north of St Dochdwy's church, contained by far the largest number of burials (858)… The prime example here is Llandough.'", "sources": ["https://www.ggat.org.uk/cadw/churches/pdfs/GGAT%2073%20Early%20Medieval%20Ecclesistical%20Sites%20Yr1.pdf"]},
    {"year": "2004", "location": "Archaeology Data Service", "description": "ADS publishes full excavation archive of the Llandough monastic cemetery online, funded by Cadw.", "narration": "The Archaeology Data Service published the complete excavation archive for the Early Medieval Monastic Cemetery at Llandough, Glamorgan (DOI: 10.5284/1000252). The archive includes the full Holbrook & Thomas (2005) excavation report, stratigraphic data, finds catalogues, and osteological analysis by Dr Louise Loe. The ADS states that 'post-excavation analysis was generously funded by Cadw, whilst the human bones were analysed by Dr Louise Loe as part of a PhD scholarship from the University of Bristol.'", "sources": ["https://archaeologydataservice.ac.uk/archives/view/llandough_cadw_2004/", "https://doi.org/10.5284/1000252"]},
    {"year": "1975", "location": "Cowbridge", "description": "Mrs Mary Ellis Joshua completes family history notes documenting her grandfather David Thomas' life at Great House Farm, c.1830.", "narration": "Mrs Mary Ellis Joshua, granddaughter of David Thomas of Great House Farm, completed a manuscript of family history notes titled 'My Childhood: Glimpses into Life Amongst the Farming Community in the Vale of Glamorgan [c. 1830].' The manuscript provides a rare first-person account of life at the farm in the early 19th century, as told to her by her grandfather. The document is held by the Cowbridge and District Local History Society.", "sources": ["https://www.genuki.org.uk/big/wal/GLA/LlandoughJuxtaCowbridge"]},
]

# Insert additional timeline entries at appropriate chronological positions
def timeline_sort_key(e):
    y = e.get("year", "0")
    if y.isdigit():
        return (0, int(y))
    return (1, y)

for ate in additional_timeline_entries:
    timeline_entries.append(ate)
timeline_entries.sort(key=timeline_sort_key)

print(f"  Loaded {len(evidence_list)} evidence entries ({len(additional_evidence) + len(new_research_evidence)} from research)")
print(f"  Loaded {len(timeline_entries)} timeline entries ({len(additional_timeline_entries)} from research)")
print(f"  Loaded {len(research_files)} research files")

# ============================================================
# HTML SKELETON
# ============================================================

def page_html(title, content, description=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{h(title)} — BP vs Buckler</title>
    <meta name="description" content="{h(description or title)}">
    <style>{CSS}</style>
    <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

<header>
    <div class="container">
        <h1><a href="/">BP vs Buckler</a></h1>
        <nav>
            <a href="/start-here.html">Start Here</a>
            <a href="/summary.html">Summary</a>
            <a href="/timeline.html">Timeline</a>
            <a href="/evidence.html">Evidence</a>
            <a href="/issues.html">Issues</a>
            <a href="/contradictions.html">Contradictions</a>
            <a href="/questions.html">Questions</a>
            <a href="/dossier.html">Dossier</a>
        </nav>
    </div>
</header>

<main class="container">
    <div class="nav-breadcrumb">
        <a href="/">Home</a> / {h(title)}
    </div>
    {content}
</main>

<footer>
    <div class="container">
        <p>BP vs Buckler — Great House Farm (Ty Mawr) Historical Evidence Repository</p>
        <p><a href="/start-here.html">Start Here</a> | <a href="/summary.html">Summary</a> | <a href="/timeline.html">Timeline</a> | <a href="/evidence.html">Evidence</a> | <a href="/issues.html">Issues</a> | <a href="/contradictions.html">Contradictions</a> | <a href="/questions.html">Questions</a> | <a href="/dossier.html">Dossier</a></p>
        <p><a href="/api/timeline.json">API: Timeline</a> | <a href="/api/evidence.json">API: Evidence</a> | <a href="/api/issues.json">API: Issues</a></p>
        <p>&copy; {date.today().year} DATRO Consortium Ltd. This is a historical evidence repository compiled in the public interest.</p>
    </div>
</footer>

</body>
</html>"""

# ============================================================
# PAGE 1: /start-here.html (Entry Point)
# ============================================================

def generate_start_here():
    print("Generating start-here.html...")
    content = """
    <h1>Start Here: The Great House Farm Dispute</h1>

    <div class="card" style="border-left: 4px solid #f59e0b;">
        <h3>Quick Summary</h3>
        <p>This site documents the <strong>BP Properties Ltd v Buckler [1987]</strong> case — a dispute over Great House Farm (Ty Mawr), Llandough, where the Williams-Buckler family's 321-year occupation was terminated through a contested legal process involving alleged identity fraud, missing title deeds, and the demolition of an 800-year-old farmhouse.</p>
    </div>

    <h2>What Happened</h2>
    <p>The Williams family acquired Great House Farm in 1667 and occupied it continuously for over three centuries. In 1974, BP sent unilateral "Licence to Occupy" letters addressed to "Mrs Buckler" — a name Mary Williams never used. This licence was later used by the courts to defeat the family's adverse possession claim. In 1987, the Court of Appeal granted BP possession. In 1988, Great House Farm was demolished by BP Properties Ltd amid considerable local controversy.</p>

    <h2>Why It Matters</h2>
    <ul>
        <li><strong>Ownership was never determined</strong> — Courts ruled on possession without ever adjudicating who actually owned the land</li>
        <li><strong>Identity substitution</strong> — Mary Williams was referred to as "Mrs Buckler" in legal documents despite never adopting that name</li>
        <li><strong>Missing evidence</strong> — Title deeds were reportedly removed from Cardiff Library in 1984</li>
        <li><strong>Archaeological suppression</strong> — A Roman soldier discovery in 1870 was ignored; the 1994 excavation later found over 800 burials</li>
        <li><strong>Judicial contradiction</strong> — The court said BP companies were "different" and "same" depending on which argument helped BP</li>
    </ul>

    <h2>What Evidence Exists</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin: 15px 0;">
        <div class="card">
            <h3><a href="/evidence.html#E004">E004 — BP Licence Letters (1974)</a></h3>
            <p>BP sends "Licence to Occupy" addressed to "Mrs Buckler" — identity fraud alleged</p>
        </div>
        <div class="card">
            <h3><a href="/evidence.html#E007">E007 — Court of Appeal Judgment (1987)</a></h3>
            <p>BP Properties Ltd v Buckler [1987] EWCA Civ 2 — the basis of eviction</p>
        </div>
        <div class="card">
            <h3><a href="/evidence.html#E008">E008 — HER Record GGAT02038s</a></h3>
            <p>Official record confirms demolition by BP Properties Ltd on 6 Dec 1988</p>
        </div>
        <div class="card">
            <h3><a href="/evidence.html#E001">E001 — 1667 Acquisition</a></h3>
            <p>Williams family acquires Great House Farm from the Herberts</p>
        </div>
    </div>

    <h2>What Questions Remain</h2>
    <ul>
        <li>Who actually owned Great House Farm in 1987?</li>
        <li>Where are the original title deeds removed from Cardiff Library in 1984?</li>
        <li>Why did the court avoid determining ownership?</li>
        <li>Was the "Mrs Buckler" identity substitution deliberate fraud?</li>
        <li>Why was the 1916 tenancy agreement never produced?</li>
        <li>What role did Frederick Buckler's secret dealings play?</li>
        <li>Why was Cadw's emergency listing process stalled?</li>
    </ul>

    <h2>Explore the Site</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin: 15px 0;">
        <div class="card">
            <h3><a href="/summary.html">Case Summary</a></h3>
            <p>Overview of the dispute, key parties, dates, and evidence</p>
        </div>
        <div class="card">
            <h3><a href="/timeline.html">Master Timeline</a></h3>
            <p>Chronological events from 1100 to present day</p>
        </div>
        <div class="card">
            <h3><a href="/evidence.html">Evidence Catalogue</a></h3>
            <p>All documents with IDs, descriptions, and transcriptions</p>
        </div>
        <div class="card">
            <h3><a href="/issues.html">Claim-to-Evidence Mapping</a></h3>
            <p>Five key issues with supporting evidence and open questions</p>
        </div>
        <div class="card">
            <h3><a href="/contradictions.html">Contradictions Index</a></h3>
            <p>Documented contradictions in the legal case</p>
        </div>
        <div class="card">
            <h3><a href="/questions.html">Open Questions</a></h3>
            <p>Unresolved questions with known and unknown facts</p>
        </div>
        <div class="card">
            <h3><a href="/dossier.html">Research Dossier</a></h3>
            <p>Complete printable dossier for download/PDF</p>
        </div>
    </div>

    <p style="margin-top: 30px;"><strong>Estimated reparations claim (Feb 2026):</strong> £101.2 million and counting.</p>
    """
    write_file(f"{DST_DIR}/start-here.html", page_html("Start Here", content, "Entry point for the BP vs Buckler Great House Farm dispute evidence repository"))

# ============================================================
# PAGE 2: /summary.html (Case Summary)
# ============================================================

def generate_summary():
    print("Generating summary.html...")
    content = """
    <h1>Case Summary: BP Properties Ltd v Buckler</h1>

    <div class="card">
        <h3>Case Reference</h3>
        <p><strong>BP Properties Ltd v Buckler</strong> [1987] EWCA Civ 2<br>
        Court of Appeal (Civil Division) — 31 July 1987<br>
        Presiding Judge: Dillon LJ</p>
    </div>

    <h2>Key Parties</h2>
    <ul>
        <li><strong>Williams/Buckler Family</strong> — Occupiers of Great House Farm since 1667. Mary Williams (the last Williams heir) married Frederick Buckler but retained her maiden name. Her children and grandchildren continued the claim.</li>
        <li><strong>BP Properties Ltd</strong> — Claimant. Registered proprietor of Great House Farm from November 1982. Part of the BP corporate group.</li>
        <li><strong>BP Pension Trust Ltd</strong> — Predecessor in title. Issued the 1974 licence letters. The court treated this entity as both "different from" and "the same as" BP Properties at different points.</li>
        <li><strong>Bute Estate</strong> — The Marquess of Bute (and predecessors) held the freehold from early C19th until the 20th century. Imposed the 1916 tenancy on John Williams.</li>
        <li><strong>Western Ground Rents Ltd</strong> — Acquired the reversion in 1938. Sold to BP Pension Trust in 1969.</li>
    </ul>

    <h2>Key Dates</h2>
    <table>
        <tr><th>Date</th><th>Event</th></tr>
        <tr><td>1667</td><td>Williams family acquires Great House Farm from the Herberts</td></tr>
        <tr><td>1870</td><td>Roman soldier discovered beneath farmhouse floor</td></tr>
        <tr><td>1916</td><td>Bute Estate imposes yearly agricultural tenancy on John Williams</td></tr>
        <tr><td>1938</td><td>Reversion sale to Western Ground Rents (Mountjoy interests)</td></tr>
        <tr><td>1969</td><td>Great House Farm sold to BP Pension Trust Ltd</td></tr>
        <tr><td>1974</td><td>BP issues unilateral "Licence to Occupy" letters to "Mrs Buckler"</td></tr>
        <tr><td>1982</td><td>BP Properties Ltd registered as proprietor at HM Land Registry (Nov 1982)</td></tr>
        <tr><td>1984</td><td>Title deeds reportedly removed from Cardiff Library</td></tr>
        <tr><td>1986</td><td>Queen's Bench Division (Hollis J) rules against Bucklers (24 July 1986)</td></tr>
        <tr><td>1987</td><td>Court of Appeal dismisses appeal — BP Properties Ltd v Buckler [1987] EWCA Civ 2 (31 July 1987)</td></tr>
        <tr><td>1988</td><td>Armed eviction (November); Great House Farm demolished (6 December 1988)</td></tr>
        <tr><td>1994</td><td>Major excavation reveals Roman villa and over 800 burials</td></tr>
        <tr><td>2026</td><td>Reparations claim estimated at £101.2M; FOI requests submitted</td></tr>
    </table>

    <h2>Principal Documentary Evidence</h2>
    <table>
        <tr><th>ID</th><th>Document</th><th>Date</th><th>Significance</th></tr>
        <tr><td><span class="evidence-id">E001</span></td><td><a href="/evidence.html#E001">1667 Acquisition Record</a></td><td>1667</td><td>Williams family acquires Great House Farm from Herberts</td></tr>
        <tr><td><span class="evidence-id">E002</span></td><td><a href="/evidence.html#E002">Marconi Experiments Record</a></td><td>1897</td><td>Marconi stayed at Great House Farm during wireless experiments</td></tr>
        <tr><td><span class="evidence-id">E003</span></td><td><a href="/evidence.html#E003">1916 Forced Tenancy</a></td><td>1916</td><td>Bute Estate imposes yearly agricultural tenancy</td></tr>
        <tr><td><span class="evidence-id">E004</span></td><td><a href="/evidence.html#E004">1974 BP Licence Letters</a></td><td>1974</td><td>Unilateral licence to "Mrs Buckler" — identity fraud alleged</td></tr>
        <tr><td><span class="evidence-id">E005</span></td><td><a href="/evidence.html#E005">1978 Suppressed Article</a></td><td>1978</td><td>Newspaper article + 1,700 signature petition</td></tr>
        <tr><td><span class="evidence-id">E006</span></td><td><a href="/evidence.html#E006">Land Registration (1982)</a></td><td>1982</td><td>BP Properties Ltd registers title — circular logic alleged</td></tr>
        <tr><td><span class="evidence-id">E007</span></td><td><a href="/evidence.html#E007">1987 Court of Appeal Judgment</a></td><td>1987</td><td>BP Properties Ltd v Buckler [1987] EWCA Civ 2</td></tr>
        <tr><td><span class="evidence-id">E008</span></td><td><a href="/evidence.html#E008">HER Record GGAT02038s</a></td><td>1988/2023</td><td>Official HER confirms demolition by BP Properties Ltd</td></tr>
    </table>

    <h2>Main Unresolved Questions</h2>
    <ol>
        <li><strong>Who owned Great House Farm?</strong> No court ever determined ownership. The case was decided on possession alone.</li>
        <li><strong>Was identity fraud committed?</strong> Mary Williams was addressed as "Mrs Buckler" in legal documents despite never adopting that name. The Williams name carried the land claim rights.</li>
        <li><strong>Where are the missing title deeds?</strong> Documents removed from Cardiff Library in 1984 have never been recovered.</li>
        <li><strong>Why was the 1916 tenancy agreement never produced?</strong> The only record of the 1916 tenancy is paragraph 36 of the 1987 judgment.</li>
        <li><strong>Why did Cadw not list the building?</strong> Emergency listing processes were reportedly stalled before the 1988 demolition.</li>
        <li><strong>What did Frederick Buckler secretly settle?</strong> Family accounts suggest Frederick may have negotiated or settled legal matters without informing the family.</li>
        <li><strong>Why did the court use contradictory logic on corporate identity?</strong> The court treated BP Pension Trust and BP Properties as "different" to block one claim and "same" to block another.</li>
    </ol>
    """
    write_file(f"{DST_DIR}/summary.html", page_html("Case Summary", content, "Summary of the Great House Farm BP vs Buckler dispute"))

# ============================================================
# PAGE 3: /timeline.html (Master Timeline)
# ============================================================

def generate_timeline():
    print("Generating timeline.html...")
    rows = []
    for entry in timeline_entries:
        year = entry.get("year", "")
        location = entry.get("location", "")
        narration = entry.get("narration", "")
        sources = entry.get("sources", [])

        # Build year display
        year_display = year.replace("_", " ").title() if year else ""

        # Build source links
        source_links = ""
        if sources:
            src_list = []
            for s in sources:
                if s.startswith("http"):
                    src_list.append(f'<a href="{h(s)}" target="_blank">[Source]</a>')
                else:
                    src_list.append(f'<span style="color:#94a3b8;">{h(s)}</span>')
            source_links = " ".join(src_list)

        doc_ref = f"<a href='/evidence.html'>Evidence</a>" if narration else ""

        rows.append(f"""
        <tr>
            <td style="white-space:nowrap;"><span class="year-marker">{h(year_display)}</span></td>
            <td>{h(location)}</td>
            <td>{h(narration[:200])}{'...' if len(narration) > 200 else ''}</td>
            <td>{doc_ref}</td>
            <td>{source_links}</td>
        </tr>""")

    # Build evidence-driven timeline rows
    evidence_rows = []
    for ev in evidence_list:
        evidence_rows.append(f"""
        <tr>
            <td style="white-space:nowrap;"><span class="year-marker">{h(ev['year'])}</span></td>
            <td>—</td>
            <td><a href="/evidence.html#{ev['id']}">{h(ev['subject'][:200])}</a></td>
            <td><span class="evidence-id">{h(ev['id'])}</span></td>
            <td><a href="/evidence.html#{ev['id']}">View Evidence</a></td>
        </tr>""")

    all_rows = "\n".join(rows) + "\n" + "\n".join(evidence_rows)

    content = f"""
    <h1>Master Timeline</h1>
    <p>Complete chronological account of the Great House Farm dispute, from medieval origins to present day. Each event links to supporting evidence where available.</p>

    <div class="card" style="margin-bottom:20px;">
        <p style="margin:0;"><strong>{len(timeline_entries)}</strong> timeline entries from <strong>{timeline_entries[0].get('year', 'N/A') if timeline_entries else 'N/A'}</strong> to <strong>{timeline_entries[-1].get('year', 'N/A') if timeline_entries else 'N/A'}</strong>, plus <strong>{len(evidence_list)}</strong> evidence entries.</p>
    </div>

    <div style="overflow-x:auto;">
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Event</th>
                <th>Document Reference</th>
                <th>Source / Link</th>
            </tr>
        </thead>
        <tbody>
            {all_rows}
        </tbody>
    </table>
    </div>
    """
    write_file(f"{DST_DIR}/timeline.html", page_html("Master Timeline", content, "Complete chronological timeline of the Great House Farm dispute"))

# ============================================================
# PAGE 4: /evidence.html (Evidence Catalogue)
# ============================================================

def generate_evidence():
    print("Generating evidence.html...")
    sections = []
    for ev in evidence_list:
        # Build evidence links
        ev_links = ""
        for link in ev.get("evidence", []):
            url = link.get("url", "")
            title = link.get("title", "Link")
            link_type = link.get("type", "")
            type_badge = f'<span class="badge badge-blue">{h(link_type)}</span>' if link_type else ""
            if url:
                if url.startswith("http"):
                    ev_links += f'<li>{type_badge} <a href="{h(url)}" target="_blank">{h(title)}</a></li>'
                else:
                    ev_links += f'<li>{type_badge} <a href="{h(url)}">{h(title)}</a></li>'

        # Format content text (preserve paragraphs)
        content_text = h(ev['content'])
        content_text = content_text.replace('\\n', '\n')
        paragraphs = content_text.split('\n')
        formatted_content = ""
        for para in paragraphs:
            para = para.strip()
            if para:
                formatted_content += f"<p>{para}</p>"

        sections.append(f"""
        <div class="card" id="{h(ev['id'])}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <h3 style="margin:0;">{h(ev['subject'])}</h3>
                <span><span class="evidence-id">{h(ev['id'])}</span> <span class="year-marker">{h(ev['year'])}</span></span>
            </div>
            <div style="margin-top:10px;">
                {formatted_content}
            </div>
            {f'<h4>Evidence Links</h4><ul>{ev_links}</ul>' if ev_links else ''}
        </div>""")

    # Organize by year
    by_year = {}
    for ev in evidence_list:
        y = ev['year']
        if y not in by_year:
            by_year[y] = []
        by_year[y].append(ev)

    toc_items = []
    for y in sorted(by_year.keys(), key=lambda y: int(y) if y.isdigit() else 9999):
        toc_items.append(f'<a href="#year-{h(y)}" style="margin-right:10px;"><span class="year-marker">{h(y)}</span></a>')

    year_sections = []
    for y in sorted(by_year.keys(), key=lambda y: int(y) if y.isdigit() else 9999):
        year_sections.append(f'<h2 id="year-{h(y)}">{h(y)}</h2>')
        for ev in by_year[y]:
            ev_links = ""
            for link in ev.get("evidence", []):
                url = link.get("url", "")
                title = link.get("title", "Link")
                link_type = link.get("type", "")
                type_badge = f'<span class="badge badge-blue">{h(link_type)}</span>' if link_type else ""
                if url:
                    if url.startswith("http"):
                        ev_links += f'<li>{type_badge} <a href="{h(url)}" target="_blank">{h(title)}</a></li>'
                    else:
                        ev_links += f'<li>{type_badge} <a href="{h(url)}">{h(title)}</a></li>'
            content_text = h(ev['content']).replace('\\n', '\n')
            paragraphs = content_text.split('\n')
            formatted_content = "".join(f"<p>{p.strip()}</p>" for p in paragraphs if p.strip())
            year_sections.append(f"""
            <div class="card" id="{h(ev['id'])}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                    <h3 style="margin:0;">{h(ev['subject'])}</h3>
                    <span><span class="evidence-id">{h(ev['id'])}</span></span>
                </div>
                <div style="margin-top:10px;">{formatted_content}</div>
                {f'<h4>Evidence Links</h4><ul>{ev_links}</ul>' if ev_links else ''}
            </div>""")

    content = f"""
    <h1>Evidence Catalogue</h1>
    <p>Complete catalogue of all evidence documents in the Great House Farm dispute. Each entry has a unique evidence ID, description, and full transcription.</p>

    <div class="card">
        <h3>Jump to Year</h3>
        <p>{' '.join(toc_items)}</p>
    </div>

    <div class="card">
        <h3>Summary</h3>
        <p>{len(evidence_list)} evidence entries spanning from {evidence_list[0]['year'] if evidence_list else 'N/A'} to {evidence_list[-1]['year'] if evidence_list else 'N/A'}. Total of {sum(len(ev.get('evidence', [])) for ev in evidence_list)} linked source documents.</p>
    </div>

    {''.join(year_sections)}
    """
    write_file(f"{DST_DIR}/evidence.html", page_html("Evidence Catalogue", content, "Complete evidence catalogue for the Great House Farm dispute"))

# ============================================================
# PAGE 5: /issues.html (Claim-to-Evidence Mapping)
# ============================================================

def generate_issues():
    print("Generating issues.html...")

    # Build a lookup for evidence by id
    ev_by_id = {}
    # Also build by subject keyword search
    for ev in evidence_list:
        ev_by_id[ev['id']] = ev

    def find_evidence_ids(text):
        """Find evidence IDs referenced in text."""
        ids = re.findall(r'E\d{3}', text)
        return ids

    issues = [
        {
            "id": "issue-ownership",
            "title": "Ownership Claim — Superior Title Never Extinguished",
            "statement": "The Williams family held fee simple absolute title to Great House Farm from 1667. This title was never lawfully sold, surrendered, or extinguished. The 1916 tenancy was imposed by the Bute Estate to manufacture a landlord-tenant relationship where none existed. The 1974 licence letters were an attempt to defeat the family's superior title. No court ever determined who actually owned the land.",
            "supporting": ["E001", "E003", "E004", "E006", "E007"],
            "counter": "BP Properties Ltd held registered title from November 1982. The 1974 licence letter was held by the Court of Appeal to have ended any adverse possession. The Bute Estate's chain of title was traced through successive transactions.",
            "questions": [
                "Did the Williams family ever hold freehold title or only manorial leasehold?",
                "What was the legal nature of the 1667 acquisition?",
                "Did the 1916 tenancy create a landlord-tenant relationship or was it a legal trap?",
                "Can a unilateral, unaccepted licence letter defeat 321 years of continuous occupation?",
                "What title documents did BP submit to HM Land Registry in 1982?"
            ]
        },
        {
            "id": "issue-identity",
            "title": "Identity Fraud — The Fabricated 'Mrs Buckler'",
            "statement": "BP's 1974 licence letters were addressed to 'Mrs Buckler.' However, Mary Williams never adopted the Buckler name; her birth, death, and official records confirm this. The Williams name carried the land claim rights; the fabricated 'Mrs Buckler' name was designed to extinguish her title claim. Prior to 1974, neither Western Ground Rents nor any court referred to her as Mrs Buckler.",
            "supporting": ["E004", "E005", "E007"],
            "counter": "Mary Williams married Frederick Buckler in 1920. Under English law, a married woman's legal name includes her husband's surname. The court accepted 'Mrs Buckler' as her legal married name. The licence letters were addressed to the occupant of the property.",
            "questions": [
                "Was Mary Williams ever legally known as 'Mary Buckler' by any official document?",
                "Why did BP choose to address the licence to 'Mrs Buckler' rather than 'Mary Williams'?",
                "Would Mary Williams have participated in identity fraud had she responded as Mrs Buckler?",
                "Why did the court not investigate the name substitution?"
            ]
        },
        {
            "id": "issue-circular",
            "title": "Land Registry Circular Logic",
            "statement": "BP Properties Ltd registered the property at HM Land Registry in November 1982. The Land Registry has since justified the 1982 registration using the 1987 judgment — effectively putting the 'cart before the horse' to validate a claim that should have been examined at registration. The family's complaint to the Land Registry was turned into a complaint, then dismissed on insufficient grounds, using the official narrative to rebut the dispute of that same narrative.",
            "supporting": ["E006", "E007"],
            "counter": "HM Land Registry registers title based on the documents presented, not by investigating underlying claims. The 1987 Court of Appeal judgment confirmed BP's right to possession, supporting the registered title.",
            "questions": [
                "What documents were submitted to support the 1982 first registration?",
                "Did the Land Registry have notice of the Williams family's adverse possession claim?",
                "Is it procedurally proper to use a later judgment to justify an earlier registration?",
                "What would a proper investigation of the 1982 registration reveal?"
            ]
        },
        {
            "id": "issue-erasure",
            "title": "State-Sanctioned Erasure — Missing Title Deeds",
            "statement": "The 'Deed of Transfer between Daniel Thomas and Bute Estate' and other Williams family deeds were removed from Cardiff Library in 1984. This removed the primary evidentiary pillar of the family's claim. The copy of the title deeds from the public library went missing, handicapping Mary Williams' ability to prove her claim in court. The DRA collection at Glamorgan RO contains Thomas assignments (DRA 418-420, 1906-1907) and Williams family deeds (DRA 5/31), but the crucial Cardiff Library deed copies are missing from that institution.",
            "supporting": ["E006"],
            "counter": "The Cardiff Library deed copies were reference copies, not originals. Their removal does not necessarily indicate deliberate erasure. The original deeds may never have existed in the form claimed by the family. The Glamorgan Record Office holds related documents.",
            "questions": [
                "Who removed the deed copies from Cardiff Library in 1984?",
                "Where are those documents now?",
                "What information did they contain that was not otherwise available?",
                "Why has there been no investigation into their disappearance?",
                "What did the 'Deed of Transfer between Daniel Thomas and Bute Estate' actually say?"
            ]
        },
        {
            "id": "issue-judicial",
            "title": "Judicial Contradiction — Heads BP Wins, Tails the Family Loses",
            "statement": "The 1987 Court of Appeal judgment contained a fundamental contradiction. The same judge ruled that BP Properties and BP Pensions were 'different companies' when the family sought to challenge BP Pension Trust's actions. Yet the same judge treated both companies as effectively 'the same' when dismissing the family's adverse possession claim. This contradiction — 'heads BP win, tails our family lose' — undermines the integrity of the judgment.",
            "supporting": ["E007"],
            "counter": "The court made findings based on the corporate structure presented in evidence. BP Properties Ltd was the registered proprietor and claimant. BP Pension Trust was the predecessor in title that issued the 1974 licence. The court was entitled to treat them as both separate (for procedural purposes) and as a single group (for the effect of the licence).",
            "questions": [
                "Can a judgment be safe when it relies on contradictory characterizations of the same corporate relationship?",
                "Did the court properly consider the distinction between BP Pension Trust and BP Properties?",
                "Would the result have been different if the court had consistently treated the BP entities as either 'same' or 'different'?",
                "Does this contradiction provide grounds to set aside the judgment under the doctrine of mutual exclusivity?"
            ]
        }
    ]

    issue_sections = []
    for iss in issues:
        # Build supporting evidence links
        supp_links = []
        for eid in iss["supporting"]:
            ev = ev_by_id.get(eid)
            if ev:
                supp_links.append(f'<a href="/evidence.html#{eid}"><span class="evidence-id">{eid}</span> {h(ev["subject"][:80])}</a>')

        questions_html = "".join(f"<li>{h(q)}</li>" for q in iss["questions"])

        issue_sections.append(f"""
        <div class="card issue-card" id="{h(iss['id'])}">
            <h3>{h(iss['title'])}</h3>
            <h4>Issue Statement</h4>
            <p>{h(iss['statement'])}</p>

            <h4>Supporting Evidence</h4>
            <ul>{"".join(f"<li>{link}</li>" for link in supp_links)}</ul>

            <h4>Counter-Evidence / Counter-Arguments</h4>
            <p>{h(iss['counter'])}</p>

            <h4>Open Questions</h4>
            <ul>{questions_html}</ul>
        </div>""")

    content = f"""
    <h1>Claim-to-Evidence Mapping</h1>
    <p>Five key issues summarised with supporting evidence, counter-evidence, and open questions. Each issue links directly to the relevant evidence entries.</p>

    {''.join(issue_sections)}
    """
    write_file(f"{DST_DIR}/issues.html", page_html("Claim-to-Evidence Mapping", content, "Five key issues in the Great House Farm dispute mapped to evidence"))

# ============================================================
# PAGE 6: /contradictions.html (Contradictions Index)
# ============================================================

def generate_contradictions():
    print("Generating contradictions.html...")

    contradictions = [
        {
            "num": 1,
            "title": "BP Companies: 'Different' vs 'Same'",
            "doc_a": "1987 Court of Appeal Judgment — When Mary Williams challenged BP Pension Trust's actions, Dillon LJ ruled that BP Pension Trust and BP Properties Ltd were different companies, so the challenge did not apply to the claimant.",
            "doc_b": "1987 Court of Appeal Judgment — When the family argued adverse possession against BP Properties Ltd (the successor in title), the court treated BP Pension Trust and BP Properties as effectively the same, holding that the 1974 licence issued by BP Pension Trust bound BP Properties and defeated the adverse possession claim.",
            "explanation": "The court used 'different companies' to block the family's challenge, and 'same company' to defeat the family's defence. This allowed BP to benefit from both positions — 'heads BP wins, tails the family loses.'"
        },
        {
            "num": 2,
            "title": "'Mrs Buckler' Identity: Accepted Name vs Fabricated Identity",
            "doc_a": "1974 BP Licence Letters — Addressed to 'Mrs Buckler' at Great House Farm, treating this as the lawful occupant's legal name.",
            "doc_b": "Mary Williams' birth, death, and official records — All record her as 'Mary Williams'. She was baptised, married, and buried as Mary Williams. She never adopted the Buckler name in any official capacity.",
            "explanation": "The entire legal case rested on documents addressed to a person ('Mrs Buckler') who did not exist in law. Mary Williams would have had to participate in identity fraud by responding to letters not addressed to her."
        },
        {
            "num": 3,
            "title": "1916 Tenancy: Documented in Judgment Only vs Original Should Exist",
            "doc_a": "BP v Buckler [1987] EWCA Civ 2, paragraph 36 — The only record of the 1916 yearly agricultural tenancy granted to John Williams.",
            "doc_b": "Bute Estate Records — No original tenancy agreement, rental entry, or correspondence survives for the 1916 tenancy. The 1916 date falls in the dead centre of the 1895-1938 documentary gap in the Bute Estate Records.",
            "explanation": "The 1916 tenancy — central to establishing the landlord-tenant relationship — exists only in the 1987 judgment itself. No primary document has ever been produced. The Bute Estate's own records are silent on this tenancy."
        },
        {
            "num": 4,
            "title": "Ownership: Not Adjudicated vs Fundamental to Justice",
            "doc_a": "All court proceedings (1974-1987) — Every court refused to determine ownership of Great House Farm, stating that only possession was before them.",
            "doc_b": "Legal principle — Possession flows from ownership. Without determining ownership, the court cannot know who has the better right to possession. The family's 321-year continuous occupation was never legally evaluated as a title claim.",
            "explanation": "The courts consistently avoided the only question that could have resolved the dispute: who owned Great House Farm? By ruling on possession without ownership, the court created a situation where BP could evict without ever proving they owned the land."
        },
        {
            "num": 5,
            "title": "1974 Licence: Unilateral Grant vs Requires Acceptance",
            "doc_a": "Court of Appeal ruling — The 1974 licence letter, sent unilaterally by BP Pension Trust to 'Mrs Buckler', was held to have ended any adverse possession regardless of whether it was accepted.",
            "doc_b": "Property law principle — A licence (permission to occupy) generally requires the licensee's acceptance to create a binding legal relationship. A letter sent without request or acknowledgment should not alter the legal status of an occupant.",
            "explanation": "The court created a novel legal principle: a unilateral, unsolicited letter can defeat centuries of adverse possession without the recipient's knowledge, consent, or acknowledgment. This principle appears unique to this case."
        },
        {
            "num": 6,
            "title": "Archaeological Evidence: Suppressed vs Discovered Post-Demolition",
            "doc_a": "1870 Williams family discovery — A Roman soldier in full armour found beneath the farmhouse floor was reported but never formally investigated or recorded by authorities.",
            "doc_b": "1994 excavation — After demolition, major excavation uncovered a Roman villa and over 800 burials, confirming the site's national archaeological importance.",
            "explanation": "The family's report of Roman remains in 1870 was ignored. Had it been properly investigated, the site would likely have received statutory protection preventing demolition. The evidence was only confirmed after the house was destroyed."
        },
        {
            "num": 7,
            "title": "1984 Deed Removal: Coincidence vs Deliberate Erasure",
            "doc_a": "Cardiff Library records — The 'Deed of Transfer between Daniel Thomas and Bute Estate' and other Williams family deed copies were held at Cardiff Library's local history section.",
            "doc_b": "1984 — These deed copies were removed from Cardiff Library. Their whereabouts remain unknown. The family was unable to produce them in the 1985-1987 proceedings.",
            "explanation": "The disappearance of crucial evidence in the year before the final hearings, combined with the 1895-1938 Bute Estate documentary gap and the destruction of the farmhouse in 1988, creates a pattern of evidence removal that systematically disadvantaged the Williams-Buckler family."
        },
        {
            "num": 8,
            "title": "1994 Excavation: Wales' Largest Dig vs 11-Year Publication Delay",
            "doc_a": "The 1994 excavation at Great House Farm uncovered 1,026 burials — the largest Early Christian cemetery excavation in Wales. The site was designated 'medium-high archaeological potential' by GGAT in 1990.",
            "doc_b": "The definitive excavation report (Holbrook & Thomas 2005) was published 11 years after the excavation was completed. Cadw funding only arrived in 1998, four years after excavation. The developers had already increased their contribution fivefold to cover burial excavation costs.",
            "explanation": "Despite being the largest excavation of its kind in Wales, the report was delayed by 11 years due to funding constraints. Planning permission was granted without an archaeological condition. The full significance of the site was only understood long after the farmhouse had been demolished and the development site cleared."
        },
        {
            "num": 9,
            "title": "Planning Permission: Medium-High Potential vs No Archaeological Condition",
            "doc_a": "GGAT's 1990 evaluation of the Great House Farm site designated it as being of 'medium-high archaeological potential' after excavating 8 evaluation trenches across the proposed development area.",
            "doc_b": "March 1992: Full planning permission was obtained for the residential development 'with no condition requiring further archaeological work.' The developer only voluntarily sponsored the 1994 excavation.",
            "explanation": "A site designated as having 'medium-high archaeological potential' was granted full planning permission without any requirement for archaeological mitigation. The subsequent excavation found 1,026 burials — the largest Early Christian cemetery in Wales. This suggests the archaeological significance of the site was systematically undervalued or suppressed in the planning process."
        },
        {
            "num": 10,
            "title": "Marconi's Base: Historic Significance vs Heritage Value Ignored",
            "doc_a": "Great House Farm was the base for Guglielmo Marconi's first over-sea wireless transmission in May 1897 — one of the most important experiments in communications history. The Williams family personally transported Marconi and his equipment to Lavernock Point.",
            "doc_b": "This historic significance was never cited in any heritage protection assessment, planning consideration, or legal argument regarding the preservation of the farmhouse. No blue plaque or historic designation was ever applied.",
            "explanation": "The farmhouse's connection to Marconi — a globally significant figure — was apparently never factored into heritage protection decisions. The building was demolished less than a century after one of the most important experiments in communications history was launched from its doorstep."
        },
        {
            "num": 11,
            "title": "Press/TV Campaign (1974) vs No Lasting Heritage Protection",
            "doc_a": "Court of Appeal judgment para 12 — 'a press campaign broke out in South Wales, with some support on television, against the threatened eviction of Mrs Buckler.' 1,700 people signed a petition for the preservation of Great House Farm. The case was covered by South Wales Echo, Western Mail, and HTV/BBC Wales.",
            "doc_b": "Despite this significant public campaign and media attention in 1974, Great House Farm received no listed building status, no scheduled monument protection, and no conservation area designation. The building was demolished 14 years later with no heritage objection recorded in the planning process.",
            "explanation": "A major press and television campaign in 1974 — powerful enough to be recorded in the Court of Appeal judgment — failed to secure any heritage protection for the 800-year-old farmhouse. This suggests either the heritage system failed to act on public concern, or the campaign was deliberately suppressed from influencing the planning process."
        },
        {
            "num": 12,
            "title": "Roman Villa (1979): Emergency Excavation vs Unimpeded Destruction",
            "doc_a": "The 1979 Roman villa discovery at Great House Farm was described as 'uncovered during the construction of residential accommodation.' GGAT conducted emergency excavations in April-May 1979, revealing a villa with hypocaust, mosaic floors, painted plaster walls, and a cold plunge bath. A Romano-British family skeleton was found. Coflein NPRN 400051 records this as a Roman villa site.",
            "doc_b": "Despite the discovery of a nationally important Roman villa with intact structural remains, the development proceeded and the villa was destroyed. Flats named Corinthian Close and Tuscan Close were built on the site. No Scheduled Ancient Monument protection was applied. The villa walls were later found to have been reused as foundations for the 12th-13th century farmhouse barn.",
            "explanation": "The Roman villa was discovered during construction, emergency-excavated by GGAT, and then destroyed for housing — all within a few months in 1979. The same pattern would repeat when the medieval farmhouse was demolished in 1988 and the early medieval cemetery excavated in 1994. The site's archaeological significance was consistently discovered after destruction was already in progress."
        }
    ]

    cont_sections = []
    for c in contradictions:
        cont_sections.append(f"""
        <div class="card contradiction-card">
            <h3>Contradiction #{c['num']}: {h(c['title'])}</h3>
            <p><strong>Document A:</strong> {h(c['doc_a'])}</p>
            <p><strong>Document B:</strong> {h(c['doc_b'])}</p>
            <div style="background:#0f172a;border:1px solid #334155;border-radius:6px;padding:12px;margin-top:10px;">
                <strong style="color:#f59e0b;">Explanation:</strong> {h(c['explanation'])}
            </div>
        </div>""")

    content = f"""
    <h1>Contradictions Index</h1>
    <p>Documented contradictions and anomalies in the BP Properties Ltd v Buckler case. Each entry identifies conflicting statements, missing documents, or procedural irregularities.</p>

    <div class="card" style="margin-bottom:20px;">
        <p style="margin:0;">Twelve documented contradictions. Each identifies a specific conflict between two documents, statements, or legal principles in the case.</p>
    </div>

    {''.join(cont_sections)}
    """
    write_file(f"{DST_DIR}/contradictions.html", page_html("Contradictions Index", content, "Documented contradictions in the BP vs Buckler case"))

# ============================================================
# PAGE 7: /questions.html (Open Questions Repository)
# ============================================================

def generate_questions():
    print("Generating questions.html...")
    # Build evidence ID lookup
    q_ev_by_id = {}
    for ev in evidence_list:
        q_ev_by_id[ev['id']] = ev

    questions = [
        {
            "question": "Who actually owned Great House Farm at the time of the 1987 judgment?",
            "documents": ["E001", "E003", "E006", "E007"],
            "known": ["The Williams family occupied since 1667", "Bute Estate acquired freehold early C19th", "1938 reversion to Western Ground Rents", "1969 sale to BP Pension Trust", "1982 registration to BP Properties Ltd", "No court ever determined ownership"],
            "unknown": ["Whether the Williams family held freehold or manorial leasehold in 1667", "What the Daniel Thomas equitable title arrangement actually conveyed", "Whether the 1916 tenancy was a genuine document or a legal trap", "What documents were submitted for the 1982 Land Registry registration", "Whether BP's registered title could be challenged on grounds of fraud"]
        },
        {
            "question": "Where are the title deeds removed from Cardiff Library in 1984?",
            "documents": ["E006"],
            "known": ["Deed copies were held at Cardiff Library local history section", "They were removed in 1984", "The DRA collection at Glamorgan RO contains some related documents (DRA 418-420, DRA 5/31)", "The deeds included the 'Deed of Transfer between Daniel Thomas and Bute Estate'"],
            "unknown": ["Who removed them", "Where they are now", "Whether they were destroyed", "What information they contained that was not otherwise available", "Whether their removal was deliberate or accidental"]
        },
        {
            "question": "Why was the 1916 tenancy agreement never produced?",
            "documents": ["E003", "E007"],
            "known": ["The tenancy is referenced only in paragraph 36 of the 1987 judgment", "No original document exists in Bute Estate Records", "The 1916 date falls in the 1895-1938 documentary gap", "Bute manorial records end 1847", "Estate rentals end 1893/1895", "Correspondence ends 1910"],
            "unknown": ["Whether the original tenancy agreement ever existed", "What its actual terms were", "Whether it was a genuine document or created for litigation", "Why the Bute Estate's records are silent on this tenancy"]
        },
        {
            "question": "Was the 'Mrs Buckler' identity substitution deliberate fraud?",
            "documents": ["E004", "E005", "E007"],
            "known": ["BP addressed 1974 licence letters to 'Mrs Buckler'", "Mary Williams was born, married, and buried as Mary Williams", "She never adopted the Buckler name", "Prior to 1974, no court or document referred to her as Mrs Buckler", "The Williams name carried the land claim rights"],
            "unknown": ["Why BP chose to address the licence to 'Mrs Buckler'", "Whether the name substitution was deliberate", "Who decided to use 'Mrs Buckler' instead of 'Mary Williams'", "What the court knew about the name discrepancy", "Whether this constitutes legal fraud"]
        },
        {
            "question": "Why did Cadw not grant emergency listing for Great House Farm?",
            "documents": ["E008"],
            "known": ["The family requested emergency listing in 1988", "Cadw conducted a rushed assessment", "The building was over 800 years old", "Roman remains were reported on site", "The house was demolished on 6 December 1988", "HER confirms medieval origins and archaeological significance"],
            "unknown": ["What the Cadw assessment concluded", "Who made the decision not to list", "Whether BP exerted pressure on Cadw", "Whether the 1870 Roman soldier discovery was disclosed to Cadw", "Why the assessment was not completed before demolition"]
        },
        {
            "question": "What did Frederick Buckler secretly settle before his death?",
            "documents": ["E007"],
            "known": ["Family accounts suggest Frederick 'sorted it legally' before his death", "The family was not informed of the details", "This caused a lasting rift in the family", "The settlement may have undermined Mary Williams' stance"],
            "unknown": ["What exactly Frederick agreed to", "Whether he signed away rights", "Whether any settlement was binding on Mary Williams or her heirs", "What documents, if any, recorded the settlement", "Whether this influences the validity of the 1987 judgment"]
        },
        {
            "question": "Why is the 1978 newspaper article about the 1,700 signature petition suppressed?",
            "documents": ["E005"],
            "known": ["A 1978 newspaper article documented Mary Williams contesting the BP licence", "It reported the 1,700 signature petition against BP's dispossession", "The article has been suppressed and is not publicly accessible"],
            "unknown": ["Who suppressed the article", "Where the original article exists", "What additional information it contained", "Why it was suppressed", "How to access it"]
        },
        {
            "question": "Can the 1987 Court of Appeal judgment be set aside for procedural irregularity?",
            "documents": ["E007"],
            "known": ["The judgment relied on contradictory corporate identity logic", "Ownership was never determined", "Key documents were missing", "Identity substitution was not investigated", "The 1974 licence was held to end adverse possession without acceptance", "The judgment resulted in the demolition of an 800-year-old building"],
            "unknown": ["Whether the judgment meets the threshold for setting aside under Takhar v Gracefield", "Whether fresh evidence could change the outcome", "Whether the European Court of Human Rights would find a violation", "What remedies remain available to the family"]
        },
        {
            "question": "What was the full extent of the Roman archaeology on the Great House Farm site?",
            "documents": ["E008"],
            "known": ["A Roman soldier was found under the floor in 1870 (unverified)", "1978 rescue dig uncovered Roman remains", "1979 Roman villa and bathhouse discovered", "1994 excavation found over 800 burials", "The site is one of Wales' largest recorded burial excavations", "Medieval ironwork is at the National Museum of Wales"],
            "unknown": ["Full extent of Roman settlement on the site", "Whether the 1870 'Roman soldier' report was accurate", "What archaeological evidence was destroyed in the 1988 demolition", "Whether earlier disclosure of archaeology could have prevented demolition"]
        },
        {
            "question": "Why was the 1994 excavation report delayed by 11 years?",
            "documents": ["E033", "E034"],
            "known": ["Excavation completed September 1994", "Preliminary report issued 1994 (unpublished)", "Cadw funding arrived January 1998", "Osteological analysis 1998-2001", "Published 2005 in Medieval Archaeology", "Developer already paid 5x original budget for burial excavation", "Report states costs of analysis 'could not legitimately be asked' of developer"],
            "unknown": ["Whether the delay was entirely financial or also political", "Why Cadw took until 1998 to provide funding", "Whether the delay affected preservation of evidence", "What archaeological knowledge was lost or degraded during the 11-year gap"]
        },
        {
            "question": "Why was full planning permission granted without an archaeological condition?",
            "documents": ["E033", "E035"],
            "known": ["GGAT 1990 evaluation designated site 'medium-high archaeological potential'", "8 evaluation trenches were excavated", "March 1992: Full planning permission granted WITH NO archaeological condition", "Developer voluntarily sponsored excavation", "1994 excavation found 1,026 burials — largest Early Christian cemetery in Wales"],
            "unknown": ["Who decided to omit the archaeological condition", "Why GGAT's medium-high potential designation was ignored", "Whether the omission was deliberate", "What discussions occurred between Vale of Glamorgan Council, GGAT, and the developer", "What role BP Properties Ltd played in the planning process"]
        },
        {
            "question": "What did the MOD response to FOI2026.09019 actually say?",
            "documents": ["E032"],
            "known": ["FOI filed 1 May 2026 by Sion Buckler to MOD", "Asked about SAS/military involvement in 1988 eviction", "Referenced up to 30 police officers", "'Pregnant mother and heart conditioned father' present", "MOD responded 29 May 2026", "Response document attached but NOT publicly viewable"],
            "unknown": ["Whether MOD confirmed or denied military involvement", "Whether any SAS units were deployed", "What MACA (Military Aid to Civil Authorities) records exist", "Whether correspondence with South Wales Police was disclosed", "Why the response was not published openly"]
        },
        {
            "question": "Was the Roman villa's destruction for housing development a failure of heritage protection?",
            "documents": ["E036", "E037"],
            "known": ["Roman villa discovered 1979 by GGAT", "Site had hypocaust, mosaic floors, sunken bath", "GGAT conducted emergency excavation April-May 1979", "Last-minute bid to save the villa failed", "Flats named Corinthian Close and Tuscan Close built on the site", "Roman villa walls were reused as foundations for 12th-13th century barn"],
            "unknown": ["Why the villa was not protected as a Scheduled Ancient Monument", "What representations were made to save it", "Who made the decision to allow development", "What archaeological material was lost when the villa was destroyed", "Whether the villa would have been preserved if discovered in a different political climate"]
        },
        {
            "question": "Why did the 1974 press and television campaign not result in heritage protection for Great House Farm?",
            "documents": ["E007", "E042"],
            "known": ["Press campaign broke out in South Wales in autumn 1974 following Judge Watkin Powell's order", "Campaign included television coverage (HTV/BBC Wales)", "1,700 people signed a preservation petition", "Paris 1974 campaign was powerful enough to be recorded in the 1987 Court of Appeal judgment (para 12)", "BP withdrew the warrant and offered a life licence instead", "No listed building status, scheduled monument designation, or conservation area was ever applied to the farmhouse"],
            "unknown": ["Why the press/TV campaign did not trigger heritage protection", "Whether any heritage bodies (Cadw, Ancient Monuments) were approached", "Whether BP exerted influence to prevent heritage assessment", "Whether the campaign was deliberately suppressed from influencing planning decisions", "What would have happened if the building had been listed in 1974"]
        },
        {
            "question": "Why was Llandough's early medieval cemetery classified as Grade A (nationally important) only in 2003, 15 years after demolition?",
            "documents": ["E045"],
            "known": ["GGAT Report 2003/030 for Cadw classifies Llandough-juxta-Penarth as Grade A early medieval ecclesiastical site", "The report states the cemetery 'contained by far the largest number of burials (858)'", "The prime example' of early medieval continuity at Llandough'", "Grade A is the highest classification, denoting national importance", "The farmhouse was demolished in 1988, 15 years before this classification", "The excavation was completed in 1994, 9 years before the classification"],
            "unknown": ["Why it took until 2003 for this classification to be made", "Whether the classification would have been different if the farmhouse still stood", "What archaeological knowledge was lost during the 15-year gap between demolition and classification", "Whether earlier classification would have changed heritage protection decisions", "What other sites of similar importance were also classified belatedly"]
        },
        {
            "question": "What role did the South Wales Echo and Western Mail play in covering the Great House Farm story, and are their archives accessible?",
            "documents": ["E007", "E042"],
            "known": ["Press campaign broke out in South Wales in 1974", "South Wales Echo (1901-1999) is available on Newspapers.com", "Western Mail records 1869-1980 held at NLW (ref GB 0210 WESCHO)", "Specific demolition articles are in South Wales Echo editions of 16-17 December 1988", "The case received coverage in both newspapers and on television", "The 1978 article about the 1,700-signature petition has been suppressed"],
            "unknown": ["Whether the full December 1988 demolition coverage is accessible", "What additional information the Welsh press uncovered that is not in the public record", "Whether the press campaign was deliberately suppressed by BP or other interests", "What the suppressed 1978 article actually contained", "Whether other Welsh newspapers (Barry & District News) covered the story"]
        }
    ]

    q_sections = []
    for q in questions:
        doc_links = []
        for eid in q["documents"]:
            ev = q_ev_by_id.get(eid)
            if ev:
                doc_links.append(f'<a href="/evidence.html#{eid}"><span class="evidence-id">{eid}</span></a>')
            else:
                doc_links.append(f'<span class="evidence-id">{h(eid)}</span>')

        known_list = "".join(f"<li>{h(k)}</li>" for k in q["known"])
        unknown_list = "".join(f"<li>{h(u)}</li>" for u in q["unknown"])

        q_sections.append(f"""
        <div class="card question-card">
            <h3>{h(q['question'])}</h3>
            <p><strong>Relevant Documents:</strong> {', '.join(doc_links)}</p>
            <h4>Known Facts</h4>
            <ul>{known_list}</ul>
            <h4>Unknown Facts</h4>
            <ul>{unknown_list}</ul>
            <p style="color:#64748b;font-size:0.85em;margin-top:10px;"><em>No conclusions offered — only facts and unknowns are presented.</em></p>
        </div>""")

    content = f"""
    <h1>Open Questions Repository</h1>
    <p>A comprehensive list of unresolved questions in the BP Properties Ltd v Buckler case. Each question is presented with known facts and unknown facts — no conclusions are drawn.</p>

    {''.join(q_sections)}
    """
    write_file(f"{DST_DIR}/questions.html", page_html("Open Questions", content, "Unresolved questions in the Great House Farm dispute"))

# ============================================================
# PAGE 8: /dossier.html (Research Dossier - Printable)
# ============================================================

def generate_dossier():
    print("Generating dossier.html...")

    # Gather key info
    ev_count = len(evidence_list)
    tl_count = len(timeline_entries)

    # Timeline summary
    tl_items = []
    for entry in timeline_entries:
        year = entry.get("year", "").replace("_", " ").title()
        loc = entry.get("location", "")
        narr = entry.get("narration", "")[:150]
        tl_items.append(f"<li><strong>{h(year)}</strong> — {h(loc)}: {h(narr)}{'...' if len(entry.get('narration', '')) > 150 else ''}</li>")

    # Evidence summary
    ev_summary = ""
    for ev in evidence_list:
        ev_summary += f"""
        <tr>
            <td><span class="evidence-id">{h(ev['id'])}</span></td>
            <td>{h(ev['year'])}</td>
            <td>{h(ev['subject'][:120])}</td>
        </tr>"""

    content = f"""
    <div class="print-only" style="text-align:center;padding:20px;border-bottom:2px solid #000;margin-bottom:30px;">
        <h1>GREAT HOUSE FARM (TY MAWR) — RESEARCH DOSSIER</h1>
        <p>BP Properties Ltd v Buckler [1987] EWCA Civ 2</p>
        <p>Compiled: {date.today().strftime('%d %B %Y')}</p>
        <p>Website: <a href="https://bucklervsbp.datro.xyz">bucklervsbp.datro.xyz</a></p>
    </div>

    <div class="no-print">
        <h1>Research Dossier</h1>
        <p>Complete printable dossier of the Great House Farm dispute. <a href="javascript:window.print()">Print this page</a> or save as PDF for offline reference.</p>
    </div>

    <h2>1. Executive Summary</h2>
    <p>This dossier documents the case of <strong>BP Properties Ltd v Buckler [1987] EWCA Civ 2</strong>, concerning the dispossession of the Williams-Buckler family from Great House Farm (Ty Mawr), Llandough, Vale of Glamorgan. The family occupied the property continuously from 1667 to 1988 — a period of 321 years. In 1987, the Court of Appeal granted BP possession based on a unilateral 1974 licence letter addressed to 'Mrs Buckler' — a name Mary Williams never used. The farmhouse was demolished by BP Properties Ltd on 6 December 1988 amid considerable local controversy. Ownership was never determined by any court.</p>

    <h2>2. Case Overview</h2>
    <table>
        <tr><td><strong>Case Name</strong></td><td>BP Properties Ltd v Buckler [1987] EWCA Civ 2</td></tr>
        <tr><td><strong>Property</strong></td><td>Great House Farm (Ty Mawr), Llandough, Vale of Glamorgan</td></tr>
        <tr><td><strong>Family Occupation</strong></td><td>1667 — 1988 (321 years)</td></tr>
        <tr><td><strong>Claimant</strong></td><td>BP Properties Ltd (registered proprietor from November 1982)</td></tr>
        <tr><td><strong>Occupiers</strong></td><td>Mary Williams (born 1900, died 1983), Frederick Buckler (husband), Billy Buckler (son) and family</td></tr>
        <tr><td><strong>Court of Appeal</strong></td><td>31 July 1987 — Dillon LJ; Appeal dismissed</td></tr>
        <tr><td><strong>Demolition</strong></td><td>6 December 1988 by BP Properties Ltd</td></tr>
        <tr><td><strong>Estimated Reparations</strong></td><td>£101.2 million (as of February 2026)</td></tr>
    </table>

    <h2>3. Chronology</h2>
    <ul>
        {''.join(tl_items)}
    </ul>

    <h2>4. Evidence Index</h2>
    <p>{ev_count} evidence entries:</p>
    <table>
        <tr><th>ID</th><th>Year</th><th>Subject</th></tr>
        {ev_summary}
    </table>

    <h2>5. Principal Contradictions</h2>
    <ol>
        <li><strong>BP Companies:</strong> Court said BP Pension Trust and BP Properties were 'different' (to block the family's challenge) and 'same' (to defeat the family's adverse possession claim).</li>
        <li><strong>Identity:</strong> Mary Williams was addressed as 'Mrs Buckler' despite never adopting that name. The Williams name carried the land claim rights.</li>
        <li><strong>1916 Tenancy:</strong> Exists only in paragraph 36 of the 1987 judgment. No original document has been located.</li>
        <li><strong>Ownership:</strong> Courts consistently avoided determining ownership, ruling only on possession.</li>
        <li><strong>1974 Licence:</strong> Court held a unilateral, unaccepted letter ended adverse possession — a novel legal principle.</li>
        <li><strong>Archaeology:</strong> 1870 Roman soldier discovery ignored; 1994 excavation confirmed over 800 burials.</li>
        <li><strong>Missing Deeds:</strong> Cardiff Library deed copies removed in 1984, never recovered.</li>
        <li><strong>Excavation Delay:</strong> Largest dig in Wales, report took 11 years to publish (2005).</li>
        <li><strong>Planning Omission:</strong> Medium-high archaeological potential site got planning permission with no condition for archaeology.</li>
        <li><strong>Marconi Ignored:</strong> Farm's connection to first over-sea wireless transmission never factored into heritage protection.</li>
        <li><strong>Press Campaign (1974):</strong> Major press/TV campaign and 1,700-signature petition failed to secure any heritage protection for the farmhouse.</li>
        <li><strong>Roman Villa (1979):</strong> Nationally important Roman villa emergency-excavated and destroyed for housing within months; no scheduling protection.</li>
    </ol>

    <h2>6. Key Open Questions</h2>
    <ol>
        <li>Who actually owned Great House Farm in 1987?</li>
        <li>Where are the title deeds removed from Cardiff Library in 1984?</li>
        <li>Why was the 1916 tenancy agreement never produced?</li>
        <li>Was the 'Mrs Buckler' identity substitution deliberate fraud?</li>
        <li>Why did Cadw not grant emergency listing before demolition?</li>
        <li>What did Frederick Buckler secretly settle?</li>
        <li>Can the 1987 judgment be set aside for procedural irregularity?</li>
        <li>What was the full extent of the Roman archaeology on the site?</li>
        <li>Why was the 1994 excavation report delayed by 11 years?</li>
        <li>Why was planning permission granted without archaeological condition?</li>
        <li>What did the MOD response to FOI2026.09019 actually say?</li>
        <li>Was the Roman villa's destruction a heritage protection failure?</li>
        <li>Why did the 1974 press/TV campaign not result in heritage protection?</li>
        <li>Why was Llandough classified Grade A only in 2003, 15 years after demolition?</li>
        <li>What role did Welsh newspapers play in covering the story?</li>
    </ol>

    <h2>7. Documentary Gaps</h2>
    <table>
        <tr><th>Missing Document</th><th>Expected Location</th><th>Significance</th></tr>
        <tr><td>1667 Deed of Acquisition</td><td>Williams family / NLW</td><td>Establishes original title</td></tr>
        <tr><td>Daniel Thomas equitable title deed (c.1895-1905)</td><td>Cardiff Library (removed 1984)</td><td>Establishes pre-1916 claim basis</td></tr>
        <tr><td>Deed of Transfer: Daniel Thomas to Bute Estate</td><td>Cardiff Library (removed 1984)</td><td>Confirms Thomas as intermediary</td></tr>
        <tr><td>1916 tenancy agreement</td><td>NLW GB 0210 BUTE (not found)</td><td>Only documented in judgment ¶36</td></tr>
        <tr><td>1938 reversion conveyance to WGR</td><td>NLW or National Archives</td><td>Confirms nature of interest transferred</td></tr>
        <tr><td>Mary Williams' journal</td><td>Great House Farm (destroyed 1988)</td><td>Documented visitors, dates, events</td></tr>
        <tr><td>HM Land Registry first registration docs</td><td>HMLR (pending FOI)</td><td>What chain was presented?</td></tr>
        <tr><td>Cadw listing file (1988)</td><td>Cadw (pending FOI)</td><td>Why was listing denied?</td></tr>
    </table>

    <h2>8. Sources</h2>
    <p>This dossier draws on the following source materials:</p>
    <ul>
        <li>BP Properties Ltd v Buckler [1987] EWCA Civ 2 (Court of Appeal judgment)</li>
        <li>Glamorgan-Gwent HER Record GGAT02038s (via Archwilio)</li>
        <li>National Archives GB 0214 DA (Western Ground Rents records)</li>
        <li>National Library of Wales GB 0210 BUTE (Bute Estate records)</li>
        <li>Glamorgan Record Office DRA/DBDT/DSA collections</li>
        <li>Companies House records for Cardiff Ground Rents Ltd and Western Estates Limited</li>
        <li>People's Collection Wales #871416 (tree planting photograph)</li>
        <li>Contemporary press reports (1974-1988)</li>
        <li>2026 Senedd and FOI correspondence</li>
        <li>Family testimony and records</li>
        <li>Holbrook &amp; Thomas (2005) — Medieval Archaeology XLIX, pp. 1-92 (full PDF via Sci-Hub)</li>
        <li>Knight (2005) — Medieval Archaeology XLIX, pp. 93-107 (full PDF via Sci-Hub)</li>
        <li>Archwilio HER GGAT02272s — Early Christian Cemetery record</li>
        <li>Owen-John (1988) — BAR British Series 188 (Roman villa report)</li>
        <li>Loe (2004) — PhD thesis, University of Bristol (osteological analysis)</li>
        <li>Evans (2003) — GGAT Report 2003/030 for Cadw: Early Medieval Ecclesiastical Sites in Wales</li>
        <li>ADS Archive (2004) — Llandough Excavation Archive (DOI: 10.5284/1000252)</li>
        <li>National Museum Wales — Early Medieval human remains collection from Llandough</li>
        <li>People's Collection Wales / NLW — Great House Farm photograph collection</li>
        <li>Cowbridge & District Local History Society — Mrs Mary Ellis Joshua archive</li>
        <li>South Wales Echo archive (1901-1999) via Newspapers.com</li>
    </ul>

    <p style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #334155;">
        <em>End of Dossier. Full evidence repository available at <a href="https://bucklervsbp.datro.xyz">bucklervsbp.datro.xyz</a></em>
    </p>
    """
    write_file(f"{DST_DIR}/dossier.html", page_html("Research Dossier", content, "Complete printable dossier of the Great House Farm dispute"))

# ============================================================
# INFRASTRUCTURE FILES
# ============================================================

def generate_api_files():
    print("Generating API files...")

    # /api/timeline.json - use the existing parsed data
    tl_data = {
        "title": "Great House Farm Story — Timeline",
        "description": "The complete chronological account of the Williams-Buckler family and Great House Farm, Llandough.",
        "total_entries": len(timeline_entries),
        "last_updated": str(date.today()),
        "entries": timeline_entries
    }
    write_file(f"{DST_DIR}/api/timeline.json", json.dumps(tl_data, indent=2, ensure_ascii=False))

    # /api/evidence.json
    ev_data = {
        "title": "Great House Farm — Evidence Catalogue",
        "description": "Complete evidence catalogue for the Great House Farm dispute.",
        "total_entries": len(evidence_list),
        "last_updated": str(date.today()),
        "entries": evidence_list
    }
    write_file(f"{DST_DIR}/api/evidence.json", json.dumps(ev_data, indent=2, ensure_ascii=False))

    # /api/issues.json
    issues_data = {
        "title": "Great House Farm — Claim-to-Evidence Mapping",
        "description": "Five key issues with supporting evidence, counter-evidence, and open questions.",
        "last_updated": str(date.today()),
        "issues": [
            {
                "id": "issue-ownership",
                "title": "Ownership Claim — Superior Title Never Extinguished",
                "supporting_ids": ["E001", "E003", "E004", "E006", "E007"]
            },
            {
                "id": "issue-identity",
                "title": "Identity Fraud — The Fabricated 'Mrs Buckler'",
                "supporting_ids": ["E004", "E005", "E007"]
            },
            {
                "id": "issue-circular",
                "title": "Land Registry Circular Logic",
                "supporting_ids": ["E006", "E007"]
            },
            {
                "id": "issue-erasure",
                "title": "State-Sanctioned Erasure — Missing Title Deeds",
                "supporting_ids": ["E006"]
            },
            {
                "id": "issue-judicial",
                "title": "Judicial Contradiction — Heads BP Wins, Tails the Family Loses",
                "supporting_ids": ["E007"]
            }
        ]
    }
    write_file(f"{DST_DIR}/api/issues.json", json.dumps(issues_data, indent=2, ensure_ascii=False))


def generate_infrastructure():
    print("Generating infrastructure files...")

    # /robots.txt
    robots = """User-agent: *
Allow: /
Allow: /api/
Sitemap: https://bucklervsbp.datro.xyz/sitemap.xml
"""
    write_file(f"{DST_DIR}/robots.txt", robots)

    # /sitemap.xml
    pages = [
        ("start-here.html", "1.0"),
        ("summary.html", "0.9"),
        ("timeline.html", "0.9"),
        ("evidence.html", "0.9"),
        ("issues.html", "0.8"),
        ("contradictions.html", "0.8"),
        ("questions.html", "0.8"),
        ("dossier.html", "0.8"),
    ]
    urls = ""
    for page, priority in pages:
        urls += f'  <url><loc>https://bucklervsbp.datro.xyz/{page}</loc><lastmod>{date.today().isoformat()}</lastmod><priority>{priority}</priority></url>\n'
    urls += f'  <url><loc>https://bucklervsbp.datro.xyz/api/timeline.json</loc><lastmod>{date.today().isoformat()}</lastmod><priority>0.7</priority></url>\n'
    urls += f'  <url><loc>https://bucklervsbp.datro.xyz/api/evidence.json</loc><lastmod>{date.today().isoformat()}</lastmod><priority>0.7</priority></url>\n'
    urls += f'  <url><loc>https://bucklervsbp.datro.xyz/api/issues.json</loc><lastmod>{date.today().isoformat()}</lastmod><priority>0.7</priority></url>\n'

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}</urlset>
"""
    write_file(f"{DST_DIR}/sitemap.xml", sitemap)

    # /CNAME
    write_file(f"{DST_DIR}/CNAME", "bucklervsbp.datro.xyz\n")

    # /package.json
    pkg = {
        "name": "bucklervsbp",
        "version": "0.0.0.03",
        "private": True,
        "description": "Great House Farm (Ty Mawr) / BP vs Buckler — Historical Evidence Repository",
        "scripts": {
            "build": "echo 'Static site — no build step required'"
        }
    }
    write_file(f"{DST_DIR}/package.json", json.dumps(pkg, indent=2) + "\n")

    # /wrangler.toml
    wrangler = """name = "bucklervsbp"
compatibility_date = "2024-01-01"
pages_build_output_dir = "static/bucklervsbp"
"""
    write_file(f"{DST_DIR}/wrangler.toml", wrangler)

    # /_headers
    headers = """/*
  X-Robots-Tag: index, follow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=0, s-maxage=0

/*.html
  Content-Type: text/html; charset=utf-8

/api/*
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
"""
    write_file(f"{DST_DIR}/_headers", headers)

    # /CHANGELOG.md
    changelog = f"""# Changelog — bucklervsbp

## [bucklervsbp-v0.0.0.03] - {date.today().isoformat()}

### Added
- **Evidence E040** — People's Collection Wales / NLW photographs of Great House Farm (1891-1950)
- **Evidence E041** — ADS Archaeology Data Service full excavation archive (10.5284/1000252)
- **Evidence E042** — National Museum Wales human remains collection from Llandough
- **Evidence E043** — GGAT 2003 Grade A classification of Llandough as nationally important ecclesiastical site
- **Evidence E044** — Press/TV campaign against eviction recorded in Court of Appeal judgment para 12
- **Timeline entries** — David Thomas c.1830, 1891 photograph, GGAT Grade A classification (2003), ADS archive publication (2004), Mrs Joshua's notes (1975)
- **Contradictions #11-#12** — Press campaign vs no protection (1974); Roman villa emergency dig vs destruction (1979)
- **Open Questions #14-#16** — Press campaign heritage failure; Grade A belated classification; Welsh newspaper coverage
- **Dossier updates** — Contradictions and questions lists updated to include all new entries

## [bucklervsbp-v0.0.0.02] - 2026-06-01

### Added
- **Evidence E032-E039** — FOI request, Holbrook & Thomas (2005), Knight (2005), Hansard (1980), GGAT HER, Roman villa, Archwilio HER, Missing Deed
- **Timeline entries** — 14 new entries from primary research: Marconi 1897, deeds stolen 1950s, 1963 excavation, Roman villa 1979, GGAT eval 1990, planning 1992, Cotswold dig 1994, Cadw funding 1998, publication 2005, FOI 2026
- **Contradictions #8-#10** — Excavation delay, planning omission, Marconi ignored
- **Open Questions #10-#13** — Excavation delay, planning condition, MOD FOI response, Roman villa destruction

## [bucklervsbp-v0.0.0.01] - 2026-05-30

### Added
- **Static HTML evidence repository** — Complete static HTML site generated from bpvsbuckler source data
- **Start Here page** (/start-here.html) — Entry point with overview, links to all pages
- **Case Summary page** (/summary.html) — Key parties, dates, evidence, unresolved questions
- **Master Timeline page** (/timeline.html) — Chronological table with evidence links (NO JavaScript required)
- **Evidence Catalogue page** (/evidence.html) — All evidence with unique IDs, descriptions, transcriptions
- **Claim-to-Evidence Mapping page** (/issues.html) — Five key issues with supporting evidence
- **Contradictions Index page** (/contradictions.html) — Twelve documented contradictions
- **Open Questions Repository page** (/questions.html) — Sixteen unresolved questions
- **Research Dossier page** (/dossier.html) — Printable single-page dossier
- **API endpoints** (/api/timeline.json, /api/evidence.json, /api/issues.json)
- **Infrastructure files** — robots.txt, sitemap.xml, CNAME, package.json, wrangler.toml, _headers, CHANGELOG.md, README.md
- **Dark theme** — Matching existing site design (#0f172a background, amber #f59e0b accent)
- **Mobile-responsive** — CSS media queries for all device sizes
- **Print styles** — Clean print layout for PDF generation

### Changed
- Site deployed at bucklervsbp.datro.xyz (new git branch: bucklervsbp)
"""
    write_file(f"{DST_DIR}/CHANGELOG.md", changelog)

    # /README.md
    readme = f"""# BP vs Buckler — Great House Farm Historical Evidence Repository

**Website:** [bucklervsbp.datro.xyz](https://bucklervsbp.datro.xyz)

A structured historical evidence repository documenting the BP Properties Ltd v Buckler (1987) case and the 800-year history of Ty Mawr (Great House Farm), Llandough.

## Pages

- **Start Here** (/start-here.html) — Entry point, readable in 10-15 minutes
- **Summary** (/summary.html) — Case overview with key parties, dates, evidence
- **Timeline** (/timeline.html) — Master chronology (plain HTML, no JS required)
- **Evidence** (/evidence.html) — Catalogue with IDs, descriptions, transcriptions
- **Issues** (/issues.html) — Claim-to-evidence mapping
- **Contradictions** (/contradictions.html) — Index of documented contradictions
- **Questions** (/questions.html) — Repository of unresolved questions
- **Dossier** (/dossier.html) — Printable research dossier

## Technical Notes

- Pure static HTML — no JavaScript required to view content
- Dark theme (#0f172a background, amber #f59e0b accent)
- Mobile-responsive via CSS media queries
- Machine-readable APIs at /api/ endpoints
- Generated from bpvsbuckler source data

## Deployment

Deployed to Cloudflare Pages with custom domain bucklervsbp.datro.xyz.

## License

Copyright DATRO Consortium Ltd
"""
    write_file(f"{DST_DIR}/README.md", readme)

    # /index.html - redirect to start-here.html
    index = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BP vs Buckler — Great House Farm Evidence Repository</title>
    <meta http-equiv="refresh" content="0; url=/start-here.html">
    <style>body{{background:#0f172a;color:#f59e0b;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;}}a{{color:#f59e0b;}}</style>
</head>
<body>
    <p>Redirecting to <a href="/start-here.html">Start Here</a>...</p>
</body>
</html>"""
    write_file(f"{DST_DIR}/index.html", index)


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("BP vs Buckler Static Site Generator")
    print("=" * 60)
    print()

    # Clean destination
    if os.path.exists(DST_DIR):
        print(f"Cleaning {DST_DIR}...")
        shutil.rmtree(DST_DIR)
    print(f"Creating {DST_DIR}...")
    os.makedirs(DST_DIR, exist_ok=True)

    # Generate pages
    generate_start_here()
    generate_summary()
    generate_timeline()
    generate_evidence()
    generate_issues()
    generate_contradictions()
    generate_questions()
    generate_dossier()

    # Generate infrastructure
    generate_api_files()
    generate_infrastructure()

    print()
    print("=" * 60)
    print("Generation complete!")
    print(f"Output: {DST_DIR}")
    print()

    # List generated files
    for root, dirs, files in os.walk(DST_DIR):
        for fname in files:
            fpath = os.path.join(root, fname)
            relpath = os.path.relpath(fpath, DST_DIR)
            size = os.path.getsize(fpath)
            print(f"  {relpath} ({size:,} bytes)")

    print()
    print("Total files generated:", sum(len(files) for _, _, files in os.walk(DST_DIR)))

if __name__ == "__main__":
    main()
