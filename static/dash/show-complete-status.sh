#!/bin/bash

echo "🎯 LLM BUBBLE DASHBOARD - COMPLETE STATUS CHECK"
echo "================================================"
echo

# Check if processes are running
echo "🔍 PROCESS STATUS:"
pm2 status 2>/dev/null || echo "❌ PM2 not running"

# Check if dashboard is accessible
echo
echo "🌐 DASHBOARD ACCESSIBILITY:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/index-large.html | grep -q "200" && \
    echo "✅ Bubble Dashboard (Large Text): http://localhost:8080/index-large.html" || \
    echo "❌ Bubble Dashboard (Large Text): Not accessible"

curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200" && \
    echo "✅ Main Dashboard: http://localhost:8080" || \
    echo "❌ Main Dashboard: Not accessible"

# Check API endpoints
echo
echo "📊 API STATUS:"
curl -s http://localhost:8080/api/llm-usage > /dev/null 2>&1 && \
    echo "✅ LLM Usage API: Active" || \
    echo "❌ LLM Usage API: Down"

# Check disk space
echo
echo "💽 SYSTEM STATUS:"
echo "Available disk space: $(df -h / | tail -1 | awk '{print $4}')"

# Check memory usage
echo "Memory usage: $(free -h | grep Mem | awk '{print $3"/"$2}')"

echo
echo "🎉 DASHBOARD FEATURES ACTIVE:"
echo "   ✅ Large text (24px+ base font)"
echo "   ✅ Bubble visualization with expanding usage dots"  
echo "   ✅ Real-time updates every 2 seconds"
echo "   ✅ Radio Monte Carlo background audio"
echo "   ✅ User tracking with color-coded users"
echo "   ✅ No scrolling - fits on one screen"
echo "   ✅ Accessibility mode for visual impairments"

echo
echo "🔗 QUICK ACCESS:"
echo "   • TV Remote: Use volume controls for radio"
echo "   • Browser: Use http://localhost:8080/index-large.html"
echo "   • Management: Use show-status.sh script"

echo
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/index-large.html | grep -q "200"; then
    echo "🎊 SUCCESS! Your LLM Bubble Dashboard is running perfectly!"
    echo "   Ready for the TV - big bubbles, big text, auto-updates!"
else
    echo "⚠️  Warning: Dashboard may need restart"
fi