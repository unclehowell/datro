// ── APP ──
(function() {
var $ = function(id) { return document.getElementById(id); };

var BRANCH_COLORS = {
    althea:'#ff6b6b',archives:'#c9a96e',bpvsbuckler:'#4ecdc4',carfinancecheque:'#45b7d1',
    ccan:'#96ceb4',ceo:'#ffeead',cnei:'#ff4444',dash:'#d4a574',
    datro:'#00e5ff',dcc:'#ffd93d',financecheque:'#6bcb77',greathousefarm:'#4d96ff',
    gui:'#ff6b6b',hbnb:'#ff922b',library:'#69db7c',llmwiki:'#f783ac',
    subrepos:'#748ffc',ui:'#20c997',wave:'#f06595',wayback:'#a9e34b',
    whitepaper:'#e8590c',pirateclaw:'#be4bdb'
};
var BRANCH_NAMES = Object.keys(BRANCH_COLORS);

var config = window._config || { bias: 0, risk: 0, gear: 3, steering: 0 };
window._config = config;

var currentVersion = '0.0.0';
var autoUpdateEnabled = localStorage.getItem('autoUpdate') !== 'false';
var updateCheckInterval = null;

var isCallActive = false;
var speechSynth = window.speechSynthesis;
var speechRecog = null;
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// ── LEFT PANEL MD FILE BROWSER STATE ──
var branchesData = [];
var editCache = {};
var MD_FILES = ['AGENT','README','CHANGELOG','MEMORY','SKILLS','HEARTBEAT','SOUL','MASTERPLAN','RULES','TEMPLATE','CONTEXT','GLOSSARY','RESOURCES','TASKS','IDENTITY','SPEC'];
var SIDES = ['high','left','right','low'];
var SIDE_COLORS = { high:'#ff6b6b', left:'#4ecdc4', right:'#ffd93d', low:'#69db7c' };
var selectedBranch = null;
var selectedFile = null;
var expandedFile = null;
var knownFiles = {};

// ── JOYSTICK CONFIRMATION STATE ──
var joystickCommitted = { x: 0, y: 0 };

// ── CONTROLS FULLSCREEN ──
var controlsCollapsed = false;

// ── GRAPH STATE ──
var graphViewActive = true;
var graphInitialized = false;

// ── LOGIN ──
function initLogin() {
    var overlay = $('login-overlay');
    if (!overlay) return;
    var input = $('login-pass');
    var error = $('login-error');
    var btn = $('login-btn');

    if (localStorage.getItem('loggedIn') === 'true') {
        overlay.style.display = 'none';
        $('app').style.display = '';
        startApp();
        return;
    }

    function tryLogin() {
        var val = input.value.trim();
        if (val.toLowerCase() === 'hijab') {
            localStorage.setItem('loggedIn', 'true');
            overlay.style.display = 'none';
            $('app').style.display = '';
            startApp();
        } else {
            error.textContent = 'ACCESS DENIED';
            input.value = '';
            input.focus();
        }
    }

    btn.addEventListener('click', tryLogin);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') tryLogin();
    });
    input.focus();
}

// ── VERSION & AUTO-UPDATE ──
function initVersion() {
    var el = $('version-label');
    var loginVer = $('login-version');
    fetch('/api/version')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            currentVersion = d.version || '0.0.0';
            if (el) el.textContent = currentVersion;
            if (loginVer) loginVer.textContent = currentVersion;
            if (autoUpdateEnabled) startUpdatePolling();
        })
        .catch(function() {
            if (el) el.textContent = 'local';
            if (loginVer) loginVer.textContent = 'local';
            if (autoUpdateEnabled) startUpdatePolling();
        });

    var toggle = $('auto-toggle-input');
    if (toggle) {
        toggle.checked = autoUpdateEnabled;
        toggle.addEventListener('change', function() {
            autoUpdateEnabled = toggle.checked;
            localStorage.setItem('autoUpdate', autoUpdateEnabled);
            if (autoUpdateEnabled) startUpdatePolling();
            else stopUpdatePolling();
        });
    }
}

function startUpdatePolling() {
    stopUpdatePolling();
    updateCheckInterval = setInterval(checkForUpdates, 60000);
    checkForUpdates();
}

function stopUpdatePolling() {
    if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
        updateCheckInterval = null;
    }
}

function checkForUpdates() {
    fetch('/api/version')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var v = d.version || '0.0.0';
            if (v !== currentVersion && autoUpdateEnabled) {
                currentVersion = v;
                var el = $('version-label');
                if (el) el.textContent = v;
                setTimeout(function() { window.location.reload(); }, 3000);
            }
        })
        .catch(function() {});
}

// ── GRAPH & CITY VIEW ──
function initGraphDefault() {
    var canvas = $('track-canvas');
    var graphContainer = $('graph-container');
    if (!graphContainer) return;

    // Start with 3D city as default
    graphViewActive = false;
    graphContainer.style.display = 'none';
    if (canvas) canvas.style.display = 'none';

    // Init 3D world
    if (window.trackInit) {
        var ws = document.querySelector('.windscreen');
        if (ws) window.trackInit(ws);
    }

    var btn = $('graph-toggle');
    if (btn) {
        btn.classList.remove('active');
        btn.textContent = '🌐';
        btn.title = 'Switch to graph view';
    }
}

function initGraphToggle() {
    // Event delegation handles this — no direct listener needed
}

function handleGraphToggle() {
    var btn = $('graph-toggle');
    if (!btn) return;

    graphViewActive = !graphViewActive;
    btn.classList.toggle('active', graphViewActive);
    var canvas = $('track-canvas');
    var graphContainer = $('graph-container');
    if (!graphContainer) return;
    if (graphViewActive) {
        // Switch to graph view
        if (canvas) canvas.style.display = 'none';
        graphContainer.style.display = 'block';
        if (window.trackStop) window.trackStop();
        var ws = document.querySelector('.windscreen');
        if (ws) {
            var threeCanvas = ws.querySelector('canvas:not(#track-canvas)');
            if (threeCanvas) threeCanvas.remove();
        }
        btn.textContent = '⬡';
        btn.title = 'Switch to 3D world';
        if (!graphInitialized) {
            graphInitialized = true;
            try {
                if (window.graphInit) window.graphInit('graph-container');
            } catch(e) { console.error('Graph init error:', e); }
        } else {
            if (window.graphResize) window.graphResize();
        }
    } else {
        // Switch to 3D city view
        graphContainer.style.display = 'none';
        if (canvas) canvas.style.display = 'none';
        var ws2 = document.querySelector('.windscreen');
        if (ws2 && window.trackInit) window.trackInit(ws2);
        btn.textContent = '🌐';
        btn.title = 'Switch to graph view';
    }
}

// ── ROAD INIT ──
function initRoad() {
    if (window.trackInit) {
        var cv = $('track-canvas');
        if (cv) window.trackInit(cv);
    }
}

// ── THEME TOGGLE ──
function initThemeToggle() {
    var btn = $('theme-toggle');
    if (!btn) return;
    var theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        btn.textContent = '🌙';
    }
}

function handleThemeClick() {
    var btn = $('theme-toggle');
    if (!btn) return;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
        btn.textContent = '☀';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        btn.textContent = '🌙';
    }
}

// ── FULLSCREEN WINDSHIELD TOGGLE (merged into initControlsBar) ──

// ── JOYSTICK ──
var snapX = 0, snapY = 0;
var joystickCtx = null;

