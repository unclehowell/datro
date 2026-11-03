project = u'Bloculus - Project Brief: Cedwyn Estate Pilot'
copyright = u'2021-2026, DATRO Consortium'
author = u'DATRO Consortium'

version = u'1.0.0'
release = u'1.0.0'

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
}
html_title = u'Bloculus - Project Brief: Cedwyn Estate Pilot (version 1.0.0)'


html_static_path = ['_static']

htmlhelp_basename = 'consortium_projects-brief_bloculus'


latex_logo = '_static/logo.png'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Cedwyn Estate Pilot | Version"

}


latex_documents = [
  (master_doc, 'consortium_projects-brief_bloculus.tex', 'Bloculus - Project Brief: Cedwyn Estate Pilot',
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

# 1.0.0 (2026-11-01): retargeted to the Cedwyn estate pilot; see releasenotes.rst
