
project = u'DATRO Consortium Investments'
copyright = u'2021, DATRO Consortium'
author = u'The Team @ DATRO Consortium'

version = u'0.1.1'
release = u'0.1.1'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

#language = None
language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'May 25, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_finance-funding_investors'


#latex_logo = '_static/logo.jpg'

latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Investments  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_finance-funding_investors.tex', u'DATRO Consortium',
     u'Author: The Team @ DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_finance-funding_investors', u'DATRO Consortium Investments',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_finance-funding_investors', u'DATRO Consortium Investments',
     author, 'consortium_finance-funding_investors', 'DATRO Consortium Investments',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
