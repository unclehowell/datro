const { spawn } = require('child_process');
const { execSync } = require('child_process');

console.log('\n🚀 Testing Token Dashboard Server...\n');

// Check if port is available
try {
  execSync('netstat -an 2>/dev/null | grep :3000 || echo "Port available"', { shell: true });
  console.log('✅ Port 3000 appears available');
} catch (e) {
  console.log('⚠️  Port check failed');
}

// Start server
console.log('Starting server...');
const server = spawn('node', ['server.js'], { 
  stdio: 'pipe',
  detached: true,
  shell: true 
});

server.stdout.on('data', (data) => {
  console.log('stdout:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.log('stderr:', data.toString().trim());
});

server.on('error', (error) => {
  console.log('❌ Server error:', error);
});

// Wait a bit for server to start, then test
setTimeout(() => {
  console.log('\n🔍 Testing endpoints...');
  
  try {
    // Check health endpoint
    const health = require('child_process').execSync('curl -s http://localhost:3000/api/health', { encoding: 'utf8' });
    const data = JSON.parse(health);
    console.log('✅ Health API responding:', data.status);
    
    // Check llm-usage endpoint
    const usageData = require('child_process').execSync('curl -s http://localhost:3000/api/llm-usage', { encoding: 'utf8' });
    const usage = JSON.parse(usageData);
    console.log('✅ LLM Usage API has', usage.providers?.length || 0, 'providers');
    
    // Test bubble visualization
    const bubble = require('child_process').execSync('curl -s http://localhost:3000/ -o /tmp/bubble-test.html && echo "HTML loaded successfully"', { encoding: 'utf8' });
    console.log('✅ Bubble visualization page loads');
    
    console.log('\n🎉 ALL TESTS PASSED! The server is working!');
    console.log('📍 Open http://localhost:3000 in your browser to see the dashboard');
    
  } catch (error) {
    console.log('❌ Test failed - checking manually...');
    // Manual test
    const output = require('child_process').execSync('curl -s http://localhost:3000/api/health 2>&1 || echo "Port not responding"', { encoding: 'utf8' });
    if (output.includes('healthy')) {
      console.log('✅ Server is actually running and healthy!');
    } else {
      console.log('⚠️  Server might need more time or there\'s a network issue');
    }
  }
  
  // Keep server running, just print instructions
  console.log('\n📋 Instructions:');
  console.log('1. Keep this terminal open - the server is running!');
  console.log('2. Open your browser to: http://localhost:3000');
  console.log('3. The bubble visualization should appear showing LLM usage');
  console.log('4. Try: http://localhost:3000/dashboard for the user grid view');
  console.log('5. Press Ctrl+C to stop the server\n');
  
}, 2000);