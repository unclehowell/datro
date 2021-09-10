project = u'Site Survey - Jam Highland'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.2'
release = u'0.0.2'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'May 08, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']

htmlhelp_basename = 'consortium_campuses-campus4_sitesurvey'


latex_logo = '_static/logo.jpg'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "GPS:19.287486,-69.543597 | Version"

}


latex_documents = [
  (master_doc, 'consortium_campuses-campus4_sitesurvey.tex', 'Site Survey - Jam Highland',
   u'Publisher(s): DATRO Consortium', 'manual'),
]


man_pages = [
  (master_doc, 'consortium_campuses-campus4_sitesurvey', u'Site Survey - Jam Highland',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'consortium_campuses-campus4_sitesurvey', u'Site Survey - Jam Highland',
   author, 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
