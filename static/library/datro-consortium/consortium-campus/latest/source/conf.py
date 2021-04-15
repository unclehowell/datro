project = u'"Jam Highland" Land Annexures'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'

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


latex_logo = '_static/logo.jpg'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "19.287486,-69.543597 | Version"

}


latex_documents = [
  (master_doc, 'datro_consortium-campus.tex', '"Jam Highland" Land Annexures',
   u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
  (master_doc, 'datro_consortium-campus', u'"Jam Highland" Land Annexures',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'datro_consortium-campus', u'"Jam Highland" Land Annexures',
   author, 'datro_consortium-capus', 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
