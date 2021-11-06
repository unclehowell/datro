project = u'Vista De La Montańa - Contrato de Alquiler'
copyright = u'2021, Dr. Aridio Antonio Guzman Rosario'
author = u'Dr. Aridio Antonio Guzman Rosario'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

#language = None
language = "es"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"
today_fmt = 'Sep 01, 2021'

exclude_patterns = ['_build']

pygments_style = None


html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_logo = '_static/logo.jpeg'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}

html_static_path = ['_static']


htmlhelp_basename = 'consortium_contracts-techhouse2_lease5_es'


latex_logo = '_static/logo.jpeg'

latex_elements =  {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Apt. 4, Contrato V | Versión"

}


latex_documents = [
    (master_doc, 'consortium_contracts-techhouse2_lease5_es.tex', u'Vista De La Montańa',
     u'Autore(s): Dr. Aridio Antonio Guzman Rosario', 'howto'),
]


man_pages = [
    (master_doc, 'consortium_contracts-techhouse2_lease5_es', u'Vista De La Montańa',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_contracts-techhouse2_lease5_es', u'Vista De La Montańa',
     author, 'Dr. Aridio Antonio Guzman Rosario', 'howto'),
]


epub_title = project


epub_exclude_files = ['search.html']
