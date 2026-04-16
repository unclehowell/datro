#!/bin/bash
#
# LLM Proxy One-Liner Installer
# Usage: curl -fsSL https://financecheque.uk/install.sh | sh
# Or:    curl -fsSL https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/install.sh | sh
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

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /proc/version ]; then
        if grep -q "android" /proc/version; then
            echo "android"
        else
            echo "linux"
        fi
    else
        echo "unknown"
    fi
}

# Check dependencies
check_deps() {
    log_info "Checking dependencies..."
    
    local missing=()
    
    # Check git
    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi
    
    # Check python3
    if ! command -v python3 &> /dev/null; then
        missing+=("python3")
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
        missing+=("pip")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing[*]}"
        log_info "Please install them and try again."
        exit 1
    fi
    
    log_success "All dependencies found"
}

# Install free CLI tools
install_cli_tools() {
    log_info "Installing free CLI tools..."
    
    # opencode - no key required
    if ! command -v opencode &> /dev/null; then
        log_info "Installing opencode..."
        # Try to install opencode
        if command -v npm &> /dev/null; then
            npm install -g opencode-cli-opencode 2>/dev/null || true
        fi
    fi
    
    # groq CLI
    if ! command -v groq &> /dev/null; then
        log_info "Installing groq CLI..."
        if command -v npm &> /dev/null; then
            npm install -g groq-cli 2>/dev/null || true
        fi
    fi
    
    # kilo CLI
    if ! command -v kilo &> /dev/null; then
        log_info "Installing kilo CLI..."
        if command -v npm &> /dev/null; then
            npm install -g @kilo-cli/kilo 2>/dev/null || true
        fi
    fi
    
    # kiro CLI (check if in ~/.kiro)
    if [ ! -f "$HOME/.kiro/bin/kiro" ] && [ ! -f "$HOME/.local/bin/kiro" ]; then
        log_info "kiro CLI not found - will use API mode"
    fi
    
    # ollama (optional - for local models)
    if ! command -v ollama &> /dev/null; then
        log_warn "ollama not installed - local models won't be available"
    fi
    
    log_success "CLI tools checked"
}

# Clone or update repo
setup_repo() {
    log_info "Setting up repository..."
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    if [ -d ".git" ]; then
        log_info "Updating existing installation..."
        git fetch origin "$BRANCH"
        LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "none")
        REMOTE=$(git rev-parse origin/"$BRANCH" 2>/dev/null || echo "none")
        
        if [ "$LOCAL" != "$REMOTE" ] && [ "$REMOTE" != "none" ]; then
            git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" origin/"$BRANCH" 2>/dev/null || true
            git reset --hard origin/"$BRANCH" 2>/dev/null || true
            log_success "Updated to latest version"
        else
            log_info "Already up to date"
        fi
    else
        log_info "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR" --depth 1
    fi
    
    # Verify static/llmproxy path exists
    if [ ! -d "$STATIC_PATH" ]; then
        log_error "LLMProxy not found at $STATIC_PATH"
        exit 1
    fi
    
    # Create symlink or copy files
    if [ ! -d "$INSTALL_DIR/subproxy" ]; then
        cp -r "$STATIC_PATH" "$INSTALL_DIR/llmproxy_files"
        mv "$INSTALL_DIR/llmproxy_files" "$INSTALL_DIR/subproxy"
    fi
    
    log_success "Repository ready"
}

# Install Python dependencies
install_deps() {
    log_info "Installing Python dependencies..."
    
    pip3 install -q aiohttp 2>/dev/null || pip install -q aiohttp 2>/dev/null || true
    
    log_success "Dependencies installed"
}

# Configure machine
configure_machine() {
    log_info "Configuring machine..."
    
    local hostname=$(hostname)
    local ip=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
    
    # Create config directory
    mkdir -p "$INSTALL_DIR/subproxy/config"
    
    # Machine config
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
    
    # Create logs directory
    mkdir -p "$INSTALL_DIR/logs"
    
    log_success "Machine configured: $hostname ($ip)"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    # Kill existing processes
    pkill -f "subproxy/server.py" 2>/dev/null || true
    pkill -f "dashboard/server.py" 2>/dev/null || true
    
    sleep 1
    
    # Start sub-proxy
    cd "$INSTALL_DIR/subproxy"
    nohup python3 server.py > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
    sleep 2
    
    if pgrep -f "subproxy/server.py" > /dev/null; then
        log_success "Sub-proxy started on port 5000"
    else
        log_error "Failed to start sub-proxy"
    fi
    
    # Start dashboard
    cd "$INSTALL_DIR/dashboard"
    nohup python3 server.py > "$INSTALL_DIR/logs/dashboard.log" 2>&1 &
    sleep 2
    
    if pgrep -f "dashboard/server.py" > /dev/null; then
        log_success "Dashboard started on port 8080"
    else
        log_error "Failed to start dashboard"
    fi
}

# Setup OTA updates
setup_cron() {
    log_info "Setting up OTA auto-update..."
    
    local cronjob="*/5 * * * * cd $INSTALL_DIR && git fetch origin $BRANCH && git reset --hard origin/$BRANCH >> $INSTALL_DIR/logs/update.log 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$cronjob") | crontab -
    
    log_success "Cron job installed for auto-update"
}

# Prompt for API keys
prompt_api_keys() {
    echo ""
    log_info "========================================"
    log_info "  API Key Configuration"
    log_info "========================================"
    echo ""
    log_info "You can configure API keys in two ways:"
    echo ""
    echo "  1. Web GUI (recommended): Open http://localhost:8080"
    echo "     - Click 'Configuration' section"
    echo "     - Edit providers.json with your keys"
    echo "     - Click 'Save Config'"
    echo ""
    echo "  2. Environment variables (add to ~/.bashrc):"
    echo "     export GROQ_API_KEY='your-key'"
    echo "     export GOOGLE_API_KEY='your-key'"
    echo "     export ANTHROPIC_API_KEY='your-key'"
    echo "     export OPENAI_API_KEY='your-key'"
    echo "     export XAI_API_KEY='your-key'"
    echo ""
    
    read -p "Would you like to open the web GUI now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Opening web GUI..."
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8080 2>/dev/null || true
        elif command -v gnome-open &> /dev/null; then
            gnome-open http://localhost:8080 2>/dev/null || true
        fi
        echo "Please configure your API keys in the web GUI."
    fi
}

# Main
main() {
    echo ""
    echo "========================================"
    echo "  LLM Proxy Installer"
    echo "  Branch: $BRANCH"
    echo "========================================"
    echo ""
    
    check_deps
    install_cli_tools
    setup_repo
    install_deps
    configure_machine
    start_services
    setup_cron
    prompt_api_keys
    
    echo ""
    echo "========================================"
    log_success "Installation complete!"
    echo "========================================"
    echo ""
    echo "  Sub-proxy:   http://localhost:5000"
    echo "  Dashboard:   http://localhost:8080"
    echo "  Logs:        $INSTALL_DIR/logs/"
    echo ""
    echo "  Next: Open http://localhost:8080 to configure API keys"
    echo ""
}

main "$@"