import React, { useState, useEffect, useCallback, useRef } from 'react';
import { timeline } from './data/timeline';
import { pageContent } from './data/pages';
import {
  getCharacterIcon, isWelsh, getVoiceParams,
  playClickSound, formatNarration, getWordCountUpTo, getCharIndexAtWord
} from './lib/utils';
import { SplashScreen } from './components/SplashScreen';
import { CloseIcon, FacebookIcon, InstagramIcon, MaximizeIcon, InfoIcon } from './components/Icons';

interface NarrationState {
  name: string; icon: string; text: string; type: string;
  year: string; side: string; index: number;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMaximized, setIsMaximized] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentNarration, setCurrentNarration] = useState<NarrationState | null>(null);
  const [tooltip, setTooltip] = useState<{ index: number; year: string; left: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showChallenge, setShowChallenge] = useState<number | null>(null);
  const [challengePosition, setChallengePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [version, setVersion] = useState('...');
  const isPlayingRef = useRef(isPlayingState);

  const currentScene = timeline[sceneIndex];
  const hasChallenge = !!currentScene?.challenge;

  const getSlideProgress = () =>
    ((sceneIndex + characterIndex / (currentScene.scenes.length + 1)) / timeline.length) * 100;

  // Fetch version from GitHub releases — filter for bpvsbuckler branch
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
        setSceneIndex(0);
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
    if (!isMaximized) return;
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
  }, [sceneIndex, characterIndex, isMaximized, isPlayingState, volume, currentScene, advanceScene]);

  const [highlightIndex, setHighlightIndex] = useState(-1);

  const togglePlay = () => {
    setIsPlayingState(p => !p);
    if (!isPlayingState) window.speechSynthesis?.cancel();
  };

  const handleChallengeHover = (e: React.MouseEvent | React.TouchEvent, sceneIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setChallengePosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setShowChallenge(sceneIdx);
  };

  if (showSplash) return <SplashScreen onEnter={() => { setShowSplash(false); setIsPlayingState(true); }} data={pageContent.splash} />;

  const renderHighlightedText = (text: string) => {
    const words = text.split(' ');
    let ci = 0;
    return (
      <p className="font-special leading-relaxed text-slate-100 min-h-[37px] text-lg md:text-xl">
        {words.map((w, i) => {
          const start = ci, end = ci + w.length;
          ci += w.length + 1;
          return <span key={i} className={`inline-block mr-2 transition-colors duration-100 ${highlightIndex >= start && highlightIndex < end ? 'text-amber-400 scale-110 font-bold' : highlightIndex >= start ? 'opacity-100' : highlightIndex >= 0 ? 'opacity-50' : 'opacity-100'}`}>{w}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none relative text-base bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.8)_0%,_rgba(0,0,0,0.9)_100%)]" onMouseUp={() => setShowTooltip(false)}>
      {!isMaximized && (
        <div className="h-16 w-full bg-slate-900/90 border-b border-slate-700 flex items-center px-6 z-[60] shadow-xl shrink-0">
          <button onClick={() => setIsMaximized(true)} className="text-amber-500 font-special uppercase tracking-widest font-bold hover:text-amber-300 transition-colors text-xl md:text-2xl">
            Great House Farm Story
          </button>
          <div className="ml-auto text-slate-500 text-sm font-mono">{version}</div>
        </div>
      )}

      {isMaximized && (
        <>
          <button onClick={rewindScene} className="fixed top-1/2 -translate-y-1/2 left-4 z-50 w-20 h-20 rounded-full bg-slate-900/90 border-2 border-slate-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={advanceScene} className="fixed top-1/2 -translate-y-1/2 right-4 z-50 w-20 h-20 rounded-full bg-slate-900/90 border-2 border-slate-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <div className="flex-1 w-full relative z-10 flex flex-col overflow-hidden">
        {isMaximized && (
          <div className="relative w-full h-full flex flex-col items-center justify-evenly p-4">
            <div className={`w-[90vw] md:w-[60vw] p-4 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md z-10 flex flex-col items-center text-center h-auto max-h-[40vh] overflow-y-auto mb-8 transition-all duration-700 no-scrollbar ${characterIndex > 0 ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
              <div className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-2 sticky top-0 bg-slate-900/0 backdrop-blur-0">NARRATION</div>
              <div className="text-lg md:text-xl text-slate-300">{renderHighlightedText(formatNarration(currentScene.narration, currentScene.year))}</div>
              {hasChallenge && characterIndex === 0 && (
                <div
                  className="mt-4 flex items-center gap-2 text-red-400 text-sm cursor-pointer hover:text-red-300 transition-colors select-none"
                  onMouseEnter={(e) => handleChallengeHover(e, sceneIndex)}
                  onTouchStart={(e) => handleChallengeHover(e, sceneIndex)}
                  onMouseLeave={() => setShowChallenge(null)}
                >
                  <InfoIcon className="w-5 h-5 animate-pulse-slow" />
                  <span className="font-bold uppercase tracking-wider text-xs">Challenge the Narrative</span>
                </div>
              )}
            </div>

            {showChallenge === sceneIndex && currentScene.challenge && (
              <div
                className="fixed z-[200] max-w-sm bg-red-950 border border-red-500/50 rounded-lg p-4 text-sm text-red-200 shadow-2xl pointer-events-none"
                style={{
                  left: '50%',
                  top: '30%',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex items-start gap-2">
                  <InfoIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{currentScene.challenge}</p>
                </div>
              </div>
            )}

            {currentNarration && characterIndex > 0 && currentNarration.type === 'character' && isMaximized && (
              <div className="fixed z-[100] inset-0 flex items-center justify-center pointer-events-none pb-[20vh] md:pb-0">
                <div className={`pointer-events-auto flex items-center justify-center gap-4 max-w-[95vw] md:max-w-[70vw] animate-fade-in-up transition-all duration-500 ${currentNarration.index % 2 === 0 ? 'flex-col' : 'flex-col-reverse'}`}>
                  <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-500 bg-slate-900 flex items-center justify-center text-5xl md:text-6xl shadow-[0_0_20px_rgba(245,158,11,0.4)] z-50">
                    {getCharacterIcon(currentNarration.icon)}
                  </div>
                  <div className="bg-black border border-zinc-800 p-5 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative w-full max-w-lg min-w-[300px]">
                    <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                          {isWelsh(currentNarration.name) ? <span className="text-2xl">{'\uD83C\uDFF4\uFE0F\u200D\u2620\uFE0F'}</span> : <span className="text-2xl">{'\uD83C\uDDEC\uD83C\uDDE7'}</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-lg leading-none">{currentNarration.name}</span>
                          <span className="text-zinc-500 text-sm">@{currentNarration.name.replace(/\s+/g, '')}</span>
                        </div>
                      </div>
                      <button onClick={() => setIsMaximized(false)} className="hover:bg-zinc-900 rounded-full p-1 transition-colors"><CloseIcon /></button>
                    </div>
                    <div className="mb-6">
                      <p className="font-special leading-relaxed text-white">{currentNarration.text}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-zinc-500 text-xs flex gap-2">
                        <span>{currentScene.year}</span> {'\u2022'} <span>{currentScene.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center justify-center w-full bg-slate-950 border-t border-slate-800 relative z-50 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMaximized ? 'h-8' : 'h-32 md:h-24'}`}>
        <div className="absolute top-0 left-0 w-full h-4 z-20 cursor-pointer group flex items-start" onMouseMove={handleProgressClick} onMouseDown={handleProgressClick} onMouseLeave={() => setTooltip(null)}>
          {tooltip && (
            <div className="absolute bottom-full mb-2 bg-slate-900 border border-amber-500 text-amber-500 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none transform -translate-x-1/2" style={{ left: `${tooltip.left}%` }}>
              Slide {tooltip.index}: {tooltip.year}
            </div>
          )}
          <div className="w-full h-1 bg-slate-800/50 relative overflow-visible">
            {timeline.map((_, i) => (
              <div key={i} className={`absolute top-0 h-1 w-[1px] z-10 pointer-events-none ${timeline[i].challenge ? 'bg-red-500/60 w-[2px]' : 'bg-white/20'}`} style={{ left: `${(i / timeline.length) * 100}%` }} />
            ))}
            <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-100 ease-linear group-hover:h-2 group-hover:shadow-[0_0_10px_rgba(220,38,38,0.7)]" style={{ width: `${getSlideProgress()}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-opacity hover:scale-125 cursor-grab active:cursor-grabbing" />
            </div>
          </div>
        </div>

        {!isMaximized && (
          <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center px-4 md:px-12">
            <button onClick={rewindScene} className="absolute left-8 md:left-12 p-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center justify-center gap-6 md:gap-8 relative">
              <div className="flex items-center gap-2 md:flex-col md:order-1 order-1">
                <button onClick={() => { navigator.clipboard.writeText('bc1qddlu48vwmq0zrey0pgc8h02q9edq3jd8pwe3am'); }} className="text-xs font-bold uppercase text-amber-500 hover:text-amber-400 transition-colors" title="Copy BTC Address">BTC</button>
              </div>
              <div className="order-2 md:order-2 z-10">
                <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform hover:scale-105">
                  {isPlayingState ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="relative flex items-center justify-center w-8 h-24 md:w-auto md:h-auto md:flex-col md:order-3 order-3">
                <span className="md:inline text-xs font-bold uppercase text-slate-500 mb-2 md:mb-0 md:static absolute -top-4 whitespace-nowrap hidden md:block">Voice</span>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="md:static absolute w-24 h-2 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer -rotate-90 md:rotate-0 origin-center" />
              </div>
              <button onClick={() => setIsMaximized(!isMaximized)} className="text-slate-500 hover:text-amber-500 transition-colors transform hover:scale-110 ml-2 order-4 md:order-4 hidden md:block"><MaximizeIcon /></button>
            </div>
            <div className="absolute right-8 md:right-12 flex items-center gap-2">
              <stripe-buy-button
                buy-button-id="buy_btn_1RuDNARibisCfpBQBMKwrMVc"
                publishable-key="pk_live_51OqlLnRibisCfpBQQsDU3l2hhMLoKwTcdiokINqNA4wWaLeBM5qkMyJDV3B6TIToBOKCh4WhEzff7isJCLYIJaUB0088uetffQ">
              </stripe-buy-button>
            </div>
          </div>
        )}

        {isMaximized && (
          <button onClick={() => setIsMaximized(false)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 transition-colors"><MaximizeIcon /></button>
        )}
      </div>

      <div className="h-12 w-full bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6 text-sm text-slate-500 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <span>Williams/Buckler Family Estate and Trust</span>
          <span className="text-slate-700">|</span>
          <span className="font-mono text-slate-600">{version}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><FacebookIcon /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><InstagramIcon /></a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
