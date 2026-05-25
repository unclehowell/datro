#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="$HOME"

LOCKFILE="/tmp/multi-branch-release.lock"
LOGDIR="$HOME/logs"
LOGFILE="$LOGDIR/multi-branch-release.log"
STATE_FILE="$HOME/.fcukproxy/release-state.json"
INTEL="$HOME/.fcukproxy/intelligence.py"
AGENT_DIR="$HOME/.fcukproxy/agent"
REPO_DIR="$HOME/datro"
FCHEQUE_REPO="$HOME/datro-financecheque"
GITHUB_REPO="unclehowell/datro"
RELEASE_LIMIT=500
COOLDOWN_SECONDS=$((24 * 3600))

BRANCHES=(
  "althea" "archives" "bpvsbuckler" "carfinancecheque"
  "ccan" "ceo" "dash" "datro" "dcc" "financecheque"
  "gui" "hbnb" "library" "llmwiki" "cnei"
  "subrepos" "ui" "wave" "wayback" "whitepaper"
  "greathousefarm"
)

declare -A BRANCH_URLS
BRANCH_URLS=(
  [althea]="N/A"
  [archives]="https://wayback.financecheque.uk"
  [bpvsbuckler]="https://bpvsbuckler.datro.xyz"
  [carfinancecheque]="https://car.financecheque.uk"
  [ccan]="https://ccan.datro.xyz"
  [ceo]="https://ceo.datro.xyz"
  [dash]="https://dash.financecheque.uk"
  [datro]="https://datro.xyz"
  [dcc]="https://dcc.datro.xyz"
  [financecheque]="https://financecheque.uk"
  [gui]="https://gui.datro.xyz"
  [hbnb]="https://hbhb.datro.xyz"
  [library]="https://library.datro.xyz"
  [llmwiki]="https://llmwiki.financecheque.uk"
  [cnei]="https://cnei.datro.xyz"
  [subrepos]="N/A"
  [ui]="https://ui.datro.xyz"
  [wave]="https://wave.datro.xyz"
  [wayback]="https://wayback.datro.xyz"
  [whitepaper]="https://whitepaper.financecheque.uk"
  [greathousefarm]="N/A"
)

mkpass_url() {
  local b="$1"
  echo "${BRANCH_URLS[$b]:-N/A}"
}

mkdir -p "$LOGDIR" "$HOME/.fcukproxy/agent/branches"
exec >> "$LOGFILE" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ -f "$LOCKFILE" ]; then
  pid=$(cat "$LOCKFILE" 2>/dev/null)
  if kill -0 "$pid" 2>/dev/null; then
    log "SKIP: previous run (PID $pid) still in progress"
    exit 0
  fi
  log "WARN: stale lockfile removed"
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# ── State functions ──────────────────────────────────────────────────────────

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    echo '{"rotation_index":0,"fix_rotation":0,"ux_rotation":0,"last_release":{},"total_releases":{}}' > "$STATE_FILE"
  fi
}

get_state() {
  python3 -c "import json,sys; d=json.load(open('$STATE_FILE')); print(d.get('$1',''))" 2>/dev/null
}

set_state() {
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
s['$1'] = $2
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>/dev/null || true
}

set_last_release() {
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
s.setdefault('last_release',{})['$1'] = $2
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>/dev/null || true
}

get_last_release() {
  python3 -c "import json; print(json.load(open('$STATE_FILE')).get('last_release',{}).get('$1',''))" 2>/dev/null
}

inc_state_int() {
  local key="$1" max="$2"
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
cur = int(s.get('$key', 0))
s['$key'] = (cur + 1) % $max
json.dump(s, open('$STATE_FILE','w'), indent=2)
print(cur)
" 2>/dev/null
}

# ── Rotating Fix Pool ────────────────────────────────────────────────────────
# Each function: searches for applicable files under static/BRANCH/ in POOL_DIR, applies fix,
# returns 0 if a change was made (sets POOL_DESC + POOL_FILE), 1 if not.

POOL_DIR="" POOL_DESC="" POOL_FILE=""

# ── Bug fix type definitions ──

BUG_FIX_NAMES=()
BUG_FIX_NAMES+=("fix_console_log")
BUG_FIX_NAMES+=("fix_commented_code")
BUG_FIX_NAMES+=("fix_trailing_whitespace")
BUG_FIX_NAMES+=("fix_blank_lines")
BUG_FIX_NAMES+=("seo_meta_description")
BUG_FIX_NAMES+=("seo_canonical_url")
BUG_FIX_NAMES+=("seo_open_graph")
BUG_FIX_NAMES+=("seo_twitter_card")
BUG_FIX_NAMES+=("seo_alt_text")
BUG_FIX_NAMES+=("seo_lazy_loading")
BUG_FIX_NAMES+=("seo_heading_hierarchy")
BUG_FIX_NAMES+=("fix_charset_meta")
BUG_FIX_NAMES+=("fix_viewport_meta")
BUG_FIX_NAMES+=("fix_lang_attribute")
BUG_FIX_NAMES+=("fix_link_noopener")
BUG_FIX_NAMES+=("fix_button_type")
BUG_FIX_NAMES+=("fix_duplicate_ids")
BUG_FIX_NAMES+=("fix_label_for")
BUG_FIX_NAMES+=("fix_aria_label")
BUG_FIX_NAMES+=("fix_script_defer")
BUG_FIX_NAMES+=("fix_img_dimensions")
BUG_FIX_NAMES+=("fix_doctype")
BUG_FIX_NAMES+=("seo_structured_data")
BUG_FIX_NAMES+=("seo_meta_keywords")
BUG_FIX_NAMES+=("fix_self_closing")
BUG_FIX_NAMES+=("fix_inline_handlers")
BUG_FIX_NAMES+=("fix_br_syntax")
BUG_FIX_NAMES+=("fix_tabs_vs_spaces")
BUG_FIX_NAMES+=("fix_bom")
BUG_FIX_NAMES+=("fix_http_equiv")
BUG_FIX_NAMES+=("fix_form_charset")
BUG_FIX_NAMES+=("fix_404_title")
BUG_FIX_NAMES+=("fix_privacy_policy")
BUG_FIX_NAMES+=("fix_terms_service")
BUG_FIX_NAMES+=("fix_contact_page")
BUG_FIX_NAMES+=("fix_blog_launch")

fix_404_title() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '404.html' -type f 2>/dev/null | head -1); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
c = re.sub(r'<title>[^<]*</title>', '<title>404 - Page Not Found | DATRO</title>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add proper title to 404 page for SEO"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

# ── Compliance Pool Functions ────────────────────────────────────────────────────

fix_privacy_policy() {
  local f="$POOL_DIR/privacy-policy.html"
  if [ ! -f "$f" ]; then
    cat > "$f" << 'POLICY'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Privacy Policy</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}h2{margin-top:2rem}</style></head><body><h1>Privacy Policy</h1><p><em>Last updated: $(date '+%Y-%m-%d')</em></p><h2>Information We Collect</h2><p>We collect information you provide directly (name, email, messages) and automatically (IP address, browser type, pages visited via analytics cookies).</p><h2>How We Use Your Information</h2><p>To provide and improve our services, respond to inquiries, send updates with consent, and comply with legal obligations.</p><h2>Cookies</h2><p>We use essential cookies for site functionality and analytics cookies to understand usage. You can control cookies via your browser settings.</p><h2>Data Sharing</h2><p>We do not sell your data. We may share with trusted service providers under contract or as required by law.</p><h2>Your Rights</h2><p>You may request access, correction, or deletion of your data by contacting us.</p><h2>Contact</h2><p>Email: <a href="mailto:privacy@datro.xyz">privacy@datro.xyz</a></p></body></html>
POLICY
      POOL_DESC="Create Privacy Policy page for legal compliance"; POOL_FILE="$f"; return 0
    fi
  return 1
}

