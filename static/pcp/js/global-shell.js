(function(){
  function assetPath(fileName) {
    return `/static/pcp/assets/img/${fileName}`;
  }

  function setImgWithFallback(img, fileName) {
    if (!img) return;
    const candidates = [
      `/static/pcp/assets/img/${fileName}`,
      `/assets/img/${fileName}`,
      `../assets/img/${fileName}`,
      `assets/img/${fileName}`
    ];
    let index = 0;
    img.onerror = () => {
      index += 1;
      if (index < candidates.length) img.src = candidates[index];
    };
    img.src = candidates[index];
  }

  function ensureTopBar(){
    const header = document.querySelector('.app-header .container-fluid');
    if (!header) return;
    header.innerHTML = '';
  }

  function ensureSidebarBrand(){
    const brand = document.querySelector('.brand-link');
    if (!brand) return;
    const img = brand.querySelector('img.brand-image') || brand.querySelector('img');
    if (img) {
      setImgWithFallback(img, 'AdminLTELogo.png');
      img.alt = 'Logo';
      img.classList.add('brand-image');
    }
    const text = brand.querySelector('.brand-text');
    if (text) text.remove();
  }

  function updateSidebarWidth() {
    const sidebar = document.querySelector('.app-sidebar');
    const collapsed = document.body.classList.contains('sidebar-collapse');
    const width = collapsed ? 0 : (sidebar ? sidebar.getBoundingClientRect().width : 0);
    document.documentElement.style.setProperty('--sidebar-width', `${Math.max(0, Math.round(width))}px`);
  }

  function ensureSidebarToggle(){
    if (!document.querySelector('.app-sidebar')) return;
    if (document.querySelector('.shell-sidebar-toggle')) return;
    const btn = document.createElement('button');
    btn.className = 'shell-sidebar-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle sidebar');
    btn.textContent = '≡';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapse');
      updateSidebarWidth();
    });
    document.body.appendChild(btn);
  }

  function ensureContentHeader(){
    const header = document.querySelector('.app-content-header .container-fluid');
    if (!header) return;
    if (header.querySelector('.pcp-page-header')) return;
    header.innerHTML = `
      <div class="pcp-page-header">
        <div class="pcp-page-title"></div>
        <div class="pcp-page-actions">
          <button class="btn btn-sm pcp-head-btn" type="button" id="headerTryFreeBtn">Try Free</button>
          <button class="btn btn-sm pcp-head-btn" type="button" id="headerUploadBtn">Upload</button>
          <input id="headerUploadInput" type="file" accept="image/*" style="display:none;">
        </div>
      </div>
      <div class="pcp-header-divider"></div>
    `;
    const tryBtn = header.querySelector('#headerTryFreeBtn');
    const uploadBtn = header.querySelector('#headerUploadBtn');
    const uploadInput = header.querySelector('#headerUploadInput');
    if (tryBtn) tryBtn.addEventListener('click', () => {
      if (window.showModalError) window.showModalError('Try Free coming soon.');
    });
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && typeof window.applyBgFile === 'function') {
          window.applyBgFile(file);
        }
      });
    }
  }

  function collapseSidebarDefault(){
    if (!document.querySelector('.app-sidebar')) return;
    document.body.classList.add('sidebar-collapse');
  }

  function ensureRemoteDrawer() {
    if (document.getElementById('ocDrawer') || document.getElementById('ocTab')) return;
    if (document.getElementById('cfc-agent-host')) return;

    const host = document.createElement('div');
    host.id = 'cfc-agent-host';
    document.body.appendChild(host);

    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        :host {
          all: initial;
        }
        #oc-tab {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483000;
          padding: 0.45rem 1rem;
          background: #161c24;
          border: 1px solid #3b4a57;
          border-top: none;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          color: #c9d8e2;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,0,0,0.45);
        }
        #oc-tab.hidden { display: none; }
        #oc-drawer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100vh;
          z-index: 2147482900;
          transform: translateY(-100%);
          transition: transform 1.1s ease;
          background: #0a0a0a;
          color: #7a9aaa;
          border-bottom: 1px solid #1e2428;
          display: flex;
          flex-direction: column;
          font-family: 'Share Tech Mono', monospace;
        }
        #oc-drawer.open { transform: translateY(0); }
        #oc-handle {
          height: 34px;
          background: #111418;
          border-bottom: 1px solid #1e2428;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #oc-toggle-up {
          border: 1px solid #1e2428;
          background: #0d1014;
          color: #7a9aaa;
          width: 28px;
          height: 22px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          line-height: 1;
        }
        #cfc-root {
          background: #0a0a0a;
          color: #7a9aaa;
          font-family: 'Share Tech Mono', monospace;
          height: calc(100% - 34px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        #header {
          height: 52px;
          background: #111418;
          border-bottom: 1px solid #1e2428;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
          flex-shrink: 0;
        }
        #header h1 {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #00ff88;
          text-transform: uppercase;
          margin: 0;
        }
        #header .sep { flex: 1; }
        #timer-display {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #334;
          transition: color 0.3s;
        }
        #timer-display.active   { color: #00ff88; }
        #timer-display.warning  { color: #ffaa00; }
        #timer-display.critical { color: #ff3333; }
        #led-strip {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .led {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #222;
          transition: background 0.4s, box-shadow 0.4s, border-color 0.4s;
        }
        .led.on-green {
          background: #00ff88;
          box-shadow: 0 0 6px #00ff88, 0 0 14px rgba(0,255,136,0.35);
          border-color: #00ff88;
        }
        .led.on-amber {
          background: #ffaa00;
          box-shadow: 0 0 6px #ffaa00, 0 0 14px rgba(255,170,0,0.35);
          border-color: #ffaa00;
        }
        .led.on-red {
          background: #ff3333;
          box-shadow: 0 0 6px #ff3333, 0 0 14px rgba(255,51,51,0.35);
          border-color: #ff3333;
        }
        .led.flash { animation: ledFlash 0.5s ease-in-out infinite; }
        @keyframes ledFlash {
          0%,100% {
            background: #ff3333;
            box-shadow: 0 0 8px #ff3333, 0 0 16px rgba(255,51,51,0.5);
            border-color: #ff3333;
          }
          50% {
            background: #1a1a1a;
            box-shadow: none;
            border-color: #222;
          }
        }
        #screen-area {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #050608;
        }
        #screen-area::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px);
          pointer-events: none;
          z-index: 10;
        }
        #guac-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          opacity: 0;
          transition: opacity 0.7s ease;
          display: none;
        }
        #guac-frame.visible { display: block; opacity: 1; }
        #standby-screen {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          transition: opacity 0.5s ease;
        }
        #standby-screen.hidden { opacity: 0; pointer-events: none; }
        #standby-screen .logo {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          letter-spacing: 8px;
          color: #151d22;
          text-transform: uppercase;
        }
        #standby-screen .hint {
          font-size: 12px;
          letter-spacing: 2px;
          color: #151d22;
          animation: blink 2.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        #offline-screen {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        #offline-screen.visible { display: flex; }
        #offline-screen img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: grayscale(30%) brightness(0.8);
        }
        #offline-screen .offline-label {
          position: absolute;
          bottom: 24px;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          letter-spacing: 5px;
          color: #ff3333;
          opacity: 0.6;
        }
        #bottom-bar {
          height: 68px;
          background: #111418;
          border-top: 1px solid #1e2428;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 10px;
          flex-shrink: 0;
        }
        #power-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0d1014;
          border: 2px solid #1e2428;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          outline: none;
          flex-shrink: 0;
        }
        #power-btn:hover {
          border-color: #00ff88;
          box-shadow: 0 0 10px rgba(0,255,136,0.2);
        }
        #power-btn.on {
          border-color: #00ff88;
          box-shadow: 0 0 10px rgba(0,255,136,0.4), inset 0 0 8px rgba(0,255,136,0.08);
        }
        #power-btn svg {
          width: 18px;
          height: 18px;
          stroke: #334;
          transition: stroke 0.25s;
        }
        #power-btn.on svg,
        #power-btn:hover svg {
          stroke: #00ff88;
        }
        #user-query {
          flex: 1;
          padding: 12px 16px;
          border-radius: 3px;
          border: 1px solid #1e2428;
          background: #0d1014;
          color: #8ab;
          font-family: 'Share Tech Mono', monospace;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }
        #user-query::placeholder { color: #1e2d35; }
        #user-query:focus { border-color: #233a48; }
        #user-query:disabled { opacity: 0.3; }
        #send-btn {
          padding: 12px 22px;
          background: #0d1a14;
          color: #00ff88;
          border: 1px solid #1a3028;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          font-size: 16px;
          letter-spacing: 1px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        #send-btn:hover { background: #122218; border-color: #00ff88; }
        #send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        #feedback {
          font-size: 13px;
          color: #2a4a3a;
          min-width: 80px;
          text-align: right;
          letter-spacing: 1px;
        }
      </style>

      <div id="oc-tab">CFC Agent ∨</div>
      <div id="oc-drawer">
        <div id="oc-handle"><button id="oc-toggle-up">∧</button></div>
        <div id="cfc-root">
          <div id="header">
            <h1>CFC Agent</h1>
            <span class="sep"></span>
            <span id="timer-display">--:--</span>
            <div id="led-strip">
              <div class="led" id="led3"></div>
              <div class="led" id="led2"></div>
              <div class="led" id="led1"></div>
            </div>
          </div>
          <div id="screen-area">
            <div id="standby-screen">
              <div class="logo">Remote Console</div>
              <div class="hint">PRESS POWER TO CONNECT</div>
            </div>
            <iframe id="guac-frame" src="about:blank"></iframe>
            <div id="offline-screen">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbRMurlnytG6EBS2oDoBOZ5SHbpoco7WI_mg&s" alt="Session ended">
              <div class="offline-label">SESSION TERMINATED</div>
            </div>
          </div>
          <div id="bottom-bar">
            <button id="power-btn" title="Connect / Disconnect">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v6"></path>
                <path d="M6.3 6.3a8 8 0 1 0 11.4 0"></path>
              </svg>
            </button>
            <input type="text" id="user-query" placeholder="Ask CFC Agent to do something...">
            <button id="send-btn" type="button">Send</button>
            <span id="feedback"></span>
          </div>
        </div>
      </div>
    `;

    const GUAC_BASE = 'http://52.90.153.108:8080/guacamole';
    const GUAC_USER = 'guacadmin';
    const GUAC_PASS = 'guacadmin';
    const SESSION_SECS = 60;
    const GATEWAY_URL = 'http://52.90.153.108:18789';
    const GATEWAY_TOKEN = 'YOUR_OPENCLAW_GATEWAY_TOKEN';

    let isOn = false;
    let countdown = 0;
    let ticker = null;

    const tab = root.getElementById('oc-tab');
    const drawer = root.getElementById('oc-drawer');
    const closeBtn = root.getElementById('oc-toggle-up');
    const powerBtn = root.getElementById('power-btn');
    const guacFrame = root.getElementById('guac-frame');
    const standby = root.getElementById('standby-screen');
    const offline = root.getElementById('offline-screen');
    const timerEl = root.getElementById('timer-display');
    const led1 = root.getElementById('led1');
    const led2 = root.getElementById('led2');
    const led3 = root.getElementById('led3');
    const input = root.getElementById('user-query');
    const sendBtn = root.getElementById('send-btn');
    const feedback = root.getElementById('feedback');

    async function getGuacToken() {
      try {
        const res = await fetch(`${GUAC_BASE}/api/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(GUAC_USER)}&password=${encodeURIComponent(GUAC_PASS)}`
        });
        if (!res.ok) throw new Error(res.status);
        return (await res.json()).authToken;
      } catch (e) {
        console.warn('Token fetch failed:', e);
        return null;
      }
    }

    function setLed(el, cls) {
      if (!el) return;
      el.className = cls ? `led ${cls}` : 'led';
    }

    function updateLeds(s) {
      if (s > 40) {
        setLed(led3, 'on-green');
        setLed(led2, 'on-green');
        setLed(led1, 'on-green');
      } else if (s > 20) {
        setLed(led3, null);
        setLed(led2, 'on-amber');
        setLed(led1, 'on-amber');
      } else if (s > 10) {
        setLed(led3, null);
        setLed(led2, null);
        setLed(led1, 'on-red');
      } else if (s > 0) {
        setLed(led3, null);
        setLed(led2, null);
        setLed(led1, 'on-red flash');
      } else {
        setLed(led3, null);
        setLed(led2, null);
        setLed(led1, null);
      }
    }

    function updateTimer(s) {
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      if (timerEl) {
        timerEl.textContent = `${mm}:${ss}`;
        timerEl.className = s > 40 ? 'active' : s > 10 ? 'warning' : 'critical';
      }
    }

    function timeout() {
      isOn = false;
      if (powerBtn) powerBtn.classList.remove('on');
      if (guacFrame) {
        guacFrame.classList.remove('visible');
        guacFrame.src = 'about:blank';
      }
      setLed(led1, null);
      setLed(led2, null);
      setLed(led3, null);
      if (timerEl) {
        timerEl.textContent = '00:00';
        timerEl.className = 'critical';
      }
      if (standby) standby.classList.add('hidden');
      if (offline) offline.classList.add('visible');
    }

    async function connect() {
      isOn = true;
      if (powerBtn) powerBtn.classList.add('on');
      if (standby) standby.classList.add('hidden');
      if (offline) offline.classList.remove('visible');
      const token = await getGuacToken();
      if (guacFrame) {
        guacFrame.src = token ? `${GUAC_BASE}/#/?token=${token}` : `${GUAC_BASE}/#/`;
        guacFrame.classList.add('visible');
      }
      countdown = SESSION_SECS;
      updateLeds(countdown);
      updateTimer(countdown);
      if (ticker) clearInterval(ticker);
      ticker = setInterval(() => {
        countdown -= 1;
        updateLeds(countdown);
        updateTimer(countdown);
        if (countdown <= 0) {
          clearInterval(ticker);
          ticker = null;
          timeout();
        }
      }, 1000);
    }

    function disconnect() {
      isOn = false;
      if (ticker) clearInterval(ticker);
      ticker = null;
      if (powerBtn) powerBtn.classList.remove('on');
      if (guacFrame) {
        guacFrame.classList.remove('visible');
        guacFrame.src = 'about:blank';
      }
      setLed(led1, null);
      setLed(led2, null);
      setLed(led3, null);
      if (timerEl) {
        timerEl.textContent = '--:--';
        timerEl.className = '';
      }
      if (standby) standby.classList.remove('hidden');
      if (offline) offline.classList.remove('visible');
    }

    async function sendMessage() {
      if (!input || !sendBtn || !feedback) return;
      const message = input.value.trim();
      if (!message) return;
      input.disabled = true;
      sendBtn.disabled = true;
      feedback.textContent = 'Sending...';
      try {
        const res = await fetch(`${GATEWAY_URL}/api/message/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GATEWAY_TOKEN}`
          },
          body: JSON.stringify({ message, channel: 'web_ui' })
        });
        feedback.textContent = res.ok ? '✓ Sent' : `Error ${res.status}`;
        if (res.ok) {
          input.value = '';
          setTimeout(() => {
            feedback.textContent = '';
          }, 3000);
        }
      } catch (e) {
        feedback.textContent = 'No connection';
        console.error(e);
      } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    function openDrawer() {
      if (drawer) drawer.classList.add('open');
      if (tab) tab.classList.add('hidden');
    }
    function closeDrawer() {
      if (drawer) drawer.classList.remove('open');
      if (tab) tab.classList.remove('hidden');
    }

    if (tab) tab.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (powerBtn) powerBtn.addEventListener('click', () => (isOn ? disconnect() : connect()));
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    collapseSidebarDefault();
    ensureTopBar();
    ensureSidebarBrand();
    ensureContentHeader();
    ensureSidebarToggle();
    ensureRemoteDrawer();
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    const observer = new MutationObserver(() => updateSidebarWidth());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
})();
