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

var HONCHO_TENANT_IDS = {
    bpvsbuckler: '0lCBWsZN-CS-DyY8THX7H',
    datro: 'Q-sPB_HUr__vWcP1cc-UQ',
    financecheque: 'oSx32NCcWFHT7gRXWtrGo',
};

var config = window._config || { bias: 0, risk: 0, gear: 3, steering: 0 };
window._config = config;

var currentVersion = '0.0.0';
var latestVersion = null;
var autoUpdateEnabled = localStorage.getItem('autoUpdate') !== 'false';
var updateCheckInterval = null;

var isCallActive = false;
var speechSynth = window.speechSynthesis;
var speechRecog = null;
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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
        if (val.toLowerCase() === 'burgerking') {
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
    fetch('/api/version')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            currentVersion = d.version || '0.0.0';
            if (el) el.textContent = currentVersion;
        })
        .catch(function() {
            if (el) el.textContent = 'local';
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

    if (autoUpdateEnabled) startUpdatePolling();
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
    var updateBtn = $('update-btn');
    fetch('/api/version')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var v = d.version || '0.0.0';
            if (v !== currentVersion) {
                latestVersion = v;
                if (updateBtn) {
                    updateBtn.style.display = '';
                    updateBtn.textContent = 'UPDATE: ' + v;
                    updateBtn.onclick = function() {
                        window.location.reload();
                    };
                }
            }
        })
        .catch(function() {});
}

// ── ROAD INIT ──
function initRoad() {
    if (window.trackInit) {
        var cv = $('track-canvas');
        if (cv) window.trackInit(cv);
    }
}

// ── JOYSTICK ──
function initJoystick() {
    var canvas = $('joystick-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dragging = false;
    var S = 130;
    canvas.width = S * 2;
    canvas.height = S * 2;

    var DIRS = [
        { name: 'N',  dx: 0,        dy: -1,       angle: 270 },
        { name: 'NE', dx: 0.707,    dy: -0.707,   angle: 315 },
        { name: 'E',  dx: 1,        dy: 0,        angle: 0 },
        { name: 'SE', dx: 0.707,    dy: 0.707,    angle: 45 },
        { name: 'S',  dx: 0,        dy: 1,        angle: 90 },
        { name: 'SW', dx: -0.707,   dy: 0.707,    angle: 135 },
        { name: 'W',  dx: -1,       dy: 0,        angle: 180 },
        { name: 'NW', dx: -0.707,   dy: -0.707,   angle: 225 }
    ];
    var INNER_R = 0.35;
    var OUTER_R = 0.72;
    var snapX = 0, snapY = 0;

    function snapToNearest(x, y, r) {
        var bestDist = Infinity;
        var bestDx = 0, bestDy = 0;
        for (var i = 0; i < DIRS.length; i++) {
            var d = DIRS[i];
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
            radius = r * INNER_R;
        } else {
            radius = r * OUTER_R;
        }
        return { x: bestDx * radius, y: bestDy * radius };
    }

    function draw() {
        var W = canvas.width, H = canvas.height;
        var cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 25;
        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(200,154,78,0.06)';
        ctx.lineWidth = 20;
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = 'rgba(200,154,78,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = 'rgba(200,154,78,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.arc(cx, cy, r * INNER_R, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        for (var i = 0; i < DIRS.length; i++) {
            var d = DIRS[i];
            var angle = d.angle * Math.PI / 180;
            var lx = cx + Math.cos(angle) * r;
            var ly = cy + Math.sin(angle) * r;
            var ix = cx + Math.cos(angle) * (r * 0.92);
            ctx.strokeStyle = 'rgba(200,154,78,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(ix, ly); ctx.lineTo(lx, ly); ctx.stroke();

            var labelR = r + 18;
            var lpx = cx + Math.cos(angle) * labelR;
            var lpy = cy + Math.sin(angle) * labelR;
            ctx.fillStyle = 'rgba(200,154,78,0.4)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.name, lpx, lpy);
        }

        for (var i = 0; i < DIRS.length; i++) {
            var d = DIRS[i];
            for (var ri = 0; ri < 2; ri++) {
                var ring = ri === 0 ? INNER_R : OUTER_R;
                var sx = cx + d.dx * r * ring;
                var sy = cy + d.dy * r * ring;
                ctx.fillStyle = 'rgba(200,154,78,0.08)';
                ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
            }
        }

        var px = cx + snapX;
        var py = cy + snapY;

        ctx.shadowColor = '#c89a4e';
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#c89a4e'; ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath(); ctx.arc(px - 3, py - 3, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();

        ctx.fillStyle = 'rgba(200,154,78,0.3)';
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
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
        var maxRange = r * OUTER_R;
        var rawBias = Math.max(-5, Math.min(5, (snapX / maxRange) * 5));
        var rawRisk = Math.max(-5, Math.min(5, (-snapY / maxRange) * 5));
        config.bias = Math.round(rawBias);
        config.risk = Math.round(rawRisk);
        var dist = Math.sqrt(snapX * snapX + snapY * snapY);
        var mag = dist / (r * OUTER_R);
        config.magnitude = Math.min(1, mag);
        config.steering = (config.bias === 0 && config.risk === 0) ? 'CTR' : dirFromPos(snapX, snapY, r);
        if (window.trackSetSteering) window.trackSetSteering(config.bias / 5);
        sendFlywheelBias();
        draw();
    }

    canvas.addEventListener('mousedown', function(e) { dragging = true; updatePos(e); });
    window.addEventListener('mousemove', function(e) { if (dragging) updatePos(e); });
    window.addEventListener('mouseup', function() { dragging = false; });
    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); dragging = true; updatePos(e); });
    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); if (dragging) updatePos(e); });
    canvas.addEventListener('touchend', function() { dragging = false; });
    draw();
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

