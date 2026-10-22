#!/usr/bin/env python3
"""Writes work/forecast/institutions.json: one entry per institution on the dartboard dropdown, each with its own
ordered escalation ladder (its ramp), built from that body's published procedure and the UK law that applies.
Every rung cites a source URL; a rung whose timing or availability is our reading rather than a published rule
carries inferred: true and a note. Re-run only when a ladder changes; build_forecast.py reads the JSON. — Sion's Tab agent"""
import json, os, datetime as dt
W = os.path.dirname(os.path.abspath(__file__))
L = 'https://www.legislation.gov.uk/'
CODE = 'https://www.gov.uk/government/publications/freedom-of-information-code-of-practice'

def R(key, label, track, law, src, clock=None, us=None, them=None, inferred=False, note=None, ext=None):
    d = {'key': key, 'label': label, 'track': track, 'law': law, 'src': src,
         'clock': clock or {'u': 'none', 'n': 0}, 'us': us or 'our email opens this rung', 'them': them or 'their reply'}
    if ext: d['ext'] = ext
    if inferred: d['inferred'] = True; d['note'] = note or 'timing is a forecast assumption, not a published rule'
    elif note: d['note'] = note
    return d

# ---------- information track ----------
def foi(): return R('foi', 'FOI request', 'info', 'FOIA 2000 s.1, s.10(1): reply in 20 working days; s.10(3) public-interest extension', L+'ukpga/2000/36/section/10',
                    {'u': 'wd', 'n': 20}, 'request', 'reply or refusal notice', ext='+20 wd (public interest, s.10(3); s.45 Code)')
def eir(): return R('eir', 'EIR request', 'info', 'EIR 2004 reg 5(2): 20 working days; reg 7: 40 if complex and voluminous', L+'uksi/2004/3391/regulation/5',
                    {'u': 'wd', 'n': 20}, 'request', 'reply or refusal', ext='40 wd (reg 7)')
def foi_ir(): return R('foi_ir', 'Internal review (FOI)', 'info', 's.45 Code of Practice para 5: ask within 40 working days; outcome in 20, 40 at most', CODE,
                       {'u': 'wd', 'n': 20}, 'review request', 'review outcome', ext='40 wd max')
def eir_ir(): return R('eir_ir', 'Reconsideration (EIR reg 11)', 'info', 'EIR 2004 reg 11(2)-(4): representations within 40 working days; decision within 40', L+'uksi/2004/3391/regulation/11',
                       {'u': 'wd', 'n': 40}, 'reg 11 representations', 'reconsideration decision')
def ico_info(): return R('ico', 'ICO complaint (FOIA s.50)', 'info', 'FOIA s.50 / EIR reg 18; the ICO asks for complaints within 6 weeks of the final response', 'https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/',
                         {'u': 'cm', 'n': 6}, 's.50 complaint', 'decision notice', True, 'ICO decision time: 6 months is the board\'s worst-case assumption (no published statutory time)')
def ftt(): return R('ftt', 'First-tier Tribunal (Information Rights)', 'info', 'FOIA s.57; GRC Rules 2009 r.22(1)(b): appeal within 28 days of the decision notice', L+'uksi/2009/1976/rule/22',
                    {'u': 'cm', 'n': 6}, 'notice of appeal', 'tribunal decision', True, 'appeal window is statutory; the 6-month decision time is our assumption')
def ut(): return R('ut', 'Upper Tribunal (point of law)', 'info', 'TCEA 2007 s.11; GRC Rules 2009 r.42: ask the FtT for permission within 28 days', L+'uksi/2009/1976/rule/42',
                   {'u': 'cm', 'n': 2}, 'permission application', 'permission decision', True, 'available only on a point of law; 2-month decision time is our assumption')
INFO_FOI = lambda: [foi(), foi_ir(), ico_info(), ftt(), ut()]
INFO_EIR = lambda: [eir(), eir_ir(), ico_info(), ftt(), ut()]
INFO_BOTH = lambda: [foi(), eir(), foi_ir(), eir_ir(), ico_info(), ftt(), ut()]
def enquiry(src, days=10, inferred=True, note=None, label='Enquiry (no statutory clock)'):
    return R('enquiry', label, 'info', 'No statutory clock: the body\'s own service date', src, {'u': 'wd', 'n': days}, 'enquiry', 'answer', inferred,
             note or f'{days} working days is the body\'s service standard or our working date')

# ---------- subject access track ----------
def sar(): return R('sar', 'Subject access request', 'sar', 'UK GDPR Art 15, Art 12(3): one month, +2 months if complex', L+'eur/2016/679/article/12',
                    {'u': 'cm', 'n': 1}, 'subject access request', 'disclosure of personal data', ext='+2 months (Art 12(3))')
def sar_p3(): return R('sar', 'Subject access (DPA 2018 Part 3)', 'sar', 'DPA 2018 s.45, s.54: law-enforcement processing, one month', L+'ukpga/2018/12/section/45',
                       {'u': 'cm', 'n': 1}, 'subject access request', 'disclosure of personal data')