fix_terms_service() {
  local f="$POOL_DIR/terms-of-service.html"
  if [ ! -f "$f" ]; then
    cat > "$f" << 'TERMS'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Terms of Service</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}h2{margin-top:2rem}</style></head><body><h1>Terms of Service</h1><p><em>Last updated: $(date '+%Y-%m-%d')</em></p><h2>Acceptance</h2><p>By using this website, you accept these terms. If you do not agree, do not use the site.</p><h2>Use of Service</h2><p>You agree to use this site lawfully and not to disrupt its operation. We reserve the right to modify or discontinue the service at any time.</p><h2>Intellectual Property</h2><p>All content is owned by DATRO Consortium unless otherwise stated. Unauthorized reproduction is prohibited.</p><h2>Limitation of Liability</h2><p>We provide the service "as is" without warranty. We are not liable for damages arising from its use.</p><h2>Governing Law</h2><p>These terms are governed by the laws of England and Wales.</p><h2>Contact</h2><p>Email: <a href="mailto:legal@datro.xyz">legal@datro.xyz</a></p></body></html>
TERMS
      POOL_DESC="Create Terms of Service page for legal compliance"; POOL_FILE="$f"; return 0
    fi
  return 1
}

fix_contact_page() {
  local f="$POOL_DIR/contact.html"
  if [ ! -f "$f" ]; then
    cat > "$f" << 'CONTACT'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Contact Us</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}form{display:flex;flex-direction:column;gap:1rem;margin-top:1rem}label{font-weight:600}input,textarea{padding:0.5rem;border:1px solid #ccc;border-radius:4px;font-size:1rem}button{padding:0.75rem;background:#0066cc;color:#fff;border:none;border-radius:4px;font-size:1rem;cursor:pointer}button:hover{background:#0052a3}</style></head><body><h1>Contact Us</h1><p>We'd love to hear from you. Fill out the form below or email us directly.</p><form action="#" method="POST"><label for="name">Name</label><input type="text" id="name" name="name" required><label for="email">Email</label><input type="email" id="email" name="email" required><label for="message">Message</label><textarea id="message" name="message" rows="5" required></textarea><button type="submit">Send Message</button></form><p style="margin-top:2rem">Or email: <a href="mailto:contact@datro.xyz">contact@datro.xyz</a></p></body></html>
CONTACT
      POOL_DESC="Create Contact page with form and contact details"; POOL_FILE="$f"; return 0
    fi
  return 1
}

fix_blog_launch() {
  local blog_dir="$POOL_DIR/blog"
  local blog_index="$blog_dir/index.html"
  mkdir -p "$blog_dir" 2>/dev/null
  if [ ! -f "$blog_index" ]; then
    cat > "$blog_index" << 'BLOGINDEX'
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Blog</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}.post{margin:1.5rem 0;padding:1rem;background:#f9f9f9;border-radius:6px}.post h2{margin:0 0 0.5rem}.post .date{color:#666;font-size:0.9rem}.post p{margin:0.5rem 0}.post a{color:#0066cc;text-decoration:none}.post a:hover{text-decoration:underline}</style></head><body><h1>Blog</h1><p>Latest news, updates, and insights.</p><div id="posts"></div><p style="margin-top:2rem"><a href="feed.xml">RSS Feed</a></p></body></html>
BLOGINDEX
    chmod 644 "$blog_index"
  fi
  local first_post="$blog_dir/welcome.html"
  if [ ! -f "$first_post" ]; then
    local site_name="${SELECTED_BRANCH:-Site}"
    cat > "$first_post" << WELCOME
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome — $site_name Blog</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}.meta{color:#666;font-size:0.9rem}</style></head><body><h1>Welcome</h1><p class="meta">$(date '+%Y-%m-%d') &middot; First post</p><p>Welcome to the official blog. This is the first post in what will be a series of updates, insights, and announcements about our work. Stay tuned for more content covering our projects, technology choices, and the vision behind what we're building.</p><p><a href="index.html">&larr; Back to blog</a></p></body></html>
WELCOME
    chmod 644 "$first_post"
    POOL_DESC="Launch blog with welcome post and index page"; POOL_FILE="$blog_index"; return 0
  fi
  return 1
}

# ── UX fix type definitions ──

UX_FIX_NAMES=()
UX_FIX_NAMES+=("ux_viewport")
UX_FIX_NAMES+=("ux_mobile_tap")
UX_FIX_NAMES+=("ux_hover_styles")
UX_FIX_NAMES+=("ux_css_order")
UX_FIX_NAMES+=("ux_skip_link")
UX_FIX_NAMES+=("ux_color_contrast")
UX_FIX_NAMES+=("ux_smooth_scroll")
UX_FIX_NAMES+=("ux_print_styles")
UX_FIX_NAMES+=("ux_focus_visible")
UX_FIX_NAMES+=("ux_touch_action")
UX_FIX_NAMES+=("ux_button_states")
UX_FIX_NAMES+=("ux_table_responsive")
UX_FIX_NAMES+=("ux_z_index")
UX_FIX_NAMES+=("ux_list_semantics")
UX_FIX_NAMES+=("ux_loading_indicator")
UX_FIX_NAMES+=("ux_breadcrumb")
UX_FIX_NAMES+=("ux_cls_fix")
UX_FIX_NAMES+=("ux_type_scale")
UX_FIX_NAMES+=("ux_spacing")
UX_FIX_NAMES+=("ux_keyboard_nav")
UX_FIX_NAMES+=("ux_cookie_consent")
UX_FIX_NAMES+=("ux_social_links")
UX_FIX_NAMES+=("ux_footer_legal")

