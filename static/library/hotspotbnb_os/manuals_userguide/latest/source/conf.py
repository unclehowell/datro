project = u'HotspotBnB - User Guide'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.6'
release = u'0.0.6'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'


#language = None
language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'Sep 08, 2021'


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']
html_logo = '_static/logo.png'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}


html_static_path = ['_static']

htmlhelp_basename = 'Hotspotbnb'


latex_logo = '_static/logo.png'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "User Guide | Version"

}


latex_documents = [
  (master_doc, 'hotspotbnb_os-manuals_userguide.tex', 'HotspotBnB - User Guide',
   u'Author(s): DATRO Consortium', 'manual'),
]

man_pages = [
  (master_doc, 'hotspotbnb_os-manuals_userguide', u'HotspotBnB - User Guide',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'hotspotbnb_os-manuals_userguide', u'HotspotBnB - User Guide',
   author, 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
