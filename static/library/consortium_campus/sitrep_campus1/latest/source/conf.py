project = u'SitRep: Campus One (2014)'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None

today_fmt = 'Aug 08, 2014'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']

htmlhelp_basename = 'consortium_campus-sitrep_campus1'


latex_logo = '_static/logo.jpg'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "GPS: ? | Version"

}


latex_documents = [
  (master_doc, 'consortium_campus-sitrep_campus1.tex', 'SitRep: Campus One (2014)',
   u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
  (master_doc, 'consortium_campus-sitrep_campus1', u'SitRep: Campus One (2014)',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'consortium_campus-sitrep_campus1', u'SitRep: Campus One (2014)',
   author, 'datro_consortium-capus', 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
