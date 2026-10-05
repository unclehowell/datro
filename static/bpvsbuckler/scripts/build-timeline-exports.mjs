// Rebuilds api/timeline.json and the "Full Timeline" section of llms.txt
// from src/data/timeline.ts, so the three never drift apart.
// Usage (from static/bpvsbuckler): node scripts/build-timeline-exports.mjs [version] [date]
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const src = readFileSync(root + 'src/data/timeline.ts', 'utf8');
const timeline = JSON.parse(src.slice(src.indexOf('= [') + 2, src.lastIndexOf(']') + 1));

const apiPath = root + 'api/timeline.json';
const api = JSON.parse(readFileSync(apiPath, 'utf8'));
const [version = api.version, date = api.last_updated] = process.argv.slice(2);

// --- api/timeline.json --------------------------------------------------
const entries = timeline.map((e) => {
  const out = {
    year: e.year,
    location: e.location,
    locationType: e.locationType,
    description: e.description,
    narration: e.narration,
    scenes: e.scenes.map(({ character, icon, side, text }) => ({ character, icon, side, text })),
    sources: e.sources,
    attachments: e.attachments,
  };
  if (e.challenge) out.challenge = e.challenge;
  return out;
});
const years = timeline.map((e) => e.year).filter((y) => /\d/.test(y));
Object.assign(api, {
  total_entries: entries.length,
  last_updated: date,
  version,
  entries,
});
api.summary.earliest_year = years[0];
api.summary.latest_year = years[years.length - 1];
writeFileSync(apiPath, JSON.stringify(api, null, 2));

// --- llms.txt -----------------------------------------------------------
const llmsPath = root + 'llms.txt';
const llms = readFileSync(llmsPath, 'utf8');
const head = llms.slice(0, llms.indexOf('## Full Timeline'));
const foot = llms.slice(llms.lastIndexOf('\n---\n'));
const label = (y) => (y === 'present_day' ? 'Present Day' : y);
const blocks = timeline.map((e) => {
  const lines = [`### ${label(e.year)} — ${e.location}`, '', e.narration, ''];
  if (e.challenge) lines.push(`> ${e.challenge}`, '');
  for (const c of e.scenes) lines.push(`- **${c.character}**: ${c.text}`);
  if (e.sources.length) lines.push(`- Source: ${e.sources.join('; ')}`);
  return lines.join('\n');
});
writeFileSync(llmsPath, head + '## Full Timeline\n\n' + blocks.join('\n\n') + '\n' + foot);

console.log(`exports rebuilt: ${entries.length} entries, v${version}, ${date}`);
