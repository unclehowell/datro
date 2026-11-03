const awsStatus = document.getElementById('aws-status');
const flywheelState = document.getElementById('flywheel-state');
const branchCount = document.getElementById('branch-count');
const logContent = document.getElementById('log-content');
const planEditor = document.getElementById('plan-editor');
const activeBranchPath = document.getElementById('active-branch-path');
const activeSideBadge = document.getElementById('active-side-badge');
const btnSavePlan = document.getElementById('btn-save-plan');
const fileExistsIndicator = document.getElementById('file-exists-indicator');
const treeLeft = document.getElementById('branch-tree-left');
const treeRight = document.getElementById('branch-tree-right');
const highBreadcrumb = document.getElementById('high-breadcrumb');
const lowBreadcrumb = document.getElementById('low-breadcrumb');
const btnCollapseLeft = document.getElementById('btn-collapse-left');
const btnCollapseRight = document.getElementById('btn-collapse-right');

const btnOta = document.getElementById('btn-ota');
const btnMeta = document.getElementById('btn-meta');
const btnTogglePause = document.getElementById('btn-toggle-pause');
const btnClearLogs = document.getElementById('btn-clear-logs');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

const pad2d = document.getElementById('pad-2d');
const padThumb = document.getElementById('pad-thumb');
const biasLabel = document.getElementById('bias-label');
const riskLabel = document.getElementById('risk-label');
const gearRange = document.getElementById('gear-range');
const gearDisplay = document.getElementById('gear-display');
const gearReadout = document.getElementById('gear-readout');

let currentConfig = { gear: 6, steering: 'CTR', bias: 3, risk: 3 };
let branches = [];
let expandedLeft = null;
let expandedRight = null;
let activeFile = null;
let padDragging = false;

const BIAS_LABELS = {
  1: 'STRICT L',
  2: 'FAVOUR L',
  3: 'NEUTRAL',
  4: 'FAVOUR R',
  5: 'STRICT R'
};

const RISK_LABELS = {
  1: 'LOW',
  2: 'FAVOUR LOW',
  3: 'NEUTRAL',
  4: 'FAVOUR HIGH',
  5: 'HIGH'
};

const BIAS_STEERING = {
  1: '90L',
  2: '45L',
  3: 'CTR',
  4: '45R',
  5: '90R'
};

const FILE_DESCRIPTIONS = {
  'master-record.md': 'Master vision and objectives. Source of truth that md-protocol.sh reads to generate both left and right protocol files.',
  'SPEC.md': 'Technical specification — compliance goals the flywheel targets for this side.',
  'AGENT.md': 'Agent instructions — how the AI should operate on this branch for this side.',
  'TASKS.md': 'Task checklist — items the flywheel has completed or should complete for this side.',
  'MEMORY.md': 'Reflexion memory — lessons learned from previous cycles for this side.',
  'README.md': 'Public-facing readme for the branch on this side.'
};

async function init() {
    await fetchConfig();
    await fetchBranches();
    await fetchVersion();
    await fetchAwsStatus();
    await fetchFuel();
    await updatePauseButtonState();
    connectLogs();

    btnSavePlan.addEventListener('click', saveFile);
    btnOta.addEventListener('click', triggerOta);
    btnMeta.addEventListener('click', triggerMeta);
    btnTogglePause.addEventListener('click', togglePause);
    btnClearLogs.addEventListener('click', () => logContent.textContent = '');
    btnCollapseLeft.addEventListener('click', () => collapseSide('left'));
    btnCollapseRight.addEventListener('click', () => collapseSide('right'));

    btnSendChat.addEventListener('click', sendChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });

    // 2D Pad mouse/touch handlers
    pad2d.addEventListener('mousedown', (e) => {
        padDragging = true;
        updatePadFromEvent(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (padDragging) updatePadFromEvent(e);
    });

    document.addEventListener('mouseup', () => {
        if (padDragging) {
            padDragging = false;
            commitPadPosition();
        }
    });

    pad2d.addEventListener('touchstart', (e) => {
        e.preventDefault();
        padDragging = true;
        updatePadFromEvent(e.touches[0]);
    });

    document.addEventListener('touchmove', (e) => {
        if (padDragging) {
            e.preventDefault();
            updatePadFromEvent(e.touches[0]);
        }
    });

    document.addEventListener('touchend', () => {
        if (padDragging) {
            padDragging = false;
            commitPadPosition();
        }
    });

    gearRange.addEventListener('input', (e) => {
        const v = e.target.value;
        gearDisplay.textContent = v;
        gearReadout.textContent = v;
    });

    gearRange.addEventListener('change', async (e) => {
        const val = parseInt(e.target.value);
        if (!confirm(`CONFIRM: SHIFT RELEASE GEAR TO SPEED ${val}?`)) {
            e.target.value = currentConfig.gear || 6;
            const g = currentConfig.gear || 6;
            gearDisplay.textContent = g;
            gearReadout.textContent = g;
            return;
        }
        await updateConfig({ gear: val });
    });

    setInterval(fetchAwsStatus, 10000);
    setInterval(fetchFuel, 5000);
}

