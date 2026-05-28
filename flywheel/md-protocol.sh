#!/usr/bin/env bash
#===============================================================================
# md-protocol.sh — Per-Branch MD Protocol File Generator
#
# Generates/updates SPEC.md, AGENT.md, TASKS.md, MEMORY.md, README.md
# from a Master Record, branch profile, and profiles.json.
#
# Usage:  ./md-protocol.sh <branch-name>
#===============================================================================
set -euo pipefail

#===============================================================================
# CONFIGURABLE PATHS (override via environment)
#===============================================================================
AGENT_DIR="${AGENT_DIR:-/home/unclehowell/agent}"
BRANCH_DIR="${BRANCH_DIR:-/home/unclehowell/branch}"
PROFILES_JSON="${PROFILES_JSON:-${AGENT_DIR}/profiles.json}"

#===============================================================================
# ARGUMENTS
#===============================================================================
BRANCH="${1:-}"
if [ -z "$BRANCH" ]; then
  echo "ERROR: No branch name provided." >&2
  echo "Usage: $0 <branch-name>" >&2
  exit 1
fi

#===============================================================================
# DERIVED PATHS
#===============================================================================
MASTER_RECORD="${AGENT_DIR}/masters/${BRANCH}.md"
BRANCH_PROFILE="${AGENT_DIR}/branches/${BRANCH}.md"
OUTPUT_DIR="${BRANCH_DIR}/static/${BRANCH}"

#===============================================================================
# LOGGING HELPER
#===============================================================================
log() {
  local action="$1" file="$2" detail="${3:-}"
  local label
  case "$action" in
    CREATE) label="CREATE  " ;;
    UPDATE) label="UPDATE  " ;;
    SKIP)   label="SKIP    " ;;
    INFO)   label="INFO    " ;;
    WARN)   label="WARN    " ;;
    *)      label="        " ;;
  esac
  printf "[%s] %s %s" "$(date '+%H:%M:%S')" "$label" "$file"
  [ -n "$detail" ] && printf "  (%s)" "$detail"
  printf "\n"
}

#===============================================================================
# PYTHON3 AVAILABILITY CHECK
#===============================================================================
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 is required but not found in PATH." >&2
  exit 1
fi

#===============================================================================
# 1. PARSE PROFILES.JSON
#===============================================================================
parse_profiles_json() {
  python3 -c "
import json, sys

try:
    with open('${PROFILES_JSON}') as f:
        data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    data = {}

# Try different structures: {branches: {branch: ...}}, {branch: ...}, or flat
if 'branches' in data and isinstance(data['branches'], dict):
    bdata = data['branches'].get('${BRANCH}', {})
elif '${BRANCH}' in data:
    bdata = data['${BRANCH}']
else:
    bdata = data  # flat profile

category    = bdata.get('category', 'website')
url         = bdata.get('url', 'https://example.com')
stack       = bdata.get('stack', 'HTML/CSS/JS')
known_issues = bdata.get('known_issues', [])
pa = bdata.get('priority_areas', {
    'seo': 3, 'performance': 3, 'accessibility': 3,
    'security': 3, 'html': 3, 'progressive': 2
})

# Format priority_areas as YAML
pa_lines = []
for k in ['seo','performance','accessibility','security','html','progressive']:
    v = pa.get(k, 3)
    pa_lines.append(f'  {k}: {v}')
pa_yaml = '\n'.join(pa_lines)

# Known issues as markdown list
if known_issues:
    ki_md = '\n'.join('- ' + i for i in known_issues)
else:
    ki_md = '- None documented'

result = {
    'category': category,
    'url': url,
    'stack': stack,
    'known_issues_md': ki_md,
    'priority_areas_yaml': pa_yaml
}
print(json.dumps(result))
"
}

PROFILES_DATA="$(parse_profiles_json)"
CATEGORY="$(echo "$PROFILES_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['category'])")"
URL="$(echo "$PROFILES_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['url'])")"
STACK="$(echo "$PROFILES_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['stack'])")"
KNOWN_ISSUES_MD="$(echo "$PROFILES_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['known_issues_md'])")"
PRIORITY_AREAS_YAML="$(echo "$PROFILES_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['priority_areas_yaml'])")"