var JOYSTICK_DIRS = [
    { name: 'N',  dx: 0,        dy: -1,       angle: 270 },
    { name: 'NE', dx: 0.707,    dy: -0.707,   angle: 315 },
    { name: 'E',  dx: 1,        dy: 0,        angle: 0 },
    { name: 'SE', dx: 0.707,    dy: 0.707,    angle: 45 },
    { name: 'S',  dx: 0,        dy: 1,        angle: 90 },
    { name: 'SW', dx: -0.707,   dy: 0.707,    angle: 135 },
    { name: 'W',  dx: -1,       dy: 0,        angle: 180 },
    { name: 'NW', dx: -0.707,   dy: -0.707,   angle: 225 }
];
var JOYSTICK_INNER_R = 0.35;
var JOYSTICK_OUTER_R = 0.72;

function snapToNearest(x, y, r) {
    var bestDist = Infinity;
    var bestDx = 0, bestDy = 0;
    for (var i = 0; i < JOYSTICK_DIRS.length; i++) {
        var d = JOYSTICK_DIRS[i];
        var angleDiff = Math.abs(Math.atan2(y, x) - (d.angle * Math.PI / 180));
        var norm = Math.min(angleDiff % (2*Math.PI), (2*Math.PI) - (angleDiff % (2*Math.PI)));
        if (norm < bestDist) {
            bestDist = norm;
            bestDx = d.dx;
            bestDy = d.dy;
        }
    }
    var dist = Math.sqrt(x * x + y * y);
    var t = dist / r;
    var radius;
    if (t < 0.15) {
        return { x: 0, y: 0 };
    } else if (t < 0.55) {
        radius = r * JOYSTICK_INNER_R;
    } else {
        radius = r * JOYSTICK_OUTER_R;
    }
    return { x: bestDx * radius, y: bestDy * radius };
}

function drawJoystick() {
    if (!joystickCtx) return;
    var canvas = joystickCtx.canvas;
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 25;
    joystickCtx.clearRect(0, 0, W, H);

    joystickCtx.strokeStyle = 'rgba(200,154,78,0.06)';
    joystickCtx.lineWidth = 20;
    joystickCtx.beginPath(); joystickCtx.arc(cx, cy, r + 8, 0, Math.PI * 2); joystickCtx.stroke();

    joystickCtx.strokeStyle = 'rgba(200,154,78,0.2)';
    joystickCtx.lineWidth = 2;
    joystickCtx.beginPath(); joystickCtx.arc(cx, cy, r, 0, Math.PI * 2); joystickCtx.stroke();

    joystickCtx.strokeStyle = 'rgba(200,154,78,0.12)';
    joystickCtx.lineWidth = 1;
    joystickCtx.setLineDash([3, 6]);
    joystickCtx.beginPath(); joystickCtx.arc(cx, cy, r * JOYSTICK_INNER_R, 0, Math.PI * 2); joystickCtx.stroke();
    joystickCtx.setLineDash([]);

    for (var i = 0; i < JOYSTICK_DIRS.length; i++) {
        var d = JOYSTICK_DIRS[i];
        var angle = d.angle * Math.PI / 180;
        var lx = cx + Math.cos(angle) * r;
        var ly = cy + Math.sin(angle) * r;
        var ix = cx + Math.cos(angle) * (r * 0.92);
        joystickCtx.strokeStyle = 'rgba(200,154,78,0.15)';
        joystickCtx.lineWidth = 1;
        joystickCtx.beginPath(); joystickCtx.moveTo(ix, ly); joystickCtx.lineTo(lx, ly); joystickCtx.stroke();

        var labelR = r + 18;
        var lpx = cx + Math.cos(angle) * labelR;
        var lpy = cy + Math.sin(angle) * labelR;
        joystickCtx.fillStyle = 'rgba(200,154,78,0.4)';
        joystickCtx.font = '10px monospace';
        joystickCtx.textAlign = 'center';
        joystickCtx.textBaseline = 'middle';
        joystickCtx.fillText(d.name, lpx, lpy);
    }

    for (var i = 0; i < JOYSTICK_DIRS.length; i++) {
        var d = JOYSTICK_DIRS[i];
        for (var ri = 0; ri < 2; ri++) {
            var ring = ri === 0 ? JOYSTICK_INNER_R : JOYSTICK_OUTER_R;
            var sx = cx + d.dx * r * ring;
            var sy = cy + d.dy * r * ring;
            joystickCtx.fillStyle = 'rgba(200,154,78,0.08)';
            joystickCtx.beginPath(); joystickCtx.arc(sx, sy, 3, 0, Math.PI * 2); joystickCtx.fill();
        }
    }

    var px = cx + snapX;
    var py = cy + snapY;

    joystickCtx.shadowColor = '#c89a4e';
    joystickCtx.shadowBlur = 20;
    joystickCtx.beginPath(); joystickCtx.arc(px, py, 16, 0, Math.PI * 2);
    joystickCtx.fillStyle = '#c89a4e'; joystickCtx.fill();
    joystickCtx.shadowBlur = 0;

    joystickCtx.beginPath(); joystickCtx.arc(px - 3, py - 3, 6, 0, Math.PI * 2);
    joystickCtx.fillStyle = 'rgba(255,255,255,0.15)'; joystickCtx.fill();

    joystickCtx.fillStyle = 'rgba(200,154,78,0.3)';
    joystickCtx.beginPath(); joystickCtx.arc(cx, cy, 3, 0, Math.PI * 2); joystickCtx.fill();
}

