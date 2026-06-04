const AUTH_TOKEN_KEY = 'fcuk_command_token';

function getToken() { return sessionStorage.getItem(AUTH_TOKEN_KEY); }

function setToken(t) { if (t) sessionStorage.setItem(AUTH_TOKEN_KEY, t); else sessionStorage.removeItem(AUTH_TOKEN_KEY); }

async function apiFetch(url, opts = {}) {
    const token = getToken();
    const headers = { ...(opts.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
        setToken(null);
        showLogin();
        throw new Error('Session expired');
    }
    return res;
}

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-input').focus();
}

function hideLogin() {
    document.getElementById('login-overlay').style.display = 'none';
}

async function handleLogin() {
    const passphrase = document.getElementById('login-input').value.trim();
    const errEl = document.getElementById('login-error');
    if (!passphrase) { errEl.textContent = 'Enter passphrase'; return; }
    errEl.textContent = '';
    try {
        const res = await apiFetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase })
        });
        const data = await res.json();
        if (data.token) {
            setToken(data.token);
            hideLogin();
            init();
        } else {
            errEl.textContent = 'Invalid passphrase';
        }
    } catch {
        errEl.textContent = 'Connection error';
    }
}

const branchCount = document.getElementById('branch-count');
const planEditor = document.getElementById('plan-editor');
const logContent = document.getElementById('log-content');
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

const btnClearLogs = document.getElementById('btn-clear-logs');

const trackCanvas = document.getElementById('track-canvas');
const rpmReadout = document.getElementById('rpm-readout');
const speedReadout = document.getElementById('speed-readout');
const stickKnob = document.getElementById('stick-knob');
let currentGear = 'N';
let rpmValue = 0;

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
  'AGENT.md': 'Agent instructions — how the AI should operate on this branch for this side.',
  'README.md': 'Public-facing readme for the branch on this side.',
  'CHANGELOG.md': 'Release history and version changes for this side.',
  'MEMORY.md': 'Reflexion memory — lessons learned from previous cycles for this side.',
  'SKILLS.md': 'Skills and capabilities relevant to this side.',
  'HEARTBEAT.md': 'Heartbeat status — health check for this branch side.',
  'SOUL.md': 'Core identity and personality for this side.',
  'MASTERPLAN.md': 'Strategic master plan and roadmap for this side.',
  'RULES.md': 'Rules and constraints governing this side.',
  'TEMPLATE.md': 'Templates for file generation on this side.',
  'CONTEXT.md': 'Context and background information for this side.',
  'GLOSSARY.md': 'Glossary of terms used on this side.',
  'RESOURCES.md': 'Resources and references for this side.',
  'TASKS.md': 'Task checklist — items the flywheel has completed or should complete for this side.',
  'IDENTITY.md': 'Identity and branding guidelines for this side.',
  'SPEC.md': 'Technical specification — compliance goals the flywheel targets for this side.'
};

async function init() {
    await fetchConfig();
    await fetchBranches();
    await fetchVersion();
    await fetchFuel();
    initTrackCanvas();
    initGearStick();

    btnSavePlan.addEventListener('click', saveFile);
    document.getElementById('btn-push').addEventListener('click', pushToGit);
    document.getElementById('btn-pull').addEventListener('click', pullFromGit);
    btnClearLogs.addEventListener('click', () => logContent.textContent = '');
    btnCollapseLeft.addEventListener('click', () => { if (activeFile) onBranchSelect('left', activeFile.branch); });
    btnCollapseRight.addEventListener('click', () => { if (activeFile) onBranchSelect('right', activeFile.branch); });

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

    setInterval(fetchFuel, 5000);
    setInterval(updateRpm, 200);
}

function initTrackCanvas() {
    const container = trackCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    trackCanvas.width = rect.width || 600;
    trackCanvas.height = rect.height || 400;
    window.trackInit(trackCanvas);
    window.addEventListener('resize', () => {
        const r = container.getBoundingClientRect();
        if (r.width > 50 && r.height > 50) {
            trackCanvas.width = r.width;
            trackCanvas.height = r.height;
        }
    });
}

