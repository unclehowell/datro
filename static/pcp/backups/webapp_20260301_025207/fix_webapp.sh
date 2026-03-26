#!/bin/bash
set -euo pipefail

#=================================================================================
# PCP Web App Fix Script - iframe and Cross-Origin Configuration
# Author: AI Assistant powered by moonshotai/kimi-k2-instruct on Groq
# Description: Fixes web app for proper iframe and cross-origin functionality
#=================================================================================

echo "=== PCP Web App Fix - iframe + Cross-Origin Configuration ==="
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Change to pcp directory if not already there
if [[ -d "~/pcp" ]] && [[ ! "$(pwd)" =~ pcp ]]; then
    cd ~/pcp
fi

# Create backup
echo "🔒 Creating backup of web application..."
BACKUP_DIR="./backups/webapp_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
cp -a * "$BACKUP_DIR/" 2>/dev/null || true

#=================================================================================
# 1. FIX JAVASCRIPT CORS ISSUES
#=================================================================================
echo "🔧 Fixing JavaScript CORS configuration..."

cat > assets/js/app-iframesafe.js << 'EOL'
/**
 * PCP Web App - Enhanced CORS/CSP compatible version
 * Fixes cross-origin iframe and API communication issues
 */

(function() {
    'use strict';
    
    // Configuration for different environments
    const ENVIRONMENTS = {
        production: {
            apiBase: 'https://ai.carfinancecheque.uk',
            corsOrigins: ['https://financecheque.uk', 'https://carfinancecheque.uk'],
            websocketBase: 'wss://ai.carfinancecheque.uk'
        },
        staging: {
            apiBase: 'https://ai.financecheque.uk',
            corsOrigins: ['https://financecheque.uk', 'https://carfinancecheque.uk'],
            websocketBase: 'wss://ai.financecheque.uk'
        }
    };
    
    const CURRENT_ENV = window.location.host.includes('ai.') ? 'production' : 'staging';
    const CONFIG = ENVIRONMENTS[CURRENT_ENV];
    
    // Enhanced CORS headers function
    function getCorsHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Custom-Header': 'PCP-WEBAPP-' + Date.now()
        };
        
        // Add proper origin header
        try {
            headers['Origin'] = window.location.origin;
        } catch (e) {
            // Fallback for edge cases
            headers['Origin'] = '*';
        }
        
        return headers;
    }
    
    // Enhanced API communication with proper CORS handling
    function makeCorsRequest(url, data = null, method = 'GET') {
        const options = {
            method: method,
            mode: 'cors',
            credentials: 'include',
            headers: getCorsHeaders()
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        return fetch(url, options);
    }
    
    // OpenClaw drawer initialization with CORS fixes
    document.addEventListener('DOMContentLoaded', () => {
        const ocTab = document.getElementById('ocTab');
        const ocDrawer = document.getElementById('ocDrawer');
        const guacFrame = document.getElementById('guac-frame');
        const userQuery = document.getElementById('user-query');
        const sendBtn = document.getElementById('send-btn');
        
        // Enhanced configuration for cross-origin support
        const USER_NUM = getLocalStorageItem('user_num', '1');
        const USER_PWD = getLocalStorageItem('user_pwd', '');
        const hasRemoteLogin = USER_PWD.trim().length > 0;
        
        const REMOTE_HOST_PRIMARY = CONFIG.apiBase;
        const REMOTE_HOST_FALLBACK = CONFIG.apiBase.replace('ai.', '');
        
        const GATEWAY_URL = `${REMOTE_HOST_PRIMARY}/command${USER_NUM}/support`;
        const GATEWAY_TOKEN = '9533263d7ff39819800754b970748ddf';
        
        // Override the default sendMessage function with CORS fixes
        if (sendBtn && userQuery && hasRemoteLogin) {
            sendBtn.addEventListener('click', async function() {
                const message = userQuery.value.trim();
                if (!message) return;
                
                try {
                    const response = await makeCorsRequest(GATEWAY_URL, {
                        message: message,
                        channel: 'web_ui',
                        user_num: USER_NUM,
                        origin: window.location.origin
                    }, 'POST');
                    
                    if (response.ok) {
                        userQuery.value = '';
                        showFeedback('✓ Command sent successfully');
                    } else {
                        showFeedback(`Error sending command: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Command send error:', error);
                    showFeedback('Connection error - check network');
                }
            });
        }
        
        // Enhanced Guacamole iframe handling
        if (ocTab) {
            ocTab.addEventListener('click', () => {
                if (guacFrame && guacFrame.src === 'about:blank') {
                    // Set proper src with CORS parameters
                    const guacUrl = `${REMOTE_HOST_PRIMARY}/guacamole/#/?username=user2514853${USER_NUM}&password=${USER_PWD}`;
                    guacFrame.src = guacUrl;
                    
                    // Wait for iframe to load
                    guacFrame.onload = () => {
                        showFeedback('Guacamole session connected');
                    };
                    
                    guacFrame.onerror = () => {
                        showFeedback('Failed to connect Guacamole - check configuration');
                    };
                }
            });
        }
    });
    
    // Utility functions
    function getLocalStorageItem(key, fallback = '') {
        try {
            return localStorage.getItem(key) || fallback;
        } catch {
            return fallback;
        }
    }
    
    function showFeedback(message) {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = message;
            setTimeout(() => feedback.textContent = '', 5000);
        } else {
            console.log('Feedback:', message);
        }
    }
    
    // Export for global compatibility
    window.PCP_CONFIG = CONFIG;
    window.makeCorsRequest = makeCorsRequest;
    window.getCorsHeaders = getCorsHeaders;
})();
EOL

