import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import story from './data/story.json';
import meta from './data/meta.json';
import type { Story, Scene, CaseQuestion, SceneQA } from './data/story.d';

const S = story as unknown as Story;
const scenes = S.scenes;
const SITE = 'https://bpvsbuckler.bucklerfamily.estate';
const actOf = (id: string) => S.acts.find((a) => a.id === id)!;
const PARCEL: Record<string, [string, string]> = {
  A: ['A', 'House parcel (A)'],
  B: ['B', 'Fields (B)'],
  AB: ['AB', 'Whole farm (A + B)'],
  '?': ['q', 'Parcel not yet known'],
  x: ['x', 'Not Great House Farm land'],
  '': ['', ''],
};

type View = 'splash' | 'scene' | 'board' | 'cast' | 'questions';
function readUrl(): { view: View; index: number } {
  try {
    const q = new URLSearchParams(location.search);
    const v = q.get('view');
    if (v === 'storyboard') return { view: 'board', index: 0 };
    if (v === 'cast') return { view: 'cast', index: 0 };
    if (v === 'questions') return { view: 'questions', index: 0 };
    let id = q.get('event');
    if (id) {
      id = (S.aliases as Record<string, string>)[id] || id;
      const i = scenes.findIndex((s) => s.id === id);
      if (i >= 0) return { view: 'scene', index: i };
    }
    const y = q.get('year');
    if (y) {
      const i = scenes.findIndex((s) => s.date.startsWith(y) || s.when.includes(y));
      if (i >= 0) return { view: 'scene', index: i };
    }
  } catch (_e) { /* no URL */ }
  return { view: 'splash', index: 0 };
}
const sceneUrl = (s: Scene) => `${SITE}/?event=${s.id}`;
const speakable = (t: string) =>
  t.replace(/Tŷ Mawr/g, 'Tee Mower').replace(/Llandough/g, 'Lan-dock')
   .replace(/WGR/g, 'W G R').replace(/GGAT/g, 'G GAT').replace(/LJ\b/g, 'Lord Justice');

// What the narrator reads, in order: the event, then the received account and
// what we now know. Labels are spoken but not shown as highlighted text.
type Seg = { key: string; text: string; show: boolean };
const segmentsOf = (s: Scene): Seg[] => [
  { key: 'head', text: `${s.when}. ${s.title}.`, show: false },
  { key: 'event', text: s.narration, show: true },
  ...(s.received ? [{ key: 'rl', text: 'The received account.', show: false }, { key: 'received', text: s.received, show: true }] : []),
  ...(s.known ? [{ key: 'kl', text: 'What we now know.', show: false }, { key: 'known', text: s.known, show: true }] : []),
];
const wordsOf = (t: string) => t.split(/\s+/).filter(Boolean);
function segmentBases(s: Scene) {
  const base: Record<string, number> = {};
  let n = 0;
  for (const g of segmentsOf(s)) { base[g.key] = n; n += wordsOf(g.text).length; }
  return base;
}

const Icon = {
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" /></svg>,
  prev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>,
  next: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7" /></svg>,
};

