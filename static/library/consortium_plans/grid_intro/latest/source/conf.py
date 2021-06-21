
project = u'DATRO Grid'
copyright = u'2021, DATRO Grid'
author = u'DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'



extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None


exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'



html_static_path = ['_static']


htmlhelp_basename = 'consortium_plans-grid_intro'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'consortium_plans-grid_intro.tex', u'DATRO Grid',
     u'Author(s): DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_plans-grid_intro', u'DATRO Grid',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_plans-grid_intro', u'DATRO Grid',
     author, 'consortium_plans-grid_intro', 'DATRO Grid',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
