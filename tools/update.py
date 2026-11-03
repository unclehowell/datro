#!/usr/bin/env python3
"""emails.bucklerfamily.estate — correspondence calendar and worst-case forecast.
Regenerates site/data/threads.json, site/data/policy.json, site/data/forecast.json, site/emails.ics and site/index.html
from seed.json (hand-checked threads), the drafts-engine queue (queue.json) and the Gmail check (gmail-verify.json).
Usage:
  python3 update.py                         # rebuild from files on disk (no network except the bank-holiday list)
  python3 update.py --gmail --taskdir DIR   # first re-read Gmail (read-only, paced 4 s, backs off on 429), then rebuild
  python3 update.py --publish --taskdir DIR # rebuild, then commit to datro@emails and ask Pages to deploy
Called by the nightly drafts engine (05:30) and the daily site flywheel (12:00). Sion's Tab agent."""
import json, os, sys, re, datetime as dt, subprocess, argparse, urllib.request, calendar
from zoneinfo import ZoneInfo
W = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(W, 'site'); DATA = os.path.join(SITE, 'data')
QUEUE = '/home/user/tab/work/drafts-engine/queue.json'
TODAY = dt.datetime.now(ZoneInfo('Europe/London')).date()
PER_DAY = 3
BANNED = ['says', 'claims', 'according to', 'hearsay', 'unverified', 'alleged', 'fraud', 'stolen', 'sion', 'branwen', 'buckler', 'hywel', 'disclaimer']
D = dt.date.fromisoformat

# ---------- working days: bank holidays in ANY part of the UK (FOIA s.10(6); EIR reg 2 adopts it) — corrected 22 Oct 2026 ----------
FALLBACK_BH = ['2026-01-02','2026-03-17','2026-07-13','2026-08-03','2026-11-30','2027-01-04','2027-03-17','2027-07-12','2027-08-02','2027-11-30','2026-01-01','2026-04-03','2026-04-06','2026-05-04','2026-05-25','2026-08-31','2026-12-25','2026-12-28','2027-01-01','2027-03-26','2027-03-29','2027-05-03','2027-05-31','2027-08-30','2027-12-27','2027-12-28','2028-01-03','2028-04-14','2028-04-17','2028-05-01','2028-05-29','2028-08-28','2028-12-25','2028-12-26']
def bank_holidays():
    cache = os.path.join(W, 'bank-holidays.json')
    try:
        with urllib.request.urlopen('https://www.gov.uk/bank-holidays.json', timeout=20) as r: j = json.load(r)
        days = sorted({e['date'] for div in ('england-and-wales', 'scotland', 'northern-ireland') for e in j[div]['events']})
        json.dump(days, open(cache, 'w'))
    except Exception:
        days = json.load(open(cache)) if os.path.exists(cache) else FALLBACK_BH
    return set(days)
BH = bank_holidays()
def is_wd(d): return d.weekday() < 5 and d.isoformat() not in BH
def add_wd(d, n):
    while n > 0:
        d += dt.timedelta(days=1)
        if is_wd(d): n -= 1
    return d
def next_wd(d):
    d += dt.timedelta(days=1)
    while not is_wd(d): d += dt.timedelta(days=1)
    return d
def on_or_next_wd(d):
    while not is_wd(d): d += dt.timedelta(days=1)
    return d
def add_months(d, m):
    y, mo = divmod(d.month - 1 + m, 12); y += d.year; mo += 1
    return dt.date(y, mo, min(d.day, calendar.monthrange(y, mo)[1]))

