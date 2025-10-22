project = u'Element -  WebApp'
copyright = u'2021, DATRO Consortium'
author = u'New Vector Ltd'

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

today_fmt = 'July 24, 2021'

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

'releasename': "Communications Protocol | Version"

}


latex_documents = [
  (master_doc, 'hotspotbnb_apps-comms_element.tex', 'Element WebApp',
   u'Publisher: DATRO Consortium', 'manual'),
]

man_pages = [
  (master_doc, 'hotspotbnb_apps-comms_element', u'Element WebApp',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'hotspotbnb_apps-comms_element', u'Element WebApp',
   author, 'New Vector Ltd', 'New Vector Ltd',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
