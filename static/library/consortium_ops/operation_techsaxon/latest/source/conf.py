project = u'Operation Tech Saxon'
copyright = u'2021, DATRO Consortium'
author = u'Sion Buckler'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
#gettext_compact = "docs"

extensions = ['sphinx_click.ext']

today_fmt = 'Dec 6, 2012'

gettext_compact = False     # optional.
exclude_patterns = ['_build']

pygments_style = None

html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_ops-operation_techsaxon'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_ops-operation_techsaxon.tex', u'Operation Tech Saxon',
     u'Author(s): Sion Buckler', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_ops-operation_techsaxon', u'Operation Tech Saxon',
     [author], 1)
]


texinfo_documents = [
    (master_doc, 'consortium_ops-operation_techsaxon', u'Operation Tech Saxon',
     author, 'consortium_ops-operation_techsaxon', 'Operation Tech Saxon',
     'manual'),
]

