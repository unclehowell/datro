#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const SITE_DIR = path.join(__dirname, '..');
const API_DIR = path.join(SITE_DIR, 'api');

const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const a1 = eval('(' + d.a1.replace(/^a1=/, '') + ')');

const yearLabel = y => y === 'present_day' ? 'Present Day' : y;
const today = new Date().toISOString().split('T')[0];

// ---- /api/timeline.json ----
fs.mkdirSync(API_DIR, { recursive: true });
const apiPayload = {
  title: 'Great House Farm Story — Timeline',
  description: 'The complete chronological account of the Williams-Buckler family and Great House Farm, Llandough, including HER record GGAT02038s.',
  total_entries: a1.length,
  last_updated: d.last_updated,
  version: d.version,
  summary: {
    earliest_year: a1.reduce((m, e) => e.year !== 'present_day' && e.year < m ? e.year : m, '9999'),
    latest_year: a1.reduce((m, e) => e.year !== 'present_day' && e.year > m ? e.year : m, '0'),
    subjects: ['Great House Farm', 'Williams family', 'Buckler family', 'Vaughan family', 'Bute Estate', 'BP Properties', 'Llandough', 'HER GGAT02038s'],
    key_events: [
      'C12-C14 pottery sherds confirm medieval occupation',
      'Vaughan family tenure from mid C16th to late C18th',
      'Bute Estate acquires freehold early C19th',
      'Medieval ironwork (armour) found under rear wing floor c.1880',
      '1974 survey in unusual circumstances — access blocked by ownership dispute',
      '1988 forced eviction and demolition by BP Properties Ltd on 6 December',
      'HER PRN 02038s independently corroborates controversial demolition',
      '1994 excavation reveals Roman villa and over 800 burials',
      'Reparations claim estimated at approximately 101.2 million'
    ]
  },
  entries: a1.map(e => ({
    year: e.year,
    location: e.location,
    locationType: e.locationType,
    description: e.description,
    narration: e.narration,
    scenes: (e.scenes || []).map(s => ({
      character: s.character,
      icon: s.icon,
      side: s.side,
      text: s.text
    })),
    sources: e.sources || [],
    attachments: e.attachments || {}
  }))
};
fs.writeFileSync(path.join(API_DIR, 'timeline.json'), JSON.stringify(apiPayload, null, 2));
console.log('api/timeline.json: ' + JSON.stringify(apiPayload).length + ' bytes');

// ---- /llms.txt ----
let llms = '# Great House Farm Story — LLMs.txt\n\n';
llms += '> The complete chronological account of the Williams-Buckler family and Great House Farm, Llandough, Vale of Glamorgan, Wales.\n';
llms += '> Includes the Glamorgan-Gwent Historic Environment Record PRN GGAT02038s\n';
llms += '> Structured JSON API: https://bpvsbuckler.datro.xyz/api/timeline.json\n\n';
llms += '## About\n\n';
llms += '800-year history of Great House Farm (Ty Mawr), Llandough: ';
llms += 'Williams family occupation (1667-1988), Vaughan family tenure (C16th-C18th), Bute Estate (C19th), ';
llms += 'disputed eviction and demolition by BP Properties Ltd on 6 December 1988, ';
llms += 'archaeological discoveries (Roman villa, 800+ burials). ';
llms += 'Reparations claim: ~101.2 million as of 2026.\n\n';
llms += '## Sources\n\n';
llms += '- GGAT HER PRN 02038s: https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s\n';
llms += '- RCAHMW Inventory Vol IV Part 2\n';
llms += '- BP Properties Ltd v Buckler & Anor (court records)\n\n';
llms += '## Full Timeline\n\n';

a1.forEach(e => {
  const y = yearLabel(e.year);
  llms += '### ' + y + ' — ' + e.location + '\n\n';
  if (e.description) llms += e.description + '\n';
  llms += e.narration + '\n\n';
  if (e.scenes && e.scenes.length) {
    e.scenes.forEach(s => { llms += '- **' + s.character + '**: ' + s.text + '\n'; });
    llms += '\n';
  }
  const notes = (e.attachments && e.attachments.notes) || [];
  const sources = e.sources || [];
  notes.forEach(n => llms += '- ' + n + '\n');
  if (notes.length) llms += '\n';
  sources.forEach(s => llms += '- Source: ' + s + '\n');
  if (sources.length) llms += '\n';
});

llms += '---\nFull structured data at https://bpvsbuckler.datro.xyz/api/timeline.json\n';
fs.writeFileSync(path.join(SITE_DIR, 'llms.txt'), llms);
console.log('llms.txt: ' + llms.length + ' bytes');

// ---- /robots.txt ----
const robots = 'User-agent: *\n' +
  'Allow: /\n' +
  'Allow: /api/\n' +
  'Sitemap: https://bpvsbuckler.datro.xyz/sitemap.xml\n' +
  '\n' +
  '# Full plain-text content for LLMs: https://bpvsbuckler.datro.xyz/llms.txt\n' +
  '# JSON API: https://bpvsbuckler.datro.xyz/api/timeline.json\n';
fs.writeFileSync(path.join(SITE_DIR, 'robots.txt'), robots);
console.log('robots.txt written');

// ---- /sitemap.xml ----
const uniqueYears = [...new Set(a1.map(e => e.year))].sort((a, b) => {
  if (a === 'present_day') return 1;
  if (b === 'present_day') return -1;
  return parseInt(a) - parseInt(b);
});

let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
sitemap += '  <url><loc>https://bpvsbuckler.datro.xyz/</loc><lastmod>' + today + '</lastmod><priority>1.0</priority></url>\n';
sitemap += '  <url><loc>https://bpvsbuckler.datro.xyz/api/timeline.json</loc><lastmod>' + today + '</lastmod><priority>0.9</priority></url>\n';
sitemap += '  <url><loc>https://bpvsbuckler.datro.xyz/llms.txt</loc><lastmod>' + today + '</lastmod><priority>0.8</priority></url>\n';
uniqueYears.forEach(y => {
  const label = y === 'present_day' ? 'present-day' : y;
  sitemap += '  <url><loc>https://bpvsbuckler.datro.xyz/?year=' + label + '</loc><lastmod>' + today + '</lastmod><priority>0.6</priority></url>\n';
});
sitemap += '</urlset>';
fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), sitemap);
console.log('sitemap.xml: ' + sitemap.length + ' bytes');
