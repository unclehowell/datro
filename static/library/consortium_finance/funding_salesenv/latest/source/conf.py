project = u'Client ID - ENV'
copyright = u'2021, DATRO Consortium'
author = u'Scottish Bay LLC'

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

today_fmt = 'July 2nd, 2022'

exclude_patterns = ['_build']

numfig = True
numfig_format = {'figure': 'Figure %s', 'table:': 'Table: %s',
                 'code-block': 'Listing %s', 'section': 'Section %s'}


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_finance-funding_salesenv'


#latex_logo = '_static/logo.jpg'

latex_engine = 'xelatex'
latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version",

}


latex_documents = [
    (master_doc, 'consortium_finance-funding_salesenv.tex', u'Client ID - ENV',
     u'Author: Scottish Bay LLC', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_finance-funding_salesenv', u'Client ID - ENV',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_finance-funding_salesenv', u'Client ID - ENV',
     author, 'consortium_finance-funding_salesenv', 'Client ID - ENV',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']

