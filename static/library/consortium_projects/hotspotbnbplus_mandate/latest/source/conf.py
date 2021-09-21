project = u'Hotspotβnβ+ Project Mandate'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

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
today_fmt = 'Sep 1, 2021'

exclude_patterns = ['_build']

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_logo = '_static/logo.jpeg'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}


pygments_style = None

html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_projects-hotspotbnbplus_mandate'


latex_logo = '_static/logo.jpeg'

latex_elements =  {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_projects-hotspotbnbplus_mandate.tex', u'Hotspotβnβ+ Project Mandate',
     u'Publisher(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_projects-hotspotbnbplus_mandate', u'Hotspotβnβ+ Project Mandate',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_projects-hotspotbnbplus_mandate', u'Hotspotβnβ+ Project Mandate',
     author, 'DR. Aridio Antnio Guzman Rosario', 'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
