
project = u'Project Mandate Guide'
copyright = u'2021, DATRO Consortium'
author = u'Project Mandate Guide'

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


htmlhelp_basename = 'consortium_projects-mandate_guide'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_projects-mandate_guide.tex', u'Mandate Guide',
     u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_projects-mandate_guide', u'Mandate Guide',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_projects-mandate_guide', u'Mandate Guide',
     author, 'consortium_projects-mandate_guide', 'Mandate Guide',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
