import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import story from './data/story.json';
import meta from './data/meta.json';
import instData from './data/institutions.json';
import type { Story, Scene, SceneMedia, CaseQuestion, SceneQA } from './data/story.d';
import { YearGallery, YearMediaViewer } from './Years';

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

// Institutions named in each scene (content/institutions.py). ?institution=<slug>
// screens only that institution's scenes, in date order.
type Inst = { slug: string; name: string; slide_count: number };
const INST = (instData as unknown as { institutions: Inst[]; scenes: Record<string, string[]> });
const INSTS = INST.institutions;
const instName = (slug: string) => INSTS.find((x) => x.slug === slug)?.name || slug;
const instTags = (s: Scene) => INST.scenes[s.id] || [];
const INST_ALIAS: Record<string, string> = {
  'welsh-office': 'welsh-government', wg: 'welsh-government', 'land-registry': 'hmlr', 'hm-land-registry': 'hmlr',
  vale: 'vale-council', 'vale-of-glamorgan': 'vale-council', 'vale-of-glamorgan-council': 'vale-council',
  cardiff: 'cardiff-council', wgr: 'bp', 'western-ground-rents': 'bp', 'bp-properties': 'bp', court: 'courts',
  hmcts: 'courts', police: 'south-wales-police', tna: 'national-archives', ggat: 'heneb', 'royal-commission': 'rcahmw',
  'national-museum-wales': 'museum-wales', 'llandough-cc': 'llandough-community-council', law: 'land-authority-wales',
};
const ALL = scenes.map((_s, i) => i);
const listFor = (slug: string) => (slug ? ALL.filter((i) => instTags(scenes[i]).includes(slug)) : ALL);
function readInst(q: URLSearchParams): { inst: string; note: string } {
  if (!q.has('institution')) return { inst: '', note: '' };
  const raw = (q.get('institution') || '').trim();
  if (!raw) return { inst: '', note: 'No institution was chosen, so all scenes are shown.' };
  let slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  slug = INST_ALIAS[slug] || slug;
  const known = INSTS.find((x) => x.slug === slug);
  if (!known) return { inst: '', note: `There is no institution called "${raw}" here, so all scenes are shown.` };
  if (!listFor(slug).length) return { inst: '', note: `No scene in the story names ${known.name} yet, so all scenes are shown.` };
  return { inst: slug, note: '' };
}

