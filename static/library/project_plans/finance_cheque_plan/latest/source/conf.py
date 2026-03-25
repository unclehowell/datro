project = "Finance Cheque - Project Plan"
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

htmlhelp_basename = "project_plans-finance_cheque_plan"

latex_logo = "_static/logo.png"

latex_elements = {
    "classoptions": ",openany,oneside",
    "babel": "\\usepackage[english]{babel}",
    "releasename": "Project Plan | Version",
}

latex_documents = [
    (
        master_doc,
        "project_plans-finance_cheque_plan.tex",
        "Finance Cheque - Project Plan",
        "Author(s): DATRO Consortium",
        "manual",
    ),
]

man_pages = [
    (
        master_doc,
        "project_plans-finance_cheque_plan",
        "Finance Cheque - Project Plan",
        [author],
        1,
    )
]

texinfo_documents = [
    (
        master_doc,
        "project_plans-finance_cheque_plan",
        "Finance Cheque - Project Plan",
        author,
        "datro_consortium",
        "DATRO Consortium",
        "manual",
    ),
]

epub_title = project


epub_exclude_files = ["search.html"]