function toggleModal(id) {
    const el = document.getElementById(id);
    if (id === 'comms-popup' && isCallActive && el.style.display !== 'none' && el.style.display !== '') {
        return; // Don't close during active call
    }
    el.style.display = (el.style.display === 'flex' || el.style.display === 'block') ? 'none' : 'flex';
}

function closeOnOverlay(e) {
    if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
}

window.toggleModal = toggleModal;
window.closeOnOverlay = closeOnOverlay;

async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        currentConfig = await res.json();
        applyConfigUI();
    } catch (err) {
        console.error('Failed to fetch config');
    }
}

function applyConfigUI() {
    gearRange.value = currentConfig.gear || 6;
    gearDisplay.textContent = currentConfig.gear || 6;
    gearReadout.textContent = currentConfig.gear || 6;
    const bx = currentConfig.bias || 3;
    const by = currentConfig.risk || 3;
    setPadPosition(bx, by);
}

function setPadPosition(bias, risk) {
    const rect = pad2d.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const px = ((bias - 1) / 4) * rect.width;
    const py = ((5 - risk) / 4) * rect.height;
    padThumb.style.left = px + 'px';
    padThumb.style.top = py + 'px';
    biasLabel.textContent = BIAS_LABELS[bias] || 'NEUTRAL';
    riskLabel.textContent = RISK_LABELS[risk] || 'NEUTRAL';
}

function updatePadFromEvent(e) {
    const rect = pad2d.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    padThumb.style.left = x + 'px';
    padThumb.style.top = y + 'px';
    const bias = Math.round((x / rect.width) * 4) + 1;
    const risk = 5 - Math.round((y / rect.height) * 4);
    biasLabel.textContent = BIAS_LABELS[bias] || 'NEUTRAL';
    riskLabel.textContent = RISK_LABELS[risk] || 'NEUTRAL';
    currentConfig._draftBias = bias;
    currentConfig._draftRisk = risk;
}

function commitPadPosition() {
    const bias = currentConfig._draftBias || 3;
    const risk = currentConfig._draftRisk || 3;
    if (!confirm(`CONFIRM: SET BIAS="${BIAS_LABELS[bias]}" RISK="${RISK_LABELS[risk]}"?`)) {
        applyConfigUI();
        return;
    }
    updateConfig({ bias, risk, steering: BIAS_STEERING[bias] });
}

const FLYWHEEL_URL = 'https://datro-flywheel.righteous.workers.dev';

async function updateConfig(patch) {
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
        currentConfig = await res.json();
        applyConfigUI();
    } catch (err) {
        console.error('Failed to update config');
    }
    if (patch.bias != null || patch.risk != null) {
        try {
            await fetch(FLYWHEEL_URL + '/__bias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bias: patch.bias != null ? patch.bias : currentConfig.bias,
                    steering: patch.steering || 'CTR',
                    risk: patch.risk != null ? patch.risk : currentConfig.risk
                })
            });
        } catch (err) {
            console.error('Failed to sync bias to flywheel:', err);
        }
    }
}

