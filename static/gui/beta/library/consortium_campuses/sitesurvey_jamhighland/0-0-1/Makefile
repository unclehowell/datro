#.................................................
#         DATRO Consortium - 2021 Copyleft
#.................................................
#
#   ██████╗  █████╗ ████████╗██████╗  ██████╗
#   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗
#   ██║  ██║███████║   ██║   ██████╔╝██║   ██║
#   ██║  ██║██╔══██║   ██║   ██╔══██╗██║   ██║
#   ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝
#   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#................................................
#              Sphinx Custom Makefile
#................................................
#             Version 0.8 - gui.8cc.online
#................................................

# You can set these variables from the command line.
SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
SOURCEDIR     = source
BUILDDIR      = build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

$(DOCPDF): $(SUBDIR) $(TEXSRC) lbref.bib .git/index
	sh tools/vc -m
	python tools/mkhistory.py hist.tex
	pdflatex --interaction nonstopmode -halt-on-error -file-line-error $*.tex # >/dev/null
	makeindex -c -s myindex.ist $*.idx #2>/dev/null
	bibtex $* #>/dev/null
	pdflatex --interaction nonstopmode -halt-on-error -file-line-error $*.tex #>/dev/null
	makeindex -c -s myindex.ist $*.idx #2>/dev/null
	pdflatex  --interaction nonstopmode -halt-on-error -file-line-error $*.tex #>/dev/null
	rm -f $*.lo* *.aux $*.ilg $*.ind $*.toc $*.bbl $*.blg $*.out *.asc
