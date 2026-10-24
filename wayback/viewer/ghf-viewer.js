/*! ghf-viewer.js v1.0.0 — Wayback artifact viewer (popup modal). Single source: https://wayback.bucklerfamily.estate/viewer/ghf-viewer.js
 * Any site loads it with <script src="https://wayback.bucklerfamily.estate/viewer/ghf-viewer.js" defer></script>.
 * A click on a link to wayback.bucklerfamily.estate (or any link with data-ghf-view) opens the artifact in a modal
 * instead of leaving the page. Ctrl/Cmd/Shift/middle-click, download links and data-ghf-noview keep normal behaviour.
 * Images show as <img>, audio/video in native players, PDFs/HTML/text in a frame. "Open" and "Download" are always offered.
 * No dependencies, no tracking, styles isolated in a shadow root. Change control: library.bucklerfamily.estate/sop/wayback.html — Sion's Tab agent */
(function () {
  'use strict';
  if (window.__ghfViewer) return; window.__ghfViewer = '1.0.0';
  var HOSTS = ['wayback.bucklerfamily.estate', 'wayback-81x.pages.dev'];
  var IMG = /\.(jpe?g|png|gif|webp|avif|svg)$/i, AUD = /\.(mp3|m4a|wav|ogg|oga|opus|aac)$/i, VID = /\.(mp4|webm|mov|m4v)$/i;
  function wanted(a) {
    if (!a || !a.href || a.hasAttribute('download') || a.hasAttribute('data-ghf-noview')) return false;
    if (a.hasAttribute('data-ghf-view')) return true;
    var u; try { u = new URL(a.href, location.href); } catch (e) { return false; }
    if (HOSTS.indexOf(u.hostname) < 0) return false;
    if (location.hostname === u.hostname) return false; // on wayback itself, normal navigation
    return u.protocol === 'https:';
  }
  var host, root, dlg, body, title, openA, dlA, lastFocus;
  function build() {
    host = document.createElement('div'); host.setAttribute('data-ghf-viewer', '');
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' +
      ':host{all:initial}' +
      '.bk{position:fixed;inset:0;background:rgba(10,12,16,.72);z-index:2147483646;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box}' +
      '.bk.on{display:flex}' +
      '.bx{background:#fff;color:#111;width:min(1100px,100%);height:min(92vh,100%);border-radius:10px;display:flex;flex-direction:column;overflow:hidden;font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.4)}' +
      '@media (prefers-color-scheme:dark){.bx{background:#16181d;color:#eee}.bar{border-color:#2a2d34}.bar a,.bar button{color:#eee;border-color:#3a3e47}}' +
      '.bar{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #ddd}' +
      '.t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}' +
      '.bar a,.bar button{font:inherit;font-size:14px;color:#111;background:transparent;border:1px solid #ccc;border-radius:6px;padding:6px 10px;text-decoration:none;cursor:pointer;min-height:36px;box-sizing:border-box}' +
      '.bd{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#0000000a}' +
      '.bd iframe{border:0;width:100%;height:100%;background:#fff}' +
      '.bd img,.bd video{max-width:100%;max-height:100%;object-fit:contain}' +
      '.bd audio{width:92%}' +
      '@media (max-width:480px){.bk{padding:0}.bx{height:100%;border-radius:0}.dl{display:none}}' +
      '</style><div class="bk" part="backdrop"><div class="bx" role="dialog" aria-modal="true" aria-labelledby="ghfv-t">' +
      '<div class="bar"><span class="t" id="ghfv-t"></span><a class="op" target="_blank" rel="noopener">Open</a><a class="dl" download>Download</a><button class="x" type="button" aria-label="Close">✕</button></div>' +
      '<div class="bd"></div></div></div>';
    document.body.appendChild(host);
    dlg = root.querySelector('.bk'); body = root.querySelector('.bd'); title = root.querySelector('.t');
    openA = root.querySelector('.op'); dlA = root.querySelector('.dl');
    root.querySelector('.x').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  }
  function close() {
    if (!dlg) return; dlg.classList.remove('on'); body.innerHTML = '';
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function show(href, label) {
    if (!host) build();
    var path = href.split('#')[0].split('?')[0], el;
    if (IMG.test(path)) { el = document.createElement('img'); el.src = href; el.alt = label; }
    else if (AUD.test(path)) { el = document.createElement('audio'); el.src = href; el.controls = true; el.preload = 'metadata'; }
    else if (VID.test(path)) { el = document.createElement('video'); el.src = href; el.controls = true; el.playsInline = true; el.preload = 'metadata'; }
    else { el = document.createElement('iframe'); el.src = href; el.title = label; el.setAttribute('loading', 'eager'); }
    body.innerHTML = ''; body.appendChild(el);
    title.textContent = label; openA.href = href; dlA.href = href;
    dlA.style.display = /\.(pdf|jpe?g|png|gif|webp|mp3|m4a|wav|ogg|mp4|webm|txt)$/i.test(path) ? '' : 'none';
    lastFocus = document.activeElement; dlg.classList.add('on');
    document.documentElement.style.overflow = 'hidden';
    root.querySelector('.x').focus();
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!wanted(a)) return;
    e.preventDefault();
    var label = (a.getAttribute('data-ghf-title') || a.getAttribute('title') || a.textContent || '').trim().replace(/\s+/g, ' ');
    if (!label) { try { label = decodeURIComponent(new URL(a.href).pathname.split('/').pop()); } catch (x) { label = 'Artifact'; } }
    show(a.href, label.slice(0, 160));
  }, false);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlg && dlg.classList.contains('on')) close(); });
  window.ghfViewer = { open: function (href, label) { show(href, label || href); }, close: close, version: '1.0.0' };
})();
