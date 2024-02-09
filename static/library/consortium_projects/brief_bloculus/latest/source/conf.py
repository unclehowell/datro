project = u'Bloculus - Project Brief'
copyright = u'2021, DATRO Consortium'
author = u'DATRO Consortium'

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

#today_fmt = 'Aug 24, 2021'

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

htmlhelp_basename = 'consortium_projects-brief_bloculus'


latex_logo = '_static/logo.png'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Communications Protocol | Version"

}


latex_documents = [
  (master_doc, 'consortium_projects-brief_bloculus.tex', 'Bloculus - Project Brief',
   u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
  (master_doc, 'consortium_projects-brief_bloculus', u'Bloculus - Project Brief',
   [author], 1)
]



texinfo_documents = [
  (master_doc, 'consortium_projects-brief_bloculus', u'Bloculus - Project Brief',
   author, 'datro_consortium-capus', 'DATRO Consortium',
   'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
