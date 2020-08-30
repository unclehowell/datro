
project = u'Wave & Google Inc. Patents'
copyright = u'2018, Wave Telecom Limited. and Google Inc.'
author = u'Kirk W. Dailey, Google Inc.'

version = u'0.0.2'
release = u'0.0.2rc1'



extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'wave-organisation-google_patent_agreement'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'wave-organisation-google_patent_agreement.tex', u'Wave and Google Inc. Patents',
     u'Author(s): Kirk W. Dailey, Google Inc.', 'manual'),
]


man_pages = [
    (master_doc, 'wave-organisation-google_patent_agreement', u'Wave and Google Inc. Patents',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'wave-organisation-google_patent_agreement', u'Wave and Google Inc. Patents',
     author, 'wave-organisation-google_patent_agreement', 'Wave® and Google Inc. Patents',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
