
project = u'DATRO Business Plan'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.5'
release = u'0.0.5'



extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'May 02, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'consortium_plans-operations_business'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_plans-operations_business.tex', u'DATRO Business Plan',
     u'Author(s): Sion H. Buckler, DATRO CONS.', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_plans-operations_business', u'DATRO Business Plan',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_plans-operations_business', u'DATRO Business Plan',
     author, 'consortium_plans-operations_business', 'DATRO Business Plan',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
