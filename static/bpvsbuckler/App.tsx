import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { TIMELINE } from './constants';
import { SourceType, Source, Attachments, IconType, LocationCategory } from './types';
import { speakText, stopSpeech, pauseSpeech, resumeSpeech } from './services/gemini';
import { Puck, Render, Data } from '@measured/puck';
import { config, initialData } from './cms';

// --- Icons ---

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

const getCharacterIconEmoji = (type: IconType | LocationCategory | 'narrator') => {
  switch (type) {
    // Characters
    case 'farmer': return '🧑‍🌾';
    case 'noble': return '🤴';
    case 'judge': return '👨‍⚖️';
    case 'guard': return '💂';
    case 'builder': return '👷';
    case 'ghost': return '👻';
    case 'lawyer': return '👨‍💼';
    case 'worker': return '⛏️';
    case 'cleric': return '✝️';
    case 'news': return '📰';
    // Locations (for Narrator)
    case 'farm': return '🏡';
    case 'court': return '⚖️';
    case 'other': return '📍';
    case 'ruins': return '🏚️';
    case 'archive': return '📁';
    case 'narrator': return '🎙️';
    default: return '👤';
  }
};

const getFileIcon = (type: 'pdf' | 'image' | 'text' | 'markdown' | 'link') => {
  switch (type) {
    case 'pdf':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v6h6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4" />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'text':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'markdown':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    default:
      return <span>?</span>;
  }
};

const CloseIcon = () => (
    <svg className="w-6 h-6 text-white hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10v8H6v-8h12zm-9-5V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
);

const TVIcon = () => (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 2l-5 5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// --- Helpers ---

const isWelshCharacter = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('williams') || n.includes('buckler') || n.includes('family') || n.includes('ancestor') || n.includes('occupant') || n.includes('janet') || n.includes('branwen') || n.includes('billy') || n.includes('mary') || n.includes('rhys') || n.includes('descendant') || n.includes('activist');
};

const getSpeakerFlag = (name: string) => {
    if (isWelshCharacter(name)) {
        return <span className="text-2xl">🏴󠁧󠁢󠁷󠁬󠁳󠁿</span>;
    }
    // Everyone else
    return <span className="text-2xl">🇬🇧</span>;
};

const getCharacterVoiceConfig = (characterName: string, isNarrator: boolean) => {
  // Speed boosted by 10% (1.0 -> 1.1)
  if (isNarrator) {
    return { pitch: 0.7, rate: 1.1, gender: 'male' as const }; // Deep male narrator
  }
  const lowerName = characterName.toLowerCase();
  
  // Female characters
  if (lowerName.includes('mary') || lowerName.includes('branwen') || lowerName.includes('mrs') || lowerName.includes('jane') || lowerName.includes('janet') || lowerName.includes('nancy')) {
    return { pitch: 1.2, rate: 1.1, gender: 'female' as const };
  }
  
  // Authority figures (Male but slightly different from default)
  if (lowerName.includes('judge') || lowerName.includes('bailiff') || lowerName.includes('police') || lowerName.includes('guard')) {
    return { pitch: 0.8, rate: 1.1, gender: 'male' as const };
  }
  
  // Standard Male
  return { pitch: 1.0, rate: 1.1, gender: 'male' as const };
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
  } catch (e) { }
};

// Format text logic
const formatTextWithYear = (text: string, yearLabel: string) => {
    const cleanText = text.replace(/^(year\s+)?[\d–-]+\s*(to\s+\d+)?[\.:]\s*/i, '');
    return `${yearLabel}. ${cleanText}`;
};

// Word/Char Index Mappers for syncing highlighting with phonetic substitutions
const getWordIndex = (text: string, charIndex: number) => {
    const sub = text.substring(0, charIndex);
    return sub.trim().split(/\s+/).length - 1;
};

const getCharIndexByWord = (text: string, wordIndex: number) => {
    const words = text.split(/\s+/);
    if (wordIndex >= words.length) return text.length;
    let charCount = 0;
    for (let i = 0; i < wordIndex; i++) {
        charCount += words[i].length + 1; // +1 for space assumption (approximate but sufficient for reading sync)
    }
    return charCount;
};


const generateScriptPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);

    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text("GREAT HOUSE FARM: A CHRONICLE OF DISPOSSESSION", margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setFont("courier", "normal");

    TIMELINE.forEach((entry) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        doc.setFont("courier", "bold");
        doc.text(`SCENE: ${entry.year} - ${entry.location}`, margin, y);
        y += 7;
        
        // Narrator
        doc.setFont("courier", "italic");
        const narLines = doc.splitTextToSize(`NARRATOR: ${entry.narration}`, maxLineWidth);
        doc.text(narLines, margin, y);
        y += (narLines.length * 5) + 5;

        // Characters
        entry.scenes.forEach(scene => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("courier", "bold");
            doc.text(`${scene.character.toUpperCase()}:`, margin, y);
            y += 5;
            doc.setFont("courier", "normal");
            const lines = doc.splitTextToSize(scene.text, maxLineWidth);
            doc.text(lines, margin, y);
            y += (lines.length * 5) + 5;
        });
        
        y += 5;
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
    });

    doc.save("great_house_farm_script.pdf");
};

const generateClaimPDF = (content: string) => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("Forensic Evaluation and Restitutionary Brief", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("Semantic Version 0.7", margin, y);
    y += 15;

    doc.setFont("courier", "normal");
    const lines = doc.splitTextToSize(content, maxLineWidth);
    
    for (let i = 0; i < lines.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(lines[i], margin, y);
        y += 5;
    }
    
    doc.save("great_house_farm_claim.pdf");
};

// --- Components ---

const IntroModal: React.FC<{ onEnter: () => void, data: Data }> = ({ onEnter, data }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="bg-slate-900/90 border-2 border-amber-600/50 p-6 md:p-10 rounded-2xl max-w-4xl max-h-[90vh] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                
                <div className="overflow-y-auto mb-8 pr-2 scrollbar-thin scrollbar-thumb-amber-600/50 scrollbar-track-slate-800/30 text-left w-full">
                    <Render config={config} data={data} />
                </div>

                <button 
                    onClick={onEnter}
                    className="group relative px-10 py-3 bg-amber-600/20 overflow-hidden rounded-lg border border-amber-500 text-amber-500 font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] shrink-0"
                >
                    <span className="flex items-center gap-3">
                        Enter
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </span>
                </button>
            </div>
        </div>
    );
};

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
        <h2 className="text-2xl font-bold text-amber-500 mb-6 font-special uppercase tracking-wider">Access Evidence</h2>
        <p className="text-slate-300 mb-8">Please login to view confidential evidence files.</p>
        
        <div className="flex flex-col gap-4">
          <button className="flex items-center justify-center gap-3 bg-white text-black py-3 rounded hover:bg-gray-200 font-bold transition-colors">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-5 h-5"/>
            Continue with Google
          </button>
          <button className="flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 rounded hover:bg-[#155db2] font-bold transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Continue with Facebook
          </button>
          <button className="flex items-center justify-center gap-3 bg-black text-white border border-slate-700 py-3 rounded hover:bg-slate-800 font-bold transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Continue with X
          </button>
        </div>
      </div>
    </div>
  );
};

const SourceModal: React.FC<{ source: Source; onClose: () => void }> = ({ source, onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
        <div className="text-6xl mb-4">{getSourceIcon(source.type)}</div>
        <h2 className="text-2xl font-bold text-amber-500 mb-2 font-special uppercase tracking-wider">{source.label}</h2>
        <div className="text-slate-400 uppercase text-xs tracking-widest mb-6">{source.type}</div>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors">
          Access Record
        </a>
      </div>
    </div>
  );
};

