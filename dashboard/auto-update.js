const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const GITHUB_REPO = 'unclehowell/datro';
const BRANCH = 'cnei';
const DASHBOARD_DIR = __dirname;
const STORED_SHA_FILE = path.join(DASHBOARD_DIR, '.current-sha');
const LOG_FILE = '/tmp/dashboard-auto-update.log';
const TEMP_DIR = '/tmp/dashboard-update';
const POLL_INTERVAL = 60000; // 60 seconds

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    fs.appendFileSync(LOG_FILE, line + '\n');
    console.log(line);
}

function getStoredSha() {
    try {
        return fs.readFileSync(STORED_SHA_FILE, 'utf8').trim();
    } catch {
        return '';
    }
}

function storeSha(sha) {
    fs.writeFileSync(STORED_SHA_FILE, sha);
}

function fetchCneiSha() {
    return new Promise((resolve, reject) => {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/branches/${BRANCH}`;
        https.get(url, { headers: { 'User-Agent': 'dashboard-auto-update', 'Accept': 'application/vnd.github.v3+json' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.commit?.sha || '');
                } catch {
                    reject(new Error('Failed to parse GitHub response'));
                }
            });
        }).on('error', reject);
    });
}

function downloadAndValidate() {
    log('SHA changed. Starting staged update...');
    
    // Clean temp dir
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    
    // Download dashboard files from GitHub
    const tarballUrl = `https://api.github.com/repos/${GITHUB_REPO}/tarball/${BRANCH}`;
    execSync(`curl -sL "${tarballUrl}" -o /tmp/cnei-tarball.tar.gz`, { timeout: 30000 });
    execSync(`tar xzf /tmp/cnei-tarball.tar.gz -C "${TEMP_DIR}" --strip-components=1 '*/dashboard/' 2>/dev/null || tar xzf /tmp/cnei-tarball.tar.gz -C "${TEMP_DIR}"`, { timeout: 30000 });
    
    // Validate with node --check
    const serverPath = path.join(TEMP_DIR, 'dashboard', 'server.js');
    const altServerPath = path.join(TEMP_DIR, 'server.js');
    const targetServer = fs.existsSync(serverPath) ? serverPath : altServerPath;
    
    if (!fs.existsSync(targetServer)) {
        log('VALIDATION FAILED: server.js not found in downloaded archive');
        fs.rmSync(TEMP_DIR, { recursive: true });
        return false;
    }
    
    try {
        execSync(`node --check "${targetServer}"`, { timeout: 10000 });
        log('Validation passed');
    } catch (err) {
        log(`VALIDATION FAILED: ${err.message}`);
        fs.rmSync(TEMP_DIR, { recursive: true });
        return false;
    }
    
    // Swap files
    const sourceDir = fs.existsSync(path.join(TEMP_DIR, 'dashboard')) 
        ? path.join(TEMP_DIR, 'dashboard') 
        : TEMP_DIR;
    
    // Backup current
    const backupDir = '/tmp/dashboard-backup';
    if (fs.existsSync(backupDir)) fs.rmSync(backupDir, { recursive: true });
    execSync(`cp -r "${DASHBOARD_DIR}" "${backupDir}"`, { timeout: 10000 });
    
    // Copy new files (except node_modules)
    execSync(`rsync -av --exclude node_modules "${sourceDir}/" "${DASHBOARD_DIR}/"`, { timeout: 30000 });
    
    // npm install for any new deps
    try {
        execSync('npm install --production', { cwd: DASHBOARD_DIR, timeout: 60000 });
        log('npm install completed');
    } catch (err) {
        log(`npm install failed: ${err.message}. Rolling back...`);
        execSync(`cp -r "${backupDir}/" "${DASHBOARD_DIR}/"`, { timeout: 10000 });
        return false;
    }
    
    // Restart via pm2
    try {
        execSync('pm2 restart dashboard', { timeout: 10000 });
        log('Dashboard restarted via pm2');
    } catch {
        // If no pm2, just log — user can restart manually
        log('pm2 not found or restart failed. Manual restart may be needed.');
    }
    
    log('Update complete');
    return true;
}

async function check() {
    try {
        const sha = await fetchCneiSha();
        if (!sha) {
            log('Failed to fetch SHA (empty response)');
            return;
        }
        
        const stored = getStoredSha();
        if (sha !== stored) {
            log(`SHA changed: ${stored.substring(0, 7)} -> ${sha.substring(0, 7)}`);
            const success = downloadAndValidate();
            if (success) {
                storeSha(sha);
                log(`Stored new SHA: ${sha.substring(0, 7)}`);
            } else {
                log('Update failed — SHA not updated, will retry next poll');
            }
        }
    } catch (err) {
        log(`Check error: ${err.message}`);
    }
}

log('Auto-update daemon started');
log(`Polling ${GITHUB_REPO}/${BRANCH} every ${POLL_INTERVAL/1000}s`);
setInterval(check, POLL_INTERVAL);
check(); // Run immediately
