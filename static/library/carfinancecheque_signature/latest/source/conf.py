project = "Car Finance Cheque - Signature Feature"
copyright = "2026, DATRO"
author = "DATRO Development Team"

version = "1.0"
release = "1.0"

extensions = ["sphinx.ext.autosectionlabel"]

templates_path = ["_templates"]

source_suffix = ".rst"

master_doc = "index"

language = None

today_fmt = "Mar 24, 2026"

exclude_patterns = ["_build"]

pygments_style = None

html_theme = "sphinx_rtd_theme"

html_static_path = ["_static"]

html_theme_options = {
    "logo_only": False,
    "display_version": True,
}

htmlhelp_basename = "carfinancecheque_signature"

latex_elements = {
    "classoptions": ",openany,oneside",
    "babel": "\\usepackage[english]{babel}",
    "releasename": "Car Finance Cheque Signature Feature",
}

latex_documents = [
    (
        master_doc,
        "carfinancecheque_signature.tex",
        "Car Finance Cheque - Signature Feature",
        "DATRO Development Team",
        "manual",
    ),
]

man_pages = [
    (
        master_doc,
        "carfinancecheque_signature",
        "Car Finance Cheque - Signature Feature",
        [author],
        1,
    )
]

texinfo_documents = [
    (
        master_doc,
        "carfinancecheque_signature",
        "Car Finance Cheque - Signature Feature",
        author,
        "carfinancecheque_signature",
        "DATRO Development Team",
        "manual",
    ),
]

epub_title = project
epub_exclude_files = ["search.html"]
