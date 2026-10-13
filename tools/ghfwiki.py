#!/usr/bin/env python3
"""Rebuild the Great House Farm wiki (greathousefarmwiki.wordpress.com) as a static site.

Sources, in order of preference (later sources never overwrite earlier ones):
  1. incoming/wxr/*.xml      WordPress export file (WXR) from WordPress.com
  2. incoming/wayback/**     Pages saved from the Wayback Machine (raw "id_" captures
                             or ordinary "Save page as" HTML; any folder layout)
  3. incoming/catalogue/*.html  Email correspondence catalogue pages built from Gmail

Output: site/<permalink path>/index.html for every page, plus site/index.html
(page tree), site/pages.json (machine-readable index) and site/missing.txt
(links found in pages that point at wiki pages not yet recovered).

Usage:  python3 tools/ghfwiki.py
"""
import html, json, re, sys, xml.etree.ElementTree as ET
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
HOST = "greathousefarmwiki.wordpress.com"
WB = re.compile(r"https?://web\.archive\.org/web/\d+(?:[a-z]{2}_)?/", re.I)

def norm_path(url):
    """Return the wiki permalink path ('/a/b/') for a URL, or None if off-site."""
    url = WB.sub("", url.strip())
    m = re.match(r"(?:https?:)?//(?:www\.)?" + re.escape(HOST) + r"(/[^?#]*)?", url)
    if m:
        p = m.group(1) or "/"
    elif url.startswith("/") and not url.startswith("//"):
        p = url.split("?")[0].split("#")[0]
    else:
        return None
    if re.search(r"/(wp-content|wp-includes|wp-json|feed|comments|xmlrpc)\b", p):
        return None
    return p if p.endswith("/") else p + "/"

def rewrite_links(body):
    def rep(m):
        attr, q, url = m.group(1), m.group(2), m.group(3)
        frag = url[url.index("#"):] if "#" in url else ""
        p = norm_path(url.split("#")[0]) if not url.startswith("#") else None
        if p:
            return f'{attr}={q}{p}{frag}{q}'
        return f'{attr}={q}{WB.sub("", url)}{q}'
    return re.sub(r'(href|src)=(["\'])(.*?)\2', rep, body)

class Extract(HTMLParser):
    """Pull title and main article content out of a WordPress (Archivist theme) page."""
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.title = ""; self._in_title = False
        self.depth = 0; self.capture = 0; self.buf = []; self.canon = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title": self._in_title = True
        if tag == "link" and a.get("rel") == "canonical": self.canon = a.get("href")
        cls = a.get("class", "") or ""
        if self.capture:
            self.capture += tag not in VOID
            self.buf.append(self.get_starttag_text())
        elif re.search(r"\b(entry-content|wp-block-post-content|post-content)\b", cls) and tag in ("div", "section", "article"):
            self.capture = 1
    def handle_endtag(self, tag):
        if tag == "title": self._in_title = False
        if self.capture:
            self.capture -= tag not in VOID
            if self.capture: self.buf.append(f"</{tag}>")
    def handle_data(self, d):
        if self._in_title: self.title += d
        if self.capture: self.buf.append(d)
    def handle_entityref(self, n):
        if self._in_title: self.title += f"&{n};"
        if self.capture: self.buf.append(f"&{n};")
    def handle_charref(self, n):
        if self._in_title: self.title += f"&#{n};"
        if self.capture: self.buf.append(f"&#{n};")
    def handle_comment(self, d):
        if self.capture: self.buf.append(f"<!--{d}-->")
VOID = {"br","img","hr","meta","link","input","source","col","area","base","wbr","embed","param","track"}

def clean_title(t):
    t = html.unescape(t).strip()
    return re.sub(r"\s*[–|-]\s*Great House Farm Wiki\s*$", "", t)

def load_wxr(pages):
    ns = {"wp": "http://wordpress.org/export/1.2/", "content": "http://purl.org/rss/1.0/modules/content/"}
    for f in sorted((ROOT / "incoming/wxr").glob("*.xml")):
        for item in ET.parse(f).getroot().iter("item"):
            if item.findtext("wp:post_type", namespaces=ns) not in ("page", "post"): continue
            if item.findtext("wp:status", namespaces=ns) not in ("publish", "private"): continue
            p = norm_path(item.findtext("link") or "")
            if p and p not in pages:
                pages[p] = dict(title=item.findtext("title") or p, body=item.findtext("content:encoded", namespaces=ns) or "",
                                source=f"WordPress export {f.name}", date=item.findtext("wp:post_date", namespaces=ns) or "")