async function fetchFuel() {
    try {
        const res = await fetch('/api/fuel');
        const fuels = await res.json();
        document.getElementById('fuel-api').style.height = fuels.api + '%';
        document.getElementById('fuel-llm').style.height = fuels.llm + '%';
        document.getElementById('fuel-cli').style.height = fuels.cli + '%';
        document.getElementById('fuel-ide').style.height = fuels.ide + '%';
    } catch (err) {
        console.error('Failed to fetch fuel levels');
    }
}

async function fetchAwsStatus() {
    try {
        const res = await fetch('/api/aws/status');
        const data = await res.json();
        awsStatus.textContent = data.uptime.split(',')[0].replace('up ', '').toUpperCase();

        const isPausedRes = await fetch('/api/aws/is-paused');
        const isPausedData = await isPausedRes.json();
        flywheelState.textContent = isPausedData.paused ? 'PAUSED' : 'ACTIVE';
        flywheelState.style.color = isPausedData.paused ? 'var(--danger)' : 'var(--success)';
    } catch (err) {
        awsStatus.textContent = 'OFFLINE';
        flywheelState.textContent = 'UNKNOWN';
    }
}

// ── Branch Trees (Left + Right) ──

async function fetchVersion() {
    try {
        const res = await fetch('/api/version');
        const data = await res.json();
        document.getElementById('version-badge').textContent = 'v' + data.version;
    } catch (err) {
        console.error('Failed to fetch version');
    }
}

async function fetchBranches() {
    try {
        const res = await fetch('/api/branches');
        branches = await res.json();
        branchCount.textContent = branches.length;
        renderTree(treeLeft, branches, 'left');
        renderTree(treeRight, branches, 'right');
        renderRiskBreadcrumb('high', branches);
        renderRiskBreadcrumb('low', branches);
    } catch (err) {
        console.error('Failed to fetch branches:', err);
    }
}

function renderTree(container, branches, side) {
    container.innerHTML = '';
    branches.forEach(b => {
        const node = document.createElement('div');
        node.className = 'branch-node';

        const sideMap = { left: b.leftFiles, right: b.rightFiles, high: b.highFiles, low: b.lowFiles };
        const files = sideMap[side] || b.leftFiles;

        const header = document.createElement('div');
        header.className = 'branch-header';
        header.innerHTML = `<span class="branch-toggle">&#9654;</span><span class="branch-name">${b.name.toUpperCase()}</span>`;
        header.onclick = () => toggleBranch(b.name, side);
        node.appendChild(header);

        const fileList = document.createElement('div');
        fileList.className = 'branch-files';
        fileList.id = `files-${side}-${b.name}`;

        files.forEach(f => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.dataset.branch = b.name;
            item.dataset.filename = f.name;
            item.dataset.side = side;
            const label = f.label;
            item.innerHTML = `<span class="file-icon">&#128196;</span><span class="file-label">${label}</span>`;
            if (f.exists) {
                item.classList.add('exists');
                item.innerHTML += '<span class="file-check">&#10003;</span>';
            } else {
                item.innerHTML += '<span class="file-new">+new</span>';
            }
            item.onclick = (e) => {
                e.stopPropagation();
                loadFile(b.name, side, f.name);
            };
            fileList.appendChild(item);
        });

        node.appendChild(fileList);
        container.appendChild(node);
    });
}