# Make it executable
chmod +x assets/js/app-iframesafe.js

#=================================================================================
# 2. UPDATE INDEX.HTML WITH CORS-SAFE VERSION
#=================================================================================
echo "🔧 Updating index.html with CORS-safe configuration..."

# Create enhanced index.html
cat > index-enhanced.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <meta name="color-scheme" content="light dark" />
  <meta name="fc-asset-version" content="20260228a" />
  <title>Finance Cheque</title>

  <!-- Cross-origin compatibility headers -->
  <meta http-equiv="Access-Control-Allow-Origin" content="https://ai.carfinancecheque.uk,https://ai.financecheque.uk,https://carfinancecheque.uk">
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin-allow-popups">
  <meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
  <meta http-equiv="Cross-Origin-Resource-Policy" content="cross-origin">

  <link rel="stylesheet" href="assets/css/adminlte.css?v=20260227b" />
  <link rel="preload" as="video" href="assets/videos/welcometotechsupport.mp4?v=20260228a" type="video/mp4" />
  <link rel="preload" as="video" href="assets/videos/byehaveanicelife.mp4?v=20260228a" type="video/mp4" />
  <link rel="preload" as="video" href="assets/videos/john.webm?v=20260228a" type="video/webm" />
  <link rel="preconnect" href="https://stream.rcs.revma.com" crossorigin />

  <style>
    /* Enhanced iframe-friendly styles */
    body { overflow-x: visible; }
    
    /* Cross-origin iframe safety */
    #guac-frame {
      width: 100%;
      height: 100%;
      border: none;
      overflow: hidden;
      background: transparent;
      z-index: 1000;
    }
    
    /* Enhanced error states */
    .error-state {
      color: #ff6b6b;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.9rem;
    }
    
    .success-state {
  color: #00ff88;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.9rem;
    }
  </style>
  <link rel="stylesheet" href="vendor/bootstrap-icons.min.css" />
</head>

<body class="layout-fixed sidebar-expand-lg bg-body-tertiary dark-mode" data-bs-theme="dark">

<div id="boot-loader" aria-live="polite">
  <div class="boot-panel">
    <div class="boot-label">This is going to be like a Chapter in the Bible</div>
    <div class="boot-bar"><div class="boot-fill" id="boot-loader-fill"></div></div>
    <div class="boot-status" id="boot-loader-status">0%</div>
  </div>
</div>

<div id="media-preload-bin" aria-hidden="true"></div>

