#!/bin/bash

# LLM Dashboard Demo Script

echo "🚀 Starting LLM Dashboard Demo..."
echo

# Check if the dashboard is already running
if pgrep -f "server-simple.js" > /dev/null; then
    echo "🎉 Dashboard is already running!"
    echo "🌐 Visit: http://localhost:3000"
else
    echo "🔄 Starting dashboard..."
    node server-simple.js &
    sleep 2
    echo "🌐 Dashboard started at http://localhost:3000"
fi

echo
echo "📊 Available endpoints:"
echo "  🔹 Dashboard: http://localhost:3000"
echo "  🔹 LLM Usage: http://localhost:3000/api/llm-usage"
echo "  🔹 Users: http://localhost:3000/api/users"
echo

# Test the endpoints
echo "🧪 Testing endpoints..."

if command -v curl &> /dev/null; then
    echo "Testing LLM usage endpoint..."
    curl -s http://localhost:3000/api/llm-usage | head -c 200
    echo "..."
    echo
    
    echo "Testing users endpoint..."
    curl -s http://localhost:3000/api/users | head -c 200  
    echo "..."
else
    echo "⚠️  curl not available, skipping endpoint tests"
fi

echo
echo "📱 Dashboard Features:"
echo "  ✅ Real-time LLM usage monitoring"
echo "  ✅ User-specific color coding"
echo "  ✅ PicoClaw integration"
echo "  ✅ Auto-sorting by usage percentage"
echo "  ✅ Responsive design"
echo
echo "🎨 Color Key:"
echo "  🟢 PicoClaw Agent (Local)"
echo "  🔴 Research Bot"
echo "  🟢 Development Assistant"
echo "  🔵 Backend Services"
echo
echo "Press Ctrl+C to stop the dashboard"
echo

# Wait for user input or Ctrl+C
wait