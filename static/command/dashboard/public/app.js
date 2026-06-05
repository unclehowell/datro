let token = sessionStorage.getItem('command_token') || '';
let ghToken = '';
let cfToken = '';
let settings = {};
let config = { bias: 0, risk: 0, gear: 3, toggle_exceptions: {} };
let branches = [];
let activeBranch = '';
let isCallActive = false;
let recognition = null;
let currentGear = 'N';

const $ = id => document.getElementById(id);
const app = $('app');
const overlay = $('login-overlay');
const loginInput = $('login-passphrase');
const loginBtn = $('login-btn');
const loginError = $('login-error');

async function doPassphraseLogin(pass) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: pass }),
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      sessionStorage.setItem('command_token', token);
      afterLogin();
    } else {
      loginError.textContent = 'Invalid passphrase';
    }
  } catch {
    loginError.textContent = 'Connection error';
  }
}

function afterLogin() {
  overlay.style.display = 'none';
  app.style.display = 'flex';
  init();
}

loginBtn.addEventListener('click', () => doPassphraseLogin(loginInput.value));
loginInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doPassphraseLogin(loginInput.value); });

const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
if (urlToken) {
  token = urlToken;
  sessionStorage.setItem('command_token', token);
  window.history.replaceState({}, '', window.location.pathname);
  afterLogin();
} else if (token) {
  afterLogin();
}

async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    sessionStorage.removeItem('command_token');
    token = '';
    app.style.display = 'none';
    overlay.style.display = 'flex';
    loginError.textContent = 'Session expired. Please log in again.';
    return null;
  }
  return res;
}

async function init() {
  $('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem('command_token');
    token = '';
    app.style.display = 'none';
    overlay.style.display = 'flex';
  });

  await loadSettings();
  await loadVersion();
  await loadBranches();
  await loadConfig();

  initConnectButtons();
  initDial();
  initStick();
  initRadio();
  initEditor();
  initTrackHover();

  setInterval(loadFuel, 5000);
  setInterval(loadRereleases, 15000);
  pollRereleases();

  showTrack();
}

