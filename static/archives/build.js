#!/usr/bin/env node
const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const ARCHIVES_DIR = join(__dirname, '.');
const manifest = [];

// List all .md and .pdf files
function scan(dir, base = '') {
  try {
    for (const item of readdirSync(join(ARCHIVES_DIR, dir), { withFileTypes: true })) {
      const rel = base ? `${base}/${item.name}` : item.name;
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'functions') {
        scan(join(dir, item.name), rel);
      } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.pdf'))) {
        manifest.push(rel);
      }
    }
  } catch {}
}

scan('.');

writeFileSync(join(ARCHIVES_DIR, '_archives_manifest.json'), JSON.stringify({
  deployed_files: manifest,
  built_at: new Date().toISOString(),
  file_count: manifest.length
}, null, 2));

console.log(`Manifest created: ${manifest.length} files`);
