#!/usr/bin/env python3
"""oldbill.bucklerfamily.estate — the Tŷ Mawr ticket desk and double-entry cost ledger.
Builds site/public/{index.html, data/tickets.json, data/ledger.json} from the TICKETS and LEDGER tables below.
Usage: python3 build.py        (then: TAB_TASK_ID=... python3 publish.py "message — Sion's Tab agent")
To extend: append a ticket dict to TICKETS or a cost dict to COSTS, every one with a Legal Wiki source URL; rerun.
Schema: README.md. Gate: build fails on banned words or withheld names in public text."""
import json, re, pathlib, datetime, html
HERE = pathlib.Path(__file__).resolve().parent
PUB = (HERE / 'site' / 'public') if (HERE / 'site').exists() else (HERE.parent / 'public')  # work/oldbill or repo tools/
WIKI = 'https://greathousefarmwiki.wordpress.com'

# ---------- RUBRIC (fixed, published on the page) ----------
BANDS = [
  # key, name, lo, hi, colour, example
  ('paper',   'Paperwork slip',                     1,       99,      '#9ad1ff', 'a missing file, a deal never put in writing'),
  ('silence', 'Missed deadline or silence',         100,     999,     '#ffe066', 'a statutory reply that never came'),
  ('fair',    'Procedural unfairness',              1000,    9999,    '#ffb347', 'no notice, no chance to object, records gone'),
  ('over',    'Exceeding authority / summary offence', 10000, 49999,  '#ff8fab', 'force at the door; the original ticket sits here'),
  ('court',   'Court error, order against the family, or loss of property', 50000, 199999, '#c3a6ff', 'an order on a disputed record; land taken'),
  ('harm',    'Harm to a person',                   200000,  499999,  '#ff6b6b', 'an injury in the course of removal'),
  ('home',    'Loss of a home and land',            500000,  1000000, '#7CFFB2', 'a family home bulldozed'),
]
MULTS = {
  'child':   (2, 'a child or a pregnant person present or harmed'),
  'pending': (2, 'done while a court or Strasbourg process was still running'),
}
DESKS = {
  'paper': 'Paperwork Desk', 'silence': 'Deadline Desk', 'fair': 'Fair Play Desk', 'over': 'Overreach Desk',
  'court': 'Court Desk', 'orders': 'Orders Desk', 'property': 'Property Desk', 'harm': 'Harm Desk', 'home': 'Home Desk',
}
DESK_BAND = {'paper':'paper','silence':'silence','fair':'fair','over':'over','court':'court','orders':'court','property':'court','harm':'harm','home':'home'}

def src(title, url): return {'title': title, 'url': url}

# ---------- THE ORIGINAL TICKET (calibration anchor) ----------
ANCHOR = {
  'id': 'T-000', 'team': 'williams', 'date': '1988-12-03', 'date_label': '3 Dec 1988 – 23 Mar 1989',
  'desk': 'over', 'issued_to': 'William Buckler (Team Williams)',
  'what': 'Charged with assaulting two bailiffs, criminal damage and wanton or furious driving after the November 1988 eviction.',
  'detail': 'Taken from his bed at Llandough Hospital on 3 Dec 1988 to face the charges and bailed on 9 Dec. A separate threatening-behaviour summons for the 29 Apr 1988 stand-off was withdrawn in January 1989 as out of time. He pleaded guilty to the remaining charges and was freed on 23–24 Mar 1989.',
  'fine': 'No record found yet. The press records the guilty plea and his release, not a fine, fee or costs figure. The magistrates\u2019 court file has not been traced (Ministry of Justice FOIA 260805002: no information held).',
  'base': 20000, 'mult': [], 'reversible': False,
  'sources': [src('1988: Possession and Demolition', WIKI + '/demolition-1988/'),
              src('Press: \u201cCharge against evicted farmer dropped\u201d (N12, Jan 1989)', WIKI + '/evidence-library/ghf-e090-n12-charge-against-evicted-farmer-dropped-1989/'),
              src('Press: South Wales Echo, 24 Mar 1989, \u201cfarmer freed\u201d (N15-16)', WIKI + '/evidence-library/ghf-e090-n15-south-wales-echo-search-extracts/ghf-e090-n15-16-1989-03-24/')],
  'calibration': 'Three summary charges, admitted, dealt with by magistrates: 20,000 points, the middle of the Exceeding authority / summary offence band. Every other ticket is scored against this one.',
}
CANCELLED = {
  'id': 'T-000b', 'team': 'williams', 'date': '1989-01-15', 'date_label': 'Jan 1989', 'desk': 'over',
  'issued_to': 'William Buckler (Team Williams)', 'what': 'Threatening-behaviour summons for the 29 Apr 1988 stand-off: withdrawn, out of time.',
  'detail': 'The Crown Prosecution Service withdrew the summons at Barry magistrates\u2019 court because it was out of time. Ticket cancelled: 0 points.',
  'base': 0, 'mult': [], 'reversible': False, 'cancelled': True,
  'sources': [src('Press: \u201cCharge against evicted farmer dropped\u201d (N12)', WIKI + '/evidence-library/ghf-e090-n12-charge-against-evicted-farmer-dropped-1989/')],
}

