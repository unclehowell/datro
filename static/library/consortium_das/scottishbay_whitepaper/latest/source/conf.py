project = "Scottish Bay Whitepaper"
copyright = "2024, DATRO Consortium"
author = "The Team @ DATRO Consortium"

version = "0.0.1"
release = "0.0.1"

extensions = ["sphinx.ext.autosectionlabel"]

templates_path = ["_templates"]

source_suffix = ".rst"

master_doc = "index"

language = None

today_fmt = "Apr 12, 2024"

exclude_patterns = ["_build"]

pygments_style = None

html_theme = "sphinx_rtd_theme"

html_static_path = ["_static"]
html_logo = "_static/logo.jpg"
html_theme_options = {
    "logo_only": False,
    "display_version": True,
}

htmlhelp_basename = "consortium_das-scottishbay_whitepaper"

latex_logo = "_static/logo.jpg"
