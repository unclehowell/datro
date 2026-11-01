# Bloculus brief, build notes (1.0.0, 2026-11-01)

- Sources: `source/` (Sphinx, conf.py version 1.0.0).
- HTML: `sphinx-build -b singlehtml -D language=en source <out>`, then theme CSS inlined into one page (`build/html/en/index.html`, images in `build/html/en/_images/`); theme fonts load from the earlier edition's build on library-datro.bucklerfamily.estate.
- PDF: the same single page printed with WeasyPrint (A4) to `build/latex/en/consortium_projects-brief_bloculus.pdf` (no LaTeX toolchain used).
- de / es / fr: `source/locales` is not updated for 1.0.0; translations pending.
- Earlier edition 0.0.1 (coastal pilot) stays at library-datro.bucklerfamily.estate under the same path.
