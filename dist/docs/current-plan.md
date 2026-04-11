# Implementation Plan: AWS Login Gate & App Routing Fix

## Date: 2026-04-04
## Status: PENDING APPROVAL

---

## STAGE 1: DIAGNOSE ACTUAL STATE ⚠️

### 1.1 Check Nginx Status
```bash
ssh -i ~/.ssh/paperclip-hermes-nvidia-key.pem ubuntu@13.135.142.244 "sudo systemctl status nginx"
```

**Expected:** nginx active/running
**If not running:** Need to start it

### 1.2 Test Current URLs
```bash
# From local machine
curl -I https://command.financecheque.uk/
curl -I https://command.financecheque.uk/paperclip/
curl -I https://command.financecheque.uk/links/
curl -I https://command.financecheque.uk/datro/static/gui/dashboard/003.html
```

**Document what each returns** - This is critical baseline

### 1.3 Check Nginx Config
```bash
# On AWS
cat /etc/nginx/sites-enabled/paperclip
nginx -t
```

---

## STAGE 2: CREATE COMPLETE NGINX CONFIG

### 2.1 Backup Current Config
```bash
# On AWS
sudo cp /etc/nginx/sites-enabled/paperclip /etc/nginx/sites-enabled/paperclip.backup.$(date +%Y%m%d%H%M%S)
```

### 2.2 Write Complete New Config
Location: `/etc/nginx/sites-available/paperclip`

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name command.financecheque.uk;

    ssl_certificate /etc/letsencrypt/live/command.financecheque.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/command.financecheque.uk/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # 1. AUTH ENDPOINT - validates passphrase, sets cookie
    location = /auth {
        set $valid 0;
        set $target "/";
        
        # Check passphrase
        if ($arg_passphrase = "cercacito") {
            set $valid 1;
        }
        
        # Get target from ?next= parameter
        if ($arg_next ~ ^(.+)$) {
            set $target $1;
        }
        
        # If valid, set cookie and redirect
        if ($valid = 1) {
            add_header Set-Cookie "cercacito_session=1; Path=/; Max-Age=86400; SameSite=Lax" always;
            return 302 $target;
        }
        
        # Invalid passphrase
        return 302 /login.html?error=invalid;
    }

    # 2. LOGIN PAGE - public, no auth needed
    location = /login.html {
        alias /var/www/html/login.html;
        index login.html;
    }

    # 3. DATRO GUI - NO AUTH REQUIRED
    location /datro/ {
        alias /var/www/html/gui/;
        try_files $uri $uri/ =404;
        # NO auth check here - public access
    }

    # 4. PAPERICLIP - AUTH REQUIRED
    location /paperclip/ {
        # Check auth cookie
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        # Redirect to login if not authenticated
        if ($needs_auth = 1) {
            return 302 /login.html?next=/paperclip/;
        }
        
        # Proxy to Paperclip
        proxy_pass http://127.0.0.1:3100/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 5. PAPERICLIP ASSETS
    location /paperclip/assets/ {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html?next=/paperclip/assets/;
        }
        
        proxy_pass http://127.0.0.1:3100/assets/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 6. PAPERICLIP API
    location /paperclip/api/ {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html?next=/paperclip/api/;
        }
        
        proxy_pass http://127.0.0.1:3100/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 7. LINKS - AUTH REQUIRED
    location /links/ {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html?next=/links/;
        }
        
        alias /var/www/html/links/;
        index index.html;
    }

    # 8. GUI - AUTH REQUIRED
    location /gui/ {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html?next=/gui/;
        }
        
        alias /var/www/html/gui/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # 9. ROOT - AUTH REQUIRED
    location = / {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html;
        }
        
        try_files $uri $uri/ =404;
    }

    # 10. CATCH-ALL - AUTH REQUIRED for any other URL
    location / {
        set $needs_auth 1;
        if ($http_cookie ~* "cercacito_session=1") {
            set $needs_auth 0;
        }
        
        if ($needs_auth = 1) {
            return 302 /login.html?next=$request_uri;
        }
        
        try_files $uri $uri/ =404;
    }
}
```

### 2.3 Fix SSL Permissions
```bash
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 644 /etc/letsencrypt/live/command.financecheque.uk/fullchain.pem
sudo chmod 640 /etc/letsencrypt/live/command.financecheque.uk/privkey.pem
sudo chown root:www-data /etc/letsencrypt/live/command.financecheque.uk/privkey.pem
```

### 2.4 Test and Restart
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## STAGE 3: FIX LOGIN PAGE

### 3.1 Read Current login.html
```bash
cat /var/www/html/login.html
```

### 3.2 Update with URL Memory Logic

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinanceChequeUK Command Centre</title>
    <style>
        /* Your existing CSS */
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <h1>FinanceChequeUK</h1>
                <p>Command Centre</p>
            </div>
            
            <form id="loginForm">
                <input type="hidden" id="nextInput" name="next" value="">
                <div class="form-group">
                    <label for="auth">Access Key</label>
                    <input type="password" id="auth" name="auth" placeholder="Enter your passphrase" required>
                </div>
                
                <button type="submit">Connect</button>
            </form>
        </div>
    </div>
    
    <script>
        // 1. SAVE URL BEFORE LOGIN
        (function() {
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next') || '/';
            
            // Only save if it's not the root and not already set
            if (next !== '/' && next !== '') {
                localStorage.setItem('login_redirect', next);
            }
            
            document.getElementById('nextInput').value = next;
        })();

        // 2. CHECK FOR POST-LOGIN REDIRECT
        (function() {
            const redirectUrl = localStorage.getItem('login_redirect');
            const hasAuth = document.cookie.includes('cercacito_session') || 
                            document.cookie.includes('cercacito=1');
            
            // If we have a stored redirect AND auth cookie, redirect now
            if (redirectUrl && hasAuth) {
                localStorage.removeItem('login_redirect');
                window.location.href = redirectUrl;
            }
        })();
        
        // 3. Handle form submission
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            // The form action already includes ?next= path
            // Let it submit normally
        });
    </script>
</body>
</html>
```

