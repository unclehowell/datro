project = u'Weblate -  WebApp'
copyright = u'2021, DATRO Consortium'
author = u'Michal Čihař'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

#language = None
language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'Sep 01, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']
html_logo = '_static/logo.png'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}

latex_logo = '_static/logo.png'

html_static_path = ['_static']

htmlhelp_basename = 'hotspotbnb'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Translation Protocol | Version"

}


latex_documents = [
  (master_doc, 'hotspotbnb_apps-developers_weblate.tex', 'Weblate WebApp',
   u'Publisher(s): DATRO Consortium', 'manual'),
]

man_pages = [
  (master_doc, 'hotspotbnb_apps-developers_weblate', u'Weblate WebApp',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'hotspotbnb_apps-developers_weblate', u'Weblate WebApp',
   author, 'Michal Čihař', 'Michal Čihař',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
