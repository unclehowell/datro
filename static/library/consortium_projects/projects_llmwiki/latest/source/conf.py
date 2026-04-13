project = u'Email Marketing System - Technical Brief'
copyright = u'2026, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel', 'myst_parser']
templates_path = ['_templates']
source_suffix = '.rst'
master_doc = 'index'
language = None
today_fmt = 'April 12, 2026'
exclude_patterns = ['_build']
pygments_style = None

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_logo = '_static/logo.png'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}

htmlhelp_basename = 'consortium_email-marketing-brief'

latex_logo = '_static/logo.png'
latex_elements = {
    'classoptions': ',openany,oneside',
    'babel': '\\usepackage[english]{babel}',
    'releasename': "Technical Brief | Version"
}

latex_documents = [
    (master_doc, 'consortium_email-marketing-brief.tex',
     'Email Marketing System - Technical Brief',
     u'Author(s): DATRO Consortium', 'manual'),
]

man_pages = [
    (master_doc, 'consortium_email-marketing-brief',
     u'Email Marketing System - Technical Brief', [author], 1)
]

texinfo_documents = [
    (master_doc, 'consortium_email-marketing-brief',
     u'Email Marketing System - Technical Brief',
     author, 'datro_consortium', 'DATRO Consortium', 'manual'),
]

epub_title = project
epub_exclude_files = ['search.html']
