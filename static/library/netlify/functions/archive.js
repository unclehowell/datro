"use strict";
const fs = require('fs');
const path = require('path');

function readInventory() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'inventory.json'), 'utf8'));
  } catch { return []; }
}

function writeOuttray(items) {
  const outtrayPath = path.join(process.cwd(), 'data', 'outtray.json');
  fs.writeFileSync(outtrayPath, JSON.stringify(items, null, 2));
  return items;
}

function addToOuttray(item) {
  const current = readOuttray();
  current.push(item);
  writeOuttray(current);
  return current;
}

function readOuttray() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'outtray.json'), 'utf8')); } catch { return []; }
}

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body || '{}');
  const versionId = body.version || 'latest';
  const inventory = readInventory();
  // find item by id if provided
  const item = inventory.find(i => i.id === body.id);
  if (!item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'item not found' }) };
  }
  // mark as archived and push to outtray
  item.status = 'archived';
  if (!item.archived_path) {
    item.archived_path = item.path + '.pdf';
  }
  // write back inventory (to reflect status)
  fs.writeFileSync(path.join(process.cwd(), 'data', 'inventory.json'), JSON.stringify(inventory, null, 2));
  // add to outtray
  addToOuttray({ id: item.id, path: item.archive_path || item.archived_path, target_version: versionId, timestamp: new Date().toISOString() });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, item, outtray: readOuttray() })
  };
};
