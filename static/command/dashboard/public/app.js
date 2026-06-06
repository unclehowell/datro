let config = { bias: 0, risk: 0, gear: 3, toggle_exceptions: {} };
let branches = [];
let activeBranch = '';
let isCallActive = false;
let recognition = null;
let wingVisible = 0;

const $ = id => document.getElementById(id);
const app = $('app');

async function init() {
  app.style.display = 'flex';
  await loadSettings();
  await loadVersion();
  await loadBranches();
  await loadConfig();

  initJoystick();
  initGear();
  initDirButtons();
  initManualRelease();
  initRadio();
  initEditor();

  setInterval(loadFuel, 5000);
  setInterval(loadRereleases, 15000);
  setInterval(pollFlywheel, 5000);
  pollRereleases();

  showTrack();
}

init();

async function loadSettings() {
  try { await fetch('/api/settings'); } catch {}
}

async function loadVersion() {
  const res = await fetch('/api/version');
  if (!res) return;
  const data = await res.json();
  const v = data.version || '—';
  $('version-badge').textContent = v;
}

async function loadBranches() {
  const res = await fetch('/api/branches');
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
  const res = await fetch('/api/config');
  if (!res) return;
  config = await res.json();
  if (config.gear !== undefined) updateGearUI(config.gear);
  renderWingFiles();
}

