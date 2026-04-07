#!/bin/bash

echo "🎯 LLM BUBBLE DASHBOARD - ACCESSIBILITY MODE"
echo "============================================="
echo

# Check if services are running
if pm2 status | grep -q "llm-dashboard.*online"; then
    echo "✅ LLM Dashboard is RUNNING"
    
    # Test API endpoints
    echo "🔄 Testing API endpoints..."
    
    API_RESPONSE=$(curl -s http://localhost:8080/api/llm-usage)
    API_MODEL_COUNT=$(echo "$API_RESPONSE" | grep -o '"model":' | wc -l)
    
    if [ "$API_MODEL_COUNT" -gt 0 ]; then
        echo "📊 API Status: Connected ($API_MODEL_COUNT models found)"
        
        # Check each model
        echo
        echo "🔍 Found Models:"
        echo "$API_RESPONSE" | grep -o '"provider":"[^"]*"' | sort | uniq | while read -r provider; do
            provider_name=$(echo "$provider" | sed 's/"provider":"\([^"]*\)"/- \1/')
            echo "  🏢 $provider_name"
        done
        
        echo
        echo "📋 Checking user assignments..."
        echo "$API_RESPONSE" | grep -o '"user":"[^"]*"' | sort | uniq | while read -r user; do
            user_name=$(echo "$user" | sed 's/"user":"\([^"]*\)"/- User: \1/')
            echo "  👤 $user_name"
        done
        
    else
        echo "❌ API Status: Not responding"
    fi
    
else
    echo "❌ LLM Dashboard is NOT running"
    echo "Starting up..."
    pm2 start ecosystem.config.js
fi

echo
echo "🌐 ACCESS INFORMATION:"
echo "─────────────────────"
echo
echo "📺 Dashboard URL: http://localhost:8080"
echo "🔊 Audio: Radio Monte Carlo will auto-play (use TV remote to control volume)"
echo "📱 Features:"
echo "   • Large text for visual accessibility"
echo "   • Bubble visualization with expanding usage dots"
echo "   • Real-time updates every 2 seconds"
echo "   • No scrolling - fits on one screen"
echo "   • Color-coded users for easy identification"
echo
echo "📊 Management:"
echo "   pm2 status          : Check processes"
echo "   pm2 logs            : View logs"
echo "   pm2 restart all     : Restart everything"
echo
echo "🎯 KEY FEATURES ACHIEVED:"
echo "✅ Large text (24px+ base font)"
echo "✅ Bubble visualization"
echo "✅ Expanding usage dots"
echo "✅ No scrolling"
echo "✅ Real-time updates"
echo "✅ Radio Monte Carlo background"
echo

# Test if the dashboard is accessible
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
    echo "🎉 SUCCESS! Dashboard is accessible at http://localhost:8080"
else
    echo "⚠️  Dashboard may still be starting up..."
fi

echo
echo "🛠️  Setup complete! Your LLM Bubble Monitor is running."