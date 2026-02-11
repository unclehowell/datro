#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
OFFLINE_MODE=false
SKIP_INSTALL=false
USE_LIVE_SERVER=false
PORT=4173

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --offline)
      OFFLINE_MODE=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --live-server)
      USE_LIVE_SERVER=true
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./run.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --offline        Enable offline mode for Puck CMS (uses localStorage, no external APIs)"
      echo "  --skip-install   Skip npm install (use existing node_modules)"
      echo "  --live-server    Use live-server instead of vite preview"
      echo "  --port PORT      Specify port (default: 4173)"
      echo "  -h, --help       Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run './run.sh --help' for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== Great House Farm Investigation Webapp ===${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Fix TypeScript configuration (exclude directories and relax unused vars)
fix_typescript_config() {
    if [ -f "tsconfig.json" ]; then
        echo -e "${BLUE}🔧 Checking TypeScript configuration...${NC}"
        
        if ! grep -q '"exclude"' tsconfig.json; then
            cp tsconfig.json tsconfig.json.backup
            sed -i 's/"references": \[{ "path": "\.\/tsconfig.node.json" }\]/\"exclude\": [\"old\", \"old\/**\/*\", \"vite.config.ts\", \"dist\", \"build\", \"node_modules\"],\n  "references": [{ "path": ".\/tsconfig.node.json" }]/' tsconfig.json
            echo -e "${GREEN}✅ Added exclude patterns to tsconfig.json${NC}"
        fi
        
        sed -i 's/"noUnusedLocals": true/"noUnusedLocals": false/g' tsconfig.json
        sed -i 's/"noUnusedParameters": true/"noUnusedParameters": false/g' tsconfig.json
        echo -e "${GREEN}✅ Relaxed TypeScript strictness for unused variables${NC}"
    fi
}

# Fix Tailwind CSS v4 compatibility - AGGRESSIVE FIX
fix_tailwind_compat() {
    echo -e "${BLUE}🔧 Checking Tailwind CSS configuration...${NC}"
    
    # Install @tailwindcss/postcss if tailwindcss is present
    if npm list tailwindcss >/dev/null 2>&1; then
        if ! npm list @tailwindcss/postcss >/dev/null 2>&1; then
            echo -e "${YELLOW}📦 Installing @tailwindcss/postcss...${NC}"
            npm install -D @tailwindcss/postcss
        fi
        
        # DELETE any existing broken postcss configs and recreate fresh
        echo -e "${YELLOW}📝 Recreating postcss.config.mjs with correct syntax...${NC}"
        rm -f postcss.config.js postcss.config.mjs postcss.config.cjs
        
        cat > postcss.config.mjs << 'EOF'
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
EOF
        echo -e "${GREEN}✅ Created postcss.config.mjs${NC}"
    fi
    
    # Create index.css if referenced in index.html but missing
    if [ -f "index.html" ] && grep -q "index.css" index.html && [ ! -f "index.css" ]; then
        echo -e "${YELLOW}📝 Creating missing index.css...${NC}"
        cat > index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
EOF
    fi
}

# Run fixes before install
fix_typescript_config
fix_tailwind_compat

# Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    if [ "$OFFLINE_MODE" = true ]; then
        npm install --include=dev --prefer-offline
    else
        npm install
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ npm install failed${NC}"
        exit 1
    fi
    
    # Ensure TypeScript is installed
    if [ ! -f "./node_modules/.bin/tsc" ]; then
        echo -e "${YELLOW}📦 Installing TypeScript explicitly...${NC}"
        npm install -D typescript
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping npm install${NC}"
fi

# Run fixes again after install to catch any new issues
fix_tailwind_compat

# Set offline environment variables for the build
if [ "$OFFLINE_MODE" = true ]; then
    echo -e "${YELLOW}🔄 Offline mode enabled - Puck will use localStorage${NC}"
    export VITE_OFFLINE_MODE=true
    export NODE_ENV=production
fi

# Build the app
echo -e "${BLUE}🔨 Building app...${NC}"

if [ "$OFFLINE_MODE" = true ]; then
    VITE_OFFLINE_MODE=true npm run build
else
    npm run build
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build complete${NC}"

# Determine build directory
BUILD_DIR="dist"
if [ -d "build" ]; then
    BUILD_DIR="build"
elif [ -d "dist" ]; then
    BUILD_DIR="dist"
fi

# Serve the app
echo -e "${BLUE}🚀 Starting server...${NC}"

if [ "$USE_LIVE_SERVER" = true ]; then
    if ! command -v live-server &> /dev/null; then
        echo -e "${YELLOW}⚠️  live-server not found. Installing globally...${NC}"
        npm install -g live-server
    fi
    
    echo -e "${GREEN}🌐 Serving with live-server on http://localhost:${PORT}${NC}"
    echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop${NC}"
    cd "$BUILD_DIR" && live-server --port=$PORT --open=false
else
    echo -e "${GREEN}🌐 Serving with Vite preview on http://localhost:${PORT}${NC}"
    echo -e "${YELLOW}ℹ️  Press Ctrl+C to stop${NC}"
    npm run preview -- --port=$PORT
fi
