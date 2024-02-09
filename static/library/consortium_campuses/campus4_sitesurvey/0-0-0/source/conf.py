project = u'El Jamito - Hoyo del Cacao'
copyright = u'2021, DATRO Consortium'
author = u'Sion Buckler and Adrian Cronin'

version = u'0.0.0'
release = u'0.0.0'

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


htmlhelp_basename = 'datro_consortium-campus'


# latex_logo = '_static/logo.jpg'

latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "El Jamito, Hoyo del Cacao | Version"

}


latex_documents = [
  (master_doc, 'datro_consortium-campus.tex', u'DATRO Consortium',
   u'Author(s): Sion Buckler and Adrian Cronin', 'manual'),
]


man_pages = [
  (master_doc, 'datro_consortium-campus', u'DATRO Consortium',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'datro_consortium-campus', u'DATRO Consortium',
   author, 'datro_consortium-capus', 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
