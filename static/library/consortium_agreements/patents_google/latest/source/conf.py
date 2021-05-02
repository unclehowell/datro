
project = u'DATRO & Google Inc. Patents'
copyright = u'2021, DATRO Consortium and Google Inc.'
author = u'Kirk W. Dailey, Google Inc.'

version = u'0.0.3'
release = u'0.0.3'



extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'consortium_agreements-patents_google'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_agreements-patents_google.tex', u'DATRO and Google Inc. Patents',
     u'Author(s): Kirk W. Dailey, Google Inc.', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_agreements-patents_google', u'DATRO and Google Inc. Patents',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_agreements-patents_google', u'DATRO and Google Inc. Patents',
     author, 'consortium_agreements-patents_google', 'DATRO and Google Inc. Patents',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