def sar_cmp(): return R('sar_cmp', 'Data protection complaint to the body', 'sar', 'DPA 2018 s.164A: complaints to controllers (acknowledge within 30 days)', L+'ukpga/2018/12/section/164A',
                        {'u': 'cd', 'n': 30}, 'complaint to the DPO', 'complaint outcome', True, '30 days to an outcome is our assumption; the section sets acknowledgement and "without undue delay"')
def ico_dp(): return R('ico_dp', 'ICO complaint (data protection)', 'sar', 'UK GDPR Art 77; DPA 2018 s.165; the ICO asks within 3 months of the last meaningful contact', 'https://ico.org.uk/make-a-complaint/data-protection-complaints/',
                       {'u': 'cm', 'n': 3}, 'complaint to the ICO', 'ICO outcome', True, '3-month outcome time is our assumption')
def s167(): return R('s167', 'Compliance order (DPA 2018 s.167)', 'court', 'DPA 2018 s.167: court order to comply with the data subject\'s rights', L+'ukpga/2018/12/section/167',
                     {'u': 'cm', 'n': 6}, 'claim', 'order', True, '6 months to an order is our assumption; county court or High Court')
SAR = lambda p3=False: [sar_p3() if p3 else sar(), sar_cmp(), ico_dp(), s167()]

# ---------- complaints and ombudsmen ----------
def stage(n, body, src, days, inferred=False, note=None, label=None):
    return R(f'cmp{n}', label or f'{body}: complaint stage {n}', 'complaint', f'{body} complaints procedure: reply in {days} working days', src,
             {'u': 'wd', 'n': days}, f'stage {n} complaint', f'stage {n} response', inferred, note)
PSOW_MODEL = 'https://www.ombudsman.wales/complaints-standards-authority/'
def psow(): return R('psow', 'Public Services Ombudsman for Wales', 'complaint', 'Public Services Ombudsman (Wales) Act 2019: complain within 12 months; investigations take around 12 months', 'https://www.ombudsman.wales/fact-sheets/complaints-against-public-bodies-our-procedure/',
                     {'u': 'cm', 'n': 12}, 'complaint to the PSOW', 'ombudsman decision')
def mp_ref(): return R('mp', 'MP referral to the PHSO', 'complaint', 'Parliamentary Commissioner Act 1967 s.5(1): the PHSO acts on an MP\'s referral; within 12 months, s.6(3)', L+'ukpga/1967/13/section/5',
                       {'u': 'wd', 'n': 20}, 'letter to the MP', 'MP refers the complaint', True, '20 working days for the MP\'s referral is our assumption')
def phso(): return R('phso', 'Parliamentary and Health Service Ombudsman', 'complaint', 'Parliamentary Commissioner Act 1967 s.5, s.10: investigation and report', 'https://www.ombudsman.org.uk/making-complaint',
                     {'u': 'cm', 'n': 12}, 'case file to the PHSO', 'ombudsman decision', True, '12 months to a decision is our assumption')
def preaction(): return R('pap', 'Pre-action letter (judicial review)', 'court', 'Pre-Action Protocol for Judicial Review: reply normally within 14 days', 'https://www.justice.gov.uk/courts/procedure-rules/civil/protocol/prot_jrv',
                          {'u': 'cd', 'n': 14}, 'letter before claim', 'response')
def jr(): return R('jr', 'Judicial review claim', 'court', 'CPR 54.5: claim promptly and within 3 months of the decision', 'https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part54',
                   {'u': 'cm', 'n': 3}, 'claim form', 'permission decision', True, '3 months to the permission decision is our assumption')
COURT = lambda: [preaction(), jr()]

def P(*rungs): return [r for grp in rungs for r in (grp if isinstance(grp, list) else [grp])]

def welsh_council(name, src, s1=10, s2=20, inferred=False, note=None, extra=None):
    return P(extra or [], INFO_BOTH(), SAR(), stage(1, name, src, s1, inferred, note), stage(2, name, src, s2, inferred, note), psow(), COURT())
def welsh_body(name, src, s1=10, s2=20, inferred=True, note=None, info=None, omb=True, sarr=True):
    return P(info or INFO_FOI(), SAR() if sarr else [], stage(1, name, src, s1, inferred, note), stage(2, name, src, s2, inferred, note), psow() if omb else [], COURT())
def uk_body(name, src, s1=20, s2=20, inferred=True, note=None, info=None, extra_cmp=None, stages=2):
    st = [stage(1, name, src, s1, inferred, note)] + ([stage(2, name, src, s2, True if inferred or s2 is None else False, note)] if stages >= 2 else [])
    if stages >= 3: st.append(stage(3, name, src, s2, True, note))
    return P(info or INFO_FOI(), SAR(), st, extra_cmp or [], mp_ref(), phso(), COURT())
def private(name, src, note=None):
    return P(R('sar', 'Subject access request', 'sar', 'UK GDPR Art 15, Art 12(3): one month, +2 months if complex; FOIA does not apply to a private body',
               src or L+'eur/2016/679/article/15', {'u': 'cm', 'n': 1}, 'subject access request', 'disclosure of personal data', ext='+2 months', note=note),
             sar_cmp(), ico_dp(), s167())