function initGearStick() {
    const gate = document.querySelector('.gear-gate');
    const slots = gate.querySelectorAll('.gate-slot');
    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            currentGear = slot.dataset.gear;
            stickKnob.textContent = currentGear;
            document.querySelectorAll('.gate-slot').forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            // Map gear to track speed
            const speedMap = { L: 0.3, N: 1, H: 3 };
            const s = speedMap[currentGear] || 1;
            window.trackSetSpeed(s);
            // Sync to release gear range
            const gearVal = currentGear === 'L' ? 3 : currentGear === 'N' ? 6 : 9;
            gearRange.value = gearVal;
            gearDisplay.textContent = gearVal;
            gearReadout.textContent = gearVal;
        });
    });
    // Default to N
    document.querySelector('.gate-slot[data-gear="N"]')?.click();
}

function updateRpm() {
    if (!rpmReadout || !speedReadout) return;
    rpmValue += (Math.random() - 0.5) * 200;
    rpmValue = Math.max(500, Math.min(8000, rpmValue));
    rpmReadout.textContent = Math.round(rpmValue);
    const baseSpeed = currentGear === 'L' ? 20 : currentGear === 'N' ? 60 : 120;
    const speed = baseSpeed + (rpmValue / 8000) * 40;
    speedReadout.textContent = Math.round(speed);
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
        const res = await apiFetch('/api/config');
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
        const res = await apiFetch('/api/config', {
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
        const res = await apiFetch('/api/fuel');
        const fuels = await res.json();
        document.getElementById('fuel-api').style.height = fuels.api + '%';
        document.getElementById('fuel-llm').style.height = fuels.llm + '%';
        document.getElementById('fuel-cli').style.height = fuels.cli + '%';
        document.getElementById('fuel-ide').style.height = fuels.ide + '%';
    } catch (err) {
        console.error('Failed to fetch fuel levels');
    }
}

// AWS functions removed — system is Cloudflare-native
async function fetchAwsStatus() { return; }
async function updatePauseButtonState() { return; }
async function togglePause() { return; }
function connectLogs() { return; }
async function triggerOta() { alert('OTA: AWS decommissioned. Use git push + Pages deploy.'); }
async function triggerMeta() { alert('Meta-review runs in CF Worker on cron. Flywheel handles this.'); }

// ── Branch Trees (Left + Right) ──

async function fetchVersion() {
    try {
        const res = await apiFetch('/api/version');
        const data = await res.json();
        document.getElementById('version-badge').textContent = 'v' + data.version;
    } catch (err) {
        console.error('Failed to fetch version');
    }
}

async function fetchBranches() {
    try {
        const res = await apiFetch('/api/branches');
        branches = await res.json();
        branchCount.textContent = branches.length;
        populateBranchSelects(branches);
        // Show first branch's files by default
        const firstBranch = branches[0]?.name;
        if (firstBranch) {
            document.getElementById('branch-select-left').value = firstBranch;
            document.getElementById('branch-select-right').value = firstBranch;
            document.getElementById('branch-select-high').value = firstBranch;
            document.getElementById('branch-select-low').value = firstBranch;
            onBranchSelect('left', firstBranch);
            onBranchSelect('right', firstBranch);
            onBranchSelect('high', firstBranch);
            onBranchSelect('low', firstBranch);
        }
    } catch (err) {
        console.error('Failed to fetch branches:', err);
    }
}

function populateBranchSelects(branches) {
    const sides = ['left', 'right', 'high', 'low'];
    sides.forEach(side => {
        const sel = document.getElementById(`branch-select-${side}`);
        sel.innerHTML = '<option value="">— select branch —</option>';
        branches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.name;
            opt.textContent = b.name.toUpperCase();
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => onBranchSelect(side, sel.value));
    });
}

