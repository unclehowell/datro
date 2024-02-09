project = u'B-Fiduciary Highlight Reports'
copyright = u'2021, DATRO Consortium'
author = u'DATRO | UZZI | CLIENT'

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

#today_fmt = 'May 25, 2021'


html_static_path = ['_static']
#html_logo = '_static/logo.png'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
}
#latex_logo = '_static/logo.png'


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_projects-highlight_evlweb3'


latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Investments  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_projects-highlight_evlweb3.tex', u'DATRO | UZZI | CLIENT',
     u'Author: DATRO | UZZI | CLIENT', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_projects-highlight_evlweb3', u'B-Fiduciary Highlight Reports',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_projects-highlight_evlweb3', u'B-Fiduciary Highlight Reports',
     author, 'consortium_projects-highlight_evlweb3', 'B-Fiduciary Highlight Reports',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