def law_firm(name, src):
    return P(private(name, src), R('cmp1', f'{name}: complaint to the firm', 'complaint', 'Legal Ombudsman Scheme Rules: the firm has up to 8 weeks to resolve a complaint', src or 'https://www.legalombudsman.org.uk/for-legal-service-providers/complaints-process/',
                                   {'u': 'cd', 'n': 56}, 'complaint', 'final response'),
             R('leo', 'Legal Ombudsman', 'complaint', 'Scheme Rules: complain within 6 months of the firm\'s final response', 'https://www.legalombudsman.org.uk/for-legal-service-providers/complaints-process/',
               {'u': 'cm', 'n': 6}, 'complaint to the Legal Ombudsman', 'ombudsman decision', True, '6 months to a decision is our assumption'))

S = {}  # lane id -> (route class, ladder, notes, policy url)
def add(lid, ladder, policy, note=None, omb=None): S[lid] = {'ladder': ladder, 'policy': policy, 'note': note, 'ombudsman': omb}

VALE = 'https://www.valeofglamorgan.gov.uk/en/our_council/achieving_our_vision/standards_of_service.aspx'
add('vale-of-glamorgan-council', welsh_council('Vale of Glamorgan Council', VALE), VALE, 'Council standards of service: stage 1 in 10, stage 2 in 20 working days', 'PSOW')
add('vale-of-glamorgan-council-scrutiny', P(R('scrutiny', 'Scrutiny committee referral', 'complaint', 'Local Government Act 2000 s.21; Local Government (Wales) Measure 2011: committee procedure, no statutory reply time', L+'ukpga/2000/22/section/21',
     {'u': 'wd', 'n': 20}, 'request to the committee', 'committee response', True, 'no published reply time; 20 working days is our assumption'), welsh_council('Vale of Glamorgan Council', VALE)), VALE, 'Scrutiny first, then the council\'s own ladder', 'PSOW')
add('llandough-community-council', P(INFO_FOI(), SAR(), stage(1, 'Llandough Community Council', 'https://www.ombudsman.wales/fact-sheets/complaints-aginsts-community-town-councils-general-information/', 10, True, 'community council: no published complaint times; the PSOW model times assumed'),
     stage(2, 'Llandough Community Council', 'https://www.ombudsman.wales/fact-sheets/complaints-aginsts-community-town-councils-general-information/', 20, True, 'PSOW model times assumed'),
     R('psow_coc', 'PSOW: Code of Conduct complaint', 'complaint', 'Local Government Act 2000 Part III: members\' code of conduct, PSOW investigates', 'https://www.ombudsman.wales/fact-sheets/complaints-aginsts-community-town-councils-general-information/', {'u': 'cm', 'n': 6}, 'code of conduct complaint', 'PSOW decision', True, '6 months is our assumption'),
     psow(), COURT()), 'https://www.ombudsman.wales/fact-sheets/complaints-aginsts-community-town-councils-general-information/', 'community council: service complaints and members\' code of conduct both go to the PSOW', 'PSOW')
add('coroner-s-service-rct-council', P(R('coroner', 'Coroner: disclosure to an interested person', 'info', 'Coroners (Inquests) Rules 2013 r.13: disclosure of documents to an interested person; no fixed time', L+'uksi/2013/1616/rule/13', {'u': 'wd', 'n': 20}, 'request to the coroner', 'disclosure', True, 'no fixed time; 20 working days is our assumption'),
     welsh_council('Rhondda Cynon Taf Council', 'https://www.rctcbc.gov.uk/EN/GetInvolved/CommentsandCompliments/Commentscomplimentsandcomplaints.aspx', inferred=True, note='PSOW model times assumed')),
    'https://www.rctcbc.gov.uk/EN/GetInvolved/CommentsandCompliments/Commentscomplimentsandcomplaints.aspx', 'judicial records of the coroner sit outside FOIA; the council\'s administration is inside it', 'PSOW')
add('cardiff-vale-register-office', P(R('gro', 'Certificate application (GRO / register office)', 'info', 'Births and Deaths Registration Act 1953 s.30-33: certified copies on application and fee', L+'ukpga/Eliz2/1-2/20/section/33', {'u': 'wd', 'n': 15}, 'application', 'certificate', True, '15 working days is our assumption'),
     welsh_council('Cardiff Council', 'https://www.cardiffregisteroffice.co.uk/', inferred=True, note='PSOW model times assumed')), 'https://www.cardiffregisteroffice.co.uk/', None, 'PSOW')
WG = 'https://www.gov.wales/how-make-complaint-about-welsh-government-html'
add('welsh-government-cadw', P(INFO_BOTH(), SAR(), stage(1, 'Welsh Government', WG, 10), stage(2, 'Welsh Government', WG, 20, True, 'stage 2 time from the PSOW model policy'), psow(), COURT()), WG, 'Welsh Government complaints: stage 1 within 10 working days', 'PSOW')
add('amgueddfa-cymru-museum-wales', welsh_body('Amgueddfa Cymru', 'https://museum.wales/media/48728/Visitor-feedback-procedure-May-2023.en.pdf', 10, 20, False, 'stage 1: response within 10 working days (visitor feedback procedure); stage 2 time assumed', P(foi(), eir(), foi_ir(), eir_ir(), ico_info(), ftt(), ut())),
    'https://museum.wales/freedom-of-information/public-task-document/', 'Welsh Government sponsored body: PSOW', 'PSOW')
