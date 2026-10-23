# Shared Sphinx configuration for every document in this branch (DOCS-STANDARD.md §4).
# Documents carry no conf.py of their own: _theme-docs/build.py passes the document's doc.json in DOCS_DOC_JSON.
# — Sion's Tab agent
import json, os, datetime

_doc = json.load(open(os.environ['DOCS_DOC_JSON'], encoding='utf-8'))
_lang = os.environ.get('DOCS_LANG', _doc.get('source_language', 'en'))
_coll, _slug = _doc['id'].split('/')
_target = f'{_coll}-{_slug}'                                   # library pattern: <collection>-<document>.pdf

project = _doc['title']
author = _doc['author']                                        # an institution or a role, never a person's name
version = release = _doc['version']
copyright = f"{_doc['date'][:4]}, {_doc['author']}"
language = _lang
today = _doc['updated']

root_doc = master_doc = 'index'
source_suffix = {'.rst': 'restructuredtext'}
exclude_patterns = ['locales', '_build']
templates_path = ['_templates']
numfig = True                                                  # Figure/Table numbers come from the build, never typed in captions

# Languages: one English source, one gettext catalogue per language (the library's own method, sphinx-intl).
locale_dirs = ['locales']                                      # relative to the document's source/ folder
gettext_compact = 'docs'                                       # one catalogue per document: locales/<lang>/LC_MESSAGES/docs.po
gettext_auto_build = True                                      # .po is compiled to .mo at build time; .mo is never committed
gettext_uuid = False
gettext_location = False                                       # no file paths in catalogues

# HTML
html_theme = 'furo'
html_title = os.environ.get('DOCS_TITLE', project)
html_static_path = ['_static']
html_css_files = ['docs.css']
html_js_files = ['docs.js']
html_copy_source = False
html_show_sourcelink = False
html_show_sphinx = False
html_last_updated_fmt = '%Y-%m-%d'
html_permalinks_icon = '#'
html_baseurl = os.environ.get('DOCS_BASEURL', '')
html_theme_options = {
    # day = the family's white ground, night = its black ground (the page follows <html data-ghf-mode> through docs.js; no inversion);
    # the docs. accent pair (palette v3: navy #1C2E5C by day, apricot #FFB27A by night) is the brand colour.
    'light_css_variables': {
        'color-brand-primary': '#1C2E5C',
        'color-brand-content': '#1C2E5C',
        'color-background-primary': '#ffffff',
        'color-background-secondary': '#f6f6f7',
        'color-foreground-primary': '#111111',
        'font-stack': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'font-stack--headings': 'Georgia, "Times New Roman", serif',
    },
    'dark_css_variables': {
        'color-brand-primary': '#FFB27A',
        'color-brand-content': '#FFB27A',
        'color-background-primary': '#000000',
        'color-background-secondary': '#0c0c0e',
        'color-background-hover': '#1a1a1e',
        'color-background-border': '#2a2a2e',
        'color-foreground-primary': '#ffffff',
        'color-foreground-secondary': '#bdbdbd',
    },
    'sidebar_hide_name': False,
    'navigation_with_keys': True,
}
html_sidebars = {'**': ['sidebar/brand.html', 'sidebar/docs-links.html', 'sidebar/search.html',
                        'sidebar/scroll-start.html', 'sidebar/navigation.html', 'sidebar/scroll-end.html']}
html_context = {
    'docs_languages': json.loads(os.environ.get('DOCS_LANG_LINKS', '[]')),   # [{code, name, current}]
    'docs_lang': _lang,
    'docs_archive': json.loads(os.environ.get('DOCS_ARCHIVE', '[]')),          # [{version, date, pdf}] older editions in wayback
    'docs_archive_label': os.environ.get('DOCS_ARCHIVE_LABEL', 'Older versions (PDF)'),
    'docs_pdf': os.environ.get('DOCS_PDF', ''),                                # this version as PDF in wayback (doc.json "pdf")
    'docs_pdf_label': os.environ.get('DOCS_PDF_LABEL', 'This version (PDF)'),
    'docs_home': os.environ.get('DOCS_HOME_HREF', '/'),
    'docs_home_label': os.environ.get('DOCS_HOME_LABEL', 'All documents'),
    'docs_version': version,
}

# PDF (rinohtype: pure Python, no TeX). Used only by _theme-docs/release.py to archive a replaced edition to wayback;
# the deploy build makes HTML only.
rinoh_documents = [dict(
    doc='index',
    target=_target,
    title=os.environ.get('DOCS_TITLE', project),
    subtitle=os.environ.get('DOCS_SUBTITLE', f'Version {version}'),
    author=author,
    date=today,
    template=os.path.join(os.path.dirname(__file__), 'pdf.rtt'),
)]

# Welsh is not one of rinohtype's built-in languages; register it so captions read Ffigur / Tabl / Cynnwys.
try:
    import rinoh.language as _rl
    from rinoh.language import Language
    if Language.languages.get('cy', lambda: None)() is None:
        _rl.CY = Language('cy', 'Cymraeg', figure='Ffigur', table='Tabl', contents='Cynnwys',
                 list_of_figures='Rhestr ffigurau', list_of_tables='Rhestr tablau', chapter='Pennod', index='Mynegai',
                 attention='Sylw!', caution='Gofal!', danger='PERYGL!', error='Gwall', hint='Awgrym',
                 important='Pwysig', note='Nodyn', tip='Cyngor', warning='Rhybudd', seealso='Gweler hefyd')
except Exception:
    pass
