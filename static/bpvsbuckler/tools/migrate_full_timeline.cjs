#!/usr/bin/env node
/*
  Migration script: reads root data_corrected.json and outputs a TS file with TIMELINE data.
  Usage: node ./tools/migrate_full_timeline.cjs
  Note: This requires data_corrected.json to exist with the expected shape.
*/
const fs = require('fs');
const path = require('path');

function mapSpeakerToIcon(s) {
  if (!s) return 'worker';
  const n = String(s).toLowerCase();
  if (n.includes('judge') || n.includes('commission') || n.includes('solicitor') || n.includes('attorney') || n.includes('lawyer')) {
    return 'lawyer';
  }
  if (n.includes('priest') || n.includes('cleric') || n.includes('abbot') || n.includes('cadw')) {
    return 'cleric';
  }
  if (n.includes('archae') || n.includes('surveyor') || n.includes('builder')) {
    return 'builder';
  }
  if (n.includes('mary') || n.includes('williams') || n.includes('buckler')) {
    return 'farmer';
  }
  return 'worker';
}

function main() {
  const src = path.resolve(process.cwd(), 'data_corrected.json');
  if (!fs.existsSync(src)) {
    console.error('data_corrected.json not found at project root. Please provide the full dataset to proceed.');
    process.exit(1);
  }

  const raw = fs.readFileSync(src, 'utf8');
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse data_corrected.json:', e.message);
    process.exit(1);
  }

  const emptyAttachments = { gallery: [], legal: [], news: [], notes: [], report: [] };

  const entries = (Array.isArray(data.scenes) ? data.scenes : []).map((scene, idx) => {
    const year = String(scene.year ?? scene.scenes?.[0]?.year ?? idx + 1);
    const location = scene.location ?? '';
    const locationType = (scene.locationType ?? 'other');
    const narration = scene.narration ?? '';
    const blocks = (Array.isArray(scene.dialogue) ? scene.dialogue : []) || [];
    const scenesForTimeline = blocks.map((d, i) => ({
      character: d.speaker ?? 'Unknown',
      icon: mapSpeakerToIcon(d.speaker ?? ''),
      side: (i % 2 === 0) ? 'left' : 'right',
      color: '#999',
      text: d.line ?? '',
      position: { x: 0, y: 0 }
    }));

    const entry = {
      year: year,
      location: location,
      locationType: locationType,
      description: scene.description ?? '',
      narration: narration,
      scenes: scenesForTimeline,
      sources: [],
      attachments: emptyAttachments
    };
    return entry;
  });

  const outPath = path.resolve(__dirname, '../static/bpvsbuckler/timeline_from_json.generated.ts');
  const tsContent = `import type { TimelineEntry } from './types';\n\nexport const TIMELINE: TimelineEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

  // Ensure directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, tsContent, 'utf8');
  console.log('Wrote timeline_from_json.generated.ts with', entries.length, 'entries to', outPath);
}

main();
