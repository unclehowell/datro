project = u'Tech House II - Case Study'
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
today_fmt = 'Sep 07, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_campuses-techhouse2_casestudy'

html_static_path = ['_static']
html_logo = '_static/logo.jpeg'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}
latex_logo = '_static/logo.jpeg'

latex_elements =  {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Latest Release  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy.tex', u'Tech House II',
     u'Publisher(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy', u'Tech House II',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy', u'Tech House II',
     author, 'consortium_campuses-techhouse2_casestudy', 'Tech House II',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