add('national-library-of-wales', welsh_body('National Library of Wales', 'https://www.library.wales/enquiries', 10, 20, True, 'complaints by email; enquiries answered in 10 working days; stage times assumed'), 'https://www.library.wales/enquiries', None, 'PSOW')
add('rcahmw-royal-commission', P(enquiry('https://rcahmw.gov.uk/contact-us/', 20, label='NMR enquiry (service date)'), welsh_body('RCAHMW', 'https://rcahmw.gov.uk/about-us/corporate-information/policies/complaints-policy/', 10, 20, True, 'complaints policy has informal, formal and appeal stages; times assumed')),
    'https://rcahmw.gov.uk/about-us/corporate-information/policies/complaints-policy/', None, 'PSOW')
add('transport-for-wales', welsh_body('Transport for Wales', 'https://tfw.wales/about-us/transparency/complaints-handling-procedure', 10, 20, True, 'ORR-approved complaints procedure; times assumed'), 'https://tfw.wales/about-us/transparency/complaints-handling-procedure', 'PSOW jurisdiction over TfW is our reading', 'PSOW')
add('audit-wales', welsh_body('Audit Wales', 'https://www.audit.wales/making-a-complaint', 10, 20, True, 'complaints leaflet sets no day count; times assumed'), 'https://www.audit.wales/making-a-complaint', None, 'PSOW')
add('heneb-formerly-ggat-historic-environment-record', welsh_body('Heneb', 'https://heneb.org.uk/contact/', 10, 20, True, 'no published complaints procedure found; EIR coverage for the HER is our reading', P(eir(), eir_ir(), ico_info(), ftt(), ut()), omb=False, sarr=True),
    'https://heneb.org.uk/contact/', 'charitable trust: EIR for the Historic Environment Record (our reading); no ombudsman found', None)
add('cardiff-and-vale-university-health-board', P(INFO_FOI(), SAR(), R('ptr', 'NHS concern (Putting Things Right)', 'complaint', 'NHS (Concerns, Complaints and Redress Arrangements) (Wales) Regulations 2011 reg 24: reply within 30 working days', 'https://www.gov.wales/nhs-wales-complaints-and-concerns-putting-things-right',
     {'u': 'wd', 'n': 30}, 'concern', 'response'), psow(), COURT()), 'https://www.gov.wales/nhs-wales-complaints-and-concerns-putting-things-right', 'deceased health records: Access to Health Records Act 1990 s.3', 'PSOW')
GLAM = 'https://glamarchives.gov.uk/contact/'
add('glamorgan-archives', P(enquiry(GLAM, 20, label='Archive enquiry (service date)'), INFO_EIR(), stage(1, 'Glamorgan Archives (Cardiff Council)', GLAM, 10, True, 'joint service hosted by Cardiff Council: PSOW model times assumed'), stage(2, 'Glamorgan Archives (Cardiff Council)', GLAM, 20, True, 'PSOW model times assumed'), psow(), COURT()), GLAM, 'archive enquiry first, then EIR/FOI for closed records', 'PSOW')
TNA = 'https://cdn.nationalarchives.gov.uk/documents/complaints-policy-november-2025.pdf'
add('the-national-archives', P(enquiry('https://discovery.nationalarchives.gov.uk/', 20, label='Records enquiry (service date)'), INFO_FOI(), stage(1, 'The National Archives', TNA, 20, True, 'acknowledgement in 3 working days is published; reply times assumed'), stage(2, 'The National Archives', TNA, 20, True), mp_ref(), phso(), COURT()), TNA, None, 'PHSO via an MP')
HMLR = 'https://www.gov.uk/government/organisations/land-registry/about/complaints-procedure'
add('hm-land-registry', P(sar(), sar_cmp(), ico_dp(), eir(), eir_ir(), ico_info(), ftt(), stage(1, 'HM Land Registry', HMLR, 20, True, 'two internal stages; times assumed'), stage(2, 'HM Land Registry', HMLR, 20, True),
     R('icr', 'Independent Complaints Reviewer', 'complaint', 'HMLR complaints procedure: the ICR reviews after HMLR\'s own stages; investigation completed within 26 weeks', 'https://www.icrev.org.uk/faqs/', {'u': 'cd', 'n': 182}, 'complaint to the ICR', 'ICR report'),
     mp_ref(), phso(),
     R('rectify', 'Rectification / indemnity application', 'court', 'Land Registration Act 2002 Sch 4 (alteration) and Sch 8 (indemnity); disputed applications go to the First-tier Tribunal (Property Chamber), s.73(7)', L+'ukpga/2002/9/schedule/4', {'u': 'cm', 'n': 6}, 'application', 'HMLR decision or referral', True, '6 months is our assumption'),
     R('ftt_land', 'First-tier Tribunal (Land Registration)', 'court', 'Land Registration Act 2002 s.73(7), s.108: referral of a disputed application', L+'ukpga/2002/9/section/108', {'u': 'cm', 'n': 9}, 'statement of case', 'tribunal decision', True, '9 months is our assumption'), s167()),
    HMLR, 'unique ladder: subject access, EIR, HMLR complaints, the ICR, the PHSO and the Land Registration Act routes', 'ICR, then PHSO via an MP')
