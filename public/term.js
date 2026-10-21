/*! term.js — nomenclature term modal for bucklerfamily.estate sites · v1.0.0 (2026-10-21) · Sion's Tab agent
 * Tap a term that the records name in more than one way: a small dialog shows two icons,
 *   (i)  more information — the Legal Wiki page (greyed out when there is none)
 *   文A  nomenclature — every wording the records use, on nomenclature.bucklerfamily.estate (lit when that page exists).
 * Include once, at the end of <body>:
 *   <script src="https://nomenclature.bucklerfamily.estate/term.js" defer></script>
 * Options (attributes on that script tag):
 *   data-scope="main"        CSS selector of the region to scan (default: main, else body)
 *   data-lexicon="URL"        lexicon.json to use (default: lexicon.json beside this script)
 *   data-auto="off"           only mark elements that carry data-term="<concept id>" (no text scanning)
 *   data-max="3"              at most N automatic marks per concept per page (default 3)
 * Elements inside a, button, input, select, textarea, code, pre, h1–h3, dialog or [data-term-skip] are never scanned.
 * Mark a word yourself with <span data-term="great-house-farm">Tŷ Mawr</span>. */
(function () {
  if (window.GHFTerm) return; window.GHFTerm = "1.0.0";
  var me = document.currentScript || document.querySelector('script[src*="term.js"]');
  var base = me && me.src ? me.src.replace(/[^\/?#]*([?#].*)?$/, "") : "https://nomenclature.bucklerfamily.estate/";
  var opt = function (k, d) { return (me && me.getAttribute("data-" + k)) || d; };
  var LEX = opt("lexicon", base + "lexicon.json"), AUTO = opt("auto", "on") !== "off", MAX = +opt("max", "3") || 3;
  var I_INFO = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/></svg>';
  /* Material Icons "translate" glyph (Apache 2.0, Google) */
  var I_TR = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z"/></svg>';
  var css = ".nm-term{all:unset;cursor:pointer;border-bottom:1px dotted currentColor;color:inherit;font:inherit}" +
    ".nm-term:focus-visible{outline:2px solid #f2c94c;outline-offset:2px}" +
    "dialog.nm-dlg{width:min(420px,calc(100vw - 24px));padding:0;border:1px solid #555;border-radius:0;background:#0d0d0d;color:#fff;font-family:Barlow,system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "dialog.nm-dlg::backdrop{background:rgba(0,0,0,.6)}" +
    ".nm-in{padding:16px 16px 14px;position:relative}.nm-x{all:unset;position:absolute;top:6px;right:8px;font-size:24px;line-height:1;padding:6px 8px;cursor:pointer;color:#bbb}" +
    ".nm-k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9a9a9a;margin:0 34px 4px 0}.nm-t{font-size:20px;margin:0 34px 6px 0;font-weight:500}" +
    ".nm-s{font-size:14px;line-height:1.45;color:#cfcfcf;margin:0 0 12px}.nm-row{display:flex;gap:10px}" +
    ".nm-b{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border:1px solid #555;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.06em;text-transform:uppercase}" +
    ".nm-b:hover,.nm-b:focus-visible{background:#fff;color:#000;outline:none}.nm-b.off{opacity:.35;pointer-events:none;border-style:dashed}.nm-b.lit{border-color:#f2c94c;color:#f2c94c}" +
    "@media (prefers-color-scheme:light){html:not([data-ghf-native]) dialog.nm-dlg{background:#fff;color:#000;border-color:#999}html:not([data-ghf-native]) .nm-s{color:#333}html:not([data-ghf-native]) .nm-b{color:#000;border-color:#999}html:not([data-ghf-native]) .nm-b.lit{color:#8a6d00;border-color:#8a6d00}}";
  var st = document.createElement("style"); st.setAttribute("data-nm-term", ""); st.textContent = css; document.head.appendChild(st);
  var dlg, idx = {}, byId = {}, rx = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function open(id, word) {
    var c = byId[id]; if (!c) return;
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "nm-dlg"; dlg.setAttribute("aria-label", "Term"); document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); }
    var n = (c.variants || []).length, wiki = c.wiki, page = c.page && c.has_page !== false ? c.page : null;
    var here = page && location.href.split("#")[0].replace(/index\.html$/, "") === page;
    dlg.innerHTML = '<div class="nm-in"><button class="nm-x" type="button" aria-label="Close">×</button>' +
      '<p class="nm-k">' + (n > 1 ? n + " wordings in the records" : "In the records") + '</p><p class="nm-t">' + esc(word || c.name) + '</p>' +
      '<p class="nm-s">' + esc(c.name) + (c.summary ? " — " + esc(c.summary) : "") + "</p>" +
      '<div class="nm-row">' +
      (wiki ? '<a class="nm-b" href="' + esc(wiki) + '" target="_blank" rel="noopener" aria-label="More information on the Legal Wiki">' + I_INFO + "More info</a>"
            : '<span class="nm-b off" aria-disabled="true" title="No Legal Wiki page yet">' + I_INFO + "More info</span>") +
      (page ? '<a class="nm-b lit" href="' + esc(page) + '"' + (here ? ' aria-current="page"' : "") + ' aria-label="All the wordings the records use (nomenclature)">' + I_TR + "Nomenclature</a>"
            : '<span class="nm-b off" aria-disabled="true" title="No nomenclature page yet">' + I_TR + "Nomenclature</span>") +
      "</div></div>";
    dlg.querySelector(".nm-x").onclick = function () { dlg.close(); };
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function mark(el, id) {
    if (el.getAttribute("data-nm") === "1") return; el.setAttribute("data-nm", "1");
    el.classList.add("nm-term"); el.setAttribute("role", "button"); el.setAttribute("tabindex", "0");
    el.setAttribute("aria-haspopup", "dialog"); el.setAttribute("title", "Other names in the records");
    var go = function (e) { e.preventDefault(); open(id, el.textContent); };
    el.addEventListener("click", go); el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") go(e); });
  }
  var SKIP = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|CODE|PRE|SCRIPT|STYLE|H1|H2|H3|DIALOG|SVG|LABEL|OPTION)$/;
  function scan(root) {
    var count = {}, walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== root.parentNode; p = p.parentNode) { if (p.nodeType === 1 && (SKIP.test(p.tagName) || p.hasAttribute("data-term-skip") || p.hasAttribute("data-nm"))) return NodeFilter.FILTER_REJECT; }
      return rx.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; } }), list = [], n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (node) {
      var s = node.nodeValue, out = document.createDocumentFragment(), last = 0, m, any = false; rx.lastIndex = 0;
      var g = new RegExp(rx.source, "g" + (rx.flags.indexOf("i") > -1 ? "i" : ""));
      while ((m = g.exec(s))) {
        var hit = idx[m[1].toLowerCase()]; if (!hit) continue;
        count[hit] = (count[hit] || 0) + 1; if (count[hit] > MAX) continue;
        if (m.index > last) out.appendChild(document.createTextNode(s.slice(last, m.index)));
        var sp = document.createElement("span"); sp.textContent = m[1]; sp.setAttribute("data-term", hit); out.appendChild(sp); mark(sp, hit);
        last = m.index + m[1].length; any = true;
      }
      if (!any) return; if (last < s.length) out.appendChild(document.createTextNode(s.slice(last)));
      node.parentNode.replaceChild(out, node);
    });
  }
  function init(lex) {
    (lex.concepts || []).forEach(function (c) { byId[c.id] = c; (c.link_terms || []).forEach(function (t) { if (t.length > 2) idx[t.toLowerCase()] = c.id; }); });
    var root = document.querySelector(opt("scope", "main")) || document.body;
    [].forEach.call(document.querySelectorAll("[data-term]"), function (el) { if (byId[el.getAttribute("data-term")]) mark(el, el.getAttribute("data-term")); });
    if (!AUTO) return;
    var terms = Object.keys(idx).sort(function (a, b) { return b.length - a.length; })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!terms.length) return;
    rx = new RegExp("(?<![\\w\\u00C0-\\u024F])(" + terms.join("|") + ")(?![\\w\\u00C0-\\u024F])", "i");
    scan(root);
  }
  window.GHFTermOpen = open;
  fetch(LEX, { mode: "cors" }).then(function (r) { return r.json(); }).then(function (j) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(j); }); else init(j);
  }).catch(function () {});
})();