def load_wayback(pages):
    for f in sorted((ROOT / "incoming/wayback").rglob("*")):
        if not f.is_file() or f.suffix.lower() not in (".html", ".htm", ""): continue
        raw = f.read_text(encoding="utf-8", errors="replace")
        raw = re.sub(r"<!-- BEGIN WAYBACK TOOLBAR INSERT -->.*?<!-- END WAYBACK TOOLBAR INSERT -->", "", raw, flags=re.S)
        ex = Extract(); ex.feed(raw)
        if not ex.buf: continue
        ts = re.search(r"/web/(\d{14})", raw)
        p = norm_path(ex.canon or "") if ex.canon else None
        if not p:  # fall back to folder layout web.archive.org/web/<ts>/<host>/<path>/index.html
            m = re.search(re.escape(HOST) + r"(/.*?)(?:index\.html?)?$", f.as_posix())
            p = norm_path((m.group(1) if m else "/" + f.stem + "/")) or "/"
        if p not in pages:
            pages[p] = dict(title=clean_title(ex.title) or p, body="".join(ex.buf),
                            source=f"Wayback Machine capture {ts.group(1) if ts else '(timestamp unknown)'}", date="")

def load_catalogue(pages):
    for f in sorted((ROOT / "incoming/catalogue").glob("*.html")):
        meta = f.with_suffix(".json")
        m = json.loads(meta.read_text()) if meta.exists() else {}
        p = m.get("path") or f"/records-access-chronology/foi-reply-register/{f.stem}/"
        if p not in pages:
            pages[p] = dict(title=m.get("title", f.stem.replace("-", " ")), body=f.read_text(encoding="utf-8"),
                            source=m.get("source", "Built from Gmail correspondence"), date="")

TEMPLATE = """<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} – Great House Farm Wiki</title><link rel="stylesheet" href="/assets/wiki.css"></head>
<body><header class="site"><a href="/">Great House Farm (Tŷ Mawr) Wiki</a> <span>reconstructed archive</span></header>
<nav class="crumbs">{crumbs}</nav><main><h1>{title}</h1>
<p class="provenance">Source: {source}. Original address: <a href="https://{host}{path}">https://{host}{path}</a></p>
{body}</main><footer>Reconstruction of greathousefarmwiki.wordpress.com · <a href="/">Page index</a></footer></body></html>"""

def main():
    pages = {}
    load_wxr(pages); load_wayback(pages); load_catalogue(pages)
    if not pages:
        sys.exit("No source pages found in incoming/. See README.md.")
    titles = {p: v["title"] for p, v in pages.items()}
    linked = set()
    for p, v in pages.items():
        body = rewrite_links(v["body"])
        linked |= {norm_path(u) for u in re.findall(r'href=["\'](/[^"\'#]*)', body)} - {None}
        parts = [s for s in p.strip("/").split("/") if s]
        crumbs = ['<a href="/">Index</a>'] + [
            f'<a href="/{"/".join(parts[:i+1])}/">{html.escape(titles.get("/" + "/".join(parts[:i+1]) + "/", parts[i]))}</a>'
            for i in range(len(parts) - 1)]
        out = SITE / p.strip("/") / "index.html" if p != "/" else SITE / "home" / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(TEMPLATE.format(title=html.escape(v["title"]), crumbs=" › ".join(crumbs), source=html.escape(v["source"]),
                                       host=HOST, path=p, body=body), encoding="utf-8")
    # page index
    tree = sorted(pages, key=lambda p: (p.count("/"), p))
    items = "".join(f'<li style="margin-left:{(p.count("/")-2)*1.2}em"><a href="{p}">{html.escape(titles[p])}</a></li>'
                    for p in sorted(pages))
    (SITE / "index.html").write_text(TEMPLATE.format(title="Page index", crumbs="", source=f"{len(pages)} pages recovered",
                                     host=HOST, path="/", body=f"<ul class='tree'>{items}</ul>"), encoding="utf-8")
    (SITE / "pages.json").write_text(json.dumps({p: {"title": v["title"], "source": v["source"]} for p, v in sorted(pages.items())},
                                                indent=1, ensure_ascii=False), encoding="utf-8")
    missing = sorted(p for p in linked if p not in pages and p != "/")
    (SITE / "missing.txt").write_text("\n".join(missing) + ("\n" if missing else ""), encoding="utf-8")
    print(f"{len(pages)} pages written to site/; {len(missing)} linked pages still missing (site/missing.txt)")

if __name__ == "__main__":
    main()