# ---------- policy table ----------
L = 'https://www.legislation.gov.uk/'
POLICY = {
 'regimes': {
  'foi': {'name': 'Freedom of Information Act 2000', 'rules': [
    {'k': 'foi_reply', 'what': 'Reply within 20 working days of receipt', 'n': '20 wd', 'cite': 'FOIA s.10(1)', 'url': L + 'ukpga/2000/36/section/10'},
    {'k': 'foi_pi', 'what': 'Public-interest extension: a “reasonable” further time; treated here as up to 20 more working days', 'n': '+20 wd', 'cite': 'FOIA s.10(3); s.45 Code of Practice', 'url': 'https://www.gov.uk/government/publications/freedom-of-information-code-of-practice'},
    {'k': 'foi_ir_ask', 'what': 'Ask for an internal review within 40 working days of the reply (code of practice, not statutory)', 'n': '40 wd', 'cite': 's.45 Code of Practice, para 5.3', 'url': 'https://www.gov.uk/government/publications/freedom-of-information-code-of-practice', 'hard': True},
    {'k': 'foi_ir_reply', 'what': 'Internal review outcome within 20 working days, 40 at most (code of practice target, not statutory)', 'n': '20–40 wd', 'cite': 's.45 Code of Practice, para 5.5', 'url': 'https://www.gov.uk/government/publications/freedom-of-information-code-of-practice'}]},
  'eir': {'name': 'Environmental Information Regulations 2004', 'rules': [
    {'k': 'eir_reply', 'what': 'Reply within 20 working days of receipt', 'n': '20 wd', 'cite': 'EIR reg 5(2)', 'url': L + 'uksi/2004/3391/regulation/5'},
    {'k': 'eir_ext', 'what': 'Extension to 40 working days where the request is complex and voluminous', 'n': '40 wd', 'cite': 'EIR reg 7(1)', 'url': L + 'uksi/2004/3391/regulation/7'},
    {'k': 'eir_ir_ask', 'what': 'Regulation 11 representations within 40 working days of the failure (statutory, separate from any FOIA review)', 'n': '40 wd', 'cite': 'EIR reg 11(2)', 'url': L + 'uksi/2004/3391/regulation/11', 'hard': True},
    {'k': 'eir_ir_reply', 'what': 'Reconsideration decided within 40 working days', 'n': '40 wd', 'cite': 'EIR reg 11(4)', 'url': L + 'uksi/2004/3391/regulation/11'}]},
  'sar': {'name': 'UK GDPR / Data Protection Act 2018 (subject access)', 'rules': [
    {'k': 'sar_reply', 'what': 'Reply within one month of receipt', 'n': '1 month', 'cite': 'UK GDPR Art.12(3). Law-enforcement processing by a competent authority is a separate right: DPA 2018 Part 3 s.45, one month under s.54', 'url': L + 'eur/2016/679/article/12'},
    {'k': 'sar_ext', 'what': 'Extension by two further months for complex or numerous requests, notified within the first month', 'n': '+2 months', 'cite': 'UK GDPR Art.12(3)', 'url': L + 'eur/2016/679/article/12'},
    {'k': 'sar_body_complaint', 'what': 'Complaint to the body’s data protection officer before the ICO', 'n': '1 month assumed', 'cite': 'DPA 2018 s.164A (complaints to controllers)', 'url': L + 'ukpga/2018/12/section/164A'},
    {'k': 'ico_dp', 'what': 'ICO complaint; the ICO asks for it within 3 months of the last meaningful contact', 'n': '3 months', 'cite': 'UK GDPR Art.77; DPA 2018 s.165; ICO practice', 'url': 'https://ico.org.uk/make-a-complaint/data-protection-complaints/', 'hard': True},
    {'k': 'dp_court', 'what': 'Compliance order from the court', 'n': 'no fixed limit', 'cite': 'DPA 2018 s.167', 'url': L + 'ukpga/2018/12/section/167'}]},
  'ico': {'name': 'Information Commissioner (FOI / EIR)', 'rules': [
    {'k': 'ico_foi', 'what': 'Complaint to the ICO, normally after the review (expected, not a statutory precondition); the ICO asks for it within 6 weeks of the final response (guidance)', 'n': '6 weeks', 'cite': 'FOIA s.50; EIR reg 18; ICO practice', 'url': 'https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/', 'hard': True},
    {'k': 'ico_backlog', 'what': 'ICO decision notice: worst case taken as 6 months from the complaint (case backlog)', 'n': '6 months', 'cite': 'FOIA s.50(3)', 'url': L + 'ukpga/2000/36/section/50'},
    {'k': 'ftt', 'what': 'Appeal to the First-tier Tribunal (General Regulatory Chamber) within 28 days of the decision notice', 'n': '28 days', 'cite': 'FOIA s.57; GRC Rules 2009 r.22(1)(b)', 'url': L + 'uksi/2009/1976/rule/22', 'hard': True}]},
  'complaint': {'name': 'Body’s own complaints procedure', 'rules': [
    {'k': 'stage1', 'what': 'Stage 1 (informal) response, Welsh model policy: 10 working days', 'n': '10 wd', 'cite': 'PSOW Model Complaints Policy', 'url': 'https://www.ombudsman.wales/complaints-standards-authority/'},
    {'k': 'stage2', 'what': 'Stage 2 (formal) response, Welsh model policy: 20 working days', 'n': '20 wd', 'cite': 'PSOW Model Complaints Policy', 'url': 'https://www.ombudsman.wales/complaints-standards-authority/'},
    {'k': 'psow', 'what': 'Public Services Ombudsman for Wales, within 12 months of becoming aware of the matter', 'n': '12 months', 'cite': 'Public Services Ombudsman (Wales) Act 2019', 'url': L + 'anaw/2019/3/contents', 'hard': True},
    {'k': 'phso', 'what': 'Parliamentary and Health Service Ombudsman, referred by an MP, within 12 months', 'n': '12 months', 'cite': 'Parliamentary Commissioner Act 1967 s.5, s.6(3)', 'url': L + 'ukpga/1967/13', 'hard': True},
    {'k': 'police', 'what': 'Police complaint to the force’s professional standards, review by the PCC or IOPC', 'n': '12 months', 'cite': 'Police Reform Act 2002 Sch.3', 'url': L + 'ukpga/2002/30/schedule/3'}]},
  'icr': {'name': 'HM Land Registry complaints', 'rules': [
    {'k': 'icr', 'what': 'Independent Complaints Reviewer after HM Land Registry’s own procedure', 'n': 'case dates', 'cite': 'HM Land Registry complaints procedure', 'url': 'https://www.gov.uk/government/organisations/land-registry/about/complaints-procedure'},
    {'k': 'phso', 'what': 'Then the Parliamentary and Health Service Ombudsman via an MP, within 12 months', 'n': '12 months', 'cite': 'Parliamentary Commissioner Act 1967 s.5, s.6(3)', 'url': L + 'ukpga/1967/13', 'hard': True}]},
  'none': {'name': 'No statutory clock', 'rules': [
    {'k': 'working', 'what': 'Working date set in the request; chaser the next working day, a second after 10 working days', 'n': 'own date', 'cite': 'Case schedule', 'url': ''},
    {'k': 'sar_fallback', 'what': 'If the body holds personal data, a subject access request starts a statutory clock', 'n': '1 month', 'cite': 'UK GDPR Art.15, Art.12(3)', 'url': L + 'eur/2016/679/article/15'}]},
 },
 'working_days': {'calendar': 'UK bank holidays in any part of the UK (FOIA s.10(6); EIR reg 2)', 'url': 'https://www.gov.uk/bank-holidays.json', 'count': 'Day 1 is the first working day after receipt'},
 'assumptions': ['Each matter follows its own regime: FOIA, EIR, subject access, law-enforcement access, deceased health records, Land Registry, archives and court records are separate routes. MPs, MSs and ombudsmen run in parallel and are never a prerequisite; tribunal and court time limits are never held back.', 'Every body takes the longest extension the rules allow.', 'Every reply is a refusal or a non-answer, so every review and escalation step is needed.', 'Our side acts on fixed dates: a chaser the working day after any lapse, a review request 5 working days after a refusal, a regulator complaint 5 working days after a review outcome, and never later than the hard date.'],
}
INST = {  # seed id prefix -> (published policy URL, ombudsman/route note)
 'hmlr': ('https://www.gov.uk/government/organisations/land-registry/about/complaints-procedure', 'ICO; ICR then PHSO via an MP'),
 'icr': ('https://www.gov.uk/government/organisations/land-registry/about/complaints-procedure', 'PHSO via an MP'),
 'swp': ('https://www.south-wales.police.uk/rqo/request/ri/request-information/rip/request-information-police/', 'ICO; police complaints via PCC / IOPC'),
 'vale': ('https://www.valeofglamorgan.gov.uk/en/our_council/freedom_of_information/Requests-for-Information.aspx', 'ICO; PSOW'),
 'tfw': ('https://tfw.wales/about-us/transparency/freedom-of-information', 'ICO'),
 'wo': ('https://www.ombudsman.org.uk/making-complaint', 'ICO; PHSO via an MP'),
 'hmcts': ('https://www.ombudsman.org.uk/making-complaint', 'PHSO via an MP'),
 'museum': ('https://museum.wales/freedom-of-information/', 'ICO'),
 'ico': ('https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/', 'First-tier Tribunal'),
 'cadw': ('https://www.gov.wales/freedom-of-information-responses', 'ICO; PSOW'),
 'wg': ('https://www.gov.wales/freedom-of-information-responses', 'ICO; PSOW'),
 'mod': ('https://www.gov.uk/government/organisations/ministry-of-defence/about/publication-scheme', 'ICO; PHSO via an MP'),
 'dwr': ('https://corporate.dwrcymru.com/en/community/environment/environmental-information-regulations', 'ICO; CCW'),
 'bp': ('https://www.bp.com/en/global/privacy/contact-us.html', 'SAR route; ICO'),
 'gld': ('https://www.gov.uk/guidance/bona-vacantia-and-freedom-of-information-foi-requests', 'ICO; PHSO via an MP'),
 'moj': ('https://www.ombudsman.org.uk/making-complaint', 'ICO; PHSO via an MP'),
 'cps': ('https://www.cps.gov.uk/publication/freedom-information', 'ICO; PHSO via an MP'),
 'he': ('https://historicengland.org.uk/about/what-we-do/access-to-information/placing-a-request/', 'ICO; PHSO via an MP'),
 'tna': ('https://discovery.nationalarchives.gov.uk/', 'ICO; PHSO via an MP'),
 'audit': ('https://www.audit.wales/openness-and-transparency/freedom-information', 'ICO'),
 'os': ('https://www.ordnancesurvey.co.uk/governance/public-information/foi-request', 'ICO'),
 'rct': ('https://www.ombudsman.wales/how-to-complain/', 'ICO; PSOW'),
 'natural': ('https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/', 'ICO'),
 'npcc': ('https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/', 'ICO'),
 'heneb': ('https://heneb.org.uk/contact/', 'ICO (EIR)'),
 'glam': ('https://glamarchives.gov.uk/visiting-us/tour/', 'ICO'),
 'lcc': ('http://www.llandough-cc.co.uk/Council_Policies_20122.aspx', 'ICO; PSOW'),
 'defra': ('https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs/about/personal-information-charter', 'ICO'),
 'nlw': ('https://www.library.wales/about-nlw/about-us/governance/information-management/freedom-of-information-act', 'ICO'),
 'hmrc': ('https://www.gov.uk/government/collections/valuation-office-agency-freedom-of-information-disclosure-log', 'ICO'),
 'rcahmw': ('https://rcahmw.gov.uk/services/rcahmw-library/', 'ICO'),
}