export default function App() {
  const init = useMemo(readUrl, []);
  const [view, setView] = useState<View>(init.view);
  const [index, setIndex] = useState(init.index);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [spoken, setSpoken] = useState(-1);
  const [copied, setCopied] = useState(false);
  const scene = scenes[index];
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // URL <-> state
  useEffect(() => {
    const q = view === 'scene' ? `?event=${scene.id}` : view === 'board' ? '?view=storyboard' : view === 'cast' ? '?view=cast' : view === 'questions' ? '?view=questions' : '';
    if (location.search !== q) history.replaceState(null, '', location.pathname + q);
    document.title = view === 'scene' ? `${scene.ref} ${scene.title} — Tŷ Mawr` : 'Tŷ Mawr — The Great House Farm Story';
  }, [view, index]);
  useEffect(() => {
    const on = () => { const r = readUrl(); setView(r.view); setIndex(r.index); };
    addEventListener('popstate', on);
    return () => removeEventListener('popstate', on);
  }, []);

  const go = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(scenes.length - 1, i)));
    setView('scene');
    setCopied(false);
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, []);
  const open = (v: View) => { history.pushState(null, '', location.pathname); setPlaying(false); setView(v); };

  // narration
  useEffect(() => {
    const synth = window.speechSynthesis;
    synth?.cancel();
    setSpoken(-1);
    if (view !== 'scene' || !playing || !synth) return;
    // speak word by word so highlighting can map the engine's position back to
    // the displayed words, even where pronunciation fixes change the spelling
    const toks = segmentsOf(scene).flatMap((g) => wordsOf(g.text)).map(speakable);
    const starts: number[] = [];
    let at = 0;
    for (const t of toks) { starts.push(at); at += t.length + 1; }
    const u = new SpeechSynthesisUtterance(toks.join(' '));
    u.lang = 'en-GB'; u.rate = 0.95; u.volume = volume;
    const voice = synth.getVoices().find((v) => v.lang === 'en-GB');
    if (voice) u.voice = voice;
    u.onboundary = (e) => {
      if (e.name !== 'word') return;
      let lo = 0, hi = starts.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= e.charIndex) lo = mid; else hi = mid - 1; }
      setSpoken(lo);
    };
    let t: ReturnType<typeof setTimeout>;
    u.onend = () => { setSpoken(1e9); t = setTimeout(() => { if (!playingRef.current) return; if (index < scenes.length - 1) go(index + 1); else setPlaying(false); }, 900); };
    const s = setTimeout(() => synth.speak(u), 250);
    return () => { clearTimeout(s); clearTimeout(t); synth.cancel(); };
  }, [view, index, playing, volume]);

  // keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (view !== 'scene' || (e.target as HTMLElement).closest('input, button, a, [role="dialog"]')) return;
      if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [view, index, go]);

  if (view === 'splash') return <Splash onPlay={() => { go(0); setPlaying(true); }} onBoard={() => setView('board')} onCast={() => setView('cast')} />;

  const act = actOf(scene.act);
  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); open('splash'); }}>Tŷ Mawr<small>The Great House Farm story</small></a>
        <div className="where">{view === 'scene' && <><b>{act.label}: {act.title}</b> ({act.span})</>}</div>
        <nav className="tabs" aria-label="Views">
          <button className="tab" aria-current={view === 'scene' ? 'page' : undefined} onClick={() => go(index)}>Play</button>
          <button className="tab" aria-current={view === 'board' ? 'page' : undefined} onClick={() => open('board')}>Storyboard</button>
          <button className="tab" aria-current={view === 'cast' ? 'page' : undefined} onClick={() => open('cast')}>Cast</button>
          <button className="tab" aria-current={view === 'questions' ? 'page' : undefined} onClick={() => open('questions')}>Questions</button>
          <a className="tab" href="/story/">Script</a>
          <a className="tab" href="/control/">Records</a>
        </nav>
      </header>
      <main className="main">
        {view === 'scene' && <SceneView scene={scene} spoken={playing ? spoken : -1} copied={copied} onCopy={() => {
          navigator.clipboard?.writeText(`Tŷ Mawr, scene ${scene.ref} (no. ${scene.no}), "${scene.title}", ${scene.when}. ${sceneUrl(scene)}`).then(() => setCopied(true), () => setCopied(false));
        }} onCast={() => open('cast')} onPick={go} />}
        {view === 'board' && <Board onPick={go} />}
        {view === 'cast' && <Cast onPick={go} />}
        {view === 'questions' && <Questions onPick={go} />}
      </main>
      {view === 'scene' && (
        <footer className="transport">
          <div className="acts" role="group" aria-label="Scenes by act">
            {S.acts.map((a) => {
              const list = scenes.map((s, i) => [s, i] as const).filter(([s]) => s.act === a.id);
              return (
                <div key={a.id} className="actseg" style={{ flex: list.length }}>
                  <span className="lbl">{a.label === 'Prologue' || a.label === 'Epilogue' ? a.label : a.label.replace('Act ', '')} {a.title}</span>
                  {list.map(([s, i]) => (
                    <button key={s.id} className={`tick${i === index ? ' on' : i < index ? ' seen' : ''}`} title={`${s.ref} ${s.when}: ${s.title}`} aria-label={`Scene ${s.ref}, ${s.title}`} onClick={() => go(i)} />
                  ))}
                </div>
              );
            })}
          </div>
          <label className="voice"><span>Voice</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(+e.target.value)} aria-label="Narration volume" /></label>
          <div className="ctl">
            <button onClick={() => go(index - 1)} aria-label="Previous scene" disabled={index === 0}>{Icon.prev}</button>
            <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause narration' : 'Play narration'}>{playing ? Icon.pause : Icon.play}</button>
            <button onClick={() => go(index + 1)} aria-label="Next scene" disabled={index === scenes.length - 1}>{Icon.next}</button>
          </div>
          <div className="count">{scene.no} of {scenes.length}</div>
        </footer>
      )}
    </div>
  );
}

function ParcelChip({ p }: { p: string }) {
  const [cls, label] = PARCEL[p] || PARCEL[''];
  if (!label) return null;
  return <span className="chip"><i className={`p-${cls}`} />{label}</span>;
}

function Frame({ scene, small }: { scene: Scene; small?: boolean }) {
  const [cls] = PARCEL[scene.parcel] || PARCEL[''];
  const img = scene.image;
  const photo = img && /cadw/.test(img);
  const year = scene.when.replace(/^(Today)$/, 'Today');
  if (small) return (
    <div className="pf">
      {img ? <img src={img} alt="" loading="lazy" /> : <div className="yr">{year.length > 22 ? scene.date.slice(0, 4).replace(/^0/, 'c. ') : year}</div>}
      <span className={`parcelbar p-${cls}`} />
    </div>
  );
  const cap = img ? scene.evidence.find((e) => e.image === img)?.title : '';
  return (
    <figure className={`frame${photo ? ' photo' : ''}`} style={{ margin: 0 }}>
      {img ? <img src={img} alt={cap || scene.title} /> : (
        <div className="card"><div className="yr">{year}</div><div className="pl">{scene.place}</div></div>
      )}
      <span className={`parcelbar p-${cls}`} />
      {cap && <figcaption>{cap}</figcaption>}
    </figure>
  );
}

