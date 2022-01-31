project = u'EVL - Web3.0 Mandate'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

today_fmt = 'Feburary 1st, 2022'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']
#html_logo = '_static/logo.png'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}


html_static_path = ['_static']

htmlhelp_basename = 'evl'


#latex_logo = '_static/logo.png'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Mandate | Version"

}


latex_documents = [
  (master_doc, 'hotspotbnb_apps-property_evlmandate.tex', 'EVL - Web3.0',
   u'Publisher(s): DATRO Consortium', 'manual'),
]

man_pages = [
  (master_doc, 'hotspotbnb_apps-property_evlmandate', u'EVL - Web3.0 Mandate',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'hotspotbnb_apps-property_evlmandate', u'EVL - Web3.0 Mandate',
   author, 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']

