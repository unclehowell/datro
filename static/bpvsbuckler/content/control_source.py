#!/usr/bin/env python3
"""Records-request control panel: every party the family is seeking records
from, every procedure available against it, and how far each has gone.

Writes control/index.html (the page) and api/control.json (the data).
Run from static/bpvsbuckler:  python3 content/control_source.py

Sources: the wiki's Records Access Chronology and FOI & Public-Authority Reply
Register, the family's Gmail, and the HubSpot tickets, as at AS_AT below.
Edit the PARTIES list, re-run, commit.

Cell codes (one per stage, in ladder order; missing trailing stages are 'a'):
  d  done            the step has been taken / answered
  w  waiting on them the family has acted; the body owes the next move
  y  your move       the next step is the family's
  o  overdue         a deadline has passed with no answer
  u  unconfirmed     the records disagree or are silent; check
  a  available       not yet used
  x  not applicable  skipped or not part of this line
A cell is 'code|date|note'. A 'w' cell whose 'due' (YYYY-MM-DD) has passed is
shown as overdue by the page itself.
"""
import json
import os

AS_AT = '2026-10-07'
SITE = 'https://bpvsbuckler.bucklerfamily.estate'
WIKI = 'https://greathousefarmwiki.wordpress.com'
RAC = WIKI + '/records-access-chronology/'

# Each ladder is one statutory or practical procedure, in the order its steps
# must be exhausted.
LADDERS = {
    'foi': ('FOI / EIR', 'Freedom of Information Act 2000 / Environmental Information Regulations 2004',
            ['Request', 'Acknowledged', 'Response', 'Internal review asked', 'Review outcome',
             'ICO complaint (s.50)', 'ICO decision', 'Tribunal appeal']),
    'sar': ('Subject access', 'UK GDPR Art. 15 / Data Protection Act 2018',
            ['Request', 'ID / clarification', 'Response', 'Complaint to controller',
             'ICO complaint', 'Court order (DPA s.167)']),
    'cmp': ('Complaint', 'The body\'s complaints procedure, then the independent reviewer',
            ['Stage 1', 'Stage 2 / final', 'Ombudsman / independent reviewer', 'Legal challenge']),
    'pres': ('Preservation', 'Notice not to destroy or dispose of records',
             ['Notice sent', 'Acknowledged', 'Written confirmation']),
    'rec': ('Records & copies', 'Catalogue enquiry, then copies or a visit',
            ['Enquiry', 'Holdings identified', 'Copies ordered / visit', 'Copies obtained']),
    'rep': ('Report / referral', 'Report to a prosecuting or investigating body',
            ['Submitted', 'Acknowledged', 'Outcome', 'Review of decision']),
    'stat': ('Statutory notice', 'Notice served under an Act',
             ['Served', 'Receipt', 'Decision']),
    'pol': ('Elected representative', 'MP, Senedd or council scrutiny',
            ['Raised', 'Reply', 'Escalated']),
    'pvt': ('Private party', 'Letter before action, then pre-action disclosure (CPR 31.16)',
            ['Letter / request', 'Reply', 'Pre-action disclosure']),
}

GROUPS = [
    ('land', 'Land and title'),
    ('heritage', 'Heritage, archives and museums'),
    ('gov', 'Government, council and police'),
    ('courts', 'Courts and justice'),
    ('reps', 'Elected representatives'),
    ('private', 'Companies, firms and private holders'),
]


def L(ladder, ref, title, *cells, due=None, note=None, url=None):
    return {'ladder': ladder, 'ref': ref, 'title': title, 'cells': list(cells),
            'due': due, 'note': note, 'url': url}


def P(pid, name, group, *lines, note=None):
    return {'id': pid, 'name': name, 'group': group, 'note': note, 'lines': list(lines)}


