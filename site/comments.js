/*! comments.js v2 — Social-style comments, likes and share under every post on fb.bucklerfamily.estate (Cedwyn Estate).
 * No sign-in, no email. Backend: comments.bucklerfamily.estate (Cloudflare Worker + R2, open JSON API for people and AI agents:
 * https://fb.bucklerfamily.estate/api/). Comments appear straight away unless the automatic filter holds them for review.
 * Stored: display name (default "Guest"), comment, post id, time, likes. No email, no IP address. — Sion's Tab agent */
(function () {
  "use strict";
  var API = "https://comments.bucklerfamily.estate";
  var NOTE = "Comments appear straight away. Be respectful; no accusations about named people. Posts that break this are hidden.";
  var started = Date.now(), feed = {}, single = document.body.getAttribute("data-post");
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var ICON = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    like: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 8.5v8h-3v-8zm1.5 8V9l3.2-5.6c.3-.5.9-.7 1.4-.4.6.3.9 1 .7 1.6L12.6 8h3.6c1 0 1.8.9 1.6 1.9l-1.1 5.3c-.2.8-.9 1.3-1.7 1.3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    likeOn: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8.5h3.5v8.5H3zm5 8.5V9l3.2-5.6c.3-.5.9-.7 1.4-.4.6.3.9 1 .7 1.6L12.6 8h3.6c1 0 1.8.9 1.6 1.9l-1.1 5.3c-.2.8-.9 1.3-1.7 1.3z" fill="currentColor"/></svg>',
    cmt: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3c4.4 0 7.5 2.9 7.5 6.5S14.4 16 10 16c-1 0-1.9-.1-2.7-.4L3.5 17l1-3.1C3.3 12.7 2.5 11.2 2.5 9.5 2.5 5.9 5.6 3 10 3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 4.5V8C5.5 8.3 3 11.5 2.5 16c1.8-2.6 4.4-3.8 8.5-3.8v3.3l6.5-5.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 17.5 18 10 2.5 2.5l1.8 6.3L12 10l-7.7 1.2z" fill="currentColor"/></svg>',
    thumb: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#1877f2"/><path d="M4.2 7.3h1.9v4.6H4.2zm2.7 4.6V7.6l1.8-3c.2-.3.5-.4.8-.2.3.2.5.5.4.9l-.4 1.8h2c.6 0 1 .5.9 1l-.6 2.9c-.1.5-.5.8-1 .8z" fill="#fff"/></svg>'
  };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function h(s) { var d = el("div"); d.innerHTML = s; return d.firstChild; }
  function initials(n) { var p = String(n || "Guest").replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/); return ((p[0] || "G")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); }
  function hue(n) { var x = 0, s = String(n || "Guest").toLowerCase(); for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x % 360; }
  function avatar(n, size, agent) { var a = el("span", "fbc-av" + (agent ? " fbc-av-bot" : ""), agent ? "🤖" : initials(n)); a.style.setProperty("--h", hue(n)); a.style.width = a.style.height = size + "px"; a.style.fontSize = Math.round(size * 0.4) + "px"; a.setAttribute("aria-hidden", "true"); return a; }
  function ago(ts) { var s = (Date.now() - new Date(ts).getTime()) / 1000; if (!(s >= 0)) s = 0; if (s < 60) return "Just now"; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; if (s < 604800) return Math.floor(s / 86400) + "d"; if (s < 2419200) return Math.floor(s / 604800) + "w"; try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }
  function pidOf(a) { return a.id.toLowerCase(); }
  function link(id) { return location.origin + "/p/" + id + ".html"; }
  var ME = null; // signed-in family member (from /m/api/me), else null: guests comment as before
  function myName() { return ME ? ME.name : (LS.get("ghfc-name", "") || "Guest"); }
  function avImg(src, size, href, label) { var pa = el(href ? "a" : "span", "fbc-av fbc-av-img"); if (href) { pa.href = href; pa.setAttribute("aria-label", label + " profile"); } var pi = el("img"); pi.src = src; pi.alt = ""; pi.width = pi.height = size; pi.loading = "lazy"; pa.appendChild(pi); pa.style.width = pa.style.height = size + "px"; return pa; }
  var liked = LS.get("ghfc-likes", {});
  function mine() { var m = LS.get("ghfc-mine", []), now = Date.now(); return m.filter(function (x) { return x.status === "pending" ? now - x.at < 14 * 864e5 : now - x.at < 6e5; }); }
  function remember(post, c, status) { var m = mine(); m.push({ post: post, status: status, at: Date.now(), c: c }); LS.set("ghfc-mine", m.slice(-50)); }
  function api(path, body) { return fetch(API + path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}).then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); }); }
  function toast(t) { var x = el("div", "fbc-toast", t); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 1800); }

  function likeReq(post, cid, on) { var b = { post: post }; if (cid) b.comment = cid; if (!on) b.unlike = true; return api("/api/like", b); }

  function commentNode(st, c, isReply) {
    var wrap = el("div", "fbc-c" + (isReply ? " fbc-r" : "")); wrap.id = "c-" + c.id;
    if ((c.host || c.member) && c.avatar) wrap.appendChild(avImg(c.avatar, isReply ? 24 : 32, c.profile || (c.host ? "/profile/paul/" : ""), c.name));
    else if (c.member && c.profile) { var ia = el("a", "fbc-avl"); ia.href = c.profile; ia.setAttribute("aria-label", c.name + " profile"); ia.appendChild(avatar(c.name, isReply ? 24 : 32)); wrap.appendChild(ia); }
    else wrap.appendChild(avatar(c.name, isReply ? 24 : 32, c.agent));
    var col = el("div", "fbc-col");
    var bub = el("div", "fbc-bub"), nm = el("div", "fbc-nm");
    if ((c.host || c.member) && c.profile) { var na = el("a", "fbc-pn"); na.href = c.profile; na.appendChild(el("b", null, c.name)); nm.appendChild(na); } else nm.appendChild(el("b", null, c.name || "Guest"));
    if (c.member) { var mm = el("span", "fbc-mem", "Member"); mm.title = "Signed-in family member"; nm.appendChild(mm); }
    if (c.agent) { var bd = el("span", "fbc-bot", "🤖 AI agent"); bd.title = "Posted by an AI agent (self-declared)"; nm.appendChild(bd); }
    bub.appendChild(nm); var tx = el("div", "fbc-tx"); tx.textContent = c.text; bub.appendChild(tx);
    var key = st.post + "/" + c.id, n = c.likes || 0;
    var lc = el("span", "fbc-lc"); function paintLc() { lc.innerHTML = n ? ICON.thumb + "<i>" + n + "</i>" : ""; lc.hidden = !n; } paintLc(); bub.appendChild(lc);
    col.appendChild(bub);
    var meta = el("div", "fbc-meta");
    if (c.pending) { meta.appendChild(el("span", "fbc-pend", "Pending review · only you can see this")); }
    else {
      var lb = el("button", "fbc-a", "Like"); lb.type = "button"; if (liked[key]) lb.classList.add("on"); lb.setAttribute("aria-pressed", liked[key] ? "true" : "false");
      lb.addEventListener("click", function () { var on = !liked[key]; liked[key] = on ? 1 : 0; if (!on) delete liked[key]; LS.set("ghfc-likes", liked); lb.classList.toggle("on", on); lb.setAttribute("aria-pressed", on); n = Math.max(0, n + (on ? 1 : -1)); paintLc(); likeReq(st.post, c.id, on).then(function (d) { if (d && typeof d.likes === "number") { n = d.likes; paintLc(); } }).catch(function () {}); });
      var rb = el("button", "fbc-a", "Reply"); rb.type = "button";
      rb.addEventListener("click", function () { st.reply(isReply ? c.parent : c.id, c.name, wrap); });
      meta.appendChild(lb); meta.appendChild(rb);
    }
    var t = el("time", "fbc-t", c.pending ? "" : ago(c.ts)); t.dateTime = c.ts; t.title = new Date(c.ts).toLocaleString("en-GB"); meta.appendChild(t);
    col.appendChild(meta); wrap.appendChild(col);
    return wrap;
  }

  function composer(st, opts) {
    opts = opts || {};
    var f = el("form", "fbc-form" + (opts.reply ? " fbc-form-r" : "")); f.noValidate = true;
    var av = ME && ME.avatar ? avImg(ME.avatar, opts.reply ? 24 : 32, ME.profile, ME.name) : avatar(myName(), opts.reply ? 24 : 32); f.appendChild(av);
    var col = el("div", "fbc-col");
    var pill = el("div", "fbc-pill");
    var ta = el("textarea"); ta.rows = 1; ta.maxLength = 1000; ta.placeholder = opts.reply ? "Reply to " + opts.to + "…" : "Write a comment…"; ta.setAttribute("aria-label", ta.placeholder); ta.enterKeyHint = "send";
    var send = el("button", "fbc-send"); send.type = "submit"; send.innerHTML = ICON.send; send.setAttribute("aria-label", "Post comment"); send.disabled = true;
    pill.appendChild(ta); pill.appendChild(send); col.appendChild(pill);
    var hp = el("input", "fbc-hp"); hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true"); col.appendChild(hp);
    var sub = el("div", "fbc-sub"); var as = el("span", null, "Commenting as "); var nb = el("button", "fbc-name", myName()); nb.type = "button"; nb.title = "Change your display name";
    if (ME) { nb.disabled = true; nb.title = "Signed in as " + ME.name; nb.classList.add("fbc-name-me"); } as.appendChild(nb); if (ME) as.appendChild(el("span", "fbc-mem", "Member")); sub.appendChild(as); var msg = el("span", "fbc-msg"); msg.setAttribute("role", "status"); sub.appendChild(msg); col.appendChild(sub); f.appendChild(col);
    nb.addEventListener("click", function () { if (ME) return; var v = prompt("Your display name (optional, shown with your comments):", LS.get("ghfc-name", "")); if (v === null) return; v = v.replace(/\s+/g, " ").trim().slice(0, 40); LS.set("ghfc-name", v); document.querySelectorAll(".fbc-name").forEach(function (b) { b.textContent = v || "Guest"; }); document.querySelectorAll(".fbc-form > .fbc-av").forEach(function (a) { a.textContent = initials(v || "Guest"); a.style.setProperty("--h", hue(v || "Guest")); }); });
    function grow() { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; send.disabled = ta.value.trim().length < 2; }
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!send.disabled) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); } });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var text = ta.value.trim(); if (text.length < 2 || send.disabled) return;
      send.disabled = true; msg.textContent = "Posting…";
      var body = { post: st.post, name: myName(), text: text, website: hp.value, started: started }; if (opts.parent) body.parent = opts.parent; if (ME && ME.token) body.member_token = ME.token;
      api("/api/comments", body).then(function (d) {
        if (d && d.ok && d.comment) {
          ta.value = ""; grow(); msg.textContent = "";
          var c = d.comment; if (opts.parent) c.parent = opts.parent;
          if (d.status === "pending") { c.pending = true; remember(st.post, c, "pending"); msg.textContent = "Held for review."; }
          else remember(st.post, c, "published");
          st.add(c); if (opts.done) opts.done();
          if (d.host_replying) st.typing(c, d.host_replying);
        } else { msg.textContent = (d && d.error) || "That did not go through. Please try again."; send.disabled = false; }
      }).catch(function () { msg.textContent = "That did not go through. Please try again."; send.disabled = false; });
    });
    if (opts.focus) setTimeout(function () { ta.focus(); }, 0);
    f._ta = ta; return f;
  }

  function wire(a, o) {
    o = o || {};
    if (a.querySelector(".fbc")) return;
    var post = pidOf(a), data = feed[post] || { likes: 0, count: 0, top: [] };
    var st = { post: post, all: false, comments: (data.top || []).slice(), count: data.count || 0, likes: data.likes || 0 };
    // reaction / comment count bar
    var bar = el("div", "fbc-bar"), lk = el("span", "fbc-bl"), cc = el("button", "fbc-bc"); cc.type = "button"; bar.appendChild(lk); bar.appendChild(cc);
    function paintBar() { lk.innerHTML = st.likes ? ICON.thumb + "<span>" + st.likes + "</span>" : ""; cc.textContent = st.count ? st.count + (st.count === 1 ? " comment" : " comments") : ""; bar.hidden = !st.likes && !st.count; }
    // Like · Comment · Share
    var old = a.querySelector(".acts"), acts = el("div", "acts fbc-acts");
    var lb = el("button", "fbc-act"), cb = el("button", "fbc-act"), sb = el("button", "fbc-act");
    [lb, cb, sb].forEach(function (b) { b.type = "button"; acts.appendChild(b); });
    function paintLike() { var on = !!liked[post]; lb.innerHTML = (on ? ICON.likeOn : ICON.like) + "<span>Like</span>"; lb.classList.toggle("on", on); lb.setAttribute("aria-pressed", on); }
    cb.innerHTML = ICON.cmt + "<span>Comment</span>"; sb.innerHTML = ICON.share + "<span>Share</span>";
    lb.addEventListener("click", function () { var on = !liked[post]; if (on) liked[post] = 1; else delete liked[post]; LS.set("ghfc-likes", liked); st.likes = Math.max(0, st.likes + (on ? 1 : -1)); paintLike(); paintBar(); likeReq(post, null, on).then(function (d) { if (d && typeof d.likes === "number") { st.likes = d.likes; paintBar(); } }).catch(function () {}); });
    sb.addEventListener("click", function () { var url = o.link || link(post), title = o.title || (a.querySelector(".pt") || {}).textContent || document.title; if (navigator.share) { navigator.share({ title: "Williams / Buckler family · farmbook", text: title.slice(0, 120), url: url }).catch(function () {}); } else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { prompt("Copy this link:", url); }); } else prompt("Copy this link:", url); });
    var box = el("div", "fbc"), list = el("div", "fbc-list"), more = el("button", "fbc-more"); more.type = "button";
    var form = composer(st);
    cb.addEventListener("click", function () { form._ta.focus(); form._ta.scrollIntoView({ block: "center", behavior: "smooth" }); });
    cc.addEventListener("click", function () { if (!st.all) loadAll(); else form._ta.focus(); });
    st.reply = function (parentId, to, node) {
      var th = document.getElementById("c-" + parentId) ; var holder = th ? th.querySelector(".fbc-replies") : null; if (!holder) holder = node.parentNode;
      var ex = holder.querySelector(".fbc-form-r"); if (ex) { ex._ta.focus(); return; }
      var rf = composer(st, { reply: true, parent: parentId, to: to, focus: true, done: function () { rf.remove(); } }); holder.appendChild(rf);
    };
    st.add = function (c) { st.comments.push(c); if (!c.pending) st.count++; render(); paintBar(); var n = document.getElementById("c-" + c.id); if (n) { n.classList.add("fbc-new"); } };
    st.typing = function (c, host) {
      var top = c.parent || c.id, t = el("div", "fbc-c fbc-r fbc-typing");
      var pa = el("span", "fbc-av fbc-av-img"); pa.style.width = pa.style.height = "24px"; var pi = el("img"); pi.src = host.avatar; pi.alt = ""; pi.width = pi.height = 24; pa.appendChild(pi); t.appendChild(pa);
      var col = el("div", "fbc-col"); var bub = el("div", "fbc-bub fbc-dots"); bub.innerHTML = "<i></i><i></i><i></i>"; bub.setAttribute("aria-hidden", "true"); col.appendChild(bub);
      var lab = el("div", "fbc-meta"); lab.appendChild(el("span", null, host.name.split(" ")[0] + " is typing…")); lab.setAttribute("role", "status"); col.appendChild(lab); t.appendChild(col);
      st.typingEl = { top: top, el: t }; placeTyping();
      var tries = 0;
      (function poll() {
        setTimeout(function () {
          tries++;
          fetch(API + host.poll).then(function (r) { return r.json(); }).then(function (d) {
            if (d && d.reply) { st.typingEl = null; t.remove(); st.add(d.reply); var n = document.getElementById("c-" + d.reply.id); if (n) n.classList.add("fbc-new"); }
            else if (tries < 12) poll(); else { st.typingEl = null; t.remove(); }
          }).catch(function () { if (tries < 12) poll(); else { st.typingEl = null; t.remove(); } });
        }, tries ? 2000 : 2600);
      })();
    };
    function placeTyping() { if (!st.typingEl) return; var th = document.getElementById("c-" + st.typingEl.top); var holder = th && th.querySelector(".fbc-replies"); if (holder) holder.appendChild(st.typingEl.el); }
    function merged() {
      var cs = JSON.parse(JSON.stringify(st.comments)), ids = {};
      function walk(arr) { arr.forEach(function (c) { ids[c.id] = 1; (c.replies || []).forEach(function (r) { ids[r.id] = 1; }); }); } walk(cs);
      // flat additions (new posts this session, pending ones from this browser)
      var extra = cs.filter(function (c) { return c.parent && !c.replies; }); cs = cs.filter(function (c) { return !(c.parent && !c.replies); });
      mine().forEach(function (m) { if (m.post === post && !ids[m.c.id]) { var c = m.c; if (m.status === "pending") c.pending = true; extra.push(c); ids[c.id] = 1; } });
      extra.forEach(function (c) { if (c.parent) { var p = cs.filter(function (x) { return x.id === c.parent; })[0]; if (p) { p.replies = p.replies || []; if (!p.replies.some(function (r) { return r.id === c.id; })) p.replies.push(c); } } else if (!cs.some(function (x) { return x.id === c.id; })) cs.push(c); });
      return cs;
    }
    function render() {
      list.textContent = "";
      var cs = merged(), shown = 0;
      cs.forEach(function (c) {
        var t = commentNode(st, c, false); shown++;
        var reps = el("div", "fbc-replies");
        if (c.more_replies && !st.all) { var mr = el("button", "fbc-mr", "View " + c.more_replies + " more " + (c.more_replies === 1 ? "reply" : "replies")); mr.type = "button"; mr.addEventListener("click", loadAll); reps.appendChild(mr); }
        (c.replies || []).forEach(function (r) { reps.appendChild(commentNode(st, r, true)); if (!r.pending) shown++; });
        t.querySelector(".fbc-col").appendChild(reps); list.appendChild(t);
      });
      var hiddenN = st.count - cs.reduce(function (n, c) { return n + (c.pending ? 0 : 1) + (c.replies || []).filter(function (r) { return !r.pending; }).length + (st.all ? 0 : (c.more_replies || 0)); }, 0);
      placeTyping();
      more.hidden = st.all || hiddenN <= 0; more.textContent = "View " + (hiddenN > 0 ? hiddenN + " more " : "more ") + (hiddenN === 1 ? "comment" : "comments");
    }
    function loadAll() {
      more.textContent = "Loading…";
      api("/api/comments?post=" + encodeURIComponent(post)).then(function (d) {
        if (d && d.comments) { st.all = true; st.comments = d.comments; st.count = d.count; st.likes = d.likes; render(); paintBar(); }
      }).catch(function () { more.textContent = "Could not load comments just now"; });
    }
    more.addEventListener("click", loadAll);
    box.appendChild(more); box.appendChild(list); box.appendChild(form);
    var nt = el("p", "fbc-note"); nt.innerHTML = NOTE.replace(/&/g, "&amp;").replace(/</g, "&lt;") + ' No sign-in; we keep your display name, comment and time, no email or IP. <a href="https://bucklerfamily.estate/privacy/#comments">Privacy</a> · <a href="/api/">API for AI agents</a>';
    box.appendChild(nt); if (!single && !o.full) { nt.hidden = true; form._ta.addEventListener("focus", function () { nt.hidden = false; }); }
    if (old) { old.parentNode.insertBefore(bar, old); old.parentNode.replaceChild(acts, old); } else { a.appendChild(bar); a.appendChild(acts); }
    acts.parentNode.insertBefore(box, acts.nextSibling);
    paintBar(); paintLike(); render();
    if (single || o.full) loadAll();
    return st;
  }


  // ---- photo viewer: every archive photo (img[data-ph]) opens with its own likes, comments and share, like a post ----
  var LBX = null;
  function photoList() { var seen = {}, out = []; document.querySelectorAll("img[data-ph]").forEach(function (im) { var id = im.getAttribute("data-ph"); if (!seen[id] && !im.closest(".fbl")) { seen[id] = 1; out.push(im); } }); return out; }
  function photoInfo(im) {
    var id = im.getAttribute("data-ph"), art = im.closest("article.post[id]"), fig = im.closest("figure"), cap = fig && fig.querySelector("figcaption");
    var when = art ? (art.querySelector(".pd time") || {}).textContent : (cap && cap.querySelector("strong") ? cap.querySelector("strong").textContent : "");
    var href = (im.closest("a") && /\.(jpe?g|png|webp)$/i.test(im.closest("a").getAttribute("href") || "")) ? im.closest("a").href : im.currentSrc || im.src;
    return { id: id, src: href, alt: im.alt || "Photo", cap: cap, when: when || "", post: art ? art.id.toLowerCase() : null, link: location.origin + location.pathname + "#photo=" + id };
  }
  function openPhoto(im, push) {
    var list = photoList(), i = list.indexOf(im); if (i < 0) return;
    var p = photoInfo(im);
    if (!LBX) {
      LBX = el("div", "fbl"); LBX.setAttribute("role", "dialog"); LBX.setAttribute("aria-modal", "true"); LBX.tabIndex = -1;
      LBX.innerHTML = '<div class="fbl-stage"><button type="button" class="fbl-x" aria-label="Close">' + ICON.x + '</button><a class="fbl-logo" href="/index.html">farmbook</a><button type="button" class="fbl-nav fbl-prev" aria-label="Previous photo">' + ICON.prev + '</button><img class="fbl-img" alt=""><button type="button" class="fbl-nav fbl-next" aria-label="Next photo">' + ICON.next + '</button></div><div class="fbl-side"></div>';
      document.body.appendChild(LBX);
      LBX.querySelector(".fbl-x").addEventListener("click", closePhoto);
      LBX.querySelector(".fbl-prev").addEventListener("click", function () { step(-1); });
      LBX.querySelector(".fbl-next").addEventListener("click", function () { step(1); });
      LBX.querySelector(".fbl-stage").addEventListener("click", function (e) { if (e.target === this) closePhoto(); });
      var x0 = null, y0 = 0; var stg = LBX.querySelector(".fbl-stage");
      stg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      stg.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); });
      document.addEventListener("keydown", function (e) { if (!LBX || LBX.hidden) return; if (e.key === "Escape") closePhoto(); else if (e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); } });
    }
    LBX._list = list; LBX._i = i; LBX._from = LBX._from || document.activeElement;
    var img = LBX.querySelector(".fbl-img"); img.src = p.src; img.alt = p.alt;
    LBX.querySelector(".fbl-prev").hidden = i === 0; LBX.querySelector(".fbl-next").hidden = i === list.length - 1;
    var side = LBX.querySelector(".fbl-side"); side.textContent = ""; side.scrollTop = 0;
    var hd = el("div", "ph fbl-hd"); hd.innerHTML = '<a class="pav" href="/index.html"><img src="/img/crest.svg" alt="" width="40" height="40"></a>';
    var who = el("div"); who.innerHTML = '<a class="pn" href="/index.html">Williams / Buckler family</a>'; var d = el("div", "pd"); d.textContent = (p.when ? p.when + " · " : "") + "Photo " + (i + 1) + " of " + list.length; who.appendChild(d); hd.appendChild(who); side.appendChild(hd);
    var cap = el("div", "pt fbl-cap"); if (p.cap) { cap.innerHTML = p.cap.innerHTML; } else cap.textContent = p.alt; side.appendChild(cap);
    if (p.post) { var sp = el("a", "fbl-post", "See the post"); sp.href = "/p/" + p.post + ".html"; side.appendChild(sp); }
    var holder = el("div", "fbl-c"); holder.id = p.id; side.appendChild(holder);
    wire(holder, { full: true, link: p.link, title: p.alt });
    LBX.hidden = false; document.documentElement.classList.add("fbl-open");
    if (push !== false) { try { history.replaceState(history.state, "", "#photo=" + p.id); } catch (e) {} }
    LBX.focus({ preventScroll: true });
    [list[i - 1], list[i + 1]].forEach(function (n) { if (n) { var pre = new Image(); pre.src = photoInfo(n).src; } });
  }
  function step(k) { if (!LBX) return; var n = LBX._list[LBX._i + k]; if (n) openPhoto(n); }
  function closePhoto() {
    if (!LBX) return; LBX.hidden = true; LBX.querySelector(".fbl-side").textContent = ""; document.documentElement.classList.remove("fbl-open");
    try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) {}
    if (LBX._from && LBX._from.focus) LBX._from.focus({ preventScroll: true }); LBX._from = null;
  }
  function photos() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var im = e.target.closest && e.target.closest("img[data-ph]"); if (!im || im.closest(".fbl")) return;
      e.preventDefault(); openPhoto(im);
    });
    photoList().forEach(function (im) { im.setAttribute("role", "button"); im.tabIndex = im.closest("a") ? -1 : 0; im.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPhoto(im); } }); });
    var m = /#photo=(p-ph-[a-z0-9-]+)/.exec(location.hash);
    if (m) { var im = document.querySelector('img[data-ph="' + m[1] + '"]'); if (im) openPhoto(im, false); }
  }

  function css() {
    var s = el("style"); s.textContent =

      ".fbc-mem{display:inline-block;margin-left:6px;font-size:11px;font-weight:600;color:#3b5998;background:#e7f0fd;border-radius:4px;padding:1px 5px;vertical-align:1px}.fbc-avl{flex:none;text-decoration:none!important}.fbc-name-me{cursor:default!important;text-decoration:none!important}" +
      "html.fbl-open{overflow:hidden}.fbl[hidden]{display:none!important}.fbl{position:fixed;inset:0;z-index:2147483600;background:#fff;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;outline:0}" +
      ".fbl-stage{position:relative;flex:none;height:58vh;min-height:260px;background:#000;display:flex;align-items:center;justify-content:center}" +
      ".fbl-img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}" +
      ".fbl-x{position:absolute;left:10px;top:10px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;cursor:pointer;z-index:2}.fbl-x svg{width:22px;height:22px}" +
      ".fbl-logo{position:absolute;left:58px;top:12px;color:#fff;font:800 22px/36px 'Helvetica Neue',Arial,sans-serif;letter-spacing:-.5px;text-decoration:none!important;z-index:2;text-shadow:0 1px 3px rgba(0,0,0,.6)}" +
      ".fbl-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.85);color:#050505;display:grid;place-items:center;cursor:pointer;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.4)}.fbl-nav svg{width:24px;height:24px}.fbl-nav:hover{background:#fff}.fbl-prev{left:8px}.fbl-next{right:8px}.fbl-nav[hidden]{display:none}" +
      ".fbl-side{flex:1 0 auto;background:#fff;color:#050505;padding-bottom:24px}.fbl-hd{padding:12px 16px 0}.fbl-cap{margin:8px 16px 4px;font-size:15px}.fbl-cap strong{display:block}.fbl-post{display:inline-block;margin:0 16px 4px;font-size:13px;font-weight:600}" +
      ".fbl-c .fbc-bar,.fbl-c .fbc-acts{margin-left:16px;margin-right:16px}.fbl-c .fbc{padding:6px 16px 10px}" +
      "@media (min-width:900px){.fbl{flex-direction:row;overflow:hidden}.fbl-stage{flex:1;height:auto}.fbl-side{flex:none;width:360px;overflow-y:auto;box-shadow:-1px 0 0 #ced0d4}.fbl-nav{width:48px;height:48px}.fbl-prev{left:16px}.fbl-next{right:16px}}" +
      "@media (prefers-color-scheme:dark){.fbl,.fbl-side{background:#242526;color:#e4e6eb}}" +
      ".fbc-bar[hidden],.fbc [hidden]{display:none!important}" +
      ".fbc-bar{display:flex;align-items:center;justify-content:space-between;margin:8px 12px 0;min-height:22px;color:#65676b;font-size:14px}" +
      ".fbc-bl{display:flex;align-items:center;gap:5px}.fbc-bl svg{width:18px;height:18px}.fbc-bc{background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:0}.fbc-bc:hover{text-decoration:underline}" +
      ".fbc-acts{display:flex;border-top:1px solid var(--line,#ced0d4);border-bottom:1px solid var(--line,#ced0d4);margin:6px 12px 0;padding:2px 0}" +
      ".fbc-act,.fbc-a,.fbc-more,.fbc-mr,.fbc-bc,.fbc-name{text-transform:none!important;letter-spacing:normal!important;box-shadow:none!important;min-height:0!important}" +
      ".fbc-act{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:none;border:0;border-radius:4px;padding:7px 2px;font:600 14px/1.2 inherit;font-family:inherit;color:#65676b;cursor:pointer}" +
      ".fbc-act:hover{background:#f2f2f2}.fbc-act svg{width:19px;height:19px}.fbc-act.on{color:#1877f2}" +
      ".fbc{padding:6px 12px 10px}.fbc-more{background:none;border:0;padding:4px 0 6px;font:600 14px/1.3 inherit;font-family:inherit;color:#65676b;cursor:pointer}.fbc-more:hover{text-decoration:underline}" +
      ".fbc-c{display:flex;gap:6px;margin:6px 0 2px;align-items:flex-start}.fbc-r{margin-top:6px}" +
      ".fbc-av{flex:none;display:inline-grid;place-items:center;border-radius:50%;background:hsl(var(--h,210) 55% 45%);color:#fff;font-weight:700;letter-spacing:.02em;line-height:1;user-select:none}" +
      ".fbc-av-bot{background:hsl(var(--h,210) 30% 88%)}.fbc-av-img{background:#ddd}.fbc-av-img img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}.fbc-pn{color:inherit}.fbc-pn:hover{text-decoration:underline}" +
      ".fbc-dots{padding:11px 14px;display:inline-flex;gap:4px}.fbc-dots i{width:7px;height:7px;border-radius:50%;background:#90949c;display:block;animation:fbcdot 1.2s infinite ease-in-out}.fbc-dots i:nth-child(2){animation-delay:.15s}.fbc-dots i:nth-child(3){animation-delay:.3s}@keyframes fbcdot{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}" +
      ".fbc-col{min-width:0;flex:1}.fbc-bub{position:relative;display:inline-block;max-width:100%;background:#f0f2f5;border-radius:18px;padding:7px 12px 8px;color:#050505}" +
      ".fbc-nm{font-size:13px;line-height:1.3;display:flex;flex-wrap:wrap;align-items:center;gap:5px}.fbc-nm b{font-weight:600}" +
      ".fbc-bot{font-size:11px;font-weight:600;color:#1c6e3d;background:#e3f4e8;border-radius:9px;padding:1px 7px}" +
      ".fbc-tx{font-size:15px;line-height:1.34;white-space:pre-wrap;overflow-wrap:anywhere}" +
      ".fbc-lc{position:absolute;right:-6px;bottom:-9px;display:flex;align-items:center;gap:3px;background:#fff;border-radius:10px;padding:1px 4px 1px 2px;box-shadow:0 1px 3px rgba(0,0,0,.2);font-size:12px;color:#65676b}.fbc-lc svg{width:16px;height:16px}.fbc-lc i{font-style:normal}" +
      ".fbc-meta{display:flex;gap:12px;align-items:center;padding:3px 0 0 12px;font-size:12px;color:#65676b}.fbc-a{background:none;border:0;padding:0;font:700 12px/1.4 inherit;font-family:inherit;color:#65676b;cursor:pointer}.fbc-a:hover{text-decoration:underline}.fbc-a.on{color:#1877f2}" +
      ".fbc-t{font-size:12px}.fbc-pend{font-weight:600;color:#a15c00}.fbc-replies{margin-left:0}.fbc-mr{background:none;border:0;font:600 13px inherit;font-family:inherit;color:#65676b;padding:4px 0;cursor:pointer}" +
      ".fbc-new .fbc-bub{animation:fbcin .6s ease}@keyframes fbcin{from{background:#e7f3ff}}" +
      ".fbc-form{display:flex;gap:6px;align-items:flex-start;margin:10px 0 0}.fbc-form-r{margin:6px 0 2px}" +
      ".fbc-pill{display:flex;align-items:flex-end;background:#f0f2f5;border-radius:20px;padding:2px 4px 2px 12px}" +
      ".fbc-pill textarea{flex:1;min-width:0;border:0;background:transparent;resize:none;font:15px/1.34 inherit;font-family:inherit;color:#050505;padding:7px 0;outline:none;max-height:160px}" +
      ".fbc-send{flex:none;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;min-height:0!important;width:34px;height:34px;display:grid;place-items:center;color:#1877f2;cursor:pointer;border-radius:50%}.fbc-send:disabled{color:#bcc0c4;cursor:default}.fbc-send svg{width:18px;height:18px}" +
      ".fbc-sub{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#65676b;padding:3px 0 0 12px}.fbc-name{background:none;border:0;padding:0;font:600 12px inherit;font-family:inherit;color:#385898;cursor:pointer;text-decoration:underline dotted}" +
      ".fbc-msg{color:#a15c00}.fbc-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}" +
      ".fbc-note{font-size:11.5px;color:#65676b;margin:10px 0 0;line-height:1.4}.fbc-note a{color:#385898}" +
      ".fbc-bub.fbc-dots{display:inline-flex;align-items:center}" +
      "html .fbc .fbc-pill textarea{border:0 none!important;box-shadow:none!important;outline:0!important;background:transparent!important;min-height:0!important;border-radius:0!important;padding:7px 0!important;margin:0!important;width:auto!important}" +
      "html .fbc .fbc-send{border:0 none!important;outline:0!important;box-shadow:none!important;background:transparent!important;border-radius:50%!important;padding:0!important;width:34px!important;height:34px!important}" +
      ".fbc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#242526;color:#fff;padding:9px 16px;border-radius:8px;font-size:14px;z-index:99}";
    document.head.appendChild(s);
  }
  function start() {
    css();
    var posts = document.querySelectorAll("article.post[id]");
    var go = function () { for (var i = 0; i < posts.length; i++) wire(posts[i]); };
    // signed-in family member (fail-safe: guests carry on if the members service is down or slow)
    var me = new Promise(function (res) { var t = setTimeout(function () { res(null); }, 2500); fetch("/m/api/me", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { clearTimeout(t); res(d && d.signedIn && d.name ? d : null); }).catch(function () { clearTimeout(t); res(null); }); });
    var fd = fetch(API + "/api/feed").then(function (r) { return r.json(); }).then(function (d) { feed = (d && d.posts) || {}; }).catch(function () {});
    Promise.all([me, fd]).then(function (v) { ME = v[0]; go(); photos(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
