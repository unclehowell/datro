/* docs.bucklerfamily.estate: PDF modal (owner, 23 Oct 2026: "when people select the pdf in docs it opens on a modal but is stored in
   wayback"). Any link to a .pdf (menus: red version buttons; pages: "This version (PDF)", older versions) opens an in-page dialog that
   draws the wayback file with pdf.js (works the same on phones, where browsers do not show PDFs in frames). The file stays on
   wayback.bucklerfamily.estate; "Open in new tab" and the link itself still work without JavaScript. Esc, the close button or a tap on
   the backdrop closes it. DOCS-STANDARD.md §7.4. — Sion's Tab agent */
(function () {
  if (window.__docsPdfModal) return; window.__docsPdfModal = true;
  var CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
  var lib = null, box = null, lastFocus = null, observer = null;
  function loadLib() {
    if (!lib) lib = import(CDN + 'pdf.min.mjs').then(function (m) { m.GlobalWorkerOptions.workerSrc = CDN + 'pdf.worker.min.mjs'; return m; });
    return lib;
  }
  var css = '.dpm{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:2vh 2vw}' +
    '.dpm-box{background:#fff;color:#111;width:min(1000px,96vw);height:96vh;max-height:96vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
    '.dpm-bar{display:flex;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-bottom:1px solid #ddd;font:500 14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f7}' +
    '.dpm-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dpm-new{color:#1C2E5C;text-decoration:underline;white-space:nowrap}' +
    '.dpm-x{border:0;background:#1C2E5C;color:#fff;font:600 20px/1 system-ui,sans-serif;width:36px;height:36px;border-radius:18px;cursor:pointer;flex:none}' +
    '.dpm-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#525659;padding:8px}' +
    '.dpm-page{background:#fff;margin:0 auto 8px;box-shadow:0 1px 4px rgba(0,0,0,.4);max-width:100%}' +
    '.dpm-page canvas{display:block;width:100%;height:auto}' +
    '.dpm-msg{color:#fff;font:15px/1.5 system-ui,sans-serif;text-align:center;margin:20px}.dpm-msg a{color:#FFB27A}' +
    '@media (max-width:600px){.dpm{padding:0}.dpm-box{width:100vw;height:100vh;max-height:100vh;height:100dvh;max-height:100dvh;border-radius:0}.dpm-body{padding:4px}}' +
    'html.dpm-open,html.dpm-open body{overflow:hidden!important}';
  function addCss() { if (document.getElementById('dpm-css')) return; var s = document.createElement('style'); s.id = 'dpm-css'; s.textContent = css; document.head.appendChild(s); }
  function isPdf(a) { var h = a.getAttribute('href') || ''; return /\.pdf(?:[?#]|$)/i.test(h); }
  function name(url) { try { return decodeURIComponent(url.split('?')[0].split('#')[0].split('/').pop()); } catch (e) { return url; } }
  function close() {
    if (!box) return;
    if (observer) { observer.disconnect(); observer = null; }
    box.remove(); box = null; document.documentElement.classList.remove('dpm-open');
    document.removeEventListener('keydown', onKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  function message(body, url, text) {
    body.innerHTML = '';
    var p = document.createElement('p'); p.className = 'dpm-msg'; p.textContent = text + ' ';
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open the PDF';
    p.appendChild(a); body.appendChild(p);
  }
  function open(url, opener) {
    close(); addCss(); lastFocus = opener;
    box = document.createElement('div'); box.className = 'dpm'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', name(url));
    box.innerHTML = '<div class="dpm-box"><div class="dpm-bar"><span class="dpm-t"></span><a class="dpm-new" target="_blank" rel="noopener">Open in new tab</a>' +
      '<button type="button" class="dpm-x" aria-label="Close">&times;</button></div><div class="dpm-body" tabindex="0"><p class="dpm-msg">Loading…</p></div></div>';
    box.querySelector('.dpm-t').textContent = name(url);
    box.querySelector('.dpm-new').href = url;
    box.querySelector('.dpm-x').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.body.appendChild(box); document.documentElement.classList.add('dpm-open');
    document.addEventListener('keydown', onKey, true);
    box.querySelector('.dpm-x').focus();
    var body = box.querySelector('.dpm-body'), mine = box;
    loadLib().then(function (pdfjs) { return pdfjs.getDocument({ url: url }).promise; }).then(function (doc) {
      if (box !== mine) return;
      body.innerHTML = ''; box.setAttribute('data-pages', doc.numPages); box.setAttribute('data-rendered', '0');
      var rendered = 0, pages = [];
      function draw(holder) {
        if (holder.getAttribute('data-done')) return; holder.setAttribute('data-done', '1');
        doc.getPage(+holder.getAttribute('data-n')).then(function (page) {
          var w = Math.max(200, body.clientWidth - 16), v1 = page.getViewport({ scale: 1 });
          var dpr = Math.min(window.devicePixelRatio || 1, 2), vp = page.getViewport({ scale: (w / v1.width) * dpr });
          var c = document.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
          holder.style.aspectRatio = ''; holder.appendChild(c);
          return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        }).then(function () { if (box === mine) box.setAttribute('data-rendered', String(++rendered)); });
      }
      for (var n = 1; n <= doc.numPages; n++) {
        var h = document.createElement('div'); h.className = 'dpm-page'; h.setAttribute('data-n', n); h.style.aspectRatio = '210 / 297';
        body.appendChild(h); pages.push(h);
      }
      draw(pages[0]);
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) draw(e.target); }); }, { root: body, rootMargin: '600px 0px' });
        pages.forEach(function (p) { observer.observe(p); });
      } else { pages.forEach(draw); }
    }).catch(function () { if (box === mine) message(body, url, 'This PDF could not be shown here.'); });
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !isPdf(a) || (box && box.contains(a))) return;
    e.preventDefault(); open(a.href, a);
  });
  window.docsOpenPdf = function (url) { open(url, document.activeElement); };
})();
