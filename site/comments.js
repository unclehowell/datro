/*! comments.js — moderated comments under each post on fb.bucklerfamily.estate (Cedwyn Estate).
 * Backend: comments.bucklerfamily.estate (Cloudflare Worker + R2). New comments wait for moderation and are not shown
 * until approved. Stored: optional display name, comment, post id, time. No email, no IP address. — Sion's Tab agent */
(function () {
  "use strict";
  var API = "https://comments.bucklerfamily.estate";
  var NOTE = "Comments are moderated. Be respectful; no allegations about named people.";
  var counts = {};
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function fmt(ts) { try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }
  function pid(a) { return "fb-" + a.id.replace(/[^a-z0-9-]/gi, "").toLowerCase(); }
  function label(btn, n) { btn.textContent = "💬 Comment" + (n ? " (" + n + ")" : ""); }
  function load(box, page) {
    var list = box.querySelector(".cm-list"); list.textContent = "Loading comments…";
    fetch(API + "/api/comments?page=" + encodeURIComponent(page)).then(function (r) { return r.json(); }).then(function (d) {
      list.textContent = "";
      var cs = (d && d.comments) || [];
      if (!cs.length) { list.appendChild(el("p", "cm-empty", "No comments yet.")); return; }
      cs.forEach(function (c) {
        var it = el("div", "cm-item"); var h = el("div", "cm-h");
        h.appendChild(el("b", null, c.name || "Anonymous")); h.appendChild(el("span", "cm-d", " · " + fmt(c.ts)));
        it.appendChild(h); var p = el("p", "cm-t"); p.textContent = c.text; it.appendChild(p); list.appendChild(it);
      });
    }).catch(function () { list.textContent = "Comments could not be loaded just now."; });
  }
  function form(box, page) {
    var f = el("form", "cm-form"); f.noValidate = true; var started = Date.now();
    f.innerHTML = '<label class="cm-l">Name (optional)<input name="name" maxlength="40" autocomplete="nickname"></label>' +
      '<label class="cm-l">Comment<textarea name="text" maxlength="1000" rows="3" required></textarea></label>' +
      '<label class="cm-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<div class="cm-row"><button type="submit" class="cm-send">Post comment</button><span class="cm-msg" role="status" aria-live="polite"></span></div>';
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = f.querySelector(".cm-msg"), btn = f.querySelector(".cm-send");
      var text = f.text.value.trim(); if (text.length < 3) { msg.textContent = "Please write a little more."; return; }
      btn.disabled = true; msg.textContent = "Sending…";
      fetch(API + "/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: page, name: f.name.value, text: text, website: f.website.value, started: started }) })
        .then(function (r) { return r.json().then(function (d) { return [r.ok, d]; }); })
        .then(function (x) { if (x[0]) { f.reset(); msg.textContent = "Thank you. Your comment is waiting for moderation."; } else { msg.textContent = (x[1] && x[1].error) || "That did not go through. Please try again."; } btn.disabled = false; })
        .catch(function () { msg.textContent = "That did not go through. Please try again."; btn.disabled = false; });
    });
    return f;
  }
  function wire(a) {
    var btn = a.querySelector(".acts .cmt"); if (!btn || a.querySelector(".cm-box")) return;
    var page = pid(a);
    var b = el("button", "cmt cm-toggle"); b.type = "button"; b.setAttribute("aria-expanded", "false");
    label(b, counts[page]); btn.parentNode.replaceChild(b, btn);
    var box = el("div", "cm-box"); box.hidden = true; box.id = "cm-" + a.id;
    b.setAttribute("aria-controls", box.id);
    box.appendChild(el("p", "cm-note", NOTE));
    box.appendChild(el("div", "cm-list"));
    box.appendChild(form(box, page));
    var pv = el("p", "cm-priv"); pv.innerHTML = 'We keep your name (if given), your comment and the time. No email or IP address. <a href="https://bucklerfamily.estate/privacy/#comments">Privacy</a>';
    box.appendChild(pv);
    a.appendChild(box);
    var loaded = false;
    b.addEventListener("click", function () { var open = box.hidden; box.hidden = !open; b.setAttribute("aria-expanded", open ? "true" : "false"); if (open && !loaded) { loaded = true; load(box, page); } });
  }
  function css() {
    var s = el("style"); s.textContent =
      ".cm-box{border-top:1px solid rgba(127,127,127,.3);margin-top:8px;padding:10px 2px 4px;font-size:14px}" +
      ".cm-note{margin:0 0 8px;font-size:12.5px;opacity:.85}.cm-item{padding:8px 0;border-bottom:1px solid rgba(127,127,127,.18)}" +
      ".cm-h{font-size:13px}.cm-d{opacity:.7}.cm-t{margin:4px 0 0;white-space:pre-wrap;word-break:break-word}.cm-empty{opacity:.7;margin:4px 0}" +
      ".cm-form{display:grid;gap:8px;margin-top:10px}.cm-l{display:grid;gap:4px;font-size:12px;text-transform:uppercase;letter-spacing:.08em}" +
      ".cm-form input,.cm-form textarea{font:inherit;font-size:15px;padding:8px;border:1px solid rgba(127,127,127,.5);border-radius:2px;background:transparent;color:inherit;width:100%;box-sizing:border-box;text-transform:none;letter-spacing:0}" +
      ".cm-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}" +
      ".cm-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cm-send{font:inherit;font-size:12px;text-transform:uppercase;letter-spacing:.12em;padding:9px 14px;border:1px solid currentColor;border-radius:2px;background:transparent;color:inherit;cursor:pointer}" +
      ".cm-msg{font-size:13px}.cm-priv{font-size:11.5px;opacity:.75;margin:10px 0 0}.cm-priv a{color:inherit}";
    document.head.appendChild(s);
  }
  function start() {
    css();
    var posts = document.querySelectorAll("article.post[id]");
    for (var i = 0; i < posts.length; i++) wire(posts[i]);
    fetch(API + "/api/counts").then(function (r) { return r.json(); }).then(function (d) {
      counts = (d && d.counts) || {};
      for (var i = 0; i < posts.length; i++) { var b = posts[i].querySelector(".cm-toggle"); if (b) label(b, counts[pid(posts[i])]); }
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