function toggleBranch(name, side) {
    const fileList = document.getElementById(`files-${side}-${name}`);
    const header = fileList.previousElementSibling;
    const toggle = header.querySelector('.branch-toggle');
    const expandedKey = { left: 'expandedLeft', right: 'expandedRight', high: 'expandedHigh', low: 'expandedLow' }[side];
    const expandedRefs = { left: 'expandedLeft', right: 'expandedRight', high: 'expandedHigh', low: 'expandedLow' };
    const currentExpanded = { expandedLeft, expandedRight, expandedHigh, expandedLow }[expandedRefs[side]];

    const updateVar = (val) => {
        if (side === 'left') expandedLeft = val;
        else if (side === 'right') expandedRight = val;
        else if (side === 'high') expandedHigh = val;
        else if (side === 'low') expandedLow = val;
    };

    if (currentExpanded === name) {
        fileList.classList.remove('open');
        toggle.innerHTML = '&#9654;';
        updateVar(null);
    } else {
        if (currentExpanded) {
            const prev = document.getElementById(`files-${side}-${currentExpanded}`);
            if (prev) {
                prev.classList.remove('open');
                prev.previousElementSibling.querySelector('.branch-toggle').innerHTML = '&#9654;';
            }
        }
        fileList.classList.add('open');
        toggle.innerHTML = '&#9660;';
        updateVar(name);
    }
}

function collapseSide(side) {
    const expanded = side === 'left' ? expandedLeft : expandedRight;
    if (expanded) {
        const el = document.getElementById(`files-${side}-${expanded}`);
        if (el) {
            el.classList.remove('open');
            el.previousElementSibling.querySelector('.branch-toggle').innerHTML = '&#9654;';
        }
        if (side === 'left') expandedLeft = null; else expandedRight = null;
    }
}

// ── Risk Breadcrumb Bars (High/Low) ──

function renderRiskBreadcrumb(side, branches) {
    const container = document.getElementById(`${side}-breadcrumb`);
    container.innerHTML = '';
    branches.forEach(b => {
        const chip = document.createElement('div');
        chip.className = `risk-chip ${side}`;
        chip.innerHTML = `<span class="risk-chip-name">${b.name}</span><span class="risk-chip-arrow">▼</span>`;
        const dd = document.createElement('div');
        dd.className = 'risk-dropdown';
        dd.id = `risk-dd-${side}-${b.name}`;
        const sideKey = side + 'Files';
        const files = b[sideKey] || [];
        files.forEach(f => {
            const item = document.createElement('div');
            item.className = 'risk-dd-item';
            item.textContent = f.label;
            if (f.exists) item.innerHTML += ' <span class="file-check">✓</span>';
            else item.innerHTML += ' <span class="file-new">+new</span>';
            item.onclick = (e) => { e.stopPropagation(); loadFileForSide(b.name, side, f.name); };
            dd.appendChild(item);
        });
        chip.appendChild(dd);
        chip.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.risk-dropdown.open').forEach(d => { if (d !== dd) d.classList.remove('open'); });
            dd.classList.toggle('open');
        };
        container.appendChild(chip);
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.risk-dropdown.open').forEach(d => d.classList.remove('open'));
    });
}

function loadFileForSide(branch, side, filename) {
    activeFile = { branch, side, filename };
    const labelMap = { 'SPEC.md': 'SPEC', 'AGENT.md': 'AGENT', 'TASKS.md': 'TASKS', 'MEMORY.md': 'MEMORY', 'README.md': 'README' };
    const label = labelMap[filename] || filename.replace('.md', '');
    const sideMap = { left: 'LEFT', right: 'RIGHT', high: 'HIGH', low: 'LOW' };
    activeBranchPath.textContent = `${branch.toUpperCase()} / ${label}`;
    activeSideBadge.textContent = sideMap[side] || side.toUpperCase();
    activeSideBadge.className = `side-badge ${side}`;
    activeFile.side = side;

    fetch(`/api/branches/${branch}/files/${side}/${filename}`)
        .then(r => r.json())
        .then(data => {
            planEditor.value = data.content || '';
            btnSavePlan.disabled = false;
            fileExistsIndicator.textContent = data.exists !== false ? 'ON DISK' : 'NEW';
            fileExistsIndicator.className = 'file-badge ' + (data.exists !== false ? 'exists' : 'new');
        })
        .catch(err => {
            console.error('Failed to load file:', err);
            activeBranchPath.textContent = 'ERROR LOADING FILE';
        });
}

// ── File Loading & Saving ──

