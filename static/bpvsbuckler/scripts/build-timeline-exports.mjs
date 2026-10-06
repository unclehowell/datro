// Rebuilds every agent-readable export of the story from src/data/timeline.ts,
// so the player, the JSON API, llms.txt, the static story page, the plain
// narration transcript and the sitemap never drift apart.
//
// Usage (from static/bpvsbuckler):
//   node scripts/build-timeline-exports.mjs [version] [date]
//
// Outputs:
//   api/timeline.json      structured events (id, ISO sort date, narration, voices, sources)
//   llms.txt               "Full Timeline" section regenerated
//   story/index.html       the whole story as static HTML with schema.org JSON-LD
//   story/transcript.txt   the narration script, one event after another
//   sitemap.xml            site map including one deep link per event
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://bpvsbuckler.bucklerfamily.estate';
const WIKI = 'https://greathousefarmwiki.wordpress.com';

const root = new URL('..', import.meta.url).pathname;
const src = readFileSync(root + 'src/data/timeline.ts', 'utf8');
const timeline = JSON.parse(src.slice(src.indexOf('= [') + 2, src.lastIndexOf(']') + 1));

// Guard: the story must be in strict chronological order with unique ids.
const ids = new Set();
timeline.forEach((e, i) => {
  if (!e.id || !e.date) throw new Error(`event ${i} (${e.year}) has no id/date`);
  if (ids.has(e.id)) throw new Error(`duplicate id ${e.id}`);
  ids.add(e.id);
  if (i && timeline[i - 1].date > e.date) {
    throw new Error(`out of order: ${timeline[i - 1].id} (${timeline[i - 1].date}) before ${e.id} (${e.date})`);
  }
});

const apiPath = root + 'api/timeline.json';
const api = JSON.parse(readFileSync(apiPath, 'utf8'));
const [version = api.version, date = api.last_updated] = process.argv.slice(2);
const label = (y) => (y === 'present_day' ? 'Present day' : y);
const isoDate = (d) => (d.startsWith('9999') ? null : d);
const playerUrl = (e) => `${SITE}/?event=${encodeURIComponent(e.id)}`;

// --- api/timeline.json --------------------------------------------------
const entries = timeline.map((e, i) => {
  const out = {
    order: i + 1,
    id: e.id,
    date: isoDate(e.date),
    year: e.year,
    location: e.location,
    locationType: e.locationType,
    description: e.description,
    narration: e.narration,
    scenes: e.scenes.map(({ character, icon, side, text }) => ({ character, icon, side, text })),
    sources: e.sources,
    attachments: e.attachments,
    url: playerUrl(e),
  };
  if (e.challenge) out.challenge = e.challenge;
  return out;
});
const years = timeline.map((e) => e.year).filter((y) => /\d/.test(y));
Object.assign(api, {
  title: 'Great House Farm Story — Timeline',
  description:
    'The complete story of the Williams/Buckler family and Great House Farm (Tŷ Mawr), Llandough, told event by event in strict chronological order, drawn from the Great House Farm Wiki evidence catalogue.',
  ordering: 'Entries are in strict chronological order by "date" (ISO 8601; null for present-day summaries, which come last).',
  source_of_truth: `${WIKI}/`,
  formats: {
    player: `${SITE}/`,
    story_html: `${SITE}/story/`,
    transcript: `${SITE}/story/transcript.txt`,
    llms: `${SITE}/llms.txt`,
  },
  total_entries: entries.length,
  last_updated: date,
  version,
  entries,
});
api.summary.earliest_year = years[0];
api.summary.latest_year = years[years.length - 1];
writeFileSync(apiPath, JSON.stringify(api, null, 2) + '\n');

// --- llms.txt -----------------------------------------------------------
const llmsPath = root + 'llms.txt';
const llms = readFileSync(llmsPath, 'utf8');
const head = llms.slice(0, llms.indexOf('## Full Timeline'));
const blocks = timeline.map((e, i) => {
  const d = isoDate(e.date);
  const lines = [`### ${i + 1}. ${label(e.year)} — ${e.location}`, '', `Event id: ${e.id}${d ? ` · Date: ${d}` : ''}`, '', e.narration, ''];
  if (e.challenge) lines.push(`> ${e.challenge}`, '');
  for (const c of e.scenes) lines.push(`- **${c.character}**: ${c.text}`);
  if (e.sources.length) lines.push(`- Source: ${e.sources.join('; ')}`);
  return lines.join('\n');
});
writeFileSync(
  llmsPath,
  head +
    `## Full Timeline\n\n${timeline.length} events, in strict chronological order.\n\n` +
    blocks.join('\n\n') +
    `\n\n---\nFull structured data at ${SITE}/api/timeline.json · Readable story at ${SITE}/story/\n`,
);

// --- story/index.html ---------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) =>
  esc(s).replace(/(https?:\/\/[^\s)]+|greathousefarmwiki\.wordpress\.com[^\s)]*)/g, (u) => {
    const href = u.startsWith('http') ? u : `https://${u}`;
    return `<a href="${href}">${u}</a>`;
  });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'The Great House Farm Story',
  description: api.description,
  url: `${SITE}/story/`,
  numberOfItems: timeline.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: timeline.map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Event',
      '@id': `${SITE}/story/#${e.id}`,
      name: `${label(e.year)} — ${e.location}`,
      ...(isoDate(e.date) ? { startDate: e.date } : {}),
      location: { '@type': 'Place', name: e.location },
      description: e.narration,
      url: playerUrl(e),
    },
  })),
};

