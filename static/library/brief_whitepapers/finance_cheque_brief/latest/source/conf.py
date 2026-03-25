project = "Finance Cheque - Project Brief"
copyright = "2026, DATRO Consortium"
author = "DATRO Consortium"

version = "0.0.1"
release = "0.0.1"

extensions = ["sphinx.ext.autosectionlabel"]

templates_path = ["_templates"]

source_suffix = ".rst"

master_doc = "index"

language = "en"
locale_dirs = ["locales"]
gettext_auto_build = True
gettext_compact = "docs"

exclude_patterns = ["_build"]

pygments_style = None

html_theme = "sphinx_rtd_theme"

html_static_path = ["_static"]
html_logo = "_static/logo.png"
html_theme_options = {
    "logo_only": False,
    "display_version": True,
}

html_static_path = ["_static"]

htmlhelp_basename = "brief_whitepapers-finance_cheque_brief"

latex_logo = "_static/logo.png"

latex_elements = {
    "classoptions": ",openany,oneside",
    "babel": "\\usepackage[english]{babel}",
    "releasename": "Project Brief | Version",
}

latex_documents = [
    (
        master_doc,
        "brief_whitepapers-finance_cheque_brief.tex",
        "Finance Cheque - Project Brief",
        "Author(s): DATRO Consortium",
        "manual",
    ),
]

man_pages = [
    (
        master_doc,
        "brief_whitepapers-finance_cheque_brief",
        "Finance Cheque - Project Brief",
        [author],
        1,
    )
]

texinfo_documents = [
    (
        master_doc,
        "brief_whitepapers-finance_cheque_brief",
        "Finance Cheque - Project Brief",
        author,
        "datro_consortium",
        "DATRO Consortium",
        "manual",
    ),
]

epub_title = project


epub_exclude_files = ["search.html"]