async function loadFile(branch, side, filename) {
    activeFile = { branch, side, filename };

    try {
        const res = await fetch(`/api/branches/${branch}/files/${side}/${filename}`);
        const data = await res.json();

        const labelMap = { 'master-record.md': 'Master Record', 'SPEC.md': 'SPEC', 'AGENT.md': 'AGENT', 'TASKS.md': 'TASKS', 'MEMORY.md': 'MEMORY', 'README.md': 'README' };
        const label = labelMap[filename] || filename.replace('.md', '');
        const sideMap = { left: 'LEFT', right: 'RIGHT', high: 'HIGH', low: 'LOW' };
        activeBranchPath.textContent = `${branch.toUpperCase()} / ${label}`;
        activeSideBadge.textContent = sideMap[side] || side.toUpperCase();
        activeSideBadge.className = `side-badge ${side}`;

        planEditor.value = data.content || '';
        btnSavePlan.disabled = false;

        if (data.exists !== false && data.content !== undefined) {
            fileExistsIndicator.textContent = 'ON DISK';
            fileExistsIndicator.className = 'file-badge exists';
        } else {
            fileExistsIndicator.textContent = 'NEW';
            fileExistsIndicator.className = 'file-badge new';
        }

        markActiveFile(branch, side, filename);
    } catch (err) {
        console.error('Failed to load file:', err);
        activeBranchPath.textContent = 'ERROR LOADING FILE';
    }
}

function markActiveFile(branch, side, filename) {
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    const selector = `.file-item[data-branch="${branch}"][data-side="${side}"][data-filename="${filename}"]`;
    const target = document.querySelector(selector);
    if (target) target.classList.add('active');
}