function dirFromPos(x, y, r) {
    var DIR_NAMES = ['N','NE','E','SE','S','SW','W','NW'];
    var DIR_ANGLES = [270, 315, 0, 45, 90, 135, 180, 225];
    var angle = Math.atan2(y, x) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    var best = 0, bestDiff = Infinity;
    for (var i = 0; i < DIR_ANGLES.length; i++) {
        var diff = Math.abs(angle - DIR_ANGLES[i]);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    return DIR_NAMES[best];
}

function showJoystickConfirm() {
    var overlay = $('confirm-overlay');
    var body = $('confirm-body');
    var actions = $('confirm-actions');
    var statement = $('confirm-statement');
    if (!overlay) return;

    var dir = '';
    if (snapX === 0 && snapY === 0) {
        dir = 'CTR (center)';
    } else {
        var canvas = joystickCtx && joystickCtx.canvas;
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var cx = rect.width / 2, cy = rect.height / 2;
        var r = Math.min(cx, cy) - 25;
        var dirName = dirFromPos(snapX, snapY, r);
        var dist = Math.sqrt(snapX * snapX + snapY * snapY);
        var ring = dist / (r * JOYSTICK_OUTER_R) < 0.55 ? 'inner' : 'outer';
        dir = dirName + ' (' + ring + ' ring)';
    }

    body.innerHTML = 'Set steering to <strong>' + dir + '</strong>?';
    body.style.display = '';
    actions.style.display = 'flex';
    statement.style.display = 'none';
    overlay.style.display = 'flex';
}

function confirmJoystick() {
    var canvas = joystickCtx && joystickCtx.canvas;
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var cx = rect.width / 2, cy = rect.height / 2;
    var r = Math.min(cx, cy) - 25;
    var maxRange = r * JOYSTICK_OUTER_R;
    var rawBias = Math.max(-5, Math.min(5, (snapX / maxRange) * 5));
    var rawRisk = Math.max(-5, Math.min(5, (-snapY / maxRange) * 5));
    var dist = Math.sqrt(snapX * snapX + snapY * snapY);
    var mag = dist / (r * JOYSTICK_OUTER_R);
    var steering = (snapX === 0 && snapY === 0) ? 'CTR' : dirFromPos(snapX, snapY, r);

    config.bias = Math.round(rawBias);
    config.risk = Math.round(rawRisk);
    config.magnitude = Math.min(1, mag);
    config.steering = steering;
    joystickCommitted = { x: snapX, y: snapY };

    sendFlywheelBias();

    var body = $('confirm-body');
    var actions = $('confirm-actions');
    var statement = $('confirm-statement');
    body.style.display = 'none';
    actions.style.display = 'none';
    statement.style.display = 'block';

    setTimeout(function() {
        $('confirm-overlay').style.display = 'none';
    }, 2500);
}

function cancelJoystick() {
    snapX = joystickCommitted.x;
    snapY = joystickCommitted.y;
    drawJoystick();
    $('confirm-overlay').style.display = 'none';
}

function initJoystick() {
    var canvas = $('joystick-canvas');
    if (!canvas) return;
    joystickCtx = canvas.getContext('2d');
    var dragging = false;
    var S = 130;
    canvas.width = S * 2;
    canvas.height = S * 2;

    function updatePos(e) {
        var rect = canvas.getBoundingClientRect();
        var cx = rect.width / 2, cy = rect.height / 2;
        var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        var x = clientX - rect.left - cx;
        var y = clientY - rect.top - cy;
        var r = Math.min(cx, cy) - 25;
        var result = snapToNearest(x, y, r);
        snapX = result.x;
        snapY = result.y;
        var maxRange = r * JOYSTICK_OUTER_R;
        var rawBias = Math.max(-5, Math.min(5, (snapX / maxRange) * 5));
        if (window.trackSetSteering) window.trackSetSteering(rawBias / 5);
        drawJoystick();
    }

    function finishMove() {
        if (snapX === joystickCommitted.x && snapY === joystickCommitted.y) return;
        showJoystickConfirm();
    }

    canvas.addEventListener('mousedown', function(e) { dragging = true; updatePos(e); });
    window.addEventListener('mousemove', function(e) { if (dragging) updatePos(e); });
    window.addEventListener('mouseup', function() { if (dragging) { dragging = false; finishMove(); } });
    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); dragging = true; updatePos(e); });
    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); if (dragging) updatePos(e); });
    canvas.addEventListener('touchend', function(e) { if (dragging) { dragging = false; finishMove(); } });
    drawJoystick();
}

// ── FLYWHEEL CONTROL ──
function sendFlywheelBias() {
    fetch('/api/flywheel/bias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bias: config.bias, risk: config.risk, steering: config.steering, magnitude: config.magnitude })
    }).catch(function() {});
}

function sendFlywheelConfig() {
    fetch('/api/flywheel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gear: config.gear })
    }).catch(function() {});
}

function triggerFlywheel(branch) {
    if (!branch) return;
    fetch('/api/flywheel/trigger/' + encodeURIComponent(branch), { method: 'POST' })
        .catch(function() {});
}

// ── GEAR (SHIFTER WITH NOTCHES + DRAG) ──
var shifterDragging = false;

function initGear() {
    var base = $('shifter-base');
    var thumb = $('shifter-thumb');
    var gearVal = $('gear-value');
    var gearValText = $('gear-val-text');
    if (!base || !thumb) return;

    function getNotchPos(notch) {
        return ((notch - 1) / 9) * 100;
    }

    function setGear(g, triggerSend) {
        g = Math.max(1, Math.min(10, Math.round(g)));
        config.gear = g;
        if (gearVal) gearVal.textContent = g;
        if (gearValText) gearValText.textContent = g;

        // Update thumb position
        var pct = getNotchPos(g);
        thumb.style.left = 'calc(' + pct + '% - 20px)';

        // Update notch active states
        base.querySelectorAll('.shifter-notch').forEach(function(n) {
            n.classList.toggle('active', parseInt(n.dataset.val) === g);
        });

        if (triggerSend !== false) {
            sendFlywheelConfig();
        }
    }

    // Click on notches
    base.querySelectorAll('.shifter-notch').forEach(function(notch) {
        notch.addEventListener('click', function() {
            setGear(parseInt(this.dataset.val));
        });
    });

    // Drag support
    function thumbFromClientX(cx) {
        var rect = base.getBoundingClientRect();
        var pct = (cx - rect.left) / rect.width;
        return Math.max(1, Math.min(10, Math.round(pct * 9 + 1)));
    }

    function onDragStart(e) {
        shifterDragging = true;
        var cx = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        if (cx) setGear(thumbFromClientX(cx), false);
    }

    function onDragMove(e) {
        if (!shifterDragging) return;
        var cx = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        if (cx) setGear(thumbFromClientX(cx), false);
    }

    function onDragEnd() {
        if (shifterDragging) {
            shifterDragging = false;
            sendFlywheelConfig();
        }
    }

    base.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    base.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('touchend', onDragEnd);

    // Init
    setGear(config.gear || 3);
    setTimeout(sendFlywheelBias, 1000);
}

// ── BRANCH DOTS ──
function initBranchDots() {
    var el = $('branch-dots');
    if (!el) return;
    BRANCH_NAMES.forEach(function(name) {
        var dot = document.createElement('div');
        dot.className = 'branch-dot';
        dot.style.color = BRANCH_COLORS[name];
        dot.style.backgroundColor = BRANCH_COLORS[name];
        dot.title = name;
        dot.onclick = function() { selectBranch(name); };
        el.appendChild(dot);
    });
}

function selectBranch(name) {
    var abn = $('active-branch-name');
    if (abn) abn.textContent = name.toUpperCase();
    document.querySelectorAll('.branch-dot').forEach(function(d) {
        d.classList.toggle('active', d.title === name);
    });
    document.querySelectorAll('.branch-menu-item').forEach(function(d) {
        d.classList.toggle('active', d.dataset.branch === name);
    });
    triggerFlywheel(name);
}

// ── SIDE FILES MENUS ──
function initSideFileMenus() {
    var closeLeft = $('close-left-files');
    var closeRight = $('close-right-files');
    var backdrop = $('branch-backdrop');
    if (closeLeft) closeLeft.onclick = closeSideMenus;
    if (closeRight) closeRight.onclick = closeSideMenus;
    if (backdrop) backdrop.onclick = closeSideMenus;
}