add('hm-land-registry-independent-complaints-reviewer', P(R('icr', 'ICR investigation', 'complaint', 'ICR: acknowledgement within a week; investigation within 26 weeks', 'https://www.icrev.org.uk/faqs/', {'u': 'cd', 'n': 182}, 'complaint to the ICR', 'ICR report'),
     R('icr_svc', 'ICR service complaint', 'complaint', 'ICR service standards', 'https://www.icrev.org.uk/faqs/', {'u': 'wd', 'n': 20}, 'service complaint', 'response', True, '20 working days is our assumption'), mp_ref(), phso(), COURT()), 'https://www.icrev.org.uk/faqs/', 'ICR/090/26', 'PHSO via an MP')
SWP = 'https://www.south-wales.police.uk/fo/feedback/complaints/complaints/'
def police(name, src, extra=None):
    return P(extra or [], INFO_FOI(), sar_p3(), sar_cmp(), ico_dp(), R('pcmp', f'{name}: police complaint', 'complaint', 'Police Reform Act 2002 Sch 3: complaint recorded and handled by Professional Standards', src, {'u': 'cm', 'n': 4}, 'complaint', 'outcome letter', True, '4 months to an outcome is our assumption'),
             R('iopc', 'Review (IOPC or local policing body)', 'complaint', 'Police (Complaints and Misconduct) Regulations 2020: apply within 28 days of the outcome letter', 'https://www.policeconduct.gov.uk/complaints/reviews-and-appeals', {'u': 'cm', 'n': 3}, 'review application', 'review outcome', True, '3 months to a review outcome is our assumption'), COURT())
add('south-wales-police', police('South Wales Police', SWP), SWP, 'FOI, Part 3 subject access, police complaints and the IOPC review', 'IOPC review')
add('counter-terrorism-policing-nactso', police('NPCC / CTP', 'https://www.npcc.police.uk/About-Us/governance-and-accountability/foi-and-subject-access-request/'), 'https://www.npcc.police.uk/About-Us/governance-and-accountability/foi-and-subject-access-request/', 'FOI through the NPCC (3065/2026); complaint route through the hosting force is our reading', 'IOPC review')
MOJ = 'https://www.gov.uk/government/organisations/hm-courts-and-tribunals-service/about/complaints-procedure'
add('ministry-of-justice-hmcts', P(R('cpr', 'Court file application (CPR 5.4C)', 'info', 'CPR 5.4C: copies of court documents with the court\'s permission (FOIA s.32 exempts court records)', L+'uksi/1998/3132/rule/5.4C', {'u': 'wd', 'n': 20}, 'application to the court', 'court\'s decision', True, '20 working days is our assumption'),
     INFO_FOI(), SAR(), stage(1, 'HMCTS', MOJ, 10, True, 'times assumed'), stage(2, 'HMCTS', MOJ, 20, True), mp_ref(), phso(), COURT()), MOJ, 'court records by CPR 5.4C; MoJ administrative records by FOI', 'PHSO via an MP')
add('ministry-of-defence', uk_body('Ministry of Defence', 'https://www.gov.uk/government/organisations/ministry-of-defence/about/complaints-procedure', 20, 20, False, 'full response within 20 working days (published); stage 2 time assumed'), 'https://www.gov.uk/government/organisations/ministry-of-defence/about/complaints-procedure', None, 'PHSO via an MP')
add('northern-ireland-office', uk_body('Northern Ireland Office', 'https://www.gov.uk/government/organisations/northern-ireland-office/about/complaints-procedure', 20, 20, True, '3-stage procedure (published); times assumed', stages=3), 'https://www.gov.uk/government/organisations/northern-ireland-office/about/complaints-procedure', None, 'PHSO via an MP')
add('wales-office', uk_body('Wales Office', 'https://www.gov.uk/government/organisations/office-of-the-secretary-of-state-for-wales/about/complaints-procedure', 20, 20, True, 'times assumed'), 'https://www.gov.uk/government/organisations/office-of-the-secretary-of-state-for-wales/about/complaints-procedure', None, 'PHSO via an MP')
CPS = 'https://www.cps.gov.uk/feedback-and-complaints/independent-assessor-complaints'
add('crown-prosecution-service', P(INFO_FOI(), sar_p3(), sar_cmp(), ico_dp(), stage(1, 'CPS', CPS, 20, True, 'stage 1: 20 working days after triage (CPS process); stage 2 time assumed'), stage(2, 'CPS', CPS, 20, True),
     R('iac', 'Independent Assessor of Complaints (CPS)', 'complaint', 'IAC: full response within 40 working days of the complaint', CPS, {'u': 'wd', 'n': 40}, 'referral to the IAC', 'IAC report'), mp_ref(), phso(), COURT()), CPS, 'unique rung: the Independent Assessor of Complaints', 'IAC, then PHSO via an MP')