async function saveFile() {
    if (!activeFile) return;
    const { branch, side, filename } = activeFile;
    const content = planEditor.value;

    try {
        const res = await fetch(`/api/branches/${branch}/files/${side}/${filename}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        if (res.ok) {
            btnSavePlan.textContent = 'SAVED!';
            btnSavePlan.disabled = true;
            setTimeout(() => {
                btnSavePlan.textContent = 'SAVE';
                btnSavePlan.disabled = false;
            }, 1500);
            fileExistsIndicator.textContent = 'ON DISK';
            fileExistsIndicator.className = 'file-badge exists';
            const fi = document.querySelector(`.file-item[data-branch="${branch}"][data-side="${side}"][data-filename="${filename}"]`);
            if (fi) {
                fi.classList.add('exists');
                if (!fi.querySelector('.file-check')) {
                    const check = document.createElement('span');
                    check.className = 'file-check';
                    check.innerHTML = '&#10003;';
                    fi.appendChild(check);
                }
                const newBadge = fi.querySelector('.file-new');
                if (newBadge) newBadge.remove();
            }
        } else {
            alert('Save failed: ' + (data.error || 'unknown error'));
        }
    } catch (err) {
        alert('Save error: ' + err.message);
    }
}

// ── Existing features ──

async function updatePauseButtonState() {
    try {
        const res = await fetch('/api/aws/is-paused');
        const data = await res.json();
        btnTogglePause.textContent = data.paused ? 'RESUME' : 'PAUSE';
    } catch (err) { }
}

async function togglePause() {
    const isPaused = btnTogglePause.textContent === 'RESUME';
    try {
        await fetch('/api/aws/toggle-pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pause: !isPaused })
        });
        await updatePauseButtonState();
    } catch (err) { }
}

function connectLogs() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/logs/aws`);
    socket.onmessage = (e) => {
        logContent.textContent += e.data;
        logContent.scrollTop = logContent.scrollHeight;
    };
    socket.onclose = () => setTimeout(connectLogs, 5000);
}

async function triggerOta() {
    if (!confirm('TRIGGER AWS OVER-THE-AIR UPDATE?')) return;
    btnOta.disabled = true;
    try {
        const res = await fetch('/api/trigger/ota', { method: 'POST' });
        const data = await res.json();
        alert('OTA Update Output:\n' + data.output);
    } catch (err) {
        alert('OTA Update failed.');
    } finally { btnOta.disabled = false; }
}

async function triggerMeta() {
    btnMeta.disabled = true;
    try {
        const res = await fetch('/api/trigger/meta', { method: 'POST' });
        const data = await res.json();
        alert('Meta-Review Output:\n' + data.output);
    } catch (err) {
        alert('Meta-Review failed.');
    } finally { btnMeta.disabled = false; }
}

async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage('user', msg);
    chatInput.value = '';
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        appendMessage('bot', data.response);
        renderRoutingBreadcrumb(data.routing || []);
        if (data.success && isCallActive) {
            speakText(data.response);
        }
    } catch (err) {
        appendMessage('bot', 'COMMUNICATION ERROR');
    }
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function runMcpScan() {
    const btn = document.getElementById('btn-mcp');
    btn.disabled = true;
    btn.textContent = 'SCANNING...';
    const panel = document.getElementById('mcp-panel');
    const results = document.getElementById('mcp-results');
    panel.style.display = 'block';
    results.innerHTML = '<div class="mcp-loading">Running MCP scans (EAA accessibility + AccessScore WCAG)...</div>';
    try {
        const branch = document.querySelector('.tree-item.active')?.dataset?.branch || 'cnei';
        const target = `https://${branch}.datro.directory`;
        const res = await fetch(`/api/mcp?url=${encodeURIComponent(target)}`);
        const data = await res.json();
        let html = `<div class="mcp-target">Target: <code>${target}</code></div>`;
        for (const [toolId, result] of Object.entries(data.results || {})) {
            html += `<div class="mcp-tool ${result.error ? 'mcp-error' : 'mcp-ok'}">`;
            html += `<div class="mcp-tool-header"><strong>${toolId}</strong>`;
            if (result.score != null) html += ` <span class="mcp-score">${result.score}/100</span>`;
            if (result.error) html += ` <span class="mcp-err-msg">ERROR: ${result.error}</span>`;
            html += `</div>`;
            if (result.summary) html += `<div class="mcp-summary">${result.summary}</div>`;
            if (result.issues && result.issues.length > 0) {
                html += `<ul class="mcp-issues">`;
                for (const issue of result.issues.slice(0, 10)) {
                    html += `<li class="mcp-issue-${issue.severity || 'info'}">[${issue.severity}] ${issue.name}</li>`;
                }
                html += `</ul>`;
            }
            if (result.risk) html += `<div class="mcp-risk">Legal risk: ${result.risk}</div>`;
            html += `</div>`;
        }
        results.innerHTML = html;
    } catch (err) {
        results.innerHTML = `<div class="mcp-error">Scan failed: ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'MCP SCAN';
    }
}

// ── Voice Chat Agent ──

const btnCall = document.getElementById('btn-call');
const btnHangup = document.getElementById('btn-hangup');
const voiceStatus = document.getElementById('voice-status');
const avatarMouth = document.querySelector('.avatar-mouth');
const avatarEarL = document.querySelector('.avatar-ear-l');
const avatarEarR = document.querySelector('.avatar-ear-r');
const pulseRings = document.querySelectorAll('.pulse-ring');

let recognition = null;
let isCallActive = false;
let voiceActivityTimer = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function setAvatarSpeaking(active) {
    if (active) {
        avatarMouth.setAttribute('d', 'M48,44 Q60,58 72,44');
        avatarMouth.setAttribute('stroke', '#00ff88');
        avatarEarL.setAttribute('fill', '#00f2ff');
        avatarEarR.setAttribute('fill', '#00f2ff');
        pulseRings.forEach(r => r.setAttribute('stroke', '#00ff88'));
    } else {
        avatarMouth.setAttribute('d', 'M48,44 Q60,54 72,44');
        avatarMouth.setAttribute('stroke', '#00f2ff');
        avatarEarL.setAttribute('fill', '#00f2ff');
        avatarEarR.setAttribute('fill', '#00f2ff');
        pulseRings.forEach(r => r.setAttribute('stroke', '#00f2ff'));
    }
}

function animateMouth() {
    if (!isCallActive) return;
    if (recognition && recognition.speaking) {
        const openY = 48 + Math.random() * 14;
        avatarMouth.setAttribute('d', `M48,44 Q60,${openY} 72,44`);
    } else {
        avatarMouth.setAttribute('d', 'M48,44 Q60,54 72,44');
    }
    requestAnimationFrame(animateMouth);
}

function startCall() {
    if (!SpeechRecognition) {
        appendMessage('bot', 'VOICE NOT SUPPORTED IN THIS BROWSER. TYPE INSTEAD.');
        return;
    }
    isCallActive = true;
    btnCall.disabled = true;
    btnHangup.disabled = false;
    voiceStatus.textContent = 'LISTENING...';
    voiceStatus.style.color = '#00ff88';
    setAvatarSpeaking(true);

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
                transcript += e.results[i][0].transcript;
            }
        }
        if (transcript.trim()) {
            voiceStatus.textContent = 'YOU: ' + transcript;
            appendMessage('user', transcript);
            clearTimeout(voiceActivityTimer);
            voiceActivityTimer = setTimeout(() => {
                sendVoiceQuery(transcript);
            }, 800);
        }
    };

    recognition.onerror = (e) => {
        console.error('Voice error:', e.error);
        if (e.error === 'no-speech') return;
        appendMessage('bot', 'VOICE ERROR: ' + e.error);
        hangupCall();
    };

    recognition.onend = () => {
        if (isCallActive) {
            try { recognition.start(); } catch {}
        }
    };

    try { recognition.start(); } catch (e) { console.error(e); }
    animateMouth();
}

async function sendVoiceQuery(text) {
    voiceStatus.textContent = 'THINKING...';
    setAvatarSpeaking(false);
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        appendMessage('bot', data.response);
        renderRoutingBreadcrumb(data.routing || []);
        speakText(data.response);
        voiceStatus.textContent = 'LISTENING...';
        setAvatarSpeaking(true);
    } catch (err) {
        const errMsg = 'COMMS ERROR';
        appendMessage('bot', errMsg);
        speakText(errMsg);
        voiceStatus.textContent = 'LISTENING...';
        setAvatarSpeaking(true);
    }
}

function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setAvatarSpeaking(true);
    utterance.onend = () => { if (isCallActive) setAvatarSpeaking(true); };
    utterance.onerror = () => { if (isCallActive) setAvatarSpeaking(true); };
    speechSynthesis.speak(utterance);
}

function renderRoutingBreadcrumb(routing) {
    let el = document.getElementById('routing-breadcrumb');
    if (!el) {
        el = document.createElement('div');
        el.id = 'routing-breadcrumb';
        el.className = 'routing-breadcrumb';
        document.querySelector('.intercom-container').appendChild(el);
    }
    if (!routing || routing.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = routing.map((r, i) => {
        const statusIcon = r.status === 'ok' ? '✓' : r.status === 'error' ? '✗' : '⋯';
        const statusClass = r.status === 'ok' ? 'ok' : r.status === 'error' ? 'error' : 'pending';
        const detail = r.detail ? `<span class="rt-detail">${r.detail}</span>` : '';
        const arrow = i < routing.length - 1 ? '<span class="rt-arrow">→</span>' : '';
        return `<span class="rt-node ${statusClass}"><span class="rt-icon">${statusIcon}</span><span class="rt-label">${r.node}</span>${detail}</span>${arrow}`;
    }).join('');
}

function hangupCall() {
    isCallActive = false;
    if (recognition) {
        try { recognition.stop(); } catch {}
        recognition = null;
    }
    btnCall.disabled = false;
    btnHangup.disabled = true;
    voiceStatus.textContent = 'STANDBY';
    voiceStatus.style.color = '#7a828e';
    setAvatarSpeaking(false);
    avatarMouth.setAttribute('d', 'M48,44 Q60,54 72,44');
}

btnCall.addEventListener('click', startCall);
btnHangup.addEventListener('click', hangupCall);

init();