const AttachmentModal: React.FC<{ files: string[]; category: string; slideIndex: number; year: string; onClose: () => void }> = ({ files, category, year, onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-amber-500 uppercase tracking-wider">{category} ARCHIVE</h2>
            <span className="text-slate-500 text-sm font-mono">YEAR: {year}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.length > 0 ? files.map((file, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded hover:border-amber-500/50 hover:bg-slate-800 transition-all cursor-pointer group flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded bg-slate-900 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                📄
              </div>
              <span className="text-xs text-slate-400 text-center break-all">{file}</span>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-20">
              <span className="text-4xl mb-4">🚫</span>
              <p>No records declassified for this period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'timeline' | 'claim' | 'script'>('timeline');
  const [showIntro, setShowIntro] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [currentStep, setCurrentStep] = useState(0); // 0 = Narrator, 1+ = Characters
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Audio State
  const [isPlayingMusic, setIsPlayingMusic] = useState(true); 
  // Set default music slider volume to 0.1 (10% on slider), which translates to 0.01 (1%) actual volume
  const [musicVolume, setMusicVolume] = useState(0.1); 
  const [narratorVolume, setNarratorVolume] = useState(0.5); 
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isNarratorMuted, setIsNarratorMuted] = useState(false);

  // AutoPlay State (Serves as general Play/Pause state)
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef(autoPlay); // Ref for interval closure
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const [showTweet, setShowTweet] = useState(true);
  
  // Progress Bar State
  const [hoverSlide, setHoverSlide] = useState<{ index: number, year: string, left: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // CMS State
  const [splashData, setSplashData] = useState<Data>(initialData.splash);
  const [claimData, setClaimData] = useState<Data>(initialData.claim);
  const [scriptData, setScriptData] = useState<Data>(initialData.script);
  const [isEditing, setIsEditing] = useState(false);
  const [editorTarget, setEditorTarget] = useState<'splash' | 'claim' | 'script'>('splash');
  
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [activeSpeaker, setActiveSpeaker] = useState<{name: string, icon: IconType | LocationCategory | 'narrator', text: string, type: 'character' | 'narrator', year?: string, side?: 'left' | 'right' | 'center', index?: number} | null>(null);

  // New State for Modals
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<{ files: string[], category: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const sceneData = TIMELINE[currentSlide];

  // Helper for text reading time (Fallback)
  const estimateReadingTime = (text: string) => {
      // 200ms per char + buffer
      return (text.length * 200) + 2000;
  };

  const handleEnterExperience = () => {
      setShowIntro(false);
      setHasStarted(true);
      setAutoPlay(true);
  };

  const handleNext = useCallback(() => {
    if (currentStep < sceneData.scenes.length) {
      playSound('click', false);
      setCurrentStep(prev => prev + 1);
    } else {
      playSound('beep', false);
      if (currentSlide < TIMELINE.length - 1) {
        setCurrentSlide(prev => prev + 1);
        setCurrentStep(0); // Reset to Narrator
      } else {
        // Loop or stop? For now stop autoplay at end
        setAutoPlay(false);
        setCurrentSlide(0);
        setCurrentStep(0);
      }
    }
  }, [currentSlide, currentStep, sceneData]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      playSound('click', false);
      setCurrentStep(prev => prev - 1);
    } else {
      playSound('beep', false);
      if (currentSlide > 0) {
        const prevIdx = currentSlide - 1;
        setCurrentSlide(prevIdx);
        setCurrentStep(TIMELINE[prevIdx].scenes.length);
      } else {
        const lastIdx = TIMELINE.length - 1;
        setCurrentSlide(lastIdx);
        setCurrentStep(0);
      }
    }
  }, [currentSlide, currentStep]);

  // Handle Dragging / Seeking on Progress Bar
  const handleProgressBarInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, x / width));
      const targetSlideIndex = Math.min(TIMELINE.length - 1, Math.floor(percentage * TIMELINE.length));
      
      // Update Hover State for Tooltip
      const slide = TIMELINE[targetSlideIndex];
      setHoverSlide({
          index: targetSlideIndex + 1,
          year: slide.year,
          left: (targetSlideIndex / TIMELINE.length) * 100
      });
      
      // If clicking or dragging, update actual slide
      if (e.buttons === 1) { // Left mouse button down
          setCurrentSlide(targetSlideIndex);
          setCurrentStep(0);
          setIsDragging(true);
      }
  };
  
  const handleMouseUp = () => {
      setIsDragging(false);
  };

  // Music Volume & Mute Logic
  useEffect(() => {
    if (audioRef.current) {
        // Effective volume calculation: slider value * 0.1
        // Slider 0.1 (10%) -> Actual 0.01 (1%)
        // Slider 0.2 (20%) -> Actual 0.02 (2%)
        audioRef.current.volume = isMusicMuted ? 0 : musicVolume * 0.1;
    }
  }, [musicVolume, isMusicMuted]);

  // Effect to handle Play/Pause logic for both Audio and Text Highlighting
  useEffect(() => {
    autoPlayRef.current = autoPlay; // Sync ref

    if (hasStarted) {
        const audio = audioRef.current;
        if (autoPlay) {
            if (audio) {
                // Catch potential play interruption errors
                audio.play().catch(e => {
                   // We ignore AbortError as it is expected during rapid toggling
                   if (e.name !== 'AbortError') console.error("Audio play error", e);
                });
            }
            resumeSpeech();
        } else {
            if (audio) audio.pause();
            pauseSpeech();
        }
    }
  }, [autoPlay, hasStarted]);

  // Sequential Voice & Text Logic
  useEffect(() => {
    if (currentView !== 'timeline') {
        stopSpeech();
        return;
    }

    stopSpeech();
    setHighlightIndex(-1);
    setShowTweet(true); 

    if (!hasStarted) return;
    
    const effectiveNarratorVolume = isNarratorMuted ? 0 : narratorVolume;
    
    let isMounted = true;
    let textToRead = "";
    let speakerName = "";
    let speakerIcon: any = "narrator";
    let speakerType: 'character' | 'narrator' = 'narrator';
    let speakerSide: 'left' | 'right' | 'center' = 'center';
    let charIndex = 0;

    // Step 0: Narrator
    if (currentStep === 0) {
        textToRead = formatTextWithYear(sceneData.narration, sceneData.year);
        speakerName = "Narrator";
        speakerIcon = sceneData.locationType;
        speakerType = 'narrator';
    } 
    // Step 1+: Characters
    else {
        const activeScene = sceneData.scenes[currentStep - 1];
        if (activeScene) {
             textToRead = activeScene.text; 
             speakerName = activeScene.character;
             speakerIcon = activeScene.icon;
             speakerType = 'character';
             speakerSide = activeScene.side;
             charIndex = currentStep - 1;
        }
    }

    if (!textToRead) return;

    // Reset highlight before starting new sequence
    setHighlightIndex(-1);

    const runSequence = async () => {
        if (!isMounted) return;
        
        setActiveSpeaker({
            name: speakerName,
            icon: speakerIcon,
            text: textToRead,
            type: speakerType,
            year: sceneData.year,
            side: speakerSide,
            index: charIndex
        });

        // Use hyphenated phonetic replacements to keep word count generally consistent for highlighting sync
        const phoneticText = textToRead
            .replace(/Ty Mawr/gi, "Tea-mou Rhough")
            .replace(/Llandough/gi, "Lan-dock");

        // 1. Audio Logic (Independent)
        if (effectiveNarratorVolume > 0) {
            const config = { 
                ...getCharacterVoiceConfig(speakerName, speakerType === 'narrator'), 
                volume: effectiveNarratorVolume,
                onBoundary: (e: SpeechSynthesisEvent) => {
                    // Sync highlighting with audio word boundaries
                    if (e.name === 'word') {
                        // Map the spoken char index (phonetic) to a word index
                        const wIndex = getWordIndex(phoneticText, e.charIndex);
                        // Map the word index back to the display char index
                        const dIndex = getCharIndexByWord(textToRead, wIndex);
                        setHighlightIndex(dIndex);
                    }
                }
            };
            
            speakText(phoneticText, config).then(() => {
                // When speech ends, auto advance if still playing
                 if (autoPlayRef.current && isMounted) {
                    handleNext();
                }
            });

            // If initially paused, pause the speech we just started
            if (!autoPlayRef.current) pauseSpeech();
        } else {
            // Fallback for muted narrator: Use simple timer or user manual navigation
            if (autoPlay) {
                 const delay = estimateReadingTime(textToRead);
                 setTimeout(() => {
                     if (isMounted && autoPlayRef.current) handleNext();
                 }, delay);
            }
        }
    };

    const timeoutId = setTimeout(() => {
        runSequence();
    }, 300);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        stopSpeech();
    };
  }, [currentSlide, currentStep, sceneData, hasStarted, narratorVolume, isNarratorMuted, currentView, handleNext]); 


  const renderTweetText = (text: string, speakerName: string) => {
      const words = text.split(' ');
      const isWelsh = isWelshCharacter(speakerName);
      
      return (
          <p className="font-special leading-relaxed text-slate-100 min-h-[37px] text-lg md:text-xl">
              {isWelsh && (
                  <span className="inline-block mr-1.5 opacity-100 text-amber-500">✝️</span>
              )}
              {words.map((word, i) => (
                  <span key={i} className="inline-block mr-1.5 opacity-100">
                      {word}
                  </span>
              ))}
          </p>
      );
  };

  const renderHighlightedText = (text: string, isActive: boolean) => {
      if (!text) return null;
      const words = text.split(' ');
      let charCounter = 0;
      const shouldHighlight = isActive;

      return (
          <p className={`font-special leading-relaxed ${isActive ? 'text-white' : 'text-slate-400'}`}>
             {words.map((word, i) => {
                 const start = charCounter;
                 const end = charCounter + word.length;
                 // Modified highlighting logic: if highlightIndex has passed the start of this word, highlight it.
                 // This acts more like a "read so far" highlighter or "current word" depending on exact logic.
                 // Let's make it "current word" + "words read".
                 const isRead = shouldHighlight && highlightIndex >= start;
                 const isCurrent = shouldHighlight && highlightIndex >= start && highlightIndex < end + 1;

                 charCounter += word.length + 1; 

                 return (
                     <span 
                        key={i} 
                        className={`transition-colors duration-100 inline-block mr-2 
                            ${isCurrent ? 'text-amber-400 scale-110 font-bold shadow-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : ''}
                            ${!isCurrent && isRead ? 'opacity-100' : ''}
                            ${!isRead && shouldHighlight ? 'opacity-50' : ''}
                        `}
                     >
                         {word}
                     </span>
                 );
             })}
          </p>
      );
  };

  // Handle CMS Editor Logic
  const handleEditToggle = () => {
      setIsEditing(!isEditing);
      if (!isEditing) {
          if (showIntro) setEditorTarget('splash');
          else if (currentView === 'claim') setEditorTarget('claim');
          else if (currentView === 'script') setEditorTarget('script');
          else setEditorTarget('splash');
      }
  };

  const handleSave = (data: Data) => {
      if (editorTarget === 'splash') setSplashData(data);
      if (editorTarget === 'claim') setClaimData(data);
      if (editorTarget === 'script') setScriptData(data);
  };

  if (isEditing) {
      const currentData = editorTarget === 'splash' ? splashData : (editorTarget === 'claim' ? claimData : scriptData);
      return (
          <div className="w-full h-full bg-slate-900 flex flex-col">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center text-white">
                  <div className="flex gap-4">
                      <span className="font-bold text-amber-500">Puck CMS</span>
                      <select 
                        value={editorTarget} 
                        onChange={(e) => setEditorTarget(e.target.value as any)}
                        className="bg-slate-700 border border-slate-600 rounded px-2"
                      >
                          <option value="splash">Splash Page</option>
                          <option value="claim">Claim Page</option>
                          <option value="script">Script Page</option>
                      </select>
                  </div>
                  <div className="flex gap-4">
                      <a href="/" className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold text-center flex items-center">Preview</a>
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold">Done</button>
                  </div>
              </div>
              <div className="flex-1 overflow-auto bg-white">
                  <Puck config={config} data={currentData} onPublish={handleSave} />
              </div>
          </div>
      );
  }

  // Calculate Chat Head Layout Classes
  let chatHeadLayoutClass = "";
  if (activeSpeaker && activeSpeaker.type === 'character') {
      const isEven = (activeSpeaker.index || 0) % 2 === 0;
      const desktopClass = isEven ? "md:flex-row" : "md:flex-row-reverse";
      const mobileClass = isEven ? "flex-col" : "flex-col-reverse";
      chatHeadLayoutClass = `${mobileClass} ${desktopClass}`;
  }

  const currentProgress = ((currentSlide + (currentStep / (sceneData.scenes.length + 1))) / TIMELINE.length) * 100;

  // Shared View Component for Claim and Script
  const GenericPageViewer: React.FC<{
      data: Data;
      title: string;
      onDownload: () => void;
      downloadLabel: string;
  }> = ({ data, title, onDownload, downloadLabel }) => (
      <div className="flex-1 w-full h-full relative overflow-y-auto no-scrollbar bg-slate-950 flex flex-col font-mono text-slate-300">
         <div className="absolute top-4 left-4 z-50">
             <button 
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-500 hover:text-white rounded shadow-lg transition-all group"
             >
                 <div className="p-1 border border-current rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                 </div>
                 <span className="font-bold text-sm hidden group-hover:inline-block">{downloadLabel}</span>
             </button>
         </div>
         <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full text-sm md:text-base leading-relaxed">
             <Render config={config} data={data} />
         </div>
      </div>
  );

  return (
    <div 
        className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none relative text-base bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.8)_0%,_rgba(0,0,0,0.9)_100%)]"
        onMouseUp={handleMouseUp}
    >
      
      {showIntro && <IntroModal onEnter={handleEnterExperience} data={splashData} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <audio ref={audioRef} loop src="https://stream.rcs.revma.com/fxp289cp81uvv" />

      {/* TOP BAR */}
      {!isCollapsed && (
        <div className="h-24 w-full bg-slate-900/90 border-b border-slate-700 flex justify-between items-end px-6 pb-4 z-[60] shadow-xl shrink-0 relative pt-8">
            <button onClick={() => setCurrentView('timeline')} className="text-amber-500 font-special uppercase tracking-widest font-bold hover:text-amber-300 transition-colors text-xl md:text-2xl text-left">
                Great House Farm Story
            </button>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 mb-1">
                <button onClick={() => setCurrentView('timeline')} className={`font-special font-bold uppercase tracking-wider text-sm hover:text-white transition-colors ${currentView === 'timeline' ? 'text-white' : 'text-slate-400'}`}>Home</button>
                <button onClick={() => setCurrentView('claim')} className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all border group ${currentView === 'claim' ? 'bg-red-900/50 text-red-300 border-red-500' : 'hover:bg-red-900/30 text-red-400 border-transparent hover:border-red-900/50'}`}>
                    <span className="font-special font-bold uppercase tracking-wider text-sm">Reparations</span>
                </button>
                <button onClick={() => setCurrentView('script')} className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all border group ${currentView === 'script' ? 'bg-amber-900/50 text-amber-300 border-amber-500' : 'hover:bg-amber-900/30 text-amber-500 border-transparent hover:border-amber-900/50'}`}>
                    <span className="font-special font-bold uppercase tracking-wider text-sm">Script</span>
                </button>
            </div>

            {/* Mobile Burger */}
            <div className="md:hidden mb-1">
                <button onClick={() => setShowMobileMenu(true)} className="text-amber-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
                </button>
            </div>

            {/* Mobile Drawer */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
                    <div className="w-64 bg-slate-900 h-full border-l border-slate-700 p-6 flex flex-col gap-6 relative animate-slide-in-right">
                        <button onClick={() => setShowMobileMenu(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                        <div className="mt-8 flex flex-col gap-4">
                            <button onClick={() => { setCurrentView('timeline'); setShowMobileMenu(false); }} className="text-left font-special font-bold text-amber-500 text-lg">Home</button>
                            <button onClick={() => { setCurrentView('claim'); setShowMobileMenu(false); }} className="text-left font-special font-bold text-slate-300 hover:text-white">Reparations</button>
                            <button onClick={() => { setCurrentView('script'); setShowMobileMenu(false); }} className="text-left font-special font-bold text-slate-300 hover:text-white">The Script</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Slide Counter (Moved down, bg removed) */}
      {!isCollapsed && currentView === 'timeline' && (
        <div className="absolute top-32 right-6 z-[60]">
            <button onClick={() => setShowSlideSelector(true)} className="text-amber-500 font-bold font-special text-lg drop-shadow-md hover:text-amber-300 transition-colors">
                {currentSlide + 1} / {TIMELINE.length}
            </button>
        </div>
      )}

      {/* Floating Controls when Collapsed */}
      {isCollapsed && currentView === 'timeline' && (
          <>
              <button 
                  onClick={handlePrev} 
                  className="fixed top-1/2 -translate-y-1/2 left-4 z-50 w-20 h-20 rounded-full bg-slate-900/90 border-2 border-slate-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button 
                  onClick={handleNext} 
                  className="fixed top-1/2 -translate-y-1/2 right-4 z-50 w-20 h-20 rounded-full bg-slate-900/90 border-2 border-slate-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </button>
          </>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 w-full relative z-10 flex flex-col overflow-hidden">
        
         {currentView === 'timeline' && (
             <div className="relative w-full h-full flex flex-col items-center justify-evenly p-4">
                 
                 {/* Narrator Box */}
                 <div className={`
                    w-[90vw] md:w-[60vw] p-4 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md z-10 flex flex-col items-center text-center
                    h-auto max-h-[40vh] overflow-y-auto mb-8 transition-all duration-700 no-scrollbar
                    ${currentStep > 0 ? 'opacity-40 blur-[1px]' : 'opacity-100'}
                 `}>
                    <div className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-2 sticky top-0 bg-slate-900/0 backdrop-blur-0">NARRATION</div>
                    <div className="text-lg md:text-xl text-slate-300">
                        {renderHighlightedText(formatTextWithYear(sceneData.narration, sceneData.year), currentStep === 0)}
                    </div>
                 </div>

                 {/* Layer 2: Chat Heads & Tweet Bubble */}
                 {activeSpeaker && currentStep > 0 && activeSpeaker.type === 'character' && showTweet && (
                     <div className="fixed z-[100] inset-0 flex items-center justify-center pointer-events-none pb-[20vh] md:pb-0">
                        <div className={`pointer-events-auto flex items-center justify-center gap-4 max-w-[95vw] md:max-w-[70vw] animate-fade-in-up transition-all duration-500 ${chatHeadLayoutClass}`}>
                            <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-500 bg-slate-900 flex items-center justify-center text-5xl md:text-6xl shadow-[0_0_20px_rgba(245,158,11,0.4)] z-50">
                                {getCharacterIconEmoji(activeSpeaker.icon)}
                            </div>
                            <div className="bg-black border border-zinc-800 p-5 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative w-full max-w-lg min-w-[300px]">
                                <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                                             {getSpeakerFlag(activeSpeaker.name)}
                                         </div>
                                         <div className="flex flex-col">
                                             <span className="font-bold text-white text-lg leading-none">{activeSpeaker.name}</span>
                                             <span className="text-zinc-500 text-sm">@{activeSpeaker.name.replace(/\s+/g, '')}</span>
                                         </div>
                                     </div>
                                     <button onClick={() => setShowTweet(false)} className="hover:bg-zinc-900 rounded-full p-1 transition-colors group">
                                        <CloseIcon />
                                     </button>
                                </div>
                                <div className="mb-6">
                                    {renderTweetText(activeSpeaker.text, activeSpeaker.name)}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-zinc-500 text-xs flex gap-2">
                                        <span>{sceneData.year}</span> • <span>Llandough</span>
                                    </div>
                                    {/* X Logo Removed as requested */}
                                </div>
                            </div>
                        </div>
                     </div>
                 )}
             </div>
         )}

         {/* Script 2 Page (Duplicate of Script) */}
         {currentView === 'claim' && (
             <GenericPageViewer 
                 data={claimData} 
                 title="Reparations" 
                 downloadLabel="Download Brief"
                 onDownload={() => {
                     const content = claimData.content.find(c => c.type === 'ClaimBlock')?.props.content || "";
                     generateClaimPDF(content);
                 }} 
             />
         )}

         {currentView === 'script' && (
             <GenericPageViewer 
                 data={scriptData} 
                 title="Script" 
                 downloadLabel="Download Script"
                 onDownload={generateScriptPDF} 
             />
         )}

      </div>

      {/* CONTROLS BAR - Only visible on Timeline */}
      {currentView === 'timeline' && (
          <div className={`flex items-center justify-center w-full bg-slate-950 border-t border-slate-800 relative z-50 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-32 md:h-24'}`}>
              
              {/* Progress Bar (Clickable/Draggable) */}
              <div 
                className="absolute top-0 left-0 w-full h-4 z-20 cursor-pointer group flex items-start"
                onMouseMove={handleProgressBarInteraction}
                onMouseDown={handleProgressBarInteraction}
                onMouseLeave={() => setHoverSlide(null)}
              >
                  {/* Hover Tooltip */}
                  {(hoverSlide || isDragging) && (
                       <div 
                        className="absolute bottom-full mb-2 bg-slate-900 border border-amber-500 text-amber-500 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none transform -translate-x-1/2"
                        style={{ left: `${hoverSlide ? hoverSlide.left : currentProgress}%` }}
                       >
                           Slide {hoverSlide ? hoverSlide.index : currentSlide + 1}: {hoverSlide ? hoverSlide.year : sceneData.year}
                       </div>
                  )}

                  <div className="w-full h-1 bg-slate-800/50 relative overflow-visible">
                      {/* Slide Markers */}
                      {TIMELINE.map((_, idx) => (
                           <div 
                                key={idx}
                                className="absolute top-0 h-1 w-[1px] bg-white/20 z-10 pointer-events-none"
                                style={{ left: `${(idx / TIMELINE.length) * 100}%` }}
                           />
                      ))}

                      {/* Current Progress Red Line */}
                      <div 
                          className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-100 ease-linear group-hover:h-2 group-hover:shadow-[0_0_10px_rgba(220,38,38,0.7)]" 
                          style={{ width: `${currentProgress}%` }}
                      >
                           {/* Thumb/Toggle Handle */}
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-opacity hover:scale-125 cursor-grab active:cursor-grabbing"></div>
                      </div>
                  </div>
              </div>

              {!isCollapsed && (
                 <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center px-4 md:px-12">
                     
                     {/* ABSOLUTE LEFT: PREV BUTTON */}
                     <button onClick={handlePrev} className="absolute left-8 md:left-12 p-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                     </button>

                     {/* CENTER GROUP: EQUILIBRIUM + TV ICON INTEGRATION */}
                     {/* Layout: Desktop = Horizontal Row, Mobile = Vertical Sliders Flanking Play */}
                     <div className="flex items-center justify-center gap-6 md:gap-8 relative">
                          
                          {/* Music Volume - Vertical on Mobile (Left) */}
                          <div className="relative flex items-center justify-center w-8 h-24 md:w-auto md:h-auto md:flex-col md:order-1 order-1">
                               <span className="md:inline text-xs font-bold uppercase text-slate-500 mb-2 md:mb-0 md:static absolute -top-4 whitespace-nowrap hidden md:block">Music</span>
                               {/* Mobile Label (Rotated) */}
                               <span className="md:hidden text-[10px] font-bold uppercase text-slate-500 absolute -left-6 rotate-[-90deg]">Music</span>
                               <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={musicVolume} 
                                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))} 
                                    className="md:static absolute w-24 h-2 bg-slate-700 rounded-lg accent-amber-500 cursor-pointer -rotate-90 md:rotate-0 origin-center" 
                               />
                          </div>

                          {/* Play/Pause Button - Center */}
                          <div className="order-2 md:order-2 z-10">
                              <button 
                                  onClick={() => setAutoPlay(!autoPlay)} 
                                  className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform hover:scale-105"
                              >
                                  {autoPlay ? (
                                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                  ) : (
                                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                  )}
                              </button>
                          </div>

                          {/* Voice Volume - Vertical on Mobile (Right) */}
                          <div className="relative flex items-center justify-center w-8 h-24 md:w-auto md:h-auto md:flex-col md:order-3 order-3">
                               <span className="md:inline text-xs font-bold uppercase text-slate-500 mb-2 md:mb-0 md:static absolute -top-4 whitespace-nowrap hidden md:block">Voice</span>
                               {/* Mobile Label (Rotated) */}
                               <span className="md:hidden text-[10px] font-bold uppercase text-slate-500 absolute -right-6 rotate-90">Voice</span>
                               <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={narratorVolume} 
                                    onChange={(e) => setNarratorVolume(parseFloat(e.target.value))} 
                                    className="md:static absolute w-24 h-2 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer -rotate-90 md:rotate-0 origin-center" 
                               />
                          </div>
                          
                          {/* Cinema/Collapse Mode Toggle - Order 4 */}
                          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-500 hover:text-amber-500 transition-colors transform hover:scale-110 ml-2 order-4 md:order-4 hidden md:block">
                             <TVIcon />
                          </button>
                     </div>

                     {/* ABSOLUTE RIGHT: FILE ICONS, NEXT BUTTON */}
                     <div className="absolute right-8 md:right-12 flex items-center gap-4">
                         {/* File Icons Integrated into Controls */}
                         <div className="relative group cursor-pointer hidden lg:flex items-center gap-2" onClick={() => setShowLoginModal(true)}>
                              {/* Lock Overlay */}
                              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded backdrop-blur-[1px] transition-all group-hover:bg-black/40">
                                   <LockIcon />
                                   <span className="sr-only">Access Evidence</span>
                              </div>
                               {/* Icons Row */}
                               {[
                                   { key: 'gallery', type: 'image' }, 
                                   { key: 'legal', type: 'pdf' }, 
                                   { key: 'news', type: 'link' }, 
                                   { key: 'notes', type: 'text' }, 
                                   { key: 'report', type: 'markdown' }
                               ].map(item => (
                                   <div key={item.key} className="w-10 h-10 rounded flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-600">
                                      {getFileIcon(item.type as any)}
                                   </div>
                               ))}
                         </div>
                         
                         <button onClick={handleNext} className="p-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                         </button>
                     </div>

                 </div>
              )}
              
              {/* Collapsed State Toggle (Invisible trigger or use floating buttons, but user asked for icon on bar. If bar is h-8 (collapsed), show toggle) */}
              {isCollapsed && (
                   <button 
                    onClick={() => setIsCollapsed(false)} 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 transition-colors"
                   >
                       <TVIcon />
                   </button>
              )}

          </div>
      )}

      {/* FOOTER BAR */}
      <div className="h-20 w-full bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6 text-sm text-slate-500 z-50 shrink-0">
          <div className="flex items-center gap-2">
            <a href="https://datro.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">
                Copyright DATRO Consortium Ltd
            </a>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-slate-600">v0.2</span>
            <button onClick={handleEditToggle} className="ml-2 hover:text-white text-slate-600 transition-colors">Edit Content</button>
          </div>
          <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <FacebookIcon />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <InstagramIcon />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
          </div>
      </div>

      {/* Modals */}
      {selectedSource && <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />}
      {viewingAttachments && <AttachmentModal files={viewingAttachments.files} category={viewingAttachments.category} slideIndex={currentSlide} year={sceneData.year} onClose={() => setViewingAttachments(null)} />}
      {showSlideSelector && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
             <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl">
                 <div className="p-4 border-b border-slate-700 flex justify-between"><h2 className="text-amber-500 font-special text-xl">Timeline</h2><button onClick={() => setShowSlideSelector(false)} className="text-white text-xl">✕</button></div>
                 <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                     {TIMELINE.map((t, i) => (
                         <button key={i} onClick={() => { setCurrentSlide(i); setCurrentStep(0); setShowSlideSelector(false); }} className="p-4 bg-slate-800 border border-slate-700 hover:border-amber-500 text-left rounded">
                             <span className="text-cyan-500 font-bold mr-2">{i+1}.</span><span className="text-slate-300">{t.year}</span>
                         </button>
                     ))}
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default App;