
project = u'DATRO Sample Document'
copyleft = u'2020, DATRO Consortium'
author = u'DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1-XX.1'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'


html_static_path = ['_static']


htmlhelp_basename = 'coming-soon'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'coming-soon.tex', u'DATRO Sample Document',
     u'Author(s): Datro Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'coming-soon', u'Datro Sample Document',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'coming-soon', u'DATRO',
     author, 'coming-soon', 'DATRO Consortium',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