function initConnectButtons() {
  $('btn-gh-connect').addEventListener('click', async () => {
    if (ghToken) {
      ghToken = '';
      updateGHUI(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();
      if (data.url) {
        sessionStorage.setItem('oauth_return_to', window.location.href);
        window.location.href = data.url;
      } else {
        $('gh-status').textContent = 'N/A';
      }
    } catch {
      $('gh-status').textContent = 'ERR';
    }
  });

  $('btn-cf-connect').addEventListener('click', async () => {
    if (cfToken) {
      cfToken = '';
      updateCFUI(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/cloudflare/url');
      const data = await res.json();
      if (data.url) {
        sessionStorage.setItem('oauth_return_to', window.location.href);
        window.location.href = data.url;
      } else if (data.token) {
        const pasted = prompt('Cloudflare OAuth not configured. Paste a Cloudflare API token:');
        if (pasted) {
          const r2 = await apiFetch('/api/auth/cloudflare/url', { method: 'POST', body: JSON.stringify({ token: pasted }) });
          if (r2) {
            const d2 = await r2.json();
            if (d2.success) {
              cfToken = pasted;
              updateCFUI(true);
            }
          }
        }
      } else {
        $('cf-status').textContent = 'N/A';
      }
    } catch {
      $('cf-status').textContent = 'ERR';
    }
  });
}

function updateGHUI(connected) {
  $('btn-gh-connect').textContent = connected ? '✓GH' : 'GH';
  $('gh-status').textContent = connected ? '✓' : '—';
}

function updateCFUI(connected) {
  $('btn-cf-connect').textContent = connected ? '✓CF' : 'CF';
  $('cf-status').textContent = connected ? '✓' : '—';
}

async function loadSettings() {
  const res = await apiFetch('/api/settings');
  if (!res) return;
  settings = await res.json();
  if (settings.gh_connected) {
    ghToken = settings.gh_connected;
    updateGHUI(true);
  } else {
    updateGHUI(false);
  }
  if (settings.cf_connected) {
    cfToken = settings.cf_connected;
    updateCFUI(true);
  } else {
    updateCFUI(false);
  }
}

async function loadVersion() {
  const res = await apiFetch('/api/version');
  if (!res) return;
  const data = await res.json();
  const v = data.version || '—';
  const m = v.match(/r(\d+)/i);
  $('version-badge').textContent = m ? 'r' + m[1] : v;
}

async function loadBranches() {
  const res = await apiFetch('/api/branches');
  if (!res) return;
  branches = await res.json();
  const sel = $('branch-select');
  sel.innerHTML = '<option value="">— branch —</option>';
  for (const b of branches) {
    const opt = document.createElement('option');
    opt.value = b.name; opt.textContent = b.name;
    sel.appendChild(opt);
  }
  renderWingFiles();
  sel.addEventListener('change', () => {
    activeBranch = sel.value;
    renderWingFiles();
    if (typeof window.trackSelectBranch === 'function') window.trackSelectBranch(activeBranch);
  });
}

async function loadConfig() {
  const res = await apiFetch('/api/config');
  if (!res) return;
  config = await res.json();
  if (config.gear !== undefined) {
    currentGear = { 1: 'L', 3: 'N', 6: 'H' }[config.gear] || 'N';
    updateStickUI();
  }
  renderWingFiles();
}

async function saveConfig(updates) {
  config = { ...config, ...updates };
  await apiFetch('/api/config', {
    method: 'POST', body: JSON.stringify(config),
  });
}

const SIDES = ['high', 'left', 'right', 'low'];
const SIDE_COLORS = { high: '#ff6b6b', left: '#4ecdc4', right: '#ffd93d', low: '#69db7c' };

function getActiveSides() {
  const bias = config.bias || 0;
  const risk = config.risk || 0;
  const exceptions = config.toggle_exceptions || {};
  const branch = activeBranch || '_default';
  const bex = exceptions[branch] || {};

  const defaults = {};
  defaults['high'] = risk > 0;
  defaults['left'] = bias < 0;
  defaults['right'] = bias > 0;
  defaults['low'] = risk < 0;

  const active = {};
  for (const side of SIDES) {
    const fullSide = side.charAt(0).toUpperCase() + side.slice(1);
    const exceptionVal = bex[fullSide];
    if (exceptionVal === true) active[side] = true;
    else if (exceptionVal === false) active[side] = false;
    else active[side] = defaults[side];
  }
  return active;
}

function toggleWingException(side) {
  const branch = activeBranch || '_default';
  if (!config.toggle_exceptions) config.toggle_exceptions = {};
  if (!config.toggle_exceptions[branch]) config.toggle_exceptions[branch] = {};
  const bex = config.toggle_exceptions[branch];
  const fullSide = side.charAt(0).toUpperCase() + side.slice(1);
  const current = bex[fullSide];
  if (current === true) bex[fullSide] = false;
  else if (current === false) delete bex[fullSide];
  else bex[fullSide] = true;
  saveConfig({ toggle_exceptions: config.toggle_exceptions });
  renderWingFiles();
}

function renderWingFiles() {
  const containers = {
    high: $('wing-files-top'),
    left: $('wing-files-left'),
    right: $('wing-files-right'),
    low: $('wing-files-bottom'),
  };
  for (const side of SIDES) containers[side].innerHTML = '';

  const active = getActiveSides();

  const branchData = activeBranch
    ? branches.find(b => b.name === activeBranch)
    : branches.length > 0 ? branches[0] : null;

  if (!branchData) return;

  for (const side of SIDES) {
    const files = branchData[side + 'Files'] || [];
    const list = containers[side];
    if (files.length === 0) continue;

    const showFiles = files.filter(f => f.exists).length > 0
      ? files.filter(f => f.exists)
      : files.slice(0, 5);

    for (const f of showFiles) {
      const card = document.createElement('div');
      card.className = 'wing-card' + (active[side] ? ' active' : '');

      const toggle = document.createElement('div');
      toggle.className = 'wing-toggle ' + (active[side] ? 'on' : 'off');
      if (active[side]) toggle.textContent = '✓';
      toggle.addEventListener('click', (e) => { e.stopPropagation(); toggleWingException(side); });

      const name = document.createElement('span');
      name.className = 'wing-name';
      name.textContent = f.label;

      card.appendChild(toggle);
      card.appendChild(name);
      card.addEventListener('click', () => openEditor(branchData.name, side, f.name));

      list.appendChild(card);
    }
  }
}

// ── Track Hover ──
function initTrackHover() {
  const stage = $('track-stage');
  let hoverTimer = null;

  stage.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimer);
    stage.classList.add('hover');
  });

  stage.addEventListener('mouseleave', () => {
    hoverTimer = setTimeout(() => {
      stage.classList.remove('hover');
    }, 300);
  });
}

// ── Racetrack ──
const trackCanvas = $('track-canvas');

