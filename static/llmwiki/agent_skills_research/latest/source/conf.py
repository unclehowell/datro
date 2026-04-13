
project = u'DATRO LLMWiki - Agent Skills Research'
copyright = u'2024, DATRO Consortium'
author = u'The Team @ DATRO Consortium'

version = u'0.0.1'
release = u'0.0.1'

extensions = [
    'sphinx.ext.autosectionlabel',
    'myst_parser',
]

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

master_doc = 'index'

language = "en"
locale_dirs = ['locales']
gettext_auto_build = True
gettext_compact = "docs"

exclude_patterns = ['_build', '.vitepress']

pygments_style = None

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

htmlhelp_basename = 'agent-skills-research'

latex_elements = {
    'papersize': 'a4paper',
    'pointsize': '10pt',
}

latex_documents = [
    (master_doc, 'agent-skills-research.tex', u'Agent Skills Research', u'DATRO Consortium', 'manual'),
]

myst_enable_extensions = ["colon_fence", "deflist"]
