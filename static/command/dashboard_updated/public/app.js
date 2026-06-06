// COMMAND Cockpit - App Logic
let config = { bias: 0, risk: 0, gear: 3, toggle_exceptions: {} };
let branches = [];
let activeBranch = '';
let isCallActive = false;
let recognition = null;

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
  initSidePanels();
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
  console.log('Version:', v);
}

async function loadBranches() {
  try {
    const res = await fetch('/api/branches');
    if (!res) return;
    branches = await res.json();
    updateSidePanels();
  } catch (e) {
    console.error('Failed to load branches:', e);
  }
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res) return;
    const data = await res.json();
    Object.assign(config, data);
    applyConfig();
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

async function saveConfig(updates) {
  Object.assign(config, updates);
  try {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

function applyConfig() {
  // Apply joystick bias/risk
  const bias = config.bias || 0;
  const risk = config.risk || 0;
  // Will be applied by joystick initialization
  
  // Apply gear
  const gear = config.gear || 3;
  $('gear-slider').value = gear;
  $('gear-value').textContent = gear;
  updateGearRate(gear);
  
  // Set active preset
  document.querySelectorAll('.preset').forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.gear) === gear);
  });
}

// ── Joystick Implementation (like a car joystick with compass) ──
function initJoystick() {
  const canvas = $('joystick-canvas');
  const ctx = canvas.getContext('2d');
  let dragging = false;
  let bias = config.bias || 0;
  let risk = config.risk || 0;
  const canvasSize = 120; // Match CSS compass-size
  
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  
  function drawJoystick() {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 8;
    
    ctx.clearRect(0, 0, W, H);
    
    // Outer ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,242,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
    
    // Inner ring
    ctx.beginPath(); ctx.arc(cx, cy, r * (1 - 0.00729735256), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,242,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    
    // Crosshairs
    ctx.beginPath(); 
    ctx.moveTo(cx - r + 5, cy); ctx.lineTo(cx + r - 5, cy);
    ctx.moveTo(cx, cy - r + 5); ctx.lineTo(cx, cy + r - 5);
    ctx.strokeStyle = 'rgba(0,242,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
    
    // Joystick handle
    const range = r * 0.6;
    const bx = cx + (bias / 5) * range;
    const by = cy - (risk / 5) * range;
    
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2ff'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    
    // Center dot
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,242,255,0.3)'; ctx.fill();
    
    // Direction markers
    ctx.fillStyle = 'rgba(200,208,224,0.3)'; 
    ctx.font = '6px monospace'; 
    ctx.textAlign = 'center';
    ctx.fillText('←', cx - r + 4, cy + 2);
    ctx.fillText('→', cx + r - 4, cy + 2);
    ctx.fillText('▲', cx, cy - r + 7);
    ctx.fillText('▼', cx, cy + r - 4);
    
    // Update labels
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
    
    // Update track angle based on joystick position
    if (typeof window.trackSetAngle === 'function') {
      // Convert bias/risk (-5 to 5) to angle (0 to 2PI)
      const angle = Math.atan2(nrisk, nbias); // -PI to PI
      window.trackSetAngle((angle + Math.PI) / (2 * Math.PI)); // 0 to 1
    }
  }

  canvas.addEventListener('mousedown', (e) => { dragging = true; posToValue(e.clientX, e.clientY); });
  window.addEventListener('mousemove', (e) => { if (dragging) posToValue(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.touches[0]; posToValue(t.clientX, t.clientY); });

  drawJoystick();
}

// Add bias/risk elements to DOM if they don't exist
function ensureJoystickLabels() {
  if (!$('joystick-bias')) {
    const biasLabel = document.createElement('div');
    biasLabel.id = 'joystick-bias';
    biasLabel.style.position = 'absolute';
    biasLabel.style.bottom = '-2.5rem';
    biasLabel.style.left = '50%';
    biasLabel.style.transform = 'translateX(-50%)';
    biasLabel.style.fontSize = '0.65rem';
    biasLabel.style.color = 'var(--cyan-dim)';
    biasLabel.style.letterSpacing = '1px';
    biasLabel.textContent = 'BIAS:0';
    $('joystick-base').appendChild(biasLabel);
  }
  
  if (!$('joystick-risk')) {
    const riskLabel = document.createElement('div');
    riskLabel.id = 'joystick-risk';
    riskLabel.style.position = 'absolute';
    riskLabel.style.top = '-2.5rem';
    riskLabel.style.left = '50%';
    riskLabel.style.transform = 'translateX(-50%)';
    riskLabel.style.fontSize = '0.65rem';
    riskLabel.style.color = 'var(--orange)';
    riskLabel.style.letterSpacing = '1px';
    riskLabel.textContent = 'RISK:0';
    $('joystick-base').appendChild(riskLabel);
  }
}

// ── Gear Shift (1-10 slider) ──
const RATE_BY_GEAR = [3600, 2627, 1917, 1399, 1021, 745, 544, 397, 290, 211, 154];

function initGear() {
  const slider = $('gear-slider');
  const valueDisplay = $('gear-value');
  const rateDisplay = $('gear-rate-label');
  
  function updateGearRate(gear) {
    const rateSeconds = RATE_BY_GEAR[gear - 1] || 3600;
    let rateText;
    if (rateSeconds >= 3600) {
      rateText = (rateSeconds / 3600) + '/hr';
    } else if (rateSeconds >= 60) {
      rateText = (rateSeconds / 60) + '/min';
    } else {
      rateText = rateSeconds + '/sec';
    }
    rateDisplay.textContent = rateText;
  }
  
  slider.addEventListener('input', (e) => {
    const gear = parseInt(e.target.value);
    valueDisplay.textContent = gear;
    updateGearRate(gear);
    saveConfig({ gear: gear });
    
    // Update active preset
    document.querySelectorAll('.preset').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.gear) === gear);
    });
    
    // Update track speed
    if (typeof window.trackSetSpeed === 'function') {
      // Map gear 1-10 to speed 0.2 - 2.0
      const speed = 0.2 + (gear - 1) * 0.2;
      window.trackSetSpeed(speed);
    }
  });
  
  // Preset clicks
  document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gear = parseInt(e.target.dataset.gear);
      slider.value = gear;
      valueDisplay.textContent = gear;
      updateGearRate(gear);
      saveConfig({ gear: gear });
      
      // Update active preset
      document.querySelectorAll('.preset').forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.gear) === gear);
      });
      
      // Update track speed
      if (typeof window.trackSetSpeed === 'function') {
        const speed = 0.2 + (gear - 1) * 0.2;
        window.trackSetSpeed(speed);
      }
    });
  });
  
  // Initialize display
  updateGearRate(parseInt(slider.value));
}