PARTIES = [
    # ------------------------------------------------------------------ land
    P('hmlr', 'HM Land Registry', 'land',
      L('foi', 'F260213', 'First-registration records',
        'd|Feb 2026', 'd|12–13 Mar|asked for a title number', 'd|13 Apr|response to F260213',
        'a', 'a', 'a', 'a', 'a', url=RAC),
      L('sar', 'WA231076 / WA240304', 'Personal data on the two titles',
        'd|28 Sep', 'd|1 Oct|acknowledged', 'w|due 28 Oct', due='2026-10-28'),
      L('cmp', 'N610CGV · ICR/090/26', 'Interest left out at first registration',
        'd|19 Apr|not upheld', 'd|25 May|not upheld: "registered correctly"',
        'w|27 Sep|referred to the Independent Complaints Reviewer; ICR/090/26 allocated 28 Sep',
        'a|application to alter the register for mistake (via solicitor)', url=RAC),
      L('rec', 'N610CGV', 'First-registration files',
        'd|29 Jan|application and enquiry', 'd|30 Jul|schedule of 43 documents; 1969 root deed not on it',
        'o|3 Jun physical inspection and 22 Sep electronic copies asked; inspection unanswered',
        'a'),
      L('pres', 'N610CGV', 'Keep the first-registration files',
        'd|2–3 Jun, 21 Sep, 28 Sep', 'd|"will remain on file"',
        'o|formal non-destruction confirmation outstanding since 3 Jun'),
      L('pol', 'Chief Land Registrar', 'Via Stephen Doughty MP',
        'd|17 Aug|MP wrote to MHCLG', 'd|9 Sep|Iain Banfield: no further action; "not made aware of a competing claim"',
        'a|PHSO referral via the MP once the ICR has decided'),
      ),
    P('forest', 'Forest of Cardiff (woodland, WA735527)', 'land',
      L('rec', 'WA735527', 'Woodland title and its purchase from Ideal Homes',
        'd|18 Sep|official copy and title plan of WA735527', 'd|25 Sep|charity says it bought from Ideal Homes',
        'a|copy of the Ideal Homes → Forest of Cardiff transfer (OC2)', 'a'),
      L('pvt', '£30,000 offer', 'Route to ownership',
        'd|27 Sep|family reply; offer not accepted', 'd|25 Sep|£30k + costs, else open market early 2027',
        'a'),
      ),
    P('companies', 'Companies House', 'land',
      L('rec', 'WGR · BP Properties · Ideal Homes Wales', 'Dissolved company files',
        'd|6 Oct|request sent', 'w', 'a', 'a'),
      ),
    P('persimmon', 'Persimmon Homes', 'land',
      L('pvt', 'WA231076 / WA240304', 'Preservation and disclosure: six title-chain questions',
        'd|27 Sep', 'w|no reply', 'a'),
      L('sar', '—', 'Personal data held about the family', 'a'),
      ),

    # -------------------------------------------------------------- heritage
    P('cadw', 'Cadw / Welsh Government', 'heritage',
      L('foi', 'ATISN 27021', '1988 listing file',
        'd|1 Jun', 'x', 'd|11 Jun|two 1988 photographs and the 1990 report', 'd|11 Jun',
        'd|2, 10, 29 Jul|"most likely destroyed"; no destruction record',
        'a|Cadw itself pointed to the ICO on 29 Jul', 'a', 'a', url=RAC),
      L('foi', 'ATISN 27589', 'Listing consideration, Jul–Dec 1988',
        'd|28 Sep', 'd|1 Oct', 'w|due 26 Oct', due='2026-10-26'),
      L('foi', 'Cadw / TfW', '1983 fire: villa and medieval house finds',
        'd|24 Sep', 'u|no acknowledgement recorded', 'w'),
      L('cmp', 'Chief Inspector', 'Handling of the 1988 file',
        'w|17 Sep, re-served 20 and 22 Sep|no outcome', 'a',
        'a|Public Services Ombudsman for Wales (notice drafted, on hold)', 'a'),
      L('stat', 'TO/HF/05677/26', 'Historic Environment (Wales) Act 2023 ss.194–195',
        'd|Sep', 'd|30 Sep|receipt', 'w'),
      L('pres', '28 Sep notice', 'Keep 1988 listing records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('rcahmw', 'Royal Commission (RCAHMW)', 'heritage',
      L('foi', 'RC26-0375', 'Requests of 8, 15, 17 and 20 Sep',
        'd|8–20 Sep', 'd|acknowledged', 'd|29 Sep and 6 Oct|treated as fully answered (s.21); nothing withheld',
        'a', 'a', 'a', 'a', 'a', url=RAC),
      L('rec', 'NPRN 20182', 'Archive items 6048941–6048945',
        'd|Nov 2025 and May–Jun 2026|RC25-0464, RC26-0205',
        'd|6 Oct|Suggett 1988 note, Thomas 1974 notes, plan with 12/12/1988 additions',
        'y|order the free scans (under 5 items)', 'a'),
      L('rec', 'Aerial photographs', 'Aerial photography search', 'a|chargeable search offered'),
      L('pres', '28 Sep notice', 'Keep campaign and archive records',
        'd|28 Sep', 'd|29 Sep', 'a'),
      ),
    P('museum', 'Amgueddfa Cymru – Museum Wales', 'heritage',
      L('foi', 'FOI 2026-020', 'Farm furniture and contents',
        'd|2 and 13 Jul', 'd|13 Jul', 'd|3 Aug|not held', 'd|14 Aug', 'd|8 Sep|upheld',
        'a', 'a', 'a', url=RAC),
      L('foi', 'FOI 2026-024', 'The farmhouse floor find',
        'd|27 Jul', 'd|27 Jul', 'd|25 Aug|not held; other records withheld as out of scope',
        'd|26 Aug', 'd|22 Sep|upheld', 'a', 'a', 'a', url=RAC),
      L('foi', 'FOI 2026-032', 'Records already found',
        'd|26 Aug', 'x', 'd|22 Sep|disclosed; item 7 unanswered',
        'w|item 7 chased 22 Sep, 28 Sep and 6 Oct', 'a', 'a', 'a', 'a', url=RAC),
      L('foi', 'FOI 2026-036', 'Everything indexed to the farm',
        'd|8 Sep', 'd|8 Sep', 'd|5 Oct|Church Farm 63.24; waterwheel; 1924 particulars',
        'a|review window open to about 30 Nov', 'a', 'a', 'a', 'a', url=RAC),
      L('pres', '28 Sep notice', 'Keep collection and accession records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('heneb', 'Heneb / GGAT', 'heritage',
      L('foi', 'GGAT02038s', 'EIR schedule of HER records',
        'd|8 and 20 Sep', 'u', 'w|no response recorded'),
      L('cmp', 'HER identifiers', 'HER classification and the 1978–95 record',
        'w|27 Sep; acknowledged 29 Sep; reply aimed within 5 weeks', 'a', 'a', 'a',
        due='2026-11-03'),
      L('rec', '1990 assessment · 1994 report', 'GGAT 1990 assessment and Cotswold 1994 report',
        'd|22 May|first HER enquiry', 'a', 'a', 'a'),
      L('pres', '28 Sep notice', 'Keep HER and project archives',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('tna', 'The National Archives', 'heritage',
      L('foi', 'CAS-347296-M0V4Y1', 'Existence, transfer and disposal of records',
        'd|18 Feb; widened 13 Aug, 20 Aug, 2 Sep', 'd', 'd|23 Sep|House of Lords judicial papers, transfer paperwork, NFS, War Ag',
        'u|drafted 28 Sep; wiki lists it open on 2 Oct; confirm it was sent', 'a', 'a', 'a', 'a', url=RAC),
      L('rec', 'YHL/PO/JO/10/11/2536', 'House of Lords bundle, National Farm Survey, War Ag minutes',
        'd|Feb–Sep', 'd|23 Sep', 'y|visit Kew or order copies', 'a'),
      L('pres', '28 Sep notice', 'Keep transferred and judicial records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('glamarch', 'Glamorgan Archives', 'heritage',
      L('rec', '2026/3793 · 3893 · 3941 · 4097', 'Deeds, rural district and council records',
        'd|Feb–Sep', 'd|UC/73/1–5, DCVG/C/4/36, D696, DBDT/1/3, DBDT/18/1',
        'd|27 Aug–14 Sep|DBDT/79/1 examined and photographed; ACA/8/2 copied',
        'y|further paid searches and copies offered'),
      L('rec', '27 Sep enquiry', 'South Wales Constabulary records, Nov–Dec 1988',
        'd|27 Sep', 'w', 'a', 'a'),
      L('pres', '28 Sep notice', 'Keep deposited records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('nlw', 'National Library of Wales', 'heritage',
      L('foi', 'FOI/2026/09–11', 'Bute Estate series, Cardiff Castle furniture',
        'd|7 Jun', 'd', 'd|answered', 'd', 'd|29 Jul|review outcome; D153 and D205 searched',
        'a', 'a', 'a', url=RAC),
      L('rec', 'GB 0210 BUTE / D153 / D219', 'The 1877 split and the 1916 tenancy',
        'd|27 Sep', 'w', 'a', 'a'),
      L('pres', '28 Sep notice', 'Keep Bute Estate records',
        'd|28 Sep', 'd|30 Sep', 'd|30 Sep|"does not routinely destroy or dispose of records"'),
      ),
    P('ads', 'Archaeology Data Service', 'heritage',
      L('rec', 'doi:10.5284/1071962 · 10.5284/1000252', 'Digital excavation archives',
        'd|28 Sep', 'd|2 Oct|five catalogue records listed', 'a|free download', 'a'),
      L('pres', '28 Sep notice', 'Keep digital archives',
        'd|28 Sep', 'd|2 Oct', 'd|2 Oct|held in perpetuity'),
      ),
    P('cotswold', 'Cotswold Archaeology', 'heritage',
      L('rec', '1994 report', '1994 excavation report and archive', 'a'),
      L('pres', '28 Sep notice', 'Keep project archive', 'd|28 Sep', 'w', 'a'),
      ),
    P('echr', 'European Court of Human Rights archives', 'heritage',
      L('rec', '14464/88', 'Commission case file',
        'd|Jun', 'd|11 Jun|file 14464/88 found', 'd', 'd|Decision of the Commission held by the family'),
      ),
    P('dwr', 'Dŵr Cymru Welsh Water', 'heritage',
      L('rec', '93047764/01', 'Water records for the farm',
        'd|17 Sep', 'd|29 Sep|reply', 'a', 'a'),
      ),

    # ----------------------------------------------------------------- gov
    P('vale', 'Vale of Glamorgan Council', 'gov',
      L('foi', 'EIR 00210772', 'Planning file',
        'd|before 7 Jul', 'x', 'd|7 Jul|completeness disputed', 'd|7 Jul',
        'o|chased 1, 22, 30 Sep and 6 Oct; no outcome',
        'y|ICO complaint drafted; send about 15–17 Oct if still nothing', 'a', 'a', url=RAC),
      L('foi', 'WhatDoTheyKnow', 'Ownership certificate for 2020/01590/HYB',
        'd|21 Aug', 'o|never logged', 'o|20 working days expired 21 Sep', 'd|22 Sep',
        'o|family deadline of 6 Oct passed', 'y|ICO referral', 'a', 'a', url=RAC),
      L('foi', '00211463', 'Council records on the farm', 'd|17 Sep', 'd', 'w|about 15 Oct', due='2026-10-15'),
      L('foi', '00211483', 'Planning 89/01396/OUT', 'd|17 Sep', 'd', 'w|about 15 Oct', due='2026-10-15'),
      L('foi', '00211484', 'Removal of the commemorative tree', 'd|18 Sep', 'd', 'w|narrowed 28 Sep; about 16 Oct', due='2026-10-16'),
      L('foi', '00211557', 's.52 agreement, planning register, screening, 92/00671/RES',
        'd|28 Sep', 'd|30 Sep', 'w|about 26 Oct', due='2026-10-26'),
      L('sar', 'Monitoring Officer', 'Personal data (28 Sep concern, preservation and SAR letter)',
        'd|28 Sep', 'x', 'w|about 28 Oct', due='2026-10-28'),
      L('cmp', 'VOG-874631131', 'Corporate complaint',
        'w|17–18 Sep', 'a', 'a|Public Services Ombudsman for Wales', 'a'),
      L('cmp', 'Monitoring Officer', 'Ward councillor not responding',
        'd|12 and 24 Aug|decision', 'a', 'a|Ombudsman (code of conduct)', 'a'),
      L('pol', 'Scrutiny', 'Scrutiny topic / Task & Finish suggestion',
        'd|6 Oct|to Democratic Services', 'w', 'a'),
      L('rec', 'Registration Service', 'Death record of Mary Doreen Williams',
        'd|Sep', 'd|28 and 30 Sep|not held in the Vale; passed to Cardiff', 'x', 'x'),
      L('pres', '28 Sep notice', 'Keep planning, heritage and council records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('cardiff', 'Cardiff Council (Register Office)', 'gov',
      L('rec', 'Transferred from the Vale', 'Death record of Mary Doreen Williams',
        'd|30 Sep|transferred', 'w|no reply yet', 'a', 'a'),
      ),
    P('llcc', 'Llandough Community Council', 'gov',
      L('foi', 'May–Jun 2026', 'Council minutes',
        'd|18 May', 'x', 'd|14 Jun|minutes deposited at Glamorgan Archives', 'a', 'a', 'a', 'a', 'a'),
      ),
    P('walesoffice', 'Wales Office', 'gov',
      L('foi', '26FOI 103 · IR/26/16', '1988 Welsh Office papers',
        'd|29 Aug', 'd|8 Sep', 'd|22 Sep|not held; papers "would have been" transferred',
        'd|28 Sep', 'w|acknowledged 29 Sep; due 26 Oct', 'a', 'a', 'a', due='2026-10-26', url=RAC),
      L('pres', '28 Sep notice', 'Keep transfer records', 'd|28 Sep', 'd|29 Sep', 'a'),
      ),
    P('swp', 'South Wales Police', 'gov',
      L('foi', '719/26', 'Police records on the farm and the deaths',
        'd', 'x', 'd|no records held', 'd|27 Sep', 'w', 'a', 'a', 'a', url=RAC),
      L('sar', '20/08/2026', 'Deaths of William Buckler and Mary Doreen Williams',
        'd|20 Aug; SAR letter 28 Sep', 'y|ID supplied 29 Sep; clarification asked 30 Sep: reply needed', 'a', 'a', 'a', 'a'),
      L('cmp', 'Professional Standards', 'Handling: phone-only contact, "no number given"',
        'a', 'a', 'a|Independent Office for Police Conduct', 'a'),
      L('pres', '28 Sep notice', 'Keep 1988 operational records',
        'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('mod', 'Ministry of Defence', 'gov',
      L('foi', 'FOI2026/09019', '1988 deployment records',
        'd|spring 2026', 'x', 'd|May|not held; s.23(5) neither confirm nor deny', 'd|20 Jun',
        'o|no outcome since 20 Jun', 'a', 'a', 'a'),
      L('sar', 'FOI2026/09019 SAR', 'Personal data',
        'd|Aug', 'd|5 Aug|ID sent', 'o|overdue since 5 Sep', 'd|27–28 Sep|chase and formal complaint', 'a', 'a'),
      ),

    # -------------------------------------------------------------- courts
    P('hmcts', 'Ministry of Justice / HMCTS', 'courts',
      L('sar', '260803049 · IR 260904007', 'Court records (treated as a subject access request)',
        'd|7 Jun', 'd|7 Jun–2 Jul|ID and proof of address', 'd|3 Sep|response',
        'w|IR 260904007: extension 2 Oct; scope clarified', 'a', 'a'),
      L('foi', 'Probate FOI', 'Probate records',
        'd|7 Jun', 'y|28 Jul MoJ asked for the death certificate; not yet sent', 'a', 'a', 'a', 'a', 'a', 'a'),
      L('rec', '[1987] EWCA Civ 2', 'Official Court of Appeal judgment and court file',
        'a', 'a', 'a', 'a'),
      ),
    P('cps', 'Crown Prosecution Service', 'courts',
      L('rep', 'Victim Liaison Cymru-Wales', 'Suspected historic fraud',
        'd|3 Sep', 'd|29 Sep|no case file located', 'w|further material 30 Sep', 'a|Victims\' Right to Review'),
      ),
    P('cardiffcourt', 'Cardiff County Court', 'courts',
      L('rec', '1955, 1962, 1974 actions', 'Possession proceedings files', 'a'),
      L('pres', '28 Sep notice', 'Keep court files', 'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('parlarch', 'Parliamentary Archives', 'courts',
      L('rec', 'House of Lords 1987–88', 'Petition for leave: BP Properties v Buckler',
        'd|via TNA', 'd|23 Sep|manifest and judicial papers', 'a', 'a'),
      L('pres', '28 Sep notice', 'Keep judicial papers', 'd|28 Sep', 'u|no acknowledgement recorded', 'a'),
      ),
    P('nctso', 'National Counter Terrorism Security Office', 'courts',
      L('foi', 'WhatDoTheyKnow', '"BP vs Buckler 1987"',
        'd', 'x', 'd|1 Oct|two responses posted', 'y|read them; decide on review', 'a', 'a', 'a', 'a'),
      ),

    # ---------------------------------------------------------------- reps
    P('doughty', 'Stephen Doughty MP', 'reps',
      L('pol', 'Cardiff South and Penarth', 'Land Registry and Ministry of Justice',
        'd|29–31 May, 27 Jul, 17 Aug', 'd|18 Sep|forwarded the Chief Land Registrar\'s letter',
        'w|Ministry of Justice reply awaited; meeting asked 18 Sep, followed up'),
      ),
    P('senedd', 'Senedd Cymru', 'reps',
      L('pol', 'Culture Committee', 'Correction of dates; petition route',
        'd|Feb and 27 Sep', 'd|28 Sep|correction noted', 'a|Senedd petition'),
      ),

    # ------------------------------------------------------------- private
    P('bp', 'BP plc / BP Archive (Warwick Modern Records Centre)', 'private',
      L('pres', '28 Sep notice', 'Keep BP Properties and pension trust papers',
        'd|28 Sep', 'd|2 Oct|holding reply', 'w|fuller response promised'),
      L('pvt', 'BP Properties', 'Title and possession papers', 'a', 'a', 'a'),
      ),
    P('linklaters', 'Linklaters', 'private',
      L('pres', '28 Sep notice', 'Keep 1980s client files',
        'd|28 Sep', 'd|29 Sep|assessing as far as it concerns personal data', 'w'),
      ),
    P('lawfirms', 'Blake Morgan · Darwin Gray', 'private',
      L('pres', '28 Sep notice', 'Keep client files', 'd|28 Sep', 'w|no reply', 'a'),
      ),
    P('landmark', 'Landmark Chambers', 'private',
      L('pres', '28 Sep notice', 'Keep counsel\'s papers', 'd|28 Sep', 'w|out-of-office reply only', 'a'),
      ),
    P('itv', 'ITV', 'private',
      L('rec', 'Clip sales', '1974 and 1988 news footage', 'd|28 Sep', 'w|auto-reply only', 'a', 'a'),
      ),
    P('harris', 'Terry Harris (photographer)', 'private',
      L('rec', '3 Oct', '1988 photographic record', 'd|3 Oct', 'w', 'a', 'a'),
      ),
]


def parse(cell):
    parts = (cell.split('|') + ['', ''])[:3]
    return {'s': parts[0] or 'a', 'date': parts[1], 'note': parts[2]}


def build():
    data = {'as_at': AS_AT, 'ladders': {}, 'groups': GROUPS, 'parties': []}
    for k, (name, basis, stages) in LADDERS.items():
        data['ladders'][k] = {'name': name, 'basis': basis, 'stages': stages}
    seen = set()
    for p in PARTIES:
        assert p['id'] not in seen, p['id']
        seen.add(p['id'])
        assert p['group'] in dict(GROUPS), p['group']
        out = dict(p, lines=[])
        for ln in p['lines']:
            stages = LADDERS[ln['ladder']][2]
            assert len(ln['cells']) <= len(stages), (p['id'], ln['ref'])
            for c in ln['cells']:
                assert c.split('|')[0] in 'dwyouax', (p['id'], c)
            cells = [parse(c) for c in ln['cells']] + [parse('a')] * (len(stages) - len(ln['cells']))
            out['lines'].append(dict(ln, cells=cells))
        data['parties'].append(out)
    return data


PAGE = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Records Control Panel</title>
<meta name="description" content="Every party the Buckler family is seeking records from about Great House Farm, every procedure available against it, and how far each has gone.">
<link rel="canonical" href="__SITE__/control/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500&display=swap" rel="stylesheet">
<style>
:root {
  --slate: #232a31; --slate-2: #2c353e; --slate-3: #3a4550;
  --lias: #b9b6ab; --limewash: #ecebe6; --gold: #c8a64e;
  --done: #0ca30c; --wait: #fab219; --you: #ec835a; --late: #d03b3b;
  --serif: 'Newsreader', Georgia, serif; --sans: 'Instrument Sans', 'Segoe UI', system-ui, sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--slate); color: var(--limewash); font: 15px/1.45 var(--sans); -webkit-font-smoothing: antialiased; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.wrap { max-width: 1240px; margin: 0 auto; padding: 0 16px 64px; }
header.top { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--slate-3); }
.brand { font-family: var(--serif); font-size: 21px; text-decoration: none; white-space: nowrap; }
.brand small { font-family: var(--sans); font-size: 13px; color: var(--lias); margin-left: 10px; }
.top nav { margin-left: auto; display: flex; gap: 4px; flex-wrap: wrap; }
.top nav a { font-size: 14px; color: var(--lias); text-decoration: none; padding: 6px 10px; border-radius: 6px; border: 1px solid transparent; }
.top nav a[aria-current] { color: var(--limewash); border-color: var(--slate-3); background: var(--slate-2); }
h1 { font-family: var(--serif); font-weight: 500; font-size: 34px; margin: 28px 0 6px; letter-spacing: -0.01em; }
.lede { color: var(--lias); max-width: 70ch; margin: 0 0 20px; }
h2 { font-family: var(--serif); font-weight: 500; font-size: 24px; margin: 36px 0 4px; }
h2 + p { color: var(--lias); margin: 0 0 14px; font-size: 14px; }

/* KPI tiles */
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 8px 0 18px; }
.kpi { background: var(--slate-2); border-radius: 10px; padding: 12px 14px; border: 1px solid transparent; text-align: left; color: inherit; font: inherit; }
button.kpi { cursor: pointer; }
button.kpi:hover { border-color: var(--slate-3); }
button.kpi[aria-pressed=true] { border-color: var(--limewash); }
.kpi b { display: block; font-size: 28px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.kpi span { font-size: 13px; color: var(--lias); display: flex; align-items: center; gap: 6px; }
.meter { height: 10px; background: var(--slate-3); border-radius: 5px; overflow: hidden; display: flex; gap: 2px; margin-top: 8px; }
.meter i { display: block; height: 100%; }

/* status chips */
.st { --c: var(--slate-3); }
.st-d { --c: var(--done); } .st-w { --c: var(--wait); } .st-y { --c: var(--you); } .st-o { --c: var(--late); }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c); display: inline-block; flex: none; }
.st-a .dot { background: transparent; box-shadow: inset 0 0 0 1.5px var(--lias); }
.st-u .dot { background: transparent; box-shadow: inset 0 0 0 1.5px var(--lias); border: 1.5px dashed transparent; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--lias); margin: 4px 0 8px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend .ic { width: 18px; height: 18px; border-radius: 4px; display: inline-grid; place-items: center; font-size: 11px; font-weight: 600; color: #111; background: var(--c); }
.legend .st-a .ic, .legend .st-u .ic, .legend .st-x .ic { background: transparent; color: var(--lias); box-shadow: inset 0 0 0 1.5px var(--lias); }
.legend .st-u .ic { box-shadow: none; border: 1.5px dashed var(--lias); }
.legend .st-x .ic { opacity: .45; }

.filters { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 4px; align-items: center; }
.filters button { background: var(--slate-2); border: 1px solid var(--slate-3); color: var(--lias); border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.filters button[aria-pressed=true] { color: var(--slate); background: var(--limewash); border-color: var(--limewash); }
.filters label { font-size: 13px; color: var(--lias); margin-right: 4px; }

/* overview matrix */
.mx-wrap { overflow-x: auto; border: 1px solid var(--slate-3); border-radius: 10px; }
table.mx { border-collapse: collapse; width: 100%; min-width: 860px; font-size: 13px; }
.mx th, .mx td { padding: 7px 10px; border-bottom: 1px solid var(--slate-3); text-align: left; vertical-align: middle; }
.mx thead th { font-weight: 500; color: var(--lias); background: var(--slate-2); position: sticky; top: 0; }
.mx tbody th { font-weight: 500; white-space: nowrap; }
.mx tbody th a { text-decoration: none; } .mx tbody th a:hover { text-decoration: underline; }
.mx .grp th { background: var(--slate); color: var(--gold); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; padding-top: 12px; }
.mx td.cov { width: 64px; }
.bars { display: flex; flex-direction: column; gap: 3px; }
.bar { display: flex; gap: 2px; height: 9px; }
.bar i { flex: 1; border-radius: 2px; background: var(--c); }
.bar i.st-a { background: transparent; box-shadow: inset 0 0 0 1px #6c747c; }
.bar i.st-u { background: repeating-linear-gradient(135deg, #6c747c 0 2px, transparent 2px 4px); }
.bar i.st-x { background: transparent; }
.mx td.none { color: #5d666f; }
.pct { font-variant-numeric: tabular-nums; color: var(--lias); font-size: 12px; margin-left: 6px; }

/* party detail */
.party { background: var(--slate-2); border-radius: 12px; padding: 14px 16px 6px; margin: 12px 0; }
.party h3 { margin: 0 0 2px; font-size: 17px; font-weight: 600; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.party h3 .pct { font-weight: 400; }
.line { display: grid; grid-template-columns: 230px 1fr; gap: 6px 16px; padding: 10px 0; border-top: 1px solid var(--slate-3); }
.line:first-of-type { border-top: 0; }
.lmeta .lad { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--gold); }
.lmeta .ref { font-weight: 600; font-size: 14px; }
.lmeta .ttl { color: var(--lias); font-size: 13px; }
.steps { display: flex; flex-wrap: wrap; gap: 4px; align-items: stretch; }
.step { position: relative; display: flex; flex-direction: column; gap: 1px; min-width: 112px; flex: 1 1 112px; max-width: 190px; padding: 6px 8px 6px 26px; border-radius: 6px; background: color-mix(in srgb, var(--c) 18%, var(--slate)); border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); font-size: 12px; cursor: default; }
.step .ic { position: absolute; left: 7px; top: 7px; width: 14px; height: 14px; border-radius: 50%; display: grid; place-items: center; font-size: 9px; font-weight: 700; color: #111; background: var(--c); }
.step b { font-weight: 600; font-size: 12px; }
.step small { color: var(--lias); font-size: 11.5px; line-height: 1.3; }
.step.st-a { background: transparent; border: 1px solid var(--slate-3); }
.step.st-a .ic { background: transparent; box-shadow: inset 0 0 0 1.5px #7c848c; }
.step.st-a b { color: var(--lias); font-weight: 500; }
.step.st-u { background: transparent; border: 1px dashed #7c848c; }
.step.st-u .ic { background: transparent; color: var(--lias); box-shadow: inset 0 0 0 1.5px #7c848c; }
.step.st-x { opacity: .35; background: transparent; border: 1px solid var(--slate-3); }
.step.st-x .ic { background: transparent; color: var(--lias); }
.chev { align-self: center; color: #5d666f; font-size: 11px; }
.empty { color: var(--lias); padding: 24px 0; }
footer { color: var(--lias); font-size: 13px; border-top: 1px solid var(--slate-3); margin-top: 40px; padding-top: 14px; }
@media (max-width: 720px) {
  h1 { font-size: 27px; }
  .line { grid-template-columns: 1fr; }
  .step { max-width: none; flex-basis: 46%; }
  .chev { display: none; }
  .top .brand small { display: none; }
}
@media (forced-colors: active) { .step, .dot, .bar i { forced-color-adjust: none; } }
@media print { body { background: #fff; color: #000; } .filters, header.top nav { display: none; } }
</style>
</head>
<body>
<header class="top">
  <a class="brand" href="/">Tŷ Mawr<small>The Great House Farm story</small></a>
  <nav><a href="/">Film</a><a href="/story/">Script</a><a href="/control/" aria-current="page">Records</a></nav>
</header>
<main class="wrap">
  <h1>Records control panel</h1>
  <p class="lede">Every body the family is asking for records about Great House Farm, every procedure the law gives against it, and how far each one has gone. Green is ground covered; outlined steps are still available. Figures as at <b id="asat"></b>. Sources: the <a href="__RAC__">Records Access Chronology</a> and reply register on the <a href="__WIKI__/">Great House Farm Wiki</a>, the family's correspondence and its case tracker.</p>

  <div class="kpis" id="kpis"></div>
  <div class="legend" id="legend"></div>

  <h2>Overview</h2>
  <p>One row per body, one column per procedure. Each thin bar is one request or case; each segment is one step of that procedure, in order.</p>
  <div class="filters" id="filters"></div>
  <div class="mx-wrap"><table class="mx" id="matrix"></table></div>

  <h2>Step by step</h2>
  <p>Hover or tap a step for its date and what was said. Steps run left to right in the order they must be exhausted.</p>
  <div id="detail"></div>

  <footer>
    Data: <a href="/api/control.json">/api/control.json</a> · Built from <code>content/control_source.py</code>. Corrections go to the family through the <a href="__WIKI__/">wiki</a>.
  </footer>
</main>
<script>
const DATA = __DATA__;
const TODAY = new Date().toISOString().slice(0, 10);
const LABEL = { d: 'Done', w: 'Waiting on them', y: 'Your move', o: 'Overdue', u: 'Unconfirmed', a: 'Available, not yet used', x: 'Not applicable' };
const ICON = { d: '✓', w: '…', y: '→', o: '!', u: '?', a: '', x: '–' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A waiting step whose due date has passed is overdue.
for (const p of DATA.parties) for (const l of p.lines) for (const c of l.cells)
  if (c.s === 'w' && l.due && l.due < TODAY) { c.s = 'o'; c.note = (c.note ? c.note + '; ' : '') + 'due ' + l.due + ' has passed'; }

const counted = (cells) => cells.filter((c) => c.s !== 'x');
const covered = (cells) => counted(cells).filter((c) => c.s === 'd').length;
const lineStatus = (l) => { const s = l.cells.map((c) => c.s); return s.includes('o') ? 'o' : s.includes('y') ? 'y' : s.includes('w') ? 'w' : s.includes('u') ? 'u' : 'a'; };
const all = DATA.parties.flatMap((p) => p.lines);
const tally = (k) => all.reduce((n, l) => n + l.cells.filter((c) => c.s === k).length, 0);
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);

document.getElementById('asat').textContent = new Date(DATA.as_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

let filter = 'all';
function render() {
  // KPIs
  const tot = all.reduce((n, l) => n + counted(l.cells).length, 0);
  const done = tally('d');
  const k = { w: tally('w'), y: tally('y'), o: tally('o'), u: tally('u'), a: tally('a') };
  const seg = ['d', 'w', 'y', 'o', 'u'].map((s) => `<i class="st st-${s}" style="width:${(100 * tally(s)) / tot}%;background:var(--c)"></i>`).join('');
  document.getElementById('kpis').innerHTML =
    `<div class="kpi" style="grid-column:span 2"><span>Ground covered</span><b>${pct(done, tot)}%</b><span>${done} of ${tot} available steps taken, across ${DATA.parties.length} bodies and ${all.length} requests or cases</span><div class="meter" role="img" aria-label="${done} done, ${k.w} waiting, ${k.y} your move, ${k.o} overdue, ${k.a} available">${seg}</div></div>` +
    [['o', 'Overdue'], ['y', 'Your move'], ['w', 'Waiting on them'], ['u', 'Unconfirmed']].map(([s, t]) =>
      `<button class="kpi st st-${s}" data-f="${s}" aria-pressed="${filter === s}"><span><i class="dot"></i>${t}</span><b>${all.filter((l) => l.cells.some((c) => c.s === s)).length}</b><span>requests or cases</span></button>`).join('');
  document.querySelectorAll('#kpis button').forEach((b) => (b.onclick = () => { filter = filter === b.dataset.f ? 'all' : b.dataset.f; render(); }));

  document.getElementById('legend').innerHTML = ['d', 'w', 'y', 'o', 'u', 'a', 'x'].map((s) => `<span class="st st-${s}"><i class="ic">${ICON[s]}</i>${LABEL[s]}</span>`).join('');

  // filters
  const F = [['all', 'All'], ['o', 'Overdue'], ['y', 'Your move'], ['w', 'Waiting'], ['u', 'Unconfirmed']];
  document.getElementById('filters').innerHTML = '<label>Show</label>' + F.map(([f, t]) => `<button data-f="${f}" aria-pressed="${filter === f}">${t}</button>`).join('');
  document.querySelectorAll('#filters button').forEach((b) => (b.onclick = () => { filter = b.dataset.f; render(); }));

  const keep = (l) => filter === 'all' || l.cells.some((c) => c.s === filter);
  const ladders = Object.keys(DATA.ladders);

  // matrix
  let h = '<thead><tr><th scope="col">Body</th><th scope="col">Covered</th>' + ladders.map((k) => `<th scope="col" title="${esc(DATA.ladders[k].basis)}">${esc(DATA.ladders[k].name)}</th>`).join('') + '</tr></thead><tbody>';
  for (const [g, gname] of DATA.groups) {
    const ps = DATA.parties.filter((p) => p.group === g && p.lines.some(keep));
    if (!ps.length) continue;
    h += `<tr class="grp"><th colspan="${ladders.length + 2}">${esc(gname)}</th></tr>`;
    for (const p of ps) {
      const cells = p.lines.flatMap((l) => l.cells);
      h += `<tr><th scope="row"><a href="#${p.id}">${esc(p.name)}</a></th><td class="cov"><span class="pct">${pct(covered(cells), counted(cells).length)}%</span></td>`;
      for (const k of ladders) {
        const ls = p.lines.filter((l) => l.ladder === k && keep(l));
        if (!ls.length) { h += '<td class="none">—</td>'; continue; }
        h += `<td style="min-width:${DATA.ladders[k].stages.length * 15 + 20}px"><div class="bars">` + ls.map((l) => `<div class="bar" title="${esc(l.ref + ' — ' + l.title)}: ${covered(l.cells)} of ${counted(l.cells).length} steps done">` + l.cells.map((c, i) => `<i class="st st-${c.s}" title="${esc(DATA.ladders[k].stages[i] + ': ' + LABEL[c.s])}"></i>`).join('') + '</div>').join('') + '</div></td>';
      }
      h += '</tr>';
    }
  }
  document.getElementById('matrix').innerHTML = h + '</tbody>';

  // detail
  let d = '';
  for (const [g, gname] of DATA.groups) {
    const ps = DATA.parties.filter((p) => p.group === g && p.lines.some(keep));
    if (!ps.length) continue;
    d += `<h2 style="font-size:20px">${esc(gname)}</h2>`;
    for (const p of ps) {
      const cells = p.lines.flatMap((l) => l.cells);
      d += `<section class="party" id="${p.id}"><h3>${esc(p.name)}<span class="pct">${covered(cells)} of ${counted(cells).length} steps · ${pct(covered(cells), counted(cells).length)}% covered</span></h3>`;
      for (const l of p.lines.filter(keep)) {
        const L = DATA.ladders[l.ladder];
        d += `<div class="line"><div class="lmeta"><div class="lad">${esc(L.name)}</div><div class="ref">${l.url ? `<a href="${esc(l.url)}">${esc(l.ref)}</a>` : esc(l.ref)}</div><div class="ttl">${esc(l.title)}</div></div><div class="steps">`;
        d += l.cells.map((c, i) => {
          const tip = `${L.stages[i]} — ${LABEL[c.s]}${c.date ? ' · ' + c.date : ''}${c.note ? ' · ' + c.note : ''}`;
          return `<div class="step st st-${c.s}" title="${esc(tip)}" tabindex="0" aria-label="${esc(tip)}"><i class="ic" aria-hidden="true">${ICON[c.s]}</i><b>${esc(L.stages[i])}</b>${c.date ? `<small>${esc(c.date)}</small>` : ''}${c.note ? `<small>${esc(c.note)}</small>` : ''}</div>`;
        }).join('');
        d += '</div></div>';
      }
      d += '</section>';
    }
  }
  document.getElementById('detail').innerHTML = d || '<p class="empty">Nothing matches this filter.</p>';
}
render();
</script>
</body>
</html>
'''


def main():
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    data = build()
    os.makedirs(os.path.join(root, 'control'), exist_ok=True)
    os.makedirs(os.path.join(root, 'api'), exist_ok=True)
    with open(os.path.join(root, 'api', 'control.json'), 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    page = (PAGE.replace('__DATA__', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
            .replace('__SITE__', SITE).replace('__WIKI__', WIKI).replace('__RAC__', RAC))
    with open(os.path.join(root, 'control', 'index.html'), 'w') as f:
        f.write(page)
    lines = sum(len(p['lines']) for p in data['parties'])
    print(f"control: {len(data['parties'])} bodies, {lines} requests or cases")


if __name__ == '__main__':
    main()