DEFRA = 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs/about/complaints-procedure'
add('defra', P(INFO_EIR(), SAR(), stage(1, 'Natural England', 'https://www.gov.uk/government/organisations/natural-england/about/complaints-procedure', 25, False, 'Natural England: full response within 25 working days', 'Natural England: complaint'),
     stage(2, 'Defra', DEFRA, 20, False, 'Defra service standards adjudicator: 20 working days', 'Defra: service standards adjudicator'), mp_ref(), phso(), COURT()), DEFRA, 'Defra and Natural England (IR2026/09427) on one ladder; EIR first', 'PHSO via an MP')
add('department-for-culture-media-and-sport', uk_body('DCMS', 'https://www.gov.uk/government/organisations/department-for-culture-media-and-sport/about/complaints-procedure', 20, 20, True, 'published page no longer current; times assumed'), 'https://www.gov.uk/government/organisations/department-for-culture-media-and-sport/about/complaints-procedure', None, 'PHSO via an MP')
GLD = 'https://www.gov.uk/government/organisations/government-legal-department/about/complaints-procedure'
add('government-legal-department-bona-vacantia', P(INFO_FOI(), SAR(), stage(1, 'Government Legal Department', GLD, 20, True, 'times assumed'), stage(2, 'Government Legal Department', GLD, 20, True), mp_ref(), phso(),
     R('bv_claim', 'Bona Vacantia: claim or referral', 'court', 'Companies Act 2006 s.1012, s.1024: restoration of a dissolved company / property vesting in the Crown', L+'ukpga/2006/46/section/1024', {'u': 'cm', 'n': 3}, 'application', 'decision', True, 'availability and timing are our reading'), COURT()), GLD, 'Treasury Solicitor (Bona Vacantia)', 'PHSO via an MP')
HE = 'https://historicengland.org.uk/advice/planning/our-planning-services/charter/contact-us/'
add('historic-england', P(INFO_EIR(), SAR(), stage(1, 'Historic England', HE, 28, False, 'full response within 28 working days (published charter)'), stage(2, 'Historic England', HE, 20, True), mp_ref(), phso(), COURT()), HE, None, 'PHSO via an MP')
add('ordnance-survey', uk_body('Ordnance Survey', 'https://www.ordnancesurvey.co.uk/contact-us/complaint', 20, 20, True, 'times assumed'), 'https://www.ordnancesurvey.co.uk/contact-us/complaint', None, 'PHSO via an MP')
add('prime-minister-s-office-cabinet-office', uk_body('Cabinet Office', 'https://www.gov.uk/government/organisations/cabinet-office/about/complaints-procedure', 20, 20, True, '2-stage procedure (published); times assumed'), 'https://www.gov.uk/government/organisations/cabinet-office/about/complaints-procedure', None, 'PHSO via an MP')
add('serious-fraud-office', uk_body('Serious Fraud Office', 'https://www.gov.uk/government/organisations/serious-fraud-office/about/complaints-procedure', 20, 20, True, 'complaints within six months (published); times assumed'), 'https://www.gov.uk/government/organisations/serious-fraud-office/about/complaints-procedure', None, 'PHSO via an MP')
VOA = 'https://www.gov.uk/government/publications/adjudicators-office-service-level-agreement-with-hmrc-and-voa/service-level-agreement-for-the-provision-of-complaints-adjudication-services-for-hm-revenue-and-customs-and-valuation-office-agency-by-the-adjudicato'
add('valuation-office-agency-hmrc', P(INFO_FOI(), SAR(), stage(1, 'VOA', VOA, 15, True, 'Tier 1; times assumed', 'VOA: Tier 1 complaint'), stage(2, 'VOA', VOA, 15, True, 'Tier 2; times assumed', 'VOA: Tier 2 complaint'),
     R('adj', 'The Adjudicator\'s Office', 'complaint', 'Adjudicator for HMRC and the VOA (service level agreement)', VOA, {'u': 'cm', 'n': 6}, 'complaint to the Adjudicator', 'Adjudicator\'s decision', True, '6 months is our assumption'), mp_ref(), phso(), COURT()), VOA, 'unique rung: the Adjudicator\'s Office', 'Adjudicator, then PHSO via an MP')
add('archaeology-data-service', P(INFO_FOI(), SAR(), stage(1, 'University of York', 'https://www.york.ac.uk/news-and-events/news/2023/quality/archaeology-data-service-national-archives/', 20, True, 'hosted by the University of York; complaint times assumed'), COURT()),
    'https://www.york.ac.uk/news-and-events/news/2023/quality/archaeology-data-service-national-archives/', 'no ombudsman for a non-student (our reading)', None)
