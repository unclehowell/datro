#!/usr/bin/env node
/**
 * Honcho Memory Bridge — External Scaffolding Integration
 * Syncs Honcho observations to flywheel KV for persistence
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const HONCHO_ENDPOINT = process.env.HONCHO_API_ENDPOINT || 'https://api.honcho.dev/api/honcho/messages';
const FLYWHEEL_ENDPOINT = process.env.FLYWHEEL_ENDPOINT || 'https://datro-flywheel.unclehowell.workers.dev';
const BRAIN_ENDPOINT = process.env.BRAIN_ENDPOINT || 'https://cnei.datro.xyz/api/brain';

async function syncHonchoToBrain(branch, honchoToken) {
  const workspace = getHonchoWorkspace(branch);
  
  try {
    const res = await fetch(`${HONCHO_ENDPOINT}?workspace=${workspace}&limit=50`, {
      headers: { 'Authorization': `Bearer ${honchoToken}` }
    });
    
    if (!res.ok) throw new Error(`HONCHO ${res.status}`);
    
    const messages = await res.json();
    const lessons = (Array.isArray(messages) ? messages : []).map(m => ({
      text: m.content || m.text,
      ts: m.timestamp || Date.now(),
      branch,
      source: 'honcho'
    }));
    
    // Push to brain endpoint
    for (const lesson of lessons.slice(-10)) {
      await fetch(`${BRAIN_ENDPOINT}/remember/${branch}/honcho_${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson)
      });
    }
    
    return { synced: lessons.length, branch };
  } catch (e) {
    console.error(`Honcho sync failed: ${e.message}`);
    return { synced: 0, error: e.message };
  }
}

function getHonchoWorkspace(branch) {
  const workspaces = JSON.parse(
    readFileSync('./flywheel-cf/brain-api/scaffolding-manifest.json', 'utf-8')
  ).honchoIntegration.workspaces;
  return workspaces[branch] || workspaces.cnei || 'datro-flywheel-brain';
}

async function exportBrainMemory(branch, outputPath) {
  const manifest = JSON.parse(
    readFileSync('./flywheel-cf/brain-api/scaffolding-manifest.json', 'utf-8')
  );
  const endpoint = manifest.apiEndpoints?.brainMemory?.replace('{branch}', branch) || `${BRAIN_ENDPOINT}/memory/${branch}`;
  
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Brain export ${res.status}`);
  
  const memory = await res.json();
  const content = typeof memory === 'string' 
    ? memory 
    : `# Brain Memory: ${branch}\n\n${JSON.stringify(memory, null, 2)}`;
  
  if (outputPath) {
    writeFileSync(outputPath, content);
    return `Exported to ${outputPath}`;
  }
  return content;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , command, arg] = process.argv;
  
  if (command === 'sync-honcho' && arg) {
    const result = await syncHonchoToBrain(arg, process.env.HONCHO_API_KEY);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'export-brain' && arg) {
    const output = process.argv[3] || `./brain-wiki/${arg}/MEMORY.md`;
    const result = await exportBrainMemory(arg, output);
    console.log(result);
  }
}

export { syncHonchoToBrain, exportBrainMemory, getHonchoWorkspace };