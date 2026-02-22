"use strict";
const fs = require('fs');
const path = require('path');
const inventoryPath = path.join(process.cwd(), 'data', 'exceptions.json');

function readExceptions() {
  try { return JSON.parse(fs.readFileSync(inventoryPath, 'utf8')); } catch { return []; }
}

function writeExceptions(payload) {
  fs.writeFileSync(inventoryPath, JSON.stringify(payload, null, 2));
  return payload;
}

exports.handler = async function(event, context) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const items = readExceptions();
  if (method === 'GET') {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) };
  }
  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const id = body.id || ('ex-' + Date.now());
    body.id = id;
    items.push(body);
    writeExceptions(items);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, exception: body }) };
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
};