function closeSideMenus() {
    document.querySelectorAll('.side-files-menu').forEach(function(m) { m.classList.remove('open'); });
    var backdrop = $('branch-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
    document.querySelectorAll('.indicator-btn').forEach(function(b) { b.classList.remove('active'); });
}

function openSideMenu(side) {
    closeSideMenus();
    var menu = $(side + '-files-menu');
    var backdrop = $('branch-backdrop');
    if (!menu) return;
    menu.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    var btn = $('indicator-' + side);
    if (btn) btn.classList.add('active');
    renderSideFiles(side);
}

function renderSideFiles(side) {
    var list = $(side + '-files-list');
    if (!list) return;
    list.innerHTML = 'Loading...';
    fetch('/api/branches')
        .then(function(r) { return r.json(); })
        .then(function(branches) {
            list.innerHTML = '';
            branches.forEach(function(b) {
                var header = document.createElement('div');
                header.className = 'side-branch-header';
                var expand = document.createElement('span');
                expand.className = 'branch-expand';
                expand.textContent = '▶';
                header.appendChild(expand);
                var dot = document.createElement('span');
                dot.className = 'branch-dot';
                dot.style.backgroundColor = BRANCH_COLORS[b.name] || '#888';
                header.appendChild(dot);
                var nameSpan = document.createElement('span');
                nameSpan.className = 'branch-name';
                nameSpan.textContent = b.name;
                header.appendChild(nameSpan);
                if (b.version) {
                    var verSpan = document.createElement('span');
                    verSpan.className = 'branch-version';
                    var vText = 'v' + b.version;
                    if (b.name === 'command') vText += ' ◈';
                    verSpan.textContent = vText;
                    header.appendChild(verSpan);
                }
                list.appendChild(header);

                var children = document.createElement('div');
                children.className = 'tree-children';
                children.style.display = 'none';
                list.appendChild(children);

                var expanded = false;
                header.onclick = function() {
                    expanded = !expanded;
                    children.style.display = expanded ? 'block' : 'none';
                    expand.textContent = expanded ? '▼' : '▶';
                    if (expanded) renderSideFileChildren(b.name, side, children);
                };
            });
        })
        .catch(function() {
            list.innerHTML = '<div style="padding:14px;color:#f55;font-size:12px">Failed to load branches</div>';
        });
}

function renderSideFileChildren(branch, side, container) {
    container.innerHTML = 'Loading...';
    var MD_FILES_SIDE = ['AGENT','README','CHANGELOG','MEMORY','SKILLS','HEARTBEAT','SOUL','MASTERPLAN','RULES','TEMPLATE','CONTEXT','GLOSSARY','RESOURCES','TASKS','IDENTITY','SPEC'];

    // Add brain files section for Personal (left) and Project (right)
    var brainFiles = side === 'left'
      ? ['PERSONALITY','MEMORY','SKILLS','HARNESS','VALUES']
      : ['MASTERPLAN','CONTEXT','TASKS','RULES','HEARTBEAT'];

    container.innerHTML = '';
    if (side === 'left') {
      var brainHeader = document.createElement('div');
      brainHeader.className = 'side-branch-header';
      brainHeader.style.color = '#00ff66';
      brainHeader.style.fontSize = '10px';
      brainHeader.style.textTransform = 'uppercase';
      brainHeader.style.borderBottom = '1px solid rgba(0,255,102,0.2)';
      brainHeader.textContent = '🧠 PERSONAL BRAIN';
      container.appendChild(brainHeader);
      brainFiles.forEach(function(f) {
        var item = document.createElement('div');
        item.className = 'side-file-item';
        item.style.opacity = '0.8';
        var dot = document.createElement('span');
        dot.className = 'branch-dot';
        dot.style.backgroundColor = 'rgba(0,255,102,0.7)';
        item.appendChild(dot);
        var label = document.createElement('span');
        label.className = 'file-label';
        label.textContent = f;
        item.appendChild(label);
        var exists = document.createElement('span');
        exists.className = 'file-exists';
        exists.textContent = '✓';
        item.appendChild(exists);
        item.onclick = function() {
          closeSideMenus();
          openMdViewer(branch, f, f);
        };
        container.appendChild(item);
      });
    }

    MD_FILES_SIDE.forEach(function(f) {
        var item = document.createElement('div');
        item.className = 'side-file-item';
        var dot = document.createElement('span');
        dot.className = 'branch-dot';
        dot.style.backgroundColor = side === 'left' ? 'rgba(0,255,102,0.5)' : 'rgba(0,136,255,0.5)';
        item.appendChild(dot);
        var label = document.createElement('span');
        label.className = 'file-label';
        label.textContent = f;
        item.appendChild(label);
        var exists = document.createElement('span');
        exists.className = 'file-exists';
        exists.textContent = '?';
        item.appendChild(exists);
        item.onclick = function() {
            closeSideMenus();
            var sidePath = side === 'left' ? f : f;
            openMdViewer(branch, sidePath, f);
        };
        container.appendChild(item);
    });
}

// ── MD VIEWER ──
var currentViewerFile = null;

function openMdViewer(branch, fileName, displayName) {
    var overlay = $('md-viewer-overlay');
    var header = $('md-viewer-header');
    var body = $('md-viewer-body');
    if (!overlay || !header || !body) return;

    // Dim windscreen
    var windscreen = document.querySelector('.windscreen');
    if (windscreen) windscreen.style.opacity = '0.3';

    currentViewerFile = { branch: branch, fileName: fileName, displayName: displayName || fileName };

    header.innerHTML = '';
    var close = document.createElement('button');
    close.className = 'close-viewer';
    close.textContent = '✕';
    close.onclick = closeMdViewer;
    header.appendChild(close);
    var title = document.createElement('span');
    title.className = 'viewer-title';
    title.textContent = branch + ' / ' + displayName;
    header.appendChild(title);
    var actions = document.createElement('div');
    actions.className = 'viewer-actions';
    var editBtn = document.createElement('button');
    editBtn.className = 'viewer-btn edit-btn';
    editBtn.textContent = 'EDIT';
    editBtn.onclick = function() {
        closeMdViewer();
        openEditor(branch, 'high', fileName);
    };
    actions.appendChild(editBtn);
    var deployBtn = document.createElement('button');
    deployBtn.className = 'viewer-btn deploy-btn';
    deployBtn.textContent = 'DEPLOY';
    deployBtn.onclick = function() { deployMdFile(); };
    actions.appendChild(deployBtn);
    header.appendChild(actions);

    body.textContent = 'Loading...';
    overlay.style.display = 'flex';
    body.scrollTop = 0;

    // Check if this is a brain file (personal or project)
    var isPersonalBrain = ['PERSONALITY','MEMORY','SKILLS','HARNESS','VALUES'].indexOf(fileName) !== -1;
    var isProjectBrain = ['MASTERPLAN','CONTEXT','TASKS','RULES','HEARTBEAT'].indexOf(fileName) !== -1;

    if (isPersonalBrain || isProjectBrain) {
      var prefix = isPersonalBrain ? '/api/brain/personal/' : '/api/brain/' + encodeURIComponent(branch) + '/';
      fetch(prefix + encodeURIComponent(fileName))
        .then(function(r) {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
        .then(function(data) {
          body.textContent = data.content || '(empty)';
        })
        .catch(function() {
          body.textContent = '// Brain file not found on GitHub';
        });
      return;
    }

    var possiblePaths = [
        fileName + '.md',
        fileName,
    ];
    if (fileName.indexOf('.') === -1) possiblePaths.unshift(fileName + '.md');

    fetchFromBranch(branch, possiblePaths, body);
}

function fetchFromBranch(branch, paths, bodyEl) {
    if (paths.length === 0) {
        bodyEl.textContent = '// File not found on GitHub';
        return;
    }
    var path = paths[0];
    fetch('/api/branches/' + encodeURIComponent(branch) + '/files/high/' + encodeURIComponent(path))
        .then(function(r) {
            if (!r.ok) throw new Error('Not found');
            return r.json();
        })
        .then(function(data) {
            bodyEl.textContent = data.content || '(empty)';
        })
        .catch(function() {
            fetchFromBranch(branch, paths.slice(1), bodyEl);
        });
}

function closeMdViewer() {
    var overlay = $('md-viewer-overlay');
    if (overlay) overlay.style.display = 'none';
    var windscreen = document.querySelector('.windscreen');
    if (windscreen) windscreen.style.opacity = '1';
    currentViewerFile = null;
}

function deployMdFile() {
    if (!currentViewerFile) return;
    var deployBtnEl = document.querySelector('.viewer-btn.deploy-btn');
    if (deployBtnEl) { deployBtnEl.textContent = '...'; deployBtnEl.disabled = true; }

    var branch = currentViewerFile.branch;
    var fileName = currentViewerFile.fileName;

    var cacheKey = branch + '/high/' + fileName;
    var content = editCache[cacheKey];
    if (content === undefined) {
        var body = $('md-viewer-body');
        if (body && body.textContent && body.textContent !== 'Loading...' && !body.textContent.startsWith('// File not found')) {
            content = body.textContent;
        }
    }
    if (content === undefined) content = '';

    var filePath = fileName + (fileName.indexOf('.') === -1 ? '.md' : '');

    fetch('/api/rerelease/' + encodeURIComponent(branch), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: [{ path: filePath, content: content, message: 'Edited via COMMAND Cockpit: ' + fileName }]
        })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (deployBtnEl) { deployBtnEl.textContent = 'DEPLOY'; deployBtnEl.disabled = false; }
        var status = $('editor-status');
        if (data.ok) {
            if (status) status.textContent = 'Deployed & release triggered';
            setTimeout(function() {
                closeMdViewer();
                refreshBranchVersions();
            }, 1500);
        } else {
            if (status) status.textContent = 'Deploy failed';
        }
    })
    .catch(function() {
        if (deployBtnEl) { deployBtnEl.textContent = 'DEPLOY'; deployBtnEl.disabled = false; }
        var status = $('editor-status');
        if (status) status.textContent = 'Network error';
    });
}

