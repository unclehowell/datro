(function() {
  'use strict';

  // ============ CONFIG ============
  var CONFIG = {
    title: "Great House Farm Dispute",
    startingYear: "1979",
    copyright: "Williams/Buckler Family Estate",
    footerCopyright: "Williams/Buckler Family Estate",
    viewLabel: "edit",
    beurcracyUrl: "/beurcracy/",
    githubRepo: "unclehowell/datro",
    versionTagPrefix: "bpvsbuckler-",
  };

  // ============ STATE ============
  var state = {
    currentView: "timeline", // timeline | claim | script
    currentSceneIndex: 0,
    scenes: [],
    pages: null,
    isPlaying: false,
    isMinimized: false,
    voiceVolume: 0.5,
    voiceEnabled: false,
    showSplash: true,
    selectedSource: null,
    archiveOpen: false,
    mobileMenuOpen: false,
  };

  // ============ ICONS ============
  function getCharacterIcon(iconType) {
    var map = {
      court: "⚖️", deed: "📜", news: "📰", report: "📋", archive: "📁",
      farmer: "🧑‍🌾", noble: "🤴", judge: "👨‍⚖️", guard: "💂",
      builder: "👷", ghost: "👻", lawyer: "👨‍💼", worker: "⛏️",
      cleric: "✝️", farm: "🏡", ruins: "🏚️", narrator: "🎙️", other: "🧑",
    };
    return map[iconType] || map.other;
  }

  function getTypeIcon(type) {
    var map = { pdf: "📄", image: "🖼️", text: "📧", markdown: "📝", link: "🔗", video: "▶️" };
    return map[type] || "📄";
  }

  function getWelshFlag(name) {
    var keywords = ["williams", "buckler", "family", "marged", "janet", "branwen",
      "billy", "mary", "rhys", "watkin", "alun michael"];
    var lower = name.toLowerCase();
    for (var k = 0; k < keywords.length; k++) {
      if (lower.indexOf(keywords[k]) !== -1) return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
    }
    return "🇬🇧";
  }

  function getVoiceProfile(name, isNarrator) {
    if (isNarrator) return { pitch: 0.7, rate: 1.1, voice: "male" };
    var lower = name.toLowerCase();
    if (lower.indexOf("mary") !== -1 || lower.indexOf("branwen") !== -1 ||
        lower.indexOf("mrs") !== -1 || lower.indexOf("nancy") !== -1) {
      return { pitch: 1.2, rate: 1.1, voice: "female" };
    }
    return { pitch: 1.0, rate: 1.1, voice: "male" };
  }

  // ============ AUDIO ============
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function playBeep(freq, duration) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  function speechSpeak(text) {
    if (!state.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.1;
    utt.pitch = 1.0;
    // Replace Welsh place names for better pronunciation
    utt.text = text.replace(/Ty Mawr/gi, "Tee-ah-oo-ree Row").replace(/Llandough/gi, "Lan-dock");
    window.speechSynthesis.speak(utt);
  }

  function speechStop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  // ============ DATA LOADING ============
  async function loadData() {
    try {
      var [pagesRes, scenesRes] = await Promise.all([
        fetch("data/pages.json"),
        fetch("data/scenes.json"),
      ]);
      state.pages = await pagesRes.json();
      state.scenes = await scenesRes.json();
      return true;
    } catch(e) {
      console.error("Error loading data:", e);
      return false;
    }
  }

  // ============ RENDER FUNCTIONS ============
  function renderSplash() {
    var overlay = document.getElementById("splash-overlay");
    var panel = overlay.querySelector(".splash-panel");
    if (!panel || !state.pages) return;

    var data = state.pages.splash;
    panel.innerHTML = "";

    var title = document.createElement("h1");
    title.className = "splash-title";
    title.textContent = CONFIG.title;
    panel.appendChild(title);

    var subtitle = document.createElement("p");
    subtitle.className = "splash-subtitle";
    subtitle.textContent = data.subtitle;
    panel.appendChild(subtitle);

    var ul = document.createElement("ul");
    ul.className = "splash-items";
    for (var i = 0; i < data.items.length; i++) {
      var li = document.createElement("li");
      li.textContent = data.items[i];
      ul.appendChild(li);
    }
    panel.appendChild(ul);

    var btn = document.createElement("button");
    btn.className = "enter-btn";
    btn.textContent = "Enter";
    btn.onclick = function() { state.showSplash = false; overlay.classList.add("hidden"); };
    panel.appendChild(btn);
  }

  function findStartIndex() {
    if (!state.scenes.length) return 0;
    var year = state.pages?.config?.startingSlideYear || CONFIG.startingYear;
    for (var i = 0; i < state.scenes.length; i++) {
      if (state.scenes[i].year === year) return i;
    }
    // Fallback: 1979 is ~23rd scene
    return 23;
  }

  function renderTimelineView() {
    var idx = state.currentSceneIndex;
    if (idx < 0) idx = 0;
    if (idx >= state.scenes.length) idx = state.scenes.length - 1;
    state.currentSceneIndex = idx;

    var scene = state.scenes[idx];
    var display = document.getElementById("scene-display");
    var bubble = document.getElementById("character-bubble");
    var controlsBar = document.getElementById("controls-bar");

// Narration
    var narrationArea = document.getElementById("narration-area");
    var narrationText = document.getElementById("narration-text");
    var narrationLabel = document.getElementById("narration-label");
    narrationLabel.textContent = "NARRATION";
    var narrated = narrationText.sceneInfo ? narrationText.sceneInfo : null;

    var narratedText = scene.narration || "";
    var parts = narratedText.split(" ");
    narrationText.innerHTML = "";
    for (var w = 0; w < parts.length; w++) {
      var span = document.createElement("span");
      span.className = "word";
      span.style.marginRight = "0.25rem";
      span.textContent = parts[w];
      narrationText.appendChild(span);
    }

    // Character bubble (only if not playing audio or scene changed)
    bubble.classList.remove("visible");
    bubble.innerHTML = "";

    if (state.isPlaying && scene.scenes && scene.scenes.length > 0) {
      // Automatically show first scene dialogue
      showSceneDialogue(scene, 0);
    }

    // Update controls
    updateControls();

    // Update slide counter
    document.getElementById("slide-counter").textContent = (idx + 1) + " / " + state.scenes.length;
  }

  function showSceneDialogue(scene, dialogueIdx) {
    var bubble = document.getElementById("character-bubble");
    if (!scene.scenes || dialogueIdx >= scene.scenes.length) {
      bubble.classList.remove("visible");
      return;
    }

    var d = scene.scenes[dialogueIdx];
    var isNarrator = d.icon === "narrator" || d.side === "center";
    var profile = getVoiceProfile(d.character, isNarrator);

    bubble.innerHTML = "";

    // Avatar
    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = getCharacterIcon(d.icon);
    bubble.appendChild(avatar);

    // Card
    var card = document.createElement("div");
    card.className = "bubble-card";

    // Header
    var header = document.createElement("div");
    header.className = "bubble-header";

    var identity = document.createElement("div");
    identity.className = "bubble-identity";

    var flag = document.createElement("div");
    flag.className = "bubble-flag";
    flag.textContent = getWelshFlag(d.character);
    identity.appendChild(flag);

    var nameDiv = document.createElement("div");
    nameDiv.className = "bubble-name";
    var nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = d.character;
    var handleEl = document.createElement("span");
    handleEl.className = "handle";
    handleEl.textContent = "@" + d.character.replace(/\s+/g, "");
    nameDiv.appendChild(nameEl);
    nameDiv.appendChild(handleEl);
    identity.appendChild(nameDiv);

    var closeBtn = document.createElement("button");
    closeBtn.className = "bubble-close";
    closeBtn.innerHTML = "✕";
    closeBtn.onclick = function(e) { e.stopPropagation(); bubble.classList.remove("visible"); };

    header.appendChild(identity);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Text
    var textDiv = document.createElement("div");
    textDiv.className = "bubble-text";
    textDiv.textContent = d.text;
    card.appendChild(textDiv);

    // Meta
    var meta = document.createElement("div");
    meta.className = "bubble-meta";
    var locSpan = document.createElement("span");
    locSpan.className = "location";
    locSpan.textContent = scene.year + " • " + (scene.location || "Llandough");
    var yearSpan = document.createElement("span");
    yearSpan.className = "year-badge";
    yearSpan.textContent = "SCENE " + (dialogueIdx + 1);
    meta.appendChild(locSpan);
    meta.appendChild(yearSpan);
    card.appendChild(meta);

    bubble.appendChild(card);
    bubble.classList.add("visible");

    // Speech
    if (state.isPlaying) {
      speechSpeak(d.text);
    }
  }

  function updateControls() {
    var idx = state.currentSceneIndex;
    var total = state.scenes.length;
    var progress = total > 0 ? ((idx + 1) / total) * 100 : 0;

    var scrubberBar = document.getElementById("scrubber-progress");
    if (scrubberBar) {
      scrubberBar.style.width = progress + "%";
    }

    // Update nav button states
    document.querySelectorAll(".view-nav-btn").forEach(function(btn) {
      btn.classList.remove("active", "active-home", "active-claim", "active-script");
      if (btn.dataset.view === state.currentView) {
        if (state.currentView === "timeline") btn.classList.add("active-home");
        else if (state.currentView === "claim") btn.classList.add("active-claim");
        else if (state.currentView === "script") btn.classList.add("active-script");
      }
    });
  }

  function switchView(view) {
    state.currentView = view;
    speechStop();
    state.isPlaying = false;
    updatePlayButton();

    // Set the active button
    document.querySelectorAll(".view-nav-btn").forEach(function(btn) {
      btn.classList.remove("active", "active-home", "active-claim", "active-script");
      if (btn.dataset.view === view) {
        btn.classList.add("active");
        if (view === "timeline") btn.classList.add("active-home");
        else if (view === "claim") btn.classList.add("active-claim");
        else if (view === "script") btn.classList.add("active-script");
      }
    });

    if (view === "timeline") {
      document.getElementById("timeline-view").style.display = "flex";
      document.getElementById("claim-view").classList.remove("active");
      document.getElementById("script-view").classList.remove("active");
      var bubble = document.getElementById("character-bubble");
      bubble.classList.remove("visible");
    } else if (view === "claim") {
      document.getElementById("timeline-view").style.display = "none";
      document.getElementById("claim-view").classList.add("active");
      document.getElementById("script-view").classList.remove("active");
      renderClaimView();
    } else if (view === "script") {
      document.getElementById("timeline-view").style.display = "none";
      document.getElementById("claim-view").classList.remove("active");
      document.getElementById("script-view").classList.add("active");
      renderScriptView();
    }

    // Close mobile menu
    state.mobileMenuOpen = false;
    document.getElementById("mobile-menu").classList.remove("open");
    document.getElementById("mobile-menu-overlay").classList.remove("open");
  }

  function renderClaimView() {
    var container = document.getElementById("claim-content");
    if (!state.pages || !container) return;

    var claim = state.pages.claim;
    container.innerHTML = "";

    if (claim.text) {
      var pre = document.createElement("div");
      pre.className = "claim-content";
      pre.textContent = claim.text;
      container.appendChild(pre);
    }
  }

  function renderScriptView() {
    var container = document.getElementById("script-content");
    if (!state.pages || !container || !state.scenes.length) return;

    container.innerHTML = "";

    var title = document.createElement("h2");
    title.className = "splash-title";
    title.style.textAlign = "center";
    title.style.marginBottom = "2rem";
    title.textContent = state.pages.script.title || "THE SCRIPT";
    container.appendChild(title);

    for (var i = 0; i < state.scenes.length; i++) {
      var scene = state.scenes[i];
      var section = document.createElement("div");
      section.className = "script-scene";

      var header = document.createElement("div");
      header.className = "script-scene-header";
      header.textContent = "SCENE " + (i + 1) + ": " + scene.year.toUpperCase() + " - " + (scene.location || "Unknown").toUpperCase();
      section.appendChild(header);

      if (scene.narration) {
        var narr = document.createElement("div");
        narr.className = "script-narration";
        var narrLabel = document.createElement("strong");
        narrLabel.textContent = "NARRATOR: ";
        narr.appendChild(narrLabel);
        narr.appendChild(document.createTextNode(scene.narration));
        section.appendChild(narr);
      }

      if (scene.scenes && scene.scenes.length) {
        for (var j = 0; j < scene.scenes.length; j++) {
          var dlg = scene.scenes[j];
          var dlgDiv = document.createElement("div");
          dlgDiv.className = "script-dialogue";

          var charDiv = document.createElement("div");
          charDiv.className = "script-character";
          charDiv.textContent = dlg.character.toUpperCase();
          dlgDiv.appendChild(charDiv);

          var textDiv = document.createElement("div");
          textDiv.className = "script-text";
          textDiv.textContent = dlg.text;
          dlgDiv.appendChild(textDiv);

          section.appendChild(dlgDiv);
        }
      }

      container.appendChild(section);
    }

    var endDiv = document.createElement("div");
    endDiv.style.cssText = "text-align:center;color:#475569;margin-top:3rem;padding-bottom:3rem;";
    endDiv.textContent = "--- END OF SCRIPT ---";
    container.appendChild(endDiv);
  }

  function renderClaimView() {
    var container = document.getElementById("claim-content");
    if (!state.pages || !container) return;

    var claim = state.pages.claim;

    container.innerHTML = "";

    if (claim.title) {
      var h = document.createElement("h2");
      h.className = "splash-title";
      h.textContent = claim.title;
      container.appendChild(h);
    }

    if (claim.text) {
      var pre = document.createElement("div");
      pre.className = "claim-content";
      pre.textContent = claim.text;
      container.appendChild(pre);
    } else if (claim.content) {
      var contentBlocks = claim.content;
      // find ClaimBlock
      for (var b = 0; b < contentBlocks.length; b++) {
        if (contentBlocks[b].type === "ClaimBlock" && contentBlocks[b].props.content) {
          var pre = document.createElement("div");
          pre.className = "claim-content";
          pre.textContent = contentBlocks[b].props.content;
          container.appendChild(pre);
        }
      }
    }
  }

  function navigateScene(delta) {
    var newIdx = state.currentSceneIndex + delta;
    if (newIdx < 0) {
      playBeep(520, 0.1);
      newIdx = 0;
    } else if (newIdx >= state.scenes.length) {
      playBeep(520, 0.1);
      newIdx = state.scenes.length - 1;
      state.isPlaying = false;
      updatePlayButton();
      speechStop();
    } else {
      playBeep(280, 0.1);
      speechStop();
    }
    state.currentSceneIndex = newIdx;
    renderTimelineView();
  }

  function goToScene(idx) {
    speechStop();
    state.currentSceneIndex = idx;
    document.getElementById("character-bubble").classList.remove("visible");
    renderTimelineView();
  }

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    updatePlayButton();

    if (state.isPlaying) {
      state.voiceEnabled = true;
      document.getElementById("voice-slider").value = state.voiceVolume;
      autoAdvance();
    } else {
      speechStop();
      document.getElementById("character-bubble").classList.remove("visible");
    }
  }

  function updatePlayButton() {
    var btn = document.getElementById("play-btn");
    if (!btn) return;
    if (state.isPlaying) {
      btn.classList.add("playing");
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    } else {
      btn.classList.remove("playing");
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    }
  }

  function autoAdvance() {
    if (!state.isPlaying) return;

    var scene = state.scenes[state.currentSceneIndex];
    if (!scene) return;

    var text = scene.narration || "";
    var wordCount = text.split(/\s+/).length;
    var delay = (wordCount * 600) + 4000;

    if (state.voiceEnabled && window.speechSynthesis) {
      speechSpeak(text);
    }

    setTimeout(function() {
      if (!state.isPlaying) return;
      if (state.currentSceneIndex < state.scenes.length - 1) {
        state.currentSceneIndex++;
        renderTimelineView();
        autoAdvance();
      } else {
        state.isPlaying = false;
        updatePlayButton();
        speechStop();
      }
    }, delay);
  }

  function toggleMinimize() {
    state.isMinimized = !state.isMinimized;
    var controls = document.getElementById("timeline-controls");
    if (state.isMinimized) {
      controls.classList.add("minimized");
    } else {
      controls.classList.remove("minimized");
    }
  }

  function toggleVoice() {
    state.voiceEnabled = !state.voiceEnabled;
    if (!state.voiceEnabled) speechStop();
  }

  function openArchive(category, year) {
    var modal = document.getElementById("archive-modal");
    var modalTitle = document.getElementById("archive-modal-title");
    var modalBody = document.getElementById("archive-modal-body");

    modalTitle.innerHTML = '<span class="archive-category-title">' + category.toUpperCase() + '</span><br><span class="archive-year-badge">YEAR: ' + year + '</span>';

    // Build archive items
    modalBody.innerHTML = "";

    var items = [];
    if (category === "gallery") {
      items = [
        { name: "Great House Farm Photo 001.jpg", type: "image" },
        { name: "Great House Farm Photo 002.jpg", type: "image" },
        { name: "Archaeological Report 1979.pdf", type: "pdf" },
        { name: "Court Filing 1987.pdf", type: "pdf" },
        { name: "HER Record GGAT02038s.pdf", type: "pdf" },
        { name: "News Article South Wales Echo.jpg", type: "image" },
      ];
    } else if (category === "legal") {
      items = [
        { name: "Court Filing 1987.pdf", type: "pdf" },
        { name: "Court of Appeal Judgment.pdf", type: "pdf" },
        { name: "Appeal Brief 1988.pdf", type: "pdf" },
        { name: "HER Record GGAT02038s.pdf", type: "pdf" },
        { name: "Possession Order 1962.pdf", type: "pdf" },
      ];
    } else if (category === "news") {
      items = [
        { name: "South Wales Echo - 1988.jpg", type: "link" },
        { name: "Western Mail - 1988.jpg", type: "link" },
        { name: "Penarth Times - 1988.jpg", type: "link" },
      ];
    } else if (category === "notes") {
      items = [
        { name: "Family Notes 1988.txt", type: "text" },
        { name: "Mary Williams Journal.txt", type: "text" },
      ];
    } else {
      items = [
        { name: "Investigation Report 2025.pdf", type: "pdf" },
        { name: "Archaeological Assessment.pdf", type: "pdf" },
      ];
    }

    if (items.length === 0) {
      modalBody.innerHTML = '<div class="archive-empty"><div class="archive-empty-icon">🚫</div><p>No records declassified for this period.</p></div>';
    } else {
      for (var i = 0; i < items.length; i++) {
        var item = document.createElement("div");
        item.className = "archive-item";
        item.onclick = (function(it) { return function() { openSourceModal(it); }; })(items[i]);
        item.innerHTML = '<div class="archive-thumb">' + getTypeIcon(items[i].type) + '</div><div class="archive-filename">' + items[i].name + '</div>';
        modalBody.appendChild(item);
      }
    }

    modal.classList.add("open");
  }

  function openSourceModal(source) {
    var modal = document.getElementById("source-modal");
    var icon = document.getElementById("source-modal-icon");
    var title = document.getElementById("source-modal-title");
    var type = document.getElementById("source-modal-type");
    var link = document.getElementById("source-modal-link");

    icon.textContent = getTypeIcon(source.type);
    title.textContent = source.name;
    type.textContent = source.type.toUpperCase();

    if (source.type === "link") {
      link.href = "#";
      link.textContent = "View Record";
      link.onclick = function(e) { e.preventDefault(); };
    } else {
      link.href = "#";
      link.textContent = "Access Record";
      link.onclick = function(e) { e.preventDefault(); };
    }

    modal.classList.add("open");
  }

  function openTimelinePicker() {
    var modal = document.getElementById("archive-modal");
    var modalTitle = document.getElementById("archive-modal-title");
    var modalBody = document.getElementById("archive-modal-body");

    modalTitle.innerHTML = '<span class="archive-category-title">Timeline</span>';
    modalBody.innerHTML = "";

    var grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;";
    if (window.innerWidth >= 768) {
      grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    }

    for (var i = 0; i < state.scenes.length; i++) {
      var btn = document.createElement("button");
      btn.className = "archive-item";
      btn.style.cssText = "text-align:left;";
      btn.onclick = (function(idx) { return function() { goToScene(idx); modal.classList.remove("open"); }; })(i);
      btn.innerHTML = '<span style="color:var(--accent);font-weight:bold;margin-right:0.5rem;font-family:monospace;">' + (i + 1) + '.</span><span class="archive-filename" style="font-size:0.8rem;">' + state.scenes[i].year + '</span>';
      grid.appendChild(btn);
    }

    modalBody.appendChild(grid);
    modal.classList.add("open");
  }

  function setupScrubber() {
    var area = document.getElementById("scrubber-area");
    var bar = document.getElementById("scrubber-bar");
    if (!area || !bar) return;

    bar.innerHTML = '<div id="scrubber-progress"></div><div id="scrubber-handle"></div>';

    for (var i = 0; i < state.scenes.length; i++) {
      var tick = document.createElement("div");
      tick.className = "scrubber-tick";
      tick.style.left = (i / (state.scenes.length - 1) * 100) + "%";
      bar.appendChild(tick);
    }

    var tooltip = document.createElement("div");
    tooltip.className = "scrubber-tooltip";
    area.appendChild(tooltip);

    area.style.height = "3rem";
    area.style.top = "-1.5rem";
    area.style.cursor = "pointer";
    bar.style.height = "0.5rem";
    bar.style.background = "rgba(255,255,255,0.15)";
    bar.style.borderRadius = "0.25rem";

    var progressBar = document.getElementById("scrubber-progress");
    progressBar.style.height = "0.5rem";
    progressBar.style.background = "#dc2626";

    var handle = document.getElementById("scrubber-handle");
    if (handle) {
      handle.style.opacity = "1";
      handle.style.width = "1rem";
      handle.style.height = "1rem";
      handle.style.right = "-0.5rem";
    }

    tooltip.style.display = "block";

    var dragging = false;

    function updateFromEvent(e) {
      var rect = area.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var pct = Math.max(0, Math.min(1, x / rect.width));
      var idx = Math.floor(pct * (state.scenes.length - 1));
      idx = Math.max(0, Math.min(state.scenes.length - 1, idx));
      var scene = state.scenes[idx];
      tooltip.textContent = "Slide " + (idx + 1) + ": " + (scene ? scene.year : "");
      tooltip.style.left = (pct * 100) + "%";
      progressBar.style.width = (pct * 100) + "%";

      if (dragging) {
        goToScene(idx);
      }
    }

    area.addEventListener("mousedown", function(e) {
      dragging = true;
      updateFromEvent(e);
    });

    area.addEventListener("mousemove", function(e) {
      updateFromEvent(e);
    });

    document.addEventListener("mouseup", function() {
      dragging = false;
    });

    area.addEventListener("touchstart", function(e) {
      dragging = true;
      updateFromEvent(e.touches[0]);
    }, { passive: true });

    area.addEventListener("touchmove", function(e) {
      if (dragging) updateFromEvent(e.touches[0]);
    }, { passive: true });

    area.addEventListener("touchend", function() { dragging = false; });
  }

  // ============ GITHUB VERSION ============
  async function updateVersion() {
    var deployedEl = document.getElementById("deployed-version");
    var noticeEl = document.getElementById("update-notice");
    var latestEl = document.getElementById("latest-version");

    try {
      var vRes = await fetch("version.txt");
      var deployed = (await vRes.text()).trim();
      if (deployedEl) deployedEl.textContent = deployed || "unknown";

      var relRes = await fetch("https://api.github.com/repos/" + CONFIG.githubRepo + "/releases");
      var releases = await relRes.json();
      var bpvs = releases.filter(function(r) { return r.tag_name && r.tag_name.startsWith(CONFIG.versionTagPrefix); });
      bpvs.sort(function(a, b) { return new Date(b.published_at) - new Date(a.published_at); });
      var latest = bpvs[0];
      if (!latest) return;

      var ver = latest.tag_name.replace(new RegExp("^" + CONFIG.versionTagPrefix), "");
      if (latestEl) latestEl.textContent = ver;

      if (deployed && ver && deployed !== ver) {
        if (noticeEl) noticeEl.classList.add("visible");
      }
    } catch(e) {
      if (deployedEl) deployedEl.textContent = "unknown";
    }
  }

  // ============ INIT ============
  async function init() {
    var ok = await loadData();
    if (!ok) {
      document.getElementById("preloader").classList.add("hidden");
      document.getElementById("app-root").classList.add("ready");
      document.getElementById("app-root").style.display = "flex";
      return;
    }

    state.currentSceneIndex = findStartIndex();

    // Render splash
    renderSplash();

    // Setup scrubber
    setupScrubber();

    // Setup archive items
    setupArchiveButtons();

    // Setup event listeners
    setupEventListeners();

    // Update version
    updateVersion();

    // Hide preloader, show app
    setTimeout(function() {
      document.getElementById("preloader").classList.add("hidden");
      document.getElementById("app-root").classList.add("ready");
      renderTimelineView();
    }, 800);
  }

  function setupArchiveButtons() {
    // Setup gallery button click handlers in header
    document.querySelectorAll(".archive-item-btn").forEach(function(btn) {
      btn.onclick = function() {
        var category = btn.dataset.category;
        var scene = state.scenes[state.currentSceneIndex];
        openArchive(category, scene ? scene.year : "present");
      };
    });
  }

  function setupEventListeners() {
    // Nav buttons
    document.querySelectorAll(".view-nav-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        switchView(btn.dataset.view);
      });
    });

    // Play/Pause
    document.getElementById("play-btn").addEventListener("click", togglePlay);

    // Prev/Next scene
    document.getElementById("prev-scene-btn").addEventListener("click", function() { navigateScene(-1); });
    document.getElementById("next-scene-btn").addEventListener("click", function() { navigateScene(1); });

    // Voice toggle
    document.getElementById("voice-toggle-btn").addEventListener("click", toggleVoice);

    // Voice volume
    document.getElementById("voice-slider").addEventListener("input", function(e) {
      state.voiceVolume = parseFloat(e.target.value);
    });

    // Minimize toggle
    document.getElementById("minimize-btn").addEventListener("click", toggleMinimize);

    // Slide counter (opens timeline picker)
    document.getElementById("slide-counter").addEventListener("click", function() {
      if (state.currentView !== "timeline") {
        switchView("timeline");
      }
      openTimelinePicker();
    });

    // Gallery/evidence button
    var galleryBtn = document.getElementById("gallery-btn-trigger");
    if (galleryBtn) {
      galleryBtn.addEventListener("click", function() {
        var scene = state.scenes[state.currentSceneIndex];
        openArchive("gallery", scene ? scene.year : "present");
      });
    }

    // Close modals
    document.getElementById("archive-modal-close").addEventListener("click", function() {
      document.getElementById("archive-modal").classList.remove("open");
    });
    document.getElementById("source-modal").addEventListener("click", function(e) {
      if (e.target === document.getElementById("source-modal")) {
        document.getElementById("source-modal").classList.remove("open");
      }
    });
    document.getElementById("archive-modal").addEventListener("click", function(e) {
      if (e.target === document.getElementById("archive-modal")) {
        document.getElementById("archive-modal").classList.remove("open");
      }
    });

    // Mobile menu
    document.getElementById("mobile-menu-btn").addEventListener("click", function() {
      state.mobileMenuOpen = !state.mobileMenuOpen;
      document.getElementById("mobile-menu").classList.toggle("open", state.mobileMenuOpen);
      document.getElementById("mobile-menu-overlay").classList.toggle("open", state.mobileMenuOpen);
    });
    document.getElementById("mobile-menu-overlay").addEventListener("click", function() {
      state.mobileMenuOpen = false;
      document.getElementById("mobile-menu").classList.remove("open");
      document.getElementById("mobile-menu-overlay").classList.remove("open");
    });
    // Mobile menu close button
    var closeBtn = document.querySelector("#mobile-menu .close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", function() {
        state.mobileMenuOpen = false;
        document.getElementById("mobile-menu").classList.remove("open");
        document.getElementById("mobile-menu-overlay").classList.remove("open");
      });
    }
    // Mobile menu navigation entries
    document.querySelectorAll(".mobile-nav-btn").forEach(function(mobileBtn) {
      mobileBtn.addEventListener("click", function() {
        var view = mobileBtn.dataset.mobileView;
        switchView(view);
      });
    });

    // Keyboard controls
    document.addEventListener("keydown", function(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch(e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (state.currentView === "timeline") navigateScene(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (state.currentView === "timeline") navigateScene(1);
          break;
        case " ":
          e.preventDefault();
          if (state.currentView === "timeline") togglePlay();
          break;
        case "Escape":
          document.getElementById("archive-modal").classList.remove("open");
          document.getElementById("source-modal").classList.remove("open");
          state.mobileMenuOpen = false;
          document.getElementById("mobile-menu").classList.remove("open");
          document.getElementById("mobile-menu-overlay").classList.remove("open");
          break;
        case "1":
          if (!e.ctrlKey && !e.metaKey) switchView("timeline");
          break;
        case "2":
          if (!e.ctrlKey && !e.metaKey) switchView("claim");
          break;
        case "3":
          if (!e.ctrlKey && !e.metaKey) switchView("script");
          break;
      }
    });
  }

  // ============ START ============
  document.addEventListener("DOMContentLoaded", init);
})();