function showTrack() {
  const container = trackCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  trackCanvas.width = Math.max(rect.width, 400);
  trackCanvas.height = Math.max(rect.height, 200);
  if (typeof window.trackInit === 'function') window.trackInit(trackCanvas);
}

// ── Steering Dial ──
function initDial() {
  const canvas = $('dial-canvas');
  const ctx = canvas.getContext('2d');
  let dragging = false;
  let bias = config.bias || 0;
  let risk = config.risk || 0;

  function drawDial() {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 12;
    ctx.clearRect(0, 0, W, H);

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,242,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath(); ctx.moveTo(cx - r + 8, cy); ctx.lineTo(cx + r - 8, cy);
    ctx.moveTo(cx, cy - r + 8); ctx.lineTo(cx, cy + r - 8);
    ctx.strokeStyle = 'rgba(0,242,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();

    const range = r * 0.7;
    const bx = cx + (bias / 5) * range;
    ctx.beginPath(); ctx.arc(bx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = bias === 0 ? 'rgba(0,242,255,0.4)' : bias > 0 ? '#ffd93d' : '#4ecdc4';
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

    const ry = cy - (risk / 5) * range;
    ctx.beginPath(); ctx.arc(cx, ry, 4, 0, Math.PI * 2);
    ctx.fillStyle = risk === 0 ? 'rgba(255,107,107,0.4)' : risk > 0 ? '#ff6b6b' : '#69db7c';
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2ff'; ctx.fill();

    ctx.fillStyle = 'rgba(200,208,224,0.3)'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('L', cx - r + 7, cy + 2.5);
    ctx.fillText('R', cx + r - 7, cy + 2.5);
    ctx.fillText('H', cx, cy - r + 9);
    ctx.fillText('L', cx, cy + r - 5);

    $('dial-bias').textContent = 'BIAS:' + Math.round(bias * 10) / 10;
    $('dial-risk').textContent = 'RISK:' + Math.round(risk * 10) / 10;
  }

  function posToValue(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const nbias = Math.max(-5, Math.min(5, (x / (rect.width / 2)) * 5));
    const nrisk = Math.max(-5, Math.min(5, (-y / (rect.height / 2)) * 5));
    bias = Math.round(nbias * 2) / 2;
    risk = Math.round(nrisk * 2) / 2;
    saveConfig({ bias, risk });
    drawDial();
    renderWingFiles();
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; posToValue(e.clientX, e.clientY); });
  window.addEventListener('mousemove', (e) => { if (dragging) posToValue(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });

  drawDial();
}

// ── Stick Shift ──
function initStick() {
  const slots = document.querySelectorAll('.gate-slot');
  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      currentGear = slot.dataset.gear;
      updateStickUI();
      const gearMap = { L: 1, N: 3, H: 6 };
      const rateMap = { L: '0.3/hr', N: '1/hr', H: '3/hr' };
      saveConfig({ gear: gearMap[currentGear] });
      $('stick-rate').textContent = rateMap[currentGear];
      if (typeof window.trackSetSpeed === 'function') {
        const speedMap = { L: 0.3, N: 1, H: 3 };
        window.trackSetSpeed(speedMap[currentGear]);
      }
    });
  });
}

function updateStickUI() {
  document.querySelectorAll('.gate-slot').forEach(s => s.classList.remove('active'));
  const activeSlot = document.querySelector('.gate-slot[data-gear="' + currentGear + '"]');
  if (activeSlot) activeSlot.classList.add('active');
  $('stick-knob').textContent = currentGear;
}

// ── Radio / Intercom ──
function initRadio() {
  const callBtn = $('btn-call');
  const hangupBtn = $('btn-hangup');
  const input = $('radio-input');
  const sendBtn = $('radio-send-btn');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  callBtn.addEventListener('click', () => {
    isCallActive = true;
    callBtn.disabled = true;
    hangupBtn.disabled = false;
    addRadioMsg('system', 'CALL ACTIVE — listening...');

    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (e) => {
          let transcript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
          }
          if (transcript.trim()) {
            addRadioMsg('user', transcript);
            doChat(transcript);
          }
        };
        recognition.onerror = () => { addRadioMsg('system', 'Voice error — using text input'); };
        recognition.start();
      } catch { addRadioMsg('system', 'Voice not supported — using text input'); }
    }
  });

  hangupBtn.addEventListener('click', () => {
    isCallActive = false;
    callBtn.disabled = false;
    hangupBtn.disabled = true;
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    addRadioMsg('system', 'CALL ENDED');
  });

  async function doChat(msg) {
    addRadioMsg('agent', '...');
    const res = await apiFetch('/api/chat', {
      method: 'POST', body: JSON.stringify({ message: msg }),
    });
    if (!res) return;
    const data = await res.json();
    const msgs = $('radio-messages');
    const dots = msgs.querySelector('.msg-agent:last-child');
    if (dots && dots.textContent === '...') dots.remove();
    addRadioMsg('agent', data.response || 'No response');

    if ('speechSynthesis' in window && isCallActive) {
      const utter = new SpeechSynthesisUtterance(data.response);
      utter.rate = 1.0; utter.pitch = 1.0;
      speechSynthesis.speak(utter);
    }
  }

  sendBtn.addEventListener('click', () => {
    if (!input.value.trim()) return;
    const msg = input.value;
    input.value = '';
    addRadioMsg('user', msg);
    doChat(msg);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });
}

