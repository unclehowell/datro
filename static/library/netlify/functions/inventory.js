"use strict";
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '../../data');
const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');

function readInventory() {
  try {
    const raw = fs.readFileSync(inventoryPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeInventory(payload) {
  fs.writeFileSync(inventoryPath, JSON.stringify(payload, null, 2));
  return payload;
}

exports.handler = async function(event, context) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const inventory = readInventory();
  if (method === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory)
    };
  } else if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    // simple add/update: replace item with same id if present
    const id = body.id;
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing id' }) };
    }
    const idx = inventory.findIndex(i => i.id === id);
    if (idx >= 0) inventory[idx] = { ...inventory[idx], ...body };
    else inventory.push(body);
    writeInventory(inventory);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, item: body })
    };
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
};
