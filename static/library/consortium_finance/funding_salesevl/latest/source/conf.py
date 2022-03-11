project = u'Client ID - EVL'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'January 27th, 2022'

exclude_patterns = ['_build']

numfig = True
numfig_format = {'figure': 'Figure %s', 'table:': 'Table: %s',
                 'code-block': 'Listing %s', 'section': 'Section %s'}


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_finance-funding_salesevl'


#latex_logo = '_static/logo.jpg'

latex_engine = 'xelatex'
latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version",

}


latex_documents = [
    (master_doc, 'consortium_finance-funding_salesevl.tex', u'Client ID - EVL',
     u'Author: DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_finance-funding_salesevl', u'Client ID - EVL',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_finance-funding_salesevl', u'Client ID - EVL',
     author, 'consortium_finance-funding_salesevl', 'Client ID - EVL',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