log "INFO" "profiles.json" "category=${CATEGORY}, url=${URL}"

#===============================================================================
# 2. PARSE MASTER RECORD
#===============================================================================
MASTER_EXISTS=false
VISION=""
DESCRIPTION=""
PHASES_JSON="[]"

parse_master_record() {
  python3 -c "
import json, re, sys

path = '${MASTER_RECORD}'
try:
    with open(path) as f:
        content = f.read()
except FileNotFoundError:
    print(json.dumps({'vision': '', 'description': '', 'phases': []}))
    sys.exit(0)

# Strip YAML frontmatter
body = content
frontmatter = {}
m = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
if m:
    fm_text = m.group(1)
    # parse naive key:value from frontmatter
    for line in fm_text.split('\n'):
        kv = re.match(r'^(\w+)\s*:\s*(.*)', line)
        if kv:
            frontmatter[kv.group(1).strip()] = kv.group(2).strip().strip('\"').strip(\"'\")
    body = content[m.end():]

vision = frontmatter.get('vision', '')
if not vision:
    # Try to find first heading or paragraph that looks like a vision statement
    m2 = re.search(r'#+\s*Vision\s*\n+(.*?)(?:\n#|\Z)', body, re.DOTALL)
    if m2:
        vision = m2.group(1).strip()
    else:
        # fallback: first paragraph
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        vision = paras[0] if paras else ''

description = frontmatter.get('description', '')
if not description:
    m3 = re.search(r'#+\s*(?:Overview|Description)\s*\n+(.*?)(?:\n#|\Z)', body, re.DOTALL)
    if m3:
        description = m3.group(1).strip()

# Extract phases: ### Phase N — Title
phases = []
# Split body into sections at ### headings
sections = re.split(r'^(?=### )', body, flags=re.MULTILINE)
for sec in sections:
    pm = re.match(r'^### Phase (\d+) *[—–-] *(.+?)$', sec, re.MULTILINE)
    if pm:
        phase_num = int(pm.group(1))
        phase_title = pm.group(2).strip()
        # Extract - [ ] items from this section
        items = re.findall(r'^- \[ \] (.+)$', sec, re.MULTILINE)
        phases.append({
            'number': phase_num,
            'title': phase_title,
            'items': items
        })

print(json.dumps({'vision': vision, 'description': description, 'phases': phases}))
"
}

MASTER_DATA="$(parse_master_record)"
VISION="$(echo "$MASTER_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['vision'])")"
DESCRIPTION="$(echo "$MASTER_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['description'])")"
PHASES_JSON="$(echo "$MASTER_DATA" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['phases']))")"

if [ -f "$MASTER_RECORD" ]; then
  MASTER_EXISTS=true
  log "INFO" "Master Record" "$(basename "$MASTER_RECORD") loaded"
  PHASE_COUNT="$(echo "$PHASES_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"
  log "INFO" "phases" "${PHASE_COUNT} phase(s) extracted"
else
  log "WARN" "Master Record" "$(basename "$MASTER_RECORD") not found — using profiles.json defaults"
fi

