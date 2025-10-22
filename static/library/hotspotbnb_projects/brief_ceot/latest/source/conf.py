project = u'CEoT Project Brief'
copyright = u'2021, DATRO Consortium'
author = u'CEoT Project Brief'

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

#today_fmt = 'May 02, 2021'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'consortium_projects-brief_ceot'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_projects-brief_ceot.tex', u'CEoT Brief',
     u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_projects-brief_ceot', u'CEoT Brief',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_projects-brief_ceot', u'CEoT Brief',
     author, 'consortium_projects-brief_ceot', 'CEoT Brief',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
