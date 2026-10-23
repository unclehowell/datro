/* Hive drafts pipeline widget v1.1.0 — https://hive.bucklerfamily.estate/pipeline.js
   Renders the promotion pyramid: four labelled rows of hex cells, bottom READY TO SEND, then DEFINITELY READY TO SEND,
   GMAIL DRAFT, apex WAYBACK; drafts IN REVIEW are counted beside it (waiting to climb in)
   into every element with [data-hive-pipeline]. Data: data-src (default https://hive.bucklerfamily.estate/hive.json, CORS *).
   Metadata only: draft ids, recipient bodies, tiers. No email text. Inherits the host page's font and colours.
   Options: data-hive-pipeline="full" (pyramid, default) | "strip" (one-line counts; tap opens the pyramid) | "bar" (4-step bar per draft); data-lane="<dartboard lane id>" filters. — the project's Tab agent */
(function () {
  var HIVE = "https://hive.bucklerfamily.estate";
  var ORDER = ["working", "ready", "definitely_ready", "gmail_draft", "sent_archived"];
  var LABEL = { working: "In review", ready: "READY TO SEND", definitely_ready: "DEFINITELY READY TO SEND",
    gmail_draft: "GMAIL DRAFT \u2014 owner review & send", sent_archived: "WAYBACK \u2014 sent & archived" };
  var SHORT = { working: "In review", ready: "Ready", definitely_ready: "Definitely ready", gmail_draft: "Gmail draft", sent_archived: "Wayback" };
  function tierOf(d) {
    if (d.tier && ORDER.indexOf(d.tier) >= 0) return d.tier;
    var s = String(d.status || "").toUpperCase();
    if (s.indexOf("SENT") === 0) return "sent_archived";
    if (s.indexOf("DEFINITELY READY") >= 0) return "definitely_ready";
    if (s.indexOf("READY TO SEND") >= 0) return "ready";
    return "working";
  }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) { return /^https:\/\/([a-z0-9-]+\.)*bucklerfamily\.estate(\/|$)/i.test(u || "") ? u : null; }
  var CSS = ".hvp{font:inherit;color:inherit;border:1px solid rgba(127,127,127,.35);border-radius:14px;padding:12px;margin:12px 0;max-width:100%;box-sizing:border-box}" +
    ".hvp *{box-sizing:border-box}.hvp-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 8px}" +
    ".hvp-t{font-weight:700;font-size:1em;margin:0}.hvp-a{font-size:.85em;color:inherit;opacity:.8}" +
    ".hvp-row{margin:0 auto 4px;border-radius:8px;padding:6px 8px;background:rgba(127,127,127,.10);display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;min-height:34px}" +
    ".hvp-row.hvp-empty{background:transparent;border:1px dashed rgba(127,127,127,.4)}" +
    ".hvp-l{font-size:.72em;font-weight:700;letter-spacing:.04em;text-transform:uppercase;flex:1 1 100%;opacity:.85}" +
    ".hvp-n{font-weight:400;opacity:.7;text-transform:none;letter-spacing:0}" +
    ".hvp-c{display:inline-flex;align-items:center;gap:4px;font-size:.78em;line-height:1.2;padding:3px 7px;border-radius:999px;text-decoration:none;color:inherit;border:1px solid rgba(127,127,127,.35);max-width:100%;overflow-wrap:anywhere}" +
    ".hvp-d{width:8px;height:8px;border-radius:50%;flex:0 0 8px}.hvp-f{font-size:.75em;opacity:.7;margin:6px 0 0}" +
    ".hvp-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin:3px 0 0}.hvp-s{height:6px;border-radius:3px;background:rgba(127,127,127,.25)}" +
    ".hvp-sum{cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;font-size:.8em}.hvp-sum::-webkit-details-marker{display:none}" +
    ".hvp-k{display:inline-flex;gap:3px;align-items:center;padding:2px 7px;border-radius:999px;border:1px solid rgba(127,127,127,.35);white-space:nowrap}.hvp-k b{font-weight:700}.hvp-k.on{border-color:currentColor}" +
    ".hvp-x{opacity:.5}.hvp-strip{padding:8px 10px;margin:8px 0}.hvp-strip .hvp-body{margin-top:8px}" +
    ".hvp-pyr{margin:4px auto 2px;width:max-content;max-width:100%}.hvp-pr{display:flex;align-items:center;height:29.5px}" +
    ".hvp .hvp-pl{flex:0 0 136px;width:136px;margin:0!important;padding:0 6px 0 0!important;text-align:right;font-size:11px!important;line-height:1.12!important;font-family:inherit;text-transform:none!important}.hvp .hvp-pl b{display:block;margin:0!important;font-size:11px!important;line-height:1.12!important;font-weight:700;letter-spacing:.02em!important;white-space:nowrap}.hvp .hvp-pl span{display:block;margin:0!important;font-size:10px!important;line-height:1.12!important;opacity:.7;white-space:nowrap}" +
    ".hvp-hx{display:block;flex:0 0 34px;width:34px;height:39px;line-height:0;text-decoration:none}.hvp-hx svg{width:34px;height:39px;display:block}" +
    ".hvp .hvp-rv{text-align:center;font-size:13px;line-height:1.3;margin:8px 0 4px;opacity:.9}.hvp-rv b{font-weight:700}.hvp-rvc{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin:4px 0 0}" +
    ".hvp-li{list-style:none;margin:0;padding:0}.hvp-li li{margin:0 0 8px;font-size:.85em}.hvp-li a{color:inherit}";
  function style() { if (document.getElementById("hvp-css")) return; var s = document.createElement("style"); s.id = "hvp-css"; s.textContent = CSS; document.head.appendChild(s); }
  function chip(d) {
    var t = tierOf(d), body = (d.context && d.context.body) || d.draft, href;
    if (t === "sent_archived") href = safeUrl(d.archive_url) || (d.context && d.context.archive && safeUrl(d.context.archive.thread));
    href = href || HIVE + "/context/" + encodeURIComponent(d.draft);
    return '<a class="hvp-c" href="' + esc(href) + '" title="' + esc(d.draft + " \u00b7 " + (d.version || "") + " \u00b7 " + LABEL[t]) + '"><span class="hvp-d" style="background:hsl(' + hue(body) + ',65%,50%)"></span>' + esc(body) + (d.version ? ' <span style="opacity:.65;white-space:nowrap">' + esc(d.version) + "</span>" : "") + "</a>";
  }
  function hex(d, empty) {
    var poly = '<svg viewBox="0 0 100 115.5" aria-hidden="true"><polygon points="50,3 97,30 97,85.5 50,112.5 3,85.5 3,30" ';
    if (empty) return '<span class="hvp-hx">' + poly + 'fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="4"/></svg></span>';
    var t = tierOf(d), body = (d.context && d.context.body) || d.draft, href;
    if (t === "sent_archived") href = safeUrl(d.archive_url) || (d.context && d.context.archive && safeUrl(d.context.archive.thread));
    href = href || HIVE + "/context/" + encodeURIComponent(d.draft);
    return '<a class="hvp-hx" href="' + esc(href) + '" title="' + esc(body + " \u00b7 " + (d.version || "") + " \u00b7 " + LABEL[t]) + '">' + poly + 'fill="hsl(' + hue(body) + ',65%,52%)" stroke="rgba(0,0,0,.25)" stroke-width="3"/></svg></a>';
  }
  function pyramid(items) {
    var rows = ["sent_archived", "gmail_draft", "definitely_ready", "ready"], sub = { ready: "consensus", definitely_ready: "final review", gmail_draft: "owner review & send", sent_archived: "sent & archived" };
    var name = { ready: "READY TO SEND", definitely_ready: "DEFINITELY READY", gmail_draft: "GMAIL DRAFT", sent_archived: "WAYBACK" };
    var by = {}, slots = {}, prev = 0;
    rows.forEach(function (t) { by[t] = items.filter(function (d) { return tierOf(d) === t; }); slots[t] = Math.max(prev + 1, by[t].length); prev = slots[t]; });
    var n = slots.ready, h = '<div class="hvp-pyr" role="list" aria-label="Drafts pyramid: bottom row ready to send, top row wayback">';
    rows.forEach(function (t) {
      var cells = by[t].map(function (d) { return hex(d); }).join("");
      for (var i = by[t].length; i < slots[t]; i++) cells += hex(null, true);
      h += '<div class="hvp-pr" role="listitem" data-tier="' + t + '" style="margin-left:' + ((n - slots[t]) * 17) + 'px"><div class="hvp-pl"><b>' + esc(name[t]) + "</b><span>" + esc(sub[t]) + " \u00b7 " + by[t].length + "</span></div>" + cells + "</div>";
    });
    var w = items.filter(function (d) { return tierOf(d) === "working"; });
    h += '</div><div class="hvp-rv"><b>In review: ' + w.length + "</b> draft" + (w.length === 1 ? "" : "s") + " waiting to climb in \u2191" +
      (w.length ? '<div class="hvp-rvc">' + w.map(chip).join("") + "</div>" : "") + "</div>";
    return h;
  }
  function bars(items) {
    return '<ul class="hvp-li">' + items.map(function (d) {
      var k = ORDER.indexOf(tierOf(d)), s = "";
      for (var i = 1; i <= 4; i++) s += '<span class="hvp-s" title="' + esc(LABEL[ORDER[i]]) + '" style="' + (i <= k ? "background:hsl(" + hue((d.context && d.context.body) || d.draft) + ",65%,50%)" : "") + '"></span>';
      return "<li>" + chip(d) + " <b>" + esc(SHORT[ORDER[k]]) + '</b><div class="hvp-bar">' + s + "</div></li>";
    }).join("") + "</ul>";
  }
  function render(el, j) {
    var items = (j.board || []).slice(), lane = el.getAttribute("data-lane");
    if (lane) items = items.filter(function (d) { return d.context && d.context.dartboard && d.context.dartboard.lane === lane; });
    items.sort(function (a, b) { return ORDER.indexOf(tierOf(b)) - ORDER.indexOf(tierOf(a)); });
    var mode = el.getAttribute("data-hive-pipeline") || "full";
    if (mode === "strip") {
      var k = ORDER.map(function (t) { var n = items.filter(function (d) { return tierOf(d) === t; }).length; return '<span class="hvp-k' + (n && t !== "working" ? " on" : "") + '" title="' + esc(LABEL[t]) + '">' + esc(SHORT[t]) + " <b>" + n + "</b></span>"; }).join('<span class="hvp-x">\u203a</span>');
      el.innerHTML = '<details class="hvp hvp-strip"><summary class="hvp-sum"><b>Drafts pipeline</b> ' + k + '</summary><div class="hvp-body">' + pyramid(items) +
        '<p class="hvp-f"><a class="hvp-a" href="' + HIVE + '/">open the Hive \u2192</a> Sent replies link to their archived copy.</p></div></details>';
      return;
    }
    el.innerHTML = '<section class="hvp" aria-label="Drafts pipeline"><div class="hvp-h"><p class="hvp-t">Drafts pipeline</p><a class="hvp-a" href="' + HIVE + '/">open the Hive \u2192</a></div>' +
      (mode === "bar" ? bars(items) : pyramid(items)) +
      '<p class="hvp-f">Each reply climbs: in review \u2192 ready to send \u2192 definitely ready to send \u2192 Gmail draft (the project owner reviews and sends) \u2192 wayback (sent and archived). ' + items.length + " draft" + (items.length === 1 ? "" : "s") + (j.board_updated ? " \u00b7 board " + esc(String(j.board_updated).slice(0, 16).replace("T", " ")) + " UTC" : "") + ".</p></section>";
  }
  function run() {
    var els = document.querySelectorAll("[data-hive-pipeline]"); if (!els.length) return; style();
    var src = els[0].getAttribute("data-src") || HIVE + "/hive.json";
    fetch(src, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      for (var i = 0; i < els.length; i++) render(els[i], j);
    }).catch(function () { for (var i = 0; i < els.length; i++) els[i].innerHTML = '<p class="hvp-f"><a href="' + HIVE + '/">Drafts pipeline: open the Hive</a></p>'; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