type View = 'splash' | 'scene' | 'board' | 'cast' | 'questions';
function readUrl(): { view: View; index: number; inst: string; note: string } {
  let inst = '', note = '';
  try {
    const q = new URLSearchParams(location.search);
    ({ inst, note } = readInst(q));
    const list = listFor(inst);
    const v = q.get('view');
    if (v === 'storyboard') return { view: 'board', index: list[0] || 0, inst, note };
    if (v === 'cast') return { view: 'cast', index: 0, inst, note };
    if (v === 'questions') return { view: 'questions', index: 0, inst, note };
    let id = q.get('event');
    if (id) {
      id = (S.aliases as Record<string, string>)[id] || id;
      const i = scenes.findIndex((s) => s.id === id);
      if (i >= 0) return { view: 'scene', index: list.includes(i) ? i : (list.find((j) => j > i) ?? list[0]), inst, note };
    }
    const y = q.get('year');
    if (y) {
      const i = scenes.findIndex((s, j) => list.includes(j) && (s.date.startsWith(y) || s.when.includes(y)));
      if (i >= 0) return { view: 'scene', index: i, inst, note };
    }
    // A screening link (?institution=cadw) opens straight on that institution's first scene.
    if (q.has('institution')) return { view: 'scene', index: list[0], inst, note };
  } catch (_e) { /* no URL */ }
  return { view: 'board', index: 0, inst, note };
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
  const [inst, setInst] = useState(init.inst);
  const [instNote, setInstNote] = useState(init.note);
  const list = useMemo(() => listFor(inst), [inst]);
  const pos = list.indexOf(index);
  const scene = scenes[index];
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // URL <-> state
  useEffect(() => {
    const f = inst ? `institution=${inst}` : '';
    const v = view === 'scene' ? `event=${scene.id}` : view === 'board' ? 'view=storyboard' : view === 'cast' ? 'view=cast' : view === 'questions' ? 'view=questions' : '';
    const both = [f, v].filter(Boolean).join('&');
    const q = both ? `?${both}` : '';
    if (location.search !== q) history.replaceState(null, '', location.pathname + q);
    const tail = inst ? ` — ${instName(inst)} — Tŷ Mawr` : ' — Tŷ Mawr';
    document.title = view === 'scene' ? `${scene.when} · ${scene.title}${tail}` : view === 'board' ? 'Years in pictures — Tŷ Mawr' : inst ? `${instName(inst)} — Tŷ Mawr — The Great House Farm Story` : 'Tŷ Mawr — The Great House Farm Story';
  }, [view, index, inst]);
  useEffect(() => {
    const on = () => { const r = readUrl(); setView(r.view); setIndex(r.index); setInst(r.inst); setInstNote(r.note); };
    addEventListener('popstate', on);
    return () => removeEventListener('popstate', on);
  }, []);

  const go = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(scenes.length - 1, i)));
    setView('scene');
    setCopied(false);
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, []);
  const open = (v: View) => { history.pushState(null, '', location.pathname + (inst ? `?institution=${inst}` : '')); setPlaying(false); setView(v); };
  // Step through the scenes being screened (all, or one institution's), in date order.
  const step = (d: number) => {
    if (pos < 0) { const n = d > 0 ? list.find((i) => i > index) : [...list].reverse().find((i) => i < index); go(n ?? list[0]); return; }
    const p = pos + d;
    if (p >= 0 && p < list.length) go(list[p]);
  };
  const pickInst = (slug: string) => {
    const l = listFor(slug);
    setInst(slug); setInstNote(''); setPlaying(false);
    if (view === 'splash' || view === 'scene') { if (slug && !l.includes(index)) go(l[0]); else if (view === 'splash') go(l[0]); }
  };

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
    u.onend = () => { setSpoken(1e9); t = setTimeout(() => { if (!playingRef.current) return; if (pos >= 0 && pos < list.length - 1) go(list[pos + 1]); else if (pos < 0 && list.some((i) => i > index)) go(list.find((i) => i > index)!); else setPlaying(false); }, 900); };
    const s = setTimeout(() => synth.speak(u), 250);
    return () => { clearTimeout(s); clearTimeout(t); synth.cancel(); };
  }, [view, index, playing, volume, inst]);

  // keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (view !== 'scene' || (e.target as HTMLElement).closest('input, button, a, [role="dialog"]')) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [view, index, go, list, pos]);

  const instBar = <InstBar inst={inst} note={instNote} pos={pos} total={list.length} onPick={pickInst} board={view === 'board'} />;
  if (view === 'splash') return <Splash instBar={instBar} onPlay={() => { go(list[0]); setPlaying(true); }} onBoard={() => setView('board')} onCast={() => setView('cast')} />;

  const act = actOf(scene.act);
  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); open('board'); }}>Tŷ Mawr<small>The Great House Farm story</small></a>
        <div className="where">{view === 'scene' ? scene.when : 'A visual chronology of the Great House Farm story'}</div>
        <nav className="tabs" aria-label="Views">
          <button className="tab" aria-current={view === 'board' ? 'page' : undefined} onClick={() => open('board')}>Years</button>
          <button className="tab" aria-current={view === 'scene' ? 'page' : undefined} onClick={() => go(index)}>Read</button>
          <button className="tab" aria-current={view === 'cast' ? 'page' : undefined} onClick={() => open('cast')}>People</button>
          <button className="tab" aria-current={view === 'questions' ? 'page' : undefined} onClick={() => open('questions')}>Questions</button>
          <button className="tab" aria-current={view === 'splash' ? 'page' : undefined} onClick={() => open('splash')}>About</button>
          <a className="tab" href="/story/">Script</a>
          <a className="tab" href="/control/">Records</a>
        </nav>
      </header>
      <main className="main">
        {view === 'scene' && instBar}
        {view === 'scene' && <SceneView scene={scene} spoken={playing ? spoken : -1} copied={copied} onCopy={() => {
          navigator.clipboard?.writeText(`Tŷ Mawr, scene ${scene.ref} (no. ${scene.no}), "${scene.title}", ${scene.when}. ${sceneUrl(scene)}`).then(() => setCopied(true), () => setCopied(false));
        }} onCast={() => open('cast')} onPick={go} onInst={pickInst} total={list.length} pos={pos} />}
        {view === 'board' && <Board onPick={go} only={inst ? list : null} />}
        {view === 'cast' && <Cast onPick={go} />}
        {view === 'questions' && <Questions onPick={go} />}
      </main>
      {view === 'scene' && (
        <footer className="transport">
          <div className="acts" role="group" aria-label="Scenes by act">
            {S.acts.map((a) => {
              const ticks = scenes.map((s, i) => [s, i] as const).filter(([s, i]) => s.act === a.id && list.includes(i));
              if (!ticks.length) return null;
              return (
                <div key={a.id} className="actseg" style={{ flex: ticks.length }}>
                  <span className="lbl">{a.label === 'Prologue' || a.label === 'Epilogue' ? a.label : a.label.replace('Act ', '')} {a.title}</span>
                  {ticks.map(([s, i]) => (
                    <button key={s.id} className={`tick${i === index ? ' on' : i < index ? ' seen' : ''}`} title={`${s.ref} ${s.when}: ${s.title}`} aria-label={`Scene ${s.ref}, ${s.title}`} onClick={() => go(i)} />
                  ))}
                </div>
              );
            })}
          </div>
          <label className="voice"><span>Voice</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(+e.target.value)} aria-label="Narration volume" /></label>
          <div className="ctl">
            <button onClick={() => step(-1)} aria-label="Previous scene" disabled={pos === 0 || (pos < 0 && !list.some((i) => i < index))}>{Icon.prev}</button>
            <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause narration' : 'Play narration'}>{playing ? Icon.pause : Icon.play}</button>
            <button onClick={() => step(1)} aria-label="Next scene" disabled={pos === list.length - 1 || (pos < 0 && !list.some((i) => i > index))}>{Icon.next}</button>
          </div>
          <div className="count">{inst ? `${pos + 1} of ${list.length}` : `${scene.no} of ${scenes.length}`}</div>
        </footer>
      )}
    </div>
  );
}

