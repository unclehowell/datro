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
import json, os

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
    {'id': 'P', 'label': 'Prologue', 'title': 'The Root', 'span': 'c. 650 – 1857',
     'logline': 'Before the farm is ever divided, its title has a root: the church, the manor, the Vaughans, the Bute Estate.'},
    {'id': 'I', 'label': 'Act I', 'title': 'The Split', 'span': '1858 – 1915',
     'logline': '1877: the house goes one way and the fields another. Two parcels, two owners, two chains of title.'},
    {'id': 'II', 'label': 'Act II', 'title': 'Two Words', 'span': '1916 – 1948',
     'logline': '"The whole farm." A tenancy describes two parcels as one, just as the house becomes the family\'s own.'},
    {'id': 'III', 'label': 'Act III', 'title': 'The Mimic', 'span': '1949 – 1968',
     'logline': "The deeds vanish. Then, one move at a time, a second Parcel A is built on paper out of tenancies and court orders."},
    {'id': 'IV', 'label': 'Act IV', 'title': 'The Handover', 'span': '1969 – 1983',
     'logline': "BP takes the fields by deed and the mimic by order, licence and conveyance. Then it registers both."},
    {'id': 'V', 'label': 'Act V', 'title': 'Possession, Not Ownership', 'span': '1984 – March 1988',
     'logline': 'The mimic is folded into the fields, and the courts decide who may live in the house. Never who owns it.'},
    {'id': 'VI', 'label': 'Act VI', 'title': 'Bulldozed Before Breakfast', 'span': 'April – December 1988',
     'logline': 'A chainsaw at the door, a forced eviction, a listing refused, and bulldozers at 4am.'},
    {'id': 'VII', 'label': 'Act VII', 'title': 'Built Over', 'span': '1989 – 2019',
     'logline': 'BP sells the merged title, twenty houses go up, and a thousand graves are taken out of the ground.'},
    {'id': 'VIII', 'label': 'Act VIII', 'title': 'The Buried Title', 'span': '2025 – 2026',
     'logline': "Mary's grandchildren dig for the true Parcel A. The state says its register is correct."},
    {'id': 'E', 'label': 'Epilogue', 'title': 'Today', 'span': 'Now',
     'logline': 'How it was done, who holds what, and what was never decided.'},
]