### 3.3 Deploy
```bash
# On AWS
sudo cp login.html /var/www/html/login.html
```

---

## STAGE 4: SERVICE PERSISTENCE

### 4.1 Create Paperclip Startup Script
```bash
# On AWS - create /home/ubuntu/start-paperclip.sh
#!/bin/bash
cd /home/ubuntu
nohup npx -y paperclipai run > paperclip.log 2>&1 &
echo "Paperclip started: $(date)" >> paperclip.log
```

### 4.2 Add to Startup
```bash
# Option A: Add to /etc/rc.local
sudo tee /etc/rc.local > /dev/null << 'EOF'
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multi-user runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#

# Start cloudflared
/usr/local/bin/cloudflared tunnel run --url localhost:80 hermes-client &

# Start Paperclip
su - ubuntu -c 'cd /home/ubuntu && nohup npx -y paperclipai run > /home/ubuntu/paperclip.log 2>&1 &'

exit 0
EOF

sudo chmod +x /etc/rc.local
```

### 4.3 Verify Both Auto-Start
```bash
# After reboot, SSH in and check:
ps aux | grep paperclipai
ps aux | grep cloudflared
sudo systemctl status nginx
```

---

## STAGE 5: DASHBOARD FIXES

### 5.1 Find Dashboard File
```bash
# On AWS
ls -la /var/www/html/gui/dashboard/
cat /var/www/html/gui/dashboard/003.html | head -100
```

### 5.2 Fix App Links
The getAppLink function needs correct paths:
- `/paperclip/` not `/paperclip`
- `/links/` not `/links`

### 5.3 Fix Icon Size
Standardize CSS for all app icons

### 5.4 Deploy
```bash
# Copy fixed file
cp 003.html /var/www/html/gui/dashboard/003.html
```

---

## STAGE 6: VERIFY

### 6.1 Fresh Browser Test (Critical!)
Open incognito window and test:
1. Go to https://command.financecheque.uk/paperclip/
2. Should see login page
3. Enter `cercacito`
4. Should redirect to Paperclip
5. Now go to https://command.financecheque.uk/links/
6. Should work WITHOUT re-login

### 6.2 Test Without Auth
1. Open NEW incognito window
2. Go to https://command.financecheque.uk/datro/static/gui/dashboard/003.html
3. Should load WITHOUT login

### 6.3 Reboot Test
1. Reboot AWS
2. Wait 2 minutes
3. Test all URLs again
4. Verify everything works

---

## SUCCESS CRITERIA

| Test | Expected Result |
|------|-----------------|
| /paperclip/ (no cookie) | 302 → login page |
| /links/ (no cookie) | 302 → login page |
| /datro/static/gui/dashboard/003.html (no cookie) | 200 OK |
| Enter cercacito at login | Redirect to original URL |
| After login, visit /links/ | Works, no re-login |
| After reboot | All services running |