# ---------- forecast ----------
def ev(lst, t, date, who, label, rule, note=''):
    lst.append({'thread': t['id'], 'date': date.isoformat(), 'who': who, 'label': label, 'rule': rule, 'note': note})
def schedule_him(d, t):
    """Our fixed-date action: never in the past (catch-up = next working day from today), never before a hold."""
    hold = D(t['hold']) if t.get('hold') else None
    floor = t.get('_floor') or TODAY
    if d < floor: d = on_or_next_wd(floor)
    if hold and d < hold: d = on_or_next_wd(hold)
    return d
def regulator_chain(t, E, outcome, ico_rule='ico_foi'):
    file_on = schedule_him(add_wd(outcome, 5), t)
    hard = outcome + dt.timedelta(weeks=6)
    if file_on > hard: file_on = schedule_him(hard, t)
    ev(E, t, file_on, 'him', 'File ICO complaint' if file_on <= hard else 'File ICO complaint (past the usual 6 weeks: give the reason for the delay)', ico_rule)
    ev(E, t, hard, 'hard', 'Last safe day for the ICO complaint', ico_rule)
    dec = add_months(file_on, 6)
    ev(E, t, dec, 'them', 'ICO decision notice (worst case: 6 months)', 'ico_backlog')
    ev(E, t, dec + dt.timedelta(days=28), 'hard', 'Tribunal appeal deadline (28 days)', 'ftt')
    ev(E, t, schedule_him(add_wd(dec, 5), t), 'him', 'Lodge First-tier Tribunal appeal', 'ftt')
