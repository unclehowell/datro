import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import story from './data/story.json';
import meta from './data/meta.json';
import type { Story, Scene } from './data/story.d';

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

type View = 'splash' | 'scene' | 'board' | 'cast';
function readUrl(): { view: View; index: number } {
  try {
    const q = new URLSearchParams(location.search);
    const v = q.get('view');
    if (v === 'storyboard') return { view: 'board', index: 0 };
    if (v === 'cast') return { view: 'cast', index: 0 };
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
  t.replace(/Tŷ Mawr/g, 'Tee Mower').replace(/Llandough/g, 'Lan-dock').replace(/Dochdwy/g, 'Dok-doo-ee')
   .replace(/WGR/g, 'W G R').replace(/GGAT/g, 'G GAT').replace(/LJ\b/g, 'Lord Justice');

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
    const q = view === 'scene' ? `?event=${scene.id}` : view === 'board' ? '?view=storyboard' : view === 'cast' ? '?view=cast' : '';
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
    const text = `${scene.when}. ${scene.title}. ${scene.narration}`;
    const offset = scene.when.length + scene.title.length + 4;
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.lang = 'en-GB'; u.rate = 0.95; u.volume = volume;
    const voice = synth.getVoices().find((v) => v.lang === 'en-GB');
    if (voice) u.voice = voice;
    // spoken text is lightly altered, so map word positions rather than characters
    u.onboundary = (e) => {
      if (e.name !== 'word') return;
      const before = speakable(text).slice(0, e.charIndex).split(/\s+/).length - 1;
      const head = text.slice(0, offset).split(/\s+/).filter(Boolean).length;
      setSpoken(before - head);
    };
    let t: ReturnType<typeof setTimeout>;
    u.onend = () => { setSpoken(1e9); t = setTimeout(() => { if (!playingRef.current) return; if (index < scenes.length - 1) go(index + 1); else setPlaying(false); }, 900); };
    const s = setTimeout(() => synth.speak(u), 250);
    return () => { clearTimeout(s); clearTimeout(t); synth.cancel(); };
  }, [view, index, playing, volume]);

  // keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (view !== 'scene' || (e.target as HTMLElement).closest('input')) return;
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
          <a className="tab" href="/story/">Script</a>
        </nav>
      </header>
      <main className="main">
        {view === 'scene' && <SceneView scene={scene} spoken={playing ? spoken : -1} copied={copied} onCopy={() => {
          navigator.clipboard?.writeText(`Tŷ Mawr, scene ${scene.ref} (no. ${scene.no}), "${scene.title}", ${scene.when}. ${sceneUrl(scene)}`).then(() => setCopied(true), () => setCopied(false));
        }} onCast={() => open('cast')} onPick={go} />}
        {view === 'board' && <Board onPick={go} />}
        {view === 'cast' && <Cast onPick={go} />}
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
  const words = scene.narration.split(/\s+/);
  const cast = S.cast.filter((c) => scene.cast.includes(c.id));
  return (
    <article className="scene">
      <Frame scene={scene} />
      <div>
        <div className="slate"><span className="ref">Scene {scene.ref}</span><span>no. {scene.no} of {scenes.length}</span></div>
        <div className="when">{scene.when}</div>
        <h1>{scene.title}</h1>
        {scene.place && <div className="place">{scene.place}</div>}
        <p className={`narr${spoken >= 0 ? ' speaking' : ''}`}>
          {words.map((w, i) => <span key={i} className={`w${i <= spoken ? ' done' : ''}`}>{w}{' '}</span>)}
        </p>
        <div className="chips">
          <ParcelChip p={scene.parcel} />
          <span className="chip">Basis: {scene.basis}</span>
          {cast.map((c) => <button key={c.id} className="chip" onClick={onCast}>{c.name}</button>)}
        </div>
        {scene.case && <section className="case"><h2>The family's case</h2><p>{scene.case}</p></section>}
        <Words scene={scene} />
        <Ledger scene={scene} />
        <Storyline current={scene.no - 1} onPick={onPick} compact />
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

function Board({ onPick }: { onPick: (i: number) => void }) {
  return (
    <div className="sheet">
      <h1>Storyboard</h1>
      <p className="intro">A legal thriller in a hundred scenes: how a family's title to their house was buried, and a mimic of it built, move by move, until BP held the house it never proved it owned. Pick a panel to open the scene, the titles after it, and the evidence.</p>
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
                <div className="meta"><span>{s.ref}</span><span>{s.when.length > 26 ? s.date.slice(0, 4) : s.when}</span></div>
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
      <p className="intro">The family, the companies, the courts and the public bodies, and the scenes they appear in.</p>
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
const yearOf = (d: string) => (d.startsWith('9999') ? 2026.6 : +d.slice(0, 4) + (+d.slice(5, 7) - 1) / 12);
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
  return (
    <figure className={`storyline${compact ? ' compact' : ''}`} style={{ margin: 0 }}>
      <div className="sl-scroll">
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
          <text className="sl-lbl m" x={x(1987) + 18} y={114}>merged 1987: "A &amp; B"</text>
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

function Words({ scene }: { scene: Scene }) {
  if (!scene.words.length) return null;
  return (
    <section className="words" aria-label="The words, and what they meant">
      <h2>The words, and what they meant</h2>
      <dl>
        {scene.words.map(([q, m]) => (<React.Fragment key={q}><dt>{q}</dt><dd>{m}</dd></React.Fragment>))}
      </dl>
    </section>
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
        <img src="/media/1988-cadw-farmhouse.jpg" alt="Great House Farm, Llandough: the limewashed farmhouse behind its stone wall, July 1988" />
        <figcaption>The farmhouse on 29 July 1988, photographed by Cadw. It was demolished on 6 December.</figcaption>
      </figure>
      <div className="tx">
        <h1>Tŷ Mawr</h1>
        <div className="sub">The Great House Farm story, Llandough</div>
        <p className="log">In 1877 Great House Farm was cut in two: the house went one way, the fields another. The Williamses came to own the house. Then their deeds vanished from a blanket box, and over thirty years a second, synthetic title to the house was built on paper, from tenancies they refused, orders against a fields tenant, a licence never accepted, and a conveyance between two BP companies. In 1987 it was folded into the fields. The courts gave BP possession without ever deciding who owned the house, and on 6 December 1988 it was bulldozed before breakfast. The family's title was buried. It was never extinguished. This is how it was done, move by move.</p>
        <div className="btns">
          <button className="btn primary" onClick={onPlay}>{Icon.play} Play from the beginning</button>
          <button className="btn" onClick={onBoard}>{Icon.grid} Open the storyboard</button>
          <a className="btn" href="/story/">{Icon.doc} Read the script</a>
        </div>
        <div className="facts">
          <div><b>{scenes.length}</b>scenes</div>
          <div><b>{S.acts.length - 2}</b>acts, with prologue and epilogue</div>
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
