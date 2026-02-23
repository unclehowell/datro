
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { TIMELINE } from './constants';
import Character from './components/Character';
import { SourceType, Source, Attachments, IconType } from './types';
import { speakText } from './services/gemini';

const getSourceIcon = (type: SourceType) => {
  switch (type) {
    case 'court': return '⚖️';
    case 'deed': return '📜';
    case 'news': return '📰';
    case 'report': return '📋';
    case 'archive': return '📁';
    default: return '🔗';
  }
};

const getCharacterIconEmoji = (type: IconType) => {
  switch (type) {
    case 'farmer': return '🧑‍🌾';
    case 'noble': return '🤴';
    case 'judge': return '👨‍⚖️';
    case 'guard': return '💂';
    case 'builder': return '👷';
    case 'ghost': return '👻';
    case 'lawyer': return '👨‍💼';
    case 'worker': return '⛏️';
    case 'ruins': return '🏚️';
    case 'narrator': return '🎙️';
    case 'cleric': return '✝️';
    default: return '👤';
  }
};

const playSound = (type: 'click' | 'beep', muted: boolean) => {
  if (muted) return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'beep') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime); 
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(280, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
    }
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio context errors
  }
};

// New Intro Modal for Audio Interaction Fix
// - Allow highlighting and copying of text on splash
// - Left-align content and enable spellchecking
 const IntroModal: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-fade-in select-text" spellCheck={true}>
            <div className="bg-slate-900/90 border-2 border-amber-600/50 p-8 md:p-12 rounded-2xl max-w-4xl shadow-2xl flex flex-col items-start text-left select-text" spellCheck={true}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-special text-amber-500 mb-6 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Great House Farm Story
                </h1>
                
                <div className="w-full overflow-auto" style={{ maxHeight: '52vh' }}>
                  <p className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-light mb-2">
 Occupied by the Williams family from 1667 • Discoverd and reported a Roman burial in 1870  • No archaeological significants or protections ascribed • Mary Williams marries a Mr. Frederick Buckler in 1900's and he joins her in her 800-year-old farm and MARY RETAINS HER WILLIAMS NAME • 1974 Mary Williams defends her superior claim against BP, but case is only adjourned and appeal interrupted & even quashed • BP asserts title but keeps sidestepping the court ruling of ownership to focus on possession, keeping suppressed the 1870 Roman soldier discovery, which would have suspended housing development plans • All the while cutting off water, electric and poisoning the river and cows to force Mrs Williams off her land, resulting in her having a leg amputated, from a blood clot, from the stress • BP resort to identity fraud • Mrs Williams damned if she did or didn't participate in the fraud. She still chose not too and appealed publically in 1978 • BP Registered Mrs Williams and childrens land as theirs, with land registry as Mary Williams dies • Succession to Mary Williams’ heirs, has been fraudulently interrupted • BP Properties Ltd v Buckler 1987 endorsed the fraud and authorised seizure and demolition BY FORCE & ASAP, while restraining Mary's son with an order and without charges. And dismissing his appeal AND blocking his ECHR request • family forced to live in a bus  • Mary's son abrupty dies in 1991, like his mum before him, at age 41 • Land quietly excavated of Wales largest collection of burials in 1994, before housing development commenses • No public inquiry • As at 2026 £101.2M is the current estimate reperations for the Williams/Buckler family 🏴 Yma o Hyd.
                  </p>
                </div>

                <button 
                    onClick={onEnter}
                    className="group relative px-10 py-4 bg-amber-600/20 overflow-hidden rounded-lg border border-amber-500 text-amber-500 font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                >
                    <span className="flex items-center gap-3">
                        Enter
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </span>
                </button>
                
                <p className="mt-6 text-slate-500 text-xs uppercase tracking-widest">
                    Audio enabled upon entry
                </p>
            </div>
        </div>
    );
};