def review_chain(t, E, ir_asked, eir):
    due = add_wd(ir_asked, 40 if eir else 20)
    worst = add_wd(ir_asked, 40)
    if not eir: ev(E, t, due, 'them', 'Internal review outcome due', 'foi_ir_reply')
    ev(E, t, worst, 'them', 'Review outcome, latest (worst case: refusal upheld)' if not eir else 'Reconsideration due (worst case: refusal upheld)', 'eir_ir_reply' if eir else 'foi_ir_reply')
    ev(E, t, schedule_him(next_wd(due), t), 'him', 'Chaser if no review outcome', 'eir_ir_reply' if eir else 'foi_ir_reply')
    regulator_chain(t, E, worst)
def answered_chain(t, E, reply, eir):
    ask = schedule_him(add_wd(reply, 5), t)
    hard = add_wd(reply, 40)
    if ask > hard: ask = schedule_him(hard, t)
    ev(E, t, ask, 'him', 'Request internal review' if not eir else 'Ask for reconsideration (reg 11)', 'eir_ir_ask' if eir else 'foi_ir_ask')
    ev(E, t, hard, 'hard', 'Last day to ask for a review (40 working days)', 'eir_ir_ask' if eir else 'foi_ir_ask')
    review_chain(t, E, max(ask, TODAY), eir)
