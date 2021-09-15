project = u'OpenHAB WebApp'
copyright = U'(& OpenHAB Community/ Foundation e.V)'
author = u'DATRO Consortium and OpenHAB Community/ Foundation e.V.'

version = u'0.0.1'
release = u'0.0.1'


extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

exclude_patterns = ['_build']

today_fmt = 'Sep 09, 2021'

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


htmlhelp_basename = 'hotspotbnb_apps-smarthome_openhab'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'hotspotbnb_apps-smarthome_openhab.tex', u'OpenHAB WebApp',
     u'Publisher: DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'hotspotbnb_apps-smarthome_openhab', u'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'hotspotbnb_apps-smarthome_openhab', u'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     author, 'hotspotbnb_apps-smarthome_openhab', 'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
