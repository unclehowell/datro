// Rebuilds every reader- and agent-facing export of the story from
// src/data/story.json (itself written by content/story_source.py), so the
// player, the script page, the JSON API, llms.txt, the transcript and the
// sitemap never drift apart.
//
// Usage (from static/bpvsbuckler):
//   node scripts/build-timeline-exports.mjs [version] [date]
//
// Outputs:
//   src/data/meta.json     release label shown in the player
//   api/timeline.json      acts, cast and scenes with evidence
//   llms.txt               "Full Timeline" section regenerated
//   story/index.html       the printable script (acts, cast, every scene)
//   story/transcript.txt   the narration script
//   sitemap.xml            site map with one deep link per scene
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://bpvsbuckler.bucklerfamily.estate';
const WIKI = 'https://greathousefarmwiki.wordpress.com';
const root = new URL('..', import.meta.url).pathname;
const story = JSON.parse(readFileSync(root + 'src/data/story.json', 'utf8'));
const { acts, cast, scenes, aliases, lanes } = story;
const movedLines = (s) => s.ledger.filter(([l]) => s.moved.includes(l)).map(([l, t]) => `${lanes[l]}: ${t}`);

// Guards: strict date order, unique ids, evidence on every scene.
const ids = new Set();
scenes.forEach((s, i) => {
  if (!s.id || !s.date) throw new Error(`scene ${i} has no id/date`);
  if (ids.has(s.id)) throw new Error(`duplicate id ${s.id}`);
  ids.add(s.id);
  if (i && scenes[i - 1].date > s.date) throw new Error(`out of order: ${scenes[i - 1].id} before ${s.id}`);
  if (!s.evidence?.length) throw new Error(`no evidence on ${s.id}`);
});

const metaPath = root + 'src/data/meta.json';
const prevMeta = JSON.parse(readFileSync(metaPath, 'utf8'));
const [version = prevMeta.version, date = prevMeta.updated] = process.argv.slice(2);
writeFileSync(metaPath, JSON.stringify({ version, updated: date }) + '\n');

const isoDate = (d) => (d.startsWith('9999') ? null : d);
const url = (s) => `${SITE}/?event=${encodeURIComponent(s.id)}`;
const actOf = (id) => acts.find((a) => a.id === id);
const PARCEL = { A: 'House parcel (A)', B: 'Fields (B)', AB: 'Whole farm (A + B)', '?': 'Not yet known', x: 'Not Great House Farm land', '': '' };
const castName = (id) => cast.find((c) => c.id === id).name;
const DESC =
  'The true story of the Williams/Buckler family and Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth, told scene by scene in date order, with the evidence for every scene. Each scene gives what happened, the received account and its wording, and what we now know; every scene links to its evidence on the Great House Farm Wiki.';

// --- api/timeline.json --------------------------------------------------
const entries = scenes.map((s) => ({
  order: s.no,
  ref: s.ref,
  id: s.id,
  act: s.act,
  date: isoDate(s.date),
  when: s.when,
  title: s.title,
  place: s.place,
  parcel: s.parcel,
  basis: s.basis,
  narration: s.narration,
  family_case: s.case,
  title_ledger: Object.fromEntries(s.ledger.map(([l, t]) => [lanes[l], t])),
  title_moves: s.moved.map((l) => lanes[l]),
  received_account: s.received,
  received_wording: s.received_words.map(([said, note]) => ({ said, note })),
  what_we_now_know: s.known,
  cast: s.cast,
  evidence: s.evidence.map((e) => (e.image ? { ...e, image: SITE + e.image } : e)),
  image: s.image ? SITE + s.image : null,
  previous_ids: s.aliases,
  url: url(s),
}));
writeFileSync(
  root + 'api/timeline.json',
  JSON.stringify(
    {
      title: 'Tŷ Mawr — The Great House Farm Story',
      description: DESC,
      ordering: 'Scenes are in strict date order by "date" (ISO 8601; null for the two present-day epilogue scenes, which come last). "ref" is act.scene, "order" the running number.',
      parcels: PARCEL,
      source_of_truth: `${WIKI}/`,
      formats: { player: `${SITE}/`, storyboard: `${SITE}/?view=storyboard`, cast: `${SITE}/?view=cast`, script: `${SITE}/story/`, transcript: `${SITE}/story/transcript.txt`, llms: `${SITE}/llms.txt` },
      version,
      last_updated: date,
      total_entries: entries.length,
      acts,
      cast: cast.map(({ match, ...c }) => c),
      redirects: aliases,
      entries,
    },
    null,
    2,
  ) + '\n',
);