#===============================================================================
# 3. PARSE BRANCH PROFILE
#===============================================================================
parse_branch_profile() {
  python3 -c "
import json, re, sys

path = '${BRANCH_PROFILE}'
try:
    with open(path) as f:
        content = f.read()
except FileNotFoundError:
    print(json.dumps({'known_issues': '', 'stack': '', 'next_priority': '', 'body':'No branch profile available.'}))
    sys.exit(0)

# Try to extract frontmatter fields
known_issues = ''
stack = ''
next_priority = ''

m = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
if m:
    fm_text = m.group(1)
    for line in fm_text.split('\n'):
        kv = re.match(r'^(\w+)\s*:\s*(.*)', line)
        if kv:
            key = kv.group(1).strip()
            val = kv.group(2).strip().strip('\"').strip(\"'\")
            if key == 'known_issues':
                known_issues = val
            elif key == 'stack':
                stack = val
            elif key == 'next_priority':
                next_priority = val
    body = content[m.end():]
else:
    body = content

# If not found in frontmatter, search body
if not known_issues:
    m2 = re.search(r'(?:known_?issues|issues)[:\\s]+(.+?)(?:\n[#\n]|\Z)', body, re.IGNORECASE | re.DOTALL)
    if m2:
        known_issues = m2.group(1).strip()
if not stack:
    m3 = re.search(r'stack[:\s]+(.+?)(?:\n[#\n]|\Z)', body, re.IGNORECASE | re.DOTALL)
    if m3:
        stack = m3.group(1).strip()
if not next_priority:
    m4 = re.search(r'(?:next_?priority|priority)[:\s]+(.+?)(?:\n[#\n]|\Z)', body, re.IGNORECASE | re.DOTALL)
    if m4:
        next_priority = m4.group(1).strip()

print(json.dumps({
    'known_issues': known_issues,
    'stack': stack,
    'next_priority': next_priority,
    'body': body[:500]  # first 500 chars for context
}))
"
}

BRANCH_PROFILE_DATA="$(parse_branch_profile)"
BP_KNOWN_ISSUES="$(echo "$BRANCH_PROFILE_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('known_issues',''))")"
BP_STACK="$(echo "$BRANCH_PROFILE_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stack',''))")"
BP_NEXT_PRIORITY="$(echo "$BRANCH_PROFILE_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('next_priority',''))")"
BP_BODY="$(echo "$BRANCH_PROFILE_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('body','No branch profile available.'))")"

if [ -f "$BRANCH_PROFILE" ]; then
  log "INFO" "Branch Profile" "$(basename "$BRANCH_PROFILE") loaded"
fi

#===============================================================================
# HELPER: Generate phases markdown for TASKS.md
#   Reads phases JSON from stdin, prints markdown to stdout.
#===============================================================================
generate_phases_md() {
  echo "$PHASES_JSON" | python3 -c "
import json, sys

phases = json.load(sys.stdin)
if not phases:
    print('No roadmap phases defined in Master Record.')
    sys.exit(0)

output = []
for p in phases:
    output.append(f'## Phase {p[\"number\"]} — {p[\"title\"]}')
    if p['items']:
        for item in p['items']:
            output.append(f'- [ ] {item}')
    else:
        output.append('- [ ] (no specific tasks defined)')
    output.append('')
print('\n'.join(output).rstrip())
"
}

#===============================================================================
# HELPER: Generate SPEC.md phase sections (merge standard + extracted items)
#   Reads phases JSON from stdin, prints markdown to stdout.
#===============================================================================
generate_spec_phases() {
  echo "$PHASES_JSON" | python3 -c "
import json, sys

phases = json.load(sys.stdin)

# Standard items per phase (template defaults)
standard = {
    1: [
        'Valid HTML5 (\`<!DOCTYPE html>\`, charset, viewport, lang)',
        'Page title reflects purpose',
        'Privacy policy page exists at \`static/${BRANCH}/privacy-policy.html\`',
        'Terms of service page exists at \`static/${BRANCH}/terms-of-service.html\`'
    ],
    2: [
        'Meta description present and relevant',
        'Open Graph tags for social sharing',
        'Contact page or section',
        'Blog launched at \`static/${BRANCH}/blog/\`'
    ],
    3: [
        'Sitemap.xml and robots.txt',
        'RSS/Atom feed',
        'JSON-LD structured data',
        'Core Web Vitals in green'
    ],
    4: [
        'Full WCAG 2.1 AA compliance',
        'Search functionality'
    ]
}

# Phase number to section heading mapping
def phase_section(num):
    if num == 1:
        return 'Must Have (Phase 1)'
    elif num == 2:
        return 'Should Have (Phase 2)'
    elif num == 3:
        return 'Could Have (Phase 3)'
    else:
        return \"Won't Have (Phase 4+)\"

# Collect all phase numbers from Master Record (always include 1-4)
phase_nums = set(p['number'] for p in phases) | {1, 2, 3, 4}

# Build output per phase section
seen_sections = set()
output = []
for num in sorted(phase_nums):
    sect = phase_section(num)
    if sect in seen_sections:
        continue
    seen_sections.add(sect)
    output.append(f'## {sect}')
    # Add standard items for this phase number
    std_items = standard.get(num if num <= 4 else 4, [])
    for item in std_items:
        output.append(f'- [ ] {item}')
    # Add extracted items from Master Record
    for p in phases:
        pnum = p['number']
        # map phase number to same section
        psect = phase_section(pnum if pnum <= 4 else 4)
        if psect == sect:
            for item in p['items']:
                # Avoid duplicating standard items
                if item not in std_items:
                    output.append(f'- [ ] {item}')
    output.append('')

print('\n'.join(output).rstrip())
"
}

