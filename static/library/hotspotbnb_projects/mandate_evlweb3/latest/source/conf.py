
project = u'Borderless Fiduciary'
copyright = u'2021, DATRO Consortium'
author = u'DATRO | UZZI | Client'

version = u'0.1.0'
release = u'0.1.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

#today_fmt = 'March 10th, 2022'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

latex_logo = '_static/logo.jpeg'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_projects-mandate_evlweb3'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Project Mandate | Version"

}


latex_documents = [
    (master_doc, 'consortium_projects-mandate_evlweb3.tex', u'Borderless Fiduciary',
     u'Author(s): DATRO | UZZI | Client', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_projects-mandate_evlweb3', u'Borderless Fiduciary',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_projects-mandate_evlweb3', u'Borderless Fiduciary',
     author, 'consortium_projects-mandate_evlweb3', 'Borderless Fiduciary',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
