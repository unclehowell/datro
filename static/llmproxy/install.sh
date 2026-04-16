#!/bin/bash
#
# LLM Proxy One-Liner Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/install.sh | sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="llmproxy"
INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"
STATIC_PATH="static/llmproxy"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check dependencies
check_deps() {
    log_info "Checking dependencies..."
    local missing=()
    if ! command -v git &> /dev/null; then missing+=("git"); fi
    if ! command -v python3 &> /dev/null; then missing+=("python3"); fi
    if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then missing+=("pip"); fi
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing: ${missing[*]}"
        exit 1
    fi
    log_success "Dependencies OK"
}

# Install free CLI tools
install_cli_tools() {
    log_info "Installing CLI tools..."
    if command -v npm &> /dev/null; then
        npm install -g opencode-cli-opencode 2>/dev/null || true
        npm install -g groq-cli 2>/dev/null || true
        npm install -g @kilo-cli/kilo 2>/dev/null || true
    fi
    log_success "CLI tools checked"
}

# Clone repo
setup_repo() {
    log_info "Setting up repository..."
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    if [ -d ".git" ]; then
        git fetch origin "$BRANCH" 2>/dev/null || true
        LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "none")
        REMOTE=$(git rev-parse origin/"$BRANCH" 2>/dev/null || echo "none")
        if [ "$LOCAL" != "$REMOTE" ] && [ "$REMOTE" != "none" ]; then
            git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" origin/"$BRANCH" 2>/dev/null || true
            git reset --hard origin/"$BRANCH" 2>/dev/null || true
        fi
    else
        git clone -b "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
            log_error "Git clone failed"
            exit 1
        }
    fi
    
    [ -d "$INSTALL_DIR/$STATIC_PATH" ] || { log_error "LLMProxy path not found"; exit 1; }
    
    if [ ! -d "$INSTALL_DIR/subproxy" ]; then
        cp -r "$INSTALL_DIR/$STATIC_PATH" "$INSTALL_DIR/subproxy"
    fi
    log_success "Repository ready"
}

# Install Python deps
install_deps() {
    log_info "Installing Python deps..."
    pip3 install -q aiohttp 2>/dev/null || pip install -q aiohttp 2>/dev/null || true
    log_success "Done"
}

# Configure machine
configure_machine() {
    log_info "Configuring machine..."
    local hostname=$(hostname)
    local ip=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
    mkdir -p "$INSTALL_DIR/subproxy/config"
    cat > "$INSTALL_DIR/subproxy/config/machine.json" <<EOF
{
  "machine_id": "$hostname",
  "machine_name": "$hostname",
  "tailscale_ip": "$ip",
  "port": 5000,
  "capabilities": ["cli", "api", "local"],
  "priority": 1
}
EOF
    mkdir -p "$INSTALL_DIR/logs"
    log_success "Configured: $hostname ($ip)"
}

# Start services
start_services() {
    log_info "Starting services..."
    pkill -f "subproxy/server.py" 2>/dev/null || true
    pkill -f "dashboard/server.py" 2>/dev/null || true
    sleep 1
    
    cd "$INSTALL_DIR/subproxy"
    nohup python3 server.py > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
    sleep 2
    
    cd "$INSTALL_DIR/dashboard"
    nohup python3 server.py > "$INSTALL_DIR/logs/dashboard.log" 2>&1 &
    sleep 2
    
    log_success "Services started"
}

# Setup cron
setup_cron() {
    log_info "Setting up auto-update..."
    local cronjob="*/5 * * * * cd $INSTALL_DIR && git fetch origin $BRANCH && git reset --hard origin/$BRANCH >> $INSTALL_DIR/logs/update.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$cronjob") | crontab -
    log_success "Cron installed"
}

# Main
main() {
    echo "========================================"
    echo "  LLM Proxy Installer"
    echo "========================================"
    check_deps
    install_cli_tools
    setup_repo
    install_deps
    configure_machine
    start_services
    setup_cron
    echo "========================================"
    log_success "Installation complete!"
    echo "  Sub-proxy:   http://localhost:5000"
    echo "  Dashboard:   http://localhost:8080"
    echo "========================================"
}

main "$@"