// ── Side Panels (Branch Lists) ──
function initSidePanels() {
  // Left button
  $('btn-left').addEventListener('click', () => {
    $('btn-left').classList.toggle('active');
    $('btn-right').classList.remove('active');
    // TODO: Implement left branch logic
  });
  
  // Right button
  $('btn-right').addEventListener('click', () => {
    $('btn-right').classList.toggle('active');
    $('btn-left').classList.remove('active');
    // TODO: Implement right branch logic
  });
}

function updateSidePanels() {
  const leftList = $('left-list');
  const rightList = $('right-list');
  
  if (!leftList || !rightList) return;
  
  // Clear lists
  leftList.innerHTML = '';
  rightList.innerHTML = '';
  
  // Populate with branches (example split)
  const mid = Math.ceil(branches.length / 2);
  const leftBranches = branches.slice(0, mid);
  const rightBranches = branches.slice(mid);
  
  leftBranches.forEach(branch => {
    const item = document.createElement('div');
    item.className = 'branch-item';
    item.innerHTML = `
      <div class="branch-dot" style="background-color: ${getBranchColor(branch) || '#888'}"></div>
      <div class="branch-name">${branch}</div>
    `;
    item.addEventListener('click', () => {
      document.querySelectorAll('.branch-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (typeof window.trackSelectBranch === 'function') {
        window.trackSelectBranch(branch);
      }
    });
    leftList.appendChild(item);
  });
  
  rightBranches.forEach(branch => {
    const item = document.createElement('div');
    item.className = 'branch-item';
    item.innerHTML = `
      <div class="branch-dot" style="background-color: ${getBranchColor(branch) || '#888'}"></div>
      <div class="branch-name">${branch}</div>
    `;
    item.addEventListener('click', () => {
      document.querySelectorAll('.branch-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (typeof window.trackSelectBranch === 'function') {
        window.trackSelectBranch(branch);
      }
    });
    rightList.appendChild(item);
  });
}

function getBranchColor(branch) {
  const colors = {
    althea:'#ff6b6b',archives:'#c9a96e',bpvsbuckler:'#4ecdc4',carfinancecheque:'#45b7d1',
    ccan:'#96ceb4',ceo:'#ffeead',cnei:'#ff4444',dash:'#d4a574',
    datro:'#00f2ff',dcc:'#ffd93d',financecheque:'#6bcb77',greathousefarm:'#4d96ff',
    gui:'#ff6b6b',hbnb:'#ff922b',library:'#69db7c',llmwiki:'#f783ac',
    subrepos:'#748ffc',ui:'#20c997',wave:'#f06595',wayback:'#a9e34b',
    whitepaper:'#e8590c',pirateclaw:'#be4bdb'
  };
  return colors[branch] || '#888';
}

// ── Manual Release Buttons ──
function initManualRelease() {
  $('rel-fc').addEventListener('click', () => triggerRelease('financecheque'));
  $('rel-cn').addEventListener('click', () => triggerRelease('cnei'));
  $('rel-cm').addEventListener('click', () => triggerRelease('command'));
}

