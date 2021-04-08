
project = u'DATRO Consortium Investors'
copyright = u'2021, DATRO Consortium'
author = u'Sion Buckler, Founder'

version = u'0.1.7'
release = u'0.1.7'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None

# today_fmt = 'June 12, 2020'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'


html_static_path = ['_static']


htmlhelp_basename = 'datro_consortium-investors-detailed'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}'}


latex_documents = [
    (master_doc, 'datro_consortium-investors_detailed.tex', u'DATRO Consortium Investors',
     u'Author: Sion Buckler, Founder', 'manual'),
]


man_pages = [
    (master_doc, 'datro_consortium-investors_detailed', u'DATRO Consortium Investors',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'datro_consortium-investors_detailed', u'DATRO Consortium Investors',
     author, 'datro_consortium-investors_detailed', 'DATRO Consortium Investors',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
