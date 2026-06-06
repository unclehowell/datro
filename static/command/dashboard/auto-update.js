const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'command.config.json');
const CHECK_INTERVAL = 60000;

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {}; }
}

async function checkUpdate() {
  const cfg = loadConfig();
  const owner = cfg.github_owner || process.env.GITHUB_OWNER || 'unclehowell';
  const repo = cfg.github_repo || process.env.GITHUB_REPO || 'datro';
  const branch = cfg.branch_ref || process.env.BRANCH_REF || 'command';
  const token = process.env.GITHUB_TOKEN || '';

  const headers = { 'User-Agent': 'command-auto-update', 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  https.get('https://api.github.com/repos/' + owner + '/' + repo + '/branches/' + encodeURIComponent(branch), { headers }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const info = JSON.parse(data);
        const latestSha = info.commit?.sha;
        if (!latestSha) return;
        const currentSha = cfg._last_sha || '';
        if (latestSha !== currentSha) {
          console.log('auto-update: new SHA detected (' + latestSha.slice(0, 8) + '), updating...');
          try {
            execSync('git fetch origin ' + branch, { cwd: __dirname, stdio: 'pipe' });
            execSync('git reset --hard origin/' + branch, { cwd: __dirname, stdio: 'pipe' });
            execSync('npm install --production', { cwd: __dirname, stdio: 'pipe' });
            cfg._last_sha = latestSha;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
            console.log('auto-update: updated to ' + latestSha.slice(0, 8) + ', restarting...');
            // Graceful restart handled by pm2
            process.exit(0);
          } catch (e) {
            console.error('auto-update: update failed:', e.message);
          }
        }
      } catch (e) {
        console.error('auto-update: parse error:', e.message);
      }
    });
  }).on('error', (e) => console.error('auto-update: fetch error:', e.message));
}

console.log('auto-update: watching ' + (loadConfig().github_repo || 'datro') + ' for changes every 60s');
checkUpdate();
setInterval(checkUpdate, CHECK_INTERVAL);