function triggerRelease(branch) {
  // Add visual feedback
  const btn = $(`rel-${branch.substring(0,2)}`);
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 300);
  
  // Trigger release via track
  if (typeof window.trackRerelease === 'function') {
    window.trackRerelease(branch);
  }
  
  // TODO: Actually call release API
}

// ── Radio/COMMS ──
function initRadio() {
  $('radio-send-btn').addEventListener('click', sendRadioMessage);
  $('radio-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendRadioMessage();
  });
  
  $('btn-call').addEventListener('click', toggleCall);
  $('btn-hangup').addEventListener('click', toggleCall);
}

function sendRadioMessage() {
  const input = $('radio-input');
  const message = input.value.trim();
  if (!message) return;
  
  const messagesDiv = $('radio-messages');
  if (!messagesDiv) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'radio-msg';
  messageEl.textContent = `[${new Date().toLocaleTimeString()}] You: ${message}`;
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  input.value = '';
  
  // TODO: Send message to actual radio system
}

function toggleCall() {
  isCallActive = !isCallActive;
  $('btn-call').disabled = isCallActive;
  $('btn-hangup').disabled = !isCallActive;
  $('btn-hangup').textContent = isCallActive ? 'END' : 'CALL';
  $('radio-status').textContent = isCallActive ? 'Connected...' : 'Standing by...';
  
  // TODO: Implement actual call toggle
}

// ── Editor Modal (keep existing) ──
function initEditor() {
  // Keep existing editor initialization from backup
  // For now, just ensure elements exist
  const modalClose = $('modal-editor-close');
  const editorSave = $('editor-save');
  
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      $('editor-modal').style.display = 'none';
    });
  }
  
  if (editorSave) {
    editorSave.addEventListener('click', () => {
      // TODO: Save editor content
      $('editor-status').textContent = 'Saved!';
      setTimeout(() => {
        $('editor-status').textContent = '';
      }, 1500);
    });
  }
}

// ── Fuel Updates (keep existing) ──
async function loadFuel() {
  try {
    const res = await fetch('/api/fuel');
    if (!res) return;
    const data = await res.json();
    
    // Update fuel bars
    const fuelTypes = ['api', 'llm', 'cli', 'ide'];
    fuelTypes.forEach(type => {
      const fill = $(`fuel-${type}`);
      if (fill && data[type] !== undefined) {
        const percent = Math.min(100, Math.max(0, data[type]));
        fill.style.height = percent + '%';
      }
    });
  } catch (e) {
    console.error('Failed to load fuel:', e);
  }
}

// ── Rerelease Updates (keep existing) ──
async function loadRereleases() {
  try {
    const res = await fetch('/api/rereleases');
    if (!res) return;
    const data = await res.json();
    
    // Update milestone display
    if (data.latest) {
      $('current-milestone').textContent = data.latest.branch || '--';
    }
    if (data.progress !== undefined && data.total !== undefined) {
      $('progress-milestone').textContent = `${data.progress}/${data.total}`;
    }
    
    // Update track
    if (typeof window.trackMilestones === 'function') {
      window.trackMilestones({
        regular_index: data.progress || 0,
        cnei_queue: 0, // TODO: Get actual value
        lap: Math.floor((data.progress || 0) / 22), // 22 branches per lap
        mode: 'AUTO'
      });
    }
  } catch (e) {
    console.error('Failed to load rereleases:', e);
  }
}

// ── Flywheel Updates (keep existing) ──
async function pollFlywheel() {
  try {
    const res = await fetch('/api/flywheel');
    if (!res) return;
    const data = await res.json();
    
    // Update active branch display
    if (data.active_branch) {
      activeBranch = data.active_branch;
      // Update branch selection in UI
      const branchSelect = $('branch-select'); // Old element, may not exist
      if (branchSelect) branchSelect.value = activeBranch;
      
      // Update side panel active item
      document.querySelectorAll('.branch-item').forEach(item => {
        const isActive = item.textContent.trim() === activeBranch;
        item.classList.toggle('active', isActive);
      });
      
      // Update track
      if (typeof window.trackSelectBranch === 'function') {
        window.trackSelectBranch(activeBranch);
      }
    }
  } catch (e) {
    console.error('Failed to poll flywheel:', e);
  }
}

// ── Track Display ──
function showTrack() {
  const trackContainer = $('track-stage') || $('windshield');
  if (!trackContainer) return;
  
  // Ensure canvas exists
  let canvas = $('track-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'track-canvas';
    trackContainer.appendChild(canvas);
  }
  
  // Initialize track if function exists
  if (typeof window.trackInit === 'function') {
    window.trackInit(canvas);
    window.trackStart();
  }
}

// Legacy functions for compatibility
function renderWingFiles() { /* No longer used */ }
function loadWingFiles() { /* No longer used */ }
function initDirButtons() { /* No longer used */ }
