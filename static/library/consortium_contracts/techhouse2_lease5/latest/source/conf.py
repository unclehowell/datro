project = u'Mountain View - Lease Agreement V'
copyright = u'2021, DATRO Consortium'
author = u'DR. Aridio Antnio Guzman Rosario'

version = u'0.0.1'
release = u'0.0.1'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

#language = None
language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"
today_fmt = 'Sep 16, 2021'

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


htmlhelp_basename = 'consortium_contracts-techhouse2_lease5'


latex_logo = '_static/logo.jpeg'

latex_elements =  {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_contracts-techhouse2_lease5.tex', u'Mountain View - Lease Agreement V',
     u'Publisher(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_contracts-techhouse2_lease5', u'Mountain View - Lease Agreement V',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_contracts-techhouse2_lease5', u'Mountain View - Lease Agreement V',
     author, 'DR. Aridio Antnio Guzman Rosario', 'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
