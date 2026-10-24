# -*- coding: utf-8 -*-
"""Source of truth for the Great House Farm storyboard.

Edit this file, then run:   python3 content/story_source.py
It writes content/graph/seed/story.seed.json. Then run
    python3 content/graph/build_graph.py
which builds the Q&A graph and writes src/data/story.json, from which the
player, /story/ script page, /api/timeline.json, /llms.txt, transcript and
sitemap are all built.

Rules (see README):
- one scene per event, in strict date order; press cuttings are evidence on
  the scene they report, never a scene of their own
- every scene carries at least one evidence link
- narration is a narrated film script: present tense, plain English, no drafting
  notes, telling the most plausible account the evidence supports
- 'case' is optional; the story is told in the narration
- parcel: A = house parcel, B = eastern fields, AB = both / whole farm,
  '?' = not yet known, 'x' = not Great House Farm land
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from accounts import ACCOUNTS

WIKI = 'https://greathousefarmwiki.wordpress.com'
def w(path, title, kind='Wiki page'):
    return {'type': kind, 'title': title, 'url': WIKI + path}
def press(n, title, img=None):
    e = {'type': 'Newspaper', 'title': title,
         'url': f'{WIKI}/evidence-library/press-archive-transcripts/#{n.lower()}'}
    if img: e['image'] = f'/media/{img}'
    return e
def echo(k, date):
    return {'type': 'Newspaper', 'title': f'South Wales Echo, {date} (search extract GHF-E090-N15-{k})',
            'url': f'{WIKI}/evidence-library/press-articles-index/'}
HER = {'type': 'Heritage record', 'title': 'Historic Environment Record GGAT 02038s (Archwilio)',
       'url': 'https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s'}
MARY = w('/mary-williams-statement/', "Mary (Nancy) Williams's statement (c. 1974)", "Mary's statement")
TL = w('/timeline/', 'Master Timeline')
LRT = lambda a, t='Land Registry Titles': w('/land-registry-titles/#' + a, t, 'Land Registry record')
RAC = w('/records-access-chronology/', 'Records Access Chronology', 'Official correspondence')
CADW_PH = {'type': 'Photograph', 'title': 'Cadw survey photograph of the farmhouse, 29 July 1988 (released 2026, ATISN 27021)',
           'url': f'{WIKI}/records-access-chronology/foi-reply-register/#R37', 'image': '/media/1988-cadw-farmhouse.jpg'}
CADW_BARN = {'type': 'Photograph', 'title': 'Cadw survey photograph of the barn, 29 July 1988 (released 2026, ATISN 27021)',
             'url': f'{WIKI}/records-access-chronology/foi-reply-register/#R37', 'image': '/media/1988-cadw-barn.jpg'}
CADW_CRIT = w('/scrutiny-and-accountability/government-public-authority-involvement/cadw-forensic-critique-v8-0-0/',
              'Cadw — Forensic Critique', 'Analysis')
GGAT_REV = w('/scrutiny-and-accountability/government-public-authority-involvement/ggat-forensic-review-and-evidence-schedule-v4-0-3/',
             'GGAT — Forensic Review', 'Analysis')
LEGAL = w('/scrutiny-and-accountability/legal-review-fraud-land-human-rights/', 'Legal Review — Fraud, Land and Human Rights', 'Analysis')
REDEV = w('/redevelopment/', 'Redevelopment and Church View Close', 'Planning file')
ARCH = w('/archaeology/', 'Archaeology and Heritage', 'Heritage record')
JUDG = w('/bp-properties-v-buckler/', 'BP Properties Ltd v Buckler [1987] EWCA Civ 2', 'Court record')

DIR = lambda title, url: {'type': 'Publication', 'title': title + ' (University of Leicester Historical Directories)', 'url': url}
D1868 = DIR('Slater\'s Directory 1868, p.902, Llandough: "Williams John, Great house"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/91309')
D1875 = DIR('Worrall\'s Directory 1875, p.324, farmers in Llandough parish: "Williams John, Great house"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/348840')
D1880 = DIR('Slater\'s Directory 1880, p.533, farmers in Llandough: "Williams John, Greathouse"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/90316')
D1887 = DIR('Owen\'s Cardiff Directory 1887, p.209: "Williams John, Great House farm, Llandough"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/92950')
D1891 = DIR('Owen\'s Cardiff Directory 1891, p.237: "Williams John, overseer, Great House farm, Llandough"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/93394')
D1901 = DIR('Cardiff Directory 1901, p.309: "Williams John, Great House farm, Llandough"', 'https://leicester.contentdm.oclc.org/digital/collection/p16445coll4/id/95085')
EV0224 = {'type': 'Public record', 'title': 'EV-0224 — 1881 census, Llandough, RG11/5288 p.2 (photograph and transcription)',
          'url': WIKI + '/evidence/ev-0224-1881-census-llandough-rg11-5288/', 'image': '/media/1881-census-rg11-5288-p2.jpg'}
EXCL = w('/evidence/excluded-not-our-farm/', 'Excluded: not our farm (other Llandoughs, other Williamses)', 'Analysis')

ACTS = [
    {'id': 'P', 'label': 'Prologue', 'title': 'To 1857', 'span': 'Late Iron Age – 1857',
     'logline': 'The earliest archaeological context at Llandough, then the house and manor before the quarry.'},
    {'id': 'I', 'label': 'Act I', 'title': 'Division', 'span': '1858 – 1915',
     'logline': 'The limeworks, the 1877 division of the farm, and Marconi\'s wireless trials at Lavernock in May 1897.'},
    {'id': 'II', 'label': 'Act II', 'title': 'Tenancies', 'span': '1916 – 1948',
     'logline': 'The 1916 and 1939 tenancies, the 1928 rent, and the 1938 sale to Western Ground Rents.'},
    {'id': 'III', 'label': 'Act III', 'title': 'Possession proceedings', 'span': '1949 – 1968',
     'logline': 'The 1949 tenancy, the papers, the 1955 and 1962 orders, and the tenancy offers.'},
    {'id': 'IV', 'label': 'Act IV', 'title': 'BP', 'span': '1969 – 1983',
     'logline': 'The 1969 and 1975 conveyances, the 1974 action and letters, and first registration.'},
    {'id': 'V', 'label': 'Act V', 'title': 'BP Properties Ltd v Buckler', 'span': '1984 – March 1988',
     'logline': 'The writ, the judgments, and the amalgamation of the titles.'},
    {'id': 'VI', 'label': 'Act VI', 'title': 'Eviction and demolition', 'span': 'April – December 1988',
     'logline': 'The eviction attempts, the listing decision and the demolition.'},
    {'id': 'VII', 'label': 'Act VII', 'title': 'Development', 'span': '1989 – 2019',
     'logline': 'Planning, the sale to Ideal Homes, the cemetery excavation and the houses.'},
    {'id': 'VIII', 'label': 'Act VIII', 'title': 'Records', 'span': '2025 – 2026',
     'logline': 'The family\'s records requests and complaints, and the replies.'},
    {'id': 'O', 'label': 'Stating the obvious', 'title': 'Stating the obvious', 'span': 'Plainly',
     'logline': 'What should have been said out loud all along.'},
    {'id': 'E', 'label': 'Epilogue', 'title': 'Today', 'span': 'Now',
     'logline': 'The sequence, the site today, and the family\'s requests.'},
]

CAST = [
    {'id': 'mary', 'name': 'Mary (Nancy) Williams, formerly Buckler', 'years': '1913 – 1983',
     'role': 'Born in the farmhouse in 1913 and died there in 1983. Refused the tenancies offered in 1959 and 1965 and the 1974 letters; pleaded ownership in 1974.',
     'match': ['Mary']},
    {'id': 'john', 'name': 'John Williams', 'years': 'd. after 1949',
     'role': "Mary's father. Tenant of the house and fields from 1908; paid the last rent on the house in 1928.",
     'match': ['John Williams']},
    {'id': 'frederick', 'name': 'Frederick Buckler', 'years': 'c. 1908/09 – 1967',
     'role': "Mary's husband. Held an unwritten yearly tenancy from 1949; the 1955 and 1962 orders were made against him.",
     'match': ['Frederick']},
    {'id': 'billy', 'name': 'William "Billy" Buckler', 'years': '1948 – 1990',
     'role': "Mary's son, born at the farm. Defendant in BP Properties Ltd v Buckler; evicted in November 1988.",
     'match': ['Billy', 'William Buckler', 'Bill Buckler', 'Mr Buckler', 'William (Billy)']},
    {'id': 'branwen', 'name': 'Branwen Buckler', 'years': '',
     'role': "William's wife; mother of their three children.",
     'match': ['Branwen']},
    {'id': 'eldest', 'name': "Frederick and Mary's eldest son", 'years': 'b. c. 1937–40',
     'role': 'Left the farm in 1968. A cousin\'s account records a sale of "our land parcel".',
     'match': ['eldest son']},
    {'id': 'thomas', 'name': 'Daniel and Alfred Thomas', 'years': '',
     'role': 'Quarrymen. Daniel Thomas bought Parcel A from Bute in 1877; Alfred Thomas took the last rent on it in 1928.',
     'match': ['Daniel Thomas', 'Alfred Thomas', 'Thomases']},
    {'id': 'bute', 'name': 'The Bute Estate', 'years': '',
     'role': 'Freeholders from the early 19th century; sold the farmhouse parcel to Daniel Thomas in 1877 and their remaining interest to Western Ground Rents in 1938.',
     'match': ['Bute']},
    {'id': 'wgr', 'name': 'Western Ground Rents Ltd', 'years': '',
     'role': "Bought Bute's interest in 1938; brought the 1955 and 1962 actions; conveyed Parcel B, and an interest in the 1962 order on Parcel A, to BP Pension Trust in 1969.",
     'match': ['WGR', 'Western Ground Rents']},
    {'id': 'bp', 'name': 'BP Pension Trust / BP Properties Ltd', 'years': '',
     'role': 'Acquired from Western Ground Rents in 1969; registered the land in 1982–83; obtained possession in 1986–88; demolished the buildings in 1988; transferred the site to Ideal Homes in 1993.',
     'match': ['BP']},
    {'id': 'hmlr', 'name': 'HM Land Registry', 'years': '',
     'role': "Registered titles WA231076 and WA240304 in 1982–83 and amalgamated them in 1987.",
     'match': ['Land Registry', 'Registry']},
    {'id': 'cadw', 'name': 'Cadw', 'years': '',
     'role': 'The Welsh heritage body. Considered the house for listing in July and December 1988 and did not list it.',
     'match': ['Cadw']},
    {'id': 'ggat', 'name': 'GGAT (now Heneb)', 'years': '',
     'role': 'The regional archaeological trust. Advised the planning authority and worked on the site, 1982–1995.',
     'match': ['GGAT', 'Heneb']},
    {'id': 'rcahmw', 'name': 'Royal Commission (RCAHMW)', 'years': '',
     'role': 'Recorded the house in part in 1974 and examined the rubble in 1988.',
     'match': ['Royal Commission', 'RCAHMW', 'Suggett']},
    {'id': 'courts', 'name': 'The judges', 'years': '',
     'role': 'Judge Temple Morris QC (1962), Mr Justice Hollis (1986), Dillon LJ, Mustill LJ and Sir Edward Eveleigh (1987), Mr Justice Anthony Evans and Judge Norman Francis (1988).',
     'match': ['Judge', 'Justice', 'Court of Appeal', 'High Court', 'House of Lords', 'County Court', 'county court']},
    {'id': 'mps', 'name': 'Members of Parliament', 'years': '',
     'role': 'Ted Rowlands (1980), Alun Michael (1988), Stephen Doughty (2026).',
     'match': ['MP', 'House of Commons']},
    {'id': 'ideal', 'name': 'Ideal Homes Wales', 'years': '',
     'role': 'Built the twenty houses of Church View Close on the farm.',
     'match': ['Ideal Homes']},
]

# Title ledger lanes, in display order. A scene's `ledger` sets the lanes it
# changes; main() carries every lane forward until a later scene changes it
# (None closes a lane).
LANES = {
    'W': 'Great House (one farm)',
    'A': 'Parcel A: the true title',
    'S': 'Synthetic Parcel A',
    'B': 'Parcel B: the fields',
    'M': 'Merged title: "Parcel A & B"',
}

S = []  # scenes
def sc(act, id, date, when, title, place, parcel, basis, narration, evidence, case=None, image=None, aliases=(), ledger=None):
    S.append({'id': id, 'act': act, 'date': date, 'when': when, 'title': title, 'place': place,
              'parcel': parcel, 'basis': basis, 'narration': narration, 'case': case,
              'evidence': evidence, 'image': image, 'aliases': list(aliases), 'set': ledger or {}})

# ---------------------------------------------------------------- PROLOGUE
sc('P', 'ghf-02000101-1', '-0200-01-01', 'Late Iron Age (approx. 2,200 years ago; exact date uncertain)', "Iron Age farmstead at Llandough", 'Llandough Roman Villa site (separate site)', 'x',
   'Archaeological record',
   "Excavations in 1978–79 at the separate Llandough Roman Villa site identified earlier Iron Age occupation. A curvilinear feature and postholes may represent a round hut; associated pottery is in a late Iron Age tradition. This is evidence for early occupation at Llandough, not evidence that a round hut stood on the Great House Farm parcel.",
   [
    {'type': 'Heritage record', 'title': 'Heneb HER GGAT00768s — Llandough Roman Villa (Iron Age farmstead / possible round hut)', 'url': 'https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT00768s'},
    {'type': 'National monument record', 'title': 'Coflein NPRN 400051 — Roman Villa Site, Llandough; excavation in 1979', 'url': 'https://coflein.gov.uk/en/site/400051/'}
   ])
sc('P', 'ghf-06500101-1', '0650-01-01', 'c. 650 (approximate)', "St Dochdwy's", 'Llandough churchyard, beside the farm', 'x',
   'Archaeological record',
   "Beside the farm stands St Dochdwy's, Llandough. It is thought to have been an early monastery, founded around the year 650; the churchyard and the ground north of it hold the burials later excavated in 1994.",
   [ARCH, HER])  # coverage: research chronology — Sion's Tab agent
sc('P', 'ghf-12000101-1', '1200-01-01', '12th – 14th century', "Medieval occupation", 'Great House — north-east slope', 'A',
   'Archaeological record',
   "In 1962–63 E. J. Beare reports pottery of the 12th to 14th centuries on the slope north-east of the house. The Royal Commission classes the house as sub-medieval, probably 17th century, possibly with a medieval core.",
   [HER, ARCH, GGAT_REV], aliases=['ghf-12150102-1', 'ghf-12150101-1', 'ghf-11000101-1'])
sc('P', 'ghf-15450101-1', '1545-01-01', '1536 – 1793', "The lordship of the manor", 'Manor of Llandough', 'AB',
   'Public record',
   "Llandough belongs to Tewkesbury Abbey until the Dissolution of 1536–39. Cardiff Records states that in 1543 Henry VIII granted the manor to Lord Clynton and Say and Robert Turwitt, and that by 1545 it was held by Sir George Herbert. The Western Mail letter states that the Herberts held the lordship until the Earl of Bute bought it in 1793; Cardiff Records places William Hurst and others in the account from 1767. The same 1974 newspaper record identifies Mary (Nancy) Williams's family as occupying the manorial home since 1667. That occupation and the lordship are separate from the farmhouse freehold. The family's case is that the Williamses were virtual freeholders under the 1877 bargain while quarrying continued, and that Parcel A's freehold passed to them when quarrying ended (1928 in Mary's recollection; the quarry's plant was catalogued for sale in November 1925).",
   [press('N04', "Western Mail, 'Grievous loss' (1974 letter giving manorial descent and the Williams occupation)"),
    MARY,
    w('/1877-agreement/#sale-1877', 'The 1877 Agreement — the sale'),
    w('/1877-agreement/#takes-effect', 'The 1877 Agreement — takes effect in 1928'),
    w('/anomalies-register/llandough-penarth-cydfin-ty-mawr-manorial-evidence/', 'Llandough (Penarth): Cydfin / Tŷ Mawr and pre-1877 manorial evidence')],
   ledger={'W': 'Lordship of the manor: Sir George Herbert (by 1545) and his family'})
sc('P', 'ghf-15470620-1', '1547-06-20', '20 June 1547', "A 1,000-year lease of Cydwin", 'Manor of Llandough — Cydwin', '?',
   'Archival catalogue',
   "The National Library of Wales catalogue describes a lease for 1,000 years dated 20 June 1547 from Sir George Herbert of Swansea to Edmund Vaughan of a farm called Cydwin in the manor of Llandough; the record names fields. This long leasehold interest predates the later Bute estate narrative. The affirmative Cedwyn thesis asks whether those named fields belong to the older Cydfin/Ty Mawr holding later catalogued as a 107-acre farm, and how that interest passed from the Herbert/Vaughan line into subsequent estate records. The instrument and field boundaries must be examined before the lease can be equated with the whole Great House site.",
   [
    {'type': 'Archive catalogue', 'title': 'National Library of Wales, L 11 — assignment of a lease for 1,000 years of Cydwin in the manor of Llandough', 'url': 'https://archifau.llyfrgell.cymru/index.php/assignment-of-lease-for-1000-years-of-cydwin-in-manor-of-llandough'},
    {'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219 — Llandough manorial leases and agreements', 'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/ghf-e173-cedwyn-cwm-cedwyn-place-name-notes/ghf-e178-1547-sir-george-herbert-grants-vaughan-a-1000-year-lease-of-cydwin/', 'GHF-E178 — 1547 Cydwin lease lead'),
    w('/anomalies-register/llandough-penarth-cydfin-ty-mawr-manorial-evidence/', 'Llandough (Penarth): Cydfin / Tŷ Mawr and pre-1877 manorial evidence'),
    {'type': 'Research annex', 'title': 'Cedwyn Estate — title-chain reconstruction', 'url': 'https://bpvsbuckler.bucklerfamily.estate/research/cedwyn-estate-title-chain.html'}
   ])
sc('P', 'ghf-15520101-1', '1552-01-01', '1552 – 1824', "Manorial leases", 'Llandough manorial leases', 'AB',
   'Estate papers',
   "The National Library of Wales holds a Bute Estate bundle of Llandough manorial leases and agreements (D 219), dated 1552–1829 as a whole. Its catalogue identifies leases of \"Cydfin Farm or Ty Mawr Farm, (107 a.)\", dated 1552–1824.",
   [{'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219: Llandough manorial leases and agreements, 1552–1829',
     'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-15430101-1', 'ghf-15390101-1', 'ghf-15360101-1', 'ghf-14440101-1'],
   ledger={'W': 'Farm (Cydfin or Tŷ Mawr, 107 acres): leases on record 1552–1824 · lordship of the manor: the Herberts'})
sc('P', 'ghf-15600101-1', '1560-01-01', 'Mid 16th – late 18th century', "The Vaughans", 'Great House Farm', 'AB',
   'Heritage record',
   "From the mid-16th to the late 18th century the Vaughan family hold Great House as the chief freehold farm of the parish. The lordship of the manor is a separate interest, held over the same period by the Herberts.",
   [HER, w('/bute-estate/', 'The Bute Estate (Vaughan chief freehold farm)'), w('/1990-ggat-archaeological-assessment-great-house-farm-llandough-transcription/', '1990 GGAT Assessment — transcription (Vaughan phase)')],
   ledger={'W': 'Farm freehold: the Vaughans · lordship of the manor: the Herberts (a separate interest)'})
sc('P', 'ghf-16670101-1', '1667-01-01', '1667', "The Williams family at Great House", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary (Nancy) Williams's c.1974 statement records that her family had lived and farmed at Great House since 1667. A 1974 newspaper report also reports her statement that her family first acquired Tŷ Mawr around that date. The affirmative Cedwyn thesis treats 1667 as the opening of the family's own estate history and tests that statement against the Cydwin/Cydfin lease and farm-name records. The surviving statement and press report support the Buckler case; a 1667 conveyance has not yet been identified.",
   [MARY, w('/williams-buckler-family/', 'The Williams / Buckler Family — origins')],
   aliases=['ghf-16770101-1'],
   ledger={'W': 'Farm freehold: the Vaughans · lordship of the manor: the Herberts · in the house: the Williamses'})
sc('P', 'ghf-17400213-1', '1740-02-13', '13 February 1739/40', "Vaughan assigns the Cydwin lease", 'Manor of Llandough — Cydwin', '?',
   'Archival catalogue',
   "The National Library of Wales catalogues an assignment dated 13 February 1739/40 by Edmond Vaughan of Llandough to Thomas Mathews of Llandaf of the 1,000-year Cydwin lease originally granted in 1547, for £1,066 13s. 4d. This is a documented transfer in the older lease chain and a concrete route for tracing who held the interest before Bute's later estate records. The next step is to match the named fields and follow subsequent assignments, rentals and conveyances into the Cydfin/Ty Mawr farm and the later parcels.",
   [
    {'type': 'Archive catalogue', 'title': 'National Library of Wales, L 11 — assignment of a lease for 1,000 years of Cydwin in the manor of Llandough', 'url': 'https://archifau.llyfrgell.cymru/index.php/assignment-of-lease-for-1000-years-of-cydwin-in-manor-of-llandough'},
    {'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219 — Llandough manorial leases and agreements', 'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/ghf-e173-cedwyn-cwm-cedwyn-place-name-notes/ghf-e179-1552-1824-bute-records-call-it-cedfin-cydfin-ken-fin-farm-or-ty-mawr-farm/', 'GHF-E179 — Cydfin / Ty Mawr names in Bute records'),
    {'type': 'Research annex', 'title': 'Cedwyn Estate — title-chain reconstruction', 'url': 'https://bpvsbuckler.bucklerfamily.estate/research/cedwyn-estate-title-chain.html'}
   ])
sc('P', 'ghf-18000101-1', '1800-01-01', '1793 – early 19th century', "The Bute Estate", 'Great House', 'AB',
   'Heritage record',
   "The historical account places Bute's acquisition of the lordship of Llandough in 1793 and its acquisition of the Great House freehold in the early 19th century; the manorial courts of Llandough and Leckwith were held at the house. The missing control point is the instrument that carried the farm freehold from the Vaughan line into Bute's estate. The 1547 Cydwin lease, its 1739/40 assignment, and the D 219 record of Cydfin or Ty Mawr leases give the affirmative reconstruction a named chain to investigate alongside the manor's later ownership. A manorial interest, a long lease, and a farm freehold must be mapped separately before the later corporate titles can be treated as the originating chain for every parcel.",
   [HER, w('/bute-estate/', 'The Bute Estate'),
    w('/anomalies-register/llandough-penarth-cydfin-ty-mawr-manorial-evidence/', 'Llandough (Penarth): Cydfin / Tŷ Mawr and pre-1877 manorial evidence'),
    {'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records R1: Glamorgan Estate rentals',
     'url': 'https://archives.library.wales/index.php/glamorgan-estate-rentals'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations (Stewart survey, D/d B E/1–2)')],
   aliases=['ghf-17700101-1', 'ghf-17940101-1',
            'ghf-18180101-2', 'ghf-18180101-1', 'ghf-18200101-1', 'ghf-18210101-1', 'ghf-18240101-1'],
   ledger={'W': 'Lordship of the manor (1793) and farm freehold (early 19th century): the Bute Estate · tenants: the Williamses'})
sc('P', 'ghf-18240101-2', '1824-01-01', "1824", "The Stewart survey", "Cedfin or Ty Mawr Farm", 'AB',
   "Estate papers",
   "David Stewart surveys the Bute estates in Glamorgan. Plan 19 is \"Cedfin or Ty Mawr Farm\". Its reference table enters John Gedrick (reading uncertain) as occupier of the main farm, 107 acres 1 rood 24 perches, and beside it the land of \"late Thos. Williams\", 10 acres 3 roods 39 perches, with about 20 acres of woods: close to 140 acres in all. A Williams name stands on the farm's own plan almost a century before the 1916 tenancy.",
   [{'type': 'Estate papers', 'title': 'EV-0211 — Glamorgan Archives DB/E/1, plan 19: "Cedfin or Ty Mawr Farm", Stewart survey and reference table (1824)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0211-db-e-1-plan-19-cedfin-ty-mawr-1824/'}, w('/great-house-farm/name-variations/', 'Name & Location Variations (Stewart survey)')],
   case="The family reads the separate entry for the late Thomas Williams's land as a Williams holding inside Tŷ Mawr that Bute surveyed but did not let with the main farm.")  # tour stop — Sion's Tab agent
sc('P', 'ghf-18400101-1', '1840-01-01', 'c. 1840', "Great House Farm", 'Census and tithe records', 'AB',
   'Public record',
   "Census and tithe records begin to describe the house as \"Great House Farm\".",
   [w('/great-house-farm/farmhouse-nomenclature/', 'Farmhouse Nomenclature'), w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-18800101-1'])
sc('P', 'ghf-18550101-1', '1855-01-01', '1855', "John Williams succeeds his father", 'Great House Farm', 'AB',
   'Newspaper',
   "John Williams succeeds his father as occupier of the farm under the Bute Estate. Reporting the Bute rent audit dinner of July 1904, the Cardiff Times reports that he \"succeeded his father in the tenancy of the farm in 1855\", and that it was \"his 102nd rent audit\".",
   [{'type': 'Newspaper', 'title': 'Cardiff Times, 16 July 1904, p.1 — Bute rent audit dinner (Welsh Newspapers Online)',
     'url': 'https://newspapers.library.wales/view/3427270/3427271/13/'},
    {'type': 'Newspaper', 'title': 'EV-0227 — Cardiff Times, 16 July 1904: John Williams, tenancy since 1855 (wiki evidence page)', 'url': WIKI + '/evidence/ev-0227-cardiff-times-1904-john-williams-tenancy-since-1855/'},
    w('/evidence/ev-0215-tithe-apportionment-john-williams-c1841/', 'EV-0215 — Tithe apportionment: John Williams, c. 1841')])

# ---------------------------------------------------------------- ACT I
sc('I', 'ghf-18641223-1', '1864-12-23', '23 December 1864', 'Death of Amy Williams of Great House', 'Llandough', 'AB',
   'Newspaper',
   'Amy Williams dies at Llandough, aged 65. The death notices call her "relict of the late Mr. John Williams, Great House farm": the widow of the elder John Williams, whose son John had taken over the tenancy in 1855.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Cardiff Times, 30 December 1864, p.5 — deaths: "at Llandough, near Cardiff, Amy, relict of the late Mr. John Williams, Great House farm, aged 65 years" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3383386/3383391/14/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Cardiff and Merthyr Guardian, 30 December 1864, p.5 — deaths: "WILLIAMS.—Dec. 23, at Llandough, near Cardiff, Amy, relict of the late Mr. John Williams, Great House farm, aged 65" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3094324/3094329/21/'},
    {'type': 'Newspaper', 'title': 'EV-0246 — the death notices on the wiki (evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0246-cardiff-times-1864-death-of-amy-williams-great-house-farm/'}
   ])
sc('I', 'ghf-18680101-1', '1868-01-01', '1868 – 1901', "\"Williams John, Great house\"", 'Trade directories', 'AB',
   'Publication',
   "The trade directories list the farmers of Llandough parish. Every edition from 1868 to 1901 has \"Williams John, Great house\", from 1887 \"Great House farm, Llandough\". Thomas Rees, and later Evan Rees, are listed separately, at Llandough Farm, a different Bute farm.",
   [D1868, D1875, D1880, D1887, D1891, D1901,
    {'type': 'Publication', 'title': 'EV-0225 — Trade directories 1868–1901: "Williams John, Great house" (wiki evidence page)', 'url': WIKI + '/evidence/ev-0225-trade-directories-1868-1901-john-williams-great-house/'},
    {'type': 'Newspaper', 'title': 'Weekly Mail, 6 November 1886 — Thomas Rees, aged 89, of Llandough Farm, "rented from the Marquess of Bute"',
     'url': 'https://newspapers.library.wales/view/3365383/3365390/150/'},
    {'type': 'Newspaper', 'title': 'EV-0228 — Llandough Farm and the Rees family, 1841–1910: a separate Bute farm (wiki evidence page)', 'url': WIKI + '/evidence/ev-0228-llandough-farm-rees-family-1841-1910/'}])
sc('I', 'ghf-18700101-1', '1870-01-01', 'c. 1870', "The armour under the floor", 'Great House — dining room', 'A',
   'Source pending',
   "Family tradition records a soldier in armour, with his horse, a lance and a shield, found beneath the dining-room floor. The account is in a Royal Commission record (NMR 6048942) and the Daily Telegraph of 16 April 1974. No primary record of a find has been located.",
   [press('N03', 'Daily Telegraph, 16 April 1974 (dates the find to "about 1870")'), HER, ARCH, w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis')],
   aliases=['ghf-18800101-2'])
sc('I', 'ghf-18700101-2', '1870-01-02', '1870 — Pwllypant probate and estate papers', "A Williams estate bequest to Bute: tracing the land", 'Pwllypant / Llandough title research', '?',
   'Probate and estate catalogue leads',
   "The National Library of Wales catalogue lists the 1870 will of William Evans Williams of Pwllypant as bequeathing his real and personal estate to the Marquis of Bute, and separately catalogues papers about his real and personal estate. The affirmative title inquiry is parcel-specific: did any land he owned, benefited from, or had let through Bute connect to the 33-acre Llandough Limeworks block or Great House Farm? The will's headline bequest does not identify those acres by itself. The family's research also points to a Clock Tower dispute and newspaper coverage that may have complicated the relationship between Williams and Bute; the precise contemporary reports and wording must be located before using that dispute as proof of motive. Estate schedules, title deeds, rent books and the 1876–1912 limeworks accounts are the route to answer the question.",
   [
    {'type': 'Archive catalogue', 'title': 'National Library of Wales, D242/17 — probate of the will of William Evans Williams of Pwllypant (1870)', 'url': 'https://archives.library.wales/index.php/deeds-and-documents-relating-mainly-to-title-of-pwllypant-estate-including-copy-probate-of-will-of-david-evan%3Bisad?sf_culture=en'},
    {'type': 'Archive catalogue', 'title': 'National Library of Wales, D258 — papers relating to the personal and real estates of William Evans Williams', 'url': 'https://archives.library.wales/index.php/papers-relating-to-personal-and-real-estates-of-william-evans-williams-dec-including-account-of-aberdare-iron-co'},
    {'type': 'Historical context', 'title': 'History Points — Former Pwllypant House, Caerphilly', 'url': 'https://historypoints.org/index.php?page=former-pwllypant-house-caerphilly'},
    w('/llandough-limeworks/', 'Llandough Limeworks — the 33-acre block'),
    w('/bute-estate/', 'The Bute Estate — unresolved early title'),
    {'type': 'Research annex', 'title': 'Cedwyn Estate — title-chain reconstruction', 'url': 'https://bpvsbuckler.bucklerfamily.estate/research/cedwyn-estate-title-chain.html'}
   ])
sc('I', 'ghf-18760101-1', '1876-01-01', '1876 – c. 1912', "The limeworks", 'Llandough Limeworks', 'A',
   'Estate papers',
   "The Wiki's archive lead identifies about 33 acres used by the Llandough Limeworks from 1876 to about 1912, with Bute papers D153/4–8 to be obtained and inspected. The block's precise boundaries and title line remain to be matched to the 1877 plan and the estate schedules. For the Cedwyn reconstruction, this is a critical parcel-control point: identify who owned the freehold, who granted the quarrying rights, who received rent, and whether all four descriptions refer to the same acres.",
   [{'type': 'Newspaper', 'title': 'EV-0280 — Llandough Lime Works and quarry, 1876–1947: contemporary record set', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0280-llandough-lime-works-and-quarry-1876-1947-daniel-thomas-s-kilns-quarry-workers-kel/'}, w('/llandough-limeworks/', 'Llandough Limeworks')])
sc('I', 'ghf-18770101-1', '1877-01-01', '1877', "Division of the farm", 'Bute Estate Office', 'AB',
   "Mary's statement",
   "Mary (Nancy) Williams's statement records that in 1877 the Bute Estate sold the farmhouse, buildings and about 10 acres to Daniel Thomas, and kept about 9 acres. The Williamses remained the occupiers of both. The deed is missing.",
   [{'type': 'Archive catalogue', 'title': 'EV-0278 — NLW Bute records: Llandough manor rentals 1808–1881 and presentments 1793–1934 (catalogue entries)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0278-nlw-bute-estate-records-llandough-manor-rentals-1808-1881-r-6-27-45-and-presentmen/'}, MARY, w('/1877-agreement/#sale-1877', 'The 1877 Agreement — the sale'), w('/1877-agreement/#plan', 'The 1877 Agreement — plan'),
    w('/the-two-parcels/', 'The Two Parcels'), w('/1877-agreement/#sale-1877', 'The 1877 Agreement — Bute lease'), w('/forensic-master-chronology-authoritative-corrected-6-october-2026/', 'Forensic Master Chronology (6 October 2026)', 'Analysis')],
   aliases=['ghf-18771106-1'],
   ledger={'W': None,
           'A': 'Freehold: Daniel Thomas (bought from Bute) · tenants: the Williamses, promised the freehold when quarrying ends',
           'B': 'Freehold: the Bute Estate · tenants: the Williamses'})
sc('I', 'ghf-18810403-1', '1881-04-03', '3 April 1881', "The 1881 census: \"Llandough Home Farm\"", 'Census, Llandough (RG11/5288 p.2)', 'AB',
   'Public record',
   "The 1881 census records \"Llandough Home Farm\": John Williams, 53, \"Farmer of 170 [? or 120] ac. employing 1 man and 1 boy\", born at Leckwith; his wife Mary, 51, born at Cogan; their children Ellen, 14, John, 13, and David, 9; a boarder and a servant. Per Sion Buckler, this is Great House Farm entered under the wrong name. The directories of 1880 and 1887 place the same John Williams at Great House.",
   [EV0224, D1880, D1887,
    {'type': 'Publication', 'title': 'EV-0225 — Trade directories 1868–1901: "Williams John, Great house" (wiki evidence page)', 'url': WIKI + '/evidence/ev-0225-trade-directories-1868-1901-john-williams-great-house/'},
    {'type': 'Newspaper', 'title': 'EV-0228 — Llandough Farm and the Rees family, 1841–1910: a separate Bute farm (wiki evidence page)', 'url': WIKI + '/evidence/ev-0228-llandough-farm-rees-family-1841-1910/'},
    w('/evidence/ev-0223-1881-census-name-variant/', 'EV-0223 — 1881 census: a dictated variant of the farm name (pending)')],
   image='/media/1881-census-rg11-5288-p2.jpg')
sc('I', 'ghf-18871215-1', '1887-12-15', '15 December 1887 (obituary)', 'Death of Daniel Thomas', 'Penylan, Cardiff', 'A',
   'Newspaper',
   'Daniel Thomas of Penylan dies. His obituary in Tarian y Gweithiwr describes him as a contractor under Lord Bute and the owner of "valuable lime kilns at Llandough". In April 1888 a local man is described as "a labourer at Llandough Quarry": the quarry beside the farm is still worked.',
   [w('/evidence/ev-0280-llandough-lime-works-and-quarry-1876-1947-daniel-thomas-s-kilns-quarry-workers-kel/', 'EV-0280 — Llandough lime works and quarry, 1876–1947: Daniel Thomas’s kilns and quarry workers', 'Newspaper')])  # coverage: research chronology — Sion's Tab agent
sc('I', 'ghf-18890811-1', '1889-08-11', '11 August 1889', "Apples from the orchard", 'Great House Farm — the orchard by the railway', 'AB',
   'Newspaper',
   "Four boys climb \"over the hedge from the railway\" into \"the orchard of Great House Farm\" and take apples, \"the property of John Williams\". John Williams junior helps the constable catch three of them, and tells the Penarth magistrates that about half the apples in his father's orchard have gone.",
   [{'type': 'Newspaper', 'title': 'EV-0279 — Barry Dock News, 16 August 1889, p.2: "the orchard of Great House Farm … the property of John Williams" (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0279-barry-dock-news-16-aug-1889-p-2-apples-taken-from-the-orchard-of-great-house-farm/'},
    {'type': 'Newspaper', 'title': 'Barry Dock News, 16 August 1889, p.2 — "A Batch of Orchard Looters at Llandough" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4594680/4594682/18/'}])
sc('I', 'ghf-18911111-1', '1891-11-11', '11 November 1891', "Theft of geese", 'Llandough — court report', 'AB',
   'Newspaper',
   "Three geese are taken from \"Mr. John Williams, Great House Farm, Llandough\". The theft is reported from court.",
   [press('N01', '1891 court report — farmyard theft', 'ghf-e090-n01-1891-farmyard-theft.jpg'),
    {'type': 'Newspaper', 'title': 'South Wales Star, 10 June 1892 — geese "the property of Mr. John Williams, Great House Farm, Llandough, on November 11, 1891" (Welsh Newspapers Online)',
     'url': 'https://newspapers.library.wales/view/3019697/3019705/78/'},
    {'type': 'Newspaper', 'title': 'EV-0226 — South Wales Star, 10 June 1892: "Mr. John Williams, Great House Farm, Llandough" (wiki evidence page)', 'url': WIKI + '/evidence/ev-0226-south-wales-star-1892-john-williams-great-house-farm/'}],
   image='/media/ghf-e090-n01-1891-farmyard-theft.jpg')
sc('I', 'ghf-18920101-1', '1892-01-01', '1892', 'Signals across the water: Preece at Lavernock', 'Lavernock Point and Flat Holm', 'x',
   'Newspaper',
   'The Post Office engineer William Preece stretches long parallel wires on the shore at Lavernock and on Flat Holm, 3.3 miles out, and sends messages between them by induction, with no wire across the water. Five years later Marconi comes to the same shore.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Daily Post, 5 June 1897, p.3 — Preece\'s Royal Institution lecture: "In 1892 distinct messages were sent across a portion of the Bristol Channel between Penarth and the Flat Holm, a distance of over three miles" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3356360/3356363/20/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Cardiff Times, 13 March 1897, p.2 — "No Use for Wires": the "wonderful doings" of Mr Preece "at Lavernock and the Flat Holm" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3431204/3431206/41/'},
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Preece's induction method: the Lavernock–Flat Holm trials", 'url': 'https://earlyradiohistory.us/1901fa21.htm'}
   ])
sc('I', 'ghf-18940731-1', '1894-07-31', 'Week of 30 July 1894', 'Swine fever at Great House', 'Great House Farm', 'AB',
   'Newspaper',
   'Swine fever breaks out at Llandough. Five pigs belonging to Mr Williams of Great House are slaughtered. On the Tuesday morning one of his herd of 23 is reported affected, and it is feared the whole herd will have to go.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Barry Dock News, 3 August 1894, p.5 — "Swine fever at Llandough and Rhoose": "Five pigs belonging to Mr Williams, Great House, have been slaughtered" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4596799/4596804/24/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Glamorgan Gazette, 3 August 1894, p.5 — the same report (herd given as 22) (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3874190/3874195/53/'},
    {'type': 'Newspaper', 'title': 'EV-0247 — the swine-fever reports on the wiki (evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0247-barry-dock-news-1894-swine-fever-great-house-llandough/'}
   ])
sc('I', 'ghf-18970501-1', '1897-05-01', 'Late April – early May 1897', 'Marconi comes to Lavernock', 'Lavernock Point', 'x',
   'Newspaper',
   'The Cardiff papers announce that the young Italian Guglielmo Marconi, 23, will come to Cardiff "in a few weeks" to signal across the Bristol Channel without wires, with the Post Office\'s staff and apparatus at his disposal. At Lavernock Point the receiving station goes up on the cliff: a tall pole with a zinc cylinder at the top (120 feet in the Evening Express; 30 yards in Preece\'s account). The press names the man who put it up only as "Mr. Williams (of the engineering department, Cardiff)". The sending station is on Flat Holm.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 26 April 1897, p.2 — "Wireless Telegraphy … Coming to Cardiff in a Few Weeks to Experiment Across the Bristol Channel" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3270301/3270303/28/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Weekly Mail, 1 May 1897, p.4 — the same report (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3370882/3370886/79/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 15 May 1897 (Extra Special), p.4 — "Wireless Telegraphy. Marconi Invention Tested at Lavernock" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3270811/3270815/108/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Western Mail, 15 May 1897, p.6 — "Telegraphy without wires. Marconi invention tested at Lavernock" (same report) (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4313747/4313753/61/'},
    {'type': 'Newspaper', 'title': 'EV-0011 — the same cutting on the wiki (catalogued there as undated; identified here as the Evening Express, 15 May 1897, p.4)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0011-marconi-lavernock-wireless-cutting-1897/', 'image': '/media/ghf-e090-n02-1897-marconi-lavernock.jpg'},
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Marconi's method, drawing on Preece's Royal Institution lecture of 4 June 1897", 'url': 'https://earlyradiohistory.us/1901fa23.htm'},
    {'type': 'Official correspondence', 'title': 'Sion Buckler, records request to The National Archives, 16 July 2026, "Mr. Williams, Cardiff Post Office Engineering Department, 1897 Marconi Lavernock Experiments" (TNA replied 30 July 2026 that it is not the right place to ask)', 'url': 'https://greathousefarmwiki.wordpress.com/?p=5363'},
    {'type': 'Newspaper', 'title': 'EV-0248 — Marconi in Wales, April–July 1897: the contemporary press record on the wiki (evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0248-marconi-in-wales-may-1897-contemporary-press/'}
   ],
   image='/media/ghf-e090-n02-1897-marconi-lavernock.jpg')
sc('I', 'ghf-18970510-1', '1897-05-10', '10 May 1897', "Preece's method tried again", 'Lavernock Point and Flat Holm', 'x',
   'Publication',
   "Before Marconi's own trials begin, the Post Office repeats Preece's induction method between Lavernock and Flat Holm. It works.",
   [
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Marconi's method, drawing on Preece's Royal Institution lecture of 4 June 1897", 'url': 'https://earlyradiohistory.us/1901fa23.htm'},
    {'type': 'Publication', 'title': '[SECONDARY] BBC Wales History blog, "Marconi\'s Welsh wireless revolution" (May 2012), quoting the same account', 'url': 'https://www.bbc.co.uk/blogs/waleshistory/2012/05/marconi_wireless_open_sea_lavernock_point_flat_holm.html'}
   ])
sc('I', 'ghf-18970511-1', '1897-05-11', '11–12 May 1897', 'Two days of failure', 'Lavernock Point', 'x',
   'Newspaper',
   'Marconi\'s first attempts to receive signals from Flat Holm at the Lavernock cliff-top station fail. The Evening Express reports that the experiments on Tuesday "were not so successful as might have been desired".',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 15 May 1897 (Extra Special), p.4 — "Wireless Telegraphy. Marconi Invention Tested at Lavernock" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3270811/3270815/108/'},
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Marconi's method, drawing on Preece's Royal Institution lecture of 4 June 1897", 'url': 'https://earlyradiohistory.us/1901fa23.htm'},
    {'type': 'Heritage record', 'title': '[SECONDARY] Rotary Club of Cardiff plaque, St Lawrence\'s churchyard, Lavernock (transcription): "BETWEEN LAVERNOCK AND FLAT HOLM 11th MAY, LAVERNOCK AND BREAN DOWN 18th MAY 1897 … ERECTED BY THE ROTARY CLUB OF CARDIFF 1947"', 'url': 'https://readtheplaque.com/plaque/marconi-s-first-radio-transmissions-across-water'}
   ])
sc('I', 'ghf-18970513-1', '1897-05-13', '13 May 1897', 'Signals across the sea', 'Lavernock Point and Flat Holm', 'x',
   'Newspaper',
   'The receiver is carried down to the beach below the cliff and joined to the pole by another 20 yards of wire. Signals from Flat Holm, 3.3 miles away, now print clearly on the Morse inker at Lavernock. The Evening Express reports that on Wednesday and Thursday "the results were most satisfactory". Watching are Preece, his second engineer Mr Gavey (late of Cardiff), the Cardiff postmaster Mr Fardo and other officials. The German Professor Slaby is there too.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 15 May 1897 (Extra Special), p.4 — "Wireless Telegraphy. Marconi Invention Tested at Lavernock" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3270811/3270815/108/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Western Mail, 15 May 1897, p.6 — "Telegraphy without wires. Marconi invention tested at Lavernock" (same report) (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4313747/4313753/61/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Echo, 17 May 1897, p.2 — "The Man About Town": "Lavernock and the Flat Holm will stand out in the history of electrical science"; the messages were recorded, not just heard (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4604986/4604988/5/'},
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Marconi's method, drawing on Preece's Royal Institution lecture of 4 June 1897", 'url': 'https://earlyradiohistory.us/1901fa23.htm'},
    {'type': 'Photograph', 'title': "[SECONDARY: date and place as captioned by the source] Post Office engineers inspect Marconi's apparatus on Flat Holm, 13 May 1897. Photo: Cardiff Council Flat Holm Project, CC BY 3.0, via Wikimedia Commons (File:Post_Office_Engineers.jpg)", 'url': 'https://commons.wikimedia.org/wiki/File:Post_Office_Engineers.jpg', 'image': '/media/1897-05-13-flat-holm-post-office-engineers-marconi.jpg'},
    {'type': 'Publication', 'title': '[SECONDARY — conflicting] Later accounts give the first words as "Are you ready?" (We Are Cardiff, 13 May 2016) or "CAN YOU HEAR ME" / "YES LOUD AND CLEAR" (BBC Wales History, 2012). No 1897 source read here gives the words.', 'url': 'https://wearecardiff.co.uk/2016/05/13/marconis-first-wireless-message-transmitted-over-sea-from-flat-holm-to-lavernock-point/'}
   ],
   image='/media/1897-05-13-flat-holm-post-office-engineers-marconi.jpg')
sc('I', 'ghf-18970514-1', '1897-05-14', '14 May 1897 (Friday)', 'The demonstration at Lavernock', 'Lavernock Point', 'x',
   'Newspaper',
   'On Friday afternoon Marconi gives a semi-public demonstration. A select company of local scientists and engineers watches his system explained in miniature, with a transmitter facing a receiver about twenty yards away, and messages written by the Morse self-inker without a connecting wire.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 15 May 1897 (Extra Special), p.4 — "Wireless Telegraphy. Marconi Invention Tested at Lavernock" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3270811/3270815/108/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Carnarvon and Denbigh Herald, 21 May 1897, p.4 — "Telegraphing without wires": Preece "during last week" testing Marconi\'s invention between Lavernock Point and the Flat Holme; a select company of local scientists and engineers invited (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3603309/3603313/23/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Weekly Mail, 22 May 1897, p.8 — "Wireless Telegraphy. Marconi Invention Tested at Lavernock" (same report) (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3370921/3370929/162/'}
   ])
sc('I', 'ghf-18970518-1', '1897-05-18', '18 May 1897', 'Lavernock to Brean Down', 'Lavernock Point and Brean Down (Somerset)', 'x',
   'Newspaper',
   'The range is pushed across the whole Channel. A message sent from Lavernock Point, through a wire carried 220 feet up on a kite, is received at Brean Down, near Weston-super-Mare, about eight and a half miles away. Marconi signs the paper tape. That week he works on Brean Down with Preece and Gavey.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Echo, 27 May 1897, p.4 — "First wireless telegram": "Sent from Lavernock Point through a kite at an elevation of 220ft., and received at Brean Down, May 18th, 1897 … (Signed) G. Marconi" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4605031/4605035/99/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Echo, 20 May 1897, p.3 — "The Marconi experiments": Marconi, with Mr Preece and Mr Gavey, "has this week been at work on Brean Down" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4605001/4605004/57/'},
    {'type': 'Heritage record', 'title': '[SECONDARY] Rotary Club of Cardiff plaque, St Lawrence\'s churchyard, Lavernock (transcription): "BETWEEN LAVERNOCK AND FLAT HOLM 11th MAY, LAVERNOCK AND BREAN DOWN 18th MAY 1897 … ERECTED BY THE ROTARY CLUB OF CARDIFF 1947"', 'url': 'https://readtheplaque.com/plaque/marconi-s-first-radio-transmissions-across-water'},
    {'type': 'Publication', 'title': "[SECONDARY] J. J. Fahie, A History of Wireless Telegraphy (1899; 2nd ed. 1901), chapter on Marconi's method, drawing on Preece's Royal Institution lecture of 4 June 1897", 'url': 'https://earlyradiohistory.us/1901fa23.htm'}
   ])
sc('I', 'ghf-18970527-1', '1897-05-27', 'Late May – July 1897', 'The first wireless telegram goes on show', 'Cardiff Central Free Library', 'x',
   'Newspaper',
   'The framed tape of the Brean Down message goes on view in the hall of the Cardiff Central Free Library. Work at Lavernock goes on "for a few days longer". On 4 June Preece describes the Penarth–Brean Down signals to the Royal Institution in London. Marconi leaves England for Italy on Monday 5 July 1897.',
   [
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Echo, 27 May 1897, p.4 — the framed tape on view at the Cardiff Central Free Library (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4605031/4605035/99/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Echo, 20 May 1897, p.3 — "Work is still progressing at Lavernock, and will be continued for a few days longer" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4605001/4605004/57/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] South Wales Daily Post, 5 June 1897, p.3 — Preece\'s Royal Institution lecture: signals "between Penarth and Brean Down … a distance of nearly nine miles" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3356360/3356363/20/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Carnarvon and Denbigh Herald, 9 July 1897, p.2 — Preece: "Marconi only left England on Monday" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3603372/3603374/10/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Y Negesydd, 23 July 1897, p.1 — "Pellebru heb wifrau": experiments "yn agos i Benarth, Caerdydd" by Mr Preece and Marconi (Welsh) (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/3819134/3819135/2/'}
   ])
sc('I', 'ghf-19021129-1', '1902-11-29', '29 November 1902', 'Coppice woods offered at auction', 'Cwm Cydfin Wood, Leckwith and Llandough', '?',
   'Sale particulars',
   'Stephenson & Alexander offer the Marquess of Bute\'s coppice woods at auction, including "Cwm Cydfin Wood, Leckwith and Llandough", the woodland north of the house (particular 192). The particulars do not state whether the land or only the coppice is offered.',
   [w('/evidence/ev-0219-bute-coppice-woods-sale-1902-cwm-cydfin-wood/', 'EV-0219 — Bute coppice woods sale, 1902: Cwm Cydfin Wood', 'Sale particulars')])  # coverage: research chronology — Sion's Tab agent
sc('I', 'ghf-19070401-1', '1907-04-01', '1 April 1907', 'Air-rifle meeting at Great House Farm', 'Great House Farm', '?',
   'Newspaper',
   'The Llandough Air-rifle Club holds its Easter Monday meeting at Great House Farm: ten shots at twenty yards. A Llandough man, J. Griffiths, comes third.',
   [{'type': 'Newspaper', 'title': 'EV-0282 — Evening Express 1907–1908: air-rifle meeting and poacher at Great House Farm (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0282-evening-express-27-mar-and-2-apr-1907-air-rifle-meeting-at-great-house-farm-llando/'}, 
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 27 March 1907, p.3 — notice: an air-rifle shooting competition "at the Great House Farm, Llandough, on Monday next" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4174604/4174607/109/'},
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 2 April 1907, p.4 — "Air-rifle shooting. The Llandough meeting … held on Monday at Great House Farm, Llandough" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4174794/4174798/123/'}
   ])
sc('I', 'ghf-19080101-1', '1908-01-01', '1908', "John Williams", 'Great House Farm', 'AB',
   "Mary's statement",
   "Mary's grandfather dies. John Williams takes over the house from the Thomases and the fields from Bute.",
   [{'type': 'Newspaper', 'title': 'EV-0283 — Bute Court Leet at Llandough 1904–1917: “John Williams” on the 1910 jury (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0283-bute-court-leet-at-llandough-press-reports-1904-1917-john-williams-on-the-1910-gra/'}, MARY, w('/john-williams/#y1908', 'John Williams — 1908'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (1905 Bute conveyance)'),
    w('/evidence/ev-0243-barry-dock-news-1908-court-leet-john-williams-great-house/', "EV-0243 — Barry Dock News, 23 Oct 1908, p.3: court leet vote of sympathy with \"the family of the late Mr. John Williams, Great House, Llandough\" (wiki evidence page)", 'Newspaper')],
   aliases=['ghf-19050223-1'],
   ledger={'A': 'Freehold: the Thomases · tenant: John Williams',
           'B': 'Freehold: the Bute Estate · tenant: John Williams'})
sc('I', 'ghf-19080106-1', '1908-01-06', '6 January 1908', 'A poacher caught on Great House Farm', 'Great House Farm', '?',
   'Newspaper',
   'Shortly before three in the morning two keepers on their round at Llandough see a man net two rabbits on Great House Farm and catch him before he leaves the field. At Barry he is sent to gaol for two months.',
   [{'type': 'Newspaper', 'title': 'EV-0282 — Evening Express 1907–1908: air-rifle meeting and poacher at Great House Farm (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0282-evening-express-27-mar-and-2-apr-1907-air-rifle-meeting-at-great-house-farm-llando/'}, 
    {'type': 'Newspaper', 'title': '[VERIFIED] Evening Express, 10 January 1908, p.3 — "Two months for a poacher": "poaching on Great House Farm, Llandough" (Welsh Newspapers Online)', 'url': 'https://newspapers.library.wales/view/4184741/4184744/84/'}
   ])
sc('I', 'ghf-19130810-1', '1913-08-10', '10 August 1913', "Birth of Mary (Nancy) Williams", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary (Nancy) Williams is born in the farmhouse on 10 August 1913.",
   [w('/mary-williams/', 'Mary (Nancy) Williams'), MARY])

# ---------------------------------------------------------------- ACT II
sc('II', 'ghf-19160201-1', '1916-02-01', 'February 1916', "The 1916 tenancy", 'Great House Farm', 'AB',
   'Court record',
   "Bute grants John Williams a yearly tenancy described as \"the whole farm\". The document has not been found.",
   [w('/1916-tenancy/#grant', 'The 1916 Tenancy', 'Court record'), JUDG, w('/the-two-parcels/whole-farm-nomenclature/', 'The Farm / Whole Farm Nomenclature')],
   ledger={'S': 'Seed (a landlord\'s wording, not the family\'s): the words "the whole farm" in a Bute tenancy (Bute can only let Parcel B)'})
sc('II', 'ghf-19271214-1', '1927-12-14', '14 December 1927', 'Death of Lord Pontypridd', 'Cardiff', 'A',
   'Newspaper',
   'Alfred Thomas, Lord Pontypridd, son of Daniel Thomas of the Llandough lime works, dies unmarried. The next year the last quarry machinery leaves and the final rent on the house is paid.',
   [w('/evidence/ev-0284-alfred-thomas-lord-pontypridd-son-of-daniel-thomas-of-the-llandough-lime-works-die/', 'EV-0284 — Alfred Thomas, Lord Pontypridd, son of Daniel Thomas of the Llandough lime works, dies 1927', 'Newspaper')])  # coverage: research chronology — Sion's Tab agent
sc('II', 'ghf-19280101-1', '1928-01-01', '1928', "Last rent on the house", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary (Nancy) Williams's statement records that in 1928 the last quarry machinery left, and John Williams paid a final rent of about £4 to Alfred Thomas. She saw the receipt. It is missing. The quarry's plant and tramlines had already been catalogued for sale in November 1925 (Glamorgan Archives DSA/12/4888).",
   [{'type': 'Biography', 'title': 'EV-0284 — Alfred Thomas, Lord Pontypridd, died 14 Dec 1927; estate report (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0284-alfred-thomas-lord-pontypridd-son-of-daniel-thomas-of-the-llandough-lime-works-die/'}, MARY, w('/1877-agreement/#takes-effect', 'The 1877 Agreement — takes effect 1928'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (15 May 1924 agreement)'), w('/forensic-master-chronology-authoritative-corrected-6-october-2026/', 'Forensic Master Chronology (6 October 2026)', 'Analysis'), w('/the-two-parcels/', 'The Two Parcels')],
   aliases=['ghf-19240515-1'],
   ledger={'A': 'Freehold: the Williamses (Bute → Thomas → Williams; 1877 agreement and 1928 receipt kept at the house)'})
sc('II', 'ghf-19360101-1', '1936-01-01', '1936', "Marriage", 'Great House Farm', 'A',
   'Newspaper',
   "Mary (Nancy) Williams marries Frederick Buckler, who comes to live at the farmhouse. They have seven children. The Western Mail of 5 August 1936 reports the wedding of Mr. Fred Buckler of Barry and Miss Mary Doreen (Nancy) Williams of Great House Farm (snippet only).",
   [{'type': 'Newspaper', 'title': 'EV-0230 — Western Mail, 5 August 1936, p.10: "Llandough Bride", Buckler–Williams wedding (SNIPPET ONLY; wiki evidence page)', 'url': WIKI + '/evidence/ev-0230-western-mail-1936-llandough-bride-buckler-williams/'},
    w('/frederick-buckler/#marriage', 'Frederick Buckler — marriage'), w('/frederick-buckler/', 'Frederick Buckler'),
    w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19100101-1', 'ghf-19370101-1'])
sc('II', 'ghf-19380101-1', '1938-01-01', '1938', "Sale to Western Ground Rents", 'Bute Estate Office', 'B',
   'Court record',
   "The Bute Estate conveys its reversion on the 1916 tenancy to Western Ground Rents Ltd.",
   [{'type': 'Newspaper', 'title': 'EV-0285 — Western Mail snippets 1925–1939: Great House Farm under John Williams (sheep 1925, pony 1937, gun lost Feb 1939)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0285-snippets-only-western-mail-1925-1939-naming-great-house-farm-llandough-john-willia/'}, w('/1939-revised-tenancy/#y1938', '1938–39: Sale to WGR and the Revised Tenancy'), JUDG],
   ledger={'B': 'Freehold: Western Ground Rents (from Bute, 1938) · tenant: John Williams'})
sc('II', 'ghf-19390501-1', '1939-05-01', 'May 1939', "The 1939 tenancy", 'Great House Farm', 'B',
   'Document',
   "Western Ground Rents grants John Williams a revised tenancy, with a plan.",
   [w('/1939-revised-tenancy/#y1939', '1938–39: the 1939 tenancy'), w('/1939-revised-tenancy/#plan', 'The 1939 tenancy plan')],
   ledger={'B': 'Freehold: Western Ground Rents · tenant: John Williams (1939 plan: fields only)'})
sc('II', 'ghf-19400101-1', '1940-01-01', 'c. 1940', "Twelve years", 'Great House Farm', 'A',
   'Family case',
   "By 1940, twelve years after 1928, no rent has been paid on the house.",
   [w('/1939-revised-tenancy/#c1940', '1938–39 — c. 1940'), w('/forensic-master-chronology-authoritative-corrected-6-october-2026/', 'Forensic Master Chronology (6 October 2026)', 'Analysis')],
   ledger={'A': 'Freehold: the Williamses, by the 1877 bargain and by title by possession (twelve years rent-free, 1928–1940)'})
sc('II', 'ghf-19420401-1', '1942-04-01', '1940 – April 1942', 'The gift of Leckwith Woods', 'Leckwith Woods', '?',
   'Public record',
   'Western Ground Rents gives about 109 acres of Leckwith Woods to Cardiff council. The gift is offered and accepted in 1940 and completed in April 1942. Whether it takes in any of the woodland beside the farm is a question for the 1942 conveyance plan.',
   [{'type': 'Archive catalogue', 'title': 'Cardiff Parks Committee minutes, 1940–42 (Glamorgan Archives BC/C/6/79)', 'url': 'https://canfod.glamarchives.gov.uk/en/records/BC/C/6/79'}, TL])  # coverage: research chronology — Sion's Tab agent
sc('II', 'ghf-19440101-1', '1944-01-01', '1944', "Farm management", 'Great House Farm', 'B',
   "Mary's statement",
   "The War Agricultural Executive Committee is dissatisfied with the farm. Frederick Buckler takes over running it as manager for John Williams.",
   [{'type': 'Newspaper', 'title': 'EV-0286 — Western Mail, 17 Nov 1942: farm stock sale at “Great House Farm, Llandough” (snippet; parish unverified)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0286-snippet-only-western-mail-17-nov-1942-p-2-important-sale-of-live-and-dead-farming/'}, MARY, w('/john-williams/#y1944', 'John Williams — 1944'),
    w('/evidence/ev-0241-tna-maf-32-1220-39-national-farm-survey-penarth-1941/', "EV-0241 — National Farm Survey 1941–43, Penarth parish, TNA MAF 32/1220/39 (catalogue entry; that the farm's form is in it is an inference; not seen) (wiki evidence page)", 'Archive catalogue')])
sc('II', 'ghf-19470101-1', '1947-01-01', '1947', 'The Lavernock plaque', "St Lawrence's churchyard, Lavernock", 'x',
   'Heritage record',
   'The Rotary Club of Cardiff puts up a bronze plaque at St Lawrence\'s, Lavernock: "Near this spot the first radio messages were exchanged across water by Guglielmo Marconi and George Kemp."',
   [
    {'type': 'Heritage record', 'title': '[SECONDARY] Rotary Club of Cardiff plaque, St Lawrence\'s churchyard, Lavernock (transcription): "BETWEEN LAVERNOCK AND FLAT HOLM 11th MAY, LAVERNOCK AND BREAN DOWN 18th MAY 1897 … ERECTED BY THE ROTARY CLUB OF CARDIFF 1947"', 'url': 'https://readtheplaque.com/plaque/marconi-s-first-radio-transmissions-across-water'},
    {'type': 'Publication', 'title': '[SECONDARY] BBC Wales History blog (2012): the plaque "unveiled by the Cardiff Rotary Club" in 1948 (the plaque itself reads 1947)', 'url': 'https://www.bbc.co.uk/blogs/waleshistory/2012/05/marconi_wireless_open_sea_lavernock_point_flat_holm.html'}
   ])
sc('II', 'ghf-19480101-1', '1948-01-01', 'c. 1948 – 49', "Birth of William Buckler", 'Great House Farm', 'A',
   'Source pending',
   "William (Billy) Buckler is born at the farm on 25 August 1948 (the date given in the 1987 Court of Appeal judgment).",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')])

# ---------------------------------------------------------------- ACT III
sc('III', 'ghf-19490202-1', '1949-02-02', '2 February 1949', "The 1949 tenancy", 'Great House Farm', 'B',
   'Court record',
   "John Williams surrenders his tenancy. Frederick Buckler's yearly tenancy from Western Ground Rents begins on 2 February 1949. It is not put in writing.",
   [w('/frederick-buckler/#tenancy-1949', "Frederick Buckler — the 1949 tenancy", 'Court record'), JUDG, w('/the-two-parcels/', 'The Two Parcels'), w('/scrutiny-and-accountability/case-analysis-connections-patterns-questions/', 'Case Analysis — Connections, Patterns and Questions', 'Analysis')],
   ledger={'S': 'Attempt 1 to make Mary look permitted: her house spoken of as part of Frederick\'s unwritten fields tenancy (no 1949 offer to Mary concerning Parcel A, or reply from her, has been found; she still holds the paper title)',
           'B': 'Freehold: Western Ground Rents · tenant: Frederick Buckler (unwritten, from 1949)'})
sc('III', 'ghf-19500601-1', '1950-06-01', 'June 1950 – c. 1952', "The blanket box", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary (Nancy) Williams's statement records that in June 1950 Mr Knapp, a Penarth estate agent, placed a lodger, Bruce Sutherland, at the farmhouse. He stayed about two years, and later told her he had taken \"the papers which were in the blanket box including the agreement relating to the farm\" and given them to Mr Knapp.",
   [MARY, w('/1877-agreement/#papers-taken', 'The 1877 Agreement — papers taken'), w('/scrutiny-and-accountability/case-analysis-connections-patterns-questions/', 'Case Analysis — Connections, Patterns and Questions', 'Analysis'), w('/scrutiny-and-accountability/master-scrutiny-issue-register/additions-2026-10-06/', 'Register Additions — 6 October 2026 (A-080: Mr Knapp)', 'Analysis')],
   ledger={'A': 'Freehold: the Williamses · their deeds taken from the blanket box (missing from now on; title buried, not extinguished)'})
sc('III', 'ghf-19521010-1', '1952-10-10', '1952 – 53', "Last rent on the fields", "Landlords' agents", 'B',
   'Court record',
   "On 10 October 1952 the landlord's agents write that they will not proceed with a letting to Frederick. He pays his last rent in 1953.",
   [w('/frederick-buckler/#tenancy-1949', 'Frederick Buckler — 1952 letter', 'Court record'), TL],
   aliases=['ghf-19530101-1'])
sc('III', 'ghf-19550202-1', '1955-02-02', '2 February – 4 July 1955', "The 1955 possession order", 'High Court / Great House Farm', 'AB',
   'Court record',
   "On 2 February 1955 a notice to quit served on Frederick Buckler expires. Western Ground Rents then obtains a High Court order for possession against him, by summary judgment, described as \"the whole of the farm\". On 4 July 1955 possession is taken of everything except the farmhouse and garden; the 1987 judgment attributes the exception to Mary's recent return from hospital and her strong objection.",
   [w('/1955-possession-order/#order', 'The 1955 Possession Order', 'Court record'), w('/1955-possession-order/#enforcement', 'The 1955 Possession Order — enforcement', 'Court record'), w('/scrutiny-and-accountability/case-analysis-connections-patterns-questions/', 'Case Analysis — Connections, Patterns and Questions', 'Analysis')],
   ledger={'A': 'Freehold: the Williamses (Mary in the house) · woodland: per the Buckler case, taken in 1955 (SOURCE PENDING: not yet on the wiki)',
           'S': 'Attempt 2: High Court order against the fields tenant for "the whole of the farm" (house not taken; Mary never heard)',
           'B': 'Freehold and possession: Western Ground Rents (fields taken 4 July 1955)'})
sc('III', 'ghf-19550318-1', '1955-03-18', '18 March 1955', 'Leckwith Woods leased to the Forestry Commission', 'Leckwith Woods', 'x',
   'Newspaper',
   "In March 1955 the Western Mail reports that Cardiff holds a 176-acre Leckwith Woods, bought for a nominal sum in 1942, and leases 106 acres to the Forestry Commission for 999 years. Measured against today's boundaries, that wood lies wholly in Leckwith, about 1.2 km from the farmstead, so it is not Great House Farm land.",
   [w('/evidence/ev-0259-leckwith-woods-1955-cardiff-forestry-commission-lease-and-boundary-measure/', 'EV-0259 — Western Mail 1955: Leckwith Woods lease; boundary measurement', 'Newspaper')])
sc('III', 'ghf-19580506-1', '1958-05-06', '6 May 1958', "The Leckwith Common inquiry", 'Public inquiry into the City of Cardiff (Leckwith Common) order', 'x',
   'Newspaper',
   "At the inquiry into Cardiff's plan to take Leckwith Common for playing fields, Mrs Mary Doreen Buckler of Great House Farm tells the inspector that she does \"not oppose the proposal so long as it applied only to playing fields\", and that about 130 years ago Lord Bute allowed her family \"a slice of land\" which is now Leckwith Common. The order is confirmed on 8 September 1958 under the Physical Training and Recreation Act 1937, the playing-fields statute. Her words concern Leckwith Common, not Parcel A.",
   [{'type': 'Newspaper', 'title': 'EV-0035 — Western Mail, 7 May 1958, p.7, "City wants common for play-field" (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0035-western-mail-1958-leckwith-common-hearing/'},
    {'type': 'Official notice', 'title': 'EV-0287 — London Gazette, 31 Oct 1958, p.6652: City of Cardiff (Leckwith Common) Compulsory Purchase Order, 1957, confirmed 8 Sep 1958 (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0287-london-gazette-31-oct-1958-p-6652-the-city-of-cardiff-leckwith-common-compulsory-p/'},
    {'type': 'Official notice', 'title': 'London Gazette 41537, p.6652 (page PDF)', 'url': 'https://www.thegazette.co.uk/London/issue/41537/page/6652/data.pdf'}])
sc('III', 'ghf-19581119-1', '1958-11-19', '19 November 1958', "\"A Welsh case of Crichel Down\"", 'Glamorgan County Council planning committee, Cardiff', 'A',
   'Newspaper',
   "Mary (Nancy) Williams, as Mrs M. D. Buckler, objects to Glamorgan County Council's planning committee about industrial development beside Tŷ Mawr. The Western Mail reports that land \"farmed by her family since 1667\" had been \"wrongfully appropriated\", that \"This is a Welsh case of Crichel Down\", that \"the water was cut off from her house and grounds for nearly 10 years by order of Western Ground Rents\", and that \"The Glamorgan County Council, Penarth Urban and Cardiff Rural Councils and Western Ground Rents have walked in and taken\" (the search text ends there).",
   [{'type': 'Newspaper', 'title': 'Western Mail, 20 November 1958, p.7, "It\'s a Crichel Down, says woman farmer" (SNIPPET ONLY: read from British Newspaper Archive search text; the page itself not yet seen)',
     'url': 'https://www.britishnewspaperarchive.co.uk/search/results/1950-01-01/1965-12-31?basicsearch=buckler+%22western+ground+rents%22+water&exactsearch=false&retrievecountrycounts=false'},
    {'type': 'Newspaper', 'title': 'EV-0037 — Western Mail, 20 Nov 1958: "Crichel Down" (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0037-western-mail-1958-crichel-down/'},
    w('/evidence/ev-0239-tna-bd-28-177-glamorgan-development-plan-inquiry-verbatim-1958/', "EV-0239 — TNA BD 28/177: verbatim record of the Glamorgan Development Plan inquiry, 19 Nov–11 Dec 1958 (catalogue entry; not yet read; date match only) (wiki evidence page)", 'Archive catalogue'),
    w('/evidence/ev-0240-tna-bd-28-133-hlg-119-maf-112-glamorgan-development-plan-files/', "EV-0240 — TNA BD 28/133, BD 28/198, HLG 119/3181, HLG 119/3187, MAF 112/1108: files on the Glamorgan (Area No. 2) plan and the Penarth town map (catalogue entries) (wiki evidence page)", 'Archive catalogue'),
    w('/evidence/ev-0242-western-mail-1957-mrs-m-d-buckler-snippet/', "EV-0242 — Western Mail, 9 Oct 1957, p.6: \"Mrs. M. D. BUCKLER … Llandough\" (SNIPPET ONLY; content unknown) (wiki evidence page)", 'Newspaper'),
    w('/testimony/branwen-buckler/', 'Testimony — Branwen Buckler', 'Testimony')])
sc('III', 'ghf-19590101-1', '1959-01-01', '1959', "1959 tenancy offer", 'Great House Farm', 'A',
   'Court record',
   "Western Ground Rents offers Mary a tenancy of the farmhouse and garden. She refuses, stating that the house is hers through her grandfather and that documents prove it.",
   [w('/1962-possession-order/#refusal-1959', 'The 1962 Possession Order — 1959 refusal', 'Court record'), JUDG],
   ledger={'S': 'Attempt 3: tenancy of her own farmhouse and garden offered to Mary (refused)'})
sc('III', 'ghf-19610329-2', '1961-03-29', '29 March 1961', "The 1961 deed", 'Woodland (later title WA735527)', 'A',
   'Deed',
   "Western Ground Rents, South Western Brick & Tile Co Ltd and Cardiff City Corporation sign a deed with a plan. The woodland register WA735527 later recites it against land coloured pink, now in the woodland title. The deed and plan have not yet been seen, so what land it touches and what it did are not known. It is not a Buckler family sale.",
   [{'type': 'Deed', 'title': 'EV-0040 — Deed with plan between WGR, South Western Brick & Tile and Cardiff City Corporation, 29 March 1961 (recited on WA735527; not yet held) (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0040-1961-wgr-brick-tile-deed/'}])
sc('III', 'ghf-19621211-1', '1962-12-11', '11 December 1962', "The 1962 possession order", 'Cardiff County Court', 'A',
   'Court record',
   "On 11 December 1962 Cardiff County Court (Judge Temple Morris QC) orders possession of the farmhouse and garden, with mesne profits from 1955, against Frederick and Mary, in Western Ground Rents' action. The order is not enforced.",
   [w('/1962-possession-order/#order', 'The 1962 Possession Order', 'Court record'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (29 March 1961 deed)')],
   aliases=['ghf-19610329-1'],
   ledger={'S': 'Attempt 4: county court possession order for the farmhouse and garden, treating Mary as holding over (no deed proven; never enforced)'})
sc('III', 'ghf-19630601-1', '1963-06-01', 'June 1963', "Committal proceedings", 'Cardiff County Court', 'A',
   'Court record',
   "The mesne profits under the 1962 order are partly enforced against Frederick, and committal proceedings follow.",
   [w('/1962-possession-order/#committal', 'The 1962 Possession Order — committal', 'Court record'), ARCH],
   aliases=['ghf-19630101-1'])
sc('III', 'ghf-19650301-1', '1965-03-02', 'January – March 1965', "1965 tenancy offer", "Landlords' agents", 'A',
   'Document',
   "On 2 March 1965 the landlord's agents offer \"Mrs Williams\" a weekly tenancy of the farmhouse and garden at £2 a week. It is not signed or returned and no rent is paid.",
   [w('/1962-possession-order/#offer-1965', 'The 1965 offer'), w('/mary-williams/#chronology', 'Mary (Nancy) Williams — 1965 offer')],
   ledger={'S': 'Attempt 5: weekly tenancy offered to "Mrs Williams" (not signed; her occupation now treated as adverse)'})
sc('III', 'ghf-19640101-1', '1965-06-01', '1964 – 68', "Reported sale by the eldest son", 'Great House Farm', '?',
   'Source pending',
   "A cousin's account states that the eldest son sold \"our land parcel\" through a solicitor without his parents' knowledge. No document has been found. In 1968 his household leaves the farm.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — rumoured sale'), w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19680901-1'])
sc('III', 'ghf-19670101-1', '1967-01-01', '1967', "Death of Frederick Buckler", 'Great House Farm', 'A',
   'Source pending',
   "Frederick Buckler dies, aged 58; his death is registered in the first quarter of 1967 (GRO death index, East Glamorgan 8b 364). Mary takes back the name Williams and remains in the farmhouse.",
   [w('/frederick-buckler/#death', 'Frederick Buckler — death')],
   ledger={'B': 'Freehold and possession: Western Ground Rents'})

# ---------------------------------------------------------------- ACT IV
sc('IV', 'ghf-19690215-1', '1969-02-15', '15 February 1969', 'BP bids for Western Ground Rents', 'London', 'AB',
   'Newspaper',
   'British Petroleum makes an agreed bid for the whole of Western Ground Rents Ltd, wanting its "shops, offices, houses in London and South Wales — for their pension fund", after rival bids from Amalgamated Investment & Property and Great Portland Estates. The December 1969 sale of the farm to BP Pension Trust follows.',
   [w('/evidence/ev-0288-snippets-only-press-on-the-1968-69-takeover-battle-for-western-ground-rents-ltd-en/', 'EV-0288 — Press on the 1968–69 takeover contest for Western Ground Rents Ltd (snippets)', 'Newspaper')])  # coverage: research chronology — Sion's Tab agent
sc('IV', 'ghf-19691231-1', '1969-12-31', '31 December 1969', "Conveyance to BP Pension Trust", 'Great House Farm', 'AB',
   'Land Registry record',
   "In February 1969 British Petroleum agrees to buy the whole of Western Ground Rents for its pension fund. On 31 December 1969 Western Ground Rents conveys Parcel B, and an interest in the 1962 order on Parcel A, to BP Pension Trust Ltd. The 1987 judgment calls it a sale of \"Great House Farm, including the farmhouse and garden\"; no deed to Parcel A has been found. The conveyance is not on the Land Registry files.",
   [LRT('conveyances', 'Land Registry Titles — conveyances'), {'type': 'Newspaper', 'title': 'EV-0288 — Press snippets, Nov 1968 – Feb 1969: BP buys Western Ground Rents for its pension fund (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0288-snippets-only-press-on-the-1968-69-takeover-battle-for-western-ground-rents-ltd-en/'}],
   ledger={'B': 'Freehold: BP Pension Trust (Bute → WGR → BP, by deed)',
           'S': 'Held by BP Pension Trust: the 1962 order and the case against Mary (no deed to Parcel A; the 1969 root conveyance now missing)'})
sc('IV', 'ghf-19710101-1', '1971-01-01', '1971', 'The 1971 abstract of title', 'BP Pension Trust', 'AB',
   'Land Registry record',
   'An abstract of title is prepared for BP Pension Trust. In 2026 HM Land Registry writes that an abstract "dated 1971 was lodged with the application for first registration" of WA231076, and that for WA240304 "we had sight of a copy of a 1971 abstract of title". It is not listed among the surviving records, and its contents are not held.',
   [w('/evidence/hm-land-registry-correspondence/#m39', 'HM Land Registry correspondence — letter of 19 April 2026 (M39)', 'Official correspondence'), {'type': 'Evidence catalogue', 'title': 'EV-0045 — HM Land Registry letter, 19 April 2026', 'url': 'https://wayback.bucklerfamily.estate/artifacts/#EV-0045'}])  # coverage: research chronology — Sion's Tab agent
sc('IV', 'ghf-19710101-2', '1971-01-02', "1971", "A name on the map", "Ordnance Survey sheet, Llandough", 'AB',
   "Map",
   "On the Ordnance Survey's earlier sheets the name is \"Ty-mawr\", printed just east of the farm buildings, towards the fields: on the 25-inch map of about 1900 and again on the six-inch National Grid map of 1949–70. Neither adds \"Farm\". A year later planning permission is granted for about thirteen houses at the farm.",
   [{'type': 'Map', 'title': 'National Library of Scotland, georeferenced Ordnance Survey maps: 25-inch County Series (Glamorgan XLVII.6, c. 1900) and six-inch National Grid (ST 17 SE, 1949–70); "Ty-mawr" east of the farm buildings on both', 'url': 'https://maps.nls.uk/geo/explore/'}, w('/great-house-farm/name-variations/', 'Name & Location Variations'), {'type': 'Planning file', 'title': 'EV-0046 — Outline planning permission 3/8996/3337 for about 13 houses (1972)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0046-1972-outline-planning-permission-ownership-certificate/'}],
   case="The family's account: in 1971 the name moved off the eastern fields (Parcel B) onto the house plot (Parcel A) and became \"Great House Farm\", so that one name on the map covered house and fields alike — a year before the 1972 permission and three years before the 1974 attempt to remove Mary. The 1971 sheet itself (1:2,500 ST 1673–1773; six-inch ST 17 SE) is the record that shows where the name went. Trade directories already wrote \"Great House farm\" from 1887.")  # tour stop — Sion's Tab agent
sc('IV', 'ghf-19720101-1', '1972-01-01', '1972 (re-notified 9 December 1985)', 'Cwm Cydfin SSSI', 'Cwm Cydfin, Leckwith', '?',
   'Public record',
   'Cwm Cydfin, the wooded valley at Leckwith, is notified as a Site of Special Scientific Interest (SSSI 0524). It is re-notified on 9 December 1985.',
   [w('/evidence/ev-0218-cwm-cydfin-sssi-0524-citation-and-boundary/', 'EV-0218 — Cwm Cydfin SSSI 0524: citation and boundary', 'Public record'), w('/evidence/ev-0221-nrw-sssi-0524-notification-file/', 'EV-0221 — NRW SSSI 0524 notification file', 'Public record')])  # coverage: research chronology — Sion's Tab agent
sc('IV', 'ghf-19720725-1', '1972-07-25', '1970 – 72', "Village green and planning permission", 'Planning office', 'AB',
   'Planning file',
   "On 16 June 1970 land beside Leckwith Road is provisionally registered as village green VG41 (the date stamped on the VG 41 provisional register map). On 25 July 1972 planning permission is granted for housing on the site, while Mary lives in the farmhouse.",
   [REDEV, TL,
    {'type': 'Legislation', 'title': 'Commons Registration (Glamorgan) Act 1983 (c. ix): validates the registers of common land only; village greens are not covered',
     'url': 'https://www.legislation.gov.uk/ukla/1983/9'},
    {'type': 'Legislation', 'title': 'EV-0232 — Commons Registration (Glamorgan) Act 1983: common land registers only (wiki evidence page)', 'url': WIKI + '/evidence/ev-0232-commons-registration-glamorgan-act-1983/'}], aliases=['ghf-19700616-1'],
   ledger={'A': 'Freehold: the Williamses (Mary in the house) · land beside Leckwith Road provisionally registered as village green VG41 (16 June 1970)'})
sc('IV', 'ghf-19720731-1', '1972-07-31', '31 July 1972', 'Village green objections close', 'Leckwith Road, Llandough', 'A',
   'Public record',
   'The second objection period under the Commons Registration Act 1965 ends. It covers VG41, the land by Leckwith Road provisionally registered as a village green on 16 June 1970. Notice of the registration is given to the public; no personal notice to the occupiers of the farm is required.',
   [w('/evidence/ev-0263-commons-registration-1965-publicity-glamorgan-notices-vg41/', 'EV-0263 — Commons registration 1965: publicity and Glamorgan notices (VG41)', 'Public record')])  # coverage: research chronology — Sion's Tab agent
sc('IV', 'ghf-19740415-1', '1974-04-15', '15 April 1974', "Open day", 'Great House Farm', 'A',
   'Newspaper',
   "On 15 April 1974 Mary opens the farmhouse to the public. The Daily Telegraph reports her saying ownership has been disputed for 25 years and her solicitors tell her she has a valid case.",
   [press('N03', "Daily Telegraph, 16 April 1974, 'Open day to save ancient Welsh house'", 'ghf-e090-n03-1974-open-day-telegraph.jpg'),
    w('/1974-licence-letters/#action', 'The 1974 Licence Letters')],
   image='/media/ghf-e090-n03-1974-open-day-telegraph.jpg')
sc('IV', 'ghf-19740101-1', '1974-04-26', "26 April 1974", "Royal Commission survey", "Great House — interior", 'A',
   "Heritage record",
   "Ten days after the open day, H. J. Thomas of the Royal Commission measures the ground floor; his plan is dated 26 April 1974. The Commission's 1988 report records that the house \"was surveyed in unusual circumstances in 1974\", that \"much detail was then concealed\", that \"it was not possible to examine the first floor and roof trusses\", and that it \"remained partially recorded because of problems of access created by an ownership dispute\". The upper floor and roof, where the dating evidence lay, are never seen.",
   [HER, {'type': 'Official correspondence', 'title': 'RCAHMW reply RC26-0375, 29 September 2026, quoting the unpublished 1988 report (archive 6048945) — wiki page', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/rcahmw-correspondence/'}, w('/evidence-library/ghf-e137-1974-h-j-thomas-rcahmw-architectural-survey-and-floor-plan/', 'GHF-E137 — 1974 H. J. Thomas / RCAHMW architectural survey and floor plan', 'Evidence catalogue'), w('/evidence-library/ghf-e183-heneb-her-source-file-request-and-replies-september-october-2026/', 'GHF-E183 — Heneb / HER source-file request and replies, September–October 2026', 'Evidence catalogue'), ARCH],
   case="The family's reading: Mary had opened her doors to the public that month to save the house, so the access problem came from the paper owner, not from her. A full record of a sub-medieval house would have strengthened the case for its protection. The Commission's file holds no correspondence that shows who limited access.")  # tour stop — Sion's Tab agent
sc('IV', 'ghf-19740703-1', '1974-07-03', '3 July 1974', "1974 possession action", 'County court', 'A',
   'Court record',
   "BP Pension Trust brings a county court action for possession. On 3 July 1974 the case is part heard and adjourned for a formal defence to be filed; Mary's defence then pleads that the action is barred under the Limitation Act 1939. Her statement describes the 1877 sale. The case is never relisted.",
   [w('/1974-licence-letters/#action', 'The 1974 Licence Letters — the action', 'Court record'), JUDG],
   ledger={'A': 'Freehold claimed by Mary, in occupation · ownership pleaded in her defence after the 3 July 1974 adjournment (never decided)'})
sc('IV', 'ghf-19741031-1', '1974-10-31', 'September – October 1974', "The 1974 letters", 'Great House Farm', 'A',
   'Court record',
   "On 19 September 1974 BP is given leave to enforce the 1962 order; Mary had not been given notice. On 31 October BP writes to \"Mary Buckler\" (the family copy; the Court of Appeal describes the letters as addressed to Mrs Buckler, \"described again as Mrs Williams\") that she may remain in the farmhouse under licence. The letters reach her solicitor on 4 November, when the stay application comes before the judge; the landlords' solicitors afterwards withdraw the warrant, at a date before 25 November 1974. She does not accept.",
   [w('/1974-licence-letters/#letters', 'The 1974 Licence Letters', 'Court record'), JUDG,
    w('/1974-licence-letters/#warrant', 'The 1974 Licence Letters — the warrant', 'Court record')],
   aliases=['ghf-19741031-2', 'ghf-19740919-1'],
   ledger={'S': 'Attempt 6: BP\'s "licence" letters to Mary, 31 October 1974 (never accepted); 1962 warrant withdrawn before 25 November 1974'})
sc('IV', 'ghf-19741119-1', '1974-11-19', '19 November, 1970s (year unclear)', "Letter to the Western Mail", 'Western Mail — letters', 'A',
   'Newspaper',
   "A letter to the Western Mail, dated 19 November (year unclear), traces the land's descent.",
   [press('N04', "Western Mail, 'Grievous loss' (letter)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg'),
    w('/restoration-campaign/#open-day-1974', 'The Restoration Campaign')])
sc('IV', 'ghf-19750523-1', '1975-05-23', '23 May 1975', "The 1975 conveyance", 'BP Pension Trust / BP Properties', 'A',
   'Land Registry record',
   "On 23 May 1975 BP Pension Trust conveys property at Great House Farm, with a plan, to BP Properties Ltd. The Court of Appeal later calls it \"the actual conveyance of the farmhouse and garden\".",
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   ledger={'S': 'Paper: conveyance BP Pension Trust → BP Properties of "the farmhouse and garden" (no earlier deed to Parcel A behind it)'})
sc('IV', 'ghf-19751201-1', '1975-12-01', '1 December 1975', 'Compulsory registration begins', 'HM Land Registry', 'AB',
   'Public record',
   'From 1 December 1975 a sale of land in the Vale of Glamorgan must be registered at HM Land Registry. The 1969 and May 1975 conveyances come before this date; the November 1982 sale of the fields falls after it and is lodged within eleven days. The February 1983 application for the farmhouse was most likely voluntary.',
   [w('/evidence/ev-0265-hmlr-registration-background-compulsory-1975-r29-certificate/', 'EV-0265 — Compulsory registration 1 Dec 1975; solicitor’s certificate; Gazette notices', 'Public record')])
sc('IV', 'ghf-19800522-1', '1980-05-22', '22 May 1980', "Hansard", 'House of Commons', '',
   'Parliament',
   "On 22 May 1980 Ted Rowlands MP tells the House of Commons that Western Ground Rents, \"the most rapacious ground landlord\" in South Wales, has been bought by the BP pension fund.",
   [press('N16', 'Hansard, 22 May 1980', 'ghf-e090-n16-1980-hansard-rowlands.jpg')],
   image='/media/ghf-e090-n16-1980-hansard-rowlands.jpg')
sc('IV', 'ghf-19810207-1', '1981-02-07', '7 February 1981', 'Ground rents sold', 'South Wales', '',
   'Newspaper',
   'BP Pension Trust sells its residential freehold ground rents in South Wales to Cefn Estates.',
   [w('/evidence/ev-0289-snippets-only-bp-pension-trust-in-south-wales-1981-83-sale-of-its-residential-grou/', 'EV-0289 — BP Pension Trust in South Wales, 1981–83: sale of its residential ground rents (snippets)', 'Newspaper')])  # coverage: research chronology — Sion's Tab agent
sc('IV', 'ghf-19821001-1', '1982-10-01', '1 October 1982', "GGAT advice", 'GGAT', 'AB',
   'Planning file',
   "On 1 October 1982 GGAT advises the planners that occupation may continue in the area and asks for investigation before development.",
   [ARCH, GGAT_REV,
    press('N05', 'Neath Guardian, 17 April 1980 (Roman villa, a separate site)'),
    press('N06', "South Wales Echo, 18 March 1983 — burnt relics (Roman villa finds, a separate site)", 'ghf-e090-n06-1983-echo-burnt-relics.jpg')],
   aliases=['ghf-19780101-1', 'ghf-press-19800417-n05', 'ghf-19830313-1'])
sc('IV', 'ghf-19821119-1', '1982-11-19', '19 – 30 November 1982', "First registration", 'HM Land Registry', 'AB',
   'Land Registry record',
   "On 30 November 1982 Linklaters & Paines apply to register BP Properties as owner of the land, title WA231076. Mary is living in the farmhouse.",
   [LRT('first-registration', 'Land Registry Titles — first registration'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1982-83-registration-opportunity-to-object/', '1982–83 Registration & Opportunity to Object', 'Analysis')],
   ledger={'B': 'Registered: BP Properties, main title WA231076 (applied 30 November 1982)'})
sc('IV', 'ghf-19830223-1', '1983-02-23', '23 February 1983', "Farmhouse title", 'HM Land Registry', 'A',
   'Land Registry record',
   "On 23 February 1983 BP's solicitors apply to register the farmhouse and garden as a separate title, WA240304, on the 1975 conveyance, certifying they know of no question or doubt affecting the title.",
   [LRT('first-registration', 'Land Registry Titles — first registration'), LEGAL],
   ledger={'S': 'Paper: registered as a separate title, WA240304, on the 1975 conveyance ("no question or doubt")'})
sc('IV', 'ghf-19830326-1', '1983-03-26', '26 March 1983', "Death of Mary (Nancy) Williams", 'Great House Farm', 'A',
   'Source pending',
   "Mary (Nancy) Williams dies in the farmhouse on 26 March 1983. Her son William inherits her estate.",
   [w('/mary-williams/#death', 'Mary (Nancy) Williams — death'), w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   ledger={'A': 'Freehold claim passes to Billy Buckler, in occupation · never decided, never extinguished'})
sc('IV', 'ghf-19830408-1', '1983-04-08', '8 April – 12 May 1983', "Registration correspondence", 'HM Land Registry', 'A',
   'Land Registry record',
   "On 8 and 12 April and 12 May 1983 Linklaters and the Land Registry exchange letters on the farmhouse file, including form D23.",
   [LRT('first-registration', 'Land Registry Titles — first registration')])

# ---------------------------------------------------------------- ACT V
sc('IV', 'ghf-19831026-1', '1983-10-26', '26 October 1983', 'Conservation reports', 'Llandough', 'A',
   'Newspaper',
   'The South Wales Echo reports that the Community Council and the Vale planners have Great House Farm in view in their conservation reports as a notable building. No listing or decision follows.',
   [w('/evidence/ev-0072-south-wales-echo-1983-conservation/', 'EV-0072 — South Wales Echo, 26 October 1983, p.9 (conservation)', 'Newspaper')])  # coverage: research chronology — Sion's Tab agent
sc('V', 'ghf-19840522-1', '1984-05-22', '1984', "The writ", 'BP Properties', 'A',
   'Court record',
   "On 22 May 1984 BP Properties issues a writ for possession of Great House Farm and adjoining land against William Buckler. The defence relies on adverse possession from 1955.",
   [w('/bp-properties-v-buckler/#writ', 'BP Properties Ltd v Buckler — the writ', 'Court record'), w('/1877-agreement/#library-1984', 'The 1877 Agreement — library copy missing'),
    LRT('first-registration')],
   aliases=['ghf-19840113-1'])
sc('V', 'ghf-19860710-1', '1986-07-10', '10 – 24 July 1986', "High Court hearing and judgment", 'High Court, Cardiff', 'A',
   'Court record',
   "On 10 July 1986 the case is heard before Mr Justice Hollis in the High Court at Cardiff. On 24 July 1986 he gives judgment for BP, holding that the 1974 letters gave Mary a licence.",
   [w('/bp-properties-v-buckler/#high-court', 'BP Properties Ltd v Buckler — High Court', 'Court record'),
    w('/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/', 'BP v Buckler: Scope, Decided & Undecided', 'Analysis')])
sc('V', 'ghf-19860711-1', '1986-07-11', '1986 – 87', "Royal Commission correspondence", 'Royal Commission (RCAHMW)', 'A',
   'Official correspondence',
   "During the trial and appeal, the Royal Commission's correspondence with Mrs Buckler goes missing.",
   [w('/scrutiny-and-accountability/legal-review-fraud-land-human-rights/#loss-pattern', 'Legal Review — the loss pattern', 'Analysis')])
sc('V', 'ghf-19870202-1', '1987-02-02', '2 February 1987', "Amalgamation of titles", 'HM Land Registry', 'AB',
   'Land Registry record',
   "On 2 February 1987, while the appeal is pending, an application is made to amalgamate WA240304 (the separately registered farmhouse and garden) into WA231076 (the larger field title). The register then presents the two strands as one corporate holding. The affirmative 'synthetic estate' question is whether a title originating in the Bute-to-WGR field chain was joined to a separately registered house title without the older Cydwin/Cydfin and Williams/Thomas chain being traced through the underlying instruments. The amalgamation records a registration event; its file, the 1877 documents, and the 1938 and 1969 conveyances must be read together to reconstruct the title's provenance.",
   [LRT('first-registration', 'Land Registry Titles — amalgamation'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/', '1987 HMLR Amalgamation During Appeal', 'Analysis'),
    w('/anomalies-register/llandough-penarth-cydfin-ty-mawr-manorial-evidence/', 'Cydfin / Ty Mawr and pre-1877 manorial evidence'),
    {'type': 'Research annex', 'title': 'Cedwyn Estate — title-chain reconstruction', 'url': 'https://bpvsbuckler.bucklerfamily.estate/research/cedwyn-estate-title-chain.html'}],
   ledger={'S': None, 'B': None,
           'M': 'Registered: BP Properties, WA231076 = Parcel B + synthetic Parcel A (farmhouse title folded in, 2 February 1987)'})
sc('V', 'ghf-19870731-1', '1987-07-31', '31 July 1987', "Court of Appeal", 'Court of Appeal, London', 'A',
   'Court record',
   "On 31 July 1987 the Court of Appeal (Dillon LJ, Mustill LJ, Sir Edward Eveleigh) dismisses the appeal in BP Properties Ltd v Buckler. It finds adverse possession from 1955, but holds that the 1962 action stopped time and the 1974 letters made the possession permissive.",
   [JUDG, w('/bp-properties-v-buckler/#omits', 'BP Properties Ltd v Buckler — what it omits', 'Analysis')],
   ledger={'A': 'Freehold claim: Billy Buckler · never adjudicated, never extinguished (judgment decides possession only)',
           'M': 'WA231076, BP Properties · right to possession upheld (1962 order + 1974 licence)'})
sc('V', 'ghf-19871217-1', '1987-12-17', '1987 – 17 December 1987', 'Village green extension request', 'Llandough Community Council', 'A',
   'Council minutes',
   'Llandough Community Council minutes for 1987 record that there is "no justification" for submitting a right of way from Great House Farm to the Swiss Cottages, and name Debenham Tewson as "the agents for BP Properties". At the meeting of 17 December 1987 a resident\'s letter asks for VG41 to be "extended up to the farm wall"; the farm roadway is called "an unofficial access route", and the council\'s Penlan Road licence is recorded as terminated by Debenham Tewson.',
   [w('/evidence/ev-0214-llandough-community-council-minutes-1987/', 'EV-0214 — Llandough Community Council minutes, 1987', 'Council minutes')])  # coverage: research chronology — Sion's Tab agent
sc('V', 'ghf-19880303-1', '1988-03-03', '3 March 1988', "House of Lords", 'House of Lords', 'A',
   'Court record',
   "On 3 March 1988 the House of Lords refuses leave to appeal. The family are given 28 days to leave.",
   [w('/bp-properties-v-buckler/#house-of-lords', 'BP Properties Ltd v Buckler — House of Lords', 'Court record')])

# ---------------------------------------------------------------- ACT VI
sc('VI', 'ghf-19880429-1', '1988-04-29', '29 April 1988, morning', "First eviction attempt", 'Great House Farm', 'A',
   'Newspaper',
   "On 29 April 1988 five bailiffs and about fifteen police arrive. William Buckler blocks the drive with a tractor and secures the house.",
   [press('N07', "'Chainsaw farmer vows to fight on', c. 30 April 1988", 'ghf-e090-n07-1988-police-wait-photo.jpg'),
    echo('01', '29 April 1988')],
   image='/media/ghf-e090-n07-1988-police-wait-photo.jpg',
   aliases=['ghf-press-n15-01'])
sc('VI', 'ghf-19880429-2', '1988-04-29', '29 April 1988', "The chainsaw", 'Great House Farm', 'A',
   'Newspaper',
   "The bailiffs break the gate and doors. William Buckler pushes a running chainsaw through a door. After four hours the bailiffs withdraw. BP tells the press Mary had been allowed to stay rent-free because of ill health.",
   [press('N07', "'Chainsaw farmer vows to fight on'", 'ghf-e090-n07-1988-chainsaw-farmer.jpg'), echo('02', '30 April 1988')],
   image='/media/ghf-e090-n07-1988-chainsaw-farmer.jpg',
   aliases=['ghf-press-n07', 'ghf-press-n15-02'])
sc('VI', 'ghf-19880512-1', '1988-05-12', 'May 1988', "Strasbourg and the MP", "Alun Michael MP's office", 'A',
   'Newspaper',
   "On 3 May 1988 William Buckler applies to the European Commission of Human Rights. On 12 May Alun Michael MP asks the Lord Chancellor to review the case.",
   [echo('03', '12 May 1988'), w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record')],
   aliases=['ghf-press-n15-03', 'ghf-19880503-1'])
sc('VI', 'ghf-19880729-1', '1988-07-29', '29 July 1988', "Cadw inspection", 'Great House Farm', 'A',
   'Photograph',
   "On 29 July 1988 Cadw inspects and photographs the farmhouse and barn while considering them for listing.",
   [CADW_PH, CADW_BARN, CADW_CRIT],
   image='/media/1988-cadw-farmhouse.jpg')
sc('VI', 'ghf-19881007-1', '1988-10-07', 'October – November 1988', 'BP Pension Fund sells the estate land', 'South Wales', 'x',
   'Newspaper',
   'In October 1988 BP Pension Fund sells about 1,300 acres of Welsh land to Intercontinental Land & Development (Cardiff) Ltd for £29,375,400, chosen by open tender. In November the Land Authority for Wales buys sites from Lavernock to Leckwith, including plots at Llandough. The Great House Farm site stays with BP Properties Ltd.',
   [w('/evidence/ev-0270-bp-pension-fund-1988-sale-intercontinental-law-llandough-press/', 'EV-0270 — Press, 1988–95: BP Pension Fund sale, LAW plots at Llandough', 'Newspaper'),
    w('/evidence/ev-0269-tna-wa-9-49-land-authority-for-wales-board-1988/', 'EV-0269 — TNA WA 9/49: LAW Board minutes, Oct–Nov 1988', 'Archive catalogue')])
sc('VI', 'ghf-19881130-1', '1988-11-30', '29 – 30 November 1988', "Eviction", 'Great House Farm', 'A',
   'Newspaper',
   "On 29–30 November 1988 bailiffs enter the farmhouse. William Buckler is taken to Llandough Hospital. Eight other residents are made homeless.",
   [press('N14', "South Wales Echo front page — 'Angry scenes as farmer evicted'", 'ghf-e090-n14-1988-echo-front-page.jpg'),
    echo('04', '30 November 1988'),
    press('N09', "South Wales Echo, 3 December 1988 — 'Billy's unhappy family'", 'ghf-e090-n09-1988-billys-unhappy-family.jpg')],
   image='/media/ghf-e090-n14-1988-echo-front-page.jpg',
   aliases=['ghf-press-n14', 'ghf-press-n15-04', 'ghf-press-n09'],
   ledger={'A': 'Freehold claim: Billy Buckler, evicted 29/30 November 1988 · never adjudicated, never extinguished',
           'M': 'WA231076, BP Properties · in possession from 29/30 November 1988'})
sc('VI', 'ghf-19881201-1', '1988-12-01', '1 December 1988', "Belongings", 'Llandough Hospital', 'A',
   'Newspaper',
   "The family's belongings, including Mary's papers and photographs, are left in the house or put in the road.",
   [press('N08', 'South Wales Echo, 3 December 1988'), echo('11', '13 December 1988')],
   aliases=['ghf-press-n15-11'])
sc('VI', 'ghf-19881202-1', '1988-12-02', '2 December 1988', "Injunction", 'High Court', 'A',
   'Newspaper',
   "On 2 December 1988 a High Court judge orders that the farmhouse and its contents must not be touched. BP states it plans to demolish and build homes.",
   [press('N08', "South Wales Echo, 3 December 1988 — 'History fight to save farm'", 'ghf-e090-n08-1988-history-fight.jpg'), echo('05', '2 December 1988')],
   image='/media/ghf-e090-n08-1988-history-fight.jpg',
   aliases=['ghf-press-n15-05', 'ghf-press-n08'])
sc('VI', 'ghf-19881209-1', '1988-12-03', '3 December 1988', "Charges", 'Llandough Hospital / magistrates', 'A',
   'Newspaper',
   "William Buckler is taken from hospital and charged with assaulting two bailiffs, criminal damage, and wanton or furious driving.",
   [echo('06', '3 December 1988'), press('N15', 'South Wales Echo, 3 December 1988')],
   aliases=['ghf-19881130-2', 'ghf-press-n15-06', 'ghf-press-n15-10'])
sc('VI', 'ghf-19881203-1', '1988-12-03', '3 – 5 December 1988', "Spot-listing", 'Cadw', 'A',
   'Official correspondence',
   "Over the weekend of 3–5 December 1988 Cadw considers spot-listing without access to the interior.",
   [CADW_CRIT, press('N08', "South Wales Echo, 3 December 1988 — Cadw considering spot-listing")])
sc('VI', 'ghf-19881204-1', '1988-12-04', '1988 (date not established)', "Cadw inspection of the house", 'Great House Farm', 'A',
   'Witness statement',
   "Cadw officers come into the house, carry out a survey and report, and remark on the roof beams being high (witness statement of Branwen, who lived at the farm until 1988, given on 19 October 2026). Cadw confirms in writing that the house was visited and assessed for listing by its inspectors; its two photographs are dated 29 July 1988. A further Cadw visit was announced for the weekend of 3–4 December 1988, and Cadw declined to list on 5 December. Our case: the inspection took place in the days before that refusal; the exact date is source pending.",
   [w('/evidence/ev-0255-witness-statement-branwen-cadw-inspection-1988/', 'EV-0255 — Witness statement of Branwen: Cadw inspection of the house, 1988', 'Witness statement'),
    w('/evidence/cadw-welsh-government-correspondence/#m12', 'Cadw, 21 May 2026: assessed and rejected for listing in the 1988 community survey of Llandough; photographs dated 29 July 1988', 'Official correspondence'),
    CADW_PH,
    press('N08', "South Wales Echo, 3 December 1988 — inspector to visit the farmhouse 'this weekend'"),
    {'type': 'Photograph', 'title': 'Roof (loft) beams at Great House Farm — undated photograph, Great House Farm Part 1, no. 080 (Wayback archive): the roof beams referred to',
     'url': 'https://wayback.bucklerfamily.estate/images/0000-00-00%20-%20Great%20House%20Farm%20Part%201%20-%20080%20-%20EN%20-%20V0.0.0.00.jpg', 'image': '/media/ghf-album-p1-080-roof-beams.jpg'}],
   image='/media/ghf-album-p1-080-roof-beams.jpg')
sc('VI', 'ghf-19881205-1', '1988-12-05', 'Monday 5 December 1988', "Final hearing; listing refused", 'Cardiff', 'A',
   'Newspaper',
   "On 5 December 1988 Judge Norman Francis refuses to continue the injunction pending the European Commission. The same day Cadw states the house is not of sufficient merit to list.",
   [press('N10', "Western Mail, 6 December 1988 — 'Farmer fails in final eviction hearing'", 'ghf-e090-n10-1988-western-mail-final-hearing.jpg')],
   image='/media/ghf-e090-n10-1988-western-mail-final-hearing.jpg',
   aliases=['ghf-press-n10'])
sc('VI', 'ghf-19881206-1', '1988-12-06', '6 December 1988, 4am', "Demolition", 'Great House Farm', 'A',
   'Newspaper',
   "From about 4am on 6 December 1988 the farmhouse and buildings are demolished.",
   [press('N11', "'Tears flow as 800 year-old farm house is razed at last'", 'ghf-e090-n11-1988-tears-flow-razed.jpg'),
    echo('07', '6 December 1988'), echo('12', '21 December 1988 (reader\'s letter on "Bulldozed Before Breakfast")'), HER],
   image='/media/ghf-e090-n11-1988-tears-flow-razed.jpg',
   aliases=['ghf-press-n11', 'ghf-press-n15-07', 'ghf-press-n15-12', 'ghf-19881211-1'],
   ledger={'A': 'Freehold claim: Billy Buckler · house demolished 6 December 1988 · title never adjudicated, never extinguished'})
sc('VI', 'ghf-19881208-1', '1988-12-07', '7 – 9 December 1988', "Local reaction and bail", 'Llandough', 'A',
   'Newspaper',
   "A Vale of Glamorgan councillor calls the demolition \"disgusting\". Villagers meet their councillors on 8 December. On 9 December William Buckler is bailed on condition he stays away from the site.",
   [echo('08', '7 December 1988'), echo('09', '9 December 1988'), echo('10', '10 December 1988'), w('/demolition-1988/', '1988: Possession and Demolition')],
   aliases=['ghf-press-n15-08', 'ghf-press-n15-09'])
sc('VI', 'ghf-19881212-1', '1988-12-12', 'December 1988', "Royal Commission in the rubble", 'Great House Farm — rubble', 'A',
   'Heritage record',
   "An examination of the rubble, recorded in the heritage record, notes a fireplace jamb and an ogee-stopped beam with torus, and the loss of the carved stone capital kept by the front door.",
   [HER, ARCH, w('/demolition-1988/', '1988: Possession and Demolition'), w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis')])

# ---------------------------------------------------------------- ACT VII
sc('VII', 'ghf-19890320-1', '1989-03-20', '20 March 1989', "Site clearance", 'Great House Farm', 'A',
   'Newspaper',
   "On 20 March 1989 lorries clear the site.",
   [echo('14', '20 March 1989')], aliases=['ghf-press-n15-14'])
sc('VII', 'ghf-19890323-1', '1989-03-23', 'January – March 1989', "Charges resolved", 'Court', 'A',
   'Newspaper',
   "In January 1989 one charge is dropped as out of time and William Buckler is barred from within half a mile of the site. On 23 March he pleads guilty to the remaining charges and is freed.",
   [echo('15', '23 March 1989'), echo('16', '24 March 1989'),
    press('N12', "'Charge against evicted farmer dropped', January 1989", 'ghf-e090-n12-1989-charge-dropped.jpg'), echo('13', '6 January 1989')],
   aliases=['ghf-press-n15-15', 'ghf-press-n15-16', 'ghf-19890115-1', 'ghf-press-n15-13'])
sc('VII', 'ghf-19890325-1', '1989-03-25', '1989', "Rehousing", 'Penarth', 'A',
   'Newspaper',
   "The family live with William Buckler's sister in Penarth. He plans to live in a converted bus and reports that about £30,000 of possessions were taken from the site.",
   [press('N13', "South Wales Echo, 1989 — 'From farm to a bus'", 'ghf-e090-n13-1989-farm-to-bus.jpg')],
   image='/media/ghf-e090-n13-1989-farm-to-bus.jpg')
sc('VII', 'ghf-19890406-1', '1989-04-06', '6 April 1989', 'Llandough listing survey issued', 'Cadw', 'A',
   'Heritage record',
   "On 6 April 1989 Cadw issues the list from its 1988 community survey of Llandough: Pound Cottage and the former National School (the church is dated 4 June 1989). Great House had been assessed and rejected in that survey. So when Cadw said on 3–5 December 1988 that it was considering spot-listing, the survey's list was not yet out.",
   [w('/evidence/ev-0272-cadw-1989-llandough-resurvey-list-13430-13431-13432/', 'EV-0272 — Cadw 13430/13431/13432: Llandough list issued 6 April 1989', 'Heritage record'),
    w('/evidence/ev-0264-tcpa-1971-s54-listing-deposit-local-land-charge/', 'EV-0264 — TCPA 1971 s.54: deposit with the council and local land charge', 'Public record'),
    w('/evidence/ev-0268-cadw-13428-lower-farmhouse-rhoose-listed-12-oct-1988/', 'EV-0268 — Cadw 13428 Lower Farmhouse, Rhoose (comparator, 12 Oct 1988)', 'Heritage record'),
    w('/evidence/ev-0271-tna-bd-34-114-historic-buildings-council-wales-1988-1989/', 'EV-0271 — TNA BD 34/114: Historic Buildings Council for Wales 1988', 'Archive catalogue')])
sc('VII', 'ghf-19890414-1', '1989-04-14', '14 April 1989', "European Commission decision", 'European Commission of Human Rights', 'A',
   'Court record',
   "On 14 April 1989 the European Commission of Human Rights declares Buckler v United Kingdom inadmissible.",
   [w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record'),
    {'type': 'Court record', 'title': 'Buckler v United Kingdom, Commission decision (PDF)', 'url': WIKI + '/wp-content/uploads/2026/09/wp-1790112811838.pdf'}])
sc('VII', 'ghf-19891107-1', '1989-11-07', 'October – November 1989', "Outline application", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "BP applies for outline planning permission for housing (89/01396/OUT, received 8 November 1989). In the same document GGAT advises an archaeological assessment, prices the work at £2,000 and discloses negotiations with BP's agents; it is then commissioned to carry out the assessment. GGAT's 1989 planning report describes the farmhouse as having been listed as a \"county treasure\"; Cadw states it was never listed.",
   [REDEV, GGAT_REV, LRT('later-dealings', 'Land Registry Titles — later dealings'), w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis'), LEGAL],
   aliases=['ghf-19891108-1', 'ghf-19891010-1'])
sc('VII', 'ghf-19900223-1', '1990-02-23', '23 February 1990', 'Homes bid and a village-green request', 'Llandough', 'A',
   'Newspaper',
   "On 23 February 1990 the South Wales Echo's front page reports a bid to build homes on the Great House Farm land. Llandough Community Council makes no objection, but asks for the land to be registered as village green.",
   [w('/evidence/ev-0273-south-wales-echo-23-feb-1990-great-house-farm-homes-bid-village-green/', 'EV-0273 — South Wales Echo, 23 Feb 1990, p.1 (snippet)', 'Newspaper'),
    w('/evidence/ev-0266-glamorgan-archives-p35-llandough-community-council-minutes-1982-2000/', 'EV-0266 — Glamorgan Archives P35/11–29: Community Council minutes 1982–2000', 'Archive catalogue')])
sc('VII', 'ghf-19900313-1', '1990-03-13', 'February – March 1990', "Outline permission", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "On 13 March 1990 outline permission is granted with 18 conditions. The officer's report notes the farm buildings \"were unfortunately demolished a little while ago\". GGAT's further comments of 8 February 1990 are missing from the file.",
   [REDEV, LEGAL], aliases=['ghf-19900208-1'])
sc('VII', 'ghf-19900529-1', '1990-05-29', '1990', "Death of William Buckler", 'Llandough', 'A',
   'Newspaper',
   "William Buckler dies in 1990, aged 41. The South Wales Echo of 2 June 1990 reports that \"Billy died suddenly\" and that he \"made a detour around Llandough so never had to pass the site of Great House Farm\".",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William'), {'type': 'Newspaper', 'title': 'EV-0290 — South Wales Echo, 2 June 1990, p.2: "Billy died suddenly this week" (snippet; wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0290-snippet-only-south-wales-echo-2-jun-1990-p-2-billy-died-suddenly-this-week-he-made/'}, {'type': 'Probate record', 'title': 'EV-0274 — Probate calendar 1991: William Beverley Buckler (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0274-probate-calendar-1991-william-beverley-buckler/'}],
   aliases=['ghf-19920515-1'],
   ledger={'A': "Freehold claim: Mary's heirs · never adjudicated, never extinguished"})
sc('VII', 'ghf-19900801-1', '1990-08-01', 'August – October 1990', "Evaluation trenches", 'Former farm site', '?',
   'Archaeological record',
   "In August 1990 GGAT digs eight trenches for BP and finds early medieval burials. An area that could not be investigated is marked low potential. In October the council records the condition as met.",
   [ARCH, GGAT_REV, REDEV], aliases=['ghf-19901015-1'])
sc('VII', 'ghf-19910821-1', '1991-08-21', '21 August 1991', "Heritage record entry", 'Historic Environment Record', 'A',
   'Heritage record',
   "The regional Historic Environment Record entry for Great House Farm (GGAT02038s) is compiled on 21 August 1991. The Royal Commission's archive record (NMR 6048945) states: \"The house and farm buildings were suddenly and completely destroyed by B.P. Properties Ltd. on 6th December 1988 amid considerable local controversy.\"",
   [HER, CADW_CRIT, w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis')])
sc('VII', 'ghf-19920514-1', '1992-05-14', '14 May 1992', "Reserved matters application", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "On 14 May 1992 Ideal Homes Wales applies for approval of 20 houses (92/00671/RES).",
   [REDEV])

sc('VII', 'ghf-19920727-1', '1992-07-27', '27 July 1992', "GGAT letter", 'GGAT', '?',
   'Planning file',
   "On 27 July 1992 GGAT writes to the council that the 1990 assessment showed significant deposits, including human bone, and urges mitigation. Page 2 is missing from the file.",
   [GGAT_REV])
sc('VII', 'ghf-19920903-1', '1992-09-03', '3 September 1992', "Reserved matters approved", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "On 3 September 1992 the 20 houses are approved without a new archaeological condition.",
   [REDEV, GGAT_REV])
sc('VII', 'ghf-19931203-1', '1993-12-03', 'December 1993', "Transfer to Ideal Homes", 'Former farm site', 'AB',
   'Land Registry record',
   "On 3 December 1993 BP transfers the site to Ideal Homes and groundworks begin. On 13 December GGAT asks the council for a breach-of-condition notice. The council accepts the developer's counsel's opinion that the condition is discharged.",
   [LRT('later-dealings', 'Land Registry Titles — later dealings'), ARCH, REDEV, LEGAL],
   aliases=['ghf-19931213-1'],
   ledger={'M': 'WA231076 transferred by BP to Ideal Homes (December 1993); later Persimmon Homes (Wales)'})
sc('VII', 'ghf-19940504-1', '1994-03-21', 'March – July 1994', "Cemetery excavation", 'Former farm site', '?',
   'Archaeological record',
   "March–July 1994: the Cotswold Archaeological Trust excavates an early medieval cemetery on the site. Published totals reach 1,026 burials. The Home Office licence lapsed between 21 April and at least 3 May while work continued.",
   [ARCH, GGAT_REV],
   aliases=['ghf-19940421-1'])
sc('VII', 'ghf-19940728-1', '1994-07-28', '28 July 1994', "Finds to the National Museum", 'National Museum of Wales', '?',
   'Museum record',
   "On 28 July 1994 Ideal Homes Wales, as landowner, gives the human remains and finds to the National Museum of Wales (95.56H).",
   [ARCH, LEGAL])
sc('VII', 'ghf-19941110-1', '1994-11-10', '1994 – 96', "Woodland title and houses", 'Woodland — WA735527', 'A',
   'Land Registry record',
   "On 10 November 1994 Ideal Homes Wales transfers the woodland to the Forest of Cardiff (WA735527); no transfer from Cardiff City Corporation is on record. In 1995–96 rights are granted to South Wales Electricity. The houses of Church View Close are built.",
   [w('/woodland/', 'Woodland'), LRT('later-dealings', 'Land Registry Titles — later dealings'), REDEV],
   aliases=['ghf-19950628-1'],
   ledger={'M': 'WA231076 and the house titles carved from it (Church View Close)',
           'A': "Freehold claim: Mary's heirs · never adjudicated, never extinguished · woodland now registered to the Forest of Cardiff (WA735527) · land to the south a village green"})
sc('VII', 'ghf-19950101-1', '1995-01-01', '1995 – 1996', 'Last dealings on the title', 'HM Land Registry', 'AB',
   'Land Registry record',
   'Rights are granted to South Wales Electricity, and correspondence with Persimmon follows; these are the last dealings on the registration file.',
   [TL, LRT('later-dealings', 'Land Registry Titles — later dealings')])  # coverage: research chronology — Sion's Tab agent
sc('VII', 'ghf-19970516-1', '1997-05-16', '16 May 1997', 'Western Ground Rents wound up', 'London', 'x',
   'Public record',
   "Western Ground Rents Ltd, placed in members' voluntary liquidation with other BP pension companies in 1996, holds its final meeting on 16 May 1997, where the liquidator lays an account of how the companies' property has been disposed of.",
   [w('/evidence/ev-0277-london-gazette-1996-1997-western-ground-rents-creditors-and-final-meetings/', 'EV-0277 — London Gazette 1996–97: WGR creditors notice and final meetings', 'Public record')])
sc('VII', 'ghf-20050101-1', '2005-01-01', '2005', "Publication", 'Medieval Archaeology', '?',
   'Archaeological record',
   "The excavation is published in Medieval Archaeology 49 (2005): 1,026 burials, 814 articulated.",
   [ARCH, {'type': 'Publication', 'title': 'Holbrook and Thomas, Medieval Archaeology 49 (2005)', 'url': WIKI + '/archaeology/'},
    w('/woodland/', 'Woodland')],
   aliases=['ghf-20051222-1'])
sc('VII', 'ghf-20051202-1', '2005-12-02', '2 December 2005', "Woodland land sold", 'Woodland (title WA735527)', 'A',
   'Company accounts',
   "On 2 December 2005 Forest of Cardiff transfers land to Goldsworthy Homes, and on 22 December part of the woodland title is divided off. Forest of Cardiff's accounts for the year to 30 June 2006 record \"Sale of Land — Leckwith Road, Llandough 20,000\". Which land was sold is not known until the transfer plan is read.",
   [{'type': 'Company accounts', 'title': 'EV-0217 — Forest of Cardiff accounts to 30 June 2006, note 13: "Sale of Land — Leckwith Road, Llandough" (wiki evidence page)', 'url': 'https://greathousefarmwiki.wordpress.com/evidence/ev-0217-forest-of-cardiff-accounts-2006-sale-of-land-leckwith-road/'}])
sc('VII', 'ghf-20190320-1', '2019-03-20', '20 March 2019', "1990 assessment archived", 'RCAHMW national archive', '?',
   'Heritage record',
   "On 20 March 2019 GGAT's 1990 assessment is added to the national record.",
   [ARCH])

# ---------------------------------------------------------------- ACT VIII
sc('VIII', 'ghf-20251117-1', '2025-11-17', 'November 2025 – January 2026', "Records requests begin", 'Royal Commission and others', '',
   'Official correspondence',
   "From November 2025 Mary's grandchildren request records from public bodies. On 29 January 2026 they apply to HM Land Registry to record the interest omitted at first registration.",
   [RAC], aliases=['ghf-20260123-1'],
   ledger={'A': "Freehold claim: Mary's grandchildren · application to the Land Registry, January 2026"})
sc('VIII', 'ghf-20260323-1', '2026-03-23', 'February – March 2026', "Land Registry reply", 'HM Land Registry', 'AB',
   'Official correspondence',
   "On 23 March 2026 HM Land Registry sets out the registration history and states there is \"no evidence of a mistake in the register\".",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint'),
    {'type': 'Official correspondence', 'title': 'HMLR holding letter, 13 February 2026 (PDF)',
     'url': 'https://github.com/unclehowell/datro/blob/wayback/wayback/pdf/foi/2026-02-13_hmlr_wa231076_holding-letter.pdf'}],
   aliases=['ghf-20260213-1'])
sc('VIII', 'ghf-20260419-1', '2026-04-19', '19 April – 25 May 2026', "Complaint decisions", 'HM Land Registry', 'AB',
   'Official correspondence',
   "On 19 April 2026 HM Land Registry refuses the stage-one complaint. On 25 May the stage-two decision states the title is \"registered correctly\".",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   ledger={'M': "Land Registry, May 2026: 'registered correctly'"})
sc('VIII', 'ghf-20260521-1', '2026-05-21', '21 May 2026', "Cadw disclosure", 'Cadw', 'A',
   'Official correspondence',
   "On 21 May 2026 Cadw releases two photographs of 29 July 1988, coded \"YYY\", which it describes as \"marginally below the bar\"; on 10 July it states that the code meant the building did not meet the criteria. It describes its paper file as \"quite likely\" destroyed, and later \"most likely\"; it holds no destruction record.",
   [RAC, CADW_CRIT, CADW_PH, w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis')], image='/media/1988-cadw-barn.jpg')
sc('VIII', 'ghf-20260614-1', '2026-06-14', '14 June 2026', 'Council minutes at the archives', 'Llandough Community Council', '',
   'Official correspondence',
   "The Clerk to Llandough Community Council replies that the council's minutes from 1982 were deposited at Glamorgan Archives in 2002, and refuses the rest under section 21 of the Freedom of Information Act. The family's follow-up the same day goes unanswered.",
   [w('/evidence/llandough-community-council-correspondence/#m07', 'Llandough Community Council correspondence (M06, M07)', 'Official correspondence')])  # coverage: research chronology — Sion's Tab agent
sc('VIII', 'ghf-20260716-1', '2026-07-16', '16 July 2026', 'Police records', 'South Wales Police', '',
   'Official correspondence',
   'South Wales Police answer freedom of information request 719/26: they "hold no information".',
   [w('/evidence/south-wales-police-correspondence/#m33', 'South Wales Police correspondence (M33; EV-0159)', 'Official correspondence')])  # coverage: research chronology — Sion's Tab agent
sc('VIII', 'ghf-20260730-1', '2026-07-30', 'June – July 2026', "Schedule of registration documents", 'HM Land Registry', 'AB',
   'Official correspondence',
   "On 30 July 2026 HM Land Registry supplies a schedule of 43 documents on the first-registration files. The 31 December 1969 conveyance and the 1971 abstract are not listed.",
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260602-1'])
sc('VIII', 'ghf-20260825-1', '2026-08-25', '25 August 2026', "Museum Wales reply", 'Museum Wales', '?',
   'Official correspondence',
   "On 25 August 2026 Museum Wales replies that the information is \"not held\", and in the same letter states that it has found records of other discoveries at Great House Farm, which it withholds as \"not in scope\".",
   [RAC])
sc('VIII', 'ghf-20260908-1', '2026-09-08', '8 September 2026', "Glamorgan Archives reply", 'Glamorgan Archives', 'A',
   'Official correspondence',
   "On 8 September 2026 Glamorgan Archives report no deeds for the 1877 sale, and identify Bute X.6(12), the trustees' 1877 book of payments, at Cardiff Library.",
   [w('/1877-agreement/#glamorgan-2026-4097b', 'The 1877 Agreement — Glamorgan Archives reply', 'Official correspondence')])
sc('VIII', 'ghf-20260914-1', '2026-09-14', '14 September 2026', 'The 1965 school-site conveyance', 'Vale of Glamorgan Council', '?',
   'Official correspondence',
   'In answer to request 00211027 the Vale of Glamorgan Council releases the conveyance of the school site dated 11 June 1965 and the 1965 contract.',
   [w('/evidence/vale-of-glamorgan-council-correspondence/#m109', 'Vale of Glamorgan Council correspondence (M109; EV-0042, EV-0216)', 'Official correspondence')])  # coverage: research chronology — Sion's Tab agent
sc('VIII', 'ghf-20260917-1', '2026-09-17', '17 – 21 September 2026', "Complaints and correspondence", 'Cadw / Stephen Doughty MP', 'A',
   'Official correspondence',
   "September 2026: the family make a formal complaint to Cadw (investigation commenced 29 September), write to Stephen Doughty MP on 18 and 19 September, and request records from Heneb on 20 September. On 21 September an HM Land Registry support agent states the title was \"closed in 2005\".",
   [RAC, w('/restoration-campaign/', 'The Restoration Campaign'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint'), w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis')],
   aliases=['ghf-20260918-1'])
sc('VIII', 'ghf-20260923-1', '2026-09-23', '23 September 2026', "House of Lords papers", 'The National Archives', 'A',
   'Official correspondence',
   "On 23 September 2026 The National Archives reports that the House of Lords judicial papers in BP Properties Ltd v Buckler survive (YHL/PO/JO/10/11/2536). Earlier searches had not found them.",
   [RAC, w('/records-access-chronology/source-conflicts-register/', 'Source Conflicts Register', 'Analysis'), LEGAL])
sc('VIII', 'ghf-20260925-1', '2026-09-25', '25 – 27 September 2026', "Woodland offer", 'Forest of Cardiff', 'A',
   'Official correspondence',
   "On 25 September 2026 the Forest of Cardiff offers the family a route to ownership of the woodland. On 27 September the family decline.",
   [w('/woodland/', 'Woodland'), RAC])
sc('VIII', 'ghf-20260927-1', '2026-09-27', '27 – 29 September 2026', "Complaints to Heneb and the Reviewer", 'Heneb / HM Land Registry', 'AB',
   'Official correspondence',
   "27–29 September 2026: the family's formal complaint to Heneb and GGAT Ltd about GGAT's role, 1982–1995 (an investigating officer is appointed on 29 September); HM Land Registry's handling referred to the Independent Complaints Reviewer (ICR/090/26).",
   [GGAT_REV, RAC])
sc('VIII', 'ghf-20260929-1', '2026-09-29', '29 September – 5 October 2026', "Archive releases", 'Cadw / RCAHMW / Museum Wales', 'A',
   'Official correspondence',
   "On 29 September 2026 the Royal Commission releases its records, including the 1974 newspaper report and a note of the armour. On 5 October Museum Wales releases further records.",
   [ARCH, w('/where-things-stand/', 'Where Things Stand'),
    w('/records-access-chronology/foi-reply-register/ghf-e106-r33-amgueddfa-cymru-reply-further-collections-search-following-8-september-2026-foi/', 'Museum Wales reply (GHF-E106-R33)', 'Official correspondence')],
   aliases=['ghf-20261005-1'])
sc('VIII', 'ghf-20261006-1', '2026-10-06', 'September – October 2026', "HER source-file digitisation and publication", 'Heneb / Archwilio', 'A',
   'Official correspondence',
   "The public HER entry GGAT02038s already referred to H. J. Thomas's 1974 survey and cited R. F. Suggett's December 1988 note. Following the family's September 2026 records request, Heneb reportedly stated on 14 October that the underlying source file had been digitised and uploaded to Archwilio as PDFs in the sources section. Heneb responded to the schedule of records on 16 October. This distinguishes the earlier public citation from the later availability of the underlying source-file material; it does not by itself establish concealment or what the Strasbourg Commission received.",
   [HER, LEGAL, w('/evidence-library/ghf-e183-heneb-her-source-file-request-and-replies-september-october-2026/', 'GHF-E183 — Heneb / HER source-file request and replies, September–October 2026', 'Evidence catalogue'), w('/evidence-library/ghf-e184-heneb-schedule-of-records-and-16-october-response/', 'GHF-E184 — Heneb schedule of records and 16 October response', 'Evidence catalogue'), w('/evidence-library/ghf-e145-echr-application-14464-88-and-commission-decision-14-april-1989/', 'GHF-E145 — ECHR application 14464/88 and Commission decision, 14 April 1989', 'Evidence catalogue')],
   aliases=['ghf-20260922-1', 'ghf-20261003-1'])
sc('VIII', 'ghf-20261010-1', '2026-10-10', '10 – 15 October 2026', 'Application to correct the register', 'HM Land Registry', 'AB',
   'Land Registry record',
   'HM Land Registry opens internal application Z084NQV (ref N610CGV) "to investigate and correct any error that may have been made" on WA231076, after the family raises the matter. On 15 October the family applies to alter the register of WA240304 and WA231076.',
   [w('/evidence/hm-land-registry-correspondence/#m77', 'HM Land Registry correspondence — application Z084NQV (M77)', 'Official correspondence'), w('/evidence/hm-land-registry-correspondence/#m78', 'HM Land Registry correspondence — application to alter the register (M78)', 'Official correspondence')])  # coverage: research chronology — Sion's Tab agent
sc('VIII', 'ghf-20261011-1', '2026-10-11', '11 – 13 October 2026', 'Council refuses on cost', 'Llandough Community Council', '',
   'Official correspondence',
   'The Clerk to Llandough Community Council refuses the family\'s request of 21 September under section 12 (cost); other matters are to be "considered at the October meeting". On 13 October the family asks for an internal review.',
   [w('/evidence/llandough-community-council-correspondence/#m15', 'Llandough Community Council correspondence (M15)', 'Official correspondence'), w('/evidence/llandough-community-council-correspondence/#m18', 'Llandough Community Council correspondence (M18)', 'Official correspondence')])  # coverage: research chronology — Sion's Tab agent
sc('VIII', 'ghf-20261019-1', '2026-10-19', '19 October 2026', "Welsh Government and Cadw replies", 'Welsh Government / Cadw', '',
   'Official correspondence',
   "On 19 October 2026 the Welsh Government answers ATISN 26-0010: searches for the farm name, Western Ground Rents and BP Properties found no files, and \"any routine records would have been destroyed in line with the corporate retention schedule applied at the time\". The same day Cadw refuses ATISN 27589 under section 14(2) of the Freedom of Information Act, as \"substantially similar\" to ATISN 27021, already answered and internally reviewed. Neither letter states when, or under which schedule, any file was destroyed.",
   [w('/evidence/ev-0244-welsh-government-atisn-26-0010-disclosure-response-19-oct-2026/', 'EV-0244 — Welsh Government ATISN 26-0010 response, 19 Oct 2026', 'Official correspondence'),
    w('/evidence/ev-0245-cadw-atisn-27589-response-s14-2-19-oct-2026/', 'EV-0245 — Cadw ATISN 27589 response (s.14(2)), 19 Oct 2026', 'Official correspondence'),
    {'type': 'Official correspondence', 'title': 'Welsh Government letter, ATISN 26-0010, 19 October 2026 (PDF)',
     'url': 'https://wayback.bucklerfamily.estate/pdf/foi/2026-10-19_welsh-government_atisn-26-0010_disclosure-response.pdf'},
    {'type': 'Official correspondence', 'title': 'Cadw letter, ATISN 27589, 19 October 2026 (PDF)',
     'url': 'https://wayback.bucklerfamily.estate/pdf/foi/2026-10-19_cadw_atisn-27589_response-s14-2.pdf'},
    w('/evidence/cadw-welsh-government-correspondence/', 'Cadw / Welsh Government — correspondence (email)', 'Official correspondence')])

# ---------------------------------------------------------------- STATING THE OBVIOUS
sc('O', 'ghf-obvious-01', '9998-01-01', 'Plainly', "They were not squatters", '', '',
   'Analysis',
   "The Williams family lived at Great House from 1667 to 1988.",
   [MARY, w('/williams-buckler-family/', 'The Williams / Buckler Family')])
sc('O', 'ghf-obvious-02', '9998-01-02', 'Plainly', "Mary never asked for permission", '', '',
   'Analysis',
   "Mary (Nancy) Williams refused the tenancies offered in 1959 and 1965 and did not accept the 1974 letters.",
   [w('/1962-possession-order/#refusal-1959', 'The 1959 refusal', 'Court record'), w('/1962-possession-order/#offer-1965', 'The 1965 offer'), w('/1974-licence-letters/#letters', 'The 1974 Licence Letters', 'Court record')])
sc('O', 'ghf-obvious-03', '9998-01-03', 'Plainly', "Nobody produced a deed to the house", '', '',
   'Analysis',
   "No conveyance of the farmhouse parcel to Western Ground Rents or to BP, earlier than the 1975 conveyance between two BP companies, has been produced.",
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration'), LRT('conveyances', 'Land Registry Titles — conveyances')])
sc('O', 'ghf-obvious-04', '9998-01-04', 'Plainly', "They knew it was two parcels", '', '',
   'Analysis',
   "In 1983 BP registered the farmhouse and garden as a separate title. In 1987 it was amalgamated with the main title.",
   [LRT('first-registration', 'Land Registry Titles — first registration and amalgamation')])
sc('O', 'ghf-obvious-05', '9998-01-05', 'Plainly', "Losing on possession is not losing on ownership", '', '',
   'Analysis',
   "The High Court (1986), the Court of Appeal (1987), the House of Lords (1988) and the European Commission of Human Rights (1989) ruled against the family on possession.",
   [JUDG, w('/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/', 'BP v Buckler: Scope, Decided & Undecided', 'Analysis')])
sc('O', 'ghf-obvious-06', '9998-01-06', 'Plainly', "William Buckler was the last obstacle", '', '',
   'Analysis',
   "William Buckler was injured during the eviction of 29–30 November 1988, charged from hospital on 3 December, and bailed on 9 December on condition he stayed away from the site. The house was demolished on 6 December.",
   [press('N14', "South Wales Echo — 'Angry scenes as farmer evicted'", 'ghf-e090-n14-1988-echo-front-page.jpg'), echo('06', '3 December 1988'), echo('09', '9 December 1988')])
sc('O', 'ghf-obvious-07', '9998-01-07', 'Plainly', "Four in the morning was chosen", '', '',
   'Analysis',
   "Listing was refused on 5 December 1988. Demolition began at about 4am on 6 December. The European Commission application was pending.",
   [press('N11', "'Tears flow as 800 year-old farm house is razed at last'", 'ghf-e090-n11-1988-tears-flow-razed.jpg'), HER])
sc('O', 'ghf-obvious-08', '9998-01-08', 'Plainly', "The public was on their side", '', '',
   'Analysis',
   "In 1974 about 1,000 people signed a petition to save the house. In 1988 villagers protested the demolition and an MP asked for the case to be reviewed.",
   [press('N03', "Daily Telegraph, 16 April 1974", 'ghf-e090-n03-1974-open-day-telegraph.jpg'), echo('03', '12 May 1988'), echo('08', '7 December 1988')])
sc('O', 'ghf-obvious-09', '9998-01-09', 'Plainly', "The papers did not leave on their own", '', '',
   'Analysis',
   "Mary (Nancy) Williams's statement records that the family papers were taken from the blanket box in 1950–52 by a lodger placed in the house by an estate agent, and given to the agent.",
   [MARY, w('/1877-agreement/#papers-taken', 'The 1877 Agreement — papers taken')])
sc('O', 'ghf-obvious-10', '9998-01-10', 'Plainly', "A decision with no file", '', '',
   'Analysis',
   "Cadw holds two photographs of 29 July 1988 and no other record of its 1988 listing consideration.",
   [CADW_PH, CADW_CRIT])
sc('O', 'ghf-obvious-11', '9998-01-11', 'Plainly', "They never asked a court who owned the house", '', '',
   'Analysis',
   "BP's 1974 action, in which Mary pleaded ownership, was adjourned and not relisted. The 1984 writ sought possession, not a declaration of ownership.",
   [w('/1974-licence-letters/#action', 'The 1974 Licence Letters — the action', 'Court record'), w('/bp-properties-v-buckler/#writ', 'BP Properties Ltd v Buckler — the writ', 'Court record')])

# ---------------------------------------------------------------- EPILOGUE
sc('E', 'ghf-99990101-1', '9999-01-01', 'Today', "The sequence", 'The two titles', 'AB',
   'Analysis',
   "1916 to 1987: a tenancy, two possession orders, three tenancy offers, licence letters, a conveyance, two registrations and an amalgamation.",
   [w('/the-two-parcels/', 'The Two Parcels — the title test'), JUDG, LRT('first-registration', 'Land Registry Titles'), LEGAL])
sc('E', 'ghf-99990101-4', '9999-01-01', 'Today', "The two parcels in the record", 'The two parcels', 'AB',
   'Analysis',
   "Records of 1877–1987 describe the property both as one farm and as separate parts.",
   [MARY, w('/the-two-parcels/', 'The Two Parcels — the title test'), LRT('first-registration', 'Land Registry Titles — two titles, then one'), JUDG])
sc('E', 'ghf-99990101-2', '9999-01-02', 'Today', "The site today", 'Church View Close, Llandough', 'A',
   'Analysis',
   "Church View Close, twenty houses, stands on the site. The woodland is registered to the Forest of Cardiff. The human remains are held by the National Museum of Wales.",
   [w('/where-things-stand/', 'Where Things Stand'), LEGAL, w('/missing-records-register/', 'Missing Records Register')])
sc('E', 'ghf-99990101-3', '9999-01-02', 'Today', "Village history", 'Llandough Community Council', 'A',
   'Public record',
   "Llandough Community Council's page on the village's history describes the Roman villa and the 1994 burials. It does not mention Great House, the Williams family or the demolition.",
   [{'type': 'Public record', 'title': 'Llandough Community Council — About Llandough', 'url': 'https://www.llandough-cc.co.uk/About_Us_20117.aspx'},
    w('/where-things-stand/', 'Where Things Stand')])
sc('E', 'ghf-99990102-1', '9999-01-03', 'Today', "The family's requests", 'The family', 'A',
   'Family case',
   "The family ask for: a ruling on the ownership of Parcel A; the return of the woodland and the green, or reparation; reparation for the houses built on the land; the return of the estate's artefacts; a true heritage record; and a public inquiry.",
   [w('/family-reparations-remedy-roadmap/', 'Family Reparations & Remedy Roadmap'), w('/where-things-stand/', 'Where Things Stand')],
   image='/media/1988-cadw-farmhouse.jpg')


# ---------------------------------------------------------------- reconcile 20 Oct 2026: wiki EV-0256 to EV-0277 linked on existing scenes
_RECONCILE_EVIDENCE = {
    'ghf-18970510-1': [w('/evidence/ev-0256-kemp-diary-lavernock-1897-bodleian-ms-marconi-89/', 'EV-0256 — George Kemp’s diary, 6–15 May 1897 (Bodleian MS. Marconi 89, extracts quoted by G. R. M. Garratt): Lavernock p', 'Diary')],
    'ghf-19380101-1': [w('/evidence/ev-0257-glamorgan-archives-d696-western-ground-rents-records-custodial-history/', 'EV-0257 — Glamorgan Archives D696: Western Ground Rents Ltd records 1938–44 (a syndicate headed by Lord Kennet; Bute urb', 'Archive catalogue'), w('/evidence/ev-0262-tna-lt-13-3048-western-ground-rents-v-cardiff-lands-tribunal-1967/', 'EV-0262 — TNA LT 13/3048: Western Ground Rents Ltd v the Lord Mayor, Aldermen and Citizens of the City of Cardiff, Lands', 'Archive catalogue')],
    'ghf-19550202-1': [w('/evidence/ev-0258-glamorgan-archives-aca-2-3-6-cardiff-county-court-survival-map/', 'EV-0258 — Glamorgan Archives ACA/2, ACA/3 and ACA/6: Cardiff County Court ordinary actions, plaint and minute books and ', 'Archive catalogue')],
    'ghf-19621211-1': [w('/evidence/ev-0261-hansard-1963-western-ground-rents-ministers/', 'EV-0261 — Hansard, 29 January and 5 February 1963 (with 14 November 1946): Western Ground Rents Ltd and ministers: a WGR', 'Parliamentary record')],
    'ghf-19720725-1': [w('/evidence/ev-0263-commons-registration-1965-publicity-glamorgan-notices-vg41/', 'EV-0263 — Commons Registration Act 1965 s.5 and SI 1968/989: registrations were publicised by public notice only; Glamor', 'Public record')],
    'ghf-19870731-1': [w('/evidence/ev-0267-john-loosemore-co-loosemores-services-01379651/', 'EV-0267 — Companies House 01379651: the appellant’s solicitors’ service company was “John Loosemore & Co. Services” unti', 'Public record'), w('/evidence/ev-0274-probate-calendar-1991-william-beverley-buckler/', 'EV-0274 — Probate calendar 1991: “BUCKLER, William Beverley … of Penarth … died 29 April 1990”, administration granted a', 'Public record')],
    'ghf-19900529-1': [w('/evidence/ev-0274-probate-calendar-1991-william-beverley-buckler/', 'EV-0274 — Probate calendar 1991: “BUCKLER, William Beverley … of Penarth … died 29 April 1990”, administration granted a', 'Public record')],
    'ghf-19941110-1': [w('/evidence/ev-0276-churchview-close-llandough-ideal-homes-persimmon-1994-1996/', 'EV-0276 — Press set, 1994–1996: Ideal Homes (Wales) built “Churchview Close”, Llandough (first buyers by January 1995); ', 'Newspaper'), w('/evidence/ev-0270-bp-pension-fund-1988-sale-intercontinental-law-llandough-press/', 'EV-0270 — Press set, 1988–1995: BP Pension Fund sold about 1,300 acres of Welsh land to Intercontinental Land & Developm', 'Newspaper')],
    'ghf-19881204-1': [w('/evidence/ev-0268-cadw-13428-lower-farmhouse-rhoose-listed-12-oct-1988/', 'EV-0268 — Cadw 13428, Lower Farmhouse, Rhoose: an early-19th-century Vale farmhouse listed on 12 October 1988 (“Interior', 'Heritage record')],
}
for _s in S:
    _s['evidence'] = _s['evidence'] + _RECONCILE_EVIDENCE.get(_s['id'], [])

# Coverage pass (24 Oct 2026): press items on the research chronology attached as evidence to the scene they report. — Sion's Tab agent
_COVERAGE_EVIDENCE = {
    'ghf-19870731-1': [w('/evidence/ev-0079-south-wales-echo-1987-may/', 'EV-0079 — South Wales Echo, 6 May 1987, front page: the dispute between the High Court judgment and the appeal', 'Newspaper')],
    'ghf-19881007-1': [w('/evidence/ev-0093-estates-gazette-1988-bp-welsh-sales/', 'EV-0093 — Estates Gazette, 9 July 1988, “BP signal Welsh sales”', 'Newspaper')],
    'ghf-19881208-1': [w('/evidence/ev-0111-echo-readers-letter-bulldozed-report/', 'EV-0111 — South Wales Echo, 21 December 1988, reader’s letter', 'Newspaper')],
}
for _s in S:
    _s['evidence'] = _s['evidence'] + _COVERAGE_EVIDENCE.get(_s['id'], [])


# ---------------------------------------------------------------- build
def main():
    ids, prev = set(), ''
    acts = [a['id'] for a in ACTS]
    for i, s in enumerate(S):
        assert s['id'] not in ids, s['id']; ids.add(s['id'])
        assert s['date'] >= prev, (s['id'], s['date'], prev); prev = s['date']
        assert s['evidence'], s['id']
        assert s['act'] in acts
    aliases = {}
    for s in S:
        for a in s['aliases']:
            assert a not in ids and a not in aliases, a
            aliases[a] = s['id']
    # scene numbering: per act, and overall
    count = {}
    for i, s in enumerate(S):
        count[s['act']] = count.get(s['act'], 0) + 1
        s['no'] = i + 1
        s['ref'] = f"{s['act']}.{count[s['act']]}"
        s['cast'] = [c['id'] for c in CAST if any(m in s['narration'] or m in s['title'] or m in (s['case'] or '') for m in c['match'])]
    assert set(ACCOUNTS) == ids, set(ACCOUNTS) ^ ids
    for s in S:
        a = ACCOUNTS[s['id']]
        s['received'] = a['received'] or None
        s['received_words'] = [list(x) for x in a['words']]
        s['known'] = a['known'] or None
    # title ledger: carry each lane forward; record which lanes this scene moved
    state = {}
    for s in S:
        changes = s.pop('set')
        for lane, text in changes.items():
            assert lane in LANES, (s['id'], lane)
            if text is None: state.pop(lane, None)
            else: state[lane] = text
        s['ledger'] = [[lane, state[lane]] for lane in LANES if lane in state]
        s['moved'] = [lane for lane, text in changes.items() if text is not None]
    out = {'title': 'Tŷ Mawr — The Great House Farm Story', 'acts': ACTS, 'cast': CAST, 'lanes': LANES,
           'aliases': aliases, 'scenes': S}
    # The curated scenes are the seed of the Q&A graph. content/graph/build_graph.py
    # reads this file, attaches the case questions and the correspondence Q&A, grades
    # the evidence for each scene, and writes src/data/story.json for the player.
    here = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(here, 'graph/seed'), exist_ok=True)
    with open(os.path.join(here, 'graph/seed/story.seed.json'), 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'{len(S)} scenes in {len(ACTS)} acts; {len(aliases)} old ids redirected (seed for the graph)')

if __name__ == '__main__':
    main()

