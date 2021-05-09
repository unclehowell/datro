project = u'Case Study: Campus One (2014)'
copyright = u'2021, DATRO Consortium'
author = u'The Team @ DATRO Consortium'

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
html_logo = '_static/logo.jpg'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}

htmlhelp_basename = 'consortium_campus-casestudy_campus1'


latex_logo = '_static/logo.jpg'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "GPS: 19°03'22.2''N 70°36'09.1''W | Version"

}


latex_documents = [
  (master_doc, 'consortium_campus-casestudy_campus1.tex', 'Case Study: Campus One (2014)',
   u'Author(s): The Team @ DATRO Consortium', 'manual'),
]


man_pages = [
  (master_doc, 'consortium_campus-casestudy_campus1', u'Case Study: Campus One (2014)',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'consortium_campus-casestudy_campus1', u'Case Study: Campus One (2014)',
   author, 'datro_consortium-capus', 'The Team @ DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
