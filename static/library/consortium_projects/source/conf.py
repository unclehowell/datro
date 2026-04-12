# Configuration file for the Sphinx documentation builder.

# -- Path setup --------------------------------------------------------------

import os
import sys
sys.path.insert(0, os.path.abspath('.'))


# -- Project information -----------------------------------------------------

project = 'Consortium Projects'
copyright = '2026, DATRO Consortium'
author = 'DATRO Consortium'


# -- General configuration ------------------------------------------------

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']


# -- Options for HTML output ---------------------------------------------------

html_theme = 'alabaster'
html_static_path = ['_static']
html_title = 'Consortium Projects'


# -- Language settings -----------------------------------------------------

language = 'en'
locale_dirs = ['locales/']
gettext_compact = False