DWR = 'https://contact.dwrcymru.com/en/customer-care'
add('dwr-cymru-welsh-water', P(INFO_EIR(), SAR(), stage(1, 'Dŵr Cymru', DWR, 10, True, 'written complaints: 10 working days under the guaranteed standards (our reading)'), stage(2, 'Dŵr Cymru', DWR, 10, True),
     R('ccw', 'CCW (Consumer Council for Water)', 'complaint', 'Water Industry Act 1991 s.29: CCW investigates complaints the company has not resolved', 'https://www.ccw.org.uk/advice-and-support/make-a-complaint/', {'u': 'cm', 'n': 2}, 'complaint to CCW', 'CCW outcome', True, '2 months is our assumption'),
     R('watrs', 'WATRS (water redress scheme)', 'complaint', 'Water industry alternative dispute resolution after CCW', 'https://www.ccw.org.uk/publication/investigating-the-low-take-up-of-the-water-industry-redress-scheme/', {'u': 'cd', 'n': 42}, 'application', 'adjudicator\'s decision', True, '6 weeks is our assumption'),
     R('ofwat', 'Ofwat (enforcement referral)', 'complaint', 'Water Industry Act 1991 s.18: Ofwat enforces licence duties; no individual redress', L+'ukpga/1991/56/section/18', {'u': 'cm', 'n': 3}, 'referral', 'acknowledgement', True, 'availability and timing are our reading')),
    DWR, 'EIR, not FOIA; then CCW, WATRS and Ofwat', 'CCW, then WATRS')
ICO = 'https://ico.org.uk/make-a-complaint/complaints-and-compliments-about-us/complain-about-us/'
add('information-commissioner-s-office', P(R('ico_case', 'ICO case to decision notice', 'info', 'FOIA s.50: the Commissioner decides the complaint and serves a decision notice', L+'ukpga/2000/36/section/50', {'u': 'cm', 'n': 6}, 'complaint', 'decision notice', True, '6 months is our assumption'),
     ftt(), ut(), R('ico_svc', 'ICO service complaint', 'complaint', 'ICO complaints about our service', ICO, {'u': 'wd', 'n': 30}, 'service complaint', 'response', True, '30 working days is our assumption'), mp_ref(), phso(), COURT()), ICO, 'the regulator\'s own decision goes to the Tribunal; its service goes to the PHSO', 'PHSO via an MP')
add('parliamentary-and-health-service-ombudsman', P(INFO_FOI(), SAR(), R('phso_rev', 'PHSO review / service complaint', 'complaint', 'PHSO: raise service concerns within a month', 'https://www.ombudsman.org.uk/about-us/feedback-about-our-service', {'u': 'cm', 'n': 2}, 'review request', 'review outcome', True, '2 months is our assumption'), COURT()),
    'https://www.ombudsman.org.uk/about-us/feedback-about-our-service', None, None)
add('public-services-ombudsman-for-wales', P(INFO_FOI(), SAR(), R('psow_rev', 'PSOW review of decision', 'complaint', 'PSOW: review of a decision on request', 'https://www.ombudsman.wales/fact-sheets/complaints-against-public-bodies-our-procedure/', {'u': 'cm', 'n': 2}, 'review request', 'review outcome', True, '2 months is our assumption'), COURT()),
    'https://www.ombudsman.wales/fact-sheets/complaints-against-public-bodies-our-procedure/', None, None)
def rep(name, std_label, std_src, foi_src=None):
    lad = [R('letter', 'Letter to the representative', 'complaint', 'No statutory clock: a representative\'s own correspondence', std_src, {'u': 'wd', 'n': 20}, 'letter', 'reply', True, '20 working days is our assumption')]
    if foi_src: lad += [R('foi', 'FOI request (the legislature\'s administration)', 'info', 'FOIA 2000 s.10(1): 20 working days', foi_src, {'u': 'wd', 'n': 20}, 'request', 'reply'), foi_ir(), ico_info()]
    lad.append(R('std', std_label, 'complaint', 'Standards complaint about a member\'s conduct', std_src, {'u': 'cm', 'n': 6}, 'complaint', 'Commissioner\'s decision', True, '6 months is our assumption'))
    return lad
PCS = 'https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/complaints-and-investigations/'
add('member-of-parliament', rep('Member of Parliament', 'Parliamentary Commissioner for Standards', PCS, 'https://www.parliament.uk/site-information/freedom-of-information/'), PCS, 'MPs run in parallel and are never a prerequisite', None)
add('member-of-parliament-vale-of-glamorgan', rep('Member of Parliament (Vale of Glamorgan)', 'Parliamentary Commissioner for Standards', PCS), PCS, 'constituency MP: also the PHSO referral route for UK bodies', None)
add('senedd', rep('Senedd', 'Senedd Commissioner for Standards', 'https://senedd.wales/committees/standards-of-conduct-committee/', 'https://senedd.wales/commission/access-to-information/freedom-of-information/'), 'https://senedd.wales/committees/standards-of-conduct-committee/', None, None)
add('public-administration-and-constitutional-affairs', P(R('letter', 'Written evidence / letter to the committee', 'complaint', 'Select committee procedure: no statutory clock', 'https://www.parliament.uk/site-information/freedom-of-information/', {'u': 'cm', 'n': 2}, 'letter', 'acknowledgement', True, 'no clock; 2 months is our assumption'),
     R('foi', 'FOI request (House of Commons)', 'info', 'FOIA 2000 s.10(1): 20 working days', 'https://www.parliament.uk/site-information/freedom-of-information/', {'u': 'wd', 'n': 20}, 'request', 'reply'), foi_ir(), ico_info()), 'https://www.parliament.uk/site-information/freedom-of-information/', 'committee: no complaints route of its own (our reading)', None)
