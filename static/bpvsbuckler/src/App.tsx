import React, { useState, useEffect, useCallback, useRef } from 'react';
import { timeline } from './data/timeline';
import { pageContent } from './data/pages';
import {
  getCharacterIcon, isWelsh, getVoiceParams,
  playClickSound, formatNarration, getWordCountUpTo, getCharIndexAtWord
} from './lib/utils';
import { SplashScreen } from './components/SplashScreen';
import { FacebookIcon, InstagramIcon, InfoIcon, ImageIcon, TextIcon, PdfIcon, VideoIcon } from './components/Icons';

const STARTING_SLIDE = 27;

interface NarrationState {
  name: string; icon: string; text: string; type: string;
  year: string; side: string; index: number;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(STARTING_SLIDE);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentNarration, setCurrentNarration] = useState<NarrationState | null>(null);
  const [tooltip, setTooltip] = useState<{ index: number; year: string; left: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showChallenge, setShowChallenge] = useState<number | null>(null);
  const [version, setVersion] = useState('...');
  const isPlayingRef = useRef(isPlayingState);

  const currentScene = timeline[sceneIndex];
  const hasChallenge = !!currentScene?.challenge;

  const getSlideProgress = () =>
    ((sceneIndex + characterIndex / (currentScene.scenes.length + 1)) / timeline.length) * 100;

  useEffect(() => {
    fetch('https://api.github.com/repos/unclehowell/datro/releases?per_page=30')
      .then(r => r.json())
      .then((data: any) => {
        const bpRelease = Array.isArray(data)
          ? data.find((r: any) => r.tag_name?.startsWith('bpvsbuckler-'))
          : null;
        setVersion(bpRelease?.tag_name || 'v0.8.0.00');
      })
      .catch(() => setVersion('v0.8.0.00'));
  }, []);

  const advanceScene = useCallback(() => {
    if (characterIndex < currentScene.scenes.length) {
      playClickSound('click');
      setCharacterIndex(p => p + 1);
    } else {
      playClickSound('beep');
      if (sceneIndex < timeline.length - 1) {
        setSceneIndex(p => p + 1);
        setCharacterIndex(0);
      } else {
        setIsPlayingState(false);
        setSceneIndex(STARTING_SLIDE);
        setCharacterIndex(0);
      }
    }
  }, [sceneIndex, characterIndex, currentScene.scenes.length]);

  const rewindScene = useCallback(() => {
    if (characterIndex > 0) {
      playClickSound('click');
      setCharacterIndex(p => p - 1);
    } else {
      playClickSound('beep');
      if (sceneIndex > 0) {
        const prev = sceneIndex - 1;
        setSceneIndex(prev);
        setCharacterIndex(timeline[prev].scenes.length);
      } else {
        setSceneIndex(timeline.length - 1);
        setCharacterIndex(0);
      }
    }
  }, [sceneIndex, characterIndex]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.min(timeline.length - 1, Math.floor(progress * timeline.length));
    const scene = timeline[idx];
    setTooltip({ index: idx + 1, year: scene.year, left: (idx / timeline.length) * 100 });
    if (e.buttons === 1) {
      setSceneIndex(idx);
      setCharacterIndex(0);
      setShowTooltip(true);
    }
  };

  useEffect(() => { isPlayingRef.current = isPlayingState; }, [isPlayingState]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    let timeoutId: ReturnType<typeof setTimeout>;
    const speak = async () => {
      let text = '', speaker = '', iconType = 'narrator', side = 'center', charIdx = 0;
      if (characterIndex === 0) {
        text = formatNarration(currentScene.narration, currentScene.year);
        speaker = 'Narrator';
        iconType = currentScene.locationType;
        side = 'narrator';
      } else {
        const char = currentScene.scenes[characterIndex - 1];
        if (char) {
          text = char.text;
          speaker = char.character;
          iconType = char.icon;
          side = char.side;
          charIdx = characterIndex - 1;
        }
      }
      if (!text) return;
      setHighlightIndex(-1);
      setCurrentNarration({ name: speaker, icon: iconType, text, type: characterIndex === 0 ? 'narrator' : 'character', year: currentScene.year, side, index: charIdx });

      const cleanText = text.replace(/Ty Mawr/gi, 'Tea-mou Rhough').replace(/Llandough/gi, 'Lan-dock');

      const speakWithHighlight = () => new Promise<void>((resolve) => {
        if (!window.speechSynthesis) { resolve(); return; }
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const params = getVoiceParams(speaker, characterIndex === 0);
        utterance.pitch = params.pitch;
        utterance.rate = params.rate;
        utterance.volume = isPlayingState ? volume : 0;
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const wordIdx = getWordCountUpTo(text, event.charIndex);
            setHighlightIndex(getCharIndexAtWord(text, wordIdx));
          }
        };
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
        if (!isPlayingState) {
          setTimeout(() => { window.speechSynthesis?.cancel(); resolve(); }, text.length * 200 + 2000);
        }
      });

      if (isPlayingState) {
        await speakWithHighlight();
        if (isPlayingRef.current) advanceScene();
      } else {
        speakWithHighlight();
      }
    };
    timeoutId = setTimeout(speak, 300);
    return () => { clearTimeout(timeoutId); window.speechSynthesis?.cancel(); };
  }, [sceneIndex, characterIndex, isPlayingState, volume, currentScene, advanceScene]);

  const [highlightIndex, setHighlightIndex] = useState(-1);

  const togglePlay = () => {
    setIsPlayingState(p => !p);
    if (!isPlayingState) window.speechSynthesis?.cancel();
  };

  if (showSplash) return <SplashScreen onEnter={() => { setShowSplash(false); setIsPlayingState(true); }} data={pageContent.splash} />;

  const renderHighlightedText = (text: string) => {
    const words = text.split(' ');
    let ci = 0;
    return (
      <p className="font-special leading-relaxed text-slate-100 text-base sm:text-lg md:text-xl lg:text-2xl">
        {words.map((w, i) => {
          const start = ci, end = ci + w.length;
          ci += w.length + 1;
          return <span key={i} className={`inline-block mr-1.5 sm:mr-2 transition-colors duration-100 ${highlightIndex >= start && highlightIndex < end ? 'text-amber-400 scale-105 font-bold' : highlightIndex >= start ? 'opacity-100' : highlightIndex >= 0 ? 'opacity-50' : 'opacity-100'}`}>{w}</span>;
        })}
      </p>
    );
  };

  const narrator = currentNarration && currentNarration.type === 'narrator';
  const character = currentNarration && currentNarration.type === 'character';

  return (
    <div className="flex flex-col w-screen bg-black overflow-hidden select-none text-base app-height" onMouseUp={() => setShowTooltip(false)}>
      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* LEFT PANEL — Narration / Character */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 min-h-0 overflow-y-auto no-scrollbar">

          {/* 4 greyed-out media icons — top center on every narrator slide */}
          {characterIndex === 0 && (
            <div className="flex items-center gap-4 sm:gap-6 mb-3 sm:mb-5 shrink-0 opacity-20">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
              <TextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
              <PdfIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
              <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            </div>
          )}

          {/* Scene counter — large as possible */}
          <div className="w-full flex items-center justify-between mb-2 sm:mb-4 shrink-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold font-mono text-slate-400">
              {sceneIndex + 1} / {timeline.length}
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold font-mono text-amber-500">
              {currentScene.year}
            </div>
          </div>

          {/* Narration card */}
          <div className={`relative w-full max-w-2xl p-4 sm:p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md flex flex-col items-center text-center transition-all duration-500 ${character ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3">NARRATION</div>
            <div className="text-slate-400 text-[10px] sm:text-xs mb-3 font-mono">{currentScene.location}</div>
            {renderHighlightedText(formatNarration(currentScene.narration, currentScene.year))}
            {hasChallenge && characterIndex === 0 && (
              <button
                onClick={() => setShowChallenge(showChallenge === sceneIndex ? null : sceneIndex)}
                className="mt-4 flex items-center gap-2 text-red-400 text-xs sm:text-sm cursor-pointer hover:text-red-300 transition-colors select-none"
              >
                <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-slow" />
                <span className="font-bold uppercase tracking-wider">Challenge the Narrative</span>
              </button>
            )}
          </div>

          {/* Challenge tooltip — OVER narration card via z-index */}
          {showChallenge === sceneIndex && currentScene.challenge && (
            <div className="w-full max-w-2xl mt-3 p-4 rounded-xl bg-red-950/95 border border-red-500/40 text-sm text-red-200 animate-fade-in-up relative z-[60] shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <div className="flex items-start gap-2">
                <InfoIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{currentScene.challenge}</p>
              </div>
            </div>
          )}

          {/* Character dialogue */}
          {character && currentNarration && (
            <div className="w-full max-w-2xl mt-3 sm:mt-4 animate-fade-in-up relative z-[60]">
              <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                {/* Character header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-500 bg-slate-800 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    {getCharacterIcon(currentNarration.icon)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white text-sm sm:text-lg leading-tight truncate">{currentNarration.name}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {isWelsh(currentNarration.name) ? <span>{'\uD83C\uDFF4'}</span> : <span>{'\uD83C\uDDEC\uD83C\uDDE7'}</span>}
                      <span>{currentScene.year}</span>
                      <span>{'\u2022'}</span>
                      <span className="truncate">{currentScene.location}</span>
                    </div>
                  </div>
                </div>
                {/* Character text */}
                <p className="font-special leading-relaxed text-white text-sm sm:text-base md:text-lg">{currentNarration.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === BOTTOM CONTROLS BAR === */}
      <div className="shrink-0 bg-slate-950 border-t border-slate-800 z-50">

        {/* Progress bar */}
        <div className="w-full h-5 cursor-pointer group relative" onMouseMove={handleProgressClick} onMouseDown={handleProgressClick} onMouseLeave={() => setTooltip(null)}>
          {tooltip && (
            <div className="absolute bottom-full mb-1 bg-slate-900 border border-amber-500 text-amber-500 text-[10px] sm:text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none -translate-x-1/2" style={{ left: `${tooltip.left}%` }}>
              Slide {tooltip.index}: {tooltip.year}
            </div>
          )}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-slate-800/50">
            {timeline.map((_, i) => (
              <div key={i} className={`absolute top-0 h-full z-10 pointer-events-none ${timeline[i].challenge ? 'bg-red-500/60 w-[2px]' : 'bg-white/20 w-px'}`} style={{ left: `${(i / timeline.length) * 100}%` }} />
            ))}
            <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-100 ease-linear group-hover:shadow-[0_0_8px_rgba(220,38,38,0.6)]" style={{ width: `${getSlideProgress()}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-opacity" />
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 gap-2">

          {/* Left: Volume */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 sm:w-20 md:w-24 h-1.5 bg-slate-700 rounded-lg accent-amber-500 cursor-pointer" />
            </div>
          </div>

          {/* Center: Left arrow + Play/Pause + Right arrow */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={rewindScene} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500 flex items-center justify-center active:scale-95 transition-all">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 active:scale-95 shrink-0">
              {isPlayingState ? (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={advanceScene} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500 flex items-center justify-center active:scale-95 transition-all">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Right: BTC + GBP/USD button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button onClick={() => { navigator.clipboard.writeText('bc1qddlu48vwmq0zrey0pgc8h02q9edq3jd8pwe3am'); }} className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] sm:text-xs font-bold uppercase hover:text-white hover:border-amber-500 transition-all active:scale-95" title="Copy BTC Address">BTC</button>
            <stripe-buy-button
              buy-button-id="buy_btn_1RuDNARibisCfpBQBMKwrMVc"
              publishable-key="pk_live_51OqlLnRibisCfpBQQsDU3l2hhMLoKwTcdiokINqNA4wWaLeBM5qkMyJDV3B6TIToBOKCh4WhEzff7isJCLYIJaUB0088uetffQ">
            </stripe-buy-button>
          </div>
        </div>
      </div>

      {/* === FOOTER === */}
      <div className="shrink-0 h-10 sm:h-11 bg-slate-950 border-t border-slate-800/50 flex items-center justify-between px-3 sm:px-4 md:px-6 text-[10px] sm:text-xs text-slate-600 z-50">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="truncate">Williams/Buckler Family Estate and Trust</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <a
            href={`https://github.com/unclehowell/datro/tree/bpvsbuckler`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-slate-700 hover:text-amber-500 transition-colors hidden sm:inline"
            title="View on GitHub"
          >
            {version}
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><FacebookIcon /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><InstagramIcon /></a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