const AttachmentModal: React.FC<{ 
  files: string[]; 
  category: keyof Attachments; 
  slideIndex: number;
  year: string;
  onClose: () => void 
}> = ({ files, category, slideIndex, year, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentFile = files[currentIndex];
  const safeYear = year.replace(/[^a-zA-Z0-9]/g, "_");
  const filePath = `attachments/${category}/${safeYear}/${currentFile}`;

  const isImage = currentFile.match(/\.(jpeg|jpg|gif|png)$/i) != null;
  const isPDF = currentFile.match(/\.(pdf)$/i) != null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
       <div className="bg-slate-900 border-2 border-amber-600 w-full max-w-6xl h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-2xl relative">
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-amber-600/30">
            <div className="flex items-center gap-4">
               <span className="text-amber-500 font-special uppercase text-xl">
                 {category} | {year}
               </span>
               <span className="text-slate-400 text-sm">
                 File {currentIndex + 1} of {files.length}
               </span>
            </div>
            <button onClick={onClose} className="text-amber-500 hover:text-white text-2xl font-bold">✕</button>
          </div>

          <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden">
             {files.length === 0 ? (
                <div className="text-slate-500 italic">No files found in {filePath}</div>
             ) : (
                <>
                  {isImage && (
                    <img src={filePath} alt={currentFile} className="max-w-full max-h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
                  {isPDF && (
                    <iframe src={filePath} className="w-full h-full" title={currentFile}></iframe>
                  )}
                  {!isImage && !isPDF && (
                     <div className="text-white p-10 text-center">
                        <p className="mb-4">Simulation: Previewing {currentFile}</p>
                        <div className="p-4 border border-slate-700 bg-slate-900 rounded text-amber-500/80 font-mono text-sm max-w-md mx-auto">
                           [This is a placeholder for file content located at {filePath}]
                        </div>
                     </div>
                  )}
                </>
             )}
          </div>

          {files.length > 1 && (
             <div className="absolute inset-y-0 left-0 flex items-center">
                <button 
                  onClick={() => setCurrentIndex(prev => (prev === 0 ? files.length - 1 : prev - 1))}
                  className="bg-black/50 p-4 text-white hover:bg-black/80 transition-all"
                >◀</button>
             </div>
          )}
          {files.length > 1 && (
             <div className="absolute inset-y-0 right-0 flex items-center">
                <button 
                  onClick={() => setCurrentIndex(prev => (prev === files.length - 1 ? 0 : prev + 1))}
                  className="bg-black/50 p-4 text-white hover:bg-black/80 transition-all"
                >▶</button>
             </div>
          )}
       </div>
    </div>
  );
};

const SourceModal: React.FC<{ source: Source | null; onClose: () => void }> = ({ source, onClose }) => {
  if (!source) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md text-base">
      <div className="bg-slate-900 border-2 border-amber-600 w-full max-w-5xl h-[85vh] flex flex-col rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-amber-600/30">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{getSourceIcon(source.type)}</span>
            <span className="font-special text-amber-500 text-lg uppercase tracking-widest">{source.label}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-amber-500 hover:bg-amber-600 hover:text-black rounded-full transition-all text-2xl font-bold">✕</button>
        </div>
        <div className="flex-1 bg-white">
          <iframe src={source.url} className="w-full h-full border-none" title={source.label} />
        </div>
      </div>
    </div>
  );
};

const SlideSelector: React.FC<{ onClose: () => void; onSelect: (index: number) => void }> = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-5xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-special text-amber-500 uppercase tracking-widest">Jump to Timeline Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-slate-950">
          {TIMELINE.map((entry, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className="flex items-center justify-start p-6 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/50 transition-all text-left group"
            >
              <div className="text-xl md:text-2xl font-bold font-special transition-colors">
                 <span className="text-cyan-500 group-hover:text-cyan-400 mr-3">{idx + 1} |</span>
                 <span className="text-slate-300 group-hover:text-white">{entry.year}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const embossedTextStyle: React.CSSProperties = {
  textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 1px rgba(255,255,255,0.1)',
};

const Footer: React.FC = () => {
    const shareUrl = "https://ai.studio/apps/drive/1UZONPMtpfCf0FQnmHr2omVGqzr7Fkmtu?fullscreenApplet=true";
    const shareText = "Discover the Great House Farm scandal. #History #LegalBattle";

    return (
        <div className="h-auto bg-slate-900 border-t border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-40 text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-4">
               <span className="uppercase tracking-widest font-bold text-amber-600/80 text-xl md:text-2xl font-special">Great House Farm Scandal</span>
            </div>
            
            <div className="flex items-center gap-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <span className="w-px h-4 bg-slate-700"></span>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  // Intro Modal State
  const [showIntro, setShowIntro] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [currentSlide, setCurrentSlide] = useState(13); 
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  
  const [viewingAttachments, setViewingAttachments] = useState<{files: string[], category: keyof Attachments} | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true); 
  // Default volume 5%
  const [volume, setVolume] = useState(0.05); 
  

  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const stopNarrationRef = useRef<(() => void) | null>(null);

  const sceneData = TIMELINE[currentSlide];

  // Handler for entering the experience from the intro modal
  const handleEnterExperience = () => {
      setShowIntro(false);
      setHasStarted(true);
      
      // Trigger audio playback immediately on user interaction
      if (audioRef.current) {
          audioRef.current.volume = volume;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  console.log("Playback failed despite interaction:", error);
              });
          }
      }
  };

  // Handle Volume Changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle Playback State changes (Mute/Pause buttons)
  useEffect(() => {
    if (audioRef.current && hasStarted) {
        audioRef.current.volume = volume;

        if (isPlayingMusic && !isMuted) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                   // Expected if no interaction yet, but handled by IntroModal now
                   console.log("Auto-playback check:", error);
                });
            }
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlayingMusic, isMuted, hasStarted]);

  useEffect(() => {
    if (isMuted) {
      if (stopNarrationRef.current) {
        stopNarrationRef.current();
        stopNarrationRef.current = null;
      }
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  // Evidence directories probe: check for available evidence in folders
  useEffect(() => {
    const cats: Array<keyof Attachments> = ['gallery', 'legal', 'news', 'notes', 'report'];
    Promise.all(cats.map(async (c) => {
      try {
        const r = await fetch(`/static/bpvsbuckler/static/bpvsbuckler/files/${c}/manifest.json`, { method: 'HEAD' as any });
        return r.ok;
      } catch {
        return false;
      }
    })).then(results => {
      const map: Partial<{[K in keyof Attachments]: boolean}> = {};
      cats.forEach((c, idx) => { map[c] = !!results[idx]; });
      setEvidenceAvailable(map as any);
    });
  }, []);

  // Narrator Logic - Reads Year then Text
  useEffect(() => {
    if (stopNarrationRef.current) {
      stopNarrationRef.current();
      stopNarrationRef.current = null;
    }

    if (isMuted || !hasStarted) return;

    let isMounted = true;
    
    // Updated: Read Year then Narration
    const textToRead = `${sceneData.year}. ${sceneData.narration}`;

    if (textToRead) {
        const timeoutId = setTimeout(async () => {
            if (!isMounted) return;
            const stopFn = await speakTextWithVolume(textToRead, "Narrator");
            if (!isMounted) {
                stopFn();
            } else {
                stopNarrationRef.current = stopFn;
            }
        }, 500);
        
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (stopNarrationRef.current) {
                stopNarrationRef.current();
                stopNarrationRef.current = null;
            }
        };
    }
  }, [currentSlide, sceneData, isMuted, hasStarted]); 

  const handleNext = useCallback(() => {
    const numSpeakers = sceneData.scenes.length;
    
    if (currentStep < numSpeakers) {
      playSound('click', isMuted);
      setCurrentStep(prev => prev + 1);
    } else {
      playSound('beep', isMuted);
      if (currentSlide < TIMELINE.length - 1) {
        setCurrentSlide(prev => prev + 1);
        setCurrentStep(1);
      } else {
        setCurrentSlide(0);
        setCurrentStep(1);
      }
    }
  }, [currentSlide, currentStep, sceneData, isMuted]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      playSound('click', isMuted);
      setCurrentStep(prev => prev - 1);
    } else {
      playSound('beep', isMuted);
      if (currentSlide > 0) {
        const prevIdx = currentSlide - 1;
        setCurrentSlide(prevIdx);
        setCurrentStep(TIMELINE[prevIdx].scenes.length);
      } else {
        const lastIdx = TIMELINE.length - 1;
        setCurrentSlide(lastIdx);
        setCurrentStep(TIMELINE[lastIdx].scenes.length);
      }
    }
  }, [currentSlide, currentStep, isMuted]);

  const downloadScript = useCallback(() => {
    try {
      const doc = new jsPDF();
      let yPos = 10;
      const margin = 10;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const maxLineWidth = pageWidth - (margin * 2);

      doc.setFont("courier", "normal");
      doc.setFontSize(10);

      const addText = (text: string, isBold: boolean = false) => {
          doc.setFont("courier", isBold ? "bold" : "normal");
          const lines = doc.splitTextToSize(text, maxLineWidth);
          
          lines.forEach((line: string) => {
              if (yPos > pageHeight - margin) {
                  doc.addPage();
                  yPos = margin;
              }
              doc.text(line, margin, yPos);
              yPos += 5; 
          });
      };

      addText("GREAT HOUSE FARM STORY - SCRIPT", true);
      yPos += 5;
      addText("=================================", true);
      yPos += 10;

      TIMELINE.forEach((entry, idx) => {
          if (yPos > pageHeight - 30) {
               doc.addPage();
               yPos = margin;
          }
          addText(`SCENE ${idx + 1}: ${entry.year}`, true);
          addText(`Location: ${entry.location}`);
          addText("------------------------------------------------");
          addText(`NARRATION: ${entry.narration}`);
          yPos += 2;
          
          entry.scenes.forEach(scene => {
            addText(`${scene.character.toUpperCase()}: ${scene.text}`);
          });
          
          yPos += 5;
          addText("=================================");
          yPos += 10;
      });

      doc.save('great-house-farm-script.pdf');
      playSound('click', isMuted);
    } catch (e) {
      console.error("Download failed", e);
    }
  }, [isMuted]);

  const downloadLawsuitPDF = useCallback(() => {
    try {
      // Download a prebuilt PDF from the static assets directory
      const pdfUrl = '/static/bpvsbuckler/files/pdf/slide-1/latest.pdf';
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'Ty_Mawr_Forensic_Evaluation_Lawsuit.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      playSound('click', isMuted);
    } catch (e) {
      console.error("Lawsuit download failed", e);
    }
  }, [isMuted]);

  const openAttachment = (category: keyof Attachments) => {
    const files = sceneData.attachments?.[category];
    if (files && files.length > 0) {
        setViewingAttachments({ files, category });
        playSound('click', isMuted);
        return;
    }
    // If no local files, but evidence directories exist, show a placeholder file from the folder
    if (evidenceAvailable[category]) {
      const placeholderFiles: Record<string, string[]> = {
        gallery: ['sample.jpg'],
        legal: ['latest.pdf'],
        news: ['latest.pdf'],
        notes: ['notes.txt'],
        report: ['report.pdf'],
      };
      const chosen = placeholderFiles[category] ?? [];
      if (chosen.length > 0) {
        setViewingAttachments({ files: chosen, category });
        playSound('click', isMuted);
      }
    }
  };
  // Text-to-Speech (TTS) volume control
  const [ttsVolume, setTtsVolume] = useState(0.8);
  // Wrapper to call TTS with volume
  const speakTextWithVolume = async (text: string, speaker: string) => {
    const fn: any = speakText;
    try {
      return await fn(text, speaker, ttsVolume);
    } catch {
      try {
        return await fn(text, speaker);
      } catch {
        return null;
      }
    }
  };

  const [evidenceAvailable, setEvidenceAvailable] = useState<{[K in keyof Attachments]?: boolean}>({});
  const hasAttachments = (category: keyof Attachments) => {
      const local = (sceneData.attachments?.[category]?.length ?? 0) > 0;
      const global = evidenceAvailable[category];
      return local || !!global;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none relative text-base bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.8)_0%,_rgba(0,0,0,0.9)_100%)]">
      
      {showIntro && (
         <IntroModal onEnter={handleEnterExperience} />
      )}

      <audio 
          ref={audioRef} 
          loop 
          src="https://stream.rcs.revma.com/fxp289cp81uvv"
          // Ensure volume is set immediately when the element loads
          onLoadStart={(e) => { (e.currentTarget as HTMLAudioElement).volume = volume; }}
      />

      <div className="absolute top-0 left-0 w-full flex justify-center items-start pt-2 pointer-events-none z-0">
         <div className="w-full flex justify-between px-4 opacity-5">
           {"GREAT HOUSE FARM STORY".split('').map((char, i) => (
             <span key={i} className="text-[12vw] font-black text-slate-300 leading-none whitespace-nowrap uppercase tracking-tighter" style={embossedTextStyle}>
               {char}
             </span>
           ))}
         </div>
      </div>

      {/* TOP CENTERED CONTROL BAR: Audio | Evidence | Slide */}
      <div className="absolute top-6 left-0 w-full flex justify-center items-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 p-2 flex items-center gap-4 shadow-2xl">
              
              {/* GROUP 1: Audio Controls */}
              <div className="flex items-center gap-2">
                {/* Music Play/Pause */}
                <button
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    disabled={isMuted}
                    className={`p-3 rounded-full transition-all ${
                        isPlayingMusic 
                            ? 'text-amber-500' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    } ${isMuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Play/Pause Background Radio"
                  >
                      {isPlayingMusic ? (
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                </button>

                {/* Master Volume (audio) */}
                <div className="hidden md:flex items-center gap-2 px-2" aria-label="Master Volume">
                     <span className="text-slate-400 text-xs">Master Volume</span>
                     <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                        title={`Volume: ${(volume * 100).toFixed(0)}%`}
                     />
                </div>
                
                {/* PPT: Add separate TTS Volume control on bar middle (right side) */}
                <div className="hidden md:flex items-center gap-2 px-2" aria-label="TTS Volume">
                     <span className="text-slate-400 text-xs">TTS Volume</span>
                     <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={ttsVolume}
                        onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                        title={`TTS Volume: ${(ttsVolume * 100).toFixed(0)}%`}
                     />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-700 mx-2"></div>

              {/* GROUP 2: Tools (Lawsuit, Icons, Script) */}
              <div className="flex items-center gap-2">
                 {/* Lawsuit */}
                  <button 
                    onClick={downloadLawsuitPDF}
                    className="p-3 hover:bg-red-900/30 text-red-400 rounded-full hover:text-red-300 transition-all"
                    title="Download £101.2M Lawsuit"
                  >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </button>

                  {/* Evidence Icons */}
                   {[
                     { key: 'gallery', icon: '🖼️', title: 'Gallery' },
                     { key: 'legal', icon: '⚖️', title: 'Legal' },
                     { key: 'news', icon: '📰', title: 'News' },
                     { key: 'notes', icon: '📝', title: 'Notes' },
                     { key: 'report', icon: '📋', title: 'Reports' }
                   ].map(item => {
                        const active = hasAttachments(item.key as keyof Attachments);
                        const ext = item.key === 'gallery' ? 'jpg' : item.key === 'notes' ? 'txt' : 'pdf';
                       return (
                            <button 
                               key={item.key}
                               onClick={() => active && openAttachment(item.key as keyof Attachments)} 
                               disabled={!active}
                               className={`p-2 rounded-full transition-all text-xl ${
                                   active 
                                       ? 'text-amber-500 hover:bg-slate-700 scale-110' 
                                       : 'text-slate-600 opacity-20 cursor-not-allowed grayscale'
                               }`} 
                               title={active ? item.title : `No ${item.title}`}
                            >
                                {item.icon}
                                <span className="text-[0.6rem] ml-1 text-slate-300">{ext}</span>
                            </button>
                       );
                   })}

                  {/* Script */}
                  <button 
                    onClick={downloadScript}
                    className="p-3 hover:bg-amber-900/30 text-amber-500 rounded-full hover:text-amber-300 transition-all"
                    title="Download Script"
                  >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </button>
              </div>

              <div className="w-px h-8 bg-slate-700 mx-2"></div>

              {/* GROUP 3: Slide Selector */}
              <button 
                onClick={() => setShowSlideSelector(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-full transition-all group"
                title="Jump to Slide"
             >
                 <span className="text-xl font-bold text-amber-500 font-special group-hover:text-amber-400">
                    {currentSlide + 1} <span className="text-sm text-slate-500 group-hover:text-slate-300">/ {TIMELINE.length}</span>
                 </span>
             </button>

          </div>
      </div>

      {/* DIALOGUE BAR - Adjusted Min Height & Top Spacing */}
      <div className="min-h-[14rem] w-full bg-transparent border-b border-amber-900/50 flex flex-col items-center justify-center p-6 pt-32 relative z-40 shrink-0">
         <div className="max-w-6xl w-full flex items-center justify-center gap-8 md:gap-12">
            {sceneData.scenes.map((scene, idx) => {
                 if (currentStep === idx + 1) {
                     const isRight = scene.side === 'right';
                     const characterDisplay = (
                        <div className={`flex flex-col items-center gap-2 animate-fade-in shrink-0 ${isRight ? 'order-last md:order-none' : ''}`}>
                            <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center text-5xl bg-slate-900 border-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                style={{ borderColor: scene.color }}
                            >
                                {getCharacterIconEmoji(scene.icon)}
                            </div>
                            <span 
                                className="text-amber-500 font-bold uppercase tracking-widest text-xs bg-slate-900/80 px-3 py-1 rounded border border-slate-700"
                                style={{ color: scene.color }}
                            >
                                {scene.character}
                            </span>
                        </div>
                     );

                     return (
                         <div key={idx} className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full justify-center">
                            
                            {!isRight && characterDisplay}

                            <div className="flex-1 text-center animate-fade-in-up max-w-2xl order-last md:order-none">
                                <p className="text-xl md:text-3xl text-white font-medium font-special leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                    "{scene.text}"
                                </p>
                            </div>

                            {/* Mobile Right Side Logic: Text must be BELOW icon. 
                                Flex-col order: Icon (First), Text (Last).
                                Right Side Char variable `characterDisplay` is used for desktop. 
                                For mobile right side, we manually recreate structure to enforce order.
                            */}
                            {isRight && (
                                <div className="contents md:hidden">
                                     <div className="flex flex-col items-center gap-2 animate-fade-in shrink-0 order-first">
                                        <div 
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl bg-slate-900 border-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                            style={{ borderColor: scene.color }}
                                        >
                                            {getCharacterIconEmoji(scene.icon)}
                                        </div>
                                        <span 
                                            className="text-amber-500 font-bold uppercase tracking-widest text-xs bg-slate-900/80 px-3 py-1 rounded border border-slate-700"
                                            style={{ color: scene.color }}
                                        >
                                            {scene.character}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {isRight && (
                                <div className="hidden md:flex flex-col items-center gap-2 animate-fade-in shrink-0">
                                    <div 
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-5xl bg-slate-900 border-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                        style={{ borderColor: scene.color }}
                                    >
                                        {getCharacterIconEmoji(scene.icon)}
                                    </div>
                                    <span 
                                        className="text-amber-500 font-bold uppercase tracking-widest text-xs bg-slate-900/80 px-3 py-1 rounded border border-slate-700"
                                        style={{ color: scene.color }}
                                    >
                                        {scene.character}
                                    </span>
                                </div>
                            )}
                         </div>
                     );
                 }
                 return null;
            })}
         </div>
      </div>

      {/* BOTTOM NAVIGATION BAR - Simplified */}
      <div className="h-20 w-full bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 z-40 relative shadow-2xl shrink-0">
          <button 
            onClick={handlePrev}
            className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-600"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            <span className="hidden md:inline font-bold uppercase tracking-wider text-lg">Prev</span>
          </button>

          <button 
            onClick={handleNext}
            className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-600"
          >
            <span className="hidden md:inline font-bold uppercase tracking-wider text-lg">Next</span>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
      </div>

      {/* SCRIPT SECTION */}
      <section className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col z-20 min-h-0 basis-0 grow">
         <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-slate-950">
             <div className="flex h-full flex-col md:flex-row">
                <div className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-slate-800/50 shrink-0 flex flex-col gap-4 bg-amber-900/10">
                   <span className="font-bold font-special text-3xl text-amber-500 animate-fade-in">
                      {sceneData.year}
                   </span>
                   <span className="text-slate-300 uppercase tracking-wider leading-relaxed text-sm animate-fade-in">
                      {sceneData.location}
                   </span>
                   <div className="mt-2 flex gap-3 flex-wrap animate-fade-in">
                      {sceneData.sources.map((s, i) => (
                         <span key={i} title={s.label} className="text-2xl opacity-80 hover:opacity-100 transition-opacity">{getSourceIcon(s.type)}</span>
                      ))}
                   </div>
                </div>

                <div className="flex-1 p-8 relative flex flex-col justify-start overflow-y-auto">
                   <div className="text-xl md:text-2xl leading-relaxed text-slate-200 font-light font-special relative max-w-5xl animate-fade-in">
                      <p>
                         {sceneData.description}
                      </p>
                   </div>

                    {sceneData.sources && sceneData.sources.length > 0 && (
                        <div className="mt-6 flex justify-end animate-fade-in">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSource(sceneData.sources[0]);
                            }}
                            className="text-base text-amber-500 hover:text-amber-400 underline decoration-dotted underline-offset-8 font-bold flex items-center gap-2 hover:translate-x-1 transition-transform"
                          >
                             Read more <span className="text-sm align-top">🔗</span>
                          </button>
                        </div>
                    )}
                   
                   <div className="mt-8 pt-6 border-t border-slate-800 text-lg text-cyan-500/90 italic animate-fade-in delay-300">
                      Narrator: "{sceneData.year}. {sceneData.narration}"
                   </div>
                </div>
             </div>
         </div>
         
         <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-20"></div>
      </section>

      <Footer />

      {selectedSource && (
         <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}

      {viewingAttachments && (
         <AttachmentModal 
            files={viewingAttachments.files} 
            category={viewingAttachments.category}
            slideIndex={currentSlide}
            year={sceneData.year}
            onClose={() => setViewingAttachments(null)} 
         />
      )}

      {showSlideSelector && (
          <SlideSelector 
            onClose={() => setShowSlideSelector(false)}
            onSelect={(index) => {
                setCurrentSlide(index);
                setCurrentStep(1);
                setShowSlideSelector(false);
                playSound('click', isMuted);
            }}
          />
      )}
    </div>
  );
};

export default App;
