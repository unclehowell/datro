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
const btnCollapseLeft = document.getElementById('btn-collapse-left');
const btnCollapseRight = document.getElementById('btn-collapse-right');

const btnOta = document.getElementById('btn-ota');
const btnMeta = document.getElementById('btn-meta');
const btnTogglePause = document.getElementById('btn-toggle-pause');
const btnClearLogs = document.getElementById('btn-clear-logs');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

const biasSlider = document.getElementById('bias-slider');
const biasLabel = document.getElementById('bias-label');
const gearRange = document.getElementById('gear-range');
const gearDisplay = document.getElementById('gear-display');
const gearReadout = document.getElementById('gear-readout');

let currentConfig = { gear: 6, steering: 'CTR', bias: 3 };
let branches = [];
let expandedLeft = null;
let expandedRight = null;
let activeFile = null;

const BIAS_LABELS = {
  1: 'STRICT L',
  2: 'FAVOUR L',
  3: 'NEUTRAL',
  4: 'FAVOUR R',
  5: 'STRICT R'
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

    biasSlider.addEventListener('change', async (e) => {
        const val = parseInt(e.target.value);
        if (!confirm(`CONFIRM: SET STEERING BIAS TO "${BIAS_LABELS[val]}"?`)) {
            e.target.value = currentConfig.bias || 3;
            updateBiasUI(currentConfig.bias || 3);
            return;
        }
        await updateConfig({ bias: val, steering: BIAS_STEERING[val] });
    });

    biasSlider.addEventListener('input', (e) => {
        updateBiasUI(parseInt(e.target.value));
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
    biasSlider.value = currentConfig.bias || 3;
    updateBiasUI(currentConfig.bias || 3);
}

function updateBiasUI(val) {
    biasLabel.textContent = BIAS_LABELS[val] || 'NEUTRAL';
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
    if (patch.bias != null) {
        try {
            await fetch(FLYWHEEL_URL + '/__bias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bias: patch.bias, steering: patch.steering || 'CTR' })
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
    } catch (err) {
        console.error('Failed to fetch branches:', err);
    }
}

function renderTree(container, branches, side) {
    container.innerHTML = '';
    branches.forEach(b => {
        const node = document.createElement('div');
        node.className = 'branch-node';

        const files = side === 'left' ? b.leftFiles : b.rightFiles;

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
    const expandedKey = side === 'left' ? 'expandedLeft' : 'expandedRight';
    const currentExpanded = side === 'left' ? expandedLeft : expandedRight;

    if (currentExpanded === name) {
        fileList.classList.remove('open');
        toggle.innerHTML = '&#9654;';
        if (side === 'left') expandedLeft = null; else expandedRight = null;
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
        if (side === 'left') expandedLeft = name; else expandedRight = name;
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

// ── File Loading & Saving ──

async function loadFile(branch, side, filename) {
    activeFile = { branch, side, filename };

    try {
        const res = await fetch(`/api/branches/${branch}/files/${side}/${filename}`);
        const data = await res.json();

        const label = filename === 'master-record.md' ? 'Master Record' : filename.replace('.md', '');
        activeBranchPath.textContent = `${branch.toUpperCase()} / ${label}`;
        activeSideBadge.textContent = side.toUpperCase();
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
        if (data.success) setTimeout(() => window.location.reload(), 2000);
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

init();