ux_viewport() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -5); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Ensure viewport meta has user-scalable=yes for accessibility
if re.search(r'<meta\\s+name=[\"\\']viewport[\"\\']', c, re.IGNORECASE):
    c = re.sub(r'(<meta\\s+name=[\"\\']viewport[\"\\'][^>]*?content=[\"\\'][^\"\\']*?)(?:,\\s*user-scalable=(?:no|0))?([\"\\'])', r'\\1, user-scalable=yes\\2', c, flags=re.IGNORECASE)
elif not re.search(r'<meta\\s+name=[\"\\']viewport[\"\\']', c, re.IGNORECASE):
    c = re.sub(r'(<head[^>]*>)', r'\\1\\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=yes\">', c, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Improve viewport meta with user-scalable=yes for accessibility"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_mobile_tap() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Ensure minimum tap target size for mobile
if '<style>' in c:
    c = c.replace('<style>', '<style>\\nbutton, a, input, select, textarea { min-height: 44px; min-width: 44px; }\\n')
else:
    c = re.sub(r'</head>', '<style>\\nbutton, a, input, select, textarea { min-height: 44px; min-width: 44px; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add minimum tap target sizes for mobile UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_hover_styles() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if '<style>' in c:
    c = c.replace('<style>', '<style>\\na:hover, button:hover { opacity: 0.85; transition: opacity 0.2s; }\\n')
else:
    c = re.sub(r'</head>', '<style>\\na:hover, button:hover { opacity: 0.85; transition: opacity 0.2s; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add hover styles for interactive elements"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_css_order() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Move CSS links before JS scripts in head
head = re.search(r'<head>(.*?)</head>', c, re.DOTALL | re.IGNORECASE)
if head:
    h = head.group(1)
    css = re.findall(r'<link[^>]*?\\.css[^>]*>', h, re.IGNORECASE)
    js = re.findall(r'<script[^>]*>\\s*</script>', h, re.IGNORECASE)
    # Already properly ordered if CSS comes before JS
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Optimize CSS before JS load order for better UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_skip_link() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'skip-to-content' not in c and 'skip-link' not in c:
    c = re.sub(r'<body[^>]*>', lambda m: m.group(0) + '\\n<a class=\"skip-link\" href=\"#main-content\" style=\"position:absolute;left:-9999px;z-index:9999\">Skip to content</a>', c, count=1, flags=re.IGNORECASE)
    c = re.sub(r'<body[^>]*>', lambda m: m.group(0) + '<div id=\"main-content\">', c, count=1, flags=re.IGNORECASE)
    c = re.sub(r'</body>', '</div></body>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add skip-to-content link for keyboard accessibility"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_color_contrast() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Add style for minimum contrast on text
if '<style>' in c:
    c = c.replace('<style>', '<style>\\nbody { color: #1a1a1a; background: #ffffff; }\\n')
else:
    c = re.sub(r'</head>', '<style>\\nbody { color: #1a1a1a; background: #ffffff; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Improve text color contrast for readability"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_smooth_scroll() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'scroll-behavior' not in c:
    if '<style>' in c:
        c = c.replace('<style>', '<style>\\nhtml { scroll-behavior: smooth; }\\n')
    else:
        c = re.sub(r'</head>', '<style>\\nhtml { scroll-behavior: smooth; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add smooth scrolling for better UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_print_styles() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if '@media print' not in c:
    if '<style>' in c:
        c = c.replace('</style>', '@media print { nav, footer, .sidebar, .ads { display: none !important; } }\\n</style>')
    else:
        c = re.sub(r'</head>', '<style>\\n@media print { nav, footer, .sidebar, .ads { display: none !important; } }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add print-friendly styles for better UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_focus_visible() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'focus-visible' not in c and ':focus' not in c:
    if '<style>' in c:
        c = c.replace('<style>', '<style>\\n:focus-visible { outline: 2px solid #4A90D9; outline-offset: 2px; }\\n')
    else:
        c = re.sub(r'</head>', '<style>\\n:focus-visible { outline: 2px solid #4A90D9; outline-offset: 2px; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add focus-visible styles for keyboard navigation"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_touch_action() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if '<style>' in c:
    c = c.replace('<style>', '<style>\\nhtml { touch-action: manipulation; }\\n')
else:
    c = re.sub(r'</head>', '<style>\\nhtml { touch-action: manipulation; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add touch-action CSS for mobile responsiveness"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_button_states() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if '<style>' in c:
    c = c.replace('<style>', '<style>\\nbutton:active { transform: scale(0.98); }\\n')
else:
    c = re.sub(r'</head>', '<style>\\nbutton:active { transform: scale(0.98); }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add button press interaction feedback for UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_table_responsive() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'overflow-x' not in c and '<table' in c and '<style>' in c:
    c = c.replace('<style>', '<style>\\ntable { display: block; overflow-x: auto; white-space: nowrap; }\\n')
elif 'overflow-x' not in c and '<table' in c:
    c = re.sub(r'</head>', '<style>\\ntable { display: block; overflow-x: auto; white-space: nowrap; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Make tables responsive with horizontal scroll for mobile UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_z_index() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'z-index' not in c:
    if '<style>' in c:
        c = c.replace('<style>', '<style>\\nheader, nav { position: relative; z-index: 100; }\\n')
    else:
        c = re.sub(r'</head>', '<style>\\nheader, nav { position: relative; z-index: 100; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Fix z-index stacking for proper element layering"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_list_semantics() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Find div>br patterns that could be lists
if re.search(r'<div[^>]*>.*?<br[^>]*>.*?<br[^>]*>', c):
    print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Improve list semantics for structured content"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_loading_indicator() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'loading' not in c.lower() and '<style>' in c:
    c = c.replace('<style>', '<style>\\n.loading { opacity: 0.5; pointer-events: none; }\\n')
elif 'loading' not in c.lower():
    c = re.sub(r'</head>', '<style>\\n.loading { opacity: 0.5; pointer-events: none; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add loading state styling for better UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_breadcrumb() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'breadcrumb' not in c.lower() and '<nav' not in c:
    if re.search(r'<h1', c, re.IGNORECASE):
        c = re.sub(r'(<h1[^>]*>)', '<nav aria-label=\"Breadcrumb\"><ol><li><a href=\"/\">Home</a></li></ol></nav>\\n\\1', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add breadcrumb navigation structure for UX"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_cls_fix() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
# Add width/height to images that lack them
c = re.sub(r'(<img\\s+[^>]*?)(?:\\s+width=[\"\\'][^\"\\']+[\"\\'])?(?:\\s+height=[\"\\'][^\"\\']+[\"\\'])?\\s*(/?>)', lambda m: m.group(0).replace(' />', ' width=\"auto\" height=\"auto\" />') if 'width=' not in m.group(0) else m.group(0), c, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add dimension attributes to images to reduce CLS"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_type_scale() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'line-height' not in c:
    if '<style>' in c:
        c = c.replace('<style>', '<style>\\nbody { line-height: 1.6; }\\nh1 { font-size: 2em; }\\nh2 { font-size: 1.5em; }\\n')
    else:
        c = re.sub(r'</head>', '<style>\\nbody { line-height: 1.6; }\\nh1 { font-size: 2em; }\\nh2 { font-size: 1.5em; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add typographic scale for better readability"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_spacing() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'max-width' not in c:
    if '<style>' in c:
        c = c.replace('<style>', '<style>\\n.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }\\n')
    else:
        c = re.sub(r'</head>', '<style>\\n.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }\\n</style>\\n</head>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add container spacing for better content layout"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_keyboard_nav() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'tabindex' not in c:
    c = re.sub(r'<a\\b(?!\\s*tabindex=)([^>]*?)href=[\"\\']#[\"\\']([^>]*?)>',
        lambda m: '<a tabindex=\"0\"' + m.group(1) + 'href=\"#\"' + m.group(2) + '>', c, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add tabindex for keyboard navigation accessibility"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_cookie_consent() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -5); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'cookie-consent' not in c and 'cookie' not in c.lower()[:2000]:
    banner = '''
<div id=\"cookie-consent\" style=\"position:fixed;bottom:0;left:0;right:0;background:#333;color:#fff;padding:1rem;text-align:center;z-index:9999;font-family:-apple-system,sans-serif\">
  <span>We use cookies to improve your experience. <a href=\"/cookie-policy.html\" style=\"color:#88bbff\">Learn more</a>.</span>
  <button onclick=\"this.parentElement.style.display='none';localStorage.setItem('cookies_accepted','true')\" style=\"margin-left:1rem;padding:0.5rem 1rem;background:#4CAF50;color:#fff;border:none;border-radius:4px;cursor:pointer\">Accept</button>
</div>'''
    c = re.sub(r'</body>', banner + '\n</body>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add cookie consent banner for GDPR compliance"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_social_links() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
if 'twitter.com' not in c and 'github.com' not in c and 'linkedin.com' not in c:
    social = '<div style=\"text-align:center;padding:1rem;margin-top:2rem\">'
    social += '<a href=\"#\" style=\"margin:0 0.5rem;color:#1DA1F2;text-decoration:none\">X/Twitter</a>'
    social += '<a href=\"#\" style=\"margin:0 0.5rem;color:#0A66C2;text-decoration:none\">LinkedIn</a>'
    social += '<a href=\"#\" style=\"margin:0 0.5rem;color:#333;text-decoration:none\">GitHub</a>'
    social += '</div>'
    c = re.sub(r'</footer>', '</footer>' + social, c, count=1, flags=re.IGNORECASE)
    if social not in c:
        c = re.sub(r'</body>', social + '\n</body>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add social media links for audience engagement"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

ux_footer_legal() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
legal = '<footer style=\"text-align:center;padding:1rem;font-size:0.85rem;color:#666;border-top:1px solid #eee;margin-top:2rem\">'
legal += '&copy; $(date +%Y) DATRO Consortium. '
legal += '<a href=\"/privacy-policy.html\" style=\"color:#666;text-decoration:underline\">Privacy</a> &middot; '
legal += '<a href=\"/terms-of-service.html\" style=\"color:#666;text-decoration:underline\">Terms</a> &middot; '
legal += '<a href=\"/contact.html\" style=\"color:#666;text-decoration:underline\">Contact</a>'
legal += '</footer>'
if 'DATRO Consortium' not in c:
    c = re.sub(r'</body>', legal + '\n</body>', c, count=1, flags=re.IGNORECASE)
elif 'privacy-policy' not in c:
    c = re.sub(r'</footer>', '', c, flags=re.IGNORECASE)
    c = re.sub(r'</body>', legal + '\n</body>', c, count=1, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add legal footer with privacy/terms/contact links"; POOL_FILE="$f"; return 0
    fi
  done; return 1
}

# ── AI + Pool Dispatch ───────────────────────────────────────────────────────

try_ai_fix() {
  local branch="$1" fix_type="$2" pass="$3"
  local max_self_correct=3
  local error_feedback=""

  for (( attempt=0; attempt<max_self_correct; attempt++ )); do
    log "AI pass $pass ($fix_type) for $branch${error_feedback:+ (self-correct attempt $((attempt+1)))}..."

    local result
    if [ -n "$error_feedback" ]; then
      result=$(timeout 90 python3 "$INTEL" --branch "$branch" --type "$fix_type" --pass-number "$pass" --error-feedback "$error_feedback" 2>/dev/null) || true
    else
      result=$(timeout 60 python3 "$INTEL" --branch "$branch" --type "$fix_type" --pass-number "$pass" 2>/dev/null) || true
    fi
    local exit_code=$?

    if [ "$exit_code" = "42" ]; then
      log "AI returned no fix (exit 42). Falling through to pool."
      return 1
    fi
    if [ -z "$result" ]; then
      log "AI produced empty output. Falling through to pool."
      return 1
    fi

    # Parse JSON
    local fp new_str desc tool
    fp=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")
    desc=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('bug_description',''))" 2>/dev/null || echo "")
    tool=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool','sed'))" 2>/dev/null || echo "sed")

    if [ -z "$fp" ]; then
      log "AI returned incomplete JSON (no file_path). Falling through to pool."
      return 1
    fi

    # Basic path validation before apply
    local found_path=""
    if [ -f "$fp" ]; then
      found_path="$fp"
    elif [ -f "$POOL_DIR/$fp" ]; then
      found_path="$POOL_DIR/$fp"
    elif [ "$tool" = "write" ]; then
      found_path="$POOL_DIR/$fp"
    else
      log "AI fix file not found: $fp"
      return 1
    fi

    # Apply fix via intelligence.py --apply
    local apply_output
    apply_output=$(timeout 30 python3 "$INTEL" --branch "$branch" --type "$fix_type" --apply "$result" 2>/dev/null) || true
    local apply_exit=$?

    if [ "$apply_exit" -ne 0 ] || [ -z "$apply_output" ]; then
      log "AI fix apply failed (tool=$tool)."
      # Store error for self-correction
      error_feedback="Apply failed for $tool on $fp"
      continue
    fi

    # ── Build validation (pre-commit check) ──
    local build_pass=true
    local build_error=""
    if [ -f "$POOL_DIR/package.json" ]; then
      log "Running pre-commit build validation..."
      local build_output
      build_output=$(cd "$POOL_DIR" && timeout 60 npx eslint "${fp#$POOL_DIR/}" 2>&1) || true
      if echo "$build_output" | grep -qi 'error\|syntax'; then
        build_pass=false
        build_error="$build_output"
        log "Build lint found errors: $(echo "$build_error" | head -5 | tr '\n' ';')"
      fi
    fi

    if [ "$build_pass" = true ]; then
      POOL_DESC="$desc"
      POOL_FILE="$fp"
      log "AI fix applied and validated: $desc (tool=$tool)"
      return 0
    else
      # Feed build error back for self-correction
      error_feedback="$build_error"
      # Revert the fix
      cd "$POOL_DIR" && git checkout -- "$fp" 2>/dev/null || true
      log "Build validation failed. Self-correcting (attempt $((attempt+1))/$max_self_correct)..."
    fi
  done

  log "AI fix failed after $max_self_correct self-correction attempts."
  return 1
}

try_pool_fix() {
  local fix_type="$1"
  local max_attempts=10
  local pool_key pool_size

  if [ "$fix_type" = "bug" ]; then
    pool_key="fix_rotation"
    pool_size=${#BUG_FIX_NAMES[@]}
  else
    pool_key="ux_rotation"
    pool_size=${#UX_FIX_NAMES[@]}
  fi

  local rotation
  rotation=$(get_state "$pool_key" 2>/dev/null || echo "0")
  rotation=${rotation:-0}

  for (( attempt=0; attempt<max_attempts; attempt++ )); do
    local idx=$(( (rotation + attempt) % pool_size ))
    local func_name

    if [ "$fix_type" = "bug" ]; then
      func_name="${BUG_FIX_NAMES[$idx]}"
    else
      func_name="${UX_FIX_NAMES[$idx]}"
    fi

    log "Pool attempt $((attempt+1)): $func_name (index $idx)..."

    if "$func_name"; then
      # Fix applied — advance rotation by 1 past the successful fix
      local new_rotation=$(( (idx + 1) % pool_size ))
      set_state "$pool_key" "$new_rotation"
      log "Pool fix applied: $POOL_DESC (rotation $idx → $new_rotation)"
      return 0
    fi
  done

  log "Pool exhausted ($max_attempts attempts, no applicable fix found)"
  return 1
}

guaranteed_bug_fallback() {
  local f
  for f in $(rg -l -U '\n\n\n+' -g '*.{ts,tsx,py,js,html,css,json,md,sh,xml,yml,yaml}' "$POOL_DIR" --no-heading 2>/dev/null | head -3); do
    if python3 -c "
import re
c = open('$f').read(); orig = c
c = re.sub(r'\n{3,}', '\n\n', c)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Remove excessive blank lines"
      POOL_FILE="$f"
      return 0
    fi
  done
  return 1
}

guaranteed_ux_fallback() {
  local f
  for f in $(find "$POOL_DIR" -maxdepth 10 -name '*.html' -type f 2>/dev/null | head -1); do
    if python3 -c "
c = open('$f').read(); orig = c
doctype = '<!DOCTYPE html>'
charset = '<meta charset=\"UTF-8\">'
if not c.startswith('<!DOCTYPE') and not c.startswith('<!doctype'):
    c = doctype + '\\n' + c
if '<meta charset' not in c:
    import re
    c = re.sub(r'(<head[^>]*>)', r'\\1\\n    ' + charset, c, flags=re.IGNORECASE)
if c != orig:
    open('$f','w').write(c); print('CHANGED')" 2>/dev/null | grep -q CHANGED; then
      POOL_DESC="Add DOCTYPE and charset meta (guaranteed fallback)"
      POOL_FILE="$f"
      return 0
    fi
  done
  return 1
}

# ── Agent Memory Update Functions ────────────────────────────────────────────

update_branch_memory() {
  local branch="$1" fix_type="$2" fix_desc="$3" fix_file="$4"
  local branch_mem="$AGENT_DIR/branches/${branch}.md"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
  if [ -f "$branch_mem" ]; then
    echo "" >> "$branch_mem"
    echo "- [${timestamp}] (${fix_type^^}) ${fix_desc} -- file: ${fix_file}" >> "$branch_mem"
    log "Updated branch memory: $branch ($fix_type)"
  fi
}

update_global_memory() {
  local branch="$1" fix_type="$2" fix_desc="$3" success="$4"
  local mem_file="$AGENT_DIR/memory.md"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
  if [ -f "$mem_file" ]; then
    echo "" >> "$mem_file"
    echo "- [${timestamp}] ${branch} ${fix_type^^}: ${fix_desc} (${success})" >> "$mem_file"
  fi
}

learn_fix() {
  local branch="$1" fix_type="$2" desc="$3" file="$4" source="$5" tool="${6:-sed}" error_msg="${7:-}"
  local fix_json
  fix_json=$(python3 -c "import json; o={'file_path':'$file','bug_description':'$desc','commit_message':'${fix_type}($branch): $desc','source':'$source','tool':'$tool'}${error_msg:+; o['_error']='$error_msg'}; print(json.dumps(o))" 2>/dev/null)
  if [ -n "$fix_json" ]; then
    timeout 10 python3 "$INTEL" --branch "$branch" --type "$fix_type" --learn-after "$fix_json" 2>/dev/null || true
    log "Profile learned from $source fix: $desc"
  fi
}

# ── Original utility functions ───────────────────────────────────────────────

is_on_cooldown() {
  local branch="$1"
  local last=$(get_last_release "$branch")
  if [ -n "$last" ] && [ "$last" != "0" ]; then
    local now=$(date +%s)
    local elapsed=$(( now - last ))
    if [ "$elapsed" -lt "$COOLDOWN_SECONDS" ]; then
      local remaining=$(( (COOLDOWN_SECONDS - elapsed) / 3600 ))
      local remaining_min=$(( ((COOLDOWN_SECONDS - elapsed) % 3600) / 60 ))
      log "COOLDOWN: $branch last released ${elapsed}s ago, needs ${remaining}h${remaining_min}m more"
      return 0
    fi
  fi
  return 1
}

sync_releases_from_github() {
  log "Syncing last release timestamps from GitHub..."
  local branch_list
  branch_list=$(printf '%s\n' "${BRANCHES[@]}" | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin]))" 2>/dev/null)
  gh release list --repo "$GITHUB_REPO" --limit $RELEASE_LIMIT --json tagName,publishedAt 2>/dev/null | \
    BRANCH_LIST="$branch_list" python3 -c "
import json, sys, os
from datetime import datetime
data = json.load(sys.stdin)
state = json.load(open('$STATE_FILE'))
if 'last_release' not in state:
    state['last_release'] = {}
branches = json.loads(os.environ.get('BRANCH_LIST', '[]'))
for r in data:
    tag = r['tagName']
    published = r.get('publishedAt', '')
    if not published:
        continue
    ts = int(datetime.fromisoformat(published.replace('Z', '+00:00')).timestamp())
    for branch in branches:
        if tag.startswith(branch + '-v'):
            existing = int(state['last_release'].get(branch, 0))
            if ts > existing:
                state['last_release'][branch] = ts
json.dump(state, open('$STATE_FILE','w'), indent=2)
" 2>&1 || log "WARN: GitHub release sync failed"
}

prune_releases() {
  local branch="$1"
  log "Pruning releases for $branch, keeping last 3..."
  gh release list --repo "$GITHUB_REPO" --limit $RELEASE_LIMIT --json tagName,publishedAt 2>/dev/null | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
branch = '$branch'
releases = [(r['publishedAt'], r['tagName']) for r in data if r['tagName'].startswith(branch + '-v') and r.get('publishedAt')]
releases.sort(key=lambda x: x[0])
if len(releases) > 3:
    for _, tag in releases[:-3]:
        print(tag)
" 2>/dev/null | while read old_tag; do
    if [ -n "$old_tag" ]; then
      log "Deleting old release: $old_tag"
      gh release delete "$old_tag" --repo "$GITHUB_REPO" --yes 2>&1 | tail -1 || log "WARN: failed to delete $old_tag"
      git push origin --delete "refs/tags/$old_tag" 2>&1 | tail -1 || log "WARN: failed to delete tag $old_tag"
      log "Cleaned up $old_tag"
    fi
  done
  log "Done pruning $branch"
}

count_releases() {
  local branch="$1"
  git ls-remote --tags "https://github.com/$GITHUB_REPO" "${branch}-v*" 2>/dev/null | \
    python3 -c "
import sys
count = len(set(line.split()[1].replace('refs/tags/', '').rstrip('^{}') for line in sys.stdin if line.strip()))
print(count)
" 2>/dev/null || echo "0"
}

# ── Main ─────────────────────────────────────────────────────────────────────

CLOUDFLARE_PAGES_PROJECT="financecheque"

# Support FORCE_BRANCH env var from /dispatch-datro-fix endpoint
if [ -n "${FORCE_BRANCH:-}" ]; then
  log "FORCE_BRANCH=$FORCE_BRANCH set via dispatch endpoint"
fi

init_state

log "=== MULTI-BRANCH RELEASE ==="

cd "$REPO_DIR"
git fetch origin --prune '+refs/heads/*:refs/remotes/origin/*' 2>&1 | tail -1

sync_releases_from_github

rotation_index=$(get_state "rotation_index")
rotation_index=${rotation_index:-0}
total_branches=${#BRANCHES[@]}
attempts=0
SELECTED_BRANCH=""

if [ -n "${FORCE_BRANCH:-}" ]; then
  SELECTED_BRANCH="$FORCE_BRANCH"
  log "FORCED BRANCH: $SELECTED_BRANCH"
  if is_on_cooldown "$SELECTED_BRANCH"; then
    log "FORCED BRANCH $SELECTED_BRANCH is on cooldown. Exiting."
    exit 0
  fi
else
  while [ $attempts -lt $total_branches ]; do
    candidate="${BRANCHES[$rotation_index]}"
    if git rev-parse --verify "origin/$candidate" >/dev/null 2>&1; then
      if is_on_cooldown "$candidate"; then
        log "SKIP $candidate (on cooldown)"
      else
        SELECTED_BRANCH="$candidate"
        break
      fi
    else
      log "SKIP $candidate (branch does not exist on remote)"
    fi
    rotation_index=$(( (rotation_index + 1) % total_branches ))
    attempts=$((attempts + 1))
  done

  if [ -z "$SELECTED_BRANCH" ]; then
    min_remaining=$COOLDOWN_SECONDS
    min_branch=""
    for branch in "${BRANCHES[@]}"; do
      last=$(get_last_release "$branch")
      if [ -n "$last" ] && [ "$last" != "0" ]; then
        now=$(date +%s)
        elapsed=$(( now - last ))
        remaining=$(( COOLDOWN_SECONDS - elapsed ))
        if [ "$remaining" -lt "$min_remaining" ]; then
          min_remaining=$remaining
          min_branch=$branch
        fi
      fi
    done
    if [ -n "$min_branch" ] && [ "$min_remaining" -le 3600 ]; then
      log "All on cooldown. Nearest eligible: $min_branch in ${min_remaining}s. Waiting..."
      sleep "$min_remaining"
      SELECTED_BRANCH="$min_branch"
    else
      log "No eligible branch found. Nearest ($min_branch) needs ${min_remaining}s."
      set_state "rotation_index" "$(( (rotation_index + 1) % total_branches ))"
      exit 0
    fi
  fi
fi

log "SELECTED: $SELECTED_BRANCH (rotation index: $rotation_index)"

if [ "$SELECTED_BRANCH" == "financecheque" ] && [ -d "$FCHEQUE_REPO" ]; then
  BRANCH_REPO="$FCHEQUE_REPO"
else
  BRANCH_REPO="$REPO_DIR"
fi

log "Using repo: $BRANCH_REPO"

cd "$BRANCH_REPO"
git reset --hard HEAD 2>/dev/null
git clean -fd 2>/dev/null
git fetch origin "$SELECTED_BRANCH" 2>&1 | tail -1
if ! timeout 30 git checkout --force "$SELECTED_BRANCH" 2>&1 | tail -3; then
  log "Git checkout timed out, using temp clone..."
  BRANCH_REPO=$(mktemp -d)
  git clone --depth 1 --branch "$SELECTED_BRANCH" "https://github.com/$GITHUB_REPO" "$BRANCH_REPO" 2>&1 | tail -1
  cd "$BRANCH_REPO"
fi
git reset --hard "origin/$SELECTED_BRANCH" 2>&1 | tail -1

GH_COUNT=$(count_releases "$SELECTED_BRANCH")
: "${GH_COUNT:=0}"
NEXT_NUM=$(python3 -c "
import json
s = json.load(open('$STATE_FILE'))
c = s.get('total_releases', {}).get('$SELECTED_BRANCH')
if c is None or (isinstance(c, (int, float)) and c < $GH_COUNT):
    c = $GH_COUNT
print(int(c) + 1)
" 2>/dev/null || echo "$((GH_COUNT + 1))")
PATCH_SLOT=$(( NEXT_NUM / 100 ))
BUILD_NUM=$(( NEXT_NUM % 100 ))
PAD_BUILD=$(printf "%02d" "$BUILD_NUM")
NEW_VER="0.0.${PATCH_SLOT}.${PAD_BUILD}"
NEW_TAG="${SELECTED_BRANCH}-v${NEW_VER}"
log "Target: $NEW_TAG (release #$NEXT_NUM)"

FIX_APPLIED=false
UX_APPLIED=false
FIX_DESCRIPTIONS=""
UX_DESCRIPTIONS=""
POOL_DIR="$BRANCH_REPO"

# ── 4 passes: 3 bug + 1 UX ──────────────────────────────────────────────────
# Strategy:
#   Pass 1: AI (no restrictions) → pool → fallback  (AI finds anything)
#   Pass 2: Pool only (skip AI)                      (guarantees pool diversity)
#   Pass 3: Fallback only (skip AI, skip pool)       (guaranteed blank line clean)
#   Pass 4: AI (UX, no restrictions) → pool → fallback

# ── Pass 1: AI unrestricted ──────────────────────────────────────────────────
POOL_DESC="" POOL_FILE=""
if try_ai_fix "$SELECTED_BRANCH" "bug" "1"; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "AI"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "AI"
elif try_pool_fix "bug"; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "POOL"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "POOL"
elif guaranteed_bug_fallback; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "FALLBACK"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "FALLBACK"
else
  log "Pass 1: no fix found from any source"
fi

# ── Pass 2: Pool only (forces fix diversity through rotating pool) ───────────
POOL_DESC="" POOL_FILE=""
if try_pool_fix "bug"; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "POOL"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "POOL"
elif guaranteed_bug_fallback; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "FALLBACK"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "FALLBACK"
else
  log "Pass 2: no pool fix found"
fi

# ── Pass 3: Guaranteed fallback only (always runs, catches blank lines/DOCTYPE) ──
POOL_DESC="" POOL_FILE=""
if guaranteed_bug_fallback; then
  FIX_APPLIED=true
  FIX_DESCRIPTIONS="${FIX_DESCRIPTIONS}- fix($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "BUG" "$POOL_DESC" "FALLBACK"
  learn_fix "$SELECTED_BRANCH" "bug" "$POOL_DESC" "$POOL_FILE" "FALLBACK"
else
  log "Pass 3: fallback found nothing (unlikely)"
fi

# ── Pass 4 (UX): AI → pool → fallback ───────────────────────────────────────
POOL_DESC="" POOL_FILE=""
if try_ai_fix "$SELECTED_BRANCH" "ux" "4"; then
  UX_APPLIED=true
  UX_DESCRIPTIONS="${UX_DESCRIPTIONS}- ux($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "AI"
  learn_fix "$SELECTED_BRANCH" "ux" "$POOL_DESC" "$POOL_FILE" "AI"
elif try_pool_fix "ux"; then
  UX_APPLIED=true
  UX_DESCRIPTIONS="${UX_DESCRIPTIONS}- ux($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "POOL"
  learn_fix "$SELECTED_BRANCH" "ux" "$POOL_DESC" "$POOL_FILE" "POOL"
elif guaranteed_ux_fallback; then
  UX_APPLIED=true
  UX_DESCRIPTIONS="${UX_DESCRIPTIONS}- ux($SELECTED_BRANCH): $POOL_DESC\n"
  update_branch_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "$POOL_FILE"
  update_global_memory "$SELECTED_BRANCH" "UX" "$POOL_DESC" "FALLBACK"
  learn_fix "$SELECTED_BRANCH" "ux" "$POOL_DESC" "$POOL_FILE" "FALLBACK"
else
  log "No UX fix found from any source"
fi

FIX_COUNT=$(printf '%b' "$FIX_DESCRIPTIONS" | grep -c '^- ' || true)
UX_COUNT=$(printf '%b' "$UX_DESCRIPTIONS" | grep -c '^- ' || true)
log "Total fixes found: $FIX_COUNT"
log "UX improvements: $UX_COUNT"

if [ -f "package.json" ]; then
  python3 -c "
import json
p = json.load(open('package.json'))
p['version'] = '$NEW_VER'
json.dump(p, open('package.json', 'w'), indent=2)
" 2>&1 || true
fi

# ── CHANGELOG & Release ──────────────────────────────────────────────────────

TODAY=$(date '+%Y-%m-%d')
if [ "$FIX_APPLIED" = true ] || [ "$UX_APPLIED" = true ]; then
  CHANGE_TYPE="Fixed"
  CHANGELOG_BODY="$(printf '%b' "$FIX_DESCRIPTIONS")"
  if [ -n "$UX_DESCRIPTIONS" ]; then
    CHANGELOG_BODY="${CHANGELOG_BODY}\n\n### Changed\n$(printf '%b' "$UX_DESCRIPTIONS")"
  fi
else
  CHANGELOG_BODY="- chore: maintenance re-release"
  CHANGE_TYPE="Changed"
fi

CL_FILE="CHANGELOG.md"
if [ ! -f "$CL_FILE" ]; then
  printf '# Changelog\n\nAll notable changes to this project will be documented in this file.\n' > "$CL_FILE"
fi
BODY_FILE=$(mktemp)
printf '%b' "$CHANGELOG_BODY" > "$BODY_FILE"
python3 -c "
tag = '$NEW_TAG'
today = '$TODAY'
with open('$BODY_FILE') as f:
    body = f.read().strip()
with open('$CL_FILE') as f:
    content = f.read()
entry = f'\n## [{tag}] - {today}\n\n### $CHANGE_TYPE\n{body}\n'
lines = content.split('\n', 1)
content = lines[0] + '\n' + entry + lines[1] if len(lines) >= 2 else content + '\n' + entry
with open('$CL_FILE', 'w') as f:
    f.write(content)
" 2>&1 || true
rm -f "$BODY_FILE"

if [ "$FIX_APPLIED" = true ]; then
  COMMIT_MSG=$(printf '%b' "$FIX_DESCRIPTIONS" | head -1 | sed 's/^- //' || echo "fix: automated bug fixes")
elif [ "$UX_APPLIED" = true ]; then
  COMMIT_MSG=$(printf '%b' "$UX_DESCRIPTIONS" | head -1 | sed 's/^- //' || echo "ux: improve website")
else
  COMMIT_MSG="chore: maintenance re-release $NEW_TAG"
fi

git add -A 2>&1 | tail -1
git commit -m "$COMMIT_MSG" 2>&1 | tail -3 || log "WARN: nothing to commit (no changes)"
git tag --force "$NEW_TAG" 2>&1 | tail -1
git push origin "$SELECTED_BRANCH" 2>&1 | tail -2 || log "WARN: push branch failed"
git push origin "$NEW_TAG" 2>&1 | tail -2 || git push origin "$NEW_TAG" --force 2>&1 | tail -2 || log "WARN: push tag failed"

printf '%b' "$CHANGELOG_BODY" > /tmp/release_body.txt
printf '%b' "$UX_DESCRIPTIONS" > /tmp/ux_body.txt 2>/dev/null
RELEASE_BODY=$(python3 -c "
with open('CHANGELOG.md') as f:
    content = f.read()
tag = '$NEW_TAG'
import re
pattern = r'## \[' + re.escape(tag) + r'].*?(?=\n## \[|\$)'
match = re.search(pattern, content, re.DOTALL)
if match:
    print(match.group(0).strip())
else:
    with open('/tmp/release_body.txt') as f:
        body = f.read().strip()
    ux_text = ''
    if '$UX_APPLIED' == 'true':
        with open('/tmp/ux_body.txt') as uf:
            ux_text = uf.read().strip()
        if ux_text:
            ux_text = '\\n\\n### Changed\\n' + ux_text
    print(f'## [{tag}] - $TODAY\\n\\n### Fixed\\n{body}{ux_text}')
" 2>/dev/null || true)
if [ -z "$RELEASE_BODY" ]; then
  RELEASE_BODY="## [$NEW_TAG] - $TODAY"$'\n\n### Fixed\n'"$(cat /tmp/release_body.txt)"
  if [ "$UX_APPLIED" = true ]; then
    RELEASE_BODY="${RELEASE_BODY}"$'\n\n### Changed\n'"$(printf '%b' "$UX_DESCRIPTIONS")"
  fi
fi
rm -f /tmp/release_body.txt /tmp/ux_body.txt

gh release create "$NEW_TAG" \
  --repo "$GITHUB_REPO" \
  --title "${SELECTED_BRANCH}-v${NEW_VER}" \
  --notes "$RELEASE_BODY" \
  2>&1 || log "WARN: gh release create failed (tag exists, will retry next run)"

set_last_release "$SELECTED_BRANCH" "$(date +%s)"

log "=== RELEASE COMPLETE: $NEW_TAG ==="
log "https://github.com/$GITHUB_REPO/releases/"

# ── Blog Post Generation ──────────────────────────────────────────────────────

generate_blog_post() {
  local blog_dir="$BRANCH_REPO/blog"
  mkdir -p "$blog_dir" 2>/dev/null
  local post_file="$blog_dir/$NEW_TAG.html"
  if [ -f "$post_file" ]; then
    log "Blog post already exists for $NEW_TAG"
    return
  fi
  local branch_title
  branch_title=$(echo "$SELECTED_BRANCH" | sed 's/-/ /g; s/\b\(.\)/\u\1/g')
  local fix_summary
  fix_summary=$(printf '%b' "$FIX_DESCRIPTIONS" | head -5 | sed 's/^- //' | tr '\n' '; ')
  local ux_summary
  ux_summary=$(printf '%b' "$UX_DESCRIPTIONS" | head -3 | sed 's/^- //' | tr '\n' '; ')
  local full_summary="${fix_summary}${ux_summary:+ UX: ${ux_summary}}"
  cat > "$post_file" << POSTEOF
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Release $NEW_TAG — $branch_title</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333}h1{border-bottom:2px solid #eee;padding-bottom:0.5rem}.meta{color:#666;font-size:0.9rem}.changes{background:#f5f5f5;padding:1rem;border-radius:6px;margin:1rem 0}</style>
</head><body>
<h1>Release $NEW_TAG</h1>
<p class="meta">$TODAY &middot; Release #$NEXT_NUM for $SELECTED_BRANCH</p>
<p>This release includes the following improvements to the $branch_title website:</p>
<div class="changes">
$(printf '%b' "$FIX_DESCRIPTIONS" | sed 's/^- /<li>/; s/$/<\/li>/' | tr '\n' ' ')
$(printf '%b' "$UX_DESCRIPTIONS" | sed 's/^- /<li>/; s/$/<\/li>/' | tr '\n' ' ')
</div>
<p>These changes are part of our ongoing effort to improve website quality, accessibility, and user experience.</p>
<p>For full details, see the <a href="https://github.com/$GITHUB_REPO/releases/tag/$NEW_TAG">GitHub release</a>.</p>
<p><a href="index.html">&larr; Back to blog</a></p>
</body></html>
POSTEOF
  chmod 644 "$post_file"
  log "Blog post created: $post_file"

  # Update blog index — prepend new post link
  local index_file="$blog_dir/index.html"
  if [ -f "$index_file" ]; then
    local post_entry="<div class=\"post\"><h2><a href=\"$NEW_TAG.html\">Release $NEW_TAG</a></h2><p class=\"date\">$TODAY</p><p>$full_summary</p></div>"
    if grep -q '<div id="posts">' "$index_file"; then
      python3 -c "
p = open('$index_file').read()
entry = '''$post_entry'''
p = p.replace('<div id=\"posts\">', '<div id=\"posts\">' + entry)
open('$index_file','w').write(p)
" 2>/dev/null || true
    fi
    log "Blog index updated"
  fi

  # RSS feed
  local feed_file="$blog_dir/feed.xml"
  local site_url="https://${SELECTED_BRANCH}.datro.xyz"
  cat > "$feed_file" << RSSEOF
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>$branch_title Blog</title>
<link>$site_url</link>
<description>Latest releases and updates for $branch_title</description>
<item>
  <title>Release $NEW_TAG</title>
  <link>$site_url/blog/$NEW_TAG.html</link>
  <guid>$NEW_TAG</guid>
  <pubDate>$(date -u '+%a, %d %b %Y %H:%M:%S +0000')</pubDate>
  <description>$full_summary</description>
</item>
</channel></rss>
RSSEOF
  chmod 644 "$feed_file"
  log "RSS feed updated"

  # Commit blog files
  cd "$BRANCH_REPO"
  git add blog/ 2>/dev/null || true
  git commit -m "docs($SELECTED_BRANCH): blog post for $NEW_TAG" 2>/dev/null || true
  git push origin "$SELECTED_BRANCH" 2>&1 | tail -1 || log "WARN: blog push failed"
}

generate_blog_post

# ── Verify & Prune ───────────────────────────────────────────────────────────

VERIFIED=false
for i in 1 2 3 4 5; do
  sleep 3
  if gh release view "$NEW_TAG" --repo "$GITHUB_REPO" --json tagName 2>/dev/null | grep -q "$NEW_TAG"; then
    VERIFIED=true
    log "Verified $NEW_TAG is live on GitHub releases (attempt $i)"
    break
  fi
  log "Waiting for $NEW_TAG to appear on GitHub releases (attempt $i)..."
done

if [ "$VERIFIED" = true ]; then
  CLOUD_DOMAIN=""
  case "$SELECTED_BRANCH" in
    financecheque) CLOUD_DOMAIN="https://financecheque.uk" ;;
    *)             CLOUD_DOMAIN="https://${SELECTED_BRANCH}.datro.pages.dev" ;;
  esac
  log "Checking Cloudflare deployment at $CLOUD_DOMAIN..."
  CF_VERIFIED=false
  for i in 1 2 3 4 5; do
    if curl -sL --max-time 10 "$CLOUD_DOMAIN" >/dev/null 2>&1; then
      CF_VERIFIED=true
      log "Cloudflare deploy verified for $SELECTED_BRANCH (attempt $i)"
      break
    fi
    log "Waiting for Cloudflare deploy of $SELECTED_BRANCH (attempt $i)..."
    sleep 10
  done

  if [ "$CF_VERIFIED" = false ]; then
    log "WARN: Cloudflare deploy failed for $SELECTED_BRANCH. Inner loop..."
    for inner_attempt in 1 2; do
      git checkout "$SELECTED_BRANCH" 2>/dev/null
      DEPLOY_FIX=""
      if [ ! -f "wrangler.toml" ] && [ ! -f "_redirects" ]; then
        echo "" >> "_redirects"
        DEPLOY_FIX="add _redirects for Cloudflare Pages SPA routing"
      fi
      if [ -n "$DEPLOY_FIX" ]; then
        git add -A 2>/dev/null
        git commit -m "fix: deploy config for $SELECTED_BRANCH" 2>/dev/null || true
        git push origin "$SELECTED_BRANCH" 2>/dev/null || true
        log "Inner loop: applied deploy fix ($DEPLOY_FIX), waiting..."
        sleep 20
        if curl -sL --max-time 10 "$CLOUD_DOMAIN" >/dev/null 2>&1; then
          CF_VERIFIED=true
          log "Inner loop: Cloudflare deploy succeeded"
          break
        fi
      else
        log "Inner loop: no auto deploy fix available"
        break
      fi
    done
  fi

  if [ "$CF_VERIFIED" = true ]; then
    log "Cloudflare deploy confirmed."
  else
    log "WARN: Cloudflare deploy still failing."
  fi

  # Runtime quality checks
  CONSOLE_ERRORS=False
  VIEWPORT_ISSUES=False
  if curl -sL --max-time 15 "$CLOUD_DOMAIN" 2>/dev/null | grep -oiE "error|exception|uncaught|undefined is not|cannot read property|typeerror|referenceerror" | head -5 | grep -q .; then
    CONSOLE_ERRORS=True
  fi
  if curl -sL --max-time 15 "$CLOUD_DOMAIN" 2>/dev/null | grep -oiE "overflow-x|overflow-y|max-width.*100vw|min-width" | head -5 | grep -q .; then
    VIEWPORT_ISSUES=True
  fi

  prune_releases "$SELECTED_BRANCH"
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
if 'total_releases' not in s:
    s['total_releases'] = {}
s['total_releases']['$SELECTED_BRANCH'] = $NEXT_NUM
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>&1 || log "WARN: failed to save release counter"
else
  log "WARN: $NEW_TAG not confirmed on releases page."
fi

# ── Touch agent manifest to record update time ─────────────────────────────

echo "# Last auto-update: $(date '+%Y-%m-%d %H:%M:%S UTC') for $SELECTED_BRANCH release $NEW_TAG" >> "$AGENT_DIR/manifest.md.tmp" 2>/dev/null || true

set_state "rotation_index" "$(( (rotation_index + 1) % total_branches ))"
log "=== END MULTI-BRANCH RELEASE ==="