// --- llms.txt -----------------------------------------------------------
const llmsPath = root + 'llms.txt';
const llms = readFileSync(llmsPath, 'utf8');
const about = llms.slice(llms.indexOf('## About'), llms.indexOf('## Full Timeline'));
const head = `# Tŷ Mawr — The Great House Farm Story — llms.txt

> The true story of the Williams/Buckler family and Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth, Vale of Glamorgan, Wales, in ${scenes.length} scenes across ${acts.length - 2} acts with a prologue and epilogue, in strict date order.
> Every scene is drawn from the Great House Farm Wiki evidence catalogue (${WIKI}/) and carries its evidence links.
> Structured JSON (acts, cast, scenes, evidence, stable ids): ${SITE}/api/timeline.json
> Printable script (static HTML, no JavaScript needed): ${SITE}/story/
> Storyboard: ${SITE}/?view=storyboard · Cast: ${SITE}/?view=cast · Any scene: ${SITE}/?event=<id>

`;
const blocks = scenes.map((s) => {
  const a = actOf(s.act);
  const lines = [`### ${s.ref} (${s.no}). ${s.when} — ${s.title}`, '', `${a.label}: ${a.title} · Scene id: ${s.id}${isoDate(s.date) ? ` · Date: ${s.date}` : ''} · Parcel: ${PARCEL[s.parcel] || 'n/a'} · Basis: ${s.basis}`, '', s.narration, ''];
  if (s.case) lines.push(`> The family's case: ${s.case}`, '');
  if (s.received) lines.push(`> The received account: ${s.received}`);
  for (const [q, m] of s.received_words) lines.push(`> Wording: ${q} — ${m}`);
  if (s.known) lines.push(`> What we now know: ${s.known}`);
  for (const m of movedLines(s)) lines.push(`> Title move — ${m}`);
  if (s.moved.length) lines.push('');
  for (const e of s.evidence) lines.push(`- ${e.type}: ${e.title} — ${e.url}`);
  return lines.join('\n');
});
writeFileSync(
  llmsPath,
  head + about + `## Full Timeline\n\n${scenes.length} scenes, in strict date order.\n\n` + blocks.join('\n\n') + `\n\n---\nStructured data: ${SITE}/api/timeline.json · Script: ${SITE}/story/\n`,
);

// --- story/index.html (the script) -----------------------------------------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tŷ Mawr — The Great House Farm Story',
  description: DESC,
  url: `${SITE}/story/`,
  numberOfItems: scenes.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: scenes.map((s) => ({
    '@type': 'ListItem',
    position: s.no,
    item: { '@type': 'Event', '@id': `${SITE}/story/#${s.id}`, name: `${s.when} — ${s.title}`, ...(isoDate(s.date) ? { startDate: s.date } : {}), location: { '@type': 'Place', name: s.place || 'Llandough' }, description: s.narration, url: url(s) },
  })),
};
const castHtml = cast
  .map((c) => {
    const refs = scenes.filter((s) => s.cast.includes(c.id)).map((s) => `<a href="#${s.id}">${s.ref}</a>`).join(', ');
    return `<div class="person"><h3>${esc(c.name)}${c.years ? ` <span>${esc(c.years)}</span>` : ''}</h3><p>${esc(c.role)}</p><p class="refs">Scenes: ${refs || '—'}</p></div>`;
  })
  .join('\n');
