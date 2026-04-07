project = "StarSync Network Brief"
copyright = "2026, DATRO Consortium"
author = "DATRO Consortium - Second Brain (AI)"

version = "0.0.0"
release = "0.0.0"

extensions = ["sphinx.ext.autosectionlabel"]

source_suffix = ".rst"
master_doc = "index"
language = "en"
locale_dirs = ["locales"]
gettex_auto_build = True
gettex_compact = "docs"
exclude_patterns = ["_build"]
pygments_style = None
html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
htmlhelp_doc = "consortium_projects-brief_starnetwork"

latex_elements = {
    "classoptions": ",openany,oneside",
    "babel": "\\usepackage[english]{babel}",
}

latex_documents = [
    (master_doc, "consortium_projects-brief_starnetwork.tex",
     "StarSync Network Brief", "Author(s): DATRO Consortium", "manual"),
]
