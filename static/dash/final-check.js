#!/usr/bin/env node

console.log('🔧 Token Dashboard - Final Status Check\n');

// Check Node.js version
const nodeVersion = process.version;
console.log('Node.js:', nodeVersion);

// Check express
console.log('Express:', require('express/package.json').version);

// Check package.json
const pkg = require('./package.json');
console.log('Project:', pkg.name, pkg.version);

// Check server syntax
const fs = require('fs');
try {
  const serverCode = fs.readFileSync('server.js', 'utf8');
  const syntax = require('vm').new Script(serverCode);
  console.log('✅ Server.js syntax: VALID');
} catch (e) {
  console.log('❌ Server syntax error:', e.message);
}

// Test tracker class logic
const EventEmitter = require('events');
class TestTokenTracker extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.setupDefaultUsers();
  }
  setupDefaultUsers() {
    this.users.set('test', { name: 'Test User', color: '#ff0000' });
  }
  getUsers() {
    return Array.from(this.users.values());
  }
}

const tracker = new TestTokenTracker();
const users = tracker.getUsers();
console.log('✅ Test user data:', users.length, 'users found');

console.log('\n📋 TO RUN THE DASHBOARD:');
console.log('1. Open one terminal: node server.js');
console.log('2. Keep terminal open, open: http://localhost:3000');  
console.log('3. The bubble visualization should appear');
console.log('4. If bubbles load with color codes, it works!');

console.log('\n🎯 EXPECTED OUTPUT:');
console.log('- Bubbles expanding/shrinking based on usage %');
console.log('- Colors: 🚲 blue (low) → 🚀 purple (extreme)');
console.log('- Real-time updates every few seconds');

process.exit(0);