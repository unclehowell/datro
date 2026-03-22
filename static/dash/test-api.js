const axios = require('axios');

async function testAPI() {
    const server = require('./server.js');
    
    setTimeout(async () => {
        try {
            console.log('Testing /api/health...');
            const health = await axios.get('http://localhost:3000/api/health');
            console.log('Health:', health.data);
            
            console.log('Testing /api/llm-usage...');
            const usage = await axios.get('http://localhost:3000/api/llm-usage');
            console.log('LLM usage:', JSON.stringify(usage.data, null, 2));
            
            console.log('All tests passed! 🚀');
        } catch (error) {
            console.log('Error:', error.message);
        } finally {
            process.exit(0);
        }
    }, 1000);
}

testAPI();