# ---------- TICKETS TO TEAM WILLIAMS (orders made against the family) ----------
# reversible: the order rests on the title question; if the case reopens and title is restored it is quashed and its points are re-issued to reissue_to.
ORDERS = [
  dict(id='W-01', date='1955-02-02', date_label='2 Feb 1955', desk='orders', issued_to='Frederick Buckler (Team Williams)', reissue_to='Western Ground Rents Ltd',
       what='High Court possession order (Order 14) for \u201cthe whole of the farm\u201d.',
       detail='Western Ground Rents sued Frederick alone and obtained summary judgment for possession of the whole farm. Enforced on 4 Jul 1955: every part except the farmhouse and garden was taken.',
       base=100000, mult=[], reversible=True, sources=[src('The 1955 Possession Order', WIKI + '/1955-possession-order/')]),
  dict(id='W-02', date='1962-12-11', date_label='11 Dec 1962', desk='orders', issued_to='Frederick and Mary (Team Williams)', reissue_to='Western Ground Rents Ltd',
       what='Cardiff County Court possession order for the farmhouse, buildings and garden. Not enforced.',
       detail='The order covered the occupied house group inside Parcel A. It was not enforced; in 1974 leave to enforce it was granted and the warrant then withdrawn.',
       base=50000, mult=[], reversible=True, sources=[src('The 1962 Possession Order', WIKI + '/1962-possession-order/')]),
  dict(id='W-03', date='1986-07-24', date_label='24 Jul 1986', desk='orders', issued_to='William Buckler (Team Williams)', reissue_to='BP Properties Ltd',
       what='High Court judgment for BP Properties Ltd: possession of Great House Farm, suspended six months.',
       detail='Writ served 22 May 1984; hearing 10 Jul 1986; judgment 24 Jul 1986 for BP, possession suspended for six months.',
       base=150000, mult=[], reversible=True, sources=[src('GHF-E140 — High Court hearing and judgment, 1986', WIKI + '/evidence-library/ghf-e140-10-july-1986-high-court-trial-and-judgment/')]),
  dict(id='W-04', date='1987-07-31', date_label='31 Jul 1987', desk='orders', issued_to='William Buckler (Team Williams)', reissue_to='BP Properties Ltd',
       what='Court of Appeal dismisses the appeal: BP Properties Ltd v Buckler [1987] EWCA Civ 2.',
       detail='The appeal on possession, limitation and the 1974 letters was dismissed. The order for possession stood.',
       base=150000, mult=[], reversible=True, sources=[src('EV-0080 — Court of Appeal judgment', WIKI + '/evidence/ev-0080-bp-properties-v-buckler-judgment/')]),
  dict(id='W-05', date='1988-03-03', date_label='3 Mar 1988', desk='orders', issued_to='William Buckler (Team Williams)', reissue_to='BP Properties Ltd',
       what='House of Lords refuses leave to appeal.',
       detail='With leave refused, the 1987 judgment became final and BP moved to evict on 29 Apr 1988.',
       base=50000, mult=[], reversible=True, sources=[src('GHF-E142 — House of Lords petition for leave, papers', WIKI + '/evidence-library/ghf-e142-1987-house-of-lords-petition-for-leave-papers/')]),
  dict(id='W-06', date='1989-04-14', date_label='14 Apr 1989', desk='orders', issued_to='William Buckler (Team Williams)', reissue_to='The United Kingdom (respondent State)',
       what='European Commission of Human Rights declares application 14464/88 inadmissible.',
       detail='The Commission accepted that the possession order interfered with his home but held it lawful and justified. Four months after the house was gone.',
       base=50000, mult=[], reversible=True, sources=[src('EV-0122 — ECHR application 14464/88', WIKI + '/evidence/ev-0122-echr-application-14464-88-inadmissibility/')]),
]

