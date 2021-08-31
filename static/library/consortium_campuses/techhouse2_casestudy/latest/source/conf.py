
project = u'Tech House II - Case Study'
copyright = u'2021, DATRO Consortium'
author = u'The Team @ DATRO Consortium'

version = u'0.0.0'
release = u'0.0.0'

extensions = ['sphinx.ext.autosectionlabel']

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

language = None

#today_fmt = 'Dec 09, 2019'

exclude_patterns = ['_build']


pygments_style = None


html_theme = 'sphinx_rtd_theme'

html_static_path = ['_static']


htmlhelp_basename = 'consortium_campuses-techhouse2_casestudy'


#latex_logo = '_static/logo.jpg'

latex_elements =  {

'classoptions': ',openany,oneside', 'babel' : '\\usepackage[english]{babel}',

'releasename': "Case Study  |  Version"

}


latex_documents = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy.tex', u'DATRO Consortium',
     u'Author: The Team @ DATRO Consortium', 'manual'),
]


man_pages = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy', u'DATRO Tech House II',
     [author], 1)
]



texinfo_documents = [
    (master_doc, 'consortium_campuses-techhouse2_casestudy', u'DATRO Tech House II',
     author, 'consortium_campuses-techhouse2_casestudy', 'DATRO Tech House II',
     'manual'),
]


epub_title = project


epub_exclude_files = ['search.html']
