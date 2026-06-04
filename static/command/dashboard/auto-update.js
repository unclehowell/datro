const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const GITHUB_REPO = 'unclehowell/datro';
const BRANCH = 'cnei';
const REPO_PATH = path.join(process.env.HOME || '/home/unclehowell', 'datro');
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

function gitPullAndRestart() {
    log('SHA changed. Pulling from repo...');
    
    // Git pull cnei branch
    try {
        execSync(`git fetch origin ${BRANCH}`, { cwd: REPO_PATH, timeout: 15000 });
        execSync(`git checkout ${BRANCH}`, { cwd: REPO_PATH, timeout: 15000 });
        execSync(`git pull origin ${BRANCH}`, { cwd: REPO_PATH, timeout: 15000 });
        log('Git pull successful');
    } catch (err) {
        log(`Git pull failed: ${err.message}`);
        return false;
    }
    
    // Validate server.js
    const serverPath = path.join(DASHBOARD_DIR, 'server.js');
    try {
        execSync(`node --check "${serverPath}"`, { timeout: 10000 });
        log('Validation passed');
    } catch (err) {
        log(`VALIDATION FAILED: ${err.message}`);
        return false;
    }
    
    // Validate app.js syntax
    const appJsPath = path.join(DASHBOARD_DIR, 'public', 'app.js');
    try {
        execSync(`node --check "${appJsPath}"`, { timeout: 10000 });
        log('app.js validation passed');
    } catch (err) {
        log(`app.js VALIDATION FAILED: ${err.message}`);
        return false;
    }
    
    // npm install for any new deps
    try {
        execSync('npm install', { cwd: DASHBOARD_DIR, timeout: 60000 });
        log('npm install completed');
    } catch (err) {
        log(`npm install failed: ${err.message}`);
        return false;
    }
    
    // Restart via pm2
    try {
        execSync('pm2 restart flywheel-master-dashboard', { timeout: 10000 });
        log('Dashboard restarted');
    } catch {
        log('pm2 restart failed. Manual restart may be needed.');
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
            const success = gitPullAndRestart();
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
