
project = u'OpenHAB Application'
author = u'DATRO Consortium and the OpenHAB Community/ Foundation e.V.'

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


htmlhelp_basename = 'client-app-openhab'


latex_elements = { 'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}' }


latex_documents = [
    (master_doc, 'client-app-openhab.tex', u'OpenHAB Application',
     u'Author(s): DATRO Consortium and the OpenHAB Community/ Foundation e.V.', 'manual'),
]


man_pages = [
    (master_doc, 'client-app-openhab', u'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'client-app-openhab', u'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     author, 'client-app-openhab', 'DATRO Consortium and the OpenHAB Community/ Foundation e.V.',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