# ---------- TICKETS TO TEAM REGIME ----------
R = [
  dict(date='1949-02-02', date_label='2 Feb 1949', desk='paper', issued_to='Western Ground Rents Ltd',
       what='Frederick\u2019s tenancy was never put in writing, though a written agreement was intended.',
       detail='The 1987 Court of Appeal judgment records: \u201cIt was intended that Mr Frederick Buckler should have a written tenancy agreement, but this did not happen.\u201d',
       base=50, sources=[src('EV-0025 — Frederick Buckler\u2019s unwritten tenancy, 1949', WIKI + '/evidence/ev-0025-frederick-buckler-unwritten-tenancy-1949/')]),
  dict(date='1955-02-02', date_label='2 Feb 1955', desk='court', issued_to='The High Court (1955 order)',
       what='Order for \u201cthe whole of the farm\u201d made against Frederick alone; Mary, living in the Parcel A farmhouse, was not a party.',
       detail='Procedural point: a summary Order 14 judgment against one tenant was worded to cover the whole farm, including land occupied by a person who was never joined or heard.',
       base=60000, sources=[src('The 1955 Possession Order', WIKI + '/1955-possession-order/')]),
  dict(date='1955-07-04', date_label='4 Jul 1955', desk='property', issued_to='Western Ground Rents Ltd',
       what='Enforcing the 1955 order, it took the Parcel A woodland north of the house and the south-east ground (later village green VG41) along with Parcel B.',
       detail='The family\u2019s established case: the \u201cwhole farm\u201d wording blurred the 1877/1928 division between Parcel A and Parcel B, and Parcel A land went with the Parcel B taking.',
       base=100000, sources=[src('The 1955 Possession Order', WIKI + '/1955-possession-order/')]),
  dict(date='1969-12-31', date_label='31 Dec 1969', desk='fair', issued_to='BP Pension Trust Ltd (1969 purchase)',
       what='The 1969 deed from Western Ground Rents is missing from the Land Registry files.',
       detail='The deed is not on the first-registration schedule. The missing 1969 root deed and the 1971 abstract are a gap in the chain of title.',
       base=2000, sources=[src('BP Properties Ltd and BP Pension Trust — Forensic Assessment', WIKI + '/scrutiny-and-accountability/government-public-authority-involvement/bp-properties-bp-pension-trust-forensic-institutional-review/')]),
  dict(date='1974-07-03', date_label='3 Jul 1974', desk='court', issued_to='Cardiff County Court (1974 action)',
       what='Mary pleaded ownership under the Limitation Act 1939; the case was part-heard and never relisted, so her plea was never decided.',
       detail='Procedural point: a defence of ownership was pleaded and left undecided. Nineteen weeks later the licence letters went out instead of the plea being tried.',
       base=50000, sources=[src('GHF-E135 — Mary\u2019s plea of ownership and the pleadings, 1974', WIKI + '/evidence-library/ghf-e135-3-july-1974-mary-williams-plea-of-ownership-and-pleadings/')]),
  dict(date='1974-10-31', date_label='31 Oct 1974', desk='fair', issued_to='BP Pension Trust Ltd and BP Properties Ltd',
       what='Warrant withdrawn and \u201clicence\u201d letters sent the same day, while Mary\u2019s ownership plea was undecided.',
       detail='BP Properties then held only a contract to buy (its conveyance is dated 23 May 1975). The Court of Appeal later held the letters made her possession permissive although she never accepted them.',
       base=5000, mult=['pending'], sources=[src('GHF-E136 — 31 October 1974 licence letters', WIKI + '/evidence-library/ghf-e136-31-october-1974-licence-letters-bp-pension-trust-and-bp-properties/')]),
  dict(date='1983-02-23', date_label='30 Nov 1982 – 23 Feb 1983', desk='fair', issued_to='HM Land Registry (1982–83 first registration)',
       what='BP\u2019s first registrations went through while the family lived in the farmhouse; notice reached the family only after Mary died on 26 Mar 1983.',
       detail='Applications WA231076 (received 30 Nov 1982, Linklaters & Paines for BP Properties) and WA240304 (23 Feb 1983). The procedural question: what notice was served, on whom, and what chance there was to object.',
       base=5000, sources=[src('1982–83 Registration & Opportunity to Object', WIKI + '/scrutiny-and-accountability/procedural-fairness-notice/1982-83-registration-opportunity-to-object/')]),
  dict(date='1987-02-02', date_label='2 Feb 1987', desk='fair', issued_to='HM Land Registry',
       what='The two titles were amalgamated on an application of 2 Feb 1987, while the appeal was still running.',
       detail='Open questions on the record: what was amalgamated, on which plans, and whether the court or the parties were told while the appeal was pending.',
       base=2000, mult=['pending'], sources=[src('1987 HMLR Amalgamation During Appeal', WIKI + '/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/')]),
  dict(date='1987-07-31', date_label='31 Jul 1987', desk='court', issued_to='The Court of Appeal (1987)',
       what='Held that 1974 licence letters Mary never accepted made her possession permissive and stopped her limitation clock.',
       detail='Procedural point, citing the judgment: \u201cIt may be that the result would have been different if Mrs Buckler had, as soon as she learned of the letters, plainly told BP Properties Ltd that she did not accept the letters \u2026 she did not, however, do that.\u201d Mary had died in 1983 and could not give evidence on it.',
       base=150000, sources=[src('EV-0080 — BP Properties Ltd v Buckler [1987] EWCA Civ 2', WIKI + '/evidence/ev-0080-bp-properties-v-buckler-judgment/')]),
  dict(date='1988-04-29', date_label='29 Apr 1988', desk='over', issued_to='BP\u2019s bailiffs (29 Apr 1988)',
       what='Smashed the gate lock and broke the doors with poleaxes; an axe came through a door with children behind it.',
       detail='Five bailiffs and about 15 police; a four-hour stand-off before the bailiffs backed off. The children were aged two, three and four.',
       base=20000, mult=['child'], sources=[src('Press: \u201cChainsaw farmer vows to fight on\u201d (N07, c. 30 Apr 1988)', WIKI + '/evidence-library/ghf-e090-n07-chainsaw-farmer-vows-to-fight-on/')]),
  dict(date='1988-11-30', date_label='30 Nov 1988', desk='harm', issued_to='BP\u2019s bailiffs (Nov 1988)',
       what='Forced entry at Great House Farm; the householder was injured and taken to Llandough Hospital.',
       detail='\u201cAngry scenes as farmer evicted\u201d (South Wales Echo front page). The bailiffs had already taken half the roof off one of the outbuildings.',
       base=200000, sources=[src('1988: Possession and Demolition', WIKI + '/demolition-1988/'), src('Press: \u201cAngry scenes as farmer evicted\u201d (N14)', WIKI + '/evidence-library/press-archive-transcripts/n14-1988-angry-scenes-as-farmer-evicted/')]),
  dict(date='1988-12-01', date_label='Late 1988, days before the demolition', desk='harm', issued_to='The 1988 removal team (BP\u2019s enforcement)',
       what='A pregnant family member was dragged by her arms, kicked and put over the farm gate by the removal team; her shoulder was dislocated.',
       detail='The family\u2019s own testimony of the 1988 removal: she went to the house to get medicine. Catalogued on the Legal Wiki as GHF-E114.',
       base=200000, mult=['child'], sources=[src('Legal Wiki — Testimony (catalogue GHF-E114)', WIKI + '/testimony/')]),
  dict(date='1988-11-30', date_label='30 Nov – 3 Dec 1988', desk='property', issued_to='BP Properties Ltd',
       what='Demolition began within hours of the bailiffs forcing entry.',
       detail='The South Wales Echo of 3 Dec 1988 reported demolition starting within hours, and a High Court interim injunction that the farmhouse and its contents must not be touched.',
       base=100000, mult=['pending'], sources=[src('Press: \u201cHistory fight to save farm\u201d (N08, 3 Dec 1988)', WIKI + '/evidence-library/ghf-e090-n08-history-fight-to-save-farm-1988/')]),
  dict(date='1988-12-03', date_label='3 Dec 1988', desk='fair', issued_to='South Wales Police (1988)',
       what='The householder was taken from his hospital bed to be charged.',
       detail='The South Wales Echo reported William taken from his bed at Llandough Hospital to face charges of assaulting two bailiffs (see the original ticket).',
       base=3000, sources=[src('1988: Possession and Demolition', WIKI + '/demolition-1988/'), src('Press extracts, South Wales Echo 1988–89 (N15)', WIKI + '/evidence-library/ghf-e090-n15-south-wales-echo-search-extracts/')]),
  dict(date='1988-12-05', date_label='5 Dec 1988', desk='court', issued_to='Cardiff court (5 Dec 1988 hearing)',
       what='Refused an injunction to keep the house standing until Strasbourg had considered the case. The bulldozers came at 4am the next day.',
       detail='Procedural point: the European Commission of Human Rights application (made 3 May 1988) was still pending; refusing interim protection made the application\u2019s outcome academic for the house.',
       base=60000, mult=['pending'], sources=[src('1988: Possession and Demolition', WIKI + '/demolition-1988/')]),
  dict(date='1988-12-05', date_label='29 Jul – 5 Dec 1988', desk='fair', issued_to='Cadw',
       what='Inspected the farmhouse for listing on 29 Jul 1988 and declined to list on 5 Dec, the day before the demolition.',
       detail='In 2026 Cadw produced only two inspection photographs; the 1988 assessment record has not been produced.',
       base=5000, mult=['pending'], sources=[src('GHF-E144 — 1988 Cadw inspection and the 5 December listing decision', WIKI + '/evidence-library/ghf-e144-1988-cadw-inspection-photographs-and-5-december-listing-decision/')]),
  dict(date='1988-12-06', date_label='6 Dec 1988', desk='home', issued_to='BP Properties Ltd',
       what='Farmhouse demolished: a twenty-strong team with bulldozers moved in just after 4am; by breakfast no building was left standing.',
       detail='The family watched. Their application to the European Commission of Human Rights was still pending. \u201cBulldozed Before Breakfast\u201d (South Wales Echo).',
       base=500000, mult=['pending'], sources=[src('Press: \u201cTears flow as 800 year-old farm house is razed at last\u201d (N11)', WIKI + '/evidence-library/ghf-e090-n11-tears-flow-as-farm-house-razed-1988/'), src('1988: Possession and Demolition', WIKI + '/demolition-1988/')]),
  dict(date='1990-03-13', date_label='13 Mar 1990', desk='fair', issued_to='Vale of Glamorgan Council (planning, 1990)',
       what='Outline permission granted for housing; the officer\u2019s report recorded that the buildings the Local Plan said should be retained had been demolished.',
       detail='Outline application 89/01396/OUT, granted with 18 conditions. Appendices B–E of the officer\u2019s report are missing from the file.',
       base=5000, sources=[src('Redevelopment and Church View Close', WIKI + '/redevelopment/'), src('GHF-E146 — 1989 officer\u2019s report (appendices B–E missing)', WIKI + '/evidence-library/ghf-e146-1989-planning-officers-report-89-01396-out-and-1990-outline-permission/')]),
  dict(date='1993-12-15', date_label='Dec 1993', desk='over', issued_to='Ideal Homes (Wales) Ltd',
       what='Groundworks began before the archaeological condition was met.',
       detail='The 1994 excavation that followed lifted an early-medieval cemetery; 814 articulated burials were published in 2005.',
       base=20000, sources=[src('Archaeology and Heritage', WIKI + '/archaeology/'), src('Master Timeline', WIKI + '/timeline/')]),
  dict(date='2026-05-25', date_label='19 Apr & 25 May 2026', desk='fair', issued_to='HM Land Registry (2026 complaint)',
       what='Complaint refused at both stages: \u201cno evidence of a mistake in the register\u201d.',
       detail='On 10 Oct 2026 HMLR then opened its own application to \u201cinvestigate and correct any error that may have been made\u201d on WA231076.',
       base=2000, sources=[src('EV-0153 — HMLR stage-two complaint decision', WIKI + '/evidence/ev-0153-hmlr-stage-two-complaint-decision/')]),
  dict(date='2026-07-30', date_label='30 Jul 2026', desk='paper', issued_to='HM Land Registry',
       what='Copies of the 43 first-registration file items offered only by post, on form OC2, at \u00a311 each, paid by cheque.',
       detail='30 items on WA231076 and 13 on WA240304.',
       base=20, sources=[src('HM Land Registry — Email Correspondence Catalogue', WIKI + '/records-access-chronology/foi-reply-register/hm-land-registry-email-correspondence-catalogue/')]),
  dict(date='2026-07-16', date_label='16 Jul 2026', desk='fair', issued_to='South Wales Police',
       what='FOI 719/26 on the 1988 police and bailiff involvement: \u201chold no information\u201d.',
       detail='A search result, not proof that no operational record ever existed. Internal review 1188/26 is due 26 Oct 2026.',
       base=1000, sources=[src('EV-0159 — South Wales Police FOI 719/26', WIKI + '/evidence/ev-0159-south-wales-police-foi-719-26/')]),
  dict(date='2026-08-12', date_label='12 Aug 2026', desk='fair', issued_to='Ministry of Justice',
       what='FOIA 260805002: no information held on the January 1989 Barry magistrates\u2019 court hearing.',
       detail='The hearing at which the threatening-behaviour summons was withdrawn as out of time.',
       base=1000, sources=[src('FOI & Public-Authority Reply Register', WIKI + '/records-access-chronology/foi-reply-register/')]),
  dict(date='2026-10-19', date_label='19 Oct 2026', desk='fair', issued_to='Welsh Government',
       what='ATISN 26-0010: no files found; routine records \u201cwould have been destroyed in line with the corporate retention schedule\u201d.',
       detail='Searches for the farm name, Western Ground Rents Ltd and BP Properties Ltd found nothing.',
       base=3000, sources=[src('EV-0244 — Welsh Government ATISN 26-0010', WIKI + '/evidence/ev-0244-welsh-government-atisn-26-0010-disclosure-response-19-oct-2026/')]),
  dict(date='2026-10-19', date_label='19 Oct 2026', desk='fair', issued_to='Cadw',
       what='ATISN 27589 (the July–December 1988 listing papers) refused under FOIA s.14(2) as a repeat of ATISN 27021.',
       detail='The refusal letter names the ICO as the next step.',
       base=1000, sources=[src('EV-0245 — Cadw ATISN 27589 response', WIKI + '/evidence/ev-0245-cadw-atisn-27589-response-s14-2-19-oct-2026/')]),
  dict(date='2026-10-18', date_label='14 Jun – 18 Oct 2026', desk='silence', issued_to='Llandough Community Council',
       what='The family\u2019s follow-up of 14 Jun 2026 went unanswered for 126 days.',
       detail='Sent the same day the council pointed to its 1982 minutes at Glamorgan Archives (s.21 FOIA).',
       base=300, sources=[src('Llandough Community Council — Email Correspondence Catalogue', WIKI + '/records-access-chronology/foi-reply-register/llandough-community-council-email-correspondence-catalogue/'), src('Master Timeline', WIKI + '/timeline/')]),
  dict(date='2026-10-11', date_label='11 Oct 2026', desk='fair', issued_to='Llandough Community Council',
       what='The 21 Sep 2026 request refused under s.12 (cost limit).',
       detail='Other matters were to be \u201cconsidered at the October meeting\u201d, no date given.',
       base=1000, sources=[src('Llandough Community Council — Email Correspondence Catalogue', WIKI + '/records-access-chronology/foi-reply-register/llandough-community-council-email-correspondence-catalogue/')]),
  dict(date='2026-10-16', date_label='16 Oct 2026', desk='fair', issued_to='Llandough Community Council',
       what='The 22 Oct meeting, advertised as \u201cin person or remotely\u201d, moved to remote only.',
       detail='The family objected the same day.',
       base=1000, sources=[src('Llandough Community Council — Email Correspondence Catalogue', WIKI + '/records-access-chronology/foi-reply-register/llandough-community-council-email-correspondence-catalogue/')]),
  dict(date='2026-10-20', date_label='17 Sep – 19 Oct 2026', desk='silence', issued_to='Vale of Glamorgan Council',
       what='Request 00211463 (the missing planning appendices C, D, E and Policy H.2) unanswered past its 19 Oct 2026 deadline.',
       detail='Acknowledged 17 Sep, clarified 21 Sep; no reply, no refusal and no extension notice by the EIR 20-working-day limit.',
       base=300, sources=[src('Vale of Glamorgan Council — Email Correspondence Catalogue', WIKI + '/records-access-chronology/foi-reply-register/vale-of-glamorgan-council-email-correspondence-catalogue/')]),
]