function SceneView({ scene, spoken, copied, onCopy, onCast, onPick }: { scene: Scene; spoken: number; copied: boolean; onCopy: () => void; onCast: () => void; onPick: (i: number) => void }) {
  const base = segmentBases(scene);
  const cast = S.cast.filter((c) => scene.cast.includes(c.id));
  return (
    <article className="scene">
      <Stage key={scene.id} scene={scene} onPick={onPick} />
      <div>
        <div className="slate"><span className="ref">Scene {scene.ref}</span><span>no. {scene.no} of {scenes.length}</span></div>
        <div className="when">{scene.when}</div>
        <h1>{scene.title}</h1>
        {scene.place && <div className="place">{scene.place}</div>}
        <SlideMediaGallery scene={scene} />
        <p className={`narr${spoken >= 0 ? ' speaking' : ''}`}><Spoken text={scene.narration} base={base.event} spoken={spoken} /></p>
        <div className="chips">
          <ParcelChip p={scene.parcel} />
          <span className="chip">Basis: {scene.basis}</span>
          <span className={`chip grade g-${scene.grade}`} title={scene.grade_text}><i />{GRADE[scene.grade]}</span>
          {cast.map((c) => <button key={c.id} className="chip" onClick={onCast}>{c.name}</button>)}
        </div>
        <Accounts scene={scene} base={base} spoken={spoken} />
        <SceneQuestions scene={scene} />
        {scene.case && <section className="case"><h2>The family's case</h2><p>{scene.case}</p></section>}
        <Ledger scene={scene} />
        <Replies items={scene.qa} />
        <section className="ev">
          <h2>Evidence ({scene.evidence.length})</h2>
          <ul>
            {scene.evidence.map((e, i) => (
              <li key={i}><a href={e.url} target="_blank" rel="noopener noreferrer">
                <span className="thumb" style={e.image ? { backgroundImage: `url("${e.image}")` } : undefined}>{e.image ? '' : e.type.split(' ')[0]}</span>
                <span className="t">{e.title}<span className="k">{e.type}</span></span>
              </a></li>
            ))}
          </ul>
        </section>
        <div className="cite">
          <button onClick={onCopy}>{copied ? 'Reference copied' : 'Copy reference'}</button>
          <span>Cite as scene {scene.ref} · permanent link ?event={scene.id}</span>
        </div>
      </div>
    </article>
  );
}


type ArchiveMediaRow = {
  name?: string;
  path?: string;
  tags?: string[];
  title?: string | { rendered?: string };
  caption?: string | { rendered?: string };
  alt_text?: string;
  slug?: string;
  source_url?: string;
  media_type?: string;
  mime_type?: string;
  date?: string;
};
type MediaCatalog = { waybackImages: ArchiveMediaRow[]; waybackVideos: ArchiveMediaRow[]; wikiMedia: ArchiveMediaRow[] };
type SlideMediaItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  kind: 'image' | 'video';
  poster?: string;
  score: number;
};
const WAYBACK_MEDIA_BASE = 'https://wayback.bucklerfamily.estate';
const WIKI_MEDIA_API = 'https://greathousefarmwiki.wordpress.com/wp-json/wp/v2/media';
const MEDIA_WORD_STOP = new Set([
  'the','and','for','from','with','into','onto','this','that','what','when','where','which','while','after','before','during','through',
  'were','was','are','been','being','have','has','had','will','would','could','should','their','there','they','them','then','than',
  'not','but','you','your','his','her','she','him','our','out','one','two','three','four','five','six','all','any','some','each',
  'great','house','farm','farmhouse','llandough','mawr','ty','site','story','scene','year','years','date','event','record','records',
  'document','documents','family','people','home','land','title','case','court','official','evidence','source','news','wales','south'
]);
function mediaPlainText(value?: string | { rendered?: string }): string {
  const raw = typeof value === 'string' ? value : (value && value.rendered) || '';
  return raw.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}
function mediaWords(value: string): string[] {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !MEDIA_WORD_STOP.has(word));
}
function absoluteWaybackUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return WAYBACK_MEDIA_BASE + '/' + path.replace(/^\/+/, '').replace(/^wayback\//, '');
}
function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE).toString();
}
function archiveRowText(row: ArchiveMediaRow, wiki = false): string {
  const mediaPath = row.path || (row.source_url ? row.source_url.split('/').pop() : '') || '';
  return [
    row.name, mediaPath, row.slug, row.alt_text, mediaPlainText(row.title), mediaPlainText(row.caption),
    (!wiki && row.date) || ''
  ].filter(Boolean).join(' ');
}
function mediaYearMatch(text: string, year: string): boolean {
  if (!year || year === '0000' || year === '9999') return false;
  return new RegExp('(^|[^0-9])' + year + '([^0-9]|$)').test(text);
}
function rankArchiveMedia(scene: Scene, row: ArchiveMediaRow, wiki = false): { score: number; relevant: boolean } {
  const text = archiveRowText(row, wiki);
  const lower = text.toLowerCase();
  const tokens = new Set(mediaWords(text));
  const primaryYear = (scene.date || '').slice(0, 4);
  const listedYears = (scene.when || '').match(/\b(?:1[0-9]{3}|20[0-9]{2})\b/g) || [];
  const primaryMatch = mediaYearMatch(lower, primaryYear);
  const otherYearMatch = listedYears.some((year) => year !== primaryYear && mediaYearMatch(lower, year));
  const titleTerms = [...new Set(mediaWords(scene.title))];
  const placeTerms = [...new Set(mediaWords(scene.place || ''))];
  const contextTerms = [...new Set(mediaWords((scene.narration || '') + ' ' + (scene.known || '')))].slice(0, 36);
  const titleHits = titleTerms.filter((word) => tokens.has(word)).length;
  const placeHits = placeTerms.filter((word) => tokens.has(word)).length;
  const contextHits = contextTerms.filter((word) => tokens.has(word)).length;
  const tagged = (row.tags || []).some((tag) => tag.toLowerCase() === 'bpvsbuckler');
  let score = primaryMatch ? 12 : (otherYearMatch ? 5 : 0);
  score += titleHits * 7 + placeHits * 2.5 + Math.min(4, contextHits) * 1.1 + (tagged ? 1 : 0);
  const relevant = primaryMatch || (otherYearMatch && (titleHits > 0 || placeHits > 0 || contextHits > 0 || tagged))
    || titleHits > 0 || placeHits >= 2 || contextHits >= 2;
  return { score, relevant };
}
function archiveMediaTitle(row: ArchiveMediaRow): string {
  const rich = mediaPlainText(row.title) || mediaPlainText(row.caption) || row.alt_text || row.name || row.path || 'Archived media';
  const cleaned = rich.replace(/[_]+/g, ' ').replace(/\b(?:bpvsbuckler|consortium|en|v\d+(?:[.-]\d+)*)\b/gi, ' ')
    .replace(/^\s*\d{4}[- _]\d{2}[- _]\d{2}\s*/, '').replace(/\s+/g, ' ').trim();
  return cleaned || 'Archived media';
}
function videoPoster(row: ArchiveMediaRow, images: ArchiveMediaRow[]): string | undefined {
  const path = (row.path || row.source_url || row.name || '').split('/').pop() || '';
  const tokens = [...new Set(mediaWords(path))].filter((word) => !/^\d+$/.test(word));
  let best: { row: ArchiveMediaRow; score: number } | undefined;
  for (const image of images) {
    const imageText = archiveRowText(image).toLowerCase();
    if (!/thumbnail|poster|preview/i.test(imageText)) continue;
    const imageTokens = new Set(mediaWords(imageText));
    const score = tokens.filter((word) => imageTokens.has(word)).length;
    if (!best || score > best.score) best = { row: image, score };
  }
  return best && best.score >= 2 && best.row.path ? absoluteWaybackUrl(best.row.path) : undefined;
}
function videoEmbedUrl(url: string): string | undefined {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? 'https://www.youtube-nocookie.com/embed/' + match[1] : undefined;
}