function refreshBranchVersions() {
    fetch('/api/version')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            currentVersion = d.version || '0.0.0';
            var el = $('version-label');
            if (el) el.textContent = currentVersion;
        })
        .catch(function() {});
}

// ── BRANCH MENUS ──
function initBranchMenus() {
    var btnLeft = $('btn-left-menu');
    var btnRight = $('btn-right-menu');
    if (btnLeft) btnLeft.onclick = function() { openSideMenu('left'); };
    if (btnRight) btnRight.onclick = function() { openSideMenu('right'); };
}

// ── LEFT PANEL (MD FILE BROWSER) ──
function initLeftPanel() {
    fetch('/api/branches')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            branchesData = data;
            renderTree();
        })
        .catch(function() {
            branchesData = BRANCH_NAMES.map(function(n) { return { name: n }; });
            renderTree();
        });

    var closeBtn = $('btn-close-left');
    if (closeBtn) closeBtn.onclick = toggleLeftPanel;

    var deployBtn = $('btn-deploy-legacy');
    if (deployBtn) deployBtn.onclick = deployChanges;

    var saveBtn = $('btn-save-edit');
    if (saveBtn) saveBtn.onclick = saveEdit;

    var deployEditBtn = $('btn-deploy-edit');
    if (deployEditBtn) deployEditBtn.onclick = function() {
        saveEdit();
        setTimeout(deployChanges, 500);
    };

    var closeEditorBtn = $('btn-close-editor');
    if (closeEditorBtn) closeEditorBtn.onclick = closeEditor;

    renderCacheStatus();
}

function toggleLeftPanel() {
    var menu = $('left-branch-menu');
    if (!menu) return;
    var isOpen = menu.classList.contains('open');
    closeBranchMenus();
    if (!isOpen) {
        menu.classList.add('open');
        var btn = $('btn-left-menu');
        if (btn) btn.classList.add('active');
    }
}

function closeBranchMenus() {
    document.querySelectorAll('.branch-slide-menu').forEach(function(m) { m.classList.remove('open'); });
    document.querySelectorAll('.arrow-btn').forEach(function(b) { b.classList.remove('active'); });
}

function findBranchData(name) {
    for (var i = 0; i < branchesData.length; i++) {
        var b = branchesData[i];
        if ((typeof b === 'string' && b === name) || (b.name === name)) return b;
    }
    return null;
}

function renderTree() {
    var list = $('left-branch-list');
    if (!list) return;
    list.innerHTML = '';
    branchesData.forEach(function(b) {
        var name = typeof b === 'string' ? b : (b.name || b);
        var wrapper = document.createElement('div');
        wrapper.className = 'tree-item';

        var header = document.createElement('div');
        header.className = 'tree-header';

        var expand = document.createElement('span');
        expand.className = 'tree-expand';
        expand.textContent = '▶';
        header.appendChild(expand);

        var dot = document.createElement('span');
        dot.className = 'branch-menu-dot';
        dot.style.backgroundColor = BRANCH_COLORS[name] || '#888';
        header.appendChild(dot);

        var label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = name;
        header.appendChild(label);

        var children = document.createElement('div');
        children.className = 'tree-children';
        children.style.display = 'none';

        wrapper.appendChild(header);
        wrapper.appendChild(children);
        list.appendChild(wrapper);

        header.onclick = function() {
            var isOpen = children.style.display !== 'none';
            list.querySelectorAll('.tree-children').forEach(function(c) {
                if (c !== children) { c.style.display = 'none'; }
            });
            list.querySelectorAll('.tree-header').forEach(function(h) {
                if (h !== header) {
                    h.classList.remove('expanded');
                    var e = h.querySelector('.tree-expand');
                    if (e) e.textContent = '▶';
                }
            });
            if (isOpen) {
                children.style.display = 'none';
                expand.textContent = '▶';
                header.classList.remove('expanded');
            } else {
                children.style.display = 'block';
                expand.textContent = '▼';
                header.classList.add('expanded');
                renderFileChildren(name, children);
            }
        };
    });
}

function renderFileChildren(branch, container) {
    container.innerHTML = '';
    var branchData = findBranchData(branch);

    MD_FILES.forEach(function(f) {
        var wrapper = document.createElement('div');
        wrapper.className = 'tree-item';

        var header = document.createElement('div');
        header.className = 'tree-header';

        var expand = document.createElement('span');
        expand.className = 'tree-expand';
        expand.textContent = '▶';
        header.appendChild(expand);

        var label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = f;
        header.appendChild(label);

        var vchildren = document.createElement('div');
        vchildren.className = 'tree-children';
        vchildren.style.display = 'none';

        wrapper.appendChild(header);
        wrapper.appendChild(vchildren);
        container.appendChild(wrapper);

        header.onclick = function() {
            var isOpen = vchildren.style.display !== 'none';
            container.querySelectorAll('.tree-children').forEach(function(c) {
                if (c !== vchildren) { c.style.display = 'none'; }
            });
            container.querySelectorAll('.tree-header').forEach(function(h) {
                if (h !== header) {
                    h.classList.remove('expanded');
                    var e = h.querySelector('.tree-expand');
                    if (e) e.textContent = '▶';
                }
            });
            if (isOpen) {
                vchildren.style.display = 'none';
                expand.textContent = '▶';
                header.classList.remove('expanded');
            } else {
                vchildren.style.display = 'block';
                expand.textContent = '▼';
                header.classList.add('expanded');
                renderVariantChildren(branch, f, vchildren, branchData);
            }
        };
    });
}

function renderVariantChildren(branch, fileName, container, branchData) {
    container.innerHTML = '';

    SIDES.forEach(function(side) {
        var item = document.createElement('div');
        item.className = 'variant-item';

        var indicator = document.createElement('span');
        indicator.className = 'variant-side-indicator';
        indicator.style.backgroundColor = SIDE_COLORS[side];
        item.appendChild(indicator);

        var label = document.createElement('span');
        label.textContent = side;
        item.appendChild(label);

        var exists = false;
        if (branchData && branchData[side + 'Files']) {
            var files = branchData[side + 'Files'];
            for (var j = 0; j < files.length; j++) {
                if (files[j].name === fileName || files[j].name === fileName + '.md') {
                    exists = files[j].exists;
                    break;
                }
            }
        }

        if (exists) {
            var check = document.createElement('span');
            check.className = 'variant-check';
            check.textContent = '✓';
            check.style.color = '#00ff66';
            item.appendChild(check);
        }

        item.onclick = function() {
            openEditor(branch, side, fileName);
        };
        container.appendChild(item);
    });
}