CAST = [
    {'id': 'mary', 'name': 'Mary Williams (Mrs Buckler)', 'years': '1913 – 1983',
     'role': 'Born in the farmhouse and died in it. Owner of Parcel A on her family\'s title; refused every tenancy and licence, pleaded ownership in 1974, and was never allowed to prove it.',
     'match': ['Mary']},
    {'id': 'john', 'name': 'John Williams', 'years': 'd. after 1949',
     'role': "Mary's father. Paid the last rent on Parcel A in 1928; from then on it was the family's.",
     'match': ['John Williams']},
    {'id': 'frederick', 'name': 'Frederick Buckler', 'years': '1910/11 – 1967',
     'role': "Mary's husband. Held an unwritten tenancy of the fields (Parcel B). Every order against him was later used against the house.",
     'match': ['Frederick']},
    {'id': 'billy', 'name': 'William "Billy" Buckler', 'years': 'c. 1948 – 1992',
     'role': "Mary's son, born at the farm. Inherited her claim, fought BP's possession case, held the bailiffs off with a chainsaw, and was evicted in November 1988.",
     'match': ['Billy', 'William Buckler', 'Bill Buckler', 'Mr Buckler', 'William (Billy)']},
    {'id': 'branwen', 'name': 'Branwen Buckler', 'years': '',
     'role': "Billy's wife. Watched the farmhouse bulldozed with their three young children.",
     'match': ['Branwen']},
    {'id': 'eldest', 'name': "Frederick and Mary's eldest son", 'years': 'b. c. 1937–40',
     'role': 'Left the farm in 1968. A cousin says he sold "our land parcel" behind his parents\' backs.',
     'match': ['eldest son']},
    {'id': 'thomas', 'name': 'Daniel and Alfred Thomas', 'years': '',
     'role': 'Quarrymen. Daniel Thomas bought Parcel A from Bute in 1877; Alfred Thomas took the last rent on it in 1928.',
     'match': ['Daniel Thomas', 'Alfred Thomas', 'Thomases']},
    {'id': 'bute', 'name': 'The Bute Estate', 'years': '',
     'role': 'Freeholders of the whole farm from the early 19th century. Sold Parcel A in 1877 and Parcel B in 1938.',
     'match': ['Bute']},
    {'id': 'wgr', 'name': 'Western Ground Rents Ltd', 'years': '',
     'role': "Bought Parcel B from Bute in 1938. Built the case against the house: the 1955 and 1962 orders and the tenancy offers. Sold to BP in 1969, and was later bought by the BP pension fund.",
     'match': ['WGR', 'Western Ground Rents']},
    {'id': 'bp', 'name': 'BP Pension Trust / BP Properties Ltd', 'years': '',
     'role': 'Took Parcel B by deed in 1969 and the case against the house with it. Conveyed "the farmhouse and garden" between its own companies in 1975, registered both, merged them in 1987, won possession, demolished the house and sold the land.',
     'match': ['BP']},
    {'id': 'hmlr', 'name': 'HM Land Registry', 'years': '',
     'role': "Registered BP's two titles in 1982–83 and merged the farmhouse title into the fields title during the appeal. In 2026 it says the title is 'registered correctly'.",
     'match': ['Land Registry', 'Registry']},
    {'id': 'cadw', 'name': 'Cadw', 'years': '',
     'role': 'The Welsh heritage body. Looked at the house for listing in July and December 1988, refused to list it the day before it was demolished, and has lost its file.',
     'match': ['Cadw']},
    {'id': 'ggat', 'name': 'GGAT (now Heneb)', 'years': '',
     'role': 'The regional archaeological trust. Advised the planners, then worked for BP and the developer on the site, 1982–1995.',
     'match': ['GGAT', 'Heneb']},
    {'id': 'rcahmw', 'name': 'Royal Commission (RCAHMW)', 'years': '',
     'role': 'Began recording the house in 1974 and was never let finish; sifted its rubble in 1988.',
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
sc('P', 'ghf-06500101-1', '0650-01-01', 'c. AD 650', 'The church beside the house', "St Dochdwy's, Llandough", '?',
   'Family account',
   "Long before there is a farm, there is a church. St Dochdwy's at Llandough is one of the oldest Christian sites in Wales, the seat of an early monastery. Beside it, on the slope above the river, stands the place that will become Tŷ Mawr: the Great House. This is a story about who owns that ground, and how the answer was buried.",
   [w('/archaeology/', 'Archaeology and Heritage', 'Heritage record'), TL],
   ledger={'W': 'Church land, Llandough'})
sc('P', 'ghf-12000101-1', '1200-01-01', '12th – 14th century', 'An old house', 'Great House — north-east slope', 'A',
   'Archaeological record',
   "In the Middle Ages people live and work on this slope; their pottery is still in the ground eight hundred years later. The house that grows here is old and grand: a long stone house the Royal Commission will judge sub-medieval, probably of the seventeenth century, perhaps built around something older still.",
   [HER, ARCH], aliases=['ghf-12150102-1', 'ghf-12150101-1', 'ghf-11000101-1'])
sc('P', 'ghf-15520101-1', '1552-01-01', '1552 – 1829', 'Cydfin, or Tŷ Mawr', 'Llandough manorial leases', 'AB',
   'Estate papers',
   "In the manor's leases it goes by an older name: Cydfin, or Tŷ Mawr, a farm of a hundred and seven acres. Every lease is written, signed and kept. Remember that. For three centuries this land's paper trail is unbroken.",
   [{'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219: Llandough manorial leases and agreements, 1552–1829',
     'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-15430101-1', 'ghf-15390101-1', 'ghf-15360101-1', 'ghf-14440101-1'],
   ledger={'W': 'Manor of Llandough: Cydfin or Tŷ Mawr, 107 acres, on written leases'})
sc('P', 'ghf-15600101-1', '1560-01-01', 'Mid 16th – late 18th century', 'The Vaughans of Great House', 'Great House Farm', 'AB',
   'Heritage record',
   'The title has a root. A letter to the Western Mail will one day trace it from Tewkesbury Abbey to the Crown and the Herberts. From the middle of the sixteenth century the Vaughans, a minor gentry family, hold Great House as the chief freehold farm of the parish. Their memorials are still in the church next door.',
   [HER, press('N04', "Western Mail, 'Grievous loss' (letter tracing the descent)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg')],
   ledger={'W': 'Freehold: the Vaughans (root traced via Tewkesbury Abbey, the Crown and the Herberts)'})
sc('P', 'ghf-16670101-1', '1667-01-01', '1667', 'The Williamses arrive', 'Great House Farm', 'A',
   "Mary's statement",
   "In 1667 the Williams family come to Great House. Mary Williams, born there two and a half centuries later, will say her ancestors bought it. From now on, for more than three hundred years, there is a Williams in the house.",
   [MARY, w('/williams-buckler-family/', 'The Williams / Buckler Family — origins')],
   aliases=['ghf-16770101-1'],
   ledger={'W': 'Freehold: the Vaughans · in the house: the Williamses'})
sc('P', 'ghf-18000101-1', '1800-01-01', 'Early 19th century', 'The Marquesses of Bute', 'Great House', 'AB',
   'Heritage record',
   "Early in the nineteenth century the Bute Estate, the greatest landowner in South Wales, takes the freehold. The manor courts of Llandough and Leckwith sit in the house itself. By 1818 Llandough's rents are in Bute's books, and in 1824 the estate's surveyor walks the farm and writes it down. One owner, one farm, one title.",
   [HER, w('/bute-estate/', 'The Bute Estate'),
    {'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records R1: Glamorgan Estate rentals',
     'url': 'https://archives.library.wales/index.php/glamorgan-estate-rentals'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations (Stewart survey, D/d B E/1–2)')],
   aliases=['ghf-17700101-1', 'ghf-17940101-1',
            'ghf-18180101-2', 'ghf-18180101-1', 'ghf-18200101-1', 'ghf-18210101-1', 'ghf-18240101-1'],
   ledger={'W': 'Freehold: the Bute Estate · tenants: the Williamses'})
sc('P', 'ghf-18400101-1', '1840-01-01', 'c. 1840', 'The Great House shrinks', 'Census and tithe records', 'AB',
   'Public record',
   "Then, on paper, the Great House begins to shrink. In the census and the tithe returns it stops being 'Great House' and becomes 'Great House Farm': no longer the court house of a manor, just a farmhouse. It is the first time the records describe the place as something less than it is. In this story, how a thing is described will matter as much as what it is.",
   [w('/great-house-farm/farmhouse-nomenclature/', 'Farmhouse Nomenclature'), w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-18800101-1'])

# ---------------------------------------------------------------- ACT I
sc('I', 'ghf-18580101-1', '1858-01-01', 'c. 1858', 'Bones by the church', 'Church Farm, Llandough', 'x',
   'Museum record',
   "Workmen digging foundations beside the church find six skeletons, a medieval spearhead and a spur. The bones are put back in the ground by the churchyard stile. Llandough's dead lie close under the surface. Nobody yet asks how many there are.",
   [w('/evidence-library/ghf-e106-r33-a1-1931-letter-museum-wales-file-63-24/', '1931 letter, Museum Wales file 63.24', 'Museum record'), ARCH],
   aliases=['ghf-19311122-1'])
sc('I', 'ghf-18700101-1', '1870-01-01', 'c. 1870', 'The soldier under the floor', 'Great House — dining room', 'A',
   'Family account',
   "Under the dining-room floor of the Great House, the family will always say, lies a soldier in armour, with his horse, his lance and a small shield. The story is told for a hundred years. It reaches the Daily Telegraph and the Royal Commission's files. Nobody ever lifts the floor to look.",
   [press('N03', 'Daily Telegraph, 16 April 1974 (dates the find to "about 1870")'), HER, ARCH],
   aliases=['ghf-18800101-2'])
sc('I', 'ghf-18760101-1', '1876-01-01', '1876 – c. 1912', 'The quarrymen', 'Llandough Limeworks', 'A',
   'Estate papers',
   'Limestone brings the quarrymen. The Bute Estate lets about thirty-three acres of the farm to the Llandough Limeworks, and for the next thirty-five years the quarry eats into the land.',
   [w('/llandough-limeworks/', 'Llandough Limeworks')])
sc('I', 'ghf-18770101-1', '1877-01-01', '1877', 'The split', 'Bute Estate Office', 'AB',
   "Mary's statement",
   "1877. The move that everything turns on. The Bute Estate sells the farmhouse, its buildings and about ten acres to the quarryman Daniel Thomas. Call it Parcel A. Bute keeps nine acres of fields on the top. Call that Parcel B. From today they are two pieces of land with two owners and two chains of title. The Williamses stay on as tenants of both: of the house under Thomas, of the fields under Bute. And, as Mary will tell it, with a promise: when the quarrying ends, the freehold of the house comes to them. Hold on to this. Bute no longer owns the house. Anything Bute sells after today can only be Parcel B.",
   [MARY, w('/1877-agreement/#sale-1877', 'The 1877 Agreement — the sale'), w('/1877-agreement/#plan', 'The 1877 Agreement — plan'),
    w('/the-two-parcels/', 'The Two Parcels'), w('/1877-agreement/#sale-1877', 'The 1877 Agreement — Bute lease')],
   aliases=['ghf-18771106-1'],
   ledger={'W': None,
           'A': 'Freehold: Daniel Thomas (bought from Bute) · tenants: the Williamses, promised the freehold when quarrying ends',
           'B': 'Freehold: the Bute Estate · tenants: the Williamses'})
sc('I', 'ghf-18911111-1', '1891-11-11', '11 November 1891', 'Three geese', 'Llandough — court report', 'AB',
   'Newspaper',
   'Fourteen years later three geese are stolen from "Mr. John Williams, Great House Farm, Llandough". The thief goes to court, and the newspaper records, in passing, who lives at the house.',
   [press('N01', '1891 court report — farmyard theft', 'ghf-e090-n01-1891-farmyard-theft.jpg')],
   image='/media/ghf-e090-n01-1891-farmyard-theft.jpg')
sc('I', 'ghf-18970501-1', '1897-05-01', 'May 1897', 'Marconi', 'Lavernock Point', '?',
   'Family account',
   "In May 1897 Marconi sends the first wireless signals across open sea, from Lavernock Point to Flat Holm. In the family's memory it is Thomas Williams of Great House who carts his equipment down to the point.",
   [press('N02', 'Press report of the Lavernock trials, 1897', 'ghf-e090-n02-1897-marconi-lavernock.jpg')],
   image='/media/ghf-e090-n02-1897-marconi-lavernock.jpg')
sc('I', 'ghf-19080101-1', '1908-01-01', '1908', 'Two landlords', 'Great House Farm', 'AB',
   "Mary's statement",
   "Mary's grandfather dies, and her father, John Williams, takes over both tenancies: the house from the Thomases, the fields from Bute. Two parcels, two landlords, one family farming them as one. On the ground it looks like one farm. On paper it is two.",
   [MARY, w('/john-williams/#y1908', 'John Williams — 1908'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (1905 Bute conveyance)')],
   aliases=['ghf-19050223-1'],
   ledger={'A': 'Freehold: the Thomases · tenant: John Williams',
           'B': 'Freehold: the Bute Estate · tenant: John Williams'})
sc('I', 'ghf-19130810-1', '1913-08-10', '10 August 1913', 'Mary is born', 'Great House Farm', 'A',
   "Mary's statement",
   'On 10 August 1913 Mary Williams is born in the farmhouse. She will live in it for the rest of her life, and she will die in it.',
   [w('/mary-williams/', 'Mary Williams'), MARY])

# ---------------------------------------------------------------- ACT II
sc('II', 'ghf-19160201-1', '1916-02-01', 'February 1916', '"The whole farm"', 'Great House Farm', 'AB',
   'Court record',
   'February 1916. Bute lets John Williams "the whole farm" on a yearly tenancy. But Bute has not owned the house since 1877. It can only let the fields. Two words, "whole farm", describe two parcels as if they were one, and put the house inside a tenancy from a landlord who no longer owns it. Nobody notices. Seventy years later a court will quote those two words and build on them. This is the seed of a second Parcel A: not the land itself, but a description of it.',
   [w('/1916-tenancy/#grant', 'The 1916 Tenancy', 'Court record'), JUDG, w('/the-two-parcels/whole-farm-nomenclature/', 'The Farm / Whole Farm Nomenclature')],
   ledger={'S': 'Seed: the words "the whole farm" in a Bute tenancy (Bute can only let Parcel B)'})
sc('II', 'ghf-19280101-1', '1928-01-01', '1928', 'The last rent', 'Great House Farm', 'A',
   "Mary's statement",
   'In 1928 the last of the quarry machinery leaves. John Williams pays a final rent of about four pounds to Alfred Thomas, and the bargain of 1877 comes due: the quarrying is over, and the freehold of the house passes to the family. Mary sees the receipt. From this year the true Parcel A has a complete chain: the Vaughans, Bute, Daniel Thomas, the Williamses. The family pay no more rent on the house, to anyone, ever again.',
   [MARY, w('/1877-agreement/#takes-effect', 'The 1877 Agreement — takes effect 1928'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (15 May 1924 agreement)')],
   aliases=['ghf-19240515-1'],
   ledger={'A': 'Freehold: the Williamses (Bute → Thomas → Williams; 1877 agreement and 1928 receipt kept at the house)'})
sc('II', 'ghf-19360101-1', '1936-01-01', '1936', 'Mary marries Frederick', 'Great House Farm', 'A',
   'Family account',
   'Mary marries Frederick Buckler, a farmer, and he comes to live with her in the house. They will have seven children; the first, a son, is born within a few years. Note who owns what: the house is Mary\'s family\'s. Frederick will farm the fields.',
   [w('/frederick-buckler/#marriage', 'Frederick Buckler — marriage'), w('/frederick-buckler/', 'Frederick Buckler'),
    w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19100101-1', 'ghf-19370101-1'])
sc('II', 'ghf-19380101-1', '1938-01-01', '1938', 'Bute sells out', 'Bute Estate Office', 'B',
   'Court record',
   "In 1938 Bute sells its interest to a property company, Western Ground Rents. What can it sell? Only what it still owns: Parcel B, the fields, and the landlord's interest in the tenancy of them. It cannot sell Parcel A. It sold that sixty years ago. Western Ground Rents now owns the fields. It has no deed to the house, and it never will.",
   [w('/1939-revised-tenancy/#y1938', '1938–39: Sale to WGR and the Revised Tenancy'), JUDG],
   ledger={'B': 'Freehold: Western Ground Rents (from Bute, 1938) · tenant: John Williams'})
sc('II', 'ghf-19390501-1', '1939-05-01', 'May 1939', 'The plan', 'Great House Farm', 'B',
   'Document',
   'A year later Western Ground Rents gives John Williams a new tenancy, with a plan. The plan shows the fields east of the house. The house is not on it. The new landlord\'s own document draws the line of 1877: its tenancy is of Parcel B, and only Parcel B. It is the last written tenancy there will ever be.',
   [w('/1939-revised-tenancy/#y1939', '1938–39: the 1939 tenancy'), w('/1939-revised-tenancy/#plan', 'The 1939 tenancy plan')],
   ledger={'B': 'Freehold: Western Ground Rents · tenant: John Williams (1939 plan: fields only)'})
sc('II', 'ghf-19400101-1', '1940-01-01', 'c. 1940', 'Twelve years', 'Great House Farm', 'A',
   'Family case',
   'By 1940 John Williams has lived in the house for twelve years without paying anyone a penny for it. In law, twelve years is enough. So the family now hold Parcel A twice over: by the bargain of 1877, and by time. Any other claim to the house that might once have existed is, from now on, out of time.',
   [w('/1939-revised-tenancy/#c1940', '1938–39 — c. 1940')],
   ledger={'A': 'Freehold: the Williamses, by the 1877 bargain and by twelve years rent-free'})
sc('II', 'ghf-19440101-1', '1944-01-01', '1944', 'War on the land', 'Great House Farm', 'B',
   "Mary's statement",
   'The war is on, the farm is struggling, and the War Agricultural Committee wants it run better. Frederick takes over the fields as manager for his father-in-law.',
   [MARY, w('/john-williams/#y1944', 'John Williams — 1944')])
sc('II', 'ghf-19480101-1', '1948-01-01', 'c. 1948 – 49', 'Billy is born', 'Great House Farm', 'A',
   'Family account',
   'William Buckler, Billy, is born at the farm. He will be the last of the family to live there, and the one they evict.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')])

# ---------------------------------------------------------------- ACT III
sc('III', 'ghf-19490202-1', '1949-02-02', '2 February 1949', 'Nothing in writing', 'Great House Farm', 'B',
   'Court record',
   "February 1949. John Williams gives up his tenancy of the fields, and Frederick takes them on from Western Ground Rents. This time nothing is written down: no lease, no plan. Mary, who owns the house, is not a party to it. That gap is the opening. A tenancy with no plan has no edges, and from now on the landlord will speak of Frederick's tenancy as a tenancy of \"the farm\", house and all. The fields tenant is about to become the handle on the house.",
   [w('/frederick-buckler/#tenancy-1949', "Frederick Buckler — the 1949 tenancy", 'Court record'), JUDG, w('/the-two-parcels/', 'The Two Parcels')],
   ledger={'S': 'Move 1: Frederick\'s unwritten fields tenancy, spoken of as a tenancy of "the farm"',
           'B': 'Freehold: Western Ground Rents · tenant: Frederick Buckler (unwritten, from 1949)'})
sc('III', 'ghf-19500601-1', '1950-06-01', 'June 1950 – c. 1952', 'The blanket box', 'Great House Farm', 'A',
   "Mary's statement",
   "1950. An estate agent from Penarth places a lodger in the farmhouse. He stays two years. Before he goes, he tells Mary what he has done: he has taken the papers from the family's blanket box, 'including the agreement relating to the farm', and handed them to the agent. Think about what that means. The true Parcel A still exists. Its chain is still complete. But the family's copy of it, the paper that proves it, has just left the house. From now on, every time Mary says 'the house is mine', she will be asked for documents she no longer has.",
   [MARY, w('/1877-agreement/#papers-taken', 'The 1877 Agreement — papers taken')],
   ledger={'A': 'Freehold: the Williamses · their deeds taken from the blanket box (missing from now on; title buried, not extinguished)'})
sc('III', 'ghf-19521010-1', '1952-10-10', '1952 – 53', 'The last rent on the fields', "Landlords' agents", 'B',
   'Court record',
   "In October 1952 the landlord's agents write that they will not go on with a letting to Frederick. He pays his last rent on the fields the next year. After that the family pay no one for anything.",
   [w('/frederick-buckler/#tenancy-1949', 'Frederick Buckler — 1952 letter', 'Court record'), TL],
   aliases=['ghf-19530101-1'])
sc('III', 'ghf-19550202-1', '1955-02-02', '2 February 1955', 'The first order', 'High Court / Great House Farm', 'AB',
   'Court record',
   'February 1955. Western Ground Rents sues Frederick, its fields tenant, and gets a High Court order for possession of "the whole of the farm". Mary is not in the case. Nobody asks who owns the house. On 4 July they come to enforce it. They take the fields, and they leave the house: Mary is just home from hospital and stands her ground. So the order, as worded, covers both parcels; as carried out, only the fields. That ambiguity is the second move. Later it will be read as the moment the clock started on the house, in 1955, instead of 1928.',
   [w('/1955-possession-order/#order', 'The 1955 Possession Order', 'Court record'), w('/1955-possession-order/#enforcement', 'The 1955 Possession Order — enforcement', 'Court record')],
   ledger={'S': 'Move 2: High Court order against Frederick for "the whole of the farm" (enforced on the fields only)',
           'B': 'Freehold and possession: Western Ground Rents (fields taken 4 July 1955)'})
sc('III', 'ghf-19590101-1', '1959-01-01', '1959', 'Mary says no', 'Great House Farm', 'A',
   'Court record',
   'Move three. In 1959 Western Ground Rents offers Mary a tenancy of the farmhouse and garden, on their own. Why offer a tenancy of a house you already own? Because if she signs, she becomes a tenant, and a tenant cannot claim to own. She refuses. The house is hers, she tells them, through her grandfather, and there are documents to prove it. The documents are in someone else\'s hands. The court will one day record that they were "never produced".',
   [w('/1962-possession-order/#refusal-1959', 'The 1962 Possession Order — 1959 refusal', 'Court record'), JUDG],
   ledger={'S': 'Move 3: tenancy of the farmhouse and garden offered to Mary (refused)'})
sc('III', 'ghf-19621211-1', '1962-12-11', '11 December 1962', 'The 1962 order', 'Cardiff County Court', 'A',
   'Court record',
   "Move four, and the one that will matter most. 11 December 1962: in Cardiff County Court, Judge Temple Morris QC orders Frederick and Mary out of the farmhouse and garden, and to pay for every year back to 1955. For the first time Mary is named. But this is a possession order, not a ruling on title: it treats her as someone holding over on the old 'whole farm' tenancy, not as an owner. Western Ground Rents proves no deed to the house, because it has none. And then it does nothing. The order is never carried out. It goes into a drawer. Twenty-five years from now, it is what will save BP's case.",
   [w('/1962-possession-order/#order', 'The 1962 Possession Order', 'Court record'),
    LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration (29 March 1961 deed)')],
   aliases=['ghf-19610329-1'],
   ledger={'S': 'Move 4: county court possession order for the farmhouse and garden (WGR v Frederick and Mary) · never enforced'})
sc('III', 'ghf-19630601-1', '1963-06-01', 'June 1963', 'Committal', 'Cardiff County Court', 'A',
   'Court record',
   'The landlord goes after Frederick for the money under the order, and committal proceedings follow. Possession is not taken. The money, not the house, is enforced. The threat of prison now hangs over the family for staying in their own home.',
   [w('/1962-possession-order/#committal', 'The 1962 Possession Order — committal', 'Court record'), ARCH],
   aliases=['ghf-19630101-1'])
sc('III', 'ghf-19650301-1', '1965-03-02', 'January – March 1965', 'Two pounds a week', "Landlords' agents", 'A',
   'Document',
   "Move five. 2 March 1965: the agents offer 'Mrs Williams' a weekly tenancy of the farmhouse and garden at two pounds a week. It is the same trap as 1959: sign, and the owner becomes a tenant. Mary does not sign it, does not send it back, and does not pay. And now even the landlord's own records count her occupation as adverse: hers, not theirs. Every attempt to make her a tenant has failed.",
   [w('/1962-possession-order/#offer-1965', 'The 1965 offer'), w('/mary-williams/#chronology', 'Mary Williams — 1965 offer')],
   ledger={'S': 'Move 5: weekly tenancy offered to "Mrs Williams" (not signed; her occupation now treated as adverse)'})
sc('III', 'ghf-19640101-1', '1965-06-01', '1964 – 68', 'A rumoured sale', 'Great House Farm', '?',
   'Family account',
   'Somewhere in these years, a cousin will later say, the eldest son sells "our land parcel" through a solicitor, behind his parents\' backs. What he sold, and to whom, has never come to light. In 1968 he and his household leave the farm.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — rumoured sale'), w('/williams-buckler-family/', 'The Williams / Buckler Family')],
   aliases=['ghf-19680901-1'])
sc('III', 'ghf-19670101-1', '1967-01-01', '1967', 'Frederick dies', 'Great House Farm', 'A',
   'Family account',
   'Frederick Buckler dies at fifty-six. With him goes the only tenant there ever was. Mary takes back her maiden name, Williams, and stays on in the house she was born in: an owner who has never been a tenant.',
   [w('/frederick-buckler/#death', 'Frederick Buckler — death')],
   ledger={'B': 'Freehold and possession: Western Ground Rents'})

# ---------------------------------------------------------------- ACT IV
sc('IV', 'ghf-19691231-1', '1969-12-31', '31 December 1969', 'The handover', 'Great House Farm', 'AB',
   'Land Registry record',
   "31 December 1969. Western Ground Rents sells out to the BP Pension Trust, the pension fund of British Petroleum. Look closely at what can actually pass. Parcel B, the fields, passes with a proper chain: Bute, Western Ground Rents, BP. But for the house, Western Ground Rents has no deed to hand over. What it has is a case: the 1962 order, the refused tenancies, the 'whole farm' description. That is what BP takes on for Parcel A: not the house, but the claim against it. The 1969 conveyance will later be recited as the root of BP's title. Today it is missing from the Land Registry's files.",
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   ledger={'B': 'Freehold: BP Pension Trust (Bute → WGR → BP, by deed)',
           'S': 'Held by BP Pension Trust: the 1962 order and the case against Mary (no deed to Parcel A; the 1969 root conveyance now missing)'})
sc('IV', 'ghf-19720725-1', '1972-07-25', '1970 – 72', 'Plans drawn around her', 'Planning office', 'AB',
   'Planning file',
   'Around Mary, the plans are already being drawn. In 1970 land by Leckwith Road is registered as a village green. In July 1972 planning permission is granted for houses on the site, with Mary still living in the middle of it. The development needs the house. The house needs a title.',
   [REDEV, TL], aliases=['ghf-19700616-1'])
sc('IV', 'ghf-19740101-1', '1974-01-01', '1974', 'Half a survey', 'Great House — interior', 'A',
   'Heritage record',
   "The Royal Commission sends a surveyor to record the old house. He gets as far as the ground floor. The rest, he notes, cannot be examined 'because of problems of access created by an ownership dispute'. A public body writes it down in 1974: the ownership of this house is disputed.",
   [HER, ARCH])
sc('IV', 'ghf-19740415-1', '1974-04-15', '15 April 1974', 'Open day', 'Great House Farm', 'A',
   'Newspaper',
   "On 15 April 1974 Mary, now sixty, opens her home to the public 'to show what the nation is losing'. Hundreds come, and a thousand sign a petition. She tells the Daily Telegraph that ownership of the house has been disputed for twenty-five years, that she will refuse to move, and that her solicitors say she has a valid claim. It is in a national newspaper: she claims to own the house.",
   [press('N03', "Daily Telegraph, 16 April 1974, 'Open day to save ancient Welsh house'", 'ghf-e090-n03-1974-open-day-telegraph.jpg'),
    w('/1974-licence-letters/#action', 'The 1974 Licence Letters')],
   image='/media/ghf-e090-n03-1974-open-day-telegraph.jpg')
sc('IV', 'ghf-19740703-1', '1974-07-03', '3 July 1974', 'Mary pleads ownership', 'County court', 'A',
   'Court record',
   "BP Pension Trust brings a new county court action for possession of the house. And on 3 July 1974 Mary does what nobody has yet let her do: in a court, in her defence, she pleads that the house is hers, and the Limitation Act besides. Now the question of title is finally before a judge. The hearing is part heard and adjourned. And BP never brings it back. Her claim to own the house is never decided. Not then, not ever. It is never extinguished.",
   [w('/1974-licence-letters/#action', 'The 1974 Licence Letters — the action', 'Court record'), JUDG],
   ledger={'A': 'Freehold claimed by Mary, in occupation · ownership pleaded in court, 3 July 1974 (adjourned, never decided)'})
sc('IV', 'ghf-19741031-1', '1974-10-31', 'September – October 1974', 'The licence letters', 'Great House Farm', 'A',
   'Court record',
   "Move six, and the cleverest. Instead of fighting the title case it started, BP reaches back for the old 1962 order. On 19 September it gets leave to enforce it; Mary is given no notice. Then, on 31 October, BP withdraws the warrant and writes to her instead, 'licensing' her to stay in the farmhouse rent-free for the rest of her life. Why would an owner need a licence? She doesn't, and she never accepts it. But a licence does not need to be accepted to be useful. On paper, from today, BP can say she lives there with its permission. BP keeps the letters.",
   [w('/1974-licence-letters/#letters', 'The 1974 Licence Letters', 'Court record'), JUDG,
    w('/1974-licence-letters/#warrant', 'The 1974 Licence Letters — the warrant', 'Court record')],
   aliases=['ghf-19741031-2', 'ghf-19740919-1'],
   ledger={'S': 'Move 6: BP\'s "licence" letters to Mary, 31 October 1974 (never accepted); 1962 warrant withdrawn'})
sc('IV', 'ghf-19741119-1', '1974-11-19', '19 November, 1970s (year unclear)', '"Grievous loss"', 'Western Mail — letters', 'A',
   'Newspaper',
   "A letter to the Western Mail warns that pulling down Great House would wipe out the site of St Dochdwy's Celtic monastery, and traces the land back through Tewkesbury Abbey, the Crown, the Herberts and Bute. The true chain of title is printed in a newspaper. Nobody follows it.",
   [press('N04', "Western Mail, 'Grievous loss' (letter)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg'),
    w('/restoration-campaign/#open-day-1974', 'The Restoration Campaign')])
sc('IV', 'ghf-19750523-1', '1975-05-23', '23 May 1975', 'A deed for the mimic', 'BP Pension Trust / BP Properties', 'A',
   'Land Registry record',
   "Move seven. 23 May 1975: the BP Pension Trust conveys property at Great House Farm to its sister company, BP Properties, with a plan. The Court of Appeal will later call this 'the actual conveyance of the farmhouse and garden'. Stop there. One BP company is conveying Mary's house to another, while Mary lives in it and claims it in court. The seller has no deed to the house from Bute, from the Thomases or from anyone. But after today, the synthetic Parcel A has something it never had before: a conveyance of its own.",
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   ledger={'S': 'Move 7: conveyance BP Pension Trust → BP Properties of "the farmhouse and garden" (no earlier deed to Parcel A behind it)'})
sc('IV', 'ghf-19800522-1', '1980-05-22', '22 May 1980', '"The most rapacious ground landlord"', 'House of Commons', '',
   'Parliament',
   "In May 1980 Ted Rowlands MP tells the House of Commons that Western Ground Rents, 'the most rapacious ground landlord' in South Wales, has been bought by the BP pension fund. The company that built the case against the house in the 1950s and 60s, and the company that inherited it, are now one family.",
   [press('N16', 'Hansard, 22 May 1980', 'ghf-e090-n16-1980-hansard-rowlands.jpg')],
   image='/media/ghf-e090-n16-1980-hansard-rowlands.jpg')
sc('IV', 'ghf-19821001-1', '1982-10-01', '1 October 1982', 'A warning about the ground', 'GGAT', 'AB',
   'Planning file',
   "In October 1982 GGAT, the regional archaeological trust, warns the planners that the ancient settlement may run north of the church, under the farm, and asks for thorough investigation before anything is built.",
   [ARCH, GGAT_REV,
    press('N05', 'Neath Guardian, 17 April 1980 (Roman villa, a separate site)', 'ghf-e090-n05-1980-neath-guardian.jpg'),
    press('N06', "South Wales Echo, 18 March 1983 — burnt relics (Roman villa finds, a separate site)", 'ghf-e090-n06-1983-echo-burnt-relics.jpg')],
   aliases=['ghf-19780101-1', 'ghf-press-19800417-n05', 'ghf-19830313-1'])
sc('IV', 'ghf-19821119-1', '1982-11-19', '19 – 30 November 1982', 'First registration: the fields', 'HM Land Registry', 'AB',
   'Land Registry record',
   "Move eight. November 1982: BP's solicitors apply to register the land at HM Land Registry for the first time, as one main title. Once land is registered, the register is the title. Mary is seventy and living in the farmhouse. Nothing on the file shows anyone asking her what she claims.",
   [LRT('first-registration', 'Land Registry Titles — first registration'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1982-83-registration-opportunity-to-object/', '1982–83 Registration & Opportunity to Object', 'Analysis')],
   ledger={'B': 'Registered: BP Properties, main title WA231076 (applied 30 November 1982)'})
sc('IV', 'ghf-19830223-1', '1983-02-23', '23 February 1983', 'First registration: the mimic', 'HM Land Registry', 'A',
   'Land Registry record',
   "Move nine. February 1983: a second application, for the farmhouse and garden as a separate title, resting on the 1975 conveyance between the two BP companies. The solicitors certify that they know of no question or doubt affecting the title. The woman who pleaded ownership in court nine years ago is living in the house. Now the synthetic Parcel A is not just a conveyance. It is a registered title, issued by the state.",
   [LRT('first-registration', 'Land Registry Titles — first registration'), LEGAL],
   ledger={'S': 'Move 9: registered as a separate title, WA240304, on the 1975 conveyance ("no question or doubt")'})
sc('IV', 'ghf-19830326-1', '1983-03-26', '26 March 1983', 'Mary dies', 'Great House Farm', 'A',
   'Family account',
   'On 26 March 1983, a month later, Mary Williams dies in the farmhouse where she was born. She dies an owner who never signed a tenancy and never accepted a licence, with her claim never decided. Her son Billy inherits it, and the house, and the fight.',
   [w('/mary-williams/#death', 'Mary Williams — death'), w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   ledger={'A': 'Freehold claim passes to Billy Buckler, in occupation · never decided, never extinguished'})
sc('IV', 'ghf-19830408-1', '1983-04-08', '8 April – 12 May 1983', 'Letters after her death', 'HM Land Registry', 'A',
   'Land Registry record',
   "Two weeks after Mary's death, BP's solicitors and the Land Registry are writing to each other about the farmhouse file, including an 'inside examination' form. What the Registry asked about the family living in the house, and what it was told, is in those letters.",
   [LRT('first-registration', 'Land Registry Titles — first registration')])

# ---------------------------------------------------------------- ACT V
sc('V', 'ghf-19840522-1', '1984-05-22', '1984', "BP's writ", 'BP Properties', 'A',
   'Court record',
   "May 1984. BP Properties serves Billy with a writ for possession of the farm 'and adjoining land'. Watch what BP does not do. It does not ask the court to declare that it owns the house. It asks only for possession, on the strength of the licence letters. Billy's lawyers answer with adverse possession: twelve years' occupation, counted from 1955. Mary's own case, the 1877 title, is not run. The fight is now about who may occupy the house, not who owns it. That same year, the family learn, the library's copy of the 1877 deed goes missing.",
   [w('/bp-properties-v-buckler/#writ', 'BP Properties Ltd v Buckler — the writ', 'Court record'), w('/1877-agreement/#library-1984', 'The 1877 Agreement — library copy missing'),
    LRT('first-registration')],
   aliases=['ghf-19840113-1'])
sc('V', 'ghf-19860710-1', '1986-07-10', '10 July 1986', 'Judgment for BP', 'High Court, Cardiff', 'A',
   'Court record',
   "10 July 1986, the High Court at Cardiff. Mr Justice Hollis finds for BP: the 1974 letters gave Mary a licence, so her possession was never adverse. Move six has done its work. The deed of 1877, the receipt of 1928, the 1939 plan that left the house out: none of it is before him. The question of who owns the house is never put.",
   [w('/bp-properties-v-buckler/#high-court', 'BP Properties Ltd v Buckler — High Court', 'Court record'),
    w('/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/', 'BP v Buckler: Scope, Decided & Undecided', 'Analysis')])
sc('V', 'ghf-19860711-1', '1986-07-11', '1986 – 87', 'A file goes missing', 'Royal Commission (RCAHMW)', 'A',
   'Official correspondence',
   "While the case goes on, the Royal Commission's correspondence with Mrs Buckler goes missing from its files: letters in which she may have told an independent public body, in her own words, why the house was hers.",
   [w('/scrutiny-and-accountability/legal-review-fraud-land-human-rights/#loss-pattern', 'Legal Review — the loss pattern', 'Analysis')])
sc('V', 'ghf-19870202-1', '1987-02-02', '2 February 1987', 'The merger', 'HM Land Registry', 'AB',
   'Land Registry record',
   "Move ten. 2 February 1987, with Billy's appeal still waiting to be heard: an application to fold the separate farmhouse title into the main title for the fields. The synthetic Parcel A disappears into Parcel B. From now on there is no separate record of the house to examine, no line on the register where its missing root could be noticed. There is just one title, and it says 'BP'. The true Parcel A is still there, underneath. It has never been extinguished. It has simply been buried.",
   [LRT('first-registration', 'Land Registry Titles — amalgamation'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/', '1987 HMLR Amalgamation During Appeal', 'Analysis')],
   ledger={'S': None, 'B': None,
           'M': 'Registered: BP Properties, WA231076 = Parcel B + synthetic Parcel A (farmhouse title folded in, 2 February 1987)'})
sc('V', 'ghf-19870731-1', '1987-07-31', '31 July 1987', 'The Court of Appeal', 'Court of Appeal, London', 'A',
   'Court record',
   "31 July 1987, the Court of Appeal. Here is the twist. The judges find that Frederick and Mary were in adverse possession of the house from 1955. The clock was running against the landlord. So why does BP win? Because of two moves. The 1962 order, never enforced, was brought within twelve years and so stopped the clock. And the 1974 letters made Mary's possession permissive, the court holds, whether she accepted them or not. Her title documents, the judgment notes, were 'never produced'. Nobody asks where they went. BP is recorded as having 'the paper title to the farm'. Nobody tests that paper against 1877. BP Properties Ltd v Buckler goes into the law books as a leading case on adverse possession. It decided possession. It never decided ownership.",
   [JUDG, w('/bp-properties-v-buckler/#omits', 'BP Properties Ltd v Buckler — what it omits', 'Analysis')],
   ledger={'A': 'Freehold claim: Billy Buckler · never adjudicated, never extinguished (judgment decides possession only)',
           'M': 'WA231076, BP Properties · right to possession upheld (1962 order + 1974 licence)'})
sc('V', 'ghf-19880303-1', '1988-03-03', '3 March 1988', 'Twenty-eight days', 'House of Lords', 'A',
   'Court record',
   'On 3 March 1988 the House of Lords refuses leave to appeal. The family are given twenty-eight days to leave a house the Williamses have lived in for three hundred years, on an order that never said whose house it was.',
   [w('/bp-properties-v-buckler/#house-of-lords', 'BP Properties Ltd v Buckler — House of Lords', 'Court record')])

# ---------------------------------------------------------------- ACT VI
sc('VI', 'ghf-19880429-1', '1988-04-29', '29 April 1988, morning', 'The bailiffs come', 'Great House Farm', 'A',
   'Newspaper',
   '29 April 1988. Five bailiffs and fifteen police officers come up the lane. Billy blocks the narrow drive with a tractor, locks the doors and bars the windows.',
   [press('N07', "'Chainsaw farmer vows to fight on', c. 30 April 1988", 'ghf-e090-n07-1988-police-wait-photo.jpg'),
    echo('01', '29 April 1988')],
   image='/media/ghf-e090-n07-1988-police-wait-photo.jpg',
   aliases=['ghf-press-n15-01'])
sc('VI', 'ghf-19880429-2', '1988-04-29', '29 April 1988', 'The chainsaw', 'Great House Farm', 'A',
   'Newspaper',
   "The bailiffs smash the gate and take poleaxes to the doors. When an axe comes through a door with his three small children behind it, Billy starts a chainsaw and pushes it through. The bailiffs fall back. After four hours they leave. Branwen takes the children away. BP tells the press it let Mary stay out of kindness. Billy tells them the farm is theirs. Both are talking about the 1974 letters. Only one of them knows what they were for.",
   [press('N07', "'Chainsaw farmer vows to fight on'", 'ghf-e090-n07-1988-chainsaw-farmer.jpg'), echo('02', '30 April 1988')],
   image='/media/ghf-e090-n07-1988-chainsaw-farmer.jpg',
   aliases=['ghf-press-n07', 'ghf-press-n15-02'])
sc('VI', 'ghf-19880512-1', '1988-05-12', 'May 1988', '"Someone will be killed"', "Alun Michael MP's office", 'A',
   'Newspaper',
   "Billy takes his case to the European Commission of Human Rights in Strasbourg. On 12 May the Cardiff MP Alun Michael asks the Lord Chancellor to look at it again. Billy warns that someone is going to be killed.",
   [echo('03', '12 May 1988'), w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record')],
   aliases=['ghf-press-n15-03', 'ghf-19880503-1'])
sc('VI', 'ghf-19880729-1', '1988-07-29', '29 July 1988', 'Cadw comes to look', 'Great House Farm', 'A',
   'Photograph',
   "On 29 July Cadw, the Welsh heritage body, comes to look at the house for listing, and photographs the farmhouse and the barn. Listing would protect the building, whoever owned it. Those two photographs are all that is left of the visit. No notes, no file, no record of who decided.",
   [CADW_PH, CADW_BARN, CADW_CRIT],
   image='/media/1988-cadw-farmhouse.jpg')
sc('VI', 'ghf-19881130-1', '1988-11-30', '29 – 30 November 1988', 'Forced entry', 'Great House Farm', 'A',
   'Newspaper',
   "29 November. The bailiffs come back, and this time they force their way in. Within hours, the family say, the demolition has begun: half the roof is already off an outbuilding. Billy is taken to Llandough Hospital. Eight other people living at the farm lose their homes with the family. For the first time in three hundred years, there is no Williams in the house.",
   [press('N14', "South Wales Echo front page — 'Angry scenes as farmer evicted'", 'ghf-e090-n14-1988-echo-front-page.jpg'),
    echo('04', '30 November 1988'),
    press('N09', "South Wales Echo, 3 December 1988 — 'Billy's unhappy family'", 'ghf-e090-n09-1988-billys-unhappy-family.jpg')],
   image='/media/ghf-e090-n14-1988-echo-front-page.jpg',
   aliases=['ghf-press-n14', 'ghf-press-n15-04', 'ghf-press-n09'],
   ledger={'A': 'Freehold claim: Billy Buckler, evicted 29 November 1988 · never adjudicated, never extinguished',
           'M': 'WA231076, BP Properties · in possession from 29 November 1988'})
sc('VI', 'ghf-19881201-1', '1988-12-01', '1 December 1988', 'Everything in the road', 'Llandough Hospital', 'A',
   'Newspaper',
   "Billy lies injured in hospital. Branwen and the children have nowhere to go. Mary's whole life, her photographs, the family heirlooms, the legal papers, is left in the house or thrown into the road. Billy has the clothes he stands in.",
   [press('N08', 'South Wales Echo, 3 December 1988'), echo('11', '13 December 1988')],
   aliases=['ghf-press-n15-11'])
sc('VI', 'ghf-19881202-1', '1988-12-02', '2 December 1988', 'Do not touch the house', 'High Court', 'A',
   'Newspaper',
   "On 2 December a High Court judge orders that the farmhouse and everything in it must not be touched. Branwen may go in for her belongings, if BP's solicitors agree. BP says it means to demolish and build new homes on the ten acres.",
   [press('N08', "South Wales Echo, 3 December 1988 — 'History fight to save farm'", 'ghf-e090-n08-1988-history-fight.jpg'), echo('05', '2 December 1988')],
   image='/media/ghf-e090-n08-1988-history-fight.jpg',
   aliases=['ghf-press-n15-05', 'ghf-press-n08'])
sc('VI', 'ghf-19881209-1', '1988-12-03', '3 December 1988', 'From hospital bed to the dock', 'Llandough Hospital / magistrates', 'A',
   'Newspaper',
   'Police take Billy from his hospital bed and charge him with assaulting two bailiffs, criminal damage, and furious driving.',
   [echo('06', '3 December 1988'), press('N15', 'South Wales Echo, 3 December 1988')],
   aliases=['ghf-19881130-2', 'ghf-press-n15-06', 'ghf-press-n15-10'])
sc('VI', 'ghf-19881203-1', '1988-12-03', '3 – 5 December 1988', 'One weekend', 'Cadw', 'A',
   'Official correspondence',
   "Over one weekend, without setting foot inside, Cadw considers emergency listing. In public it says it is looking at the house. In July it had already marked it just below the bar.",
   [CADW_CRIT, press('N08', "South Wales Echo, 3 December 1988 — Cadw considering spot-listing")])
sc('VI', 'ghf-19881205-1', '1988-12-05', 'Monday 5 December 1988', 'Nothing more we can do', 'Cardiff', 'A',
   'Newspaper',
   "Monday 5 December. Judge Norman Francis refuses to keep the injunction in place until Strasbourg can hear the family. Their solicitor says there is nothing more they can do. The same day Cadw announces that the house is not of sufficient merit to list. Nothing now protects it.",
   [press('N10', "Western Mail, 6 December 1988 — 'Farmer fails in final eviction hearing'", 'ghf-e090-n10-1988-western-mail-final-hearing.jpg')],
   image='/media/ghf-e090-n10-1988-western-mail-final-hearing.jpg',
   aliases=['ghf-press-n10'])
sc('VI', 'ghf-19881206-1', '1988-12-06', '6 December 1988, 4am', 'Bulldozed before breakfast', 'Great House Farm', 'A',
   'Newspaper',
   "6 December 1988. Just after four in the morning, a twenty-strong team arrives with bulldozers. By breakfast no building is left standing. Branwen and the children watch their home go. The old court house of the manor, the soldier under the floor, the evidence of what the house was: gone before the day has begun. You can demolish a house. You cannot demolish a title. The true Parcel A is still there, under the rubble, undecided.",
   [press('N11', "'Tears flow as 800 year-old farm house is razed at last'", 'ghf-e090-n11-1988-tears-flow-razed.jpg'),
    echo('07', '6 December 1988'), echo('12', '21 December 1988 (reader\'s letter on "Bulldozed Before Breakfast")'), HER],
   image='/media/ghf-e090-n11-1988-tears-flow-razed.jpg',
   aliases=['ghf-press-n11', 'ghf-press-n15-07', 'ghf-press-n15-12', 'ghf-19881211-1'],
   ledger={'A': 'Freehold claim: Billy Buckler · house demolished 6 December 1988 · title never adjudicated, never extinguished'})
sc('VI', 'ghf-19881208-1', '1988-12-07', '7 – 9 December 1988', 'Like a battlefield', 'Llandough', 'A',
   'Newspaper',
   "Llandough is furious. A county councillor, himself a BP pensioner, calls it 'disgusting'. Villagers confront their councillors. The council's planning chief, the family remember, says the site looks like a battlefield. On 9 December magistrates bail Billy on condition that he stays away from the land he was born on.",
   [echo('08', '7 December 1988'), echo('09', '9 December 1988'), echo('10', '10 December 1988'), w('/demolition-1988/', '1988: Possession and Demolition')],
   aliases=['ghf-press-n15-08', 'ghf-press-n15-09'])
sc('VI', 'ghf-19881212-1', '1988-12-12', 'December 1988', 'In the rubble', 'Great House Farm — rubble', 'A',
   'Heritage record',
   "In the rubble a Royal Commission investigator finds what the bulldozers left: a carved fireplace jamb, and a moulded beam of a kind rare in Glamorgan. And he records what is lost: a carved stone capital that stood by the front door, probably taken long ago from the old church.",
   [HER, ARCH])

# ---------------------------------------------------------------- ACT VII
sc('VII', 'ghf-19890320-1', '1989-03-20', '20 March 1989', 'Clearing the site', 'Great House Farm', 'A',
   'Newspaper',
   'On 20 March 1989, at half past seven in the morning, the lorries move in to carry away what is left.',
   [echo('14', '20 March 1989')], aliases=['ghf-press-n15-14'])
sc('VII', 'ghf-19890323-1', '1989-03-23', 'January – March 1989', '"I will fight on"', 'Court', 'A',
   'Newspaper',
   "In January one charge is dropped as out of time, and Billy is told not to come within half a mile of the site. On 23 March he pleads guilty to the rest and walks free. He will fight on, he says, for his home and for more than seventy acres of land.",
   [echo('15', '23 March 1989'), echo('16', '24 March 1989'),
    press('N12', "'Charge against evicted farmer dropped', January 1989", 'ghf-e090-n12-1989-charge-dropped.jpg'), echo('13', '6 January 1989')],
   aliases=['ghf-press-n15-15', 'ghf-press-n15-16', 'ghf-19890115-1', 'ghf-press-n15-13'])
sc('VII', 'ghf-19890325-1', '1989-03-25', '1989', 'From farm to a bus', 'Penarth', 'A',
   'Newspaper',
   "The family who lived in the Great House now live with Billy's sister in Penarth. Billy plans to make a home in an old bus. Thirty thousand pounds' worth of his belongings, he says, were taken from the site after the demolition.",
   [press('N13', "South Wales Echo, 1989 — 'From farm to a bus'", 'ghf-e090-n13-1989-farm-to-bus.jpg')],
   image='/media/ghf-e090-n13-1989-farm-to-bus.jpg')
sc('VII', 'ghf-19890414-1', '1989-04-14', '14 April 1989', 'Strasbourg says no', 'European Commission of Human Rights', 'A',
   'Court record',
   "In April 1989 Strasbourg rules. The European Commission accepts that the eviction interfered with Billy's home, but finds it lawful, to protect BP's rights as owner. It says Billy had no 'possession' in law, because the domestic courts had held the property belonged to another. But the domestic courts never held that. They decided possession. Strasbourg never saw a title deed either.",
   [w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record'),
    {'type': 'Court record', 'title': 'Buckler v United Kingdom, Commission decision (PDF)', 'url': WIKI + '/wp-content/uploads/2026/09/wp-1790112811838.pdf'}])
sc('VII', 'ghf-19891107-1', '1989-11-07', 'October – November 1989', 'BP applies to build', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "In November 1989 BP applies for permission to build houses on the farm. GGAT advises that nothing should be decided without an archaeological assessment. Then BP hires GGAT to do it. Their report calls the lost farmhouse 'a county treasure'.",
   [REDEV, GGAT_REV, LRT('later-dealings', 'Land Registry Titles — later dealings')],
   aliases=['ghf-19891108-1', 'ghf-19891010-1'])
sc('VII', 'ghf-19900313-1', '1990-03-13', 'February – March 1990', '"Unfortunately demolished"', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "In March 1990 outline permission is granted. The planning officer notes that the Local Plan said the farm buildings should be kept, 'however they were unfortunately demolished a little while ago'. No preservation notice was ever served. Part of the archaeologists' advice is missing from the file.",
   [REDEV, LEGAL], aliases=['ghf-19900208-1'])
sc('VII', 'ghf-19900801-1', '1990-08-01', 'August – October 1990', 'Eight trenches', 'Former farm site', '?',
   'Archaeological record',
   "In August 1990 GGAT cuts eight trenches for BP. They find early medieval burials. A large area they could not investigate is marked as low potential, and in October the council signs the archaeology off.",
   [ARCH, GGAT_REV, REDEV], aliases=['ghf-19901015-1'])
sc('VII', 'ghf-19910821-1', '1991-08-21', '21 August 1991', 'The obituary', 'Historic Environment Record', 'A',
   'Heritage record',
   "In 1991 the official heritage record writes the house's obituary. It 'was suddenly and completely demolished by B.P. Properties Ltd. on 6th December 1988 amid considerable local controversy'.",
   [HER])
sc('VII', 'ghf-19920514-1', '1992-05-14', '14 May 1992', 'Twenty houses', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   'In May 1992 Ideal Homes applies to build twenty detached houses on the farm, on land BP has not yet transferred to it.',
   [REDEV])
sc('VII', 'ghf-19920515-1', '1992-05-15', '15 May 1992', 'Billy dies', 'Llandough', 'A',
   'Family account',
   'The next day, 15 May 1992, Billy Buckler dies of a heart attack in Llandough Hospital, in the village where he was born. He is buried at Michaelston-le-Pit. He never gets his home back. His mother\'s claim passes, undecided, to his children.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   ledger={'A': "Freehold claim: Mary's heirs · never adjudicated, never extinguished"})
sc('VII', 'ghf-19920727-1', '1992-07-27', '27 July 1992', 'A warning, half missing', 'GGAT', '?',
   'Planning file',
   'In July 1992 GGAT warns the council that the ground holds significant remains, medieval and perhaps older, and human bone. Page two of the letter is missing from the file.',
   [GGAT_REV])
sc('VII', 'ghf-19920903-1', '1992-09-03', '3 September 1992', 'Approved anyway', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "Thirty-eight days later the twenty houses are approved, with no new archaeological condition.",
   [REDEV, GGAT_REV])
sc('VII', 'ghf-19931203-1', '1993-12-03', 'December 1993', 'The diggers move in', 'Former farm site', 'AB',
   'Land Registry record',
   "In December 1993 BP transfers the merged title to Ideal Homes. The synthetic Parcel A now passes to a buyer as if it were the real thing, folded inside the fields. The diggers move in before the archaeology has been dealt with. GGAT asks the council to stop the work. The developer produces a barrister's opinion that the condition is met. The council accepts it: 'a difference of opinion', it later tells the MP.",
   [LRT('later-dealings', 'Land Registry Titles — later dealings'), ARCH, REDEV, LEGAL],
   aliases=['ghf-19931213-1'],
   ledger={'M': 'WA231076 transferred by BP to Ideal Homes (December 1993); later Persimmon Homes (Wales)'})
sc('VII', 'ghf-19940504-1', '1994-03-21', 'March – July 1994', 'A thousand graves', 'Former farm site', '?',
   'Archaeological record',
   "In the spring of 1994 the excavators find what the trenches missed. Burial after burial lies just below the topsoil, in the ground the 1990 report called low potential. By the end there are more than a thousand: the largest early medieval burial ground ever found in Wales. For at least two weeks of the dig, the Home Office licence to remove the dead has run out. The work goes on.",
   [ARCH, GGAT_REV],
   aliases=['ghf-19940421-1'])
sc('VII', 'ghf-19940728-1', '1994-07-28', '28 July 1994', 'Who owns the dead', 'National Museum of Wales', '?',
   'Museum record',
   "In July 1994 Ideal Homes, as owner of the land, gives the human remains and finds to the National Museum of Wales. Finds belong to whoever owns the land. So the merged title decides, once more, who owns what came out of Parcel A. The dead of St Dochdwy's pass from a developer to the state.",
   [ARCH, LEGAL])
sc('VII', 'ghf-19941110-1', '1994-11-10', '1994 – 96', 'Church View Close', 'Woodland — WA735527', 'A',
   'Land Registry record',
   "In November 1994 the woodland above the house, part of the true Parcel A, passes to the Forest of Cardiff under a title of its own. The power lines go in. The houses go up. Church View Close is built over the farm, and new titles are carved out of the merged one, house by house.",
   [w('/woodland/', 'Woodland'), LRT('later-dealings', 'Land Registry Titles — later dealings'), REDEV],
   aliases=['ghf-19950628-1'],
   ledger={'M': 'WA231076 and the house titles carved from it (Church View Close) · woodland to the Forest of Cardiff, WA735527'})
sc('VII', 'ghf-20050101-1', '2005-01-01', '2005', 'The cemetery in print', 'Medieval Archaeology', '?',
   'Archaeological record',
   'In 2005 the cemetery is published in a learned journal: 1,026 burials. It tells the story of the dead. It does not tell the story of the family whose home stood over them, or of how that home came down.',
   [ARCH, {'type': 'Publication', 'title': 'Holbrook and Thomas, Medieval Archaeology 49 (2005)', 'url': WIKI + '/archaeology/'},
    w('/woodland/', 'Woodland')],
   aliases=['ghf-20051222-1'])
sc('VII', 'ghf-20190320-1', '2019-03-20', '20 March 2019', 'Nearly thirty years late', 'RCAHMW national archive', '?',
   'Heritage record',
   "In 2019 GGAT's 1990 report on Great House Farm is finally added to the national record, nearly thirty years after it was written, and thirty years after the house was gone.",
   [ARCH])

# ---------------------------------------------------------------- ACT VIII
sc('VIII', 'ghf-20251117-1', '2025-11-17', 'November 2025 – January 2026', 'The grandchildren', 'Royal Commission and others', '',
   'Official correspondence',
   "In November 2025 Mary's grandchildren start digging for the buried title. The community council says it cannot help. Cadw's email addresses bounce, the first of many. In January 2026 they ask the Land Registry to put back on the register the claim that was left off it in 1983.",
   [RAC], aliases=['ghf-20260123-1'],
   ledger={'A': "Freehold claim: Mary's grandchildren · application to the Land Registry, January 2026"})
sc('VIII', 'ghf-20260323-1', '2026-03-23', 'February – March 2026', '"No evidence of a mistake"', 'HM Land Registry', 'AB',
   'Official correspondence',
   "The Land Registry retrieves its old paper files. In March it replies: there is 'no evidence of a mistake in the register'. It treats the farm as one holding, exactly as the 1916 tenancy did. It does not say how the house got into BP's title.",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint'),
    {'type': 'Official correspondence', 'title': 'HMLR holding letter, 13 February 2026 (PDF)',
     'url': 'https://github.com/unclehowell/datro/blob/wayback/wayback/pdf/foi/2026-02-13_hmlr_wa231076_holding-letter.pdf'}],
   aliases=['ghf-20260213-1'])
sc('VIII', 'ghf-20260419-1', '2026-04-19', '19 April – 25 May 2026', '"Registered correctly"', 'HM Land Registry', 'AB',
   'Official correspondence',
   "The family complain. The Registry will not look behind the 1987 judgment. In May it rules that the title is 'registered correctly'. It is relying on a judgment about possession to answer a question about ownership: the same substitution the whole scheme was built on.",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   ledger={'M': "Land Registry, May 2026: 'registered correctly'"})
sc('VIII', 'ghf-20260521-1', '2026-05-21', '21 May 2026', "Cadw's two photographs", 'Cadw', 'A',
   'Official correspondence',
   "Cadw releases its two photographs from July 1988, marked 'YYY': 'marginally below the bar', it says. Everything else is gone. The file is 'quite likely' destroyed, it says; by July, 'most likely'. There is no record of anyone destroying it.",
   [RAC, CADW_CRIT, CADW_PH], image='/media/1988-cadw-barn.jpg')
sc('VIII', 'ghf-20260730-1', '2026-07-30', 'June – July 2026', 'The missing root', 'HM Land Registry', 'AB',
   'Official correspondence',
   "In June the family ask to see the Registry's original files, and ask that nothing be destroyed. Six months after their first request, the Registry lists the forty-three documents behind BP's first registration. The 1969 conveyance, the root BP's title recites, is not among them. Neither is any deed that carries the house from Bute, or from the Thomases, or from the Williamses, to anyone.",
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260602-1'])
sc('VIII', 'ghf-20260825-1', '2026-08-25', '25 August 2026', '"Not held"', 'Museum Wales', '?',
   'Official correspondence',
   "Museum Wales refuses the family's request: the information is 'not held'. In the same letter it says it has found records of other discoveries at Great House Farm, and withholds them as 'not in scope'.",
   [RAC])
sc('VIII', 'ghf-20260908-1', '2026-09-08', '8 September 2026', 'A lead to 1877', 'Glamorgan Archives', 'A',
   'Official correspondence',
   "Glamorgan Archives hold no deed for the 1877 sale. But they point to the Bute trustees' book of payments for that year, now in Cardiff. If Daniel Thomas paid Bute for the house, it will be written there: the first link of the true chain, in Bute's own hand.",
   [w('/1877-agreement/#glamorgan-2026-4097b', 'The 1877 Agreement — Glamorgan Archives reply', 'Official correspondence')])
sc('VIII', 'ghf-20260917-1', '2026-09-17', '17 – 21 September 2026', 'Complaints', 'Cadw / Stephen Doughty MP', 'A',
   'Official correspondence',
   "In September the family lodge a formal complaint against Cadw, whose own address blocks it. They write to their MP, Stephen Doughty, asking for the Parliamentary Ombudsman. They ask Heneb, the successor to GGAT, for its files. A Land Registry agent tells them the title was 'closed in 2005', which the Registry's own history contradicts.",
   [RAC, w('/restoration-campaign/', 'The Restoration Campaign'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260918-1'])
sc('VIII', 'ghf-20260923-1', '2026-09-23', '23 September 2026', 'The Lords papers', 'The National Archives', 'A',
   'Official correspondence',
   'The National Archives finds the House of Lords papers in BP Properties v Buckler, added to its catalogue only in May 2026. For thirty-eight years, searches had found nothing.',
   [RAC])
sc('VIII', 'ghf-20260925-1', '2026-09-25', '25 – 27 September 2026', 'An offer on the woodland', 'Forest of Cardiff', 'A',
   'Official correspondence',
   'The Forest of Cardiff, which holds the woodland cut from Parcel A, offers the family a route to owning it, on its own terms. They turn it down. You do not buy back what was never yours to sell.',
   [w('/woodland/', 'Woodland'), RAC])
sc('VIII', 'ghf-20260927-1', '2026-09-27', '27 – 29 September 2026', 'Keep everything', 'Heneb / HM Land Registry', 'AB',
   'Official correspondence',
   "The family take the Land Registry to its Independent Complaints Reviewer, and complain to Heneb about GGAT's part from 1982 to 1995. A preservation notice goes to eleven public bodies: keep everything.",
   [GGAT_REV, RAC])
sc('VIII', 'ghf-20260929-1', '2026-09-29', '29 September – 5 October 2026', 'On record all along', 'Cadw / RCAHMW / Museum Wales', 'A',
   'Official correspondence',
   "The Royal Commission opens its archive: the 1974 newspaper report, and an old note of the soldier in armour under the dining-room floor. Museum Wales, after two refusals, releases its file on the bones found by the church in 1858. The story was on record all along.",
   [ARCH, w('/where-things-stand/', 'Where Things Stand'),
    w('/records-access-chronology/foi-reply-register/ghf-e106-r33-amgueddfa-cymru-reply-further-collections-search-following-8-september-2026-foi/', 'Museum Wales reply (GHF-E106-R33)', 'Official correspondence')],
   aliases=['ghf-20261005-1'])
sc('VIII', 'ghf-20261006-1', '2026-10-06', 'September – October 2026', 'The question', 'Great House Farm Wiki', 'A',
   'Analysis',
   "The family put everything they have found in public: every document and every cutting, from the geese of 1891 to the bus of 1989. And they ask the one question that no court, no registry and no minister has ever answered: by what deed did the house pass from the Williamses, or from anyone, to BP? No such deed has ever been produced.",
   [LEGAL, w('/', 'Great House Farm Wiki — Main Page'), w('/evidence-library/', 'Evidence Library'),
    w('/evidence-library/press-archive-transcripts/', 'Press Archive — Newspaper Transcripts'), w('/evidence-library/press-articles-index/', 'Press Articles Index')],
   aliases=['ghf-20260922-1', 'ghf-20261003-1'])

# ---------------------------------------------------------------- EPILOGUE
sc('E', 'ghf-99990101-1', '9999-01-01', 'Today', 'How it was done', 'The two titles', 'AB',
   'Analysis',
   "So here is how it was done. Not with one forged deed, but with ten moves, each lawful on its own. Two words in 1916 made two parcels one farm. An unwritten tenancy of the fields became a handle on the house. A court order against the tenant was worded for the whole farm. Tenancies were offered to the owner, and refused. A possession order was made and left in a drawer. BP took the fields by deed and the case against the house with them. A licence was sent to a woman who never asked for one. One BP company conveyed the house to another. The state registered it, then folded it into the fields. And the courts, asked only who had the right to possession, never had to ask who owned the house. In English law, possession can be awarded without ownership ever being tried, and a title can be registered without any court deciding a rival claim to the same land. Neither step, on its own, decides the older title. Every move went through one of those two doors.",
   [w('/the-two-parcels/', 'The Two Parcels — the title test'), JUDG, LRT('first-registration', 'Land Registry Titles'), LEGAL])
sc('E', 'ghf-99990101-2', '9999-01-02', 'Today', 'Who holds it now', 'Church View Close, Llandough', 'A',
   'Analysis',
   "Today twenty houses stand on Great House Farm, on titles carved from the merged one. BP has sold up and gone. The Land Registry says the title is 'registered correctly'. A thousand of Llandough's dead lie in the stores of the National Museum. The woodland belongs to a charity. The house is gone, and so is the heritage file that might have saved it. And underneath all of it lies the true Parcel A: Vaughan, Bute, Daniel Thomas, Williams. Buried. Never decided. Never extinguished.",
   [w('/where-things-stand/', 'Where Things Stand'), LEGAL, w('/missing-records-register/', 'Missing Records Register')])
sc('E', 'ghf-99990101-3', '9999-01-02', 'Today', 'Not in the history', 'Llandough Community Council', 'A',
   'Public record',
   "The village's own history page tells of the Roman villa, the lost monastery, and the hundreds of burials dug up in 1994. It does not mention the Great House, the family who lived in it for three hundred years, or the morning it was bulldozed. There has been no public inquiry. No apology. No reparation.",
   [{'type': 'Public record', 'title': 'Llandough Community Council — About Llandough', 'url': 'https://www.llandough-cc.co.uk/About_Us_20117.aspx'},
    w('/where-things-stand/', 'Where Things Stand')])
sc('E', 'ghf-99990102-1', '9999-01-03', 'Today', 'What the family ask for', 'The family', 'A',
   'Family case',
   "The family ask for what was taken. A ruling, at last, on who owns Parcel A. The woodland and the green back, or reparation where that cannot be done. Reparation for the houses built on their land. The estate's artefacts returned. A true record of the Great House in the nation's heritage. And a public inquiry into how all of it was allowed to happen. Every body involved is being given the chance to put it right, before the family go back to court.",
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
