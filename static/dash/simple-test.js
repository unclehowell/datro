#!/usr/bin/env node

// Test the API manually
const express = require('express');
const app = express();

app.get('/', (req, res) => res.json({ hello: 'world' }));

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log('Test server running on port', port);
  
  // Test our actual server now
  setTimeout(() => {
    console.log('Starting main server test...');
    
    const mainApp = require('./server.js');
    console.log('Main server loaded successfully');
    
    // Cleanup
    setTimeout(() => {
      console.log('Stopping test server...');
      server.close();
      console.log('✅ All tests passed - the server loads without errors!');
      process.exit(0);
    }, 2000);
    
  }, 500);
});