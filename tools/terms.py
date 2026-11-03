"""Relevance terms for the archive: a cited page is kept when its text concerns Great House Farm (Tŷ Mawr),
Llandough-juxta-Penarth, or the case, or when it is a cited record page (HER/NMR/archive/gazette/case-law). — Sion's Tab agent"""
import re
from urllib.parse import urlsplit
STRONG = [
    ('Great House Farm', r'great\s+house\s+farm'),
    ('Tŷ Mawr', r'\bt[ŷyŶY][\s\-]*mawr\b'),
    ('BP Properties', r'\bB\.?P\.?\s+properties\b'),
    ('BP v Buckler', r'\bB\.?P\.?\s+(properties\s+(ltd\.?\s+)?)?v\.?\s+buckler'),
    ('Coflein 20182', r'(nprn\s*:?\s*20182\b|/site/20182\b|\b20182\b.{0,40}(t[ŷy]\s*mawr|llandough))'),
    ('GGAT record', r'\bGGAT\s?\d{3,6}s?\b'),
    ('title number', r'\b(WA|CYM)\s?(231076|240304|513690|\d{6})\b'),
    ('Llandough', r'\bllandough\b|\bllandochau\b'),
]
WEAK = [('Buckler', r'\bbuckler\b')]
CONTEXT = r'llandough|penarth|great\s+house|t[ŷy]\s*mawr|glamorgan|\bfarm\b|land\s+registry'
_S = [(n, re.compile(p, re.I | re.S)) for n, p in STRONG]
_W = [(n, re.compile(p, re.I)) for n, p in WEAK]
_C = re.compile(CONTEXT, re.I)
RECORD_HOSTS = {
    'coflein.gov.uk': 'Coflein (NMRW)', 'archwilio.org.uk': 'Archwilio (HER)', 'heneb.org.uk': 'Heneb', 'ggat.org.uk': 'GGAT',
    'cadw.gov.wales': 'Cadw', 'cadwpublic-api.azurewebsites.net': 'Cadw', 'britishlistedbuildings.co.uk': 'listed building record',
    'library.wales': 'NLW', 'llyfrgell.cymru': 'NLW', 'newspapers.library.wales': 'NLW newspapers', 'journals.library.wales': 'NLW journals',
    'archives.library.wales': 'NLW archives', 'biography.wales': 'NLW biography', 'discovery.nationalarchives.gov.uk': 'TNA Discovery',
    'nationalarchives.gov.uk': 'TNA', 'caselaw.nationalarchives.gov.uk': 'Find Case Law', 'thegazette.co.uk': 'The Gazette',
    'london-gazette.co.uk': 'The Gazette', 'bailii.org': 'BAILII', 'casemine.com': 'case law', 'vlex.co.uk': 'case law',
    'judiciary.uk': 'case law', 'legislation.gov.uk': 'legislation', 'glamarchives.gov.uk': 'Glamorgan Archives',
    'peoplescollection.wales': "People's Collection Wales", 'historicengland.org.uk': 'Historic England', 'hansard.parliament.uk': 'Hansard',
    'senedd.wales': 'Senedd record', 'find-and-update.company-information.service.gov.uk': 'Companies House',
    'whatdotheyknow.com': 'FOI record', 'oldbaileyonline.org': 'court record', 'familysearch.org': 'genealogy record',
}
def is_record(url):
    h = urlsplit(url).netloc.lower()
    while h:
        if h in RECORD_HOSTS: return RECORD_HOSTS[h]
        h = h.split('.', 1)[1] if '.' in h else ''
    return ''
def match_terms(url, text):
    t = text or ''
    out = [n for n, rx in _S if rx.search(t)]
    if '/site/20182' in url and 'Coflein 20182' not in out: out.append('Coflein 20182')
    if any(rx.search(t) for n, rx in _W) and (out or _C.search(t)): out.append('Buckler')
    return out
PRIVACY = re.compile(r'robin\s+hill', re.I)   # family home address: never republished
def privacy_block(text): return bool(PRIVACY.search(text or ''))
