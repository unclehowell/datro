#!/usr/bin/env node
/**
 * Agent Bootstrap — External Scaffolding Loader
 * Usage: agent-bootstrap.js <branch> [options]
 * 
 * Loads configuration and memory from cnei branch endpoint
 * Provides unified interface for any CLI/IDE agent
 */

import { createInterface } from 'readline';
import { readFileSync } from 'fs';

const MANIFEST_URL = 'https://cnei.datro.xyz/api/brain/scaffolding-manifest.json';
const BRAIN_BASE = 'https://cnei.datro.xyz/api/brain';

async function loadScaffolding(branch, options = {}) {
  const manifest = await fetchManifest(options.manifest || MANIFEST_URL);
  const branchConfig = manifest.branches[branch] || manifest.defaultScaffolding;
  
  // Load memory context
  const memories = await fetchMemory(branch, options.limit || 50);
  const lessons = await fetchLessons(branch, 10);
  
  return {
    branch,
    ...branchConfig,
    scaffold: manifest,
    memories,
    lessons,
    honcho: manifest.honchoIntegration
  };
}

async function fetchManifest(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error(`Failed to fetch manifest: ${e.message}`);
    return getLocalManifest();
  }
}

function getLocalManifest() {
  try {
    return JSON.parse(readFileSync('./flywheel-cf/brain-api/scaffolding-manifest.json', 'utf-8'));
  } catch {
    return {
      defaultScaffolding: {
        memoryEndpoint: `${BRAIN_BASE}/memory/{branch}`,
        honchoWorkspace: 'datro-flywheel-brain',
        model: 'gpt-4o-mini',
        defaultTools: ['read_file', 'write_file', 'search_code']
      },
      honchoIntegration: {
        endpoint: 'https://api.honcho.dev/api/honcho/messages'
      }
    };
  }
}

async function fetchMemory(branch, limit) {
  try {
    const res = await fetch(`${BRAIN_BASE}/memory/${branch}?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return findLocalMemory(branch);
  }
}

async function fetchLessons(branch, limit) {
  try {
    const res = await fetch(`${BRAIN_BASE}/lessons/${branch}?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function findLocalMemory(branch) {
  try {
    const brainPath = `./brain-wiki/${branch}/MEMORY.md`;
    return readFileSync(brainPath, 'utf-8');
  } catch {
    return '';
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , branch, action] = process.argv;
  if (!branch) {
    console.log('Usage: agent-bootstrap.js <branch> [action]');
    console.log('Actions: config, memory, lessons, all');
    process.exit(1);
  }
  
  const scaffold = await loadScaffolding(branch);
  
  if (action === 'config') {
    console.log(JSON.stringify(scaffold.scaffolding, null, 2));
  } else if (action === 'memory') {
    console.log(JSON.stringify(scaffold.memories, null, 2));
  } else if (action === 'lessons') {
    console.log(JSON.stringify(scaffold.lessons, null, 2));
  } else {
    console.log(JSON.stringify(scaffold, null, 2));
  }
}

export { loadScaffolding, fetchMemory, fetchLessons };