function addRadioMsg(type, text) {
  const msgs = $('radio-messages');
  const el = document.createElement('div');
  el.className = 'msg-' + type;
  el.style.cssText = 'font-size:0.6rem;margin:0.1rem 0;color:' + (type === 'user' ? '#00f2ff' : type === 'agent' ? '#00ff88' : 'var(--dim)');
  el.textContent = (type === 'user' ? '> ' : type === 'agent' ? '→ ' : '') + text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  if (msgs.children.length > 20) msgs.removeChild(msgs.firstChild);
}

// ── Editor Modal ──
let editorBranch = '';
let editorSide = '';
let editorFilename = '';
const editorModal = $('editor-modal');

function openEditor(branch, side, fname) {
  editorBranch = branch;
  editorSide = side;
  editorFilename = fname;
  $('editor-title').textContent = branch.toUpperCase() + ' / ' + fname.replace('.md', '') + '.' + side + '.md';
  $('editor-textarea').value = 'Loading...';
  editorModal.style.display = 'flex';

  const tabs = $('editor-tabs');
  tabs.innerHTML = '';
  for (const s of ['high', 'left', 'right', 'low']) {
    const tab = document.createElement('div');
    tab.className = 'editor-tab' + (s === side ? ' active' : '');
    tab.textContent = s.toUpperCase();
    tab.addEventListener('click', () => {
      if (s !== editorSide) openEditor(branch, s, fname);
    });
    tabs.appendChild(tab);
  }

  loadEditorContent();
}

async function loadEditorContent() {
  $('editor-status').textContent = '';
  try {
    const res = await apiFetch('/api/branches/' + editorBranch + '/files/' + editorSide + '/' + editorFilename);
    if (!res) return;
    const data = await res.json();
    $('editor-textarea').value = data.content || '';
  } catch {
    $('editor-textarea').value = 'Error loading file';
  }
}

function initEditor() {
  $('modal-editor-close').addEventListener('click', () => { editorModal.style.display = 'none'; });
  $('editor-save').addEventListener('click', async () => {
    const content = $('editor-textarea').value;
    $('editor-status').textContent = 'Saving...';
    try {
      const res = await apiFetch('/api/branches/' + editorBranch + '/files/' + editorSide + '/' + editorFilename, {
        method: 'POST', body: JSON.stringify({ content }),
      });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        $('editor-status').textContent = '✓ Saved';
        setTimeout(() => $('editor-status').textContent = '', 2000);
        loadBranches();
      } else {
        $('editor-status').textContent = '✗ ' + (data.error || 'Save failed');
      }
    } catch (e) {
      $('editor-status').textContent = '✗ ' + e.message;
    }
  });
}

// ── Fuel ──
async function loadFuel() {
  const res = await apiFetch('/api/fuel');
  if (!res) return;
  const data = await res.json();
  $('fuel-api').style.height = data.api + '%';
  $('fuel-llm').style.height = data.llm + '%';
  $('fuel-cli').style.height = data.cli + '%';
  $('fuel-ide').style.height = data.ide + '%';
}

// ── Rereleases ──
let knownTags = new Set();

async function loadRereleases() {
  const res = await apiFetch('/api/rereleases');
  if (!res) return;
  const data = await res.json();
  if (data.rereleases) {
    for (const r of data.rereleases) {
      if (!knownTags.has(r.tag)) {
        knownTags.add(r.tag);
        if (typeof window.trackRerelease === 'function') {
          window.trackRerelease(r.branch);
        }
      }
    }
  }
}

function pollRereleases() {
  setTimeout(loadRereleases, 15000);
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    editorModal.style.display = 'none';
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    if (editorModal.style.display === 'flex') {
      e.preventDefault();
      $('editor-save').click();
    }
  }
});
