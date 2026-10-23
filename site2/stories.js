/*! stories.js — Facebook-style Stories for farmbook (23 Oct 2026): a row of rings along the top of the wall; tap a ring for
 * full-screen slides (image, video or text), tap right/left or swipe to move, ✕ or Esc to close. Data: #fb-rings-data. — Sion's Tab agent */
(function () {
  "use strict";
  var D = document.getElementById("fb-rings-data"); if (!D) return;
  var R = JSON.parse(D.textContent), ov, ri = 0, si = 0, tm = null, x0 = null, y0 = null, seen = {};
  try { seen = JSON.parse(localStorage.getItem("fb-rings-seen") || "{}"); } catch (e) {}
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function mark() { document.querySelectorAll(".rg[data-ring]").forEach(function (a) { if (seen[a.getAttribute("data-ring")]) a.classList.add("rg-seen"); }); }
  function stop() { if (tm) { clearTimeout(tm); tm = null; } var v = ov && ov.querySelector("video"); if (v) v.pause(); }
  function close() { stop(); if (ov) { ov.remove(); ov = null; } document.documentElement.classList.remove("rg-open"); document.removeEventListener("keydown", key); mark(); }
  function go(d) {
    stop(); var r = R[ri]; si += d;
    if (si >= r.slides.length) { ri++; si = 0; if (ri >= R.length) return close(); }
    else if (si < 0) { ri--; if (ri < 0) { ri = 0; si = 0; } else si = R[ri].slides.length - 1; }
    show();
  }
  function show() {
    var r = R[ri], s = r.slides[si]; seen[r.id] = 1; try { localStorage.setItem("fb-rings-seen", JSON.stringify(seen)); } catch (e) {}
    ov.innerHTML = "";
    var bars = el("div", "rgv-bars"); r.slides.forEach(function (_, i) { var b = el("i"); var f = el("b"); if (i < si) f.style.width = "100%"; b.appendChild(f); bars.appendChild(b); }); ov.appendChild(bars);
    var hd = el("div", "rgv-hd"); var im = el("img"); im.src = s.av || r.av; im.alt = ""; hd.appendChild(im);
    var nm = el("div", "rgv-nm"); nm.appendChild(el("b", "", s.by || r.name)); nm.appendChild(el("span", "", s.d || "")); hd.appendChild(nm);
    var x = el("button", "rgv-x"); x.type = "button"; x.setAttribute("aria-label", "Close stories"); x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
    x.addEventListener("click", function (ev) { ev.stopPropagation(); close(); }); hd.appendChild(x); ov.appendChild(hd);
    var st = el("div", "rgv-st" + (s.img || s.video ? "" : " rgv-txt")); st.style.setProperty("--c", r.c || "#1c2e5c");
    var dur = 6500;
    if (s.video) { var v = el("video"); v.src = s.video; if (s.poster) v.poster = s.poster; v.playsInline = true; v.setAttribute("playsinline", ""); v.controls = false; v.muted = false; v.preload = "metadata";
      v.addEventListener("ended", function () { go(1); }); st.appendChild(v); var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.muted = true; v.play().catch(function () {}); }); dur = 0; }
    else if (s.img) { var i2 = el("img"); i2.src = s.img; i2.alt = s.alt || ""; st.appendChild(i2); }
    var cap = el("div", "rgv-cap"); if (s.t) cap.appendChild(el("strong", "", s.t)); if (s.x) cap.appendChild(el("p", "", s.x));
    if (s.u) { var a = el("a", "rgv-open", s.ul || "Open the post"); a.href = s.u; a.addEventListener("click", function (ev) { ev.stopPropagation(); close(); }); cap.appendChild(a); }
    st.appendChild(cap); ov.appendChild(st);
    var L = el("button", "rgv-tap rgv-l"); L.type = "button"; L.setAttribute("aria-label", "Previous"); L.addEventListener("click", function () { go(-1); });
    var Rt = el("button", "rgv-tap rgv-r"); Rt.type = "button"; Rt.setAttribute("aria-label", "Next"); Rt.addEventListener("click", function () { go(1); });
    ov.appendChild(L); ov.appendChild(Rt);
    var cur = bars.children[si] && bars.children[si].firstChild;
    if (cur) { if (dur) { cur.style.transition = "width " + dur + "ms linear"; requestAnimationFrame(function () { requestAnimationFrame(function () { cur.style.width = "100%"; }); }); tm = setTimeout(function () { go(1); }, dur); }
      else { var vv = st.querySelector("video"); vv.addEventListener("timeupdate", function () { if (vv.duration) cur.style.width = (100 * vv.currentTime / vv.duration) + "%"; }); } }
  }
  function key(ev) { if (ev.key === "Escape") close(); else if (ev.key === "ArrowRight") go(1); else if (ev.key === "ArrowLeft") go(-1); }
  function open(i) {
    ri = i; si = 0; ov = el("div", "rgv"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Stories"); ov.tabIndex = -1;
    ov.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
    ov.addEventListener("touchend", function (ev) { if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
      if (dy > 90 && Math.abs(dx) < 60) return close(); if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { ev.preventDefault(); stop(); ri += dx < 0 ? 1 : -1; si = 0; if (ri < 0) ri = 0; if (ri >= R.length) return close(); show(); } });
    document.body.appendChild(ov); document.documentElement.classList.add("rg-open"); document.addEventListener("keydown", key); show(); ov.focus();
  }
  document.querySelectorAll(".rg[data-ring]").forEach(function (a) {
    a.addEventListener("click", function (ev) { ev.preventDefault(); open(+a.getAttribute("data-i")); });
  });
  mark();
})();