let decade = '';
const sections = timeline
  .map((e, i) => {
    const d = isoDate(e.date);
    const dec = d ? (Number(d.slice(0, 4)) < 1800 ? 'Before 1800' : `${d.slice(0, 3)}0s`) : 'Today';
    const h = dec !== decade ? `<h2 id="${esc(dec.replace(/\s+/g, '-').toLowerCase())}">${esc(dec)}</h2>\n` : '';
    decade = dec;
    const voices = e.scenes.length
      ? `<ul class="voices">${e.scenes.map((c) => `<li><b>${esc(c.character)}:</b> ${esc(c.text)}</li>`).join('')}</ul>`
      : '';
    const challenge = e.challenge ? `<p class="challenge">${esc(e.challenge)}</p>` : '';
    const sources = e.sources.length
      ? `<p class="src">Sources: ${e.sources.map(linkify).join(' · ')}</p>`
      : '';
    return `${h}<article id="${e.id}">
<h3><span class="n">${i + 1}.</span> ${d ? `<time datetime="${d}">${esc(label(e.year))}</time>` : esc(label(e.year))} — ${esc(e.location)}</h3>
<p>${esc(e.narration)}</p>
${challenge}${voices}${sources}
<p class="play"><a href="${playerUrl(e)}">▶ Play from here</a></p>
</article>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Great House Farm Story — every event in order</title>
<meta name="description" content="${esc(api.description)}">
<link rel="canonical" href="${SITE}/story/">
<link rel="alternate" type="application/json" href="${SITE}/api/timeline.json" title="Timeline JSON">
<link rel="alternate" type="text/plain" href="${SITE}/llms.txt" title="llms.txt">
<link rel="alternate" type="text/plain" href="${SITE}/story/transcript.txt" title="Narration transcript">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<style>
:root{--bg:#fbf8f2;--fg:#1c1a17;--muted:#5d564c;--accent:#9a5b0c;--rule:#e2d9c8;--warn:#8b1e1e}
@media (prefers-color-scheme:dark){:root{--bg:#121110;--fg:#ece6dc;--muted:#a69d90;--accent:#f0a83a;--rule:#2c2925;--warn:#f08a8a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 Georgia,'Times New Roman',serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 80px}
header p{color:var(--muted)}a{color:var(--accent)}h1{font-size:1.9rem;line-height:1.2;margin:.2em 0}
h2{font-size:1.1rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-top:1px solid var(--rule);padding-top:1.2em;margin-top:2em}
h3{font-size:1.05rem;margin:1.4em 0 .3em}.n{color:var(--muted);font-weight:normal}
article{scroll-margin-top:16px}.voices{margin:.4em 0;padding-left:1.1em;color:var(--muted)}.voices li{margin:.15em 0}
.challenge{border-left:3px solid var(--warn);padding-left:10px;font-style:italic}.src{font-size:.85rem;color:var(--muted);overflow-wrap:anywhere}
.play{font-size:.9rem;margin:.2em 0 0}.cta{display:inline-block;background:var(--accent);color:var(--bg);padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold}
nav{font-size:.9rem;color:var(--muted)}
</style>
</head>
<body>
<main>
<header>
<p>Williams/Buckler Family Estate and Trust</p>
<h1>The Great House Farm Story</h1>
<p>${timeline.length} events, from c. AD 650 to today, in strict chronological order. Every event is drawn from the <a href="${WIKI}/">Great House Farm Wiki</a> evidence catalogue, where each document is shown in full.</p>
<p><a class="cta" href="${SITE}/">▶ Press play and listen to the story</a></p>
<nav>Also available as <a href="${SITE}/api/timeline.json">JSON</a> · <a href="${SITE}/llms.txt">llms.txt</a> · <a href="${SITE}/story/transcript.txt">plain transcript</a>. Updated ${esc(date)} (v${esc(version)}).</nav>
</header>
${sections}
</main>
</body>
</html>
`;
mkdirSync(root + 'story', { recursive: true });
writeFileSync(root + 'story/index.html', html);

// --- story/transcript.txt ----------------------------------------------
const transcript = [
  'THE GREAT HOUSE FARM STORY',
  `Narration script, ${timeline.length} events in strict chronological order. Source: ${WIKI}/`,
  '',
  ...timeline.map((e, i) => {
    const lines = [`${i + 1}. ${label(e.year).toUpperCase()} — ${e.location}`, '', `NARRATOR: ${e.narration}`];
    for (const c of e.scenes) lines.push(`${c.character}: ${c.text}`);
    return lines.join('\n') + '\n';
  }),
].join('\n');
writeFileSync(root + 'story/transcript.txt', transcript);

// --- sitemap.xml --------------------------------------------------------
const today = date;
const urls = [
  [`${SITE}/`, '1.0'],
  [`${SITE}/story/`, '0.9'],
  [`${SITE}/api/timeline.json`, '0.9'],
  [`${SITE}/llms.txt`, '0.8'],
  [`${SITE}/story/transcript.txt`, '0.7'],
  ...timeline.map((e) => [playerUrl(e), '0.5']),
];
writeFileSync(
  root + 'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([u, p]) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);

console.log(`exports rebuilt: ${entries.length} entries, v${version}, ${date}`);
