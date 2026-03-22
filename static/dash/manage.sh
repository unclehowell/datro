#!/bin/bash

# LLM Dashboard Management Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}+===================================================+${NC}"
    echo -e "${BLUE}|        LLM Dashboard Management Tool              |${NC}"
    echo -e "${BLUE}+===================================================+${NC}"
    echo
}

print_status() {
    local service=$1
    local status
    
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✅ $service is running${NC}"
        
        # Show recent logs
        echo -e "${YELLOW}Recent activity:${NC}"
        journalctl -u "$service" -n 3 --no-pager --output=short
    else
        echo -e "${RED}❌ $service is not running${NC}"
    fi
    echo
}

start() {
    echo -e "${BLUE}🚀 Starting LLM Dashboard...${NC}"
    sudo systemctl start llm-dashboard
    echo -e "${BLUE}🚀 Starting PicoClaw Service...${NC}"
    sudo systemctl start picoclaw
    echo -e "${GREEN}✅ Services started!${NC}"
}

stop() {
    echo -e "${RED}🛑 Stopping services...${NC}"
    sudo systemctl stop picoclaw 2>/dev/null || true
    sudo systemctl stop llm-dashboard 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

restart() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    stop
    sleep 2
    start
}

status() {
    echo -e "${BLUE}📊 Checking service status...${NC}"
    print_status "llm-dashboard"
    print_status "picoclaw"
    
    # Check if dashboard is accessible
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}🌐 Dashboard is accessible at http://localhost:8080${NC}"
    else
        echo -e "${RED}❌ Dashboard is not responding at http://localhost:8080${NC}"
    fi
}

logs() {
    local service=${2:-all}
    
    case "$service" in
        "dashboard"|"llm-dashboard")
            echo -e "${YELLOW}📋 Dashboard logs:${NC}"
            sudo journalctl -u llm-dashboard -f
            ;;
        "picoclaw")
            echo -e "${YELLOW}📋 PicoClaw logs:${NC}"
            sudo journalctl -u picoclaw -f
            ;;
        "all"|*)
            echo -e "${YELLOW}📋 Combined logs:${NC}"
            sudo journalctl -u llm-dashboard -u picoclaw -f
            ;;
    esac
}

check_deps() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    fi
    
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️  PM2 is not installed (optional)${NC}"
    else
        echo -e "${GREEN}✅ PM2 is available${NC}"
    fi
}

install() {
    echo -e "${GREEN}🔧 Running installation script...${NC}"
    sudo ./install.sh
}

# Main script logic
case "$1" in
    "start")
        print_header
        check_deps
        start
        sleep 3
        status
        ;;
    "stop")
        print_header
        stop
        ;;
    "restart")
        print_header
        check_deps
        restart
        sleep 3
        status
        ;;
    "status")
        print_header
        status
        ;;
    "logs")
        logs "$@"
        ;;
    "install")
        install
        ;;
    "help"|*)
        print_header
        echo "Usage: $0 {start|stop|restart|status|logs [dashboard|picoclaw]|install}"
        echo
        echo " Commands:"
        echo "   start    - Start all services"
        echo "   stop     - Stop all services"
        echo "   restart  - Restart all services"
        echo "   status   - Show detailed status"
        echo "   logs     - Show logs (optionally specify 'dashboard' or 'picoclaw')"
        echo "   install  - Install and setup services"
        echo "   help     - Show this help message"
        echo
        echo "Examples:"
        echo "   $0 start"
        echo "   $0 status"
        echo "   $0 logs dashboard"
        ;;
esac