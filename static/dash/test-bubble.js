// Simple test to verify the bubble visualization works
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test that the bubble file was created
if (fs.existsSync('index-bubble.html')) {
    console.log('✅ Bubble visualization HTML file exists');
    
    const content = fs.readFileSync('index-bubble.html', 'utf8');
    
    // Check for key elements
    const checks = [
        { name: 'Company bubbles', pattern: /company-bubble/g },
        { name: 'Model squares', pattern: /model-square/g },
        { name: 'Usage fill', pattern: /model-fill/g },
        { name: 'Star ratings', pattern: /star-rating/g },
        { name: 'Tooltip', pattern: /tooltip/g },
        { name: 'Legend', pattern: /legend/g }
    ];
    
    checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches && matches.length > 0) {
            console.log(`✅ ${check.name}: Found ${matches.length} occurrences`);
        } else {
            console.log(`❌ ${check.name}: Not found`);
        }
    });
    
} else {
    console.log('❌ Bubble visualization file not found');
}

// Test server endpoints
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/llm-usage',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('✅ API endpoint /api/llm-usage working');
            console.log(`✅ Found ${jsonData.providers.length} providers`);
            const totalModels = jsonData.providers.reduce((sum, provider) => sum + provider.models.length, 0);
            console.log(`✅ Found ${totalModels} models total`);
        } catch (e) {
            console.log('❌ Failed to parse API response:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.log('❌ API test failed:', e.message);
});

req.setTimeout(5000);
req.end();

console.log('🎯 Test completed!');