PRIV = {'bp': 'https://www.bp.com/en_gb/united-kingdom/home/products-and-services/bpme/privacy-policy.html', 'itv-archive': 'https://www.itvplc.com/site-services/privacy-and-cookie-notice',
        'cotswold-archaeology': 'https://cotswoldarchaeology.co.uk/privacy-policy/', 'persimmon-homes': 'https://www.persimmonhomes.com/privacy-policy', 'mount-stuart-bute-archive': 'https://www.mountstuart.com/privacy-policy',
        'the-postal-museum': 'https://postalmuseum.org/wp-content/uploads/2016/09/Data-Protection-Policy-v1.pdf', 'bt-archives': 'https://www.bt.com/privacy-policy', 'church-of-england-archives-lambeth-palace-librar': 'https://www.lambethpalacelibrary.org/', 'local-government-association-wlga': 'https://www.wlga.wales/'}
for lid, u in PRIV.items():
    pre = [enquiry(u or 'https://ico.org.uk/for-the-public/your-right-of-access/', 20, label='Archive / records enquiry (service date)')] if lid in ('bt-archives', 'the-postal-museum', 'church-of-england-archives-lambeth-palace-librar', 'mount-stuart-bute-archive', 'itv-archive', 'local-government-association-wlga') else []
    add(lid, P(pre, private(lid, u)), u or 'https://ico.org.uk/for-the-public/your-right-of-access/', 'private body: FOIA does not apply; subject access only' + ('' if u else ' (own privacy page not verified; ICO guidance cited)'), None)
add('linklaters', law_firm('Linklaters', 'https://www.linklaters.com/en/legal-notices/complaints'), 'https://www.linklaters.com/en/legal-notices/complaints', 'complain to the Legal Ombudsman within 6 months of the final response (published)', 'Legal Ombudsman')
add('blake-morgan-llp', law_firm('Blake Morgan', 'https://www.blakemorgan.co.uk/complaints-procedure/'), 'https://www.blakemorgan.co.uk/complaints-procedure/', None, 'Legal Ombudsman')
add('legal-regulators', P(INFO_FOI(), SAR(), R('olc_svc', 'Legal Ombudsman service complaint', 'complaint', 'Office for Legal Complaints: service complaints', 'https://www.legalombudsman.org.uk/for-consumers/factsheets/investigating-your-complaint/', {'u': 'wd', 'n': 20}, 'service complaint', 'response', True, '20 working days is our assumption'), mp_ref(), phso(), COURT()),
    'https://www.legalombudsman.org.uk/for-consumers/factsheets/investigating-your-complaint/', 'the Office for Legal Complaints is a FOIA public authority; the SRA is not (our reading)', 'PHSO via an MP')
add('whatdotheyknow-unconfirmed', [R('platform', 'Request published on the platform', 'info', 'A platform, not a public authority: the clock runs against the named body', 'https://www.whatdotheyknow.com/help/about', {'u': 'wd', 'n': 20}, 'request via the platform', 'body\'s reply', True, 'the named body\'s 20 working days apply; no ladder of its own')],
    'https://www.whatdotheyknow.com/help/about', 'platform only; nothing to exhaust here', None)

def main():
    rm = json.load(open('/home/user/tab/work/roadmap/roadmap.json'))
    out = []
    for ln in rm['lanes']:
        e = S.get(ln['id'])
        if not e: raise SystemExit('no ladder for ' + ln['id'])
        lad = e['ladder']
        for i, r in enumerate(lad): r['n'] = i + 1
        out.append({'id': ln['id'], 'name': ln['name'], 'route': ln.get('route'), 'regime': ln.get('regime'), 'policy': e['policy'], 'ombudsman': e['ombudsman'], 'note': e['note'],
                    'rungs': lad, 'counts': {'rungs': len(lad), 'inferred': sum(1 for r in lad if r.get('inferred'))}})
    sig = {}
    for o in out:
        s = json.dumps([(r['label'], r['src'], r['clock']) for r in o['rungs']])
        sig.setdefault(s, []).append(o['id'])
    dup = [v for v in sig.values() if len(v) > 1]
    doc = {'schema': 'ghf-forecast-institutions/1', 'generated': dt.date.today().isoformat(), 'by': "Sion's Tab agent",
           'about': 'One escalation ladder per institution (its Donkey Kong ramp). Each rung: our email opens it, their reply closes it, on the clock shown. inferred: true marks our reading, not a published rule.',
           'clock_units': {'wd': 'working days (UK bank holidays in any part of the UK excluded: FOIA s.10(6), EIR reg 2)', 'cm': 'calendar months', 'cd': 'calendar days', 'none': 'no clock'},
           'identical_ladders': dup, 'institutions': out}
    json.dump(doc, open(os.path.join(W, 'institutions.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(out), 'institutions;', sum(o['counts']['rungs'] for o in out), 'rungs;', 'identical ladders:', dup)
if __name__ == '__main__': main()