# ---------- LEDGER: costs borne ----------
S5298 = src('Damages, Losses & Costs Quantification (page 5298)', WIKI + '/project-management/damages/')
S5475 = src('Reparations Schedule & Proposed Apportionment (page 5475)', WIKI + '/project-management/damages/reparations-schedule/')
COSTS = [
  dict(id='L-01', date='1988-12-06', head='The farmhouse, demolished 6 Dec 1988', account='Farmhouse', amount=539042.00, estimate=True,
       basis='Vale of Glamorgan detached-house average, Jul 2026 (UK HPI), line 1d of page 5298.', sources=[S5298, src('1988: Possession and Demolition', WIKI + '/demolition-1988/')], status='contingent'),
  dict(id='L-02', date='1955-07-04', head='The land: Parcel A, about 10 acres (woodland, the green, the house plot)', account='Land-Parcel-A', amount=2269958.00, estimate=True,
       basis='Head 1 central £2,809,000 (development-land value of the site plus the undeveloped remainder) less the farmhouse line above, so nothing is counted twice.', sources=[S5298], status='contingent'),
  dict(id='L-03', date='1988-12-06', head='Loss of use and earnings: letting value, Dec 1988 – Oct 2026', account='Loss-of-use', amount=340300.00, estimate=True,
       basis='Line 2b central: Vale rent (ONS, Aug 2026) back-cast with the Wales HPI. Farm and business income are not yet quantified on the record.', sources=[S5298], status='contingent'),
  dict(id='L-04', date='2026-10-01', head='Interest on the loss of use', account='Interest', amount=156100.00, estimate=True,
       basis='Line 4c central: Senior Courts Act 1981 s.35A at Bank Rate +1%.', sources=[S5298], status='contingent'),
  dict(id='L-05', date='1988-12-06', head='Distress: five people (William, his partner and three children)', account='Distress', amount=125800.00, estimate=True,
       basis='Line 5a central: Vento middle-band midpoint (£25,150) × 5, used as an analogy.', sources=[S5298], status='contingent'),
  dict(id='L-06', date='1988-12-06', head='Contents lost with the demolition: papers, photographs, belongings', account='Contents', amount=30000.00, estimate=True,
       basis='William\u2019s own figure in 1989, about £30,000 (South Wales Echo, \u201cFrom farm to a bus\u201d), not indexed.', sources=[src('Press: \u201cFrom farm to a bus\u201d (N13, 1989)', WIKI + '/evidence-library/ghf-e090-n13-from-farm-to-a-bus-1989/'), src('1988: Possession and Demolition', WIKI + '/demolition-1988/')], status='contingent'),
  dict(id='L-07', date='2026-10-01', head='Family time as litigant in person', account='Litigant-time', amount=13000.00, estimate=True,
       basis='Head 8 central (CPR 46.5; PD 46 para 3.4). Hours to be confirmed.', sources=[S5298], status='contingent'),
  dict(id='L-08', date='2026-10-20', head='Project costs paid by the family (cash, to 20 Oct 2026)', account='Project-cash', amount=211.93, estimate=False,
       basis='The Counting House cash ledger (accounts.bucklerfamily.estate), receipts on file.', sources=[src('The Counting House — public accounts', 'https://accounts.bucklerfamily.estate/')], status='contingent'),
  # orders with no £ on the record: carried at £0 so the line is visible; status stays with the family until a figure is found
  dict(id='L-09', date='1955-02-02', head='Costs of the 1955 High Court order', account='Costs-1955', amount=0, estimate=False, nil=True,
       basis='£ not on the record yet: the order (EV-0032) has not been located.', sources=[src('The 1955 Possession Order', WIKI + '/1955-possession-order/')], status='borne'),
  dict(id='L-10', date='1962-12-11', head='Costs of the 1962 Cardiff County Court order', account='Costs-1962', amount=0, estimate=False, nil=True,
       basis='£ not on the record yet.', sources=[src('The 1962 Possession Order', WIKI + '/1962-possession-order/')], status='borne'),
  dict(id='L-11', date='1974-07-03', head='Costs of the 1974 county-court action', account='Costs-1974', amount=0, estimate=False, nil=True,
       basis='£ not on the record yet: the action was part-heard and never relisted.', sources=[src('GHF-E135 — 1974 pleadings', WIKI + '/evidence-library/ghf-e135-3-july-1974-mary-williams-plea-of-ownership-and-pleadings/')], status='borne'),
  dict(id='L-12', date='1987-07-31', head='Costs of BP Properties Ltd v Buckler (1986 High Court, 1987 Court of Appeal, 1988 House of Lords)', account='Costs-1986-88', amount=0, estimate=False, nil=True,
       basis='£ not on the record yet: costs orders and the solicitors\u2019 files are being traced.', sources=[src('EV-0080 — Court of Appeal judgment', WIKI + '/evidence/ev-0080-bp-properties-v-buckler-judgment/')], status='borne'),
  dict(id='L-13', date='1989-01-01', head='Rehousing after the demolition (the bus, 1989; rent since)', account='Rehousing', amount=0, estimate=False, nil=True,
       basis='£ not on the record yet (page 5298 head 6).', sources=[S5298, src('Press: \u201cFrom farm to a bus\u201d (N13)', WIKI + '/evidence-library/ghf-e090-n13-from-farm-to-a-bus-1989/')], status='borne'),
]
APPORTION = [  # page 5475 proposed shares (route C), used when the case reopens
  ('BP plc (successor to BP Properties Ltd / BP Pension Trust)', 'BP-plc', 60, 'Primary actor and the party that profited from the land'),
  ('HM Land Registry', 'HM-Land-Registry', 20, 'State guarantee of title: the statutory backstop for a register mistake'),
  ('Vale of Glamorgan Council', 'Vale-of-Glamorgan-Council', 5, 'Planning and conservation authority with power to intervene'),
  ('Welsh Government / Cadw', 'Welsh-Government-Cadw', 5, 'Heritage authority; the 1988 listing file is lost'),
  ('South Wales Police', 'South-Wales-Police', 5, 'Public authority at the 1988 eviction'),
  ('The family\u2019s former solicitors (1986–87)', 'Former-solicitors', 3, 'The family\u2019s own advisers in the appeal'),
  ('Developer that bought the site in 1993 (successors)', 'Developer-successors', 2, 'Took the benefit of the site'),
]
MEMO = [
  dict(head='Value realised on the land: 16 new-build sales at Church View Close, Feb 1995 – Apr 1997', amount=16 * 120906.0,
       basis='16 sales × mean £120,906 (HMLR Price Paid, via page 5298). A gain on Team Regime\u2019s side, shown for scale; not a cost, so outside the balance.', sources=[S5298]),
  dict(head='Developed value of the 20 houses today', amount=11039000.0,
       basis='Line 1a central: 20 × £551,929 (page 5298). Context, not a loss.', sources=[S5298]),
]