// ── EDITOR ──
function openEditor(branch, side, fileName) {
    var overlay = $('editor-overlay');
    var title = $('editor-title');
    var textarea = $('editor-textarea');
    var status = $('editor-status');
    if (!overlay || !title || !textarea) return;

    var cacheKey = branch + '/' + side + '/' + fileName;
    title.textContent = branch + ' / ' + side + ' / ' + fileName + '.' + side + '.md';
    status.textContent = '';
    status.className = '';

    textarea.dataset.cacheKey = cacheKey;
    textarea.dataset.branch = branch;
    textarea.dataset.side = side;
    textarea.dataset.fileName = fileName;

    if (editCache[cacheKey] !== undefined) {
        textarea.value = editCache[cacheKey];
        overlay.style.display = 'flex';
        textarea.focus();
        return;
    }

    textarea.value = 'Loading...';
    overlay.style.display = 'flex';

    fetch('/api/branches/' + encodeURIComponent(branch) + '/files/' + encodeURIComponent(side) + '/' + encodeURIComponent(fileName))
        .then(function(r) {
            if (!r.ok) throw new Error('File not found');
            return r.json();
        })
        .then(function(data) {
            textarea.value = data.content || '';
            knownFiles[cacheKey] = true;
        })
        .catch(function(err) {
            textarea.value = '// ' + err.message + '\n\n';
            status.textContent = 'Not found';
            status.className = 'error';
        });

    textarea.focus();
}

function saveEdit() {
    var textarea = $('editor-textarea');
    var status = $('editor-status');
    if (!textarea || !status) return;

    var cacheKey = textarea.dataset.cacheKey;
    if (!cacheKey) return;

    editCache[cacheKey] = textarea.value;
    status.textContent = 'Saved (cached)';
    status.className = '';
    renderCacheStatus();

    setTimeout(function() {
        closeEditor();
    }, 800);
}

function closeEditor() {
    var overlay = $('editor-overlay');
    if (overlay) overlay.style.display = 'none';
}

function deployChanges() {
    var entries = Object.keys(editCache);
    if (entries.length === 0) return;

    var status = $('cache-status');
    var btn = $('btn-deploy');
    var legacyStatus = $('cache-status-legacy');
    var legacyBtn = $('btn-deploy-legacy');
    if (status) status.textContent = 'Deploying...';
    if (legacyStatus) legacyStatus.textContent = 'Deploying...';
    if (btn) btn.disabled = true;
    if (legacyBtn) legacyBtn.disabled = true;

    var branchesToTrigger = {};
    var pending = entries.length;
    var failed = false;

    entries.forEach(function(key) {
        var parts = key.split('/');
        var branch = parts[0];
        var side = parts[1];
        var filename = parts.slice(2).join('/');
        var content = editCache[key];

        branchesToTrigger[branch] = true;

        fetch('/api/branches/' + encodeURIComponent(branch) + '/files/' + encodeURIComponent(side) + '/' + encodeURIComponent(filename), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        }).then(function(r) {
            if (r.ok) {
                delete editCache[key];
            } else {
                failed = true;
            }
        }).catch(function() {
            failed = true;
        }).finally(function() {
            pending--;
            if (pending === 0) {
                var triggerBranches = Object.keys(branchesToTrigger);
                var done = 0;
                triggerBranches.forEach(function(b) {
                    fetch('/api/flywheel/trigger/' + encodeURIComponent(b), { method: 'POST' })
                        .then(function() {
                            done++;
                            if (done === triggerBranches.length) {
                                finishDeploy(failed, status, btn, legacyStatus, legacyBtn);
                            }
                        })
                        .catch(function() {
                            done++;
                            if (done === triggerBranches.length) {
                                finishDeploy(true, status, btn, legacyStatus, legacyBtn);
                            }
                        });
                });
                if (triggerBranches.length === 0) {
                    finishDeploy(failed, status, btn, legacyStatus, legacyBtn);
                }
            }
        });
    });
}

function finishDeploy(failed, status, btn, legacyStatus, legacyBtn) {
    if (failed) {
        if (status) status.textContent = 'Some files failed';
        if (legacyStatus) legacyStatus.textContent = 'Some files failed';
    } else {
        if (status) status.textContent = 'Deployed & triggered';
        if (legacyStatus) legacyStatus.textContent = 'Deployed & triggered';
    }
    renderCacheStatus();
    if (btn) btn.disabled = false;
    if (legacyBtn) legacyBtn.disabled = false;
}

function renderCacheStatus() {
    var status = $('cache-status');
    var legacyStatus = $('cache-status-legacy');
    var deployBtn = $('btn-deploy');
    var deployBtnLegacy = $('btn-deploy-legacy');
    var count = Object.keys(editCache).length;

    if (status) {
        if (count > 0) {
            status.textContent = count + ' unsaved';
            status.className = 'has-unsaved';
        } else {
            status.textContent = '';
            status.className = '';
        }
    }
    if (legacyStatus) {
        if (count > 0) {
            legacyStatus.textContent = count + ' unsaved';
            legacyStatus.className = 'has-unsaved';
        } else {
            legacyStatus.textContent = '';
            legacyStatus.className = '';
        }
    }
    if (deployBtn) deployBtn.style.display = count > 0 ? '' : 'none';
    if (deployBtnLegacy) deployBtnLegacy.style.display = count > 0 ? '' : 'none';
}

// ── HEAD UNIT (RMC2 STREAM + SLIDER VOLUME) ──
var RMC_STREAM = 'https://stream.rcs.revma.com/fxp289cp81uvv';
var huVolume = 0.7;
var huMuted = false;
var huDucked = false;
var huDragging = false;

