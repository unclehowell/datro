project = u'Hβnβ - Operation Federate'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None

#today_fmt = 'July 24, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

#html_static_path = ['_static']
#html_logo = '_static/logo.png'
#html_theme_options = {
#    'logo_only': False,
#    'display_version': True,
#}


html_static_path = ['_static']

htmlhelp_basename = 'HBnB'


#latex_logo = '_static/logo.png'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "User Manual | Version"

}


latex_documents = [
  (master_doc, 'hotspotbnb-op_federate.tex', 'HBnB - Operation Federate',
   u'Author(s): DATRO Consortium', 'manual'),
]

man_pages = [
  (master_doc, 'hotspotbnb-op_federate', u'HBnB - Operation Federate',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'hotspotbnb-op_federate', u'HBnB - Operation Federate',
   author, 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