// ── GEAR ──
function initGear() {
    var slider = $('gear-slider');
    if (!slider) return;
    slider.addEventListener('input', function(e) {
        var g = parseInt(e.target.value);
        config.gear = g;
        var gv = $('gear-value');
        var gvt = $('gear-val-text');
        if (gv) gv.textContent = g;
        if (gvt) gvt.textContent = g;
        sendFlywheelConfig();
    });

    // Init: send bias on load
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

// ── BRANCH MENUS ──
function initBranchMenus() {
    var leftList = $('left-branch-list');
    var rightList = $('right-branch-list');
    if (!leftList || !rightList) return;
    [leftList, rightList].forEach(function(list) {
        BRANCH_NAMES.forEach(function(name) {
            var item = document.createElement('div');
            item.className = 'branch-menu-item';
            item.dataset.branch = name;
            var dot = document.createElement('span');
            dot.className = 'branch-menu-dot';
            dot.style.backgroundColor = BRANCH_COLORS[name];
            item.appendChild(dot);
            var label = document.createElement('span');
            label.className = 'branch-menu-name';
            label.textContent = name;
            item.appendChild(label);
            var tenantId = HONCHO_TENANT_IDS[name];
            if (tenantId) {
                var tenantLabel = document.createElement('span');
                tenantLabel.className = 'branch-menu-tenant';
                tenantLabel.textContent = '🏠 ' + tenantId.slice(0, 12) + '…';
                tenantLabel.title = tenantId;
                item.appendChild(tenantLabel);
            }
            item.onclick = function() {
                selectBranch(name);
                closeBranchMenus();
            };
            list.appendChild(item);
        });
    });

    var blm = $('btn-left-menu');
    var brm = $('btn-right-menu');
    if (blm) blm.onclick = function() { toggleBranchMenu('left'); };
    if (brm) brm.onclick = function() { toggleBranchMenu('right'); };
    var backdrop = $('branch-backdrop');
    if (backdrop) backdrop.onclick = closeBranchMenus;
}

function toggleBranchMenu(side) {
    var menu = $(side + '-branch-menu');
    var backdrop = $('branch-backdrop');
    var isOpen = menu.classList.contains('open');
    closeBranchMenus();
    if (!isOpen) {
        menu.classList.add('open');
        if (backdrop) backdrop.classList.add('visible');
        var btn = $('btn-' + side + '-menu');
        if (btn) btn.classList.add('active');
    }
}

function closeBranchMenus() {
    document.querySelectorAll('.branch-slide-menu').forEach(function(m) { m.classList.remove('open'); });
    var backdrop = $('branch-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
    document.querySelectorAll('.arrow-btn').forEach(function(b) { b.classList.remove('active'); });
}

// ── CALL ──
function initCall() {
    var btnCall = $('btn-call');
    var btnHangup = $('btn-hangup');
    if (btnCall) btnCall.onclick = startCall;
    if (btnHangup) btnHangup.onclick = endCall;
}

function startCall() {
    isCallActive = true;
    var bc = $('btn-call'), bh = $('btn-hangup'), cs = $('call-status');
    if (bc) bc.disabled = true;
    if (bh) bh.disabled = false;
    if (cs) cs.textContent = 'CALLING...';
    if (SpeechRecognition) startListening();
}

function endCall() {
    isCallActive = false;
    var bc = $('btn-call'), bh = $('btn-hangup'), cs = $('call-status');
    if (bc) bc.disabled = false;
    if (bh) bh.disabled = true;
    if (cs) cs.textContent = 'READY';
    if (speechRecog) speechRecog.stop();
    speechSynth.cancel();
}

function startListening() {
    speechRecog = new SpeechRecognition();
    speechRecog.continuous = true;
    speechRecog.onresult = function(e) {
        var last = e.results.length - 1;
        var text = e.results[last][0].transcript;
        if (e.results[last].isFinal) {
            var cs = $('call-status');
            if (cs) cs.textContent = 'HEARD: ' + text.slice(0, 15);
            sendChat(text);
        }
    };
    speechRecog.start();
}

async function sendChat(text) {
    try {
        var res = await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        var data = await res.json();
        speakReply(data.response || 'No response');
    } catch(e) { speakReply('System offline'); }
}

function speakReply(text) {
    var cs = $('call-status');
    if (cs) cs.textContent = 'AGENT SPEAKING';
    var utter = new SpeechSynthesisUtterance(text);
    utter.onend = function() { if (isCallActive && cs) cs.textContent = 'LISTENING...'; };
    speechSynth.speak(utter);
}

// ── FUEL ──
async function loadFuel() {
    try {
        var res = await fetch('/api/fuel');
        var data = await res.json();
        ['api','llm','cli','ide'].forEach(function(t) {
            var el = $('fuel-' + t);
            if (el) el.style.height = data[t] + '%';
        });
    } catch(e) {}
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
    } catch(e) {}
}

// ── AVATAR ──
function initAvatar() {
    var canvas = $('avatar-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var t = 0;
    function draw() {
        var W = canvas.width = canvas.clientWidth;
        var H = canvas.height = canvas.clientHeight;
        var cx = W / 2, cy = H / 2;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = isCallActive ? 'rgba(0, 255, 102, 0.1)' : 'rgba(200, 154, 78, 0.05)';
        ctx.beginPath(); ctx.arc(cx, cy, 35 + Math.sin(t*0.05)*3, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = isCallActive ? '#00ff66' : '#c89a4e';
        ctx.stroke();
        var blink = Math.sin(t*0.04) > 0.95 ? 0.1 : 1;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(cx - 12, cy - 8, 5, 10 * blink);
        ctx.fillRect(cx + 7, cy - 8, 5, 10 * blink);
        t++;
        requestAnimationFrame(draw);
    }
    draw();
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

// ── START ──
function startApp() {
    initRoad();
    initJoystick();
    initGear();
    initCall();
    initBranchDots();
    initBranchMenus();
    initAvatar();
    initVersion();
    initLogoutBtn();
    setInterval(loadFuel, 5000);
    setInterval(pollFlywheel, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    initLogin();
});
})();