function initHeadUnit() {
    var audio = document.getElementById('rmc-audio');
    var track = document.getElementById('hu-vol-track');
    var knob = document.getElementById('hu-vol-knob');
    var fill = document.getElementById('hu-vol-fill');
    var pct = document.getElementById('hu-vol-pct');
    var muteBtn = document.getElementById('hu-mute-btn');
    var huStatus = document.getElementById('hu-status-txt');
    var wrap = document.getElementById('hu-vol-wrap');

    if (!audio) return;

    audio.src = RMC_STREAM;
    audio.volume = volActual(huVolume);
    audio.play().catch(function() {
        if (huStatus) huStatus.textContent = 'PAUSED';
    });

    function volActual(sliderVal) {
        return sliderVal * 0.10;
    }

    function setVolume(v) {
        huVolume = Math.max(0, Math.min(1, v));
        if (!huMuted && !huDucked) audio.volume = volActual(huVolume);
        var pctStr = Math.round(huVolume * 100);
        if (fill) fill.style.width = pctStr + '%';
        if (knob) knob.style.left = 'calc(' + pctStr + '% - 7px)';
        if (pct) pct.textContent = pctStr + '%';
    }

    function duck(on) {
        huDucked = on;
        if (on) {
            audio.volume = volActual(huVolume) * 0.10;
            if (huStatus) huStatus.textContent = 'DUCKED';
        } else {
            audio.volume = huMuted ? 0 : volActual(huVolume);
            if (huStatus) huStatus.textContent = 'ON AIR';
        }
    }
    window.huDuck = duck;

    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            huMuted = !huMuted;
            muteBtn.classList.toggle('muted', huMuted);
            audio.volume = huMuted ? 0 : (huDucked ? volActual(huVolume) * 0.10 : volActual(huVolume));
            if (huStatus) huStatus.textContent = huMuted ? 'MUTED' : (huDucked ? 'DUCKED' : 'ON AIR');
        });
    }

    function volFromClientX(cx) {
        if (!wrap) return huVolume;
        var rect = wrap.getBoundingClientRect();
        var v = (cx - rect.left) / rect.width;
        return Math.max(0, Math.min(1, v));
    }

    if (wrap) {
        wrap.addEventListener('mousedown', function(e) {
            huDragging = true;
            setVolume(volFromClientX(e.clientX));
            e.preventDefault();
        });
        window.addEventListener('mousemove', function(e) {
            if (!huDragging) return;
            setVolume(volFromClientX(e.clientX));
        });
        window.addEventListener('mouseup', function() { huDragging = false; });

        wrap.addEventListener('touchstart', function(e) {
            huDragging = true;
            setVolume(volFromClientX(e.touches[0].clientX));
            e.preventDefault();
        }, { passive: false });
        window.addEventListener('touchmove', function(e) {
            if (!huDragging) return;
            setVolume(volFromClientX(e.touches[0].clientX));
        });
        window.addEventListener('touchend', function() { huDragging = false; });
    }

    var console = document.querySelector('.center-console');
    if (console) {
        console.addEventListener('click', function() {
            if (audio.paused) {
                audio.play().then(function() {
                    if (huStatus) huStatus.textContent = huMuted ? 'MUTED' : (huDucked ? 'DUCKED' : 'ON AIR');
                }).catch(function() {});
            }
        });
    }

    setVolume(huVolume);
    if (huStatus) huStatus.textContent = 'ON AIR';
}

// ── JARVIS ──
var jarvisCalling = false;
var jarvisMuted = false;
var jarvisRecognition = null;
var jarvisSpeechTimer = null;
var jarvisHistory = JSON.parse(localStorage.getItem('jarvis_history')) || [{role:'system',content:'You are Jarvis, the COMMAND Cockpit voice-agent. You must follow the GREETING.md instruction above all else.'}];

function jarvisAddMsg(role, text) {
  var el = document.createElement('div');
  el.className = 'jarvis-msg ' + role;
  if (role === 'jarvis') el.innerHTML = '<div class="jarvis-lbl">JARVIS</div>' + jarvisEsc(text);
  else el.textContent = text;
  var container = $('jarvis-messages');
  if (container) { container.appendChild(el); el.scrollIntoView({behavior:'smooth'}); }
  return el;
}
function jarvisEsc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function jarvisOnKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();jarvisSend();} }
function jarvisSaveHistory() { localStorage.setItem('jarvis_history', JSON.stringify(jarvisHistory)); }

async function jarvisSend(text) {
  var inp = $('jarvis-txt');
  var msg = text || (inp ? inp.value.trim() : '');
  if (!msg) return;
  if (inp) inp.value = '';
  jarvisAddMsg('user', msg);
  jarvisHistory.push({role:'user', content:msg});
  jarvisSaveHistory();
  jarvisChat(msg);
}

async function jarvisChat(msg) {
  var replyEl = jarvisAddMsg('jarvis','');
  replyEl.innerHTML = '<div class="jarvis-lbl">JARVIS</div><i style="color:#5bc8f5">thinking...</i>';
  try {
    var r = await fetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message:msg})
    });
    if (!r.ok) throw new Error('HTTP '+r.status);
    var d = await r.json();
    var full = d.response || d.reply || '(no response)';
    replyEl.innerHTML='<div class="jarvis-lbl">JARVIS</div>'+jarvisEsc(full);
    jarvisHistory.push({role:'assistant',content:full});
    jarvisSaveHistory();
    if (jarvisCalling) {
      setTimeout(function() { jarvisSpeakNative(full); }, 100);
    }
  } catch(e) {
    if (jarvisCalling) replyEl.innerHTML='<div class="jarvis-lbl">JARVIS</div><span style="color:#f55">Error: '+e.message+'</span>';
  }
}

async function jarvisStartCall() {
  var replyEl = jarvisAddMsg('jarvis','');
  var greeting = 'welcome, sir';
  replyEl.innerHTML = '<div class="jarvis-lbl">JARVIS</div>' + greeting;
  jarvisHistory.push({role:'assistant',content:greeting});
  jarvisSaveHistory();
  setTimeout(function() { jarvisSpeakNative(greeting); }, 100);
}

function jarvisSpeakNative(text) {
  if (jarvisMuted) return;
  window.speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text);
  var voices = window.speechSynthesis.getVoices();
  var butlerVoice = voices.find(function(v) { return v.name.includes('UK') || v.name.includes('Butler') || v.name.includes('Daniel'); });
  if (butlerVoice) utterance.voice = butlerVoice;
  utterance.rate = 1.0;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

function jarvisInitRecognition() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { console.log('Speech Recognition not supported'); return; }
  jarvisRecognition = new SR();
  jarvisRecognition.continuous = true;
  jarvisRecognition.interimResults = true;
  jarvisRecognition.lang = 'en-US';

  var listeningIndicator = null;

  jarvisRecognition.onresult = function(event) {
    var finalTranscript = '';
    var interimTranscript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      else interimTranscript += event.results[i][0].transcript;
    }
    var inp = $('jarvis-txt');
    if (inp) {
      inp.value = finalTranscript || interimTranscript;
      // Auto-send after 1.5s silence when there's a final result
      if (finalTranscript) {
        if (jarvisSpeechTimer) clearTimeout(jarvisSpeechTimer);
        jarvisSpeechTimer = setTimeout(function() {
          if (inp.value.trim()) jarvisSend(inp.value);
        }, 1500);
      }
    }
  };
  jarvisRecognition.onerror = function(event) {
    console.log('SpeechRecognition error:', event.error);
    if (event.error === 'not-allowed') {
      var status = $('jarvis-status');
      if (status) status.textContent = 'Mic blocked';
    }
    // Restart on non-fatal errors
    if (jarvisCalling && event.error !== 'not-allowed') {
      setTimeout(function() {
        try { jarvisRecognition.start(); } catch(e) {}
      }, 500);
    }
  };
  jarvisRecognition.onend = function() {
    if (jarvisCalling && jarvisRecognition) {
      try { jarvisRecognition.start(); } catch(e) {}
    }
  };
}