#===============================================================================
# 4. GENERATE OUTPUT FILES
#===============================================================================
mkdir -p "$OUTPUT_DIR"

#-------------------------------------------------------------------------
# 4a. SPEC.md
#-------------------------------------------------------------------------
write_spec() {
  local phases_content
  phases_content="$(generate_spec_phases 2>/dev/null)" || phases_content=""

  if [ -z "$phases_content" ]; then
    # Fallback: standard template without custom phase data
    phases_content="$(cat <<-SPECTPL
## Must Have (Phase 1)
- [ ] Valid HTML5 (\`<!DOCTYPE html>\`, charset, viewport, lang)
- [ ] Page title reflects purpose
- [ ] Privacy policy page exists at \`static/${BRANCH}/privacy-policy.html\`
- [ ] Terms of service page exists at \`static/${BRANCH}/terms-of-service.html\`

## Should Have (Phase 2)
- [ ] Meta description present and relevant
- [ ] Open Graph tags for social sharing
- [ ] Contact page or section
- [ ] Blog launched at \`static/${BRANCH}/blog/\`

## Could Have (Phase 3)
- [ ] Sitemap.xml and robots.txt
- [ ] RSS/Atom feed
- [ ] JSON-LD structured data
- [ ] Core Web Vitals in green

## Won't Have (Phase 4)
- [ ] Full WCAG 2.1 AA compliance
- [ ] Search functionality
SPECTPL
    )"
  fi

  cat > "${OUTPUT_DIR}/SPEC.md" <<-SPECEOF
---
branch: ${BRANCH}
category: ${CATEGORY}
url: ${URL}
priority_areas:
${PRIORITY_AREAS_YAML}
---

# SPEC.md — ${BRANCH} (${URL})

${phases_content}
SPECEOF

  log "CREATE" "SPEC.md" "${OUTPUT_DIR}/SPEC.md"
}

#-------------------------------------------------------------------------
# 4b. AGENT.md
#-------------------------------------------------------------------------
write_agent() {
  # Resolve branch-specific focus values
  local bf_known bf_stack bf_priority

  if [ -n "$BP_KNOWN_ISSUES" ]; then
    bf_known="$BP_KNOWN_ISSUES"
  elif [ "$KNOWN_ISSUES_MD" != "- None documented" ]; then
    bf_known="$KNOWN_ISSUES_MD"
  else
    bf_known="- See profiles.json"
  fi

  if [ -n "$BP_STACK" ]; then
    bf_stack="$BP_STACK"
  elif [ -n "$STACK" ]; then
    bf_stack="$STACK"
  else
    bf_stack="HTML/CSS/JS (see profiles.json)"
  fi

  if [ -n "$BP_NEXT_PRIORITY" ]; then
    bf_priority="$BP_NEXT_PRIORITY"
  else
    bf_priority="- See Master Record or branch profile"
  fi

  cat > "${OUTPUT_DIR}/AGENT.md" <<-AGENTEOF
---
branch: ${BRANCH}
category: ${CATEGORY}
---

# AGENT.md — Instructions for ${BRANCH}

## Allowed Operations
- Edit files under \`static/${BRANCH}/\`
- Create new HTML/CSS/JS files under \`static/${BRANCH}/\`
- Modify \`_headers\` and \`_redirects\` for Cloudflare Pages

## Prohibited Operations
- Modifying files outside \`static/${BRANCH}/\`
- Changing build configuration, CI/CD files, or third-party dependencies
- Deleting existing content without user confirmation

## Preferred Patterns
- Add, don't remove: prefer appending improvements over removing existing content
- Preserve existing styling: match the branch's current visual theme
- Semantic HTML: use \`<main>\`, \`<nav>\`, \`<section>\`, \`<article>\` where appropriate
- Progressive enhancement: core content should work without JavaScript

## Branch-Specific Focus

### Known Issues
${bf_known}

### Stack
${bf_stack}

### Next Priority
${bf_priority}
AGENTEOF

  log "CREATE" "AGENT.md" "${OUTPUT_DIR}/AGENT.md"
}

#-------------------------------------------------------------------------
# 4c. TASKS.md
#-------------------------------------------------------------------------
write_tasks() {
  local phases_md
  phases_md="$(generate_phases_md 2>/dev/null)" || phases_md="No roadmap phases defined in Master Record."

  # Get known issues from profiles.json for inclusion
  local ki_section
  if [ "$KNOWN_ISSUES_MD" != "- None documented" ]; then
    ki_section="${KNOWN_ISSUES_MD}"
  else
    ki_section="- None documented"
  fi

  local today
  today="$(date '+%Y-%m-%d')"

  cat > "${OUTPUT_DIR}/TASKS.md" <<-TASKSEOF
---
branch: ${BRANCH}
generated: ${today}
---

# TASKS.md — ${BRANCH}

${phases_md}

## Known Issues (from profiles.json)
${ki_section}
TASKSEOF

  log "CREATE" "TASKS.md" "${OUTPUT_DIR}/TASKS.md"
}

#-------------------------------------------------------------------------
# 4d. MEMORY.md (append-only)
#-------------------------------------------------------------------------
write_memory() {
  local memfile="${OUTPUT_DIR}/MEMORY.md"

  if [ -f "$memfile" ]; then
    log "SKIP" "MEMORY.md" "file exists, not overwritten (append-only)"
    return
  fi

  cat > "$memfile" <<-MEMEOF
---
branch: ${BRANCH}
---

# MEMORY.md — ${BRANCH}

This file is appended to by every flywheel cycle. Each entry logs what was attempted,
whether it succeeded, and what lesson was learned.

MEMEOF

  log "CREATE" "MEMORY.md" "${OUTPUT_DIR}/MEMORY.md"
}

#-------------------------------------------------------------------------
# 4e. README.md
#-------------------------------------------------------------------------
write_readme() {
  local purpose="${VISION:-${BRANCH} site — managed by the DATRO Consortium Flywheel.}"
  local overview="${DESCRIPTION:-This site is maintained by the DATRO Consortium Flywheel. See the Master Record for full details.}"
  local stack_display="${STACK:-HTML/CSS/JS}"
  local url_display="${URL:-https://example.com}"
  local category_display="${CATEGORY:-website}"

  cat > "${OUTPUT_DIR}/README.md" <<-READMEEOF
# ${BRANCH}

${purpose}

## Overview
${overview}

## URL
${url_display}

## Stack
${stack_display}

## Category
${category_display}

## Maintenance
This site is maintained by the DATRO Consortium Flywheel — an autonomous release system.
See \`SPEC.md\` for specification, \`AGENT.md\` for agent instructions, \`TASKS.md\` for roadmap,
and \`MEMORY.md\` for cycle history.
READMEEOF

  log "CREATE" "README.md" "${OUTPUT_DIR}/README.md"
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  md-protocol.sh — Generating protocol files for branch: ${BRANCH}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

write_spec
write_agent
write_tasks
write_memory
write_readme

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Done. Files are in: ${OUTPUT_DIR}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
