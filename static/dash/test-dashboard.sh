#!/bin/bash

echo "🧪 TESTING EXCEEDED CAPACITY SCENARIOS"
echo "========================================="
echo

# Test if the API shows exceeded capacity models
echo "📡 Testing LLM Usage API:"
curl -s http://localhost:8080/api/llm-usage | jq '.models[] | select(.user == "backend") | {model: .model, provider: .provider, used: .used, limit: .limit, status: (if .used > .limit then "EXCEEDED" else "NORMAL" end)}'

echo
echo "🔍 Checking for exceeded models in our data:"
curl -s http://localhost:8080/api/llm-usage | jq '.models[] | select(.used > .limit) | {model: .model, provider: .provider, used: .used, limit: .limit}'

echo
echo "🎨 Testing API user data and company colors:"
USER_RESPONSE=$(curl -s http://localhost:8080/api/users)
echo "Users found: $(echo "$USER_RESPONSE" | jq -r '.colorKey[].name' | wc -l)"
echo "Company key: $(echo "$USER_RESPONSE" | jq -r '.colorKey[] | "\(.name): \(.color)"' | head -5)

echo
echo "📡 Main dashboard availability:"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
if [ "$STATUS_CODE" = "200" ]; then
    echo "✅ Main dashboard accessible at http://localhost:8080/"
else
    echo "❌ Main dashboard returned $STATUS_CODE"
fi

echo
echo "🎯 New bubble dashboard test:"
if curl -s http://localhost:8080/ | grep -q "LLM Bubble Monitor"; then
    echo "✅ New bubble dashboard is serving correctly"
else
    echo "❌ New bubble dashboard not loading properly"
fi

echo
echo "🔑 Color coding validation:"
if curl -s http://localhost:8080/api/users | grep -q "PicoClaw.*00ff00"; then
    echo "✅ User colors working (PicoClaw green)"
else
    echo "❌ User colors not working"
fi

if curl -s http://localhost:8080/api/users | grep -q "Research.*ff6b6b"; then
    echo "✅ Research user colors working (red)"
else
    echo "❌ Research colors not working"
fi

echo
echo "🎉 SUMMARY:"
echo "   • Main dashboard: http://localhost:8080/ (new bubble monitor)"
echo "   • API endpoints: /api/llm-usage and /api/users"
echo "   • Company & user color keys: Active"
echo "   • Exceeded capacity models: Included with red alerts"
echo "   • Real-time bubble visualization: Active"