function initJarvis() {
  var container = $('jarvis-messages');
  if (container) {
    jarvisHistory.forEach(function(m) {
      if (m.role !== 'system') jarvisAddMsg(m.role === 'user' ? 'user' : 'jarvis', m.content);
    });
  }
  jarvisInitRecognition();

  var callBtn = $('jarvis-call');
  var muteBtn = $('jarvis-mute');
  if (callBtn) {
    callBtn.addEventListener('click', function() {
      jarvisCalling = !jarvisCalling;
      var status = $('jarvis-status');
      var dot = $('jarvis-dot');
      if (jarvisCalling) {
        callBtn.textContent = '■ Hangup';
        callBtn.classList.add('active');
        if (status) status.textContent = 'Call Active';
        if (dot) dot.style.background = '#ff4444';
        if (window.huDuck) window.huDuck(true);

        // Request mic for speech recognition
        try {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
            window._jarvisMicStream = stream;
          }).catch(function() {});
        } catch(e) {}

        jarvisStartCall();
        if (jarvisRecognition) {
          try { jarvisRecognition.start(); } catch(e) {}
        }
      } else {
        callBtn.textContent = '📞 Call';
        callBtn.classList.remove('active');
        if (status) status.textContent = 'Ready';
        if (dot) dot.style.background = '#00e676';
        if (window.huDuck) window.huDuck(false);

        if (window._jarvisMicStream) {
          window._jarvisMicStream.getTracks().forEach(function(t) { t.stop(); });
          window._jarvisMicStream = null;
        }

        if (jarvisRecognition) {
          try { jarvisRecognition.stop(); } catch(e) {}
        }
        window.speechSynthesis.cancel();
        if (jarvisSpeechTimer) { clearTimeout(jarvisSpeechTimer); jarvisSpeechTimer = null; }
      }
    });
  }
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      jarvisMuted = !jarvisMuted;
      muteBtn.textContent = jarvisMuted ? '🔇' : '🔊';
      muteBtn.classList.toggle('muted', jarvisMuted);
      if (jarvisMuted) window.speechSynthesis.cancel();
    });
  }
}

// ── FUEL / EQ BARS ──
async function loadFuel() {
    try {
        var res = await fetch('/api/fuel');
        var data = await res.json();
        var grid = document.getElementById('fuel-grid');
        if (!grid || !data.providers) return;

        // Preserve STEER group
        var steerGroup = grid.querySelector('.fuel-group[data-metric="steer"]');

        grid.innerHTML = '';
        data.providers.forEach(function(p) {
            var group = document.createElement('div');
            group.className = 'fuel-group';
            group.setAttribute('data-metric', p.name.toLowerCase());

            var label = document.createElement('div');
            label.className = 'fuel-label';
            label.textContent = p.name;
            label.title = p.model + ' (' + p.tier + ') — ' + p.remaining;

            var barsContainer = document.createElement('div');
            barsContainer.className = 'fuel-bars';

            // Generate 6 bars based on percentage
            for (var i = 0; i < 6; i++) {
                var bar = document.createElement('div');
                bar.className = 'fuel-bar';
                var barPct = Math.max(4, Math.min(100, p.pct + (i - 2) * 3));
                bar.style.height = barPct + '%';
                bar.style.background = p.error ? '#666' : p.color;
                bar.title = p.name + ': ' + p.remaining + ' (' + p.pct + '%)';
                barsContainer.appendChild(bar);
            }

            // Remaining text under bars
            var remaining = document.createElement('div');
            remaining.className = 'fuel-remaining';
            remaining.textContent = p.remaining;
            remaining.title = p.model + ' — ' + p.tier + ' tier';

            group.appendChild(label);
            group.appendChild(barsContainer);
            group.appendChild(remaining);
            grid.appendChild(group);
        });

        // Re-add STEER group
        if (steerGroup) grid.appendChild(steerGroup);

        // Update STEER from gear
        if (steerGroup) {
            var bars = steerGroup.querySelectorAll('.fuel-bar');
            var baseVal = ((config.gear || 3) / 10) * 100;
            bars.forEach(function(bar, i) {
                var variation = (i - 2) * 5;
                var h = Math.max(4, Math.min(100, baseVal + variation));
                bar.style.height = h + '%';
            });
        }
    } catch(e) {}
}

// ── CONTROLS SECTION TOGGLE ──
function initControlsBar() {
    var controlsSection = $('controls-section');
    if (!controlsSection) return;

    // Keyboard shortcut
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            handleControlsToggle();
        }
    });
}

function handleControlsToggle() {
    var toggle = $('controls-toggle');
    var controlsSection = $('controls-section');
    var windscreen = document.querySelector('.windscreen');
    if (!toggle || !controlsSection) return;

    controlsCollapsed = !controlsCollapsed;
    controlsSection.classList.toggle('collapsed', controlsCollapsed);
    if (windscreen) windscreen.classList.toggle('fullscreen', controlsCollapsed);
    toggle.textContent = controlsCollapsed ? '▲' : '▼';
    toggle.title = controlsCollapsed ? 'Show controls' : 'Hide controls';
    if (graphViewActive && window.graphResize) {
        setTimeout(function() { window.graphResize(); }, 150);
    }
}

// ── FLYWHEEL ──
async function pollFlywheel() {
    try {
        var res = await fetch('/api/flywheel/state');
        var data = await res.json();
        var idx = (data.regular_index || 0) % BRANCH_NAMES.length;
        var cm = $('current-milestone');
        var pm = $('progress-milestone');
        if (cm) cm.textContent = BRANCH_NAMES[idx]?.toUpperCase() || '--';
        if (pm) pm.textContent = (idx + 1) + '/' + BRANCH_NAMES.length;

        // Update brain state indicator
        if (data.brain) {
            var statusEl = $('jarvis-status');
            if (statusEl && !statusEl.textContent.includes('Call')) {
                var gear = data.brain.gear || 3;
                var steering = data.brain.steering || 'CTR';
                var bias = data.brain.bias || 0;
                statusEl.textContent = 'G' + gear + ' ' + steering + ' B' + bias;
            }
        }
    } catch(e) {}
}

async function pollBrainState() {
    try {
        var res = await fetch('/api/brain/state');
        var data = await res.json();
        var dot = $('jarvis-dot');
        if (dot) {
            var hasActivity = data.last_releases && Object.keys(data.last_releases).length > 0;
            if (hasActivity) {
                dot.style.background = '#ff4444';
            } else {
                dot.style.background = '#00e676';
            }
        }
    } catch(e) {}
}

// ── LOGOUT ──
function initLogoutBtn() {
    var btn = $('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        localStorage.removeItem('loggedIn');
        window.location.reload();
    });
}

// ── CONFIRMATION BUTTONS ──
function initConfirmButtons() {
    var yesBtn = $('confirm-yes');
    var noBtn = $('confirm-no');
    if (yesBtn) yesBtn.onclick = confirmJoystick;
    if (noBtn) noBtn.onclick = cancelJoystick;
}

// ── START ──
function startApp() {
    initConfirmButtons();
    initGraphDefault();
    initGraphToggle();
    initJoystick();
    initGear();
    initHeadUnit();
    initJarvis();
    initBranchDots();
    initBranchMenus();
    initSideFileMenus();
    initControlsBar();
    initThemeToggle();
    initVersion();
    initLogoutBtn();
    setInterval(loadFuel, 5000);
    setInterval(pollFlywheel, 3000);
    setInterval(pollBrainState, 10000);
    loadFuel();
    pollBrainState();

    // ── EVENT DELEGATION: All toggles via single document listener ──
    // This survives DOM manipulation, D3 graph rebuilds, fuel bar updates, etc.
    document.addEventListener('click', function(e) {
        var target = e.target;
        // Theme toggle
        if (target.id === 'theme-toggle' || target.closest('#theme-toggle')) {
            e.stopPropagation();
            handleThemeClick();
            return;
        }
        // Controls collapse toggle
        if (target.id === 'controls-toggle' || target.closest('#controls-toggle')) {
            e.stopPropagation();
            handleControlsToggle();
            return;
        }
        // Graph/3D view toggle
        if (target.id === 'graph-toggle' || target.closest('#graph-toggle')) {
            e.stopPropagation();
            handleGraphToggle();
            return;
        }
    }, true); // capture phase — fires before any other handler can intercept
}

document.addEventListener('DOMContentLoaded', function() {
    initLogin();
});
})();