async function saveConfig(updates) {
  config = { ...config, ...updates };
  await fetch('/api/config', {
    method: 'POST', body: JSON.stringify(config),
  });
  if (updates.gear !== undefined) {
    try {
      await fetch('/api/flywheel/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gear: updates.gear }) });
    } catch {}
  }
}

const SIDES = ['high', 'left', 'right', 'low'];
const SIDE_COLORS = { high: '#ff6b6b', left: '#4ecdc4', right: '#ffd93d', low: '#69db7c' };

function getActiveSides() {
  const bias = config.bias || 0;
  const risk = config.risk || 0;
  const exceptions = config.toggle_exceptions || {};
  const branch = activeBranch || '_default';
  const bex = exceptions[branch] || {};

  const D = [(risk > 0)<<0, (bias < 0)<<1, (bias > 0)<<2, (risk < 0)<<3];
  let M = 0, E = 0;
  for (const side of SIDES) {
    const fullSide = side.charAt(0).toUpperCase() + side.slice(1);
    const ev = bex[fullSide];
    if (ev === true) { M |= 1<<SIDES.indexOf(side); E |= 1<<SIDES.indexOf(side); }
    else if (ev === false) { M |= 1<<SIDES.indexOf(side); }
  }
  const A = (D & ~M) | (E & M);
  const active = {};
  for (const side of SIDES) active[side] = !!(A & (1<<SIDES.indexOf(side)));
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
  updateWingOverlays();
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
  updateWingOverlays();
}

// ── Flywheel State Poll ──
async function pollFlywheel() {
  const res = await fetch('/api/flywheel/state');
  if (!res) return;
  const data = await res.json();
  if (typeof window.trackMilestones === 'function') {
    window.trackMilestones(data);
  }
}

// ── Directional Buttons (W ^= B) ──
function initDirButtons() {
  const sideMap = ['high','low','left','right'];
  ['dir-up','dir-down','dir-left','dir-right'].forEach((id, i) => {
    $(id).addEventListener('click', () => {
      wingVisible ^= (1 << i);
      for (let j = 0; j < 4; j++) {
        const btn = $(['dir-up','dir-down','dir-left','dir-right'][j]);
        btn.classList.toggle('active', !!(wingVisible & (1 << j)));
      }
      updateWingOverlays();
    });
  });
}

function updateWingOverlays() {
  const active = getActiveSides();
  const sides = ['high','low','left','right'];
  sides.forEach((side, i) => {
    const el = $('wing-' + ['top','bottom','left','right'][i]);
    const bits = 1 << i;
    const show = !!(wingVisible & bits) && active[side];
    el.classList.toggle('visible', show);
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

// ── Joystick (replaces dial) ──
function initJoystick() {
  const canvas = $('joystick-canvas');
  const ctx = canvas.getContext('2d');
  let dragging = false;
  let bias = config.bias || 0;
  let risk = config.risk || 0;
  const A = 0.00729735256;

  function drawJoystick() {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 12;
    ctx.clearRect(0, 0, W, H);

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,242,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, r * (1 - A), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,242,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath(); ctx.moveTo(cx - r + 8, cy); ctx.lineTo(cx + r - 8, cy);
    ctx.moveTo(cx, cy - r + 8); ctx.lineTo(cx, cy + r - 8);
    ctx.strokeStyle = 'rgba(0,242,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();

    const range = r * 0.7;
    const bx = cx + (bias / 5) * range;
    const by = cy - (risk / 5) * range;

    ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2ff'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,242,255,0.3)'; ctx.fill();

    ctx.fillStyle = 'rgba(200,208,224,0.3)'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('←', cx - r + 7, cy + 2.5);
    ctx.fillText('→', cx + r - 7, cy + 2.5);
    ctx.fillText('▲', cx, cy - r + 9);
    ctx.fillText('▼', cx, cy + r - 5);

    $('joystick-bias').textContent = 'BIAS:' + Math.round(bias * 10) / 10;
    $('joystick-risk').textContent = 'RISK:' + Math.round(risk * 10) / 10;
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
    drawJoystick();
    renderWingFiles();
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; posToValue(e.clientX, e.clientY); });
  window.addEventListener('mousemove', (e) => { if (dragging) posToValue(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });

  drawJoystick();
}

// ── Gear Shift (1-10 slider) ──
const RATE_BY_GEAR = [3600, 2627, 1917, 1399, 1021, 745, 544, 397, 290, 211];

function initGear() {
  const slider = $('gear-slider');
  slider.addEventListener('input', () => {
    const gear = parseInt(slider.value, 10);
    updateGearUI(gear);
    saveConfig({ gear });
    if (typeof window.trackSetSpeed === 'function') {
      window.trackSetSpeed(gear / 3);
    }
  });
  if (config.gear !== undefined) updateGearUI(config.gear);
}

function updateGearUI(gear) {
  const slider = $('gear-slider');
  slider.value = gear;
  const rate = RATE_BY_GEAR[gear - 1];
  const rateLabel = rate >= 3600 ? '1/hr' : rate >= 60 ? Math.round(3600 / rate) + '/hr' : Math.round(3600 / rate) + '/hr';
  $('gear-rate').textContent = rateLabel;
  $('gear-labels').innerHTML = '<span class="gear-label active" data-g="' + gear + '">' + gear + '</span>';
}

// ── Manual Release Buttons ──
function initManualRelease() {
  ['rel-fc','rel-cn','rel-cm'].forEach(id => {
    $(id).addEventListener('click', async () => {
      const branchMap = { 'rel-fc': 'financecheque', 'rel-cn': 'cnei', 'rel-cm': 'command' };
      const branch = branchMap[id];
      $(id).disabled = true;
      $(id).textContent = '...';
      try {
        const res = await fetch('/api/flywheel/trigger/' + branch, { method: 'POST' });
        const data = res ? await res.json() : {};
        $(id).textContent = data.success ? '✓' : '✗';
        setTimeout(() => { $(id).textContent = branchMap[id].slice(0, 2).toUpperCase(); $(id).disabled = false; }, 2000);
      } catch {
        $(id).textContent = '✗';
        setTimeout(() => { $(id).textContent = branchMap[id].slice(0, 2).toUpperCase(); $(id).disabled = false; }, 2000);
      }
    });
  });
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
    const res = await fetch('/api/chat', {
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
    const res = await fetch('/api/branches/' + editorBranch + '/files/' + editorSide + '/' + editorFilename);
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
      const res = await fetch('/api/branches/' + editorBranch + '/files/' + editorSide + '/' + editorFilename, {
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
  const res = await fetch('/api/fuel');
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
  const res = await fetch('/api/rereleases');
  if (!res) return;
  const data = await res.json();
  let latest = '';
  if (data.rereleases) {
    for (const r of data.rereleases) {
      if (!knownTags.has(r.tag)) {
        knownTags.add(r.tag);
        if (typeof window.trackRerelease === 'function') {
          window.trackRerelease(r.branch);
        }
      }
      if (r.branch === 'command' && (!latest || r.tag > latest)) {
        latest = r.tag;
      }
    }
  }
  $('rerelease-badge').textContent = latest ? '↻' + latest.replace('command-', '') : '';
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