def forecast(t):
    E = []; s = D(t['start']); reg = t['regime']; st = t['stage']; eir = reg == 'eir'
    if reg in ('foi', 'eir') and st == 'awaiting_reply':
        due = add_wd(s, 20)
        if t.get('due_body') and D(t['due_body']) != due:
            ev(E, t, D(t['due_body']), 'them', 'Reply date given by the body', 'foi_reply' if not eir else 'eir_reply')
        ev(E, t, due, 'them', 'Statutory reply due (20 working days)', 'eir_reply' if eir else 'foi_reply')
        worst = add_wd(s, 40)
        ev(E, t, worst, 'them', 'Latest reply with maximum extension (worst case: refusal)', 'eir_ext' if eir else 'foi_pi')
        ev(E, t, schedule_him(next_wd(max(due, D(t.get('due_body') or due.isoformat()))), t), 'him', 'Chaser (if no reply)', 'eir_reply' if eir else 'foi_reply')
        ev(E, t, schedule_him(next_wd(worst), t), 'him', 'Second chaser: extension lapsed', 'eir_ext' if eir else 'foi_pi')
        answered_chain(t, E, worst, eir)
    elif reg in ('foi', 'eir') and st == 'awaiting_review':
        if t.get('due_body'): ev(E, t, D(t['due_body']), 'them', 'Review date given by the body', 'foi_ir_reply')
        review_chain(t, E, s, eir)
    elif reg in ('foi', 'eir') and st == 'answered':
        ev(E, t, s, 'them', 'Reply received (treated as a refusal)', 'eir_reply' if eir else 'foi_reply')
        answered_chain(t, E, s, eir)
    elif st in ('review_answered', 'regulator_window'):
        ev(E, t, s, 'them', 'Review outcome received (refusal upheld)', 'foi_ir_reply')
        regulator_chain(t, E, s)
    elif reg == 'sar':
        due = on_or_next_wd(add_months(s, 1)); worst = on_or_next_wd(add_months(s, 3))
        ev(E, t, due, 'them', 'SAR reply due (one month)', 'sar_reply')
        ev(E, t, schedule_him(next_wd(due), t), 'him', 'Chaser: ask for the data or the extension notice', 'sar_reply')
        ev(E, t, worst, 'them', 'Latest reply with two-month extension (worst case: partial)', 'sar_ext')
        cmp_ = schedule_him(next_wd(worst), t)
        ev(E, t, cmp_, 'him', 'Complaint to the body’s data protection officer', 'sar_body_complaint')
        dpo = add_months(cmp_, 1)
        ev(E, t, dpo, 'them', 'DPO complaint answer (worst case: none)', 'sar_body_complaint')
        ico = schedule_him(next_wd(dpo), t)
        ev(E, t, ico, 'him', 'File ICO data protection complaint', 'ico_dp')
        ev(E, t, add_months(dpo, 3), 'hard', 'Last safe day for the ICO complaint (3 months)', 'ico_dp')
        ev(E, t, add_months(ico, 6), 'them', 'ICO outcome (worst case: 6 months)', 'ico_backlog')
        ev(E, t, schedule_him(add_wd(add_months(ico, 6), 10), t), 'him', 'Next stage: compliance order application', 'dp_court')
    elif st == 'replied':
        ev(E, t, s, 'them', 'Reply received', 'working')
    elif reg == 'none':
        wd = D(t['due_body'])
        ev(E, t, wd, 'them', 'Reply by the date asked (no statutory clock)', 'working')
        c1 = schedule_him(next_wd(wd), t)
        ev(E, t, c1, 'him', 'Chaser (if no reply)', 'working')
        c2 = schedule_him(add_wd(c1, 10), t)
        ev(E, t, c2, 'him', 'Second chaser', 'working')
        ev(E, t, schedule_him(add_wd(c2, 5), t), 'him', 'Next stage: formal request (FOI / EIR / SAR) to start a statutory clock', 'sar_fallback')
    elif reg == 'ico':
        regulator_chain(t, E, s)
    elif reg == 'complaint':
        due = D(t['due_body'])
        ev(E, t, due, 'them', 'Complaint outcome target', 'stage1')
        ev(E, t, schedule_him(next_wd(due), t), 'him', 'Chaser (if no outcome)', 'stage1')
        s2 = schedule_him(add_wd(due, 5), t)
        ev(E, t, s2, 'him', 'Escalate to the final stage of the complaint', 'stage2')
        o2 = add_wd(s2, 20); ev(E, t, o2, 'them', 'Final-stage response (worst case: rejected)', 'stage2')
        regulator_chain(t, E, o2)
    elif reg == 'icr':
        ev(E, t, schedule_him(D(t['target']), t), 'him', 'Send the full ICR complaint (target)', 'icr')
        ev(E, t, D(t['hard']), 'hard', 'ICR complaint: last safe day', 'icr')
        dec = add_months(D(t['hard']), 6)
        ev(E, t, dec, 'them', 'ICR decision (worst case: 6 months, not upheld)', 'icr')
        ev(E, t, schedule_him(add_wd(dec, 5), t), 'him', 'Ask the MP to refer to the PHSO', 'phso')
        ev(E, t, add_months(dec, 12), 'hard', 'PHSO referral: 12-month limit', 'phso')
    # catch-up can stack several of our steps on one day: keep only the most advanced one (the last in chain order)
    seen = {}
    for i, e in enumerate(E):
        if e['who'] == 'him': seen[e['date']] = i
    E = [e for i, e in enumerate(E) if e['who'] != 'him' or seen[e['date']] == i]
    E.sort(key=lambda e: (e['date'], {'them': 0, 'hard': 1, 'him': 2}[e['who']]))
    return E

