
project = u'DATRO Consortium Investments'
copyright = u'2021, DATRO Consortium'
author = u'Sion Buckler, Founder'

version = u'0.1.7'
release = u'0.1.7'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None

# today_fmt = 'June 12, 2020'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'datro_consortium-investors-detailed'


latex_logo = '_static/logo.jpg'

latex_elements = {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Investments  |  Version",

'preamble': r'''

\usepackage[table]{xcolor}
\definecolor{border}{RGB}{236,137,29}
\definecolor{row}{RGB}{232,108,31}

\let\newtabular\tabular
\let\newendtabular\endtabular
\renewenvironment{tabular}{\rowcolors{2}{border}{row}\newtabular}{\newendtabular}

''',

}


latex_documents = [
    (master_doc, 'datro_consortium-investors_detailed.tex', u'DATRO Consortium',
     u'Author: Sion Buckler, Founder', 'manual'),
]


man_pages = [
    (master_doc, 'datro_consortium-investors_detailed', u'DATRO Consortium Investments',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'datro_consortium-investors_detailed', u'DATRO Consortium Investments',
     author, 'datro_consortium-investors_detailed', 'DATRO Consortium Investments',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