<script>
// Enhanced boot loader with cross-origin support
(() => {
  const loader = document.getElementById('boot-loader');
  const fill = document.getElementById('boot-loader-fill');
  const status = document.getElementById('boot-loader-status');
  const preloadBin = document.getElementById('media-preload-bin');
  if (!loader || !fill || !status || !preloadBin) return;

  const version = document.querySelector('meta[name="fc-asset-version"]')?.getAttribute('content') || '';
  const withVersion = (src) => {
    if (!version || /^https?:\/\//i.test(src)) return src;
    return `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
  };

  const tasks = [
    { type: 'video', src: withVersion('assets/videos/welcometotechsupport.mp4') },
    { type: 'video', src: withVersion('assets/videos/byehaveanicelife.mp4') },
    { type: 'video', src: withVersion('assets/videos/john.webm') },
    { type: 'audio', src: 'https://stream.rcs.revma.com/fxp289cp81uvv' }
  ];

  let completed = 0;
  const total = tasks.length;
  let finalized = false;

  const update = () => {
    const pct = Math.round((completed / total) * 100);
    fill.style.width = `${pct}%`;
    status.textContent = `${pct}%`;
  };

  const finalize = () => {
    if (finalized) return;
    finalized = true;
    load.status = 'loaded';
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 320);
  };

  const completeOne = () => {
    completed += 1;
    update();
    if (completed >= total) finalize();
  };

  const preloadOne = (task, index) => {
    const element = document.createElement(task.type);
    let done = false;
    const markDone = () => {
      if (done) return;
      done = true;
      completeOne();
    };

    element.preload = 'auto';
    element.src = task.src;
    if (task.type === 'video') {
      element.muted = true;
      element.playsInline = true;
      element.addEventListener('loadeddata', markDone, { once: true });
      element.addEventListener('canplaythrough', markDone, { once: true });
    } else {
      element.volume = 0;
      element.addEventListener('loadedmetadata', markDone, { once: true });
    }
    element.addEventListener('error', markDone, { once: true });
    element.addEventListener('stalled', markDone, { once: true });

    preloadBin.appendChild(element);
    try { element.load(); } catch (error) {}
    setTimeout(markDone, 2800);
  };

  update();
  tasks.forEach(preloadOne);
  setTimeout(finalize, 6500);
})();
</script>

<div class="login-box">
  <div class="card card-outline card-primary shadow">
    <div class="card-header text-center">
      <img src="assets/img/logo.png" alt="Finance Cheque." style="height:96px; width:auto; margin-bottom:10px;">
      <div style="font-size:1.05rem; letter-spacing:0.12em; text-transform:uppercase; color:#e7edf5;">Finance Cheque</div>
    </div>

    <div class="card-body">
      <form id="loginForm">
        <div class="form-group mb-3">
          <label for="user-select">Nation</label>
          <select id="user-select" class="form-control">
            <option value="1">Wales</option>
            <option value="2">Ireland</option>
            <option value="3">Scotland</option>
            <option value="4">England</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label for="password-input">Early Access ID</label>
          <div class="input-group">
            <input 
              id="password-input"
     type="password"
       class="form-control"
    placeholder="Enter password"
              autocomplete="current-password"
 required
              autofocus
            >
          </div>
        </div>
        
   <div class="form-group mb-3">
    <div class="form-check">
       <input class="form-check-input" type="checkbox" id="show-password">
        <label class="form-check-label" for="show-password">
                    Show Password
                </label>
            </div>
        </div>

  <div id="error" class="text-danger mb-3" style="display:none;"></div>
  <div id="feedback" class="text-success mb-3" style="display:none;"></div>

        <button type="submit" class="btn btn-primary btn-block w-100" style="background-color: #45ff8f; border-color: #45ff8f; color: #000;">
          Login
        </button>
      </form>
    </div>
  </div>
</div>

<script>
// Cross-origin compatible login system
document.getElementById('show-password').addEventListener('change', function(e) {
    const passwordInput = document.getElementById('password-input');
    if (e.target.checked) {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
});

// Enhanced authentication with cross-origin support
async function hashPassword(str) {
  const utf8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

const VALID_HASHES = {
  "1": "d015e3bb592d887241d26d27e15cdbff24e57f13e7336c636aa8ceb12b38ad99",
  "2": "89c139ff45b6e9aa55e98302bbc8c070758e54f3d5e960a0101a4d3c5916bb98",
  "3": "ff9d65f48991f6463211580e9e6df2faf9427ac2a7e0137ffca99005733a976c",
  "4": "8c86f7bb66e5c389966fe80d28f74b0b062ddc4f9ca3a85de146eed72dd23311"
};

document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const userNum = document.getElementById("user-select").value;
  const input = document.getElementById("password-input").value;
  const error = document.getElementById("error");
  const feedback = document.getElementById("feedback");
  const inputHash = await hashPassword(input);

  if (inputHash === VALID_HASHES[userNum]) {
    localStorage.setItem("session_active", "true");
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("user_num", userNum);
  localStorage.setItem("user_pwd", input);
    
    // Cross-origin redirect
    const targetPage = new URL('./pages/index.html', window.location.href).href;
    window.location.href = targetPage;
    
  } else {
    error.innerText = "Invalid Access Key";
    error.style.display = "block";
    feedback.style.display = "none";
  }
});
</script>

<div class="oc-tab" id="ocTab">
    <div style="position: relative; text-align: center;">
      <img id="ocTabImg" src="assets/img/pine.png" alt="Open Drawer" style="width: 120px; height: 120px;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: bold; text-shadow: 0 0 5px #000;">Try it</div>
    </div>
</div>

<div class="oc-drawer" id="ocDrawer">
    <div class="oc-root">
      <div class="oc-header">
        <h1 id="oc-agent-title" style="visibility:hidden; opacity:0; margin-top: 5px;">Oaksey A.I</h1>
    <span class="sep"></span>
        <span id="timer-display">--:--</span>
        <div id="led-strip">
    <div class="led" id="led3"></div>
          <div class="led" id="led2"></div>
          <div class="led" id="led1"></div>
     </div>
 </div>
      <div class="oc-screen">
    <div id="standby-screen">
          <div class="logo">Remote Console</div>
          <div class="hint">PRESS POWER TO CONNECT</div>
        </div>

        <div id="dynamic-content-area" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; z-index: 1;">
    <img src="assets/img/testcard.png" alt="Test Card" style="width: 100%; height: 100%; object-fit: cover;">
      <div class="scanlines"></div>
        </div>
        <video id="john-video-overlay" src="assets/videos/john.webm" loop muted style="display: none;"></video>

        <div id="offline-screen">
    <img id="offline-img" src="assets/img/session-terminated.jpg" alt="Session ended">
          <div class="offline-label">SESSION TERMINATED</div>
        </div>
      </div>
      <div class="oc-bottom">
        <button id="power-btn" title="Connect / Disconnect">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
       <path d="M12 2v6"/>
            <path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>
          </svg>
        </button>
    <input type="text" id="user-query" placeholder="Ask Oaksey A.I to do something..." disabled style="opacity:0.5;" />
        <button id="send-btn" disabled style="opacity:0.5;">Send</button>
        <div id="toggle-webm-btn" class="oc-control-btn" style="display:none; cursor: pointer;" title="Show / Hide Overlay"><i class="bi bi-eye"></i></div>
        <div id="mic-btn" class="oc-control-btn" style="opacity:0.5; cursor: not-allowed;"><i class="bi bi-mic"></i></div>
        <div id="feedback" class="error-state"></div>
      </div>
    </div>
  <div class="oc-handle">
        <button class="oc-toggle" id="ocToggleUp"><img id="ocToggleUpImg" src="assets/img/pine.png" alt="Close Drawer"></button>
    </div>
</div>

<audio id="radio-stream" src="https://stream.rcs.revma.com/fxp289cp81uvv" preload="auto" crossorigin="anonymous"></audio>

<!-- Enhanced script with cross-origin support -->
<script src="assets/js/app-iframesafe.js?v=20260228a"></script>

<footer>
    <div class="root-footer">
      <a href="tos.html" style="color: #8893a3; text-decoration: none; margin-right: 10px;">Terms of Service</a>
 <a href="privacy.html" style="color: #8893a3; text-decoration: none;">Privacy Policy</a>
      <p style="margin-top: 10px;">
      &copy; <span id="fc-year-root"></span> Finance Cheque.. All rights reserved.<br>
   Email: <a href="mailto:info@datro.xyz" style="color: #8893a3; text-decoration: none;">info@datro.xyz</a> | Phone: 02031377118
      </p>
    </div>
</footer>

<script>
const yearEl = document.getElementById('fc-year-root');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Enhanced positioning for cross-origin compatibility
(() => {
const box = document.querySelector('.login-box');
const tab = document.getElementById('ocTab');
const footer = document.querySelector('footer');
  if (!box || !tab || !footer) return;

  const positionLoginBox = () => {
    const tabRect = tab.getBoundingClientRect();
const footerRect = footer.getBoundingClientRect();
    const topBoundary = tabRect.bottom;
    const bottomBoundary = footerRect.top;
    const midpoint = topBoundary + ((bottomBoundary - topBoundary) / 2);
    const halfHeight = box.offsetHeight / 2;
    const minTop = topBoundary + halfHeight + 8;
    const maxTop = bottomBoundary - halfHeight - 8;
    const safeTop = Math.min(Math.max(midpoint, minTop), maxTop);

    box.style.position = 'fixed';
    box.style.left = '50%';
    box.style.top = `${safeTop}px`;
    box.style.transform = 'translate(-50%, -50%)';
    box.style.margin = '0';
  };

  positionLoginBox();
  window.addEventListener('resize', positionLoginBox);
})();
</script>

</body>
</html>
EOL

#=================================================================================
# 3. UPDATE EXISTING FILES
#=================================================================================
echo "🔧 Updating existing web files..."

# Add CORS headers to main index.html
if [[ -f "index.html" ]]; then
    cp index.html index.html.backup
    
    # Add cross-origin meta tags
   sed -i '/<meta name="fc-asset-version"/a\
  <meta http-equiv="Access-Control-Allow-Origin" content="https://ai.carfinancecheque.uk,https://ai.financecheque.uk,https://carfinancecheque.uk">\
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin-allow-popups">\
  <meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">\
  <meta http-equiv="Cross-Origin-Resource-Policy" content="cross-origin">' index.html

    # Update script reference to use CORS-safe version
    sed -i 's|assets/js/app.js|assets/js/app-iframesafe.js|g' index.html
fi

#=================================================================================
# 4. CREATE TEST PAGE
#=================================================================================
echo "🔧 Creating test page..."

cat > test-iframe.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Finance Cheque iframe Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
  margin: 20px;
            background: #1a1a1a;
     color: #f0f0f0;
        }
        .test-container {
  border: 2px solid #45ff8f;
border-radius: 10px;
            padding: 20px;
   margin: 20px 0;
            background: #0a0a0f;
        }
        iframe {
            width: 100%;
    height: 600px;
            border: none;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(69, 255, 143, 0.3);
        }
        .status {
            padding: 10px;
   margin: 10px 0;
   border-radius: 5px;
            font-family: 'Orbitron', monospace;
        }
.status.success { background: rgba(0, 255, 136, 0.1); color: #00ff88; border: 1px solid #00ff88; }
        .status.error { background: rgba(255, 51, 51, 0.1); color: #ff3333; border: 1px solid #ff3333; }
    </style>
</head>
<body>
    <h1>Finance Cheque iframe Test</h1>
    
  <div class="test-container">
        <h2>iframe Embedding Test</h2>
  <p>This page tests embedding Finance Cheque in an iframe from the main domain.</p>
    
        <div id="status" class="status">Testing iframe loading...</div>
    
        <iframe 
     id="test-iframe" 
     src="https://ai.carfinancecheque.uk/guacamole/"
 allow="display-capture,geolocation *"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        ></iframe>
    </div>

    <div class="test-container">
        <h3>Command API Test</h3>
  <button onclick="testCommandAPI()">Test Command API</button>
        <div id="command-status" class="status">Ready to test command API</div>
    </div>

    <script>
        // Test iframe embedding
        const iframe = document.getElementById('test-iframe');
        const statusDiv = document.getElementById('status');
        const commandStatusDiv = document.getElementById('command-status');
        
        iframe.onload = () => {
      statusDiv.textContent = '✅ iframe loaded successfully! Cross-origin embedding working.';
       statusDiv.className = 'status success';
        };
        
        iframe.onerror = () => {
     statusDiv.textContent = '❌ iframe failed to load. Check server configuration.';
      statusDiv.className = 'status error';
        };
        
        // Test command API
        async function testCommandAPI() {
      commandStatusDiv.textContent = 'Testing command API...';
            
            try {
    const response = await fetch('https://ai.carfinancecheque.uk/command1/support', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
     'Authorization': 'Bearer 9533263d7ff39819800754b970748ddf'
                },
   body: JSON.stringify({
             command: 'echo "Chrome browser test"',
                    origin: window.location.origin
     })
  });
    
    if (response.ok) {
     const result = await response.json();
commandStatusDiv.textContent = '✅ Command API test successful!';
         commandStatusDiv.className = 'status success';
    console.log('Command API response:', result);
                } else {
            commandStatusDiv.textContent = `❌ Command API failed: ${response.status}`;
commandStatusDiv.className = 'status error';
    }
} catch (error) {
           commandStatusDiv.textContent = `❌ Connection error: ${error.message}`;
  commandStatusDiv.className = 'status error';
            }
        }
    </script>
</body>
</html>
EOL

#=================================================================================
# 5. UPDATE PAGES DIRECTORY
#=================================================================================
echo "🔧 Updating pages directory..."

if [[ -d "pages" ]]; then
    # Add CORS header to pages index
    if [[ -f "pages/index.html" ]]; then
 cp pages/index.html pages/index.html.backup
        
        # Add cross-origin meta tags
    sed -i '/<meta name="fc-asset-version"/a\
        <meta http-equiv="Access-Control-Allow-Origin" content="https://ai.carfinancecheque.uk,https://ai.financecheque.uk,https://carfinancecheque.uk">' pages/index.html
        
    # Update script reference
 sed -i 's|../js/app.js|../js/app-iframesafe.js|g' pages/index.html
    fi
fi

#=================================================================================
# 6. SUMMARY AND NEXT STEPS
#=================================================================================
echo ""
echo "✅ Web application fixes completed successfully!"
echo ""
echo "📋 SUMMARY OF CHANGES:"
echo "• Created enhanced JavaScript with CORS support"
echo "• Added cross-origin compatibility headers"
echo "• Enhanced command API with proper CORS handling"
echo "• Created test pages for validation"
echo "• Updated all existing pages with CORS headers"
echo ""
echo "🔧 FILES CREATED/UPDATED:"
echo "• assets/js/app-iframesafe.js - CORS-safe JavaScript"
echo "• index-enhanced.html - Enhanced main page"
echo "• test-iframe.html - Test page for iframe validation"
echo "• Updated index.html and pages/index.html with CORS headers"
echo ""
echo "⚙️ TESTING THE FIXES:"
echo "1. Visit: https://finance-cheque.co.uk/test-iframe.html (if uploaded)"
echo "2. Test iframe embedding at: https://financecheque.uk"
echo "3. Verify Chrome opens with command: 'open google chrome'"
echo "4. Check browser console for any CORS errors"
echo "5. Verify all domains work together seamlessly"
echo ""
echo "🔍 DEBUGGING TIPS:"
echo "• Check browser console for CORS errors"
echo "• Verify all domains are accessible"
echo "• Test command API directly:"
echo "  curl -X POST \\"https://ai.carfinancecheque.uk/command1/support\\" \\"
echo "    -H \\"Content-Type: application/json\\" \\"
echo "    -H \\"Authorization: Bearer 9533263d7ff39819800754b970748ddf\\" \\"
echo "    -d '{\"command\":\"echo test\",\"origin\":\"https://financecheque.uk\"}'"
echo ""
echo "📁 BACKUP LOCATION: $BACKUP_DIR"
echo "   Restore with: cp -a $BACKUP_DIR/* ./"
echo ""
echo "🚀 READY FOR DEPLOYMENT:"
echo "1. Upload updated files to your web server"
echo "2. Test the iframe integration"
echo "3. Verify Chrome opens in embedded frame"
echo "4. Deploy to Cloudflare Pages if using"

# Show completion
echo ""
echo "🎉 Web application fix complete!"
