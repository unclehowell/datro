
project = u'Whitepaper Disclaimer'
copyright = u'2021, DATRO Consortium'
author = u'Whitepaper Disclaimer'

version = u'0.0.0'
release = u'0.0.0'



extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

#today_fmt = 'May 02, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'consortium_legal-disclaimers_whitepapers'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_legal-disclaimers_whitepapers.tex', u'Whitepaper Disclaimer',
     u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_legal-disclaimers_whitepapers', u'Whitepaper Disclaimer',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_legal-disclaimers_whitepapers', u'Whitepaper Disclaimer',
     author, 'consortium_legal-disclaimers_whitepapers', 'Whitepaper Disclaimer',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