BANNED = ['says', 'claims', 'according to', 'hearsay', 'unverified', 'alleged', 'fraud', 'stolen', 'branwen', 'sion', 'disclaimer', 'not a finding']

def band_for(points):
    for b in BANDS:
        if b[2] <= points <= b[3]: return b[0]
    return 'paper' if points < 1 else 'home'

def score(t):
    p = t['base']
    for m in t.get('mult', []): p *= MULTS[m][0]
    return min(1000000, p)

def gate(text):
    low = text.lower()
    hits = []
    for w in BANNED:
        for m in re.finditer(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', low):
            hits.append((w, low[max(0, m.start() - 40):m.end() + 40]))
    return hits

def build():
    tickets = []
    def mk(t, team, idx=None):
        t = dict(t); t['team'] = team
        if idx is not None: t['id'] = 'R-%02d' % idx
        t['points'] = 0 if t.get('cancelled') else score(t)
        t['band'] = DESK_BAND[t['desk']]
        t['desk_name'] = DESKS[t['desk']]
        t['multipliers'] = [{'x': MULTS[m][0], 'why': MULTS[m][1]} for m in t.get('mult', [])]
        t.pop('mult', None)
        t.setdefault('reversible', False); t.setdefault('gbp', None)
        return t
    anchor = mk(ANCHOR, 'williams'); anchor['original'] = True
    tickets.append(anchor); tickets.append(mk(CANCELLED, 'williams'))
    for o in ORDERS: tickets.append(mk(o, 'williams'))
    for i, r in enumerate(sorted(R, key=lambda x: x['date']), 1): tickets.append(mk(r, 'regime', i))
    # ledger postings
    entries = []
    for c in COSTS:
        e = dict(c); amt = round(c['amount'], 2)
        e['borne_by'] = 'Team Williams'; e['liable_now'] = 'Team Williams'
        e['postings'] = [{'account': 'Borne:Team-Williams:' + c['account'], 'dr': amt}, {'account': 'Caused:' + c['account'], 'cr': amt}]
        if c['status'] == 'contingent' and amt > 0:
            e['liable_if_reopened'] = 'Team Regime, shared out (see the split below)'
            pennies = int(round(amt * 100)); parts = []; used = 0
            for name, acct, share, basis in APPORTION:
                p = pennies * share // 100; parts.append([acct, p]); used += p
            parts[0][1] += pennies - used
            e['reopen_postings'] = [{'account': 'Liable:Team-Regime:' + a, 'dr': p / 100} for a, p in parts] + [{'account': 'Borne:Team-Williams:' + c['account'], 'cr': amt}]
        else:
            e['liable_if_reopened'] = 'Team Regime once a figure is on the record' if c.get('nil') else 'Team Williams'
            e['reopen_postings'] = []
        entries.append(e)
    def totals(reopen):
        dr = sum(p.get('dr', 0) for e in entries for p in e['postings'] + (e['reopen_postings'] if reopen else []))
        cr = sum(p.get('cr', 0) for e in entries for p in e['postings'] + (e['reopen_postings'] if reopen else []))
        return round(dr, 2), round(cr, 2)
    for r_ in (False, True):
        dr, cr = totals(r_); assert abs(dr - cr) < 0.005, (r_, dr, cr)
    now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    tj = {'schema': 'oldbill-tickets/1', 'generated': now,
          'rubric': {'bands': [dict(zip(['key', 'name', 'lo', 'hi', 'colour', 'example'], b)) for b in BANDS],
                     'multipliers': [{'key': k, 'x': v[0], 'why': v[1]} for k, v in MULTS.items()], 'cap': 1000000},
          'desks': DESKS, 'tickets': tickets}
    lj = {'schema': 'oldbill-ledger/1', 'generated': now, 'currency': 'GBP',
          'apportionment': [{'party': n, 'account': 'Liable:Team-Regime:' + a, 'share': s, 'basis': b, 'source': S5475} for n, a, s, b in APPORTION],
          'entries': entries, 'memo': MEMO}
    # boards
    def board(reopen):
        W_ = {'points': 0, 'tickets': 0, 'gbp': 0.0}; R_ = {'points': 0, 'tickets': 0, 'gbp': 0.0}
        for t in tickets:
            if t.get('cancelled'): continue
            if t['team'] == 'williams':
                if reopen and t['reversible']: R_['points'] += t['points']; R_['tickets'] += 1
                else: W_['points'] += t['points']; W_['tickets'] += 1
            else: R_['points'] += t['points']; R_['tickets'] += 1
        for e in entries:
            amt = e['amount']
            if reopen and e['reopen_postings']: R_['gbp'] += amt
            else: W_['gbp'] += amt
        return {'williams': W_, 'regime': R_}
    summary = {'now': board(False), 'reopened': board(True), 'books': {'now': totals(False), 'reopened': totals(True)},
               'counts': {'tickets': len(tickets), 'regime_tickets': sum(1 for t in tickets if t['team'] == 'regime'),
                          'williams_tickets': sum(1 for t in tickets if t['team'] == 'williams'), 'ledger_entries': len(entries)}}
    tj['summary'] = summary; lj['summary'] = {'books': summary['books']}
    (PUB / 'data').mkdir(parents=True, exist_ok=True)
    (PUB / 'data' / 'tickets.json').write_text(json.dumps(tj, ensure_ascii=False, indent=1))
    (PUB / 'data' / 'ledger.json').write_text(json.dumps(lj, ensure_ascii=False, indent=1))
    tpl = (HERE / 'template.html').read_text()
    page = tpl.replace('/*__TICKETS__*/null', json.dumps(tj, ensure_ascii=False)).replace('/*__LEDGER__*/null', json.dumps(lj, ensure_ascii=False))
    (PUB / 'index.html').write_text(page)
    (PUB / 'robots.txt').write_text('User-agent: *\nAllow: /\n')
    # gate over every public file (visible text and data); URLs are excluded (wiki slugs are not ours to rename)
    hits = []
    for f in PUB.rglob('*'):
        if f.is_file() and f.suffix in ('.html', '.json', '.txt'):
            txt = re.sub(r'https?://[^\s"\'<>)]+', ' ', f.read_text())
            for h in gate(txt): hits.append((f.name,) + h)
    if hits:
        for h in hits[:40]: print('GATE', h)
        raise SystemExit('gate failed: %d hits' % len(hits))
    print(json.dumps(summary, indent=1))
if __name__ == '__main__': build()
