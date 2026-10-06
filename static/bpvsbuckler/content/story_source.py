# -*- coding: utf-8 -*-
"""Source of truth for the Great House Farm storyboard.

Edit this file, then run:   python3 content/story_source.py
It writes src/data/story.json, which the player, /story/ script page,
/api/timeline.json, /llms.txt, transcript and sitemap are all built from.

Rules (see README):
- one scene per event, in strict date order; press cuttings are evidence on
  the scene they report, never a scene of their own
- every scene carries at least one evidence link
- narration is present tense, plain English, no drafting notes
- 'case' holds the family's case for that scene, in the family's favour
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
    {'id': 'P', 'label': 'Prologue', 'title': 'An Ancient Place', 'span': 'c. 650 – 1857',
     'logline': 'A farmhouse beside one of the oldest churches in Wales, and the family who lived in it.'},
    {'id': 'I', 'label': 'Act I', 'title': 'The Bargain', 'span': '1858 – 1915',
     'logline': 'Quarrying comes to the farm, and in 1877 the land is split in two.'},
    {'id': 'II', 'label': 'Act II', 'title': 'Two Parcels', 'span': '1916 – 1948',
     'logline': 'The house and the fields go down different paths; the papers say "whole farm".'},
    {'id': 'III', 'label': 'Act III', 'title': 'The Papers Vanish', 'span': '1949 – 1968',
     'logline': "The family's deeds disappear from a blanket box, and the possession orders begin."},
    {'id': 'IV', 'label': 'Act IV', 'title': "Mary's Stand", 'span': '1969 – 1983',
     'logline': 'BP buys in. Mary opens her home to the nation and refuses to leave.'},
    {'id': 'V', 'label': 'Act V', 'title': 'The Courts', 'span': '1984 – March 1988',
     'logline': 'Possession is decided; the house parcel is never tried on its documents.'},
    {'id': 'VI', 'label': 'Act VI', 'title': 'The Siege', 'span': 'April – December 1988',
     'logline': 'A chainsaw at the door, a forced eviction, and bulldozers at 4am.'},
    {'id': 'VII', 'label': 'Act VII', 'title': 'Built Over', 'span': '1989 – 2019',
     'logline': 'Houses go up on the land, and a cemetery of a thousand graves comes out of it.'},
    {'id': 'VIII', 'label': 'Act VIII', 'title': 'The Reckoning', 'span': '2025 – today',
     'logline': "Mary's grandchildren go back to the records, and the records start to speak."},
    {'id': 'E', 'label': 'Epilogue', 'title': 'Where Things Stand', 'span': 'Now',
     'logline': 'What is proven, what is missing, and what the family ask for.'},
]

CAST = [
    {'id': 'mary', 'name': 'Mary Williams (Mrs Buckler)', 'years': '1913 – 1983',
     'role': 'Born in the farmhouse and lived there all her life. Claimed the house parcel as her own and never accepted a tenancy or licence.',
     'match': ['Mary']},
    {'id': 'john', 'name': 'John Williams', 'years': 'd. after 1949',
     'role': "Mary's father. Held the house and the fields on separate tenancies from 1908; paid his last rent on the house in 1928.",
     'match': ['John Williams']},
    {'id': 'frederick', 'name': 'Frederick Buckler', 'years': '1910/11 – 1967',
     'role': "Mary's husband. Farmed the fields; the 1955 and 1962 orders were made against him.",
     'match': ['Frederick']},
    {'id': 'billy', 'name': 'William "Billy" Buckler', 'years': 'c. 1948 – 1992',
     'role': "Mary's son, born at the farm. Inherited her claim, held the bailiffs off in April 1988, and was evicted that November.",
     'match': ['Billy', 'William Buckler', 'Bill Buckler', 'Mr Buckler', 'William (Billy)']},
    {'id': 'branwen', 'name': 'Branwen Buckler', 'years': '',
     'role': "Billy's wife. Watched the farmhouse demolished with their three young children.",
     'match': ['Branwen']},
    {'id': 'eldest', 'name': "Frederick and Mary's eldest son", 'years': 'b. c. 1937–40',
     'role': 'Left the farm in 1968–69. A family account says he sold "our land parcel" through a solicitor.',
     'match': ['eldest son']},
    {'id': 'thomas', 'name': 'Daniel and Alfred Thomas', 'years': '',
     'role': 'Quarrymen. Daniel Thomas bought the farmhouse parcel in 1877; Alfred Thomas took the last rent in 1928.',
     'match': ['Daniel Thomas', 'Alfred Thomas']},
    {'id': 'bute', 'name': 'The Bute Estate', 'years': '',
     'role': 'Landlords of the farm from the early 19th century until 1938.',
     'match': ['Bute']},
    {'id': 'wgr', 'name': 'Western Ground Rents Ltd (WGR)', 'years': '',
     'role': "Bought Bute's interest in 1938; brought the 1955 and 1962 possession actions; later part of the BP group.",
     'match': ['WGR', 'Western Ground Rents']},
    {'id': 'bp', 'name': 'BP Pension Trust / BP Properties Ltd', 'years': '',
     'role': 'Bought in 1969; registered the land, won possession in 1986–88 and demolished the house.',
     'match': ['BP']},
    {'id': 'hmlr', 'name': 'HM Land Registry', 'years': '',
     'role': "Registered BP's titles in 1982–87, merging the separate farmhouse title during the appeal.",
     'match': ['Land Registry', 'Registry']},
    {'id': 'cadw', 'name': 'Cadw', 'years': '',
     'role': 'Inspected the farmhouse for listing in July and December 1988 and declined to list it.',
     'match': ['Cadw']},
    {'id': 'ggat', 'name': 'GGAT (now Heneb)', 'years': '',
     'role': 'The regional archaeological trust; advised on and dug the site for the developers, 1982–1995.',
     'match': ['GGAT', 'Heneb']},
    {'id': 'rcahmw', 'name': 'Royal Commission (RCAHMW)', 'years': '',
     'role': 'Recorded the house in 1974 and its rubble in 1988.',
     'match': ['Royal Commission', 'RCAHMW', 'Suggett']},
    {'id': 'courts', 'name': 'The judges', 'years': '',
     'role': 'Judge Temple Morris QC (1962), Mr Justice Hollis (1986), Dillon LJ, Mustill LJ and Sir Edward Eveleigh (1987), Mr Justice Anthony Evans and Judge Norman Francis (1988).',
     'match': ['Judge', 'Justice', 'Court of Appeal', 'High Court', 'House of Lords', 'County Court']},
    {'id': 'mps', 'name': 'Members of Parliament', 'years': '',
     'role': 'Ted Rowlands (1980), Alun Michael (1988), Stephen Doughty (2026).',
     'match': ['MP', 'House of Commons']},
    {'id': 'ideal', 'name': 'Ideal Homes Wales', 'years': '',
     'role': 'Developer of the 20 houses built on the farm (Church View Close).',
     'match': ['Ideal Homes']},
]

S = []  # scenes
def sc(act, id, date, when, title, place, parcel, basis, narration, evidence, case=None, image=None, aliases=()):
    S.append({'id': id, 'act': act, 'date': date, 'when': when, 'title': title, 'place': place,
              'parcel': parcel, 'basis': basis, 'narration': narration, 'case': case,
              'evidence': evidence, 'image': image, 'aliases': list(aliases)})

# ---------------------------------------------------------------- PROLOGUE
sc('P', 'ghf-06500101-1', '0650-01-01', 'c. AD 650', 'The church beside the farm', "St Dochdwy's, Llandough", '?',
   'Family account',
   "Beside the farm stands St Dochdwy's church, thought to stand on the site of an early Christian monastery. The published reference for this is still being traced.",
   [w('/archaeology/', 'Archaeology and Heritage', 'Heritage record'), TL])
sc('P', 'ghf-12000101-1', '1200-01-01', '12th – 14th century', 'Medieval occupation', 'Great House — north-east slope', 'A',
   'Archaeological record',
   "People are living on the site in the Middle Ages: pottery of the 12th to early 14th centuries is later found on the slope just north-east of the house. The Royal Commission classes the house, Tŷ Mawr ('Great House'), as sub-medieval and probably 17th-century, possibly with a medieval core like Brynwell in neighbouring Leckwith.",
   [HER, ARCH], aliases=['ghf-12150102-1', 'ghf-12150101-1', 'ghf-11000101-1'])
sc('P', 'ghf-15520101-1', '1552-01-01', '1552 – 1829', 'Cydfin, or Tŷ Mawr', 'Llandough manorial leases', 'AB',
   'Estate papers',
   "The Llandough manorial leases later kept in the Bute estate papers run from 1552 to 1829. The catalogue lists leases of 'Cydfin Farm or Ty Mawr Farm (107 a.)' — the farm's older name.",
   [{'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records D 219: Llandough manorial leases and agreements, 1552–1829',
     'url': 'https://archives.library.wales/index.php/llandough-manorial-leases-and-agreements'},
    w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   aliases=['ghf-15430101-1', 'ghf-15390101-1', 'ghf-15360101-1', 'ghf-14440101-1'])
sc('P', 'ghf-15600101-1', '1560-01-01', 'Mid 16th – late 18th century', 'The Vaughans of Great House', 'Great House Farm', 'AB',
   'Heritage record',
   'Great House is the chief freehold farm of the parish. The Vaughans, a minor gentry family, hold it from the mid-16th century until the late 18th; their memorials survive in Llandough church and churchyard.',
   [HER])
sc('P', 'ghf-16670101-1', '1667-01-01', '1667', 'The Williamses arrive', 'Great House Farm', 'A',
   "Mary's statement",
   "By Mary Williams's account, her family's life at Great House begins in 1667. Family tradition remembers it as a purchase; later estate records treat the family as tenants. No earlier written source has yet been found.",
   [MARY, w('/williams-buckler-family/', 'The Williams / Buckler Family — origins')],
   case='The family hold, from Mary\'s statement and the 1974 Daily Telegraph report, that their ancestors acquired Tŷ Mawr in about 1667.',
   aliases=['ghf-16770101-1'])
sc('P', 'ghf-18000101-1', '1800-01-01', 'Early 19th century', 'The Bute Estate takes the freehold', 'Great House', 'AB',
   'Heritage record',
   "Early in the 19th century the Bute Estate acquires the freehold of Great House. The manorial courts for Llandough and Leckwith are held in the house, and the estate modernises it, as it does neighbouring Brynwell.",
   [HER, w('/bute-estate/', 'The Bute Estate')], aliases=['ghf-17700101-1', 'ghf-17940101-1'])
sc('P', 'ghf-18180101-2', '1818-01-01', '1818 – 1821', "Llandough enters Bute's books", 'Bute estate rentals', 'AB',
   'Estate papers',
   "From 1818 the chief rents of Llandough are taken into the Bute manorial rental, and from 1821 Llandough and Cogan appear in the Bute estate rentals.",
   [{'type': 'Estate papers', 'title': 'National Library of Wales, Bute Estate Records R1: Glamorgan Estate rentals',
     'url': 'https://archives.library.wales/index.php/glamorgan-estate-rentals'}],
   aliases=['ghf-18180101-1', 'ghf-18200101-1', 'ghf-18210101-1'])
sc('P', 'ghf-18240101-1', '1824-01-01', '1824', "Stewart's survey", 'Bute Glamorgan estate', 'AB',
   'Estate papers',
   "David Stewart surveys and values the Bute Glamorgan estate. The wiki's research records the farm under the name 'Cedfin'; the exact wording in the survey is still to be checked.",
   [w('/great-house-farm/name-variations/', 'Name & Location Variations (Stewart survey, D/d B E/1–2)')])
sc('P', 'ghf-18400101-1', '1840-01-01', 'c. 1840', 'From "Great House" to "farm"', 'Census and tithe records', 'AB',
   'Public record',
   "Census and tithe records start describing the place in different ways — 'Great House', then 'Great House Farm'. The records alone do not show the change was deliberate.",
   [w('/great-house-farm/farmhouse-nomenclature/', 'Farmhouse Nomenclature'), w('/great-house-farm/name-variations/', 'Name & Location Variations')],
   case="The family's case is that re-describing the manorial court house as a mere farmhouse wore away its standing, and theirs, and hid what the building was.",
   aliases=['ghf-18800101-1'])

# ---------------------------------------------------------------- ACT I
sc('I', 'ghf-18580101-1', '1858-01-01', 'c. 1858', 'Bones by the church', 'Church Farm, Llandough', 'x',
   'Museum record',
   "Workmen digging foundations at Llandough Church Farm find about six skeletons with a medieval iron spearhead and a rowel spur. The bones are reburied by the church stile. A 1931 letter records the finds for the National Museum, which takes in the spur and spearhead in 1963 (accession 63.24).",
   [w('/evidence-library/ghf-e106-r33-a1-1931-letter-museum-wales-file-63-24/', '1931 letter, Museum Wales file 63.24', 'Museum record'), ARCH],
   aliases=['ghf-19311122-1'])
sc('I', 'ghf-18700101-1', '1870-01-01', 'c. 1870', 'The soldier under the floor', 'Great House — dining room', 'A',
   'Family account',
   "Family tradition tells of a soldier in armour, with horse, lance and small shield, found beneath the dining-room floor. The Daily Telegraph repeats the story in 1974, and in 1988 the Royal Commission notes a report of 'armour' under the rear wing. No primary record of the find has been located, and the 1988 note dates it to c. 1880. Museum Wales says the medieval ironwork it holds came from Church Farm in 1858, not Great House.",
   [press('N03', 'Daily Telegraph, 16 April 1974 (dates the find to "about 1870")'), HER, ARCH],
   case='The family see the find as proof of the site\'s antiquity — a lead nobody followed up before the house was destroyed.',
   aliases=['ghf-18800101-2'])
sc('I', 'ghf-18760101-1', '1876-01-01', '1876 – c. 1912', 'The limeworks', 'Llandough Limeworks', 'A',
   'Estate papers',
   'The Bute Estate lets about 33 acres that had been part of Great House Farm for the Llandough Limeworks, which work the stone until about 1912.',
   [w('/llandough-limeworks/', 'Llandough Limeworks')],
   case="The family's case, from Mary's statement, is that the farm was given up for quarrying on terms that the freehold of the house parcel would pass to her grandfather once quarrying ended. That agreement is among the missing papers.")
sc('I', 'ghf-18770101-1', '1877-01-01', '1877', 'The farm is split in two', 'Bute Estate Office', 'AB',
   "Mary's statement",
   "The Bute Estate serves notice to quit, then sells the farmhouse and about 10 acres to the quarryman Daniel Thomas, keeping about 9 acres of fields. The Williamses become tenants of both. From here the farm is two parcels: the house (Parcel A) and the eastern fields (Parcel B). The deed is missing.",
   [MARY, w('/1877-agreement/#sale-1877', 'The 1877 Agreement — the sale'), w('/1877-agreement/#plan', 'The 1877 Agreement — plan'), w('/the-two-parcels/', 'The Two Parcels')],
   case='The family contend that the 1877 sale took the house parcel out of the Bute title for good, so it could never pass to WGR or BP.')
sc('I', 'ghf-18771106-1', '1877-11-06', '6 November 1877', 'The Bute lease', 'Glamorgan Archives', 'B',
   'Estate papers',
   'The Bute Estate grants John Williams a lease, held today at Glamorgan Archives. On the family\'s reconstruction it covers the fields, Parcel B. A copy is still to be obtained.',
   [w('/1877-agreement/#sale-1877', 'The 1877 Agreement — Bute lease')])
sc('I', 'ghf-18911111-1', '1891-11-11', '11 November 1891', 'Three geese', 'Llandough — court report', 'AB',
   'Newspaper',
   'Three geese are stolen from "Mr. John Williams, Great House Farm, Llandough". The court report is contemporary proof that John Williams is living at the farm.',
   [press('N01', '1891 court report — farmyard theft', 'ghf-e090-n01-1891-farmyard-theft.jpg')],
   image='/media/ghf-e090-n01-1891-farmyard-theft.jpg')
sc('I', 'ghf-18970501-1', '1897-05-01', 'May 1897', 'Marconi', 'Lavernock Point', '?',
   'Family account',
   "Marconi's wireless trials at Lavernock Point send the first signals across open sea, to Flat Holm. Family tradition holds that Thomas Williams of Great House carted Marconi and his equipment to the point. The trials are documented; the family's part is not yet proved.",
   [press('N02', 'Press report of the Lavernock trials, 1897', 'ghf-e090-n02-1897-marconi-lavernock.jpg')],
   image='/media/ghf-e090-n02-1897-marconi-lavernock.jpg')
sc('I', 'ghf-19050223-1', '1905-02-23', '23 February 1905', 'A Bute conveyance', 'HM Land Registry — WA231076 file', 'A',
   'Land Registry record',
   'A Bute conveyance of this date later turns up on the WA231076 registration file and is noted on the woodland title WA735527. On the current reading it concerns Parcel A; what it conveyed is still to be confirmed.',
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration')])
sc('I', 'ghf-19080101-1', '1908-01-01', '1908', 'John Williams takes over', 'Great House Farm', 'AB',
   "Mary's statement",
   "Mary's grandfather dies. Her father, John Williams, takes over both tenancies: the house from the Thomas side, the fields from Bute.",
   [MARY, w('/john-williams/#y1908', 'John Williams — 1908')])
sc('I', 'ghf-19100101-1', '1910-01-01', '1910 or 1911', 'Frederick Buckler is born', '', '',
   'Family account',
   'Frederick Buckler is born. The year is worked back from his death in 1967, aged 56; his certificates are awaited.',
   [w('/frederick-buckler/', 'Frederick Buckler')])
sc('I', 'ghf-19130810-1', '1913-08-10', '10 August 1913', 'Mary is born', 'Great House Farm', 'A',
   "Mary's statement",
   'Mary Williams is born in the farmhouse, the daughter of John Williams. She will live there for the rest of her life.',
   [w('/mary-williams/', 'Mary Williams'), MARY])

# ---------------------------------------------------------------- ACT II
sc('II', 'ghf-19160201-1', '1916-02-01', 'February 1916', '"The whole farm"', 'Great House Farm', 'AB',
   'Court record',
   'Bute lets "the whole farm" to John Williams on a yearly tenancy. The tenancy is known only from the 1987 judgment and the 1989 Commission decision; the document itself has not been found.',
   [w('/1916-tenancy/#grant', 'The 1916 Tenancy', 'Court record'), JUDG, w('/the-two-parcels/whole-farm-nomenclature/', 'The Farm / Whole Farm Nomenclature')],
   case='The family\'s case is that "whole farm" is a later description, and that without the original plan it cannot show the house parcel was ever in this tenancy.')
sc('II', 'ghf-19240515-1', '1924-05-15', '15 May 1924', 'An agreement on file', 'HM Land Registry — WA231076 file', '?',
   'Land Registry record',
   'An agreement of this date sits on the WA231076 registration file. Its contents and effect are unknown, and which parcel it concerns is not yet clear.',
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration')])
sc('II', 'ghf-19280101-1', '1928-01-01', '1928', 'The last rent', 'Great House Farm', 'A',
   "Mary's statement",
   'The last quarry machinery leaves. John Williams pays a final rent of about £4 to Alfred Thomas, and from then on, Mary recalls, he regards the farm as his own. She saw the receipt; it is now missing.',
   [MARY, w('/1877-agreement/#takes-effect', 'The 1877 Agreement — takes effect 1928')],
   case='The family\'s case is that the 1877 bargain took effect in 1928, making John Williams freeholder of the house parcel.')
sc('II', 'ghf-19360101-1', '1936-01-01', '1936', 'Mary marries Frederick', 'Great House Farm', 'A',
   'Family account',
   'Mary marries Frederick Buckler, who comes to live with her at the farmhouse. They will have seven children.',
   [w('/frederick-buckler/#marriage', 'Frederick Buckler — marriage')])
sc('II', 'ghf-19370101-1', '1937-01-01', 'c. 1937 – 40', 'The eldest son', 'Great House Farm', '',
   'Family account',
   "Frederick and Mary's eldest son is born. The date rests on family belief; his birth entry has still to be traced.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family')])
sc('II', 'ghf-19380101-1', '1938-01-01', '1938', 'Sold to Western Ground Rents', 'Bute Estate Office', 'B',
   'Court record',
   "Bute conveys its reversion on the 1916 tenancy to Western Ground Rents Ltd.",
   [w('/1939-revised-tenancy/#y1938', '1938–39: Sale to WGR and the Revised Tenancy'), JUDG],
   case='If the house parcel left Bute\'s hands in 1877, it cannot have been part of this sale. The family expect the 1938 conveyance, when it is produced, to show only the eastern fields being sold.')
sc('II', 'ghf-19390501-1', '1939-05-01', 'May 1939', 'The revised tenancy', 'Great House Farm', 'B',
   'Document',
   'WGR grants John Williams a revised tenancy. Its plan shows the fields east of the house.',
   [w('/1939-revised-tenancy/#y1939', '1938–39: the 1939 tenancy'), w('/1939-revised-tenancy/#plan', 'The 1939 tenancy plan')],
   case='The family have seen the 1939 tenancy: it covers the eastern fields only. The house parcel is not in it.')
sc('II', 'ghf-19400101-1', '1940-01-01', 'c. 1940', 'Twelve years', 'Great House Farm', 'A',
   'Family case',
   'Twelve years on from 1928, John Williams is still in the house. On Mary\'s account, no rent has been paid on it since.',
   [w('/1939-revised-tenancy/#c1940', '1938–39 — c. 1940')],
   case="The family's case is that twelve years' rent-free occupation of the house parcel from 1928 gave John Williams title by about 1940, if he did not already own it under the 1877 bargain.")
sc('II', 'ghf-19440101-1', '1944-01-01', '1944', 'Frederick runs the farm', 'Great House Farm', 'B',
   "Mary's statement",
   'The War Agricultural Executive Committee is unhappy with the farm, and Frederick Buckler takes over running it as manager for John Williams.',
   [MARY, w('/john-williams/#y1944', 'John Williams — 1944')])
sc('II', 'ghf-19480101-1', '1948-01-01', 'c. 1948 – 49', 'Billy is born', 'Great House Farm', 'A',
   'Family account',
   'William (Billy) Buckler is born at the farm. He will live there until the eviction of 1988.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')])

# ---------------------------------------------------------------- ACT III
sc('III', 'ghf-19490202-1', '1949-02-02', '2 February 1949', 'An unwritten tenancy', 'Great House Farm', 'B',
   'Court record',
   "John Williams surrenders his tenancy, and his son-in-law Frederick Buckler's yearly tenancy from WGR begins. It is never put in writing. Mary is not named in it.",
   [w('/frederick-buckler/#tenancy-1949', "Frederick Buckler — the 1949 tenancy", 'Court record'), JUDG, w('/the-two-parcels/', 'The Two Parcels')],
   case='The family\'s case is that this unwritten tenancy of the fields was later treated as a tenancy of "the farm", blurring the line between the two parcels.')
sc('III', 'ghf-19500601-1', '1950-06-01', 'June 1950 – c. 1952', 'The blanket box', 'Great House Farm', 'A',
   "Mary's statement",
   "A Penarth estate agent puts a lodger in the farmhouse. He stays about two years, and later tells Mary he took 'the papers which were in the blanket box including the agreement relating to the farm' and handed them to the agent.",
   [MARY, w('/1877-agreement/#papers-taken', 'The 1877 Agreement — papers taken')],
   case="The family contend that the documents proving their title were taken from their home just before the first possession proceedings — and that the missing title papers recorded around 1951 are those same papers.")
sc('III', 'ghf-19521010-1', '1952-10-10', '10 October 1952', 'The letting is dropped', "Landlords' agents", 'B',
   'Court record',
   "WGR's agents write that they will not go ahead with the letting to Frederick.",
   [w('/frederick-buckler/#tenancy-1949', 'Frederick Buckler — 1952 letter', 'Court record')])
sc('III', 'ghf-19530101-1', '1953-01-01', '1953', 'The last rent on the fields', 'Great House Farm', 'B',
   'Court record',
   'Frederick makes his last rent payment. The family say they paid nothing further to anyone.',
   [w('/frederick-buckler/#tenancy-1949', 'Frederick Buckler — tenancy', 'Court record'), TL])
sc('III', 'ghf-19550202-1', '1955-02-02', '2 February 1955', 'The first possession order', 'High Court / Great House Farm', 'AB',
   'Court record',
   'The High Court makes a possession order against Frederick Buckler alone, worded for the whole farm. Mary is not a party. On 4 July 1955 the landlord takes everything except the farmhouse and garden — Mary has just come out of hospital and objects strongly — and the family stay on in the house.',
   [w('/1955-possession-order/#order', 'The 1955 Possession Order', 'Court record'), w('/1955-possession-order/#enforcement', 'The 1955 Possession Order — enforcement', 'Court record')],
   case='The family contend the order was about the fields Frederick rented, worded as if the two parcels were one. Mary, who claimed the house, was never heard.')
sc('III', 'ghf-19590101-1', '1959-01-01', '1959', 'Mary says no', 'Great House Farm', 'A',
   'Court record',
   'WGR offers Mary a tenancy of the farmhouse and garden. She refuses: the house is hers. She tells them documents prove it — but the papers from the blanket box are gone.',
   [w('/1962-possession-order/#refusal-1959', 'The 1962 Possession Order — 1959 refusal', 'Court record'), JUDG])
sc('III', 'ghf-19610329-1', '1961-03-29', '29 March 1961', 'A deed on file', 'HM Land Registry — WA231076 file', '?',
   'Land Registry record',
   'A deed of this date sits on the WA231076 registration file. Its contents are unknown, and which parcel it concerns is not yet clear.',
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration')])
sc('III', 'ghf-19621211-1', '1962-12-11', '11 December 1962', 'The second possession order', 'Cardiff County Court', 'A',
   'Court record',
   "Judge Temple Morris QC orders possession of the farmhouse and garden, with mesne profits back to 1955, against Frederick and Mary on WGR's claim. The order is not enforced.",
   [w('/1962-possession-order/#order', 'The 1962 Possession Order', 'Court record')],
   case='The family question whether a county court could hear the case at all: its limit in 1962 was a rateable value of £100.')
sc('III', 'ghf-19630101-1', '1963-01-01', '1963', 'Three skeletons', 'Llandough — utility trench', '?',
   'Archaeological record',
   'Three skeletons are reported in a utility trench near the church. The account comes from a secondary research file; the 1963 record itself is still being traced.',
   [ARCH])
sc('III', 'ghf-19630601-1', '1963-06-01', 'June 1963', 'Committal', 'Cardiff County Court', 'A',
   'Court record',
   'The mesne profits under the 1962 order are partly enforced against Frederick, and committal proceedings follow.',
   [w('/1962-possession-order/#committal', 'The 1962 Possession Order — committal', 'Court record')])
sc('III', 'ghf-19650301-1', '1965-03-02', 'January – March 1965', 'Another tenancy refused', "WGR agents' office", 'A',
   'Document',
   "WGR will not let Frederick the fields. On 2 March its agents offer 'Mrs Williams' a weekly tenancy of the farmhouse and garden at £2 a week. It is not signed or returned, and no rent is paid.",
   [w('/1962-possession-order/#offer-1965', 'The 1965 offer'), w('/mary-williams/#chronology', 'Mary Williams — 1965 offer')],
   case="The family see it as another attempt to turn what Mary claimed as her own into a tenancy she never accepted.")
sc('III', 'ghf-19640101-1', '1965-06-01', '1964 – 67 (date uncertain)', 'A rumoured sale', 'Family account', '?',
   'Family account',
   'A cousin\'s account says the eldest son sold "our land parcel" through a solicitor, without his parents knowing. What was sold, if anything, is unknown; no document has been found.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — rumoured sale')])
sc('III', 'ghf-19670101-1', '1967-01-01', '1967', 'Frederick dies', 'Great House Farm', 'A',
   'Family account',
   'Frederick Buckler dies, aged 56. Mary takes back her maiden name, Williams, and stays on in the farmhouse. An estate paper gives December 1965; the family take 1967.',
   [w('/frederick-buckler/#death', 'Frederick Buckler — death')])
sc('III', 'ghf-19680901-1', '1968-09-01', '1968 – 69', 'The eldest son leaves', 'Great House Farm', 'A',
   'Family account',
   "The eldest son's household leaves the farm.",
   [w('/williams-buckler-family/', 'The Williams / Buckler Family')])

# ---------------------------------------------------------------- ACT IV
sc('IV', 'ghf-19691231-1', '1969-12-31', '31 December 1969', 'BP buys in', 'Great House Farm', 'AB',
   'Land Registry record',
   'WGR sells to BP Pension Trust Ltd. This conveyance is later recited as the root of BP\'s title — yet it is missing from the Land Registry files.',
   [LRT('conveyances', 'Land Registry Titles — conveyances')])
sc('IV', 'ghf-19700616-1', '1970-06-16', '16 June 1970', 'The village green', 'Leckwith Road, Llandough', 'A',
   'Public record',
   'Land by Leckwith Road is registered as village green VG41. The current reconstruction places it in Parcel A; the boundary is still to be confirmed.',
   [REDEV, TL])
sc('IV', 'ghf-19720725-1', '1972-07-25', '25 July 1972', 'Permission for houses', 'Planning office', 'AB',
   'Planning file',
   'Planning permission for housing on the site is granted — while Mary is still living in the farmhouse.',
   [REDEV])
sc('IV', 'ghf-19740101-1', '1974-01-01', '1974', 'A survey in difficult circumstances', 'Great House — interior', 'A',
   'Heritage record',
   "H.J. Thomas surveys the ground floor for the Royal Commission. The first floor and roof cannot be examined: the house 'remained partially recorded because of problems of access created by an ownership dispute'.",
   [HER, ARCH])
sc('IV', 'ghf-19740415-1', '1974-04-15', '15 April 1974', 'Open day', 'Great House Farm', 'A',
   'Newspaper',
   "Mary, now 60, opens her home to the public 'to show what the nation is losing'. Hundreds come and about a thousand sign a petition. The Daily Telegraph reports that permission for about 13 houses has gone to the BP pension trust, that Mary will refuse to move, that ownership has been disputed for some 25 years, and that her solicitors say she has a valid claim.",
   [press('N03', "Daily Telegraph, 16 April 1974, 'Open day to save ancient Welsh house'", 'ghf-e090-n03-1974-open-day-telegraph.jpg'),
    w('/1974-licence-letters/#action', 'The 1974 Licence Letters')],
   case='Mary was claiming ownership in public, with legal backing, more than ten years before the case that took her home.',
   image='/media/ghf-e090-n03-1974-open-day-telegraph.jpg')
sc('IV', 'ghf-19740703-1', '1974-07-03', '3 July 1974', 'Mary pleads ownership', 'Court', 'A',
   'Court record',
   "BP Pension Trust brings a new possession action. Mary pleads that she owns the house, and the Limitation Act 1939. The case is part-heard and never relisted.",
   [w('/1974-licence-letters/#action', 'The 1974 Licence Letters — the action', 'Court record'), JUDG],
   case="The family contend BP let the title fight lapse, withdrew the warrant and sent a licence instead — and that her claim was never extinguished.")
sc('IV', 'ghf-19740919-1', '1974-09-19', '19 September 1974', 'Leave to enforce', 'Cardiff County Court', 'A',
   'Court record',
   "The county court (Judge Watkin Powell, per the family archive) gives BP leave to enforce the 1962 order, with no warrant before 31 October. Mary was given no notice; her solicitors appeal.",
   [w('/1974-licence-letters/#warrant', 'The 1974 Licence Letters — the warrant', 'Court record')])
sc('IV', 'ghf-19741031-1', '1974-10-31', '31 October 1974', 'The licence letters', 'Great House Farm', 'A',
   'Court record',
   "BP Pension Trust writes to Mary 'licensing' her to stay at the farm rent-free for life, and the warrant is withdrawn the same day. Mary never asked for a licence and rejects the idea that BP owns her house.",
   [w('/1974-licence-letters/#letters', 'The 1974 Licence Letters', 'Court record'), JUDG],
   case='These one-sided letters, never accepted, became the foundation of the case that took her home.',
   aliases=['ghf-19741031-2'])
sc('IV', 'ghf-19741119-1', '1974-11-19', '19 November, 1970s (year unclear)', '"Grievous loss"', 'Western Mail — letters', 'A',
   'Newspaper',
   "William Rees writes to the Western Mail that demolishing Great House Farm would erase the site of St Dochdwy's Celtic monastery, tracing its descent from Tewkesbury Abbey to the Crown, to Herbert and to Bute. The cutting is dated '19/11/7?'; the year is unclear.",
   [press('N04', "Western Mail, 'Grievous loss' (letter)", 'ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg'),
    w('/restoration-campaign/#open-day-1974', 'The Restoration Campaign')])
sc('IV', 'ghf-19750523-1', '1975-05-23', '23 May 1975', 'BP Properties', 'Great House Farm', 'AB',
   'Land Registry record',
   'BP Pension Trust transfers its interest to BP Properties Ltd.',
   [LRT('conveyances', 'Land Registry Titles — conveyances')],
   case='Mary maintains that no transfer between BP companies can defeat the ownership she pleaded in 1974.')
sc('IV', 'ghf-19780101-1', '1978-01-01', '1978 – 79', 'The Roman villa (a separate site)', 'Llandough Roman villa', 'x',
   'Archaeological record',
   'GGAT excavates the Llandough Roman villa, south of the church. It is a separate site, not Great House Farm; the Neath Guardian reports the dig in April 1980.',
   [ARCH, press('N05', 'Neath Guardian, 17 April 1980', 'ghf-e090-n05-1980-neath-guardian.jpg')],
   aliases=['ghf-press-19800417-n05'])
sc('IV', 'ghf-19800522-1', '1980-05-22', '22 May 1980', '"The most rapacious ground landlord"', 'House of Commons', '',
   'Parliament',
   "Ted Rowlands MP tells the Commons that Western Ground Rents, 'the most rapacious ground landlord' in South Wales, has been bought by the BP pension fund. The landlord that sued Frederick in 1955 is now inside the BP group.",
   [press('N16', 'Hansard, 22 May 1980', 'ghf-e090-n16-1980-hansard-rowlands.jpg')],
   image='/media/ghf-e090-n16-1980-hansard-rowlands.jpg')
sc('IV', 'ghf-19821001-1', '1982-10-01', '1 October 1982', 'GGAT asks for a dig', 'GGAT', 'AB',
   'Planning file',
   "GGAT tells the planners that occupation may continue north of the church, and asks for 'thorough investigative work prior to the development'.",
   [ARCH, GGAT_REV])
sc('IV', 'ghf-19821119-1', '1982-11-19', '19 – 30 November 1982', 'First registration', 'HM Land Registry — WA231076', 'AB',
   'Land Registry record',
   'BP Pension Trust transfers to BP Properties Ltd, and on 30 November Linklaters & Paines apply to register the land for the first time, as title WA231076. Mary is alive and living in the farmhouse throughout.',
   [LRT('first-registration', 'Land Registry Titles — first registration'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1982-83-registration-opportunity-to-object/', '1982–83 Registration & Opportunity to Object', 'Analysis')],
   case='The family contend that nobody asked Mary, the woman living in the house, what she claimed.')
sc('IV', 'ghf-19830223-1', '1983-02-23', '23 February 1983', 'The farmhouse title', 'HM Land Registry — WA240304', 'A',
   'Land Registry record',
   "BP's solicitors apply to register the farmhouse and garden as a separate title, WA240304, certifying they know of no question or doubt affecting the title. Mary is living in the farmhouse.",
   [LRT('first-registration', 'Land Registry Titles — first registration'), LEGAL],
   case="The family's case is that this registration took in the house parcel without disclosing Mary's claim to own it.")
sc('IV', 'ghf-19830313-1', '1983-03-13', '13 March 1983', 'Fire at the warehouse (a separate site)', 'GGAT warehouse, Swansea', 'x',
   'Newspaper',
   'A fire at GGAT\'s Swansea warehouse destroys the finds from the Llandough Roman villa — the separate site south of the church.',
   [press('N06', "South Wales Echo, 18 March 1983 — burnt relics", 'ghf-e090-n06-1983-echo-burnt-relics.jpg')])
sc('IV', 'ghf-19830326-1', '1983-03-26', '26 March 1983', 'Mary dies', 'Great House Farm', 'A',
   'Family account',
   'Mary Williams dies in the farmhouse where she was born, weeks after the registration was applied for. Her son Billy inherits her claim.',
   [w('/mary-williams/#death', 'Mary Williams — death'), w('/williams-buckler-family/', 'The Williams / Buckler Family — William')],
   case='Whether Mary was ever told of the registration is being pursued with HM Land Registry.')
sc('IV', 'ghf-19830408-1', '1983-04-08', '8 – 12 April 1983', 'Letters after her death', 'HM Land Registry — WA240304', 'A',
   'Land Registry record',
   "Two weeks after Mary's death, Linklaters and the Land Registry exchange letters on the farmhouse file, including form D23; more letters follow on 12 May. What the Registry asked about the family's occupation, and what it was told, is in those letters. The family are ordering them.",
   [LRT('first-registration', 'Land Registry Titles — first registration')])

# ---------------------------------------------------------------- ACT V
sc('V', 'ghf-19840113-1', '1984-01-13', '13 January 1984', 'A new edition of the register', 'HM Land Registry — WA231076', 'AB',
   'Land Registry record',
   'An application on form A3 is made on the main title and a new edition of the register issued — four months before BP sues.',
   [LRT('first-registration')])
sc('V', 'ghf-19840522-1', '1984-05-22', '22 May 1984', "BP's writ", 'BP Properties', 'A',
   'Court record',
   'BP Properties issues its writ for possession, relying on the 1974 licence letters. The same year, the family say, the library copy of the Bute–Thomas deed is reported missing from Cardiff Library.',
   [w('/bp-properties-v-buckler/#writ', 'BP Properties Ltd v Buckler — the writ', 'Court record'), w('/1877-agreement/#library-1984', 'The 1877 Agreement — library copy missing')],
   case='The licence Mary rejected became the whole of BP\'s case. A public copy of the deed that could answer it went missing the same year.')
sc('V', 'ghf-19860710-1', '1986-07-10', '10 July 1986', 'Judgment for BP', 'High Court, Cardiff', 'A',
   'Court record',
   "Mr Justice Hollis finds for BP: the 1974 letters gave Mary a licence, so her possession was not adverse. He suspends the possession order for six months.",
   [w('/bp-properties-v-buckler/#high-court', 'BP Properties Ltd v Buckler — High Court', 'Court record'),
    w('/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/', 'BP v Buckler: Scope, Decided & Undecided', 'Analysis')],
   case="In the family's account, ownership of the house parcel was never tried: the documents behind it were never examined, and the defence ran on adverse possession — a defence that began with the fields in 1955 and was stretched to cover her house.")
sc('V', 'ghf-19860711-1', '1986-07-11', '1986 – 87', 'A file goes missing', 'Royal Commission (RCAHMW)', 'A',
   'Official correspondence',
   "During the trial and appeal, the Royal Commission's correspondence between C.N. Johns and Mrs Buckler goes missing. It may have recorded Mary's own account of her title, given to an independent public body.",
   [w('/scrutiny-and-accountability/legal-review-fraud-land-human-rights/#loss-pattern', 'Legal Review — the loss pattern', 'Analysis')])
sc('V', 'ghf-19870202-1', '1987-02-02', '2 February 1987', 'Two titles become one', 'HM Land Registry', 'AB',
   'Land Registry record',
   'With the appeal still pending, an application is made to amalgamate BP\'s two titles — the main title and the separate farmhouse title — into one.',
   [LRT('first-registration', 'Land Registry Titles — amalgamation'),
    w('/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/', '1987 HMLR Amalgamation During Appeal', 'Analysis')],
   case='The family ask why the separate record of the house parcel was being folded away in the middle of the appeal. They are pursuing it with HM Land Registry.')
sc('V', 'ghf-19870731-1', '1987-07-31', '31 July 1987', 'The Court of Appeal', 'Court of Appeal, London', 'A',
   'Court record',
   "Dillon LJ, Mustill LJ and Sir Edward Eveleigh dismiss the appeal in BP Properties Ltd v Buckler. They hold that the 1962 action stopped time running, and that BP's 1974 letters made Mary's possession permissive whether she accepted them or not. The title documents she spoke of were not produced.",
   [JUDG, w('/bp-properties-v-buckler/#omits', 'BP Properties Ltd v Buckler — what it omits', 'Analysis')],
   case="The family contend the court decided possession of the whole farm without the documents on the house parcel before it — the 1877 agreement, the 1938 conveyance, the 1939 tenancy plan — and without the 1974 press report of Mary claiming ownership or the evidence that she rejected the licence.")
sc('V', 'ghf-19880303-1', '1988-03-03', '3 March 1988', 'The last appeal', 'House of Lords', 'A',
   'Court record',
   'The House of Lords refuses leave to appeal. The family are given 28 days to find somewhere else to live.',
   [w('/bp-properties-v-buckler/#house-of-lords', 'BP Properties Ltd v Buckler — House of Lords', 'Court record')])

# ---------------------------------------------------------------- ACT VI
sc('VI', 'ghf-19880429-1', '1988-04-29', '29 April 1988, morning', 'The bailiffs come', 'Great House Farm', 'A',
   'Newspaper',
   'Five bailiffs and about fifteen police arrive. Billy blocks the narrow drive with a tractor, locks the doors and bars the windows.',
   [press('N07', "'Chainsaw farmer vows to fight on', c. 30 April 1988", 'ghf-e090-n07-1988-police-wait-photo.jpg'),
    echo('01', '29 April 1988')],
   image='/media/ghf-e090-n07-1988-police-wait-photo.jpg',
   aliases=['ghf-press-n15-01'])
sc('VI', 'ghf-19880429-2', '1988-04-29', '29 April 1988', 'The chainsaw', 'Great House Farm', 'A',
   'Newspaper',
   "The bailiffs smash the gate lock and break at the doors with poleaxes. When an axe comes through a door with his children behind it, Billy starts a chainsaw and pushes it through, and the bailiffs fall back. After a four-hour stand-off they withdraw. Branwen leaves with the children, aged two, three and four. The next day Billy will not leave the farm even for medical attention, in case they come back.",
   [press('N07', "'Chainsaw farmer vows to fight on'", 'ghf-e090-n07-1988-chainsaw-farmer.jpg'), echo('02', '30 April 1988')],
   case="BP told the press Mary had been allowed to stay rent-free because of ill health. Billy told them the family owned the farm.",
   image='/media/ghf-e090-n07-1988-chainsaw-farmer.jpg',
   aliases=['ghf-press-n07', 'ghf-press-n15-02'])
sc('VI', 'ghf-19880503-1', '1988-05-03', '3 May 1988', 'To Strasbourg', 'European Commission of Human Rights', 'A',
   'Court record',
   'Billy applies to the European Commission of Human Rights.',
   [w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record')])
sc('VI', 'ghf-19880512-1', '1988-05-12', '12 May 1988', 'The MP writes', "Alun Michael MP's office", 'A',
   'Newspaper',
   "Cardiff MP Alun Michael asks the Lord Chancellor to look at the case of the farmer who fought off bailiffs with a chainsaw. Billy warns that someone will be killed.",
   [echo('03', '12 May 1988')], aliases=['ghf-press-n15-03'])
sc('VI', 'ghf-19880729-1', '1988-07-29', '29 July 1988', 'Cadw comes to look', 'Great House Farm', 'A',
   'Photograph',
   "Cadw inspects and photographs the farmhouse and barn while considering them for listing. These two photographs are all that survive of its visit: no file, no notes, no record of who decided. In 2026 Cadw gives three different explanations of the code it marked them with.",
   [CADW_PH, CADW_BARN, CADW_CRIT],
   image='/media/1988-cadw-farmhouse.jpg')
sc('VI', 'ghf-19881130-1', '1988-11-30', '29 – 30 November 1988', 'Forced entry', 'Great House Farm', 'A',
   'Newspaper',
   "BP obtains possession and the bailiffs force their way in. Within hours, the family say, demolition begins: half the roof is already off an outbuilding. Billy is taken to Llandough Hospital. Eight other people living at the farm are made homeless with the family.",
   [press('N14', "South Wales Echo front page — 'Angry scenes as farmer evicted'", 'ghf-e090-n14-1988-echo-front-page.jpg'),
    echo('04', '30 November 1988'),
    press('N09', "South Wales Echo, 3 December 1988 — 'Billy's unhappy family'", 'ghf-e090-n09-1988-billys-unhappy-family.jpg')],
   image='/media/ghf-e090-n14-1988-echo-front-page.jpg',
   aliases=['ghf-press-n14', 'ghf-press-n15-04', 'ghf-press-n09'])
sc('VI', 'ghf-19881201-1', '1988-12-01', '1 December 1988', 'Everything in the road', 'Llandough Hospital', 'A',
   'Newspaper',
   "Billy lies injured in Llandough Hospital. Branwen and the three children have nowhere to go. Mary's lifetime of possessions — photographs, heirlooms, legal papers — is left in the house or scattered in the road. Billy later says he has only the clothes he stood up in.",
   [press('N08', 'South Wales Echo, 3 December 1988'), echo('11', '13 December 1988')],
   aliases=['ghf-press-n15-11'])
sc('VI', 'ghf-19881202-1', '1988-12-02', '2 December 1988', 'An injunction', 'High Court', 'A',
   'Newspaper',
   "A High Court judge orders that the farmhouse and its contents must not be touched. Mr Justice Anthony Evans lets Branwen go in to collect belongings if BP's solicitors agree. BP says it plans to demolish and build new homes on the 10-acre site.",
   [press('N08', "South Wales Echo, 3 December 1988 — 'History fight to save farm'", 'ghf-e090-n08-1988-history-fight.jpg'), echo('05', '2 December 1988')],
   image='/media/ghf-e090-n08-1988-history-fight.jpg',
   aliases=['ghf-press-n15-05', 'ghf-press-n08'])
sc('VI', 'ghf-19881209-1', '1988-12-03', '3 December 1988', 'From hospital bed to the dock', 'Llandough Hospital / magistrates', 'A',
   'Newspaper',
   'Police take Billy from his hospital bed to be charged with assaulting two bailiffs, criminal damage, and wanton or furious driving. A charge is not a conviction.',
   [echo('06', '3 December 1988'), press('N15', 'South Wales Echo, 3 December 1988')],
   aliases=['ghf-19881130-2', 'ghf-press-n15-06', 'ghf-press-n15-10'])
sc('VI', 'ghf-19881203-1', '1988-12-03', '3 – 5 December 1988', '48 hours to decide', 'Cadw', 'A',
   'Official correspondence',
   "Over one weekend, with no access to the inside, Cadw assesses the house for emergency 'spot-listing'. In public it says it is considering listing; in July it had already coded the house just below the bar.",
   [CADW_CRIT, press('N08', "South Wales Echo, 3 December 1988 — Cadw considering spot-listing")])
sc('VI', 'ghf-19881205-1', '1988-12-05', 'Monday 5 December 1988', 'The final hearing', 'Cardiff', 'A',
   'Newspaper',
   "Judge Norman Francis refuses to keep the injunction in place until the European Commission can hear the family. Their solicitor, Colin Jongman, says there is nothing more they can do. The same day Cadw says the house is not of sufficient architectural merit to list.",
   [press('N10', "Western Mail, 6 December 1988 — 'Farmer fails in final eviction hearing'", 'ghf-e090-n10-1988-western-mail-final-hearing.jpg')],
   image='/media/ghf-e090-n10-1988-western-mail-final-hearing.jpg',
   aliases=['ghf-press-n10'])
sc('VI', 'ghf-19881206-1', '1988-12-06', '6 December 1988, 4am', 'Bulldozed before breakfast', 'Great House Farm', 'A',
   'Newspaper',
   "Just after 4am a twenty-strong team with bulldozers moves in. By breakfast no building is left standing. Branwen and the three children watch their home flattened. The house the Royal Commission never finished recording is gone.",
   [press('N11', "'Tears flow as 800 year-old farm house is razed at last'", 'ghf-e090-n11-1988-tears-flow-razed.jpg'),
    echo('07', '6 December 1988'), echo('12', '21 December 1988 (reader\'s letter on "Bulldozed Before Breakfast")'), HER],
   case='The house was destroyed the morning after the listing refusal, before its fabric could be recorded or the European Commission could hear the family.',
   image='/media/ghf-e090-n11-1988-tears-flow-razed.jpg',
   aliases=['ghf-press-n11', 'ghf-press-n15-07', 'ghf-press-n15-12', 'ghf-19881211-1'])
sc('VI', 'ghf-19881208-1', '1988-12-07', '7 – 9 December 1988', 'Anger in the village, and bail', 'Llandough', 'A',
   'Newspaper',
   "A Vale of Glamorgan councillor, himself a BP pensioner, calls the demolition 'disgusting'. On 8 December villagers meet their councillors in anger, and a bid is launched to stop BP profiting from it. The family recall the council's planning chief saying the cleared site looked like a battleground. On 9 December magistrates bail Billy on condition he stays away from the site.",
   [echo('08', '7 December 1988'), echo('09', '9 December 1988'), echo('10', '10 December 1988'), w('/demolition-1988/', '1988: Possession and Demolition')],
   aliases=['ghf-press-n15-08', 'ghf-press-n15-09'])
sc('VI', 'ghf-19881212-1', '1988-12-12', 'December 1988', 'Sifting the rubble', 'Great House Farm — rubble', 'A',
   'Heritage record',
   "R.F. Suggett of the Royal Commission examines the rubble. He finds a fireplace jamb and an ogee-stopped beam with torus, a form uncommon in Glamorgan, and records the loss of a carved stone capital that stood by the front door, probably from the old church.",
   [HER, ARCH])

# ---------------------------------------------------------------- ACT VII
sc('VII', 'ghf-19890115-1', '1989-01-15', 'January 1989', 'A charge dropped', 'Court', 'A',
   'Newspaper',
   "Billy's bail conditions are changed, and the prosecution drops, as out of time, a summons for threatening behaviour on 29 April 1988. The November charges remain, and he is ordered not to go within half a mile of the site.",
   [press('N12', "'Charge against evicted farmer dropped', January 1989", 'ghf-e090-n12-1989-charge-dropped.jpg'), echo('13', '6 January 1989')],
   image='/media/ghf-e090-n12-1989-charge-dropped.jpg',
   aliases=['ghf-press-n15-13'])
sc('VII', 'ghf-19890320-1', '1989-03-20', '20 March 1989', 'Clearing the site', 'Great House Farm', 'A',
   'Newspaper',
   'At 7.30am lorries move onto the site to clear what is left. The work takes several days.',
   [echo('14', '20 March 1989')], aliases=['ghf-press-n15-14'])
sc('VII', 'ghf-19890323-1', '1989-03-23', '23 March 1989', '"I will fight on"', 'Court', 'A',
   'Newspaper',
   'Billy pleads guilty to the remaining charges and is freed. He vows to fight on over the loss of his home and, he says, more than 70 acres of land.',
   [echo('15', '23 March 1989'), echo('16', '24 March 1989')],
   aliases=['ghf-press-n15-15', 'ghf-press-n15-16'])
sc('VII', 'ghf-19890325-1', '1989-03-25', '1989', 'From farm to a bus', 'Penarth', 'A',
   'Newspaper',
   "The family live with Billy's sister in Penarth. Billy plans to turn an old bus into a home, and says about £30,000 of his possessions were taken from the site after the demolition.",
   [press('N13', "South Wales Echo, 1989 — 'From farm to a bus'", 'ghf-e090-n13-1989-farm-to-bus.jpg')],
   image='/media/ghf-e090-n13-1989-farm-to-bus.jpg')
sc('VII', 'ghf-19890414-1', '1989-04-14', '14 April 1989', 'Strasbourg says no', 'European Commission of Human Rights', 'A',
   'Court record',
   "The European Commission accepts that the possession order interfered with Billy's home, but finds it lawful and justified, and declares Buckler v United Kingdom inadmissible.",
   [w('/bp-properties-v-buckler/#echr', 'BP Properties Ltd v Buckler — ECHR', 'Court record'),
    {'type': 'Court record', 'title': 'Buckler v United Kingdom, Commission decision (PDF)', 'url': WIKI + '/wp-content/uploads/2026/09/wp-1790112811838.pdf'}])
sc('VII', 'ghf-19891010-1', '1989-10-10', '10 October 1989', 'Oakview sold', 'HM Land Registry — WA513690', '?',
   'Land Registry record',
   'BP sells Oakview, title WA513690. How this land relates to the two parcels is unclear.',
   [LRT('later-dealings', 'Land Registry Titles — later dealings')])
sc('VII', 'ghf-19891107-1', '1989-11-07', 'October – November 1989', 'BP applies to build', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   'BP lodges outline application 89/01396/OUT for housing (received 8 November). GGAT advises that it should not be decided without an archaeological assessment, prices the work at £2,000, and discloses talks with BP\'s agents — then BP commissions GGAT to do it. The same report calls the farmhouse a "county treasure".',
   [REDEV, GGAT_REV], aliases=['ghf-19891108-1'])
sc('VII', 'ghf-19900208-1', '1990-02-08', '8 February 1990', 'Missing comments', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   'GGAT sends further comments on the application (Appendix B). They are missing from the planning file.',
   [REDEV])
sc('VII', 'ghf-19900313-1', '1990-03-13', '13 March 1990', '"Unfortunately demolished"', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "Outline permission is granted with 18 conditions. The officer's report notes that the Local Plan said the farm buildings should be kept, but 'they were unfortunately demolished a little while ago'. No building preservation notice had ever been served.",
   [REDEV, LEGAL])
sc('VII', 'ghf-19900801-1', '1990-08-01', 'August 1990', 'Eight trenches', 'Former farm site', '?',
   'Archaeological record',
   "GGAT digs eight machine trenches for BP. Early-medieval burials are found. The eastern area 'could not be investigated', yet is marked as low potential.",
   [ARCH, GGAT_REV])
sc('VII', 'ghf-19901015-1', '1990-10-15', '15 October 1990', 'Condition 17 signed off', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "The council records the archaeological evaluation condition as met, on the strength of GGAT's eight trenches.",
   [REDEV])
sc('VII', 'ghf-19910821-1', '1991-08-21', '21 August 1991', 'The official record', 'Historic Environment Record', 'A',
   'Heritage record',
   "The regional Historic Environment Record writes up Great House Farm. It records that the house and farm buildings 'were suddenly and completely demolished by B.P. Properties Ltd. on 6th December 1988 amid considerable local controversy'.",
   [HER])
sc('VII', 'ghf-19920514-1', '1992-05-14', '14 May 1992', 'Twenty houses', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   'Ideal Homes Wales applies for approval of 20 detached houses on the farm (92/00671/RES) — more than a year before BP transfers the land to it.',
   [REDEV])
sc('VII', 'ghf-19920515-1', '1992-05-15', '15 May 1992', 'Billy dies', 'Llandough', 'A',
   'Family account',
   'Billy Buckler dies of a heart attack in Llandough Hospital. After a funeral at Bethesda Chapel, Dinas Powys, he is buried at Michaelston-le-Pit. He was born in the farmhouse and defended it to the end.',
   [w('/williams-buckler-family/', 'The Williams / Buckler Family — William')])
sc('VII', 'ghf-19920727-1', '1992-07-27', '27 July 1992', 'A warning, half missing', 'GGAT', '?',
   'Planning file',
   'GGAT warns the council that the 1990 assessment showed significant deposits — medieval, possibly earlier, and human bone — and urges mitigation. Page 2 of the letter is missing from the file.',
   [GGAT_REV])
sc('VII', 'ghf-19920903-1', '1992-09-03', '3 September 1992', 'Approved anyway', 'Vale of Glamorgan planning', 'AB',
   'Planning file',
   "Thirty-eight days after GGAT's warning, the 20 houses are approved with no new archaeological condition. GGAT then records no action on the site for 466 days.",
   [REDEV, GGAT_REV])
sc('VII', 'ghf-19931203-1', '1993-12-03', '3 December 1993', 'Groundworks begin', 'Former farm site', 'AB',
   'Land Registry record',
   'BP transfers the site to Ideal Homes, and groundworks start before the archaeological condition has been met.',
   [LRT('later-dealings', 'Land Registry Titles — later dealings'), ARCH])
sc('VII', 'ghf-19931213-1', '1993-12-13', '13 December 1993', '"A difference of opinion"', 'GGAT / Vale of Glamorgan', 'AB',
   'Planning file',
   "With work already under way, GGAT urges a breach-of-condition notice, saying the archaeological condition (recorded as condition 18) has not been met. The developer relies on counsel's opinion that the condition is discharged; the council accepts it, later telling the MP it was 'a difference of opinion'.",
   [REDEV, LEGAL])
sc('VII', 'ghf-19940504-1', '1994-03-21', 'March – July 1994', 'A thousand graves', 'Former farm site', '?',
   'Archaeological record',
   "Under a Home Office licence and an agreement for 'preservation by record', the Cotswold Archaeological Trust excavates an early-medieval cemetery on the farm — many burials just below the topsoil, in the zone the 1990 evaluation called low potential. Published totals reach 1,026 burials, then the largest early-medieval burial population recovered in Wales. Between 21 April and at least 3 May the licence has lapsed while work continues; on 28 April GGAT's officer orders 'no further work', under an authority still unidentified. Removing remains without a licence was an offence under the Burial Act 1857.",
   [ARCH, GGAT_REV],
   case='The site went under 20 houses, and the evidence with it.',
   aliases=['ghf-19940421-1'])
sc('VII', 'ghf-19940728-1', '1994-07-28', '28 July 1994', 'Who owns the dead', 'National Museum of Wales', '?',
   'Museum record',
   "Ideal Homes Wales, as landowner, gives the human remains and finds from 'Great House Farm, Llandough' to the National Museum (accession 95.56H). Ownership of finds follows ownership of the land.",
   [ARCH, LEGAL])
sc('VII', 'ghf-19941110-1', '1994-11-10', '10 November 1994', 'The woodland', 'Woodland — WA735527', 'A',
   'Land Registry record',
   'The woodland, title WA735527, passes to the Forest of Cardiff. The wiki places it in Parcel A.',
   [w('/woodland/', 'Woodland'), LRT('later-dealings', 'Land Registry Titles — later dealings')])
sc('VII', 'ghf-19950628-1', '1995-06-28', '28 June 1995 – 1996', 'The last dealing', 'HM Land Registry — WA231076 file', 'AB',
   'Land Registry record',
   'Rights are granted to South Wales Electricity, and there is correspondence with Persimmon — the last dealing on the registration file.',
   [LRT('later-dealings', 'Land Registry Titles — later dealings')])
sc('VII', 'ghf-20050101-1', '2005-01-01', '2005', 'The cemetery in print', 'Medieval Archaeology', '?',
   'Archaeological record',
   'The excavation is published in Medieval Archaeology: 1,026 burials, 814 of them articulated. It tells the story of the cemetery, not of the family whose home stood beside it.',
   [ARCH, {'type': 'Publication', 'title': 'Holbrook and Thomas, Medieval Archaeology 49 (2005)', 'url': WIKI + '/archaeology/'}])
sc('VII', 'ghf-20051222-1', '2005-12-22', '22 December 2005', 'The woodland divided', 'Woodland — WA735527', 'A',
   'Land Registry record',
   'Part of the woodland title is divided off.',
   [w('/woodland/', 'Woodland')])
sc('VII', 'ghf-20190320-1', '2019-03-20', '20 March 2019', 'Twenty-eight years late', 'RCAHMW national archive', '?',
   'Heritage record',
   "GGAT's 1990 assessment is finally added to the national record, about 28 years after it was written.",
   [ARCH])

# ---------------------------------------------------------------- ACT VIII
sc('VIII', 'ghf-20251117-1', '2025-11-17', 'November 2025', 'Back to the records', 'Royal Commission and others', '',
   'Official correspondence',
   "Mary's grandchildren begin a records campaign. The Royal Commission says it cannot advise on a legal case but holds archives on the site; Llandough Community Council says it cannot help; the Vale of Glamorgan passes the request to its information team.",
   [RAC])
sc('VIII', 'ghf-20260123-1', '2026-01-23', '23 – 29 January 2026', 'Bounced', 'Cadw / HM Land Registry', '',
   'Official correspondence',
   "The family's request to Cadw bounces: both its published addresses return 'address not found', the first of at least eight failures this year. On 29 January the family apply to HM Land Registry to record the interest left out at first registration.",
   [RAC])
sc('VIII', 'ghf-20260213-1', '2026-02-13', '13 February 2026', 'Retrieving the files', 'HM Land Registry', 'AB',
   'Official correspondence',
   'HM Land Registry sends a holding reply: it is retrieving the historic paper files.',
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint'),
    {'type': 'Official correspondence', 'title': 'HMLR holding letter, 13 February 2026 (PDF)',
     'url': 'https://github.com/unclehowell/datro/blob/wayback/wayback/pdf/foi/2026-02-13_hmlr_wa231076_holding-letter.pdf'}])
sc('VIII', 'ghf-20260323-1', '2026-03-23', '23 March 2026', '"No evidence of a mistake"', 'HM Land Registry', 'AB',
   'Official correspondence',
   "The Land Registry sets out the registration history of Tŷ Mawr Farm and says there is 'no evidence of a mistake in the register'. It treats the farm as one holding and does not explain how the house parcel entered BP's title.",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')])
sc('VIII', 'ghf-20260419-1', '2026-04-19', '19 April – 25 May 2026', 'Complaint refused, twice', 'HM Land Registry', 'AB',
   'Official correspondence',
   "The stage-one complaint of fraud and maladministration is refused: the Registry will not look behind the 1987 judgment. On 25 May the stage-two decision says the title is 'registered correctly'.",
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   case='Both decisions rest on a judgment about possession, not on any deed to the farmhouse.')
sc('VIII', 'ghf-20260521-1', '2026-05-21', '21 May 2026', "Cadw's two photographs", 'Cadw', 'A',
   'Official correspondence',
   "Cadw releases its two photographs of 29 July 1988, coded 'YYY' — 'marginally below the bar', it says. It has no other record and says the paper file is 'quite likely' destroyed. In July its review says 'most likely' destroyed, though there is no record of destruction.",
   [RAC, CADW_CRIT, CADW_PH], image='/media/1988-cadw-barn.jpg')
sc('VIII', 'ghf-20260602-1', '2026-06-02', '2 – 3 June 2026', 'Asking to see the originals', 'HM Land Registry', 'AB',
   'Official correspondence',
   'The family ask to inspect the original Land Registry files and ask that nothing be destroyed while the matter is open. For months there is no real answer, and several Registry addresses bounce.',
   [LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')])
sc('VIII', 'ghf-20260730-1', '2026-07-30', '30 July 2026', 'The missing root', 'HM Land Registry', 'AB',
   'Official correspondence',
   "Six months after the first request, the Registry releases a schedule of the 43 documents on the first-registration files. The 31 December 1969 conveyance — recited as BP's root of title — is not among them, nor is the 1971 abstract.",
   [LRT('deeds-before-registration', 'Land Registry Titles — deeds before registration')])
sc('VIII', 'ghf-20260825-1', '2026-08-25', '25 August 2026', '"Not held"', 'Museum Wales', '?',
   'Official correspondence',
   "Museum Wales refuses the family's request as 'not held', while saying in the same letter that it has found records of other discoveries at Great House Farm and Church Farm — which it withholds as 'not in scope'.",
   [RAC])
sc('VIII', 'ghf-20260908-1', '2026-09-08', '8 September 2026', 'A lead to 1877', 'Glamorgan Archives', 'A',
   'Official correspondence',
   "Glamorgan Archives hold no deeds for the 1877 Daniel Thomas sale, but point to Bute X.6(12), the Bute trustees' 1877 book of payments and receipts, now at Cardiff Library. A capital payment from Daniel Thomas in that book would prove the sale.",
   [w('/1877-agreement/#glamorgan-2026-4097b', 'The 1877 Agreement — Glamorgan Archives reply', 'Official correspondence')])
sc('VIII', 'ghf-20260917-1', '2026-09-17', '17 – 21 September 2026', 'Complaints to Cadw and the MP', 'Cadw / Stephen Doughty MP', 'A',
   'Official correspondence',
   "The family serve a formal complaint on Cadw over its 1988 listing decision and its lost file; Cadw's own address blocks it, so it is re-served on the Chief Inspector on 20 September. On 18 and 19 September they write to their MP, Stephen Doughty, with a view to a referral to the Parliamentary Ombudsman. On 20 September they ask Heneb for its records on the site. On 21 September a Land Registry agent tells them the title was 'closed in 2005' — contradicting the Registry's own history.",
   [RAC, w('/restoration-campaign/', 'The Restoration Campaign'), LRT('hmlr-2026', 'Land Registry Titles — 2026 complaint')],
   aliases=['ghf-20260918-1'])
sc('VIII', 'ghf-20260922-1', '2026-09-22', '22 September 2026', 'The wiki goes live', 'Great House Farm Wiki', '',
   'Wiki',
   'The family launch the Great House Farm Wiki, a public archive where every document is shown first, labelled by type, then explained. Nothing is kept secret.',
   [w('/', 'Great House Farm Wiki — Main Page'), w('/evidence-library/', 'Evidence Library')])
sc('VIII', 'ghf-20260923-1', '2026-09-23', '23 September 2026', 'The Lords papers', 'The National Archives', 'A',
   'Official correspondence',
   'The National Archives identifies the House of Lords papers in BP Properties Ltd v Buckler (YHL/PO/JO/10/11/2536), only added to its catalogue in May 2026. Earlier searches had found nothing.',
   [RAC])
sc('VIII', 'ghf-20260925-1', '2026-09-25', '25 – 27 September 2026', 'An offer on the woodland', 'Forest of Cardiff', 'A',
   'Official correspondence',
   'The Forest of Cardiff, which holds the woodland title, offers the family a route to ownership. On 27 September the family decline the terms. No price is recorded for the charity\'s 1994 acquisition.',
   [w('/woodland/', 'Woodland'), RAC])
sc('VIII', 'ghf-20260927-1', '2026-09-27', '27 – 29 September 2026', 'Heneb and the Reviewer', 'Heneb / HM Land Registry', 'AB',
   'Official correspondence',
   "The family complain to Heneb about GGAT's role from 1982 to 1995, and take the Land Registry to the Independent Complaints Reviewer. On 28 September a preservation notice goes to eleven public bodies. Heneb appoints an investigator; the Reviewer opens case ICR/090/26.",
   [GGAT_REV, RAC])
sc('VIII', 'ghf-20260929-1', '2026-09-29', '29 September 2026', 'The armour on record', 'Cadw / RCAHMW', 'A',
   'Official correspondence',
   "Cadw's complaint investigation begins. The same day the Royal Commission answers four requests together: its archive holds the 1974 newspaper report and an older note of the soldier in armour under the dining-room floor — so the story was on record long before the demolition.",
   [ARCH, w('/where-things-stand/', 'Where Things Stand')])
sc('VIII', 'ghf-20261003-1', '2026-10-03', '3 October 2026', 'The cuttings', 'Great House Farm Wiki', '',
   'Wiki',
   'Fifteen newspaper cuttings from the family archive are transcribed onto the wiki, from the 1891 court report to the coverage of 1989.',
   [w('/evidence-library/press-archive-transcripts/', 'Press Archive — Newspaper Transcripts'), w('/evidence-library/press-articles-index/', 'Press Articles Index')])
sc('VIII', 'ghf-20261005-1', '2026-10-05', '5 October 2026', 'The museum releases its file', 'Museum Wales', 'x',
   'Museum record',
   'After three requests and two refusals, Museum Wales releases the Church Farm file: the 1931 letter and the records of the medieval spur and spearhead found beside the church in 1858.',
   [w('/records-access-chronology/foi-reply-register/ghf-e106-r33-amgueddfa-cymru-reply-further-collections-search-following-8-september-2026-foi/', 'Museum Wales reply (GHF-E106-R33)', 'Official correspondence')])
sc('VIII', 'ghf-20261006-1', '2026-10-06', '6 October 2026', 'The legal review', 'Great House Farm Wiki', 'A',
   'Analysis',
   "The family publish a review of the whole record from three angles: fraud, land and human rights. Its central finding: no record yet surfaced shows how the house parcel ever entered BP's title.",
   [LEGAL])

# ---------------------------------------------------------------- EPILOGUE
sc('E', 'ghf-99990101-1', '9999-01-01', 'Today', 'What is proven, what is missing', 'Where things stand', 'A',
   'Analysis',
   "The family's case is that the courts decided possession and never tried the house parcel on its documents — the 1877 agreement, the 1928 change, the 1938 conveyance, the 1939 tenancy plan. Those papers, BP's 1969 root of title, Cadw's file and GGAT's missing pages are still being sought. HM Land Registry, Cadw, Heneb/GGAT and the Vale of Glamorgan Council are under complaint or review, and the Independent Complaints Reviewer's deadline falls about 25 November 2026.",
   [w('/where-things-stand/', 'Where Things Stand'), LEGAL, w('/missing-records-register/', 'Missing Records Register')])
sc('E', 'ghf-99990102-1', '9999-01-02', 'Today', 'What the family ask for', 'The family', 'A',
   'Family case',
   "A ruling that they own the house parcel. The woodland and the green back, or reparations where that can't be done. Reparations for the houses built on family land. The return of the estate's artefacts. A true heritage record. Every body involved is being given the chance to put things right before the family go back to court.",
   [w('/family-reparations-remedy-roadmap/', 'Family Reparations & Remedy Roadmap'), w('/where-things-stand/', 'Where Things Stand')],
   case="The family's case is that fraud and deliberate concealment kept the title documents from the courts — so the judgment can be challenged under Takhar v Gracefield, with limitation postponed under section 32 of the Limitation Act 1980.",
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
    out = {'title': 'Tŷ Mawr — The Great House Farm Story', 'acts': ACTS, 'cast': CAST, 'aliases': aliases, 'scenes': S}
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, 'src/data/story.json'), 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f'{len(S)} scenes in {len(ACTS)} acts; {len(aliases)} old ids redirected')

if __name__ == '__main__':
    main()
