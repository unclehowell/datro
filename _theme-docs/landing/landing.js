/* Reads /docs.json and re-renders the list in the chosen language. The page is also pre-rendered at build time. — Sion's Tab agent */
(function () {
  var main = document.getElementById('docs'); if (!main) return;
  var WORDS = {
    en: {html: 'Read online', pdf: 'Download PDF', also: 'Also in', v: 'v'},
    cy: {html: 'Darllen ar-lein', pdf: 'Lawrlwytho PDF', also: 'Hefyd yn', v: 'v'},
    es: {html: 'Leer en línea', pdf: 'Descargar PDF', also: 'También en', v: 'v'}
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; }
  function render(idx, lang) {
    var w = WORDS[lang] || WORDS.en, out = '';
    idx.collections.forEach(function (c) {
      var docs = idx.documents.filter(function (d) { return d.collection === c.id; });
      if (!docs.length) return;
      out += '<details class="coll" open><summary>' + esc(c.title[lang] || c.title.en || c.id) + '</summary><ul class="docs">';
      docs.forEach(function (d) {
        var L = d.languages.filter(function (l) { return l.code === lang; })[0] || d.languages[0];
        var others = d.languages.filter(function (l) { return l.code !== L.code; });
        out += '<li><details class="doc" id="' + esc(d.collection + '-' + d.document) + '"><summary><span class="t" lang="' + L.code + '">' + esc(L.title) +
          '</span><span class="m">' + w.v + esc(d.version) + ' · ' + esc(d.updated) + ' · ' + d.languages.map(function (l) { return l.code.toUpperCase(); }).join(' ') +
          '</span></summary><div class="body"><p lang="' + L.code + '">' + esc(L.summary) + '</p><div class="acts"><a class="html" href="' + esc(L.html) + '">' + w.html +
          '</a><a class="pdf" href="' + esc(L.pdf) + '" download>' + w.pdf + ' · ' + kb(L.pdf_bytes) + '</a></div>' +
          (others.length ? '<div class="other">' + w.also + ': ' + others.map(function (o) {
            return '<a href="' + esc(o.html) + '" lang="' + o.code + '">' + esc(o.name) + '</a><a href="' + esc(o.pdf) + '" download>PDF</a>'; }).join(' · ') + '</div>' : '') +
          '</div></details></li>';
      });
      out += '</ul></details>';
    });
    document.getElementById('list').innerHTML = out;
    document.documentElement.lang = lang; main.setAttribute('data-lang', lang);
    [].forEach.call(document.querySelectorAll('.langs button'), function (b) { b.setAttribute('aria-pressed', String(b.value === lang)); });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }
  }
  fetch('/docs.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(function (idx) {
    var all = []; idx.documents.forEach(function (d) { d.languages.forEach(function (l) { if (all.indexOf(l.code) < 0) all.push(l.code); }); });
    var saved = null; try { saved = localStorage.getItem('docs-lang'); } catch (e) {}
    var nav = (navigator.language || 'en').slice(0, 2), lang = saved && all.indexOf(saved) > -1 ? saved : (all.indexOf(nav) > -1 ? nav : 'en');
    document.querySelector('.langs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      try { localStorage.setItem('docs-lang', b.value); } catch (er) {}
      render(idx, b.value);
    });
    if (lang !== main.getAttribute('data-lang')) render(idx, lang);
  }).catch(function () {});
})();