function datedImage(scene: Scene, url?: string): boolean {
  return !!url && (scene.media || []).some((m) => m.url === url);
}

function ParcelChip({ p }: { p: string }) {
  const [cls, label] = PARCEL[p] || PARCEL[''];
  if (!label) return null;
  return <span className="chip"><i className={`p-${cls}`} />{label}</span>;
}

function Frame({ scene, small }: { scene: Scene; small?: boolean }) {
  const [cls] = PARCEL[scene.parcel] || PARCEL[''];
  // Only a picture the build placed on this scene by date (scene.media) is shown.
  const img = scene.image && (scene.media || []).some((m) => m.url === scene.image) ? scene.image : null;
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

function SceneView({ scene, spoken, copied, onCopy, onCast, onPick, onInst, total, pos }: { scene: Scene; spoken: number; copied: boolean; onCopy: () => void; onCast: () => void; onPick: (i: number) => void; onInst: (slug: string) => void; total: number; pos: number }) {
  const tags = instTags(scene);
  const base = segmentBases(scene);
  const cast = S.cast.filter((c) => scene.cast.includes(c.id));
  return (
    <article className="scene">
      <Stage scene={scene} onPick={onPick} />
      <div>
        <div className="slate"><span className="ref">{scene.when}</span><span>event {scene.no} of {scenes.length}</span></div>
        <div className="when">{scene.when}</div>
        <h1>{scene.title}</h1>
        {scene.place && <div className="place">{scene.place}</div>}
        <p className={`narr${spoken >= 0 ? ' speaking' : ''}`}><Spoken text={scene.narration} base={base.event} spoken={spoken} /></p>
        <div className="chips">
          <span className={`chip grade g-${scene.grade}`} title={scene.grade_text}><i />{GRADE[scene.grade]}</span>
          <span className="chip">Basis: {scene.basis}</span>
          {cast.map((c) => <button key={c.id} className="chip" onClick={onCast}>{c.name}</button>)}
        </div>
        {tags.length > 0 && (
          <div className="chips insts" aria-label="Institutions in this scene">
            <span className="k">Institutions</span>
            {tags.map((t) => <button key={t} className="chip inst" onClick={() => onInst(t)} title={`Screen only ${instName(t)}'s scenes`}>{instName(t)}</button>)}
          </div>
        )}
        <Accounts scene={scene} base={base} spoken={spoken} />
        <SceneQuestions scene={scene} />
        {scene.case && <section className="case"><h2>The family's case</h2><p>{scene.case}</p></section>}
        <Replies items={scene.qa} />
        <section className="ev">
          <h2>Evidence ({scene.evidence.length})</h2>
          <ul>
            {scene.evidence.map((e, i) => (
              <li key={i}><a href={e.url} target="_blank" rel="noopener noreferrer">
                <span className="thumb" style={datedImage(scene, e.image) ? { backgroundImage: `url("${e.image}")` } : undefined}>{datedImage(scene, e.image) ? '' : e.type.split(' ')[0]}</span>
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


type SlideMediaItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  kind: 'image' | 'video';
  poster?: string;
  score: number;
};
function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return encodeURI(decodeURI(path));
  return new URL(path, SITE).toString();
}
function videoEmbedUrl(url: string): string | undefined {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? 'https://www.youtube-nocookie.com/embed/' + match[1] : undefined;
}
function mediaDateLabel(m: SceneMedia): string {
  if (m.date) return m.date;
  return m.released ? 'released ' + m.released : '';
}

// Scene pictures come only from scene.media, which the build places by DATE
// (content/scene_media.py + content/media_register.py) and checks against the
// scene's period. Nothing is matched by keyword at runtime, and an undated
// picture is never shown on a dated scene.
function FloatingSceneMedia({ scene }: { scene: Scene }) {
  const [selection, setSelection] = useState({ sceneId: '', index: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [broken, setBroken] = useState<Record<string, true>>({});

  useEffect(() => {
    setLightboxOpen(false);
  }, [scene.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const items = useMemo(() => {
    const found: SlideMediaItem[] = [];
    const used = new Set<string>();
    (scene.media || []).forEach((m, index) => {
      const url = absoluteSiteUrl(m.url);
      if (!url || used.has(url) || broken[url]) return;
      used.add(url);
      const label = mediaDateLabel(m);
      found.push({
        id: 'scene-media-' + scene.id + '-' + index,
        url,
        title: m.title + (label && !m.title.includes(label.slice(0, 4)) ? ' (' + label + ')' : ''),
        source: m.source === 'curated' ? 'Scene evidence' : 'Archive, matched by date',
        kind: 'image',
        score: 0
      });
    });
    // Videos linked from the scene's own evidence (no date matching needed).
    scene.evidence.forEach((entry, index) => {
      const url = entry.url || '';
      if (!url || used.has(url) || !/(?:youtube\.com|youtu\.be|\.mp4(?:$|[?#])|\.webm(?:$|[?#])|\.mov(?:$|[?#]))/i.test(url)) return;
      used.add(url);
      const videoId = (url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1];
      found.push({
        id: 'evidence-video-' + scene.id + '-' + index,
        url,
        title: entry.title || scene.title,
        source: entry.type || 'Scene evidence video',
        kind: 'video',
        poster: videoId ? 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg' : undefined,
        score: 0
      });
    });
    return found.slice(0, 12);
  }, [scene, broken]);

  const selectedIndex = selection.sceneId === scene.id
    ? selection.index % Math.max(items.length, 1) : 0;
  const current = items[selectedIndex] || items[0];
  const previewUrl = current?.poster || (current?.kind === 'image' ? current.url : '');
  const selectItem = (next: number) => {
    if (!items.length) return;
    setSelection({ sceneId: scene.id, index: (next + items.length) % items.length });
  };
  // A picture that fails to load is dropped; no stand-in picture from another
  // date is ever substituted.
  const safeImageFallback = () => {
    if (current && current.kind === 'image') setBroken((prev) => ({ ...prev, [current.url]: true }));
  };

  if (!current) return null;
  return (
    <>
      <div className="pip" aria-label={'Scene media: ' + current.title}>
        {previewUrl ? <img className="pip-image" src={previewUrl} alt={current.title} loading="lazy" onError={safeImageFallback} /> : <div className="pip-image" aria-hidden="true" />}
        {current.kind === 'video' && <span className="pip-play-mark" aria-hidden="true">▶</span>}
        <span className="pip-caption" title={current.title}>{current.title}</span>
        <button type="button" className="pip-control pip-prev" onClick={() => selectItem(selectedIndex - 1)} disabled={items.length < 2} aria-label="Previous scene media" title="Previous image">‹</button>
        <button type="button" className="pip-control pip-next" onClick={() => selectItem(selectedIndex + 1)} disabled={items.length < 2} aria-label="Next scene media" title="Next image">›</button>
        <button type="button" className="pip-control pip-enlarge" onClick={() => setLightboxOpen(true)} aria-label={'Enlarge ' + current.title} title="Enlarge thumbnail">⤢</button>
        <span className="pip-count" aria-live="polite">{selectedIndex + 1}/{items.length}</span>
      </div>
      {lightboxOpen && (
        <div className="lightbox pip-lightbox" role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setLightboxOpen(false)}>
          <figure onClick={(event) => event.stopPropagation()}>
            {current.kind === 'video' ? (
              videoEmbedUrl(current.url) ? (
                <iframe
                  className="pip-video-player"
                  src={videoEmbedUrl(current.url) + '?autoplay=1&rel=0'}
                  title={current.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video className="pip-video-player" src={current.url} poster={current.poster || undefined} controls autoPlay playsInline />
              )
            ) : (
              <img src={current.url} alt={current.title} onError={safeImageFallback} />
            )}
            <figcaption>{current.title} · {current.source}</figcaption>
          </figure>
          <button className="lb-close" onClick={() => setLightboxOpen(false)} aria-label="Close full-screen media">×</button>
        </div>
      )}
    </>
  );
}
function Board({ onPick, only }: { onPick: (i: number) => void; only: number[] | null }) {
  return <YearGallery onPick={onPick} />;
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
  return <YearMediaViewer scene={scene} />;
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
  documented: 'Documented', 'single-source': 'Single source', 'testimony-only': 'Testimony only',
  contested: 'Contested', argument: 'Argument',
};
const STATUS: Record<string, string> = {
  documented: 'Documented', corroborated: 'Corroborated', 'testimony-only': 'Testimony only (named witness)',
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
            {c.for.length > 0 && <div><span>Supports the Buckler case</span><ul>{c.for.map((x) => <li key={x}>{x}</li>)}</ul></div>}
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

function Splash({ onPlay, onBoard, onCast, instBar }: { onPlay: () => void; onBoard: () => void; onCast: () => void; instBar: React.ReactNode }) {
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
         <img src="/media/1988-cadw-farmhouse.jpg" alt="Cadw survey photograph of the Great House Farm farmhouse, 29 July 1988" />
        <figcaption>Cadw’s survey photograph of the farmhouse, 29 July 1988. The building was demolished on 6 December.</figcaption>
      </figure>
      <div className="tx">
        <h1>Tŷ Mawr</h1>
        <div className="sub">The Great House Farm story, Llandough</div>
        <p className="log">For three hundred and twenty-one years the Williams family lived at Great House, the manor house at Llandough. They always said it was theirs. Nobody listened. What people heard was a squatter who lost in court, lost on appeal, lost in Strasbourg, and lost the listing; a “chainsaw farmer”; a house “bulldozed before breakfast”. This is the other side. Each scene gives what happened, what we were all told it meant, and what we now know.</p>
        {instBar}
        <div className="btns">
          <button className="btn primary" onClick={onBoard}>{Icon.grid} Browse the years</button>
          <button className="btn" onClick={onPlay}>{Icon.play} Read the first event</button>
          <a className="btn" href="/story/">{Icon.doc} Read the script</a>
        </div>
        <div className="facts">
          <div><b>{scenes.length}</b>scenes</div>
          <div><b>{S.acts.filter((a) => a.label.startsWith('Act ')).length}</b>acts, with prologue and epilogue</div>
          <div><b>{evidence}</b>evidence links</div>
        </div>
         <p className="howto">Browse the story by year, open photographs that belong to each date, then read the event, the received account, what the record supports, and the linked documents. The former Great House Farm Wiki is retired; the Cedwyn research archive now holds the source material. See the <a href="#" onClick={(e) => { e.preventDefault(); onCast(); }}>people and institutions</a>, or download the timeline data as <a href="/api/timeline.json">JSON</a>.</p>
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

function InstBar({ inst, note, pos, total, onPick, board }: { inst: string; note: string; pos: number; total: number; onPick: (slug: string) => void; board: boolean }) {
  const shown = INSTS.filter((x) => listFor(x.slug).length > 0);
  return (
    <div className="instbar" role="region" aria-label="Screen by institution">
      <label className="pick">
        <span>Screen by institution</span>
        <select value={inst} onChange={(e) => onPick(e.target.value)}>
          <option value="">All institutions · {scenes.length} scenes</option>
          {shown.map((x) => <option key={x.slug} value={x.slug}>{x.name} · {listFor(x.slug).length}</option>)}
        </select>
      </label>
      {inst && (
        <p className="state">
          Screening <b>{instName(inst)}</b>: {total} scene{total === 1 ? '' : 's'} in date order{!board && pos >= 0 ? `, now ${pos + 1} of ${total}` : ''}.{' '}
          <button className="linkish" onClick={() => onPick('')}>Show all</button>
        </p>
      )}
      {note && <p className="note" role="status">{note}</p>}
    </div>
  );
}