# ---------- threads ----------
def load_queue():
    try: return {q['id']: q for q in json.load(open(QUEUE))}
    except Exception: return {}
def build():
    seed = json.load(open(os.path.join(W, 'seed.json')))
    gv = json.load(open(os.path.join(W, 'gmail-verify.json'))) if os.path.exists(os.path.join(W, 'gmail-verify.json')) else {}
    queue = load_queue()
    scp = os.path.join(W, 'gmail-startcheck.json'); sck = json.load(open(scp)) if os.path.exists(scp) else {}
    rules = {r['k']: dict(r, regime=k) for k, v in POLICY['regimes'].items() for r in v['rules']}
    threads = []; events = []
    # level the catch-up: actions already past their date are spread at most PER_DAY threads per working day, earliest hard deadline first
    FC = {t['id']: forecast(t) for t in seed}
    late = []
    for t in seed:
        E = FC[t['id']]
        if any(e['who'] == 'him' and e['date'] == on_or_next_wd(TODAY).isoformat() for e in E):
            hard = min((e['date'] for e in E if e['who'] == 'hard' and e['date'] >= TODAY.isoformat()), default='9999')
            late.append((hard, t['id'], t))
    late.sort(); day = on_or_next_wd(TODAY); used = 0
    for hard, _, t in late:
        if used >= PER_DAY: day = next_wd(day); used = 0
        t['_floor'] = max(on_or_next_wd(TODAY), min(day, D(hard))) if hard != '9999' else day; used += 1
        FC[t['id']] = forecast(t)
    for t in seed:
        g = gv.get(t['id']) or {}
        msgs = g.get('msgs') or []
        dom = t.get('dom') or ''
        toks = [x.lower() for x in re.findall(r'"([^"]+)"', t.get('q') or '')]
        subj_ok = lambda m: not toks or any(x in (m.get('subject') or '').lower() for x in toks)
        theirs = [m for m in msgs if not m['mine'] and (not dom or dom.split('.')[0] in (m.get('from_domain') or '')) and subj_ok(m)]
        mine = [m for m in msgs if m['mine'] and subj_ok(m)]
        qids = re.findall(r'\b[QN]-[A-Z0-9-]+\b', t.get('src', ''))
        qs = [queue[q] for q in qids if q in queue]
        near = lambda m: abs((D(m['date']) - D(t['start'])).days) <= 3
        verified = any(near(m) for m in theirs + mine) or bool((sck.get(t['id']) or {}).get('found'))  # the clock-start date itself is seen in the mailbox
        sent_seen = max((m['date'] for m in mine), default=None)
        rec_seen = max((m['date'] for m in theirs), default=None)
        E = FC[t['id']]
        stage_txt = {'awaiting_reply': 'Waiting for their reply', 'awaiting_review': 'Waiting for internal review', 'answered': 'Reply in: review to request',
                     'review_answered': 'Review done: regulator next', 'regulator_window': 'Regulator complaint window open', 'complaint': 'Complaint with the body',
                     'complaint_prep': 'Complaint to the reviewer in preparation', 'replied': 'Replied: no further step scheduled'}[t['stage']]
        pol = INST.get(t['id'].split('-')[0], ('', 'ICO'))
        th = {k: t.get(k) for k in ('id', 'inst', 'type', 'ref', 'subject', 'stage', 'regime', 'start', 'due_body', 'hold', 'note')}
        th.update({'stage_text': stage_txt, 'policy_url': pol[0], 'route': pol[1],
                   'gmail': {'checked': g.get('checked_at'), 'found': len(msgs), 'last_sent': sent_seen, 'last_reply': rec_seen},
                   'date_check': 'gmail' if verified else 'record',
                   'queue': [{'id': q['id'], 'status': q.get('status'), 'deadline': q.get('deadline')} for q in qs]})
        # reply seen after the clock started: shown, forecast unchanged (worst case treats it as a non-answer)
        if rec_seen and rec_seen > t['start']: th['reply_after_start'] = rec_seen
        hard = [e for e in E if e['who'] == 'hard' and e['date'] >= TODAY.isoformat()]
        th['next_hard'] = hard[0]['date'] if hard else None
        nxt = [e for e in E if e['date'] >= TODAY.isoformat()]
        th['next'] = nxt[0] if nxt else None
        th['end'] = E[-1]['date'] if E else None
        threads.append(th); events += E
    for e in events: e['rule_cite'] = rules.get(e['rule'], {}).get('cite', ''); e['rule_url'] = rules.get(e['rule'], {}).get('url', '')
    events.sort(key=lambda e: (e['date'], e['thread']))
    meta = {'generated': dt.datetime.now(ZoneInfo('Europe/London')).isoformat(timespec='minutes'), 'today': TODAY.isoformat(), 'threads': len(threads), 'events': len(events), 'scenario': 'Worst-case schedule'}
    # queue items with a deadline that no seed row names: PROPOSED new rows (kept off the public site)
    named = set(q for t in seed for q in re.findall(r'\b[QN]-[A-Z0-9-]+\b', t.get('src', '')))
    prop = [{'id': q['id'], 'party': q.get('party'), 'deadline': q.get('deadline'), 'status': q.get('status')} for q in queue.values()
            if q.get('deadline') not in (None, 'none') and q['id'] not in named and q.get('status') not in ('done', 'answered', 'info')]
    json.dump(prop, open(os.path.join(W, 'proposed.json'), 'w'), indent=1, ensure_ascii=False)
    os.makedirs(DATA, exist_ok=True)
    json.dump({'meta': meta, 'threads': threads}, open(os.path.join(DATA, 'threads.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(POLICY, open(os.path.join(DATA, 'policy.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({'meta': meta, 'events': events}, open(os.path.join(DATA, 'forecast.json'), 'w'), ensure_ascii=False, indent=1)
    write_ics(threads, events)
    write_html(meta, threads, events)
    gate()
    return meta
def ics_esc(s): return s.replace('\\', '\\\\').replace(',', '\\,').replace(';', '\\;').replace('\n', '\\n')
def write_ics(threads, events):
    tm = {t['id']: t for t in threads}; now = dt.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//bucklerfamily.estate//emails//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
           'X-WR-CALNAME:Correspondence calendar', 'X-WR-TIMEZONE:Europe/London', 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H']
    tag = {'them': 'Due from them', 'him': 'Our action', 'hard': 'HARD DEADLINE'}
    for i, e in enumerate(events):
        t = tm[e['thread']]; d = D(e['date'])
        if d < TODAY - dt.timedelta(days=14): continue  # the feed carries the last two weeks and everything ahead
        uid = re.sub(r'[^a-z0-9]+', '-', (e['thread'] + '-' + e['label']).lower())[:90] + '@emails.bucklerfamily.estate'
        out += ['BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + now, 'DTSTART;VALUE=DATE:' + d.strftime('%Y%m%d'), 'DTEND;VALUE=DATE:' + (d + dt.timedelta(days=1)).strftime('%Y%m%d'),
                'SUMMARY:' + ics_esc(f"{tag[e['who']]}: {t['inst']} {t['ref']} — {e['label']}"),
                'DESCRIPTION:' + ics_esc(f"{t['type']} · {t['subject']}\nRule: {e['rule_cite']} {e['rule_url']}\nWorst-case schedule. https://emails.bucklerfamily.estate/#t-{t['id']}"),
                'CATEGORIES:' + tag[e['who']], 'TRANSP:TRANSPARENT']
        if e['who'] in ('him', 'hard') and d >= TODAY:
            out += ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + ics_esc(e['label']), 'TRIGGER:-PT15H' if e['who'] == 'him' else '-P2D', 'END:VALARM']
        out.append('END:VEVENT')
    out.append('END:VCALENDAR')
    lines = []
    for l in out:  # fold at 75 octets
        b = l.encode()
        while len(b) > 74:
            cut = 74
            while (b[cut] & 0xC0) == 0x80: cut -= 1
            lines.append(b[:cut].decode()); b = b' ' + b[cut:]
        lines.append(b.decode())
    open(os.path.join(SITE, 'emails.ics'), 'w', newline='').write('\r\n'.join(lines) + '\r\n')
def write_html(meta, threads, events):
    tpl = open(os.path.join(W, 'template.html')).read()
    obp = os.path.join(W, 'outbox.json')
    if os.path.exists(obp) and '<!--__OUTBOX__-->' in tpl:  # scheduled outbox (HubSpot send-email tasks with a planned send date), 22 Oct 2026
        import html as _h
        ob = json.load(open(obp)); rows = sorted(ob.get('items', []), key=lambda x: x['send'])
        fmt = lambda d: D(d).strftime('%a %-d %b %Y')
        li = ''.join(f'<li><b>{_h.escape(fmt(x["send"]))}</b> · {_h.escape(x["body"])}<br><span class="sub">Chases: {_h.escape(x["chases"])}</span><br><span class="sub">Route step: {_h.escape(x["step"])} · HubSpot task {_h.escape(x["task"])}</span>' + (f'<br><span class="sub">{_h.escape(x["note"])}</span>' if x.get('note') else '') + '</li>' for x in rows)
        box = (f'<details class="box" id="outbox" style="margin-top:14px"><summary><span>Scheduled outbox · {len(rows)} planned sends</span></summary><div class="inner">'
               f'<p class="sub" style="margin:0 0 8px">{_h.escape(ob.get("intro", ""))}</p><ol class="obx" style="margin:0;padding-left:18px;line-height:1.5">{li}</ol></div></details>')
        tpl = tpl.replace('<!--__OUTBOX__-->', box)
    blob = json.dumps({'meta': meta, 'threads': threads, 'events': events, 'policy': POLICY}, ensure_ascii=False).replace('</', '<\\/')
    open(os.path.join(SITE, 'index.html'), 'w').write(tpl.replace('/*__DATA__*/null', blob))
def gate():
    def strings(x):
        if isinstance(x, dict): return [s for k, v in x.items() if k not in ('url', 'rule_url', 'policy_url', 'id', 'thread', 'gmail', 'queue') for s in strings(v)]
        if isinstance(x, list): return [s for v in x for s in strings(v)]
        return [x] if isinstance(x, str) else []
    th = json.load(open(os.path.join(DATA, 'threads.json'))); fc = json.load(open(os.path.join(DATA, 'forecast.json')))
    tpl = open(os.path.join(W, 'template.html')).read()
    vis = re.sub(r'<script>.*?</script>|<style>.*?</style>|<[^>]+>', ' ', tpl, flags=re.S)
    text = '\n'.join(strings(th['threads']) + strings(fc['events']) + strings(POLICY)) + vis
    bad = [w for w in BANNED if re.search(r'\b' + re.escape(w) + r'\b', text, re.I)]
    if re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', '\n'.join(strings(th['threads']))): bad.append('email address')
    if bad: sys.exit('public-text gate failed: %s' % bad)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--gmail', action='store_true'); ap.add_argument('--publish', action='store_true'); ap.add_argument('--taskdir', default='')
    a = ap.parse_args()
    if a.gmail:
        if not a.taskdir: sys.exit('--gmail needs --taskdir (request files live in the current task dir)')
        subprocess.run(['timeout', '-k', '5', '2400', sys.executable, os.path.join(W, 'gmail_verify.py'), '--taskdir', a.taskdir])
        seed = json.load(open(os.path.join(W, 'seed.json')))
        sck = json.load(open(os.path.join(W, 'gmail-startcheck.json'))) if os.path.exists(os.path.join(W, 'gmail-startcheck.json')) else {}
        todo = [t['id'] for t in seed if not (sck.get(t['id']) or {}).get('found')]
        if todo: subprocess.run(['timeout', '-k', '5', '900', sys.executable, os.path.join(W, 'start_check.py'), a.taskdir, ','.join(todo)])
    m = build(); print(json.dumps(m))
    if a.publish:
        env = dict(os.environ); 
        if a.taskdir: env['TAB_TASK_ID'] = os.path.basename(a.taskdir.rstrip('/'))
        subprocess.run(['timeout', '-k', '5', '900', sys.executable, os.path.join(W, 'publish.py'), 'emails: daily refresh of the correspondence calendar — Sion\'s Tab agent'], env=env)
if __name__ == '__main__': main()
