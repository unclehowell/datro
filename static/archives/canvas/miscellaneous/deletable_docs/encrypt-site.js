#!/usr/bin/env node
// encrypt-site.js
// Usage: PASSPHRASE='your-pass' node encrypt-site.js path/to/site.html path/to/output/index.html

const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

function usageAndExit() {
  console.error('Usage: PASSPHRASE="your-pass" node encrypt-site.js path/to/site.html path/to/output/index.html');
  process.exit(2);
}

const [,, inPath, outPath, passArg] = process.argv;
if (!inPath || !outPath) usageAndExit();

const pass = process.env.PASSPHRASE || passArg;
if (!pass) {
  console.error('Error: passphrase not provided. Set PASSPHRASE env or pass as 3rd arg.');
  usageAndExit();
}

if (!fs.existsSync(inPath)) {
  console.error('Error: input file not found:', inPath);
  process.exit(3);
}

const siteHtml = fs.readFileSync(inPath, 'utf8');

// Encrypt using CryptoJS AES (compat across Node/browser)
const encrypted = CryptoJS.AES.encrypt(siteHtml, pass).toString();

// Build loader HTML. Use JSON.stringify to safely embed the ciphertext string.
const loaderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Encrypted Site - Unlock</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #00ff00;
      min-height: 100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    }
    #login-screen {
      max-width:600px;
      width:100%;
      background:#1a1a1a;
      border:2px solid #00ff00;
      padding:40px;
      box-shadow:0 0 30px rgba(0,255,0,0.3);
    }
    #login-screen h1 {
      color:#ff0000;
      text-align:center;
      margin-bottom:10px;
      font-size:24px;
      text-transform:uppercase;
      letter-spacing:3px;
    }
    #login-screen .classification {
      text-align:center;
      color:#ffff00;
      margin-bottom:30px;
      font-size:12px;
      letter-spacing:2px;
    }
    #login-screen .warning {
      background:#2a0000;
      border:1px solid #ff0000;
      padding:15px;
      margin-bottom:30px;
      font-size:11px;
      line-height:1.6;
    }
    #login-screen label {
      display:block;
      margin-bottom:10px;
      font-size:14px;
    }
    #login-screen input {
      width:100%;
      background:#000;
      border:1px solid #00ff00;
      color:#00ff00;
      padding:12px;
      font-family:'Courier New', monospace;
      font-size:14px;
      margin-bottom:20px;
    }
    #login-screen button {
      width:100%;
      background:#003300;
      border:2px solid #00ff00;
      color:#00ff00;
      padding:15px;
      font-family:'Courier New', monospace;
      font-size:16px;
      cursor:pointer;
      text-transform:uppercase;
      letter-spacing:2px;
      transition:all 0.25s;
    }
    #login-screen button:hover { background:#00ff00; color:#000; }
    .error {
      background:#2a0000;
      border:1px solid #ff0000;
      color:#ff0000;
      padding:10px;
      margin-bottom:20px;
      text-align:center;
      display:none;
    }
    .blink { animation: blink 1s infinite; }
    @keyframes blink {
      0%,50%,100% { opacity:1; } 25%,75% { opacity:0; }
    }
    #subbuttons { margin-top:12px; display:flex; gap:8px; }
    .smallbtn {
      flex:1;
      padding:10px;
      border-radius:6px;
      border:1px solid #004400;
      background:#001a00;
      color:#00ff00;
      cursor:pointer;
      font-family:'Courier New', monospace;
      font-size:13px;
    }
    .smallbtn:active { transform:translateY(1px); }
    #msg { margin-top:12px; color:#ff4444; text-align:center; min-height:18px; }
  </style>
</head>
<body>
  <div id="login-screen" role="main" aria-label="Passphrase entry">
    <h1>⚠ CLASSIFIED DOCUMENT ⚠</h1>
    <div class="classification">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>

    <div class="warning">
      <strong class="blink">▲ WARNING ▲</strong><br>
      This document contains sensitive content. Authorized passphrase required for access.
    </div>

    <div class="error" id="error-msg">✗ ACCESS DENIED - INVALID DECRYPTION KEY</div>

    <label for="passkey">ENTER DECRYPTION PASSPHRASE:</label>
    <input id="passkey" type="password" placeholder="Passphrase" maxlength="256" aria-label="Passphrase input" autofocus>

    <button id="decrypt">DECRYPT & ACCESS DOCUMENT</button>

    <div id="subbuttons">
      <button id="clear" class="smallbtn">Clear</button>
      <button id="help" class="smallbtn">Help</button>
    </div>

    <div id="msg" aria-live="polite"></div>
  </div>

  <!-- CryptoJS (for in-browser AES decrypt) -->
  <script src="https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js"></script>

  <script>
    // embedded ciphertext
    const ciphertext = ${JSON.stringify(encrypted)};

    const passInput = document.getElementById('passkey');
    const errBox = document.getElementById('error-msg');
    const msg = document.getElementById('msg');
    const decryptBtn = document.getElementById('decrypt');
    const clearBtn = document.getElementById('clear');
    const helpBtn = document.getElementById('help');

    function showError(text) {
      errBox.textContent = text;
      errBox.style.display = 'block';
      setTimeout(() => { errBox.style.display = 'none'; }, 3000);
    }

    function showMsg(text) {
      msg.textContent = text;
    }

    decryptBtn.addEventListener('click', () => {
      const pw = passInput.value;
      if (!pw) { showMsg('Enter passphrase'); return; }
      try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, pw);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          throw new Error('bad key or corrupted ciphertext');
        }
        // Replace document with decrypted HTML
        document.open();
        document.write(decrypted);
        document.close();
      } catch (e) {
        console.error(e);
        showError('✗ ACCESS DENIED - INVALID DECRYPTION KEY');
        showMsg(''); // clear other messages
      }
    });

    clearBtn.addEventListener('click', () => {
      passInput.value = '';
      showMsg('');
    });

    helpBtn.addEventListener('click', () => {
      showMsg('This site is encrypted. Enter the passphrase used when encrypting the original site.');
    });

    passInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') decryptBtn.click();
    });
  </script>
</body>
</html>
`;

const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outPath, loaderHtml, 'utf8');
console.log('✅ Created', outPath);