const contents = acts.map((a) => `<li><a href="#act-${a.id}">${esc(a.label)}: ${esc(a.title)}</a> <span>${esc(a.span)}</span></li>`).join('');
const actHtml = acts
  .map((a) => {
    const body = scenes
      .filter((s) => s.act === a.id)
      .map((s) => {
        const ev = s.evidence.map((e) => `<li><span class="k">${esc(e.type)}</span> <a href="${esc(e.url)}">${esc(e.title)}</a></li>`).join('');
        const img = s.image ? `<figure><img src="${esc(s.image)}" alt="" loading="lazy"></figure>` : '';
        const tags = [PARCEL[s.parcel], `Basis: ${s.basis}`, ...s.cast.map(castName)].filter(Boolean).map(esc).join(' · ');
        return `<article id="${s.id}" class="p-${s.parcel === '?' ? 'q' : s.parcel}">
<div class="slug"><b>${s.ref}</b> <span>${s.no}</span></div>
<div class="body">
<p class="when">${isoDate(s.date) ? `<time datetime="${s.date}">${esc(s.when)}</time>` : esc(s.when)}${s.place ? ` · ${esc(s.place)}` : ''}</p>
<h3>${esc(s.title)}</h3>
${img}<p class="narr">${esc(s.narration)}</p>
${s.case ? `<p class="case"><b>The family's case.</b> ${esc(s.case)}</p>` : ''}
${s.received ? `<p class="case"><b>The received account.</b> ${esc(s.received)}</p>` : ''}${s.received_words.map(([q, m]) => `<p class="case"><b>Wording: ${esc(q)}</b> ${esc(m)}</p>`).join('')}${s.known ? `<p class="case"><b>What we now know.</b> ${esc(s.known)}</p>` : ''}
${movedLines(s).map((m) => `<p class="case"><b>Title move.</b> ${esc(m)}</p>`).join('')}
<p class="tags">${tags}</p>
<ul class="ev">${ev}</ul>
<p class="play"><a href="${url(s)}">Open scene ${s.ref} in the player</a></p>
</div>
</article>`;
      })
      .join('\n');
    return `<section id="act-${a.id}"><header class="act"><p>${esc(a.label)} · ${esc(a.span)}</p><h2>${esc(a.title)}</h2><p class="log">${esc(a.logline)}</p></header>\n${body}</section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tŷ Mawr — script and scene list</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${SITE}/story/">
<link rel="alternate" type="application/json" href="${SITE}/api/timeline.json" title="Timeline JSON">
<link rel="alternate" type="text/plain" href="${SITE}/llms.txt" title="llms.txt">
<link rel="alternate" type="text/plain" href="${SITE}/story/transcript.txt" title="Narration transcript">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<style>
:root{--bg:#f4f3ef;--fg:#1f252b;--muted:#5c636a;--rule:#d6d4cc;--a:#4f8a3e;--b:#4277a8;--ab:#a8831f;--x:#8a8f94;--case:#e6eedf}
@media screen and (prefers-color-scheme:dark){:root{--bg:#232a31;--fg:#ecebe6;--muted:#b9b6ab;--rule:#3a4550;--a:#79a565;--b:#6b95bd;--ab:#c8a64e;--case:#2f3a2c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 'Instrument Sans',system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 20px 80px}a{color:inherit}
h1,h2,h3,.narr,.case,.log,.lede{font-family:Newsreader,Georgia,serif}
.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:14px}
h1{font-weight:300;font-size:64px;line-height:1;margin:28px 0 6px;letter-spacing:-.03em}.lede{font-size:20px;color:var(--muted);margin:0 0 20px;max-width:36em}
.toc{columns:2;padding-left:1.2em;font-size:15px}.toc span{color:var(--muted)}
.key{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--muted)}.key i{display:inline-block;width:14px;height:4px;margin-right:6px;vertical-align:middle}
h2.sec{font-weight:400;font-size:30px;margin:48px 0 8px;border-top:1px solid var(--rule);padding-top:24px}
.person{display:grid;grid-template-columns:230px 1fr;gap:4px 24px;padding:10px 0;border-top:1px solid var(--rule)}.person h3{margin:0;font-size:19px;font-weight:500;grid-row:span 2}.person h3 span{display:block;font:13px 'Instrument Sans',sans-serif;color:var(--muted)}.person p{margin:0}.refs{font-size:13px;color:var(--muted)}
.act{border-top:2px solid var(--fg);margin-top:56px;padding-top:14px}.act p{margin:0;color:var(--muted);font-size:14px}.act h2{font-weight:400;font-size:40px;margin:2px 0 4px;letter-spacing:-.01em}.act .log{font-style:italic;font-size:18px}
article{display:grid;grid-template-columns:64px 1fr;gap:16px;padding:22px 0;border-top:1px solid var(--rule);break-inside:avoid;scroll-margin-top:12px}
.slug{border-left:4px solid var(--x);padding-left:10px}.p-A .slug{border-color:var(--a)}.p-B .slug{border-color:var(--b)}.p-AB .slug{border-color:var(--ab)}
.slug b{display:block;font-family:Newsreader,serif;font-size:19px;font-weight:500}.slug span{font-size:12px;color:var(--muted)}
.when{margin:0;font-size:14px;color:var(--muted)}h3{font-size:24px;font-weight:400;margin:2px 0 8px;line-height:1.2}
.narr{font-size:19px;line-height:1.55;margin:0 0 12px}.case{background:var(--case);border-left:3px solid var(--a);padding:10px 14px;margin:0 0 12px;font-size:17px}
.tags{font-size:13px;color:var(--muted);margin:0 0 6px}.ev{list-style:none;padding:0;margin:0;font-size:14px}.ev li{margin:3px 0;overflow-wrap:anywhere}.ev .k{color:var(--muted)}
.play{font-size:13px;margin:8px 0 0}figure{margin:0 0 12px}figure img{max-width:100%;max-height:340px;border-radius:3px}
@media (max-width:640px){h1{font-size:44px}.toc{columns:1}.person{grid-template-columns:1fr}article{grid-template-columns:1fr;gap:6px}}
@media print{body{font-size:11pt;background:#fff;color:#000}main{max-width:none;padding:0}.play,.top a.btn{display:none}a{text-decoration:none}.ev a::after{content:" (" attr(href) ")";font-size:8pt;color:#555}section{break-before:page}figure img{max-height:6cm}}
</style>
</head>
<body>
<main>
<div class="top"><span>Williams/Buckler Family Estate and Trust · release ${esc(version)}, ${esc(date)}</span><span><a href="${SITE}/">Player</a> · <a href="${SITE}/?view=storyboard">Storyboard</a> · <a href="${SITE}/api/timeline.json">JSON</a> · <a href="${SITE}/story/transcript.txt">Transcript</a></span></div>
<h1>Tŷ Mawr</h1>
<p class="lede">The Great House Farm story: script and scene list. ${scenes.length} scenes in date order, from c. AD 650 to today, each with its evidence on the <a href="${WIKI}/">Great House Farm Wiki</a>. Cite scenes by reference (for example VI.9). Print this page for a paper copy; each act starts on a new page.</p>
<div class="key"><span><i style="background:var(--a)"></i>House parcel (A)</span><span><i style="background:var(--b)"></i>Fields (B)</span><span><i style="background:var(--ab)"></i>Whole farm (A + B)</span><span><i style="background:var(--x)"></i>Unknown, or not the farm</span></div>
<h2 class="sec">Contents</h2>
<ol class="toc">${contents}<li><a href="#cast">Cast</a></li></ol>
<h2 class="sec" id="cast">Cast</h2>
${castHtml}
${actHtml}
</main>
</body>
</html>
`;
mkdirSync(root + 'story', { recursive: true });
writeFileSync(root + 'story/index.html', html);

// --- story/transcript.txt ----------------------------------------------
const transcript = [
  'TŶ MAWR — THE GREAT HOUSE FARM STORY',
  `Narration script: ${scenes.length} scenes in date order. Release ${version}, ${date}. Source: ${WIKI}/`,
  '',
  ...acts.flatMap((a) => [
    `${a.label.toUpperCase()}: ${a.title.toUpperCase()} (${a.span})`,
    '',
    ...scenes.filter((s) => s.act === a.id).map((s) => [`${s.ref}  ${s.when.toUpperCase()} — ${s.title}${s.place ? ` (${s.place})` : ''}`, '', `NARRATOR: ${s.narration}`, ...(s.case ? [`THE FAMILY'S CASE: ${s.case}`] : []), ''].join('\n')),
  ]),
].join('\n');
writeFileSync(root + 'story/transcript.txt', transcript);

// --- sitemap.xml --------------------------------------------------------
const urls = [
  [`${SITE}/`, '1.0'], [`${SITE}/story/`, '0.9'], [`${SITE}/?view=storyboard`, '0.8'], [`${SITE}/?view=cast`, '0.6'],
  [`${SITE}/api/timeline.json`, '0.8'], [`${SITE}/llms.txt`, '0.7'], [`${SITE}/story/transcript.txt`, '0.6'],
  ...scenes.map((s) => [url(s), '0.5']),
];
writeFileSync(
  root + 'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([u, p]) => `  <url><loc>${esc(u)}</loc><lastmod>${date}</lastmod><priority>${p}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);

console.log(`exports rebuilt: ${scenes.length} scenes, ${acts.length} acts, ${version}, ${date}`);
