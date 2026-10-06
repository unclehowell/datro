# -*- coding: utf-8 -*-
"""Source of truth for the Great House Farm storyboard.

Edit this file, then run:   python3 content/story_source.py
It writes src/data/story.json, which the player, /story/ script page,
/api/timeline.json, /llms.txt, transcript and sitemap are all built from.

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
MARY = w('/mary-williams-statement/', "Mary Williams's statement (c. 1974)", "Mary's statement")
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

ACTS = [
    {'id': 'P', 'label': 'Prologue', 'title': 'To 1857', 'span': 'c. 650 – 1857',
     'logline': 'The church, the manor and the house, to the arrival of the quarry.'},
    {'id': 'I', 'label': 'Act I', 'title': 'Division', 'span': '1858 – 1915',
     'logline': 'The limeworks, and the 1877 division of the farm.'},
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
    {'id': 'E', 'label': 'Epilogue', 'title': 'Today', 'span': 'Now',
     'logline': 'The sequence, the site today, and the family\'s requests.'},
]

CAST = [
    {'id': 'mary', 'name': 'Mary Williams (Mrs Buckler)', 'years': '1913 – 1983',
     'role': 'Born in the farmhouse in 1913 and died there in 1983. Refused the tenancies offered in 1959 and 1965 and the 1974 letters; pleaded ownership in 1974.',
     'match': ['Mary']},
    {'id': 'john', 'name': 'John Williams', 'years': 'd. after 1949',
     'role': "Mary's father. Tenant of the house and fields from 1908; paid the last rent on the house in 1928.",
     'match': ['John Williams']},
    {'id': 'frederick', 'name': 'Frederick Buckler', 'years': '1910/11 – 1967',
     'role': "Mary's husband. Held an unwritten yearly tenancy from 1949; the 1955 and 1962 orders were made against him.",
     'match': ['Frederick']},
    {'id': 'billy', 'name': 'William "Billy" Buckler', 'years': 'c. 1948 – 1992',
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
     'role': "Bought Bute's interest in 1938; brought the 1955 and 1962 actions; conveyed to BP Pension Trust in 1969.",
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
sc('P', 'ghf-06500101-1', '0650-01-01', 'c. AD 650', "St Dochdwy's church", "St Dochdwy's, Llandough", '?',
   'Family account',
   "St Dochdwy's church stands at Llandough, on the site of an early monastery. Great House stands beside it.",
   [w('/archaeology/', 'Archaeology and Heritage', 'Heritage record'), TL],
   ledger={'W': 'Church land, Llandough'})
sc('P', 'ghf-12000101-1', '1200-01-01', '12th – 14th century', "Medieval occupation", 'Great House — north-east slope', 'A',
   'Archaeological record',
   "Pottery of the 12th to 14th centuries is later found on the slope north-east of the house. The Royal Commission classes the house as sub-medieval, probably 17th century.",
   [HER, ARCH], aliases=['ghf-12150102-1', 'ghf-12150101-1', 'ghf-11000101-1'])
sc('P', 'ghf-15520101-1', '1552-01-01', '1552 – 1829', "Manorial leases", 'Llandough manorial leases', 'AB',
   'Estate papers',
   "The Llandough manorial leases, 1552–1829, list \"Cydfin Farm or Ty Mawr Farm (107 a.)\".",
   [{'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219: Llandough manorial leases and agreements, 1552–1829',
     'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-15430101-1', 'ghf-15390101-1', 'ghf-15360101-1', 'ghf-14440101-1'],
   ledger={'W': 'Manor of Llandough: Cydfin or Tŷ Mawr, 107 acres, on written leases'})
sc('P', 'ghf-15600101-1', '1560-01-01', 'Mid 16th – late 18th century', "The Vaughans", 'Great House Farm', 'AB',
   'Heritage record',
   "From the mid-16th to the late 18th century the Vaughan family hold Great House, the chief freehold farm of the parish.",
   [HER, press('N04', "Western Mail, 'Grievous loss' (letter tracing the descent)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg')],
   ledger={'W': 'Freehold: the Vaughans (root traced via Tewkesbury Abbey, the Crown and the Herberts)'})
sc('P', 'ghf-16670101-1', '1667-01-01', '1667', "The Williams family at Great House", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary Williams's statement (c. 1974) records her family at Great House from 1667.",
   [MARY, w('/williams-buckler-family/', 'The Williams / Buckler Family — origins')],
   aliases=['ghf-16770101-1'],
   ledger={'W': 'Freehold: the Vaughans · in the house: the Williamses'})
sc('P', 'ghf-18000101-1', '1800-01-01', 'Early 19th century', "The Bute Estate", 'Great House', 'AB',
   'Heritage record',
   "Early in the 19th century the Bute Estate acquires the freehold of Great House. The manorial courts of Llandough and Leckwith are held in the house.",
   [HER, w('/bute-estate/', 'The Bute Estate'),
    {'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records R1: Glamorgan Estate rentals',
     'url': 'https://archives.library.wales/index.php/glamorgan-estate-rentals'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations (Stewart survey, D/d B E/1–2)')],
   aliases=['ghf-17700101-1', 'ghf-17940101-1',
            'ghf-18180101-2', 'ghf-18180101-1', 'ghf-18200101-1', 'ghf-18210101-1', 'ghf-18240101-1'],
   ledger={'W': 'Freehold: the Bute Estate · tenants: the Williamses'})
sc('P', 'ghf-18400101-1', '1840-01-01', 'c. 1840', "Great House Farm", 'Census and tithe records', 'AB',
   'Public record',
   "Census and tithe records begin to describe the house as \"Great House Farm\".",
   [w('/great-house-farm/farmhouse-nomenclature/', 'Farmhouse Nomenclature'), w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-18800101-1'])

# ---------------------------------------------------------------- ACT I
sc('I', 'ghf-18580101-1', '1858-01-01', 'c. 1858', "Burials at Church Farm", 'Church Farm, Llandough', 'x',
   'Museum record',
   "Workmen at Llandough Church Farm find about six skeletons, a medieval spearhead and a spur. The bones are reburied by the church stile.",
   [w('/evidence-library/ghf-e106-r33-a1-1931-letter-museum-wales-file-63-24/', '1931 letter, Museum Wales file 63.24', 'Museum record'), ARCH],
   aliases=['ghf-19311122-1'])
sc('I', 'ghf-18700101-1', '1870-01-01', 'c. 1870', "The armour under the floor", 'Great House — dining room', 'A',
   'Family account',
   "Family tradition records a soldier in armour found beneath the dining-room floor. The Daily Telegraph (1974) and the Royal Commission (1988) record the account.",
   [press('N03', 'Daily Telegraph, 16 April 1974 (dates the find to "about 1870")'), HER, ARCH],
   aliases=['ghf-18800101-2'])
sc('I', 'ghf-18760101-1', '1876-01-01', '1876 – c. 1912', "The limeworks", 'Llandough Limeworks', 'A',
   'Estate papers',
   "The Bute Estate lets about 33 acres of the farm to the Llandough Limeworks, which work it until about 1912.",
   [w('/llandough-limeworks/', 'Llandough Limeworks')])
sc('I', 'ghf-18770101-1', '1877-01-01', '1877', "Division of the farm", 'Bute Estate Office', 'AB',
   "Mary's statement",
   "Mary Williams's statement records that in 1877 the Bute Estate sold the farmhouse, buildings and about 10 acres to Daniel Thomas, and kept about 9 acres. The Williamses remained as tenants of both. The deed is missing.",
   [MARY, w('/1877-agreement/#sale-1877', 'The 1877 Agreement — the sale'), w('/1877-agreement/#plan', 'The 1877 Agreement — plan'),
    w('/the-two-parcels/', 'The Two Parcels'), w('/1877-agreement/#sale-1877', 'The 1877 Agreement — Bute lease')],
   aliases=['ghf-18771106-1'],
   ledger={'W': None,
           'A': 'Freehold: Daniel Thomas (bought from Bute) · tenants: the Williamses, promised the freehold when quarrying ends',
           'B': 'Freehold: the Bute Estate · tenants: the Williamses'})
sc('I', 'ghf-18911111-1', '1891-11-11', '11 November 1891', "Theft of geese", 'Llandough — court report', 'AB',
   'Newspaper',
   "Three geese are stolen from \"Mr. John Williams, Great House Farm, Llandough\". The theft is reported from court.",
   [press('N01', '1891 court report — farmyard theft', 'ghf-e090-n01-1891-farmyard-theft.jpg')],
   image='/media/ghf-e090-n01-1891-farmyard-theft.jpg')
sc('I', 'ghf-18970501-1', '1897-05-01', 'May 1897', "Marconi at Lavernock", 'Lavernock Point', '?',
   'Family account',
   "Marconi's wireless trials at Lavernock Point, May 1897. Family tradition records that Thomas Williams of Great House carted his equipment.",
   [press('N02', 'Press report of the Lavernock trials, 1897', 'ghf-e090-n02-1897-marconi-lavernock.jpg')],
   image='/media/ghf-e090-n02-1897-marconi-lavernock.jpg')
sc('I', 'ghf-19080101-1', '1908-01-01', '1908', "John Williams", 'Great House Farm', 'AB',
   "Mary's statement",
   "Mary's grandfather dies. John Williams takes over the house from the Thomases and the fields from Bute.",
   [MARY, w('/john-williams/#y1908', 'John Williams — 1908'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (1905 Bute conveyance)')],
   aliases=['ghf-19050223-1'],
   ledger={'A': 'Freehold: the Thomases · tenant: John Williams',
           'B': 'Freehold: the Bute Estate · tenant: John Williams'})
sc('I', 'ghf-19130810-1', '1913-08-10', '10 August 1913', "Birth of Mary Williams", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary Williams is born in the farmhouse on 10 August 1913.",
   [w('/mary-williams/', 'Mary Williams'), MARY])

# ---------------------------------------------------------------- ACT II
sc('II', 'ghf-19160201-1', '1916-02-01', 'February 1916', "The 1916 tenancy", 'Great House Farm', 'AB',
   'Court record',
   "Bute grants John Williams a yearly tenancy described as \"the whole farm\". The document has not been found.",
   [w('/1916-tenancy/#grant', 'The 1916 Tenancy', 'Court record'), JUDG, w('/the-two-parcels/whole-farm-nomenclature/', 'The Farm / Whole Farm Nomenclature')],
   ledger={'S': 'Seed (a landlord\'s wording, not the family\'s): the words "the whole farm" in a Bute tenancy (Bute can only let Parcel B)'})
sc('II', 'ghf-19280101-1', '1928-01-01', '1928', "Last rent on the house", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary Williams's statement records that in 1928 the last quarry machinery left, and John Williams paid a final rent of about £4 to Alfred Thomas. She saw the receipt. It is missing.",
   [MARY, w('/1877-agreement/#takes-effect', 'The 1877 Agreement — takes effect 1928'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (15 May 1924 agreement)')],
   aliases=['ghf-19240515-1'],
   ledger={'A': 'Freehold: the Williamses (Bute → Thomas → Williams; 1877 agreement and 1928 receipt kept at the house)'})
sc('II', 'ghf-19360101-1', '1936-01-01', '1936', "Marriage", 'Great House Farm', 'A',
   'Family account',
   "Mary Williams marries Frederick Buckler, who comes to live at the farmhouse. They have seven children.",
   [w('/frederick-buckler/#marriage', 'Frederick Buckler — marriage'), w('/frederick-buckler/', 'Frederick Buckler'),
    w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19100101-1', 'ghf-19370101-1'])
sc('II', 'ghf-19380101-1', '1938-01-01', '1938', "Sale to Western Ground Rents", 'Bute Estate Office', 'B',
   'Court record',
   "The Bute Estate conveys its reversion on the 1916 tenancy to Western Ground Rents Ltd.",
   [w('/1939-revised-tenancy/#y1938', '1938–39: Sale to WGR and the Revised Tenancy'), JUDG],
   ledger={'B': 'Freehold: Western Ground Rents (from Bute, 1938) · tenant: John Williams'})
sc('II', 'ghf-19390501-1', '1939-05-01', 'May 1939', "The 1939 tenancy", 'Great House Farm', 'B',
   'Document',
   "Western Ground Rents grants John Williams a revised tenancy, with a plan.",
   [w('/1939-revised-tenancy/#y1939', '1938–39: the 1939 tenancy'), w('/1939-revised-tenancy/#plan', 'The 1939 tenancy plan')],
   ledger={'B': 'Freehold: Western Ground Rents · tenant: John Williams (1939 plan: fields only)'})
sc('II', 'ghf-19400101-1', '1940-01-01', 'c. 1940', "Twelve years", 'Great House Farm', 'A',
   'Family case',
   "By 1940, twelve years after 1928, no rent has been paid on the house.",
   [w('/1939-revised-tenancy/#c1940', '1938–39 — c. 1940')],
   ledger={'A': 'Freehold: the Williamses, by the 1877 bargain and by title by possession (twelve years rent-free, 1928–1940)'})
sc('II', 'ghf-19440101-1', '1944-01-01', '1944', "Farm management", 'Great House Farm', 'B',
   "Mary's statement",
   "The War Agricultural Executive Committee is dissatisfied with the farm. Frederick Buckler takes over running it as manager for John Williams.",
   [MARY, w('/john-williams/#y1944', 'John Williams — 1944')])
sc('II', 'ghf-19480101-1', '1948-01-01', 'c. 1948 – 49', "Birth of William Buckler", 'Great House Farm', 'A',
   'Family account',
   "William (Billy) Buckler is born at the farm.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')])

# ---------------------------------------------------------------- ACT III
sc('III', 'ghf-19490202-1', '1949-02-02', '2 February 1949', "The 1949 tenancy", 'Great House Farm', 'B',
   'Court record',
   "John Williams surrenders his tenancy. Frederick Buckler's yearly tenancy from Western Ground Rents begins on 2 February 1949. It is not put in writing.",
   [w('/frederick-buckler/#tenancy-1949', "Frederick Buckler — the 1949 tenancy", 'Court record'), JUDG, w('/the-two-parcels/', 'The Two Parcels')],
   ledger={'S': 'Attempt 1 to make Mary look permitted: her house spoken of as part of Frederick\'s unwritten fields tenancy (Mary rejects it; she still holds the paper title)',
           'B': 'Freehold: Western Ground Rents · tenant: Frederick Buckler (unwritten, from 1949)'})
sc('III', 'ghf-19500601-1', '1950-06-01', 'June 1950 – c. 1952', "The blanket box", 'Great House Farm', 'A',
   "Mary's statement",
   "Mary Williams's statement records that a lodger placed by a Penarth estate agent stayed about two years and told her he had taken \"the papers which were in the blanket box including the agreement relating to the farm\" and given them to the agent.",
   [MARY, w('/1877-agreement/#papers-taken', 'The 1877 Agreement — papers taken')],
   ledger={'A': 'Freehold: the Williamses · their deeds taken from the blanket box (missing from now on; title buried, not extinguished)'})
sc('III', 'ghf-19521010-1', '1952-10-10', '1952 – 53', "Last rent on the fields", "Landlords' agents", 'B',
   'Court record',
   "On 10 October 1952 the landlord's agents write that they will not proceed with a letting to Frederick. He pays his last rent in 1953.",
   [w('/frederick-buckler/#tenancy-1949', 'Frederick Buckler — 1952 letter', 'Court record'), TL],
   aliases=['ghf-19530101-1'])
sc('III', 'ghf-19550202-1', '1955-02-02', '2 February 1955', "The 1955 possession order", 'High Court / Great House Farm', 'AB',
   'Court record',
   "On 2 February 1955 Western Ground Rents obtains a High Court order for possession against Frederick Buckler, described as \"the whole of the farm\". On 4 July 1955 possession is taken of everything except the farmhouse and garden. Mary Williams had recently returned from hospital.",
   [w('/1955-possession-order/#order', 'The 1955 Possession Order', 'Court record'), w('/1955-possession-order/#enforcement', 'The 1955 Possession Order — enforcement', 'Court record')],
   ledger={'A': 'Freehold: the Williamses (Mary in the house) · woodland half of Parcel A taken in 1955 (family account)',
           'S': 'Attempt 2: High Court order against the fields tenant for "the whole of the farm" (house not taken; Mary never heard)',
           'B': 'Freehold and possession: Western Ground Rents (fields taken 4 July 1955)'})
sc('III', 'ghf-19590101-1', '1959-01-01', '1959', "1959 tenancy offer", 'Great House Farm', 'A',
   'Court record',
   "Western Ground Rents offers Mary a tenancy of the farmhouse and garden. She refuses, stating that the house is hers through her grandfather and that documents prove it.",
   [w('/1962-possession-order/#refusal-1959', 'The 1962 Possession Order — 1959 refusal', 'Court record'), JUDG],
   ledger={'S': 'Attempt 3: tenancy of her own farmhouse and garden offered to Mary (refused)'})
sc('III', 'ghf-19621211-1', '1962-12-11', '11 December 1962', "The 1962 possession order", 'Cardiff County Court', 'A',
   'Court record',
   "On 11 December 1962 Cardiff County Court (Judge Temple Morris QC) orders possession of the farmhouse and garden, with mesne profits from 1955, against Frederick and Mary, on Western Ground Rents' claim. The order is not enforced.",
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
   [w('/1962-possession-order/#offer-1965', 'The 1965 offer'), w('/mary-williams/#chronology', 'Mary Williams — 1965 offer')],
   ledger={'S': 'Attempt 5: weekly tenancy offered to "Mrs Williams" (not signed; her occupation now treated as adverse)'})
sc('III', 'ghf-19640101-1', '1965-06-01', '1964 – 68', "Reported sale by the eldest son", 'Great House Farm', '?',
   'Family account',
   "A cousin's account says the eldest son sold \"our land parcel\" through a solicitor without his parents' knowledge. No document has been found. In 1968 his household leaves the farm.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — rumoured sale'), w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19680901-1'])
sc('III', 'ghf-19670101-1', '1967-01-01', '1967', "Death of Frederick Buckler", 'Great House Farm', 'A',
   'Family account',
   "Frederick Buckler dies, aged 56. Mary takes back the name Williams and remains in the farmhouse.",
   [w('/frederick-buckler/#death', 'Frederick Buckler — death')],
   ledger={'B': 'Freehold and possession: Western Ground Rents'})

# ---------------------------------------------------------------- ACT IV
sc('IV', 'ghf-19691231-1', '1969-12-31', '31 December 1969', "Conveyance to BP Pension Trust", 'Great House Farm', 'AB',
   'Land Registry record',
   "On 31 December 1969 Western Ground Rents conveys its interest at Great House Farm to BP Pension Trust Ltd. The conveyance is not on the Land Registry files.",
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   ledger={'B': 'Freehold: BP Pension Trust (Bute → WGR → BP, by deed)',
           'S': 'Held by BP Pension Trust: the 1962 order and the case against Mary (no deed to Parcel A; the 1969 root conveyance now missing)'})
sc('IV', 'ghf-19720725-1', '1972-07-25', '1970 – 72', "Village green and planning permission", 'Planning office', 'AB',
   'Planning file',
   "On 16 June 1970 land beside Leckwith Road is registered as village green VG41. On 25 July 1972 planning permission is granted for housing on the site, while Mary lives in the farmhouse.",
   [REDEV, TL], aliases=['ghf-19700616-1'],
   ledger={'A': 'Freehold: the Williamses (Mary in the house) · woodland taken 1955 · land south of the farmhouse taken by the council: village green VG41 (1970)'})
sc('IV', 'ghf-19740101-1', '1974-01-01', '1974', "Royal Commission survey", 'Great House — interior', 'A',
   'Heritage record',
   "H. J. Thomas surveys the ground floor for the Royal Commission. The house \"remained partially recorded because of problems of access created by an ownership dispute\".",
   [HER, ARCH])
sc('IV', 'ghf-19740415-1', '1974-04-15', '15 April 1974', "Open day", 'Great House Farm', 'A',
   'Newspaper',
   "On 15 April 1974 Mary opens the farmhouse to the public. The Daily Telegraph reports her saying ownership has been disputed for 25 years and her solicitors tell her she has a valid claim.",
   [press('N03', "Daily Telegraph, 16 April 1974, 'Open day to save ancient Welsh house'", 'ghf-e090-n03-1974-open-day-telegraph.jpg'),
    w('/1974-licence-letters/#action', 'The 1974 Licence Letters')],
   image='/media/ghf-e090-n03-1974-open-day-telegraph.jpg')
sc('IV', 'ghf-19740703-1', '1974-07-03', '3 July 1974', "1974 possession action", 'County court', 'A',
   'Court record',
   "BP Pension Trust brings a county court action for possession. On 3 July 1974 Mary pleads ownership and the Limitation Act 1939. Her statement describes the 1877 sale. The case is part heard and adjourned, and not relisted.",
   [w('/1974-licence-letters/#action', 'The 1974 Licence Letters — the action', 'Court record'), JUDG],
   ledger={'A': 'Freehold claimed by Mary, in occupation · ownership pleaded in court, 3 July 1974 (adjourned, never decided)'})
sc('IV', 'ghf-19741031-1', '1974-10-31', 'September – October 1974', "The 1974 letters", 'Great House Farm', 'A',
   'Court record',
   "On 19 September 1974 BP is given leave to enforce the 1962 order; Mary was not given notice. On 31 October the warrant is withdrawn and BP writes to Mary allowing her to remain in the farmhouse rent-free for life. She does not accept.",
   [w('/1974-licence-letters/#letters', 'The 1974 Licence Letters', 'Court record'), JUDG,
    w('/1974-licence-letters/#warrant', 'The 1974 Licence Letters — the warrant', 'Court record')],
   aliases=['ghf-19741031-2', 'ghf-19740919-1'],
   ledger={'S': 'Attempt 6: BP\'s "licence" letters to Mary, 31 October 1974 (never accepted); 1962 warrant withdrawn'})
sc('IV', 'ghf-19741119-1', '1974-11-19', '19 November, 1970s (year unclear)', "Letter to the Western Mail", 'Western Mail — letters', 'A',
   'Newspaper',
   "A letter to the Western Mail, dated 19 November (year unclear), warns that demolition would erase the site of St Dochdwy's monastery and traces the land's descent.",
   [press('N04', "Western Mail, 'Grievous loss' (letter)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg'),
    w('/restoration-campaign/#open-day-1974', 'The Restoration Campaign')])
sc('IV', 'ghf-19750523-1', '1975-05-23', '23 May 1975', "The 1975 conveyance", 'BP Pension Trust / BP Properties', 'A',
   'Land Registry record',
   "On 23 May 1975 BP Pension Trust conveys property at Great House Farm, with a plan, to BP Properties Ltd. The Court of Appeal later calls it \"the actual conveyance of the farmhouse and garden\".",
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   ledger={'S': 'Paper: conveyance BP Pension Trust → BP Properties of "the farmhouse and garden" (no earlier deed to Parcel A behind it)'})
sc('IV', 'ghf-19800522-1', '1980-05-22', '22 May 1980', "Hansard", 'House of Commons', '',
   'Parliament',
   "On 22 May 1980 Ted Rowlands MP tells the House of Commons that Western Ground Rents, \"the most rapacious ground landlord\" in South Wales, has been bought by the BP pension fund.",
   [press('N16', 'Hansard, 22 May 1980', 'ghf-e090-n16-1980-hansard-rowlands.jpg')],
   image='/media/ghf-e090-n16-1980-hansard-rowlands.jpg')
sc('IV', 'ghf-19821001-1', '1982-10-01', '1 October 1982', "GGAT advice", 'GGAT', 'AB',
   'Planning file',
   "On 1 October 1982 GGAT advises the planners that occupation may continue north of the church and asks for investigation before development.",
   [ARCH, GGAT_REV,
    press('N05', 'Neath Guardian, 17 April 1980 (Roman villa, a separate site)', 'ghf-e090-n05-1980-neath-guardian.jpg'),
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
sc('IV', 'ghf-19830326-1', '1983-03-26', '26 March 1983', "Death of Mary Williams", 'Great House Farm', 'A',
   'Family account',
   "Mary Williams dies in the farmhouse on 26 March 1983. Her son William inherits her estate.",
   [w('/mary-williams/#death', 'Mary Williams — death'), w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   ledger={'A': 'Freehold claim passes to Billy Buckler, in occupation · never decided, never extinguished'})
sc('IV', 'ghf-19830408-1', '1983-04-08', '8 April – 12 May 1983', "Registration correspondence", 'HM Land Registry', 'A',
   'Land Registry record',
   "On 8 and 12 April and 12 May 1983 Linklaters and the Land Registry exchange letters on the farmhouse file, including form D23.",
   [LRT('first-registration', 'Land Registry Titles — first registration')])

# ---------------------------------------------------------------- ACT V
sc('V', 'ghf-19840522-1', '1984-05-22', '1984', "The writ", 'BP Properties', 'A',
   'Court record',
   "On 22 May 1984 BP Properties issues a writ for possession of Great House Farm and adjoining land against William Buckler. The defence relies on adverse possession from 1955.",
   [w('/bp-properties-v-buckler/#writ', 'BP Properties Ltd v Buckler — the writ', 'Court record'), w('/1877-agreement/#library-1984', 'The 1877 Agreement — library copy missing'),
    LRT('first-registration')],
   aliases=['ghf-19840113-1'])
sc('V', 'ghf-19860710-1', '1986-07-10', '10 July 1986', "High Court judgment", 'High Court, Cardiff', 'A',
   'Court record',
   "On 10 July 1986 Mr Justice Hollis gives judgment for BP, holding that the 1974 letters gave Mary a licence.",
   [w('/bp-properties-v-buckler/#high-court', 'BP Properties Ltd v Buckler — High Court', 'Court record'),
    w('/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/', 'BP v Buckler: Scope, Decided & Undecided', 'Analysis')])
sc('V', 'ghf-19860711-1', '1986-07-11', '1986 – 87', "Royal Commission correspondence", 'Royal Commission (RCAHMW)', 'A',
   'Official correspondence',
   "During the trial and appeal, the Royal Commission's correspondence with Mrs Buckler goes missing.",
   [w('/scrutiny-and-accountability/legal-review-fraud-land-human-rights/#loss-pattern', 'Legal Review — the loss pattern', 'Analysis')])
sc('V', 'ghf-19870202-1', '1987-02-02', '2 February 1987', "Amalgamation of titles", 'HM Land Registry', 'AB',
   'Land Registry record',
   "On 2 February 1987, with the appeal pending, an application is made to amalgamate WA240304 (farmhouse and garden) into WA231076.",
   [LRT('first-registration', 'Land Registry Titles — amalgamation'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/', '1987 HMLR Amalgamation During Appeal', 'Analysis')],
   ledger={'S': None, 'B': None,
           'M': 'Registered: BP Properties, WA231076 = Parcel B + synthetic Parcel A (farmhouse title folded in, 2 February 1987)'})
sc('V', 'ghf-19870731-1', '1987-07-31', '31 July 1987', "Court of Appeal", 'Court of Appeal, London', 'A',
   'Court record',
   "On 31 July 1987 the Court of Appeal (Dillon LJ, Mustill LJ, Sir Edward Eveleigh) dismisses the appeal in BP Properties Ltd v Buckler. It finds adverse possession from 1955, but holds that the 1962 action stopped time and the 1974 letters made the possession permissive.",
   [JUDG, w('/bp-properties-v-buckler/#omits', 'BP Properties Ltd v Buckler — what it omits', 'Analysis')],
   ledger={'A': 'Freehold claim: Billy Buckler · never adjudicated, never extinguished (judgment decides possession only)',
           'M': 'WA231076, BP Properties · right to possession upheld (1962 order + 1974 licence)'})
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
sc('VI', 'ghf-19881130-1', '1988-11-30', '29 – 30 November 1988', "Eviction", 'Great House Farm', 'A',
   'Newspaper',
   "On 29–30 November 1988 bailiffs enter the farmhouse. William Buckler is taken to Llandough Hospital. Eight other residents are made homeless.",
   [press('N14', "South Wales Echo front page — 'Angry scenes as farmer evicted'", 'ghf-e090-n14-1988-echo-front-page.jpg'),
    echo('04', '30 November 1988'),
    press('N09', "South Wales Echo, 3 December 1988 — 'Billy's unhappy family'", 'ghf-e090-n09-1988-billys-unhappy-family.jpg')],
   image='/media/ghf-e090-n14-1988-echo-front-page.jpg',
   aliases=['ghf-press-n14', 'ghf-press-n15-04', 'ghf-press-n09'],
   ledger={'A': 'Freehold claim: Billy Buckler, evicted 29 November 1988 · never adjudicated, never extinguished',
           'M': 'WA231076, BP Properties · in possession from 29 November 1988'})
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
   "R. F. Suggett of the Royal Commission examines the rubble, records a fireplace jamb and an ogee-stopped beam, and notes the loss of a carved stone capital by the front door.",
   [HER, ARCH])

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
   "The family live with William Buckler's sister in Penarth. He plans to live in a converted bus and says about £30,000 of possessions were taken from the site.",
   [press('N13', "South Wales Echo, 1989 — 'From farm to a bus'", 'ghf-e090-n13-1989-farm-to-bus.jpg')],
   image='/media/ghf-e090-n13-1989-farm-to-bus.jpg')
sc('VII', 'ghf-19890414-1', '1989-04-14', '14 April 1989', "European Commission decision", 'European Commission of Human Rights', 'A',
   'Court record',
   "On 14 April 1989 the European Commission of Human Rights declares Buckler v United Kingdom inadmissible.",
   [w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record'),
    {'type': 'Court record', 'title': 'Buckler v United Kingdom, Commission decision (PDF)', 'url': WIKI + '/wp-content/uploads/2026/09/wp-1790112811838.pdf'}])
sc('VII', 'ghf-19891107-1', '1989-11-07', 'October – November 1989', "Outline application", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "BP applies for outline planning permission for housing (89/01396/OUT, received 8 November 1989). GGAT advises an archaeological assessment and is then commissioned by BP to carry it out. Its report calls the farmhouse \"a county treasure\".",
   [REDEV, GGAT_REV, LRT('later-dealings', 'Land Registry Titles — later dealings')],
   aliases=['ghf-19891108-1', 'ghf-19891010-1'])
sc('VII', 'ghf-19900313-1', '1990-03-13', 'February – March 1990', "Outline permission", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "On 13 March 1990 outline permission is granted with 18 conditions. The officer's report notes the farm buildings \"were unfortunately demolished a little while ago\". GGAT's further comments of 8 February 1990 are missing from the file.",
   [REDEV, LEGAL], aliases=['ghf-19900208-1'])
sc('VII', 'ghf-19900801-1', '1990-08-01', 'August – October 1990', "Evaluation trenches", 'Former farm site', '?',
   'Archaeological record',
   "In August 1990 GGAT digs eight trenches for BP and finds early medieval burials. An area that could not be investigated is marked low potential. In October the council records the condition as met.",
   [ARCH, GGAT_REV, REDEV], aliases=['ghf-19901015-1'])
sc('VII', 'ghf-19910821-1', '1991-08-21', '21 August 1991', "Heritage record entry", 'Historic Environment Record', 'A',
   'Heritage record',
   "The Historic Environment Record records that the house and buildings \"were suddenly and completely demolished by B.P. Properties Ltd. on 6th December 1988 amid considerable local controversy\".",
   [HER])
sc('VII', 'ghf-19920514-1', '1992-05-14', '14 May 1992', "Reserved matters application", 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "On 14 May 1992 Ideal Homes Wales applies for approval of 20 houses (92/00671/RES).",
   [REDEV])
sc('VII', 'ghf-19920515-1', '1992-05-15', '15 May 1992', "Death of William Buckler", 'Llandough', 'A',
   'Family account',
   "William Buckler dies on 15 May 1992 in Llandough Hospital and is buried at Michaelston-le-Pit.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   ledger={'A': "Freehold claim: Mary's heirs · never adjudicated, never extinguished"})
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
   "On 10 November 1994 the woodland passes to the Forest of Cardiff (WA735527). In 1995–96 rights are granted to South Wales Electricity. The houses of Church View Close are built.",
   [w('/woodland/', 'Woodland'), LRT('later-dealings', 'Land Registry Titles — later dealings'), REDEV],
   aliases=['ghf-19950628-1'],
   ledger={'M': 'WA231076 and the house titles carved from it (Church View Close)',
           'A': "Freehold claim: Mary's heirs · never adjudicated, never extinguished · woodland now registered to the Forest of Cardiff (WA735527) · land to the south a village green"})
sc('VII', 'ghf-20050101-1', '2005-01-01', '2005', "Publication", 'Medieval Archaeology', '?',
   'Archaeological record',
   "The excavation is published in Medieval Archaeology 49 (2005): 1,026 burials, 814 articulated. On 22 December 2005 part of the woodland title is divided off.",
   [ARCH, {'type': 'Publication', 'title': 'Holbrook and Thomas, Medieval Archaeology 49 (2005)', 'url': WIKI + '/archaeology/'},
    w('/woodland/', 'Woodland')],
   aliases=['ghf-20051222-1'])
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
   "On 21 May 2026 Cadw releases two photographs of 29 July 1988, coded \"YYY\". It says its paper file is \"quite likely\" destroyed; in July, \"most likely\".",
   [RAC, CADW_CRIT, CADW_PH], image='/media/1988-cadw-barn.jpg')
sc('VIII', 'ghf-20260730-1', '2026-07-30', 'June – July 2026', "Schedule of registration documents", 'HM Land Registry', 'AB',
   'Official correspondence',
   "On 30 July 2026 HM Land Registry supplies a schedule of 43 documents on the first-registration files. The 31 December 1969 conveyance and the 1971 abstract are not listed.",
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260602-1'])
sc('VIII', 'ghf-20260825-1', '2026-08-25', '25 August 2026', "Museum Wales reply", 'Museum Wales', '?',
   'Official correspondence',
   "On 25 August 2026 Museum Wales replies that the information is \"not held\", and in the same letter says it has found records of other discoveries at Great House Farm, which it withholds as \"not in scope\".",
   [RAC])
sc('VIII', 'ghf-20260908-1', '2026-09-08', '8 September 2026', "Glamorgan Archives reply", 'Glamorgan Archives', 'A',
   'Official correspondence',
   "On 8 September 2026 Glamorgan Archives report no deeds for the 1877 sale, and identify Bute X.6(12), the trustees' 1877 book of payments, at Cardiff Library.",
   [w('/1877-agreement/#glamorgan-2026-4097b', 'The 1877 Agreement — Glamorgan Archives reply', 'Official correspondence')])
sc('VIII', 'ghf-20260917-1', '2026-09-17', '17 – 21 September 2026', "Complaints and correspondence", 'Cadw / Stephen Doughty MP', 'A',
   'Official correspondence',
   "17–21 September 2026: formal complaint to Cadw; letters to Stephen Doughty MP; records request to Heneb. A Land Registry agent states the title was \"closed in 2005\".",
   [RAC, w('/restoration-campaign/', 'The Restoration Campaign'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260918-1'])
sc('VIII', 'ghf-20260923-1', '2026-09-23', '23 September 2026', "House of Lords papers", 'The National Archives', 'A',
   'Official correspondence',
   "On 23 September 2026 The National Archives identifies the House of Lords papers in BP Properties Ltd v Buckler, catalogued in May 2026.",
   [RAC])
sc('VIII', 'ghf-20260925-1', '2026-09-25', '25 – 27 September 2026', "Woodland offer", 'Forest of Cardiff', 'A',
   'Official correspondence',
   "On 25 September 2026 the Forest of Cardiff offers the family a route to ownership of the woodland. On 27 September the family decline.",
   [w('/woodland/', 'Woodland'), RAC])
sc('VIII', 'ghf-20260927-1', '2026-09-27', '27 – 29 September 2026', "Complaints to Heneb and the Reviewer", 'Heneb / HM Land Registry', 'AB',
   'Official correspondence',
   "27–29 September 2026: complaint to Heneb about GGAT's role, 1982–1995; referral of HM Land Registry to the Independent Complaints Reviewer (ICR/090/26); preservation notice to eleven public bodies.",
   [GGAT_REV, RAC])
sc('VIII', 'ghf-20260929-1', '2026-09-29', '29 September – 5 October 2026', "Archive releases", 'Cadw / RCAHMW / Museum Wales', 'A',
   'Official correspondence',
   "On 29 September 2026 the Royal Commission releases its records, including the 1974 newspaper report and a note of the armour. On 5 October Museum Wales releases its Church Farm file.",
   [ARCH, w('/where-things-stand/', 'Where Things Stand'),
    w('/records-access-chronology/foi-reply-register/ghf-e106-r33-amgueddfa-cymru-reply-further-collections-search-following-8-september-2026-foi/', 'Museum Wales reply (GHF-E106-R33)', 'Official correspondence')],
   aliases=['ghf-20261005-1'])
sc('VIII', 'ghf-20261006-1', '2026-10-06', 'September – October 2026', "Publication of the record", 'Great House Farm Wiki', 'A',
   'Analysis',
   "September–October 2026: the family publish the documents and press cuttings on the Great House Farm Wiki, with a legal review.",
   [LEGAL, w('/', 'Great House Farm Wiki — Main Page'), w('/evidence-library/', 'Evidence Library'),
    w('/evidence-library/press-archive-transcripts/', 'Press Archive — Newspaper Transcripts'), w('/evidence-library/press-articles-index/', 'Press Articles Index')],
   aliases=['ghf-20260922-1', 'ghf-20261003-1'])

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
   "Llandough Community Council's page on the village's history describes the Roman villa, the monastery and the 1994 burials. It does not mention Great House, the Williams family or the demolition.",
   [{'type': 'Public record', 'title': 'Llandough Community Council — About Llandough', 'url': 'https://www.llandough-cc.co.uk/About_Us_20117.aspx'},
    w('/where-things-stand/', 'Where Things Stand')])
sc('E', 'ghf-99990102-1', '9999-01-03', 'Today', "The family's requests", 'The family', 'A',
   'Family case',
   "The family ask for: a ruling on the ownership of Parcel A; the return of the woodland and the green, or reparation; reparation for the houses built on the land; the return of the estate's artefacts; a true heritage record; and a public inquiry.",
   [w('/family-reparations-remedy-roadmap/', 'Family Reparations & Remedy Roadmap'), w('/where-things-stand/', 'Where Things Stand')],
   image='/media/1988-cadw-farmhouse.jpg')


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
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, 'src/data/story.json'), 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'{len(S)} scenes in {len(ACTS)} acts; {len(aliases)} old ids redirected')

if __name__ == '__main__':
    main()
