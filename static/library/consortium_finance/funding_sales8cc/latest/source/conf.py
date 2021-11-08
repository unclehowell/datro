project = u'Client ID - 8CC'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

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

today_fmt = 'Sep 01, 2021'

exclude_patterns = ['_build']

numfig = True
numfig_format = {'figure': 'Figure %s', 'table:': 'Table: %s',
                 'code-block': 'Listing %s', 'section': 'Section %s'}


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_finance-funding_sales8cc'


#latex_logo = '_static/logo.jpg'

latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_finance-funding_sales8cc.tex', u'Client ID - 8CC',
     u'Author: DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_finance-funding_sales8cc', u'Client ID - 8CC',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_finance-funding_sales8cc', u'Client ID - 8CC',
     author, 'consortium_finance-funding_sales8cc', 'Client ID - 8CC',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
