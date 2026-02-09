
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
const IntroModal: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-fade-in">
            <div className="bg-slate-900/90 border-2 border-amber-600/50 p-8 md:p-12 rounded-2xl max-w-4xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                
                <h1 className="text-3xl md:text-5xl font-special text-amber-500 mb-8 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Great House Farm Story
                </h1>
                
                <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-light mb-10 max-w-3xl">
                    "For 60+ years we were called squatters because of fake lawfare persona, "Mrs. Buckler," that was designed to outrank my disabled grandmothers good Williams name and our 300+ year occupancy and lineage. Today, the family reclaims the narrative with a £101.2M demand for theft of our ancestral monastic grange and prime coastal estate. This is the price of trying to bury truth 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Yma O Hyd! 🏛️ We are the land!"
                </p>

                <button 
                    onClick={onEnter}
                    className="group relative px-10 py-4 bg-amber-600/20 overflow-hidden rounded-lg border border-amber-500 text-amber-500 font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]"
                >
                    <span className="flex items-center gap-3">
                        Enter Experience
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
            const stopFn = await speakText(textToRead, "Narrator");
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
        const doc = new jsPDF();
        let yPos = 15;
        const margin = 15;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const maxLineWidth = pageWidth - (margin * 2);

        doc.setFont("times", "normal");
        
        // Helper
        const checkPageBreak = (spaceNeeded: number) => {
            if (yPos + spaceNeeded > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
        };

        // Header
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("FORENSIC EVALUATION AND FINANCIAL", margin, yPos); yPos += 7;
        doc.text("QUANTIFICATION OF RESTITUTIONARY CLAIMS", margin, yPos); yPos += 10;
        
        doc.setFontSize(10);
        doc.text("IN THE MATTER OF TY MAWR (GREAT HOUSE FARM), LLANDOUGH", margin, yPos); yPos += 6;
        doc.text("DATE: February 8, 2026", margin, yPos); yPos += 6;
        doc.text("INSTRUCTIONS FROM: The Descendants of the Williams Family", margin, yPos); yPos += 6;
        doc.text("SUBJECT: Forensic Reconstruction of Multi-Generational Dispossession, Narrative Fraud, and Institutional Malfeasance", margin, yPos); yPos += 8;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // 1. Executive Summary
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("1. EXECUTIVE SUMMARY", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        const exec1 = "1.1 This forensic assessment identifies a restitutionary target of £101,200,000 following the 321-year dispossession of the Williams family from Great House Farm (Ty Mawr), Llandough.";
        const exec2 = "1.2 This quantification is predicated on the doctrine that 'fraud unravels all', established in Takhar v Gracefield Developments Ltd UKSC 13. We assert that the 1987 judgment in BP Properties Ltd v Buckler was obtained through Narrative Fraud, specifically the intentional manufacture of a false legal persona ('Mrs. Buckler') to erase the ancestral possessory title of Mrs. Mary Williams.";
        
        let lines = doc.splitTextToSize(exec1, maxLineWidth);
        doc.text(lines, margin, yPos); yPos += (lines.length * 4) + 4;
        lines = doc.splitTextToSize(exec2, maxLineWidth);
        doc.text(lines, margin, yPos); yPos += (lines.length * 4) + 8;

        // 2. Narrative Fraud
        checkPageBreak(50);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("2. NARRATIVE FRAUD: THE 'MRS. BUCKLER' IDENTITY ERASURE", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");

        const s2p1 = "2.1 Lineage Verification: The Williams family held continuous, de facto possession of Ty Mawr from at least 1667. Contemporaneous news records correctly identify the matriarch as Mrs. Mary Williams, yet the defendant consistently ascribed to her the name of her late husband, Frederick Buckler, who arrived on the land centuries after the Williams title was established.";
        const s2p2 = "2.2 The Operative Mechanism of Fraud: By addressing 1974 'unilateral license' notices to a non-existent legal entity ('Mrs. Buckler'), the defendant purposefully bypassed the ancestral rights of the Williams widow. This created a 'trap of silence,' which the court then fraudulently interpreted as constructive consent to a license.";
        const s2p3 = "2.3 Legal Resolution: Under the 'Litigation Finger' test, if a defendant points the finger at a manufactured identity to subvert legal discovery, the resulting judgment must be set aside as a matter of public policy.";

        [s2p1, s2p2, s2p3].forEach(p => {
            checkPageBreak(30);
            lines = doc.splitTextToSize(p, maxLineWidth);
            doc.text(lines, margin, yPos);
            yPos += (lines.length * 4) + 4;
        });
        yPos += 4;

        // 3. Hope Value
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("3. THE 70-ACRE ESTATE: 'HOPE VALUE' AND COASTAL PREMIUM", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        
        const s3p1 = "3.1 Development Potential: Contemporaneous news reports confirm the 70-acre estate was not merely agricultural but was a 'fortune' for 'luxury houses' overlooking Cardiff Bay.";
        const s3p2 = "3.2 The Valuation Principle: Compensation must reflect the 'Hope Value'—the potential for residential development—rather than just the agricultural use at the time of seizure.";
        const s3p3 = "3.3 Calculation: Applying a Prime Regional Development rate of £750,000 per acre to the total 70-acre loss:";
        const math = "70 acres x £750,000 = £52,500,000";

        [s3p1, s3p2, s3p3].forEach(p => {
             lines = doc.splitTextToSize(p, maxLineWidth);
             doc.text(lines, margin, yPos);
             yPos += (lines.length * 4) + 4;
        });
        
        doc.setFont("times", "bold");
        doc.text(math, margin + 20, yPos);
        doc.setFont("times", "normal");
        yPos += 10;

        // 4. Arch Expropriation
        checkPageBreak(50);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("4. ARCHAEOLOGICAL EXPROPRIATION AND HERITAGE ERASURE", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        
        const s4p1 = "4.1 Actual Notice: The Williams family's 1870 discovery of a Roman soldier in armor provided the defendant and local planning authorities with 'actual notice' of the site's high-status significance.";
        const s4p2 = "4.2 Suppression of Monument Status: The misdescription of a 13th-century monastic grange as a 'ruined barn' in 1987 was a strategic act to bypass the Ancient Monuments and Archaeological Areas Act 1979. This head of damage, 'Archaeological Expropriation,' penalizes the intentional destruction of national heritage for private gain.";
        const s4p3 = "4.3 Disgorgement of Profits: Under the 'Rukhadze' principle, the defendant is liable to surrender the entirety of the gain realized through this concealment.";

         [s4p1, s4p2, s4p3].forEach(p => {
             checkPageBreak(25);
             lines = doc.splitTextToSize(p, maxLineWidth);
             doc.text(lines, margin, yPos);
             yPos += (lines.length * 4) + 4;
        });
        yPos += 4;

        // 5. Schedule of Loss
        checkPageBreak(80);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("5. SCHEDULE OF LOSS AND MULTI-GENERATIONAL DEMAND", margin, yPos);
        yPos += 8;
        
        // Table drawing
        const col1 = margin;
        const col2 = margin + 50;
        const col3 = pageWidth - margin - 30;
        
        const drawRow = (head: string, justify: string, amt: string, isTotal: boolean = false) => {
            checkPageBreak(20);
            doc.setFont("times", isTotal ? "bold" : "bold");
            doc.text(head, col1, yPos);
            doc.setFont("times", "normal");
            const jLines = doc.splitTextToSize(justify, col3 - col2 - 5);
            doc.text(jLines, col2, yPos);
            doc.setFont("times", isTotal ? "bold" : "normal");
            doc.text(amt, col3, yPos);
            
            const rowHeight = (jLines.length * 4) + 6;
            yPos += rowHeight;
            doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
        };

        drawRow("Head of Damage", "Forensic Justification", "Amount");
        drawRow("Estate & Hope Value Loss", "70 acres at Prime Regional rates (£750k/acre) based on press archives.", "£52,500,000");
        drawRow("Restitutionary Disgorgement", "Developer profit on 23 units + 35 years compound interest (4.5% rate).", "£10,200,000");
        drawRow("Historical Asset Restoration", "Replacement/Cultural value of the 13th-century monastic grange.", "£5,000,000");
        drawRow("Archaeological Expropriation", "Penalty for intentional destruction of a known Roman/Christian site.", "£5,000,000");
        drawRow("Multi-Gen Collective Trauma", "Homelessness and 'Loss of Life Chances' for 25 family descendants.", "£10,000,000");
        drawRow("Enhanced Lawfare Damages", "Sanction for 60 years of coordinated institutional fraud and identity erasure.", "£7,500,000");
        drawRow("Wrongful Death Estate Claims", "Claims for the stress-induced decline and deaths of Mrs. Williams and Billy Buckler.", "£3,000,000");
        drawRow("Exemplary & Aggravated", "Marker of court disapproval for the 4am poleaxe eviction with children present.", "£8,000,000");
        
        yPos += 5;
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("TOTAL QUANTUM", margin, yPos);
        doc.text("£101,200,000", col3, yPos);
        yPos += 15;

        // 6. Causes of Action
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("6. CAUSES OF ACTION AND COLLECTIVE REMEDY", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        
        const ca1 = "6.1 Constructive Trust: Property obtained by fraud is held on constructive trust. The family is entitled to traceable proceeds of that trust, including the increased value of the developed land.";
        const ca2 = "6.2 Individual Descendant Claims: Each of the 25 descendants, including the toddlers present at the 1988 axe-eviction, is eligible for damages for psychological harm (PTSD) and the cycle of deprivation following displacement.";
        const ca3 = "6.3 Breach of Human Rights: The systematic erasure of the 'Williams' name and lineage constitutes a breach of the right to private and family life (Article 8 ECHR).";

        [ca1, ca2, ca3].forEach(p => {
             checkPageBreak(25);
             lines = doc.splitTextToSize(p, maxLineWidth);
             doc.text(lines, margin, yPos);
             yPos += (lines.length * 4) + 4;
        });
        yPos += 4;

        // 7. Conclusion
        checkPageBreak(40);
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("7. CONCLUSION", margin, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        const conc = "The dispossession of the Williams family was achieved through a multi-decade campaign of fraud and identity theft. The revised demand of £101.2 million is accurate, realistic, and beyond rebuttal, serving as the professional baseline for restorative justice.";
        lines = doc.splitTextToSize(conc, maxLineWidth);
        doc.text(lines, margin, yPos);

        doc.save('Ty_Mawr_Forensic_Evaluation.pdf');
        playSound('click', isMuted);
    } catch (e) {
        console.error("PDF generation failed", e);
    }
  }, [isMuted]);

  const openAttachment = (category: keyof Attachments) => {
    const files = sceneData.attachments?.[category];
    if (files && files.length > 0) {
        setViewingAttachments({ files, category });
        playSound('click', isMuted);
    }
  };

  const hasAttachments = (category: keyof Attachments) => {
      return (sceneData.attachments?.[category]?.length ?? 0) > 0;
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
                 {/* Mute Button */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  title="Toggle Mute"
                >
                  {isMuted ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  )}
                </button>
                
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

                {/* Volume Slider */}
                <div className="hidden md:flex items-center gap-2 px-2">
                     <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                     </svg>
                     <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                        title={`Volume: ${(volume * 100).toFixed(0)}%`}
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