function SlideMediaGallery({ scene }: { scene: Scene }) {
  const [catalog, setCatalog] = useState<MediaCatalog>({ waybackImages: [], waybackVideos: [], wikiMedia: [] });
  const [selection, setSelection] = useState({ sceneId: '', index: 0 });
  const [lightboxItem, setLightboxItem] = useState<SlideMediaItem | null>(null);

  useEffect(() => {
    let live = true;
    const getRows = async (url: string): Promise<ArchiveMediaRow[]> => {
      try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
        if (!response.ok) return [];
        const data: unknown = await response.json();
        return Array.isArray(data) ? data as ArchiveMediaRow[] : [];
      } catch (_error) {
        return [];
      }
    };
    const run = async () => {
      const wikiFields = 'per_page=100&_fields=slug,source_url,alt_text,caption,title,media_type,mime_type,date,link';
      const results = await Promise.all([
        getRows(WAYBACK_MEDIA_BASE + '/images/_treeview.json'),
        getRows(WAYBACK_MEDIA_BASE + '/video/_treeview.json'),
        getRows(WIKI_MEDIA_API + '?' + wikiFields + '&media_type=image'),
        getRows(WIKI_MEDIA_API + '?' + wikiFields + '&media_type=video')
      ]);
      if (live) setCatalog({
        waybackImages: results[0],
        waybackVideos: results[1],
        wikiMedia: [...results[2], ...results[3]]
      });
    };
    void run();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxItem(null);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [lightboxItem]);

  const items = useMemo(() => {
    const found: SlideMediaItem[] = [];
    const used = new Set<string>();
    const add = (item: SlideMediaItem) => {
      if (!item.url || used.has(item.url)) return;
      used.add(item.url);
      found.push(item);
    };

    if (scene.image) {
      const linked = scene.evidence.find((entry) => entry.image === scene.image);
      add({
        id: 'scene-image-' + scene.id,
        url: absoluteSiteUrl(scene.image),
        title: linked?.title || scene.title,
        source: 'Scene image',
        kind: 'image',
        score: 10000
      });
    }
    scene.evidence.forEach((entry, index) => {
      if (entry.image) add({
        id: 'evidence-image-' + scene.id + '-' + index,
        url: absoluteSiteUrl(entry.image),
        title: entry.title || scene.title,
        source: entry.type || 'Scene evidence',
        kind: 'image',
        score: 9000 - index
      });
      if (entry.url && /(?:youtube\.com|youtu\.be|\.mp4(?:$|\?)|\.webm(?:$|\?)|\.mov(?:$|\?))/i.test(entry.url)) {
        const embed = videoEmbedUrl(entry.url);
        const isVideo = !!embed || /\.(?:mp4|webm|mov)(?:$|\?)/i.test(entry.url);
        add({
          id: 'evidence-video-' + scene.id + '-' + index,
          url: entry.url,
          title: entry.title || scene.title,
          source: entry.type || 'Scene evidence',
          kind: isVideo ? 'video' : 'image',
          poster: embed ? 'https://img.youtube.com/vi/' + ((entry.url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1] || '') + '/hqdefault.jpg' : undefined,
          score: 8500 - index
        });
      }
    });

    const archiveImages = catalog.waybackImages;
    for (const row of archiveImages) {
      if (!row.path) continue;
      const rank = rankArchiveMedia(scene, row);
      if (!rank.relevant) continue;
      add({
        id: 'wayback-image-' + row.path,
        url: absoluteWaybackUrl(row.path),
        title: archiveMediaTitle(row),
        source: 'Wayback media library',
        kind: 'image',
        score: rank.score
      });
    }
    for (const row of catalog.waybackVideos) {
      if (!row.path) continue;
      const rank = rankArchiveMedia(scene, row);
      if (!rank.relevant) continue;
      add({
        id: 'wayback-video-' + row.path,
        url: absoluteWaybackUrl(row.path),
        poster: videoPoster(row, archiveImages),
        title: archiveMediaTitle(row),
        source: 'Wayback video archive',
        kind: 'video',
        score: rank.score + 0.25
      });
    }
    for (const row of catalog.wikiMedia) {
      const url = row.source_url || row.path || '';
      if (!url) continue;
      const rank = rankArchiveMedia(scene, row, true);
      if (!rank.relevant) continue;
      const isVideo = row.media_type === 'video' || /^video\//i.test(row.mime_type || '') || /\.(?:mp4|webm|mov)(?:$|\?)/i.test(url);
      add({
        id: 'wiki-media-' + url,
        url,
        title: archiveMediaTitle(row),
        source: 'Great House Farm Wiki',
        kind: isVideo ? 'video' : 'image',
        score: rank.score
      });
    }
    return found.sort((a, b) => b.score - a.score).slice(0, 12);
  }, [scene, catalog]);

  const selectedIndex = selection.sceneId === scene.id
    ? Math.min(selection.index, Math.max(0, items.length - 1)) : 0;
  const current = items[selectedIndex] || null;
  const selectItem = (next: number) => {
    if (!items.length) return;
    setSelection({ sceneId: scene.id, index: (next + items.length) % items.length });
  };

  useEffect(() => {
    if (!current) return;
    const thumb = document.querySelector('[data-smg-thumb="' + selectedIndex + '"]');
    thumb?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [scene.id, selectedIndex, current ? current.id : '']);

  return (
    <section className="slide-media-gallery" aria-label="Media matching this scene">
      <div className="smg-heading">
        <div>
          <div className="smg-kicker">Media for this scene</div>
          <div className="smg-date">{scene.when}</div>
        </div>
        {items.length > 0 && (
          <div className="smg-nav" aria-label="Browse scene media">
            <button type="button" onClick={() => selectItem(selectedIndex - 1)} disabled={items.length < 2} aria-label="Previous media">‹</button>
            <span aria-live="polite">{selectedIndex + 1} / {items.length}</span>
            <button type="button" onClick={() => selectItem(selectedIndex + 1)} disabled={items.length < 2} aria-label="Next media">›</button>
          </div>
        )}
      </div>
      {current ? (
        <>
          <div className="smg-feature">
            <button type="button" className="smg-open" onClick={() => setLightboxItem(current)} aria-label={'Open full-screen: ' + current.title}>
              {current.poster || current.kind === 'image' ? (
                <img src={current.poster || current.url} alt={current.title} loading="lazy" />
              ) : (
                <span className="smg-video-plate"><b>▶</b><span>Video</span></span>
              )}
              {current.kind === 'video' && <span className="smg-play-mark" aria-hidden="true">▶</span>}
            </button>
            <button type="button" className="smg-fullscreen" onClick={() => setLightboxItem(current)} aria-label={'View ' + current.title + ' full-screen'}>⤢ Full screen</button>
          </div>
          <div className="smg-caption">
            <strong>{current.title}</strong>
            <span>{current.source}</span>
            <a href={current.url} target="_blank" rel="noopener noreferrer">Open original media ↗</a>
          </div>
          {items.length > 1 && (
            <div className="smg-thumbs" aria-label="Choose a media thumbnail">
              {items.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  data-smg-thumb={index}
                  className={'smg-thumb' + (index === selectedIndex ? ' active' : '')}
                  aria-pressed={index === selectedIndex}
                  aria-label={'Show media ' + (index + 1) + ': ' + item.title}
                  title={item.title}
                  onClick={() => selectItem(index)}
                >
                  {item.poster || item.kind === 'image'
                    ? <img src={item.poster || item.url} alt="" loading="lazy" />
                    : <span className="smg-thumb-video">▶</span>}
                  {item.kind === 'video' && <span className="smg-thumb-tag">VIDEO</span>}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="smg-empty">
          No indexed image or video is directly matched to this scene yet. Media for other dated scenes will appear automatically as its archive index becomes available.
        </div>
      )}
      {lightboxItem && (
        <div className="lightbox smg-lightbox" role="dialog" aria-modal="true" aria-label={lightboxItem.title} onClick={() => setLightboxItem(null)}>
          <figure onClick={(event) => event.stopPropagation()}>
            {lightboxItem.kind === 'video' ? (
              videoEmbedUrl(lightboxItem.url) ? (
                <iframe
                  className="smg-video-player"
                  src={videoEmbedUrl(lightboxItem.url) + '?autoplay=1&rel=0'}
                  title={lightboxItem.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video className="smg-video-player" src={lightboxItem.url} poster={lightboxItem.poster} controls autoPlay playsInline />
              )
            ) : (
              <img src={lightboxItem.url} alt={lightboxItem.title} />
            )}
            <figcaption>
              <strong>{lightboxItem.title}</strong>
              <span>{lightboxItem.source}</span>
              <a href={lightboxItem.url} target="_blank" rel="noopener noreferrer">Open original media ↗</a>
            </figcaption>
          </figure>
          <button className="lb-close" onClick={() => setLightboxItem(null)} aria-label="Close full-screen media">×</button>
        </div>
      )}
    </section>
  );
}

function Board({ onPick }: { onPick: (i: number) => void }) {
  return (
    <div className="sheet">
      <h1>Storyboard</h1>
      <p className="intro">Every event in date order, one panel each. Each scene gives what happened, the received account of it, and what we now know, with the evidence. Pick a panel to open it.</p>
      <h2 className="sl-head">The storyline</h2>
      <p className="intro">One title buried, one built beside it. Each dot is a move; pick one to open the scene.</p>
      <Storyline onPick={onPick} />
      <div className="legend">
        <span><i className="p-A" />House parcel (A)</span><span><i className="p-B" />Fields (B)</span>
        <span><i className="p-AB" />Whole farm (A + B)</span><span><i className="p-x" />Unknown, or not the farm</span>
      </div>
      {S.acts.map((a) => (
        <section key={a.id}>
          <div className="acthead">
            <div className="n">{a.label}<br /><span style={{ fontSize: 14 }}>{a.span}</span></div>
            <div><h2>{a.title}</h2><p>{a.logline}</p></div>
          </div>
          <div className="grid">
            {scenes.map((s, i) => s.act !== a.id ? null : (
              <button key={s.id} className="panel" onClick={() => onPick(i)}>
                <Frame scene={s} small />
                <div className="meta"><span><i className={`gdot g-${s.grade}`} title={GRADE[s.grade]} />{s.ref}</span><span>{s.when.length > 26 ? s.date.slice(0, 4) : s.when}</span></div>
                <div className="ti">{s.title}</div>
                <div className="ex">{s.narration}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Cast({ onPick }: { onPick: (i: number) => void }) {
  return (
    <div className="cast">
      <h1>Cast</h1>
      <p className="intro">The people, companies, courts and public bodies in the record, and the scenes they appear in.</p>
      {S.cast.map((c) => {
        const in_ = scenes.map((s, i) => [s, i] as const).filter(([s]) => s.cast.includes(c.id));
        return (
          <div className="person" key={c.id}>
            <div><h2>{c.name}</h2>{c.years && <div className="yrs">{c.years}</div>}</div>
            <div>
              <p>{c.role}</p>
              <div className="chips">{in_.map(([s, i]) => <button key={s.id} className="chip" onClick={() => onPick(i)} title={s.title}>{s.ref}</button>)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- the grand storyline: the true Parcel A, the synthetic Parcel A forged
// beside it, Parcel B, and the 1987 merger (after the family's diagram)
const LANE_Y: Record<string, number> = { W: 92, A: 34, S: 92, B: 150, M: 124 };
const LANE_CLASS: Record<string, string> = { W: 'ln-w', A: 'ln-a', S: 'ln-s', B: 'ln-b', M: 'ln-m' };
const XS: [number, number][] = [[600, 0], [1550, 30], [1877, 120], [1916, 210], [1949, 290], [1990, 860], [2027, 1000]];
const yearOf = (d: string) => (d.startsWith('99') ? 2026.6 : +d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12);
function X(y: number) {
  const v = Math.max(XS[0][0], Math.min(XS[XS.length - 1][0], y));
  for (let i = 1; i < XS.length; i++) {
    const [y0, x0] = XS[i - 1], [y1, x1] = XS[i];
    if (v <= y1) return 20 + (x0 + ((v - y0) / (y1 - y0)) * (x1 - x0)) * 0.96;
  }
  return 980;
}
function Storyline({ current, onPick, compact }: { current?: number; onPick: (i: number) => void; compact?: boolean }) {
  const x = X;
  const marks = scenes.flatMap((s, i) => s.moved.map((lane) => ({ s, i, lane })));
  const cur = current !== undefined ? scenes[current] : null;
  const ticks = [1877, 1916, 1928, 1950, 1962, 1975, 1987, 1994, 2026];
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // on narrow screens the diagram scrolls; bring this scene's marker into view
    const el = scroller.current;
    if (!el || !cur || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (x(yearOf(cur.date)) / 1000) * el.scrollWidth - el.clientWidth / 2;
  }, [current]);
  return (
    <figure className={`storyline${compact ? ' compact' : ''}`} style={{ margin: 0 }}>
      <div className="sl-scroll" ref={scroller}>
        <svg viewBox="0 0 1000 205" role="img" aria-label="Storyline: the true Parcel A title is buried while a synthetic Parcel A is built beside it and merged into Parcel B in 1987">
          {/* one farm, split in 1877 */}
          <path className="ln ln-w" d={`M${x(600)} 92 H${x(1877) - 14}`} />
          <path className="ln ln-a" d={`M${x(1877) - 14} 92 C${x(1877)} 92 ${x(1877) - 6} 34 ${x(1877) + 10} 34 H${x(1950)}`} />
          <path className="ln ln-a buried" d={`M${x(1950)} 34 H${x(2027)}`} />
          <path className="ln ln-b" d={`M${x(1877) - 14} 92 C${x(1877)} 92 ${x(1877) - 6} 150 ${x(1877) + 10} 150 H${x(1987) - 10}`} />
          {/* the synthetic Parcel A: a description in 1916, a construct from 1949, merged in 1987 */}
          <path className="ln ln-s seed" d={`M${x(1916) - 24} 150 C${x(1916) - 10} 150 ${x(1916) - 18} 92 ${x(1916)} 92 H${x(1949)}`} />
          <path className="ln ln-s" d={`M${x(1949)} 92 H${x(1987) - 10} C${x(1987) + 4} 92 ${x(1987)} 124 ${x(1987) + 14} 124`} />
          <path className="ln ln-b" d={`M${x(1987) - 10} 150 C${x(1987) + 4} 150 ${x(1987)} 124 ${x(1987) + 14} 124`} />
          <path className="ln ln-m" d={`M${x(1987) + 14} 124 H${x(2027)}`} />
          <text className="sl-lbl" x={x(600) + 2} y={82}>Great House: one farm</text>
          <text className="sl-lbl a" x={x(1877) + 14} y={24}>Parcel A: the true title (Bute → Thomas → Williams)</text>
          <text className="sl-lbl a" x={x(1950) + 6} y={52}>deeds taken 1950 · buried, never extinguished</text>
          <text className="sl-lbl s" x={x(1949) + 6} y={82}>Synthetic Parcel A: six attempts to make Mary look permitted, then deed and register</text>
          <text className="sl-lbl b" x={x(1877) + 14} y={168}>Parcel B: the fields (Bute → WGR → BP)</text>
          <text className="sl-lbl m" x={x(2027)} y={114} textAnchor="end">merged 1987: "A &amp; B"</text>
          {ticks.map((t) => (
            <g key={t} className="tick-y"><line x1={x(t)} x2={x(t)} y1={180} y2={185} /><text x={x(t)} y={198}>{t}</text></g>
          ))}
          {cur && <line className="sl-now" x1={x(yearOf(cur.date))} x2={x(yearOf(cur.date))} y1={10} y2={178} />}
          {marks.map(({ s, i, lane }) => (
            <circle key={s.id + lane} className={`mk ${LANE_CLASS[lane]}${current === i ? ' on' : ''}`}
              cx={x(yearOf(s.date))} cy={LANE_Y[lane]} r={current === i ? 7 : 4.5}
              onClick={() => onPick(i)} tabIndex={compact ? -1 : 0}
              onKeyDown={(e) => { if (e.key === 'Enter') onPick(i); }}>
              <title>{`${s.ref} ${s.when}: ${s.title}`}</title>
            </circle>
          ))}
        </svg>
      </div>
    </figure>
  );
}

function Spoken({ text, base, spoken }: { text: string; base: number; spoken: number }) {
  return <>{wordsOf(text).map((w, i) => <span key={i} className={`w${base + i <= spoken ? ' done' : ''}`}>{w}{' '}</span>)}</>;
}

// The scene's stage: the two-titles storyline with this scene marked, and the
// scene's picture as a picture-in-picture thumbnail that opens full size.
function Stage({ scene, onPick }: { scene: Scene; onPick: (i: number) => void }) {
  const ev = scene.evidence.find((e) => e.image && e.image === scene.image) || scene.evidence.find((e) => e.image);
  const img = scene.image || ev?.image || null;
  const cap = ev?.title || scene.title;
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setBig(false); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [big]);
  return (
    <div className={`stage${img ? ' has-pip' : ''}`}>
      <div className="stage-h">The two titles to Parcel A <span>· this scene marked</span></div>
      <Storyline current={scene.no - 1} onPick={onPick} />
      {img && (
        <button className="pip" onClick={() => setBig(true)} aria-label={`Enlarge: ${cap}`}>
          <img src={img} alt={cap} />
          <span>Enlarge</span>
        </button>
      )}
      {big && img && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cap} onClick={() => setBig(false)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={img} alt={cap} />
            <figcaption>{cap}</figcaption>
          </figure>
          <button className="lb-close" onClick={() => setBig(false)} aria-label="Close">×</button>
        </div>
      )}
    </div>
  );
}

function Accounts({ scene, base, spoken }: { scene: Scene; base: Record<string, number>; spoken: number }) {
  if (!scene.received && !scene.received_words.length && !scene.known) return null;
  return (
    <>
      {(scene.received || scene.received_words.length > 0) && (
        <section className="acct recv" aria-label="The received account">
          <h2>The received account</h2>
          {scene.received && <p className={spoken >= 0 ? 'speaking' : ''}><Spoken text={scene.received} base={base.received} spoken={spoken} /></p>}
          {scene.received_words.length > 0 && (
            <dl>{scene.received_words.map(([q, m]) => (<React.Fragment key={q}><dt>{q}</dt><dd>{m}</dd></React.Fragment>))}</dl>
          )}
        </section>
      )}
      {scene.known && (
        <section className="acct known" aria-label="What we now know">
          <h2>What we now know</h2>
          <p className={spoken >= 0 ? 'speaking' : ''}><Spoken text={scene.known} base={base.known} spoken={spoken} /></p>
        </section>
      )}
    </>
  );
}

function Ledger({ scene }: { scene: Scene }) {
  if (!scene.ledger.length) return null;
  return (
    <section className="ledger" aria-label="The titles after this scene">
      <h2>The titles after this scene</h2>
      {scene.ledger.map(([lane, text]) => (
        <div key={lane} className={`lrow${scene.moved.includes(lane) ? ' moved' : ''}`}>
          <i className={LANE_CLASS[lane]} />
          <div><b>{S.lanes[lane]}{scene.moved.includes(lane) && <span className="tag">moves here</span>}</b><span>{text}</span></div>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- the Q&A graph
// Every scene now carries an evidence grade, the case questions it turns on and
// the replies from records bodies that bear on it. All of it is generated by
// content/graph/build_graph.py from the correspondence and the case questions.
const GRADE: Record<string, string> = {
  documented: 'Documented', 'single-source': 'Single source', 'family-account': 'Family account',
  contested: 'Contested', argument: 'Argument',
};
const STATUS: Record<string, string> = {
  documented: 'Documented', corroborated: 'Corroborated', 'family-account': 'Family account only',
  contested: 'Contested', open: 'Open', 'not-held': 'Searched for, not held',
};
const KIND: Record<string, string> = {
  provided: 'Records provided', partial: 'Some provided, some not held', 'not-held': 'Not held', refused: 'Refused / exemption',
  redirected: 'Pointed elsewhere', 'reasonably-accessible': 'Available elsewhere (s.21)', pending: 'Acknowledged',
  reply: 'Reply', unanswered: 'No reply yet', auto: 'Automatic reply',
};
const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function SceneQuestions({ scene }: { scene: Scene }) {
  if (!scene.questions.length) return null;
  return (
    <section className="cq" aria-label="The question this scene turns on">
      <h2>{scene.questions.length > 1 ? 'The questions this scene turns on' : 'The question this scene turns on'}</h2>
      {scene.questions.map((q) => (
        <div key={q.id} className="cqi">
          <div className="cqh"><b>{q.question}</b><span className={`st s-${q.status}`}>{STATUS[q.status]}</span></div>
          <p>{q.answer}</p>
          {q.next.length > 0 && <div className="nx"><span>Still to find</span><ul>{q.next.slice(0, 4).map((n) => <li key={n}>{n}</li>)}</ul></div>}
        </div>
      ))}
      <a className="more" href={`/?view=questions#${scene.questions[0].id}`}>All the case questions</a>
    </section>
  );
}

function QA({ x }: { x: SceneQA }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`qa k-${x.kind}`}>
      <button className="qah" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="who">{x.party_name}</span>
        <span className="kd">{KIND[x.kind] || x.kind}</span>
        <span className="dt">{fmtDate(x.answered || x.asked)}</span>
      </button>
      <div className="qq">{x.question.replace(/^Reply received: /, '')}</div>
      <div className={`qaa${open ? ' open' : ''}`}>{x.answer || 'No reply yet.'}</div>
      {x.url && <a className="src" href={x.url} target="_blank" rel="noopener noreferrer">Source{x.ref ? ` · ${x.ref}` : ''}</a>}
    </li>
  );
}

function Replies({ items }: { items: SceneQA[] }) {
  if (!items.length) return null;
  return (
    <section className="replies" aria-label="What the records bodies say">
      <h2>What the records bodies say ({items.length})</h2>
      <ul>{items.map((x) => <QA key={x.id} x={x} />)}</ul>
    </section>
  );
}

type Hit = SceneQA & { scenes?: string[]; case_questions?: string[] };
function Questions({ onPick }: { onPick: (i: number) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const idx = (id: string) => scenes.findIndex((s) => s.id === id);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (h) document.getElementById(h)?.scrollIntoView();
  }, []);
  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/ask?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setHits(j.qa || []);
    } catch (_e) { setHits([]); }
    setBusy(false);
  };
  const g = S.graph;
  return (
    <div className="sheet questions">
      <h1>The case questions</h1>
      <p className="intro">Each question the story turns on, with the best answer the evidence now gives, what supports it, what cuts against it, and what is still to find. Built from {g.messages} emails with {g.parties} bodies: {g.qa} questions and answers, {g.answered} with a reply.</p>
      <form className="ask" onSubmit={ask} role="search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every question and answer, e.g. 1877, Daniel Thomas, WA240304, Suggett" aria-label="Search the questions and answers" />
        <button type="submit" disabled={busy}>{busy ? 'Searching' : 'Search'}</button>
      </form>
      {hits && (
        <section className="replies hits">
          <h2>{hits.length ? `${hits.length} answers` : 'No answers found'}</h2>
          <ul>{hits.map((x) => <QA key={x.id} x={x} />)}</ul>
        </section>
      )}
      {S.case_questions.map((c: CaseQuestion) => (
        <section key={c.id} id={c.id} className="cqcard">
          <div className="cqh"><h2>{c.question}</h2><span className={`st s-${c.status}`}>{STATUS[c.status]}</span></div>
          <p className="ans">{c.answer}</p>
          <div className="fa">
            {c.for.length > 0 && <div><span>Supports the family's account</span><ul>{c.for.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {c.against.length > 0 && <div><span>Cuts against it, or not yet reconciled</span><ul>{c.against.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {c.next.length > 0 && <div><span>Still to find</span><ul>{c.next.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
          <div className="scl">{c.scenes.map((id) => { const i = idx(id); return i < 0 ? null : (
            <button key={id} className="chip" onClick={() => onPick(i)}>{scenes[i].ref} {scenes[i].title}</button>); })}
            <span className="n">{c.qa_count} related answers in the correspondence</span></div>
        </section>
      ))}
    </div>
  );
}

function Splash({ onPlay, onBoard, onCast }: { onPlay: () => void; onBoard: () => void; onCast: () => void }) {
  const [btc, setBtc] = useState(false);
  useEffect(() => {
    if (document.querySelector('script[data-stripe]')) return;
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/buy-button.js'; s.async = true; s.dataset.stripe = '1';
    document.head.appendChild(s);
  }, []);
  const evidence = scenes.reduce((n, s) => n + s.evidence.length, 0);
  return (
    <div className="splash">
      <figure className="ph" style={{ margin: 0 }}>
        <img src="/media/1791868564541.jpg" alt="Great House Farm, Llandough: the limewashed farmhouse behind its stone wall, July 1988" />
        <figcaption>The farmhouse on 29 July 1988, photographed by Cadw. It was demolished on 6 December.</figcaption>
      </figure>
      <div className="tx">
        <h1>Tŷ Mawr</h1>
        <div className="sub">The Great House Farm story, Llandough</div>
        <p className="log">For three hundred and twenty-one years the Williams family lived at Great House, the manor house at Llandough. They always said it was theirs. Nobody listened. What people heard was a squatter who lost in court, lost on appeal, lost in Strasbourg, and lost the listing; a “chainsaw farmer”; a house “bulldozed before breakfast”. This is the other side. Each scene gives what happened, what we were all told it meant, and what we now know.</p>
        <div className="btns">
          <button className="btn primary" onClick={onPlay}>{Icon.play} Play from the beginning</button>
          <button className="btn" onClick={onBoard}>{Icon.grid} Open the storyboard</button>
          <a className="btn" href="/story/">{Icon.doc} Read the script</a>
        </div>
        <div className="facts">
          <div><b>{scenes.length}</b>scenes</div>
          <div><b>{S.acts.filter((a) => a.label.startsWith('Act ')).length}</b>acts, with prologue and epilogue</div>
          <div><b>{evidence}</b>evidence links</div>
        </div>
        <p className="howto">For producers, researchers and cast: every scene has a reference (for example VI.9) and a permanent link, and every scene links to the documents behind it on the <a href="https://greathousefarmwiki.wordpress.com/">Great House Farm Wiki</a>. See the <a href="#" onClick={(e) => { e.preventDefault(); onCast(); }}>cast list</a>, or download the data as <a href="/api/timeline.json">JSON</a>.</p>
        <div className="support">
          <span>Support the family's campaign:</span>
          {React.createElement('stripe-buy-button', { 'buy-button-id': 'buy_btn_1RuDNARibisCfpBQBMKwrMVc', 'publishable-key': 'pk_live_51OqlLnRibisCfpBQQsDU3l2hhMLoKwTcdiokINqNA4wWaLeBM5qkMyJDV3B6TIToBOKCh4WhEzff7isJCLYIJaUB0088uetffQ' })}
          <button onClick={() => { navigator.clipboard?.writeText('bc1qddlu48vwmq0zrey0pgc8h02q9edq3jd8pwe3am'); setBtc(true); }}>{btc ? 'Bitcoin address copied' : 'Copy Bitcoin address'}</button>
        </div>
        <div className="foot" style={{ padding: '28px 0 0' }}>
          <span>Williams/Buckler Family Estate and Trust · release {meta.version}</span>
          <a href="https://github.com/unclehowell/datro/tree/bpvsbuckler">Source</a>
        </div>
      </div>
    </div>
  );
}