function onBranchSelect(side, branchName) {
    const treeContainer = side === 'left' || side === 'right'
        ? document.getElementById(`branch-tree-${side}`)
        : document.getElementById(`${side}-breadcrumb`);
    
    // Clear existing
    treeContainer.innerHTML = '';
    
    if (!branchName) return;
    
    const branch = branches.find(b => b.name === branchName);
    if (!branch) return;
    
    const sideKey = side + 'Files';
    const files = branch[sideKey] || [];
    
    files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.branch = branchName;
        item.dataset.filename = f.name;
        item.dataset.side = side;
        item.innerHTML = `<span class="file-icon">📄</span><span class="file-label">${f.label}</span>`;
        if (f.exists) {
            item.classList.add('exists');
            item.innerHTML += '<span class="file-check">✓</span>';
        } else {
            item.innerHTML += '<span class="file-new">+new</span>';
        }
        item.onclick = () => loadFile(branchName, side, f.name);
        treeContainer.appendChild(item);
    });
}

// ── File Loading & Saving ──

async function loadFile(branch, side, filename) {
    activeFile = { branch, side, filename };
    showEditor();

    try {
        const res = await apiFetch(`/api/branches/${branch}/files/${side}/${filename}`);
        const data = await res.json();

        const labelMap = { 'master-record.md': 'Master Record', 'AGENT.md': 'AGENT', 'README.md': 'README', 'CHANGELOG.md': 'CHANGELOG', 'MEMORY.md': 'MEMORY', 'SKILLS.md': 'SKILLS', 'HEARTBEAT.md': 'HEARTBEAT', 'SOUL.md': 'SOUL', 'MASTERPLAN.md': 'MASTERPLAN', 'RULES.md': 'RULES', 'TEMPLATE.md': 'TEMPLATE', 'CONTEXT.md': 'CONTEXT', 'GLOSSARY.md': 'GLOSSARY', 'RESOURCES.md': 'RESOURCES', 'TASKS.md': 'TASKS', 'IDENTITY.md': 'IDENTITY', 'SPEC.md': 'SPEC' };
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

function showEditor() {
    trackCanvas.style.display = 'none';
    window.trackStop();
    planEditor.style.display = '';
    document.getElementById('editor-header').style.display = '';
}

function showTrack() {
    trackCanvas.style.display = '';
    planEditor.style.display = 'none';
    document.getElementById('editor-header').style.display = 'none';
    const container = trackCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50) {
        trackCanvas.width = rect.width;
        trackCanvas.height = rect.height;
    }
    window.trackInit(trackCanvas);
}

// Show track when no file is active (called on init and after deselect)
document.addEventListener('click', (e) => {
    if (!activeFile && !e.target.closest('.file-item') && !e.target.closest('.tree-container') && !e.target.closest('.editor-actions') && !e.target.closest('.editor-breadcrumb')) {
        showTrack();
    }
});

async function saveFile() {
    if (!activeFile) return;
    const { branch, side, filename } = activeFile;
    const content = planEditor.value;

    try {
        const res = await apiFetch(`/api/branches/${branch}/files/${side}/${filename}`, {
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

// ── Git Push / Pull ──

async function pushToGit() {
    if (!confirm('PUSH all pending changes to GitHub? All uncommitted changes will be committed and pushed to all branches.')) return;
    const btn = document.getElementById('btn-push');
    btn.disabled = true;
    btn.textContent = 'PUSHING...';
    try {
        const res = await apiFetch('/api/push', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            alert(data.output || 'PUSHED ✓');
        } else {
            alert('Push failed: ' + (data.error || 'unknown error'));
        }
    } catch (err) {
        alert('Push error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'PUSH';
    }
}

async function pullFromGit() {
    if (!confirm('PULL latest MD files from GitHub? Any local edits will be overwritten.')) return;
    const btn = document.getElementById('btn-pull');
    btn.disabled = true;
    btn.textContent = 'PULLING...';
    try {
        const res = await apiFetch('/api/pull', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            alert(data.output || 'Pulled successfully. Refreshing...');
            location.reload();
        } else {
            alert('Pull failed: ' + (data.error || 'unknown error'));
        }
    } catch (err) {
        alert('Pull error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'PULL';
    }
}

async function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage('user', msg);
    chatInput.value = '';
    try {
        const res = await apiFetch('/api/chat', {
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
        const res = await apiFetch(`/api/mcp?url=${encodeURIComponent(target)}`);
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
        const res = await apiFetch('/api/chat', {
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

// Login events
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('login-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

// Start: show login
showLogin();
