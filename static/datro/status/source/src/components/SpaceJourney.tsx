import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, FastForward, RotateCcw, Info, Volume2, VolumeX, ChevronDown, ChevronUp, ChevronRight, ExternalLink, X, SkipBack, SkipForward, Star, Circle, Github, Menu } from 'lucide-react';
import { COMMITS, Commit } from '../data/commits';

const FOLDER_CONFIG: Record<string, { label: string, url: string, color: string }> = {
  'static/hbnb': { label: 'HotspotBnB Home', url: 'details/html/multistep-menu/index.html', color: '#a855f7' },
  'static/gui': { label: 'HBnB GUI', url: 'details/html/multistep-menu/index.html', color: '#f97316' },
  'static/datro': { label: 'DATRO Consortium', url: 'details/index.html', color: '#f87171' },
  'static/pcp': { label: 'Finance Cheque', url: 'https://financecheque.uk', color: '#4ade80' },
  'static/ccan': { label: 'CCAN', url: '#', color: '#ffffff' },
  'static/forces': { label: 'Casualty Escort Officer', url: 'https://ceo.datro.xyz', color: '#3b82f6' },
  'static/bpvsbuckler': { label: 'BP vs Buckler', url: 'https://bpvsbuckler.datro.xyz', color: '#facc15' },
  'static/docs': { label: 'Document Library', url: 'https://library.datro.xyz', color: '#22d3ee' },
  'other': { label: 'Other', url: '', color: '#ffffff' }
};

const Modal: React.FC<{ url: string, onClose: () => void }> = ({ url, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative w-full h-full max-w-6xl bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{url}</span>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 bg-white">
        <iframe src={url} className="w-full h-full border-none" title="Preview" />
      </div>
    </motion.div>
  </motion.div>
);

interface Star {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
}

interface CommitStar extends Star {
  commit: Commit;
  opacity: number;
  size: number;
  isMain: boolean;
  isGrounded?: boolean;
  groundX?: number;
  groundY?: number;
}

const STAR_COUNT = 400;
const Z_MAX = 1000;
const JOURNEY_DURATION = 5; // seconds
const SPEED_BASE = Z_MAX / (JOURNEY_DURATION * 60); // 3.33 units per frame at 60fps
const AUDIO_URL = 'https://stream.rcs.revma.com/fxp289cp81uvv';

export const SpaceJourney: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Safety timeout for loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVideoReady(true); // Force ready after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [hoveredCommit, setHoveredCommit] = useState<Commit | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBranchesKeyCollapsed, setIsBranchesKeyCollapsed] = useState(false);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [viewYear, setViewYear] = useState<number>(2026);
  const [volume, setVolume] = useState(50); // 50% slider = 5% actual volume
  const [isMuted, setIsMuted] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [currentCommitIndex, setCurrentCommitIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const starsRef = useRef<Star[]>([]);
  const commitStarsRef = useRef<CommitStar[]>([]);
  const stackHeightsRef = useRef<{
    bottom: number[];
    top: number[];
    left: number[];
    right: number[];
  }>({
    bottom: [],
    top: [],
    left: [],
    right: []
  });
  const currentCommitIndexRef = useRef(0);
  const sliderValueRef = useRef(0);
  const lastSpawnedDayRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Video playback with isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  // Sync ref with state for animation loop
  useEffect(() => {
    currentCommitIndexRef.current = currentCommitIndex;
  }, [currentCommitIndex]);

  // Fetch GitHub Commits from multiple branches
  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const branches = ['gh-pages', 'netlify', 'net-install'];
        const allCommitsPromises = branches.map(async (branch) => {
          try {
            const response = await fetch(`https://api.github.com/repos/unclehowell/datro/commits?sha=${branch}&per_page=100`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((item: any) => {
              const message = item.commit.message.toLowerCase();
              let folder = 'other';
              if (message.includes('static/docs') || message.includes('docs')) folder = 'static/docs';
              else if (message.includes('static/pcp') || message.includes('pcp')) folder = 'static/pcp';
              else if (message.includes('static/bpvsbuckler') || message.includes('bpvsbuckler')) folder = 'static/bpvsbuckler';
              else if (message.includes('static/datro') || message.includes('datro')) folder = 'static/datro';
              else if (message.includes('static/hbnb') || message.includes('hbnb')) folder = 'static/hbnb';
              else if (message.includes('static/gui') || message.includes('gui')) folder = 'static/gui';
              else if (message.includes('static/forces') || message.includes('forces')) folder = 'static/forces';

              return {
                hash: item.sha,
                message: item.commit.message.split('\n')[0],
                isMain: branch === 'gh-pages',
                date: item.commit.author.date.split('T')[0],
                folder,
                branch
              };
            });
          } catch (e) {
            console.error(`Error fetching branch ${branch}:`, e);
            return [];
          }
        });

        const results = await Promise.all(allCommitsPromises);
        const combined = results.flat();
        
        // Remove duplicates (commits might be in multiple branches)
        const uniqueCommits = Array.from(new Map(combined.map(c => [c.hash, c])).values());
        
        // Sort by date (oldest first)
        const sortedCommits = uniqueCommits.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setCommits(sortedCommits);
        
        // Default to 2026 on refresh as requested
        const startYear = 2026;
        setViewYear(startYear);
        
        const firstStartIndex = sortedCommits.findIndex(c => new Date(c.date).getFullYear() === startYear);
        if (firstStartIndex !== -1) {
          setCurrentCommitIndex(firstStartIndex);
          currentCommitIndexRef.current = firstStartIndex;
          // Set slider to the actual day of the first commit
          const firstDate = new Date(sortedCommits[firstStartIndex].date);
          const start = new Date(startYear, 0, 0);
          const diff = (firstDate.getTime() - start.getTime()) + ((start.getTimezoneOffset() - firstDate.getTimezoneOffset()) * 60 * 1000);
          const oneDay = 1000 * 60 * 60 * 24;
          setSliderValue(Math.floor(diff / oneDay) - 1);
        } else {
          // If no 2026 commits, still show 2026 as requested
          setCurrentCommitIndex(0);
          currentCommitIndexRef.current = 0;
          setSliderValue(0);
        }
      } catch (error) {
        console.error('Error fetching commits:', error);
        setCommits(COMMITS.slice().reverse().map(c => ({ ...c, branch: 'gh-pages' })));
        setViewYear(2026);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommits();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : (volume / 1000); // 100 slider = 0.1 volume
    }
  }, [volume, isMuted]);

  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * Z_MAX,
        px: 0,
        py: 0
      });
    }
    starsRef.current = stars;
    // Initialize stack heights for all 4 edges
    const containerWidth = 450; // Mobile width
    const containerHeight = window.innerHeight;
    stackHeightsRef.current = {
      bottom: new Array(Math.ceil(containerWidth / 20)).fill(0),
      top: new Array(Math.ceil(containerWidth / 20)).fill(0),
      left: new Array(Math.ceil(containerHeight / 20)).fill(0),
      right: new Array(Math.ceil(containerHeight / 20)).fill(0)
    };
  }, []);

  const spawnCommitStar = useCallback((commit: Commit, z: number = Z_MAX) => {
    const isMain = commit.isMain;
    let x = (Math.random() - 0.5) * 400;
    let y = (Math.random() - 0.5) * 400;
    
    if (!isMain && commit.branchOf) {
      x = (Math.random() - 0.5) * 800;
      y = (Math.random() - 0.5) * 800;
    }

    const newStar: CommitStar = {
      x, y, z, px: 0, py: 0,
      commit,
      opacity: 0,
      size: isMain ? 4 : 2,
      isMain
    };
    commitStarsRef.current.push(newStar);
  }, []);

  const resetJourney = () => {
    setCurrentCommitIndex(0);
    commitStarsRef.current = [];
    lastSpawnTimeRef.current = 0;
    setSelectedCommit(null);
    setHoveredCommit(null);
    initStars();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Ensure audio plays on interaction if blocked by autoplay policy
    if (audioRef.current && audioRef.current.paused && !isMuted) {
      audioRef.current.play().catch(() => {});
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = false;
    for (const star of commitStarsRef.current) {
      const dx = mouseX - star.px;
      const dy = mouseY - star.py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < star.size * 5) {
        setSelectedCommit(star.commit);
        const config = FOLDER_CONFIG[star.commit.folder || 'other'];
        if (config && config.url) {
          setModalUrl(config.url);
        }
        found = true;
        break;
      }
    }
    if (!found) setSelectedCommit(null);

    // If manually paused, don't do anything with auto-resume
    if (isManuallyPaused) return;

    // Temporary pause for 5 seconds
    setIsPlaying(false);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPlaying(true);
      pauseTimeoutRef.current = null;
    }, 5000);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const star of commitStarsRef.current) {
      const dx = mouseX - star.px;
      const dy = mouseY - star.py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < star.size * 5) {
        window.open(`https://github.com/unclehowell/datro/commit/${star.commit.hash}`, '_blank');
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = false;
    for (const star of commitStarsRef.current) {
      const dx = mouseX - star.px;
      const dy = mouseY - star.py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < star.size * 5) {
        setHoveredCommit(star.commit);
        found = true;
        break;
      }
    }
    if (!found) setHoveredCommit(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading || commits.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();
    initStars();

    const animate = (time: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const currentSpeed = isPlaying ? SPEED_BASE * playbackSpeed : 0;

      // Draw background stars
      starsRef.current.forEach(star => {
        star.z -= currentSpeed * 100;
        if (star.z <= 0) {
          star.z = Z_MAX;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
        }
        const x = (star.x / star.z) * centerX + centerX;
        const y = (star.y / star.z) * centerY + centerY;
        if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
          const size = (1 - star.z / Z_MAX) * 2;
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / Z_MAX})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const drawFlame = (x: number, y: number, size: number, opacity: number) => {
        const flameCount = 4;
        for (let i = 0; i < flameCount; i++) {
          const flameSize = size * (0.75 + Math.random() * 0.5); // 50% smaller
          const offsetX = (Math.random() - 0.5) * size * 0.3;
          const offsetY = (Math.random() - 0.5) * size * 0.3;

          const gradient = ctx.createRadialGradient(x + offsetX, y + offsetY, 0, x + offsetX, y + offsetY, flameSize);
          gradient.addColorStop(0, `rgba(255, 60, 0, ${opacity * 0.4})`); // More transparent
          gradient.addColorStop(0.6, `rgba(255, 20, 0, ${opacity * 0.15})`);
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, flameSize, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      const drawUnionJack = (x: number, y: number, size: number, opacity: number, isGray: boolean = false) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        const w = size * 0.94; // Reduced by 25% from 1.25
        const h = size * 0.56; // Reduced by 25% from 0.75
        ctx.translate(x - w/2, y - h/2);
        
        if (isGray) {
          ctx.filter = 'grayscale(100%)';
        }
        
        // Background blue
        ctx.fillStyle = '#00247d';
        ctx.fillRect(0, 0, w, h);
        
        // White diagonals
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size * 0.15;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.stroke();
        
        // Red diagonals
        ctx.strokeStyle = '#cf142b';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.stroke();
        
        // White cross
        ctx.fillStyle = 'white';
        ctx.fillRect(w/2 - size*0.11, 0, size*0.22, h);
        ctx.fillRect(0, h/2 - size*0.11, w, size*0.22);
        
        // Red cross
        ctx.fillStyle = '#cf142b';
        ctx.fillRect(w/2 - size*0.07, 0, size*0.14, h);
        ctx.fillRect(0, h/2 - size*0.07, w, size*0.14);
        
        ctx.restore();
      };

      const drawEUFlag = (x: number, y: number, size: number, opacity: number, isGray: boolean = false) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        const w = size * 0.94; // Reduced by 25% from 1.25
        const h = size * 0.56; // Reduced by 25% from 0.75
        ctx.translate(x - w/2, y - h/2);
        
        if (isGray) {
          ctx.filter = 'grayscale(100%)';
        }
        
        // Blue background
        ctx.fillStyle = '#003399';
        ctx.fillRect(0, 0, w, h);
        
        // Stars
        ctx.fillStyle = '#ffcc00';
        for (let i = 0; i < 12; i++) {
          const angle = (i * 30) * Math.PI / 180;
          const sx = w/2 + Math.cos(angle) * size * 0.19;
          const sy = h/2 + Math.sin(angle) * size * 0.19;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 0.03, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      };


      // Day-by-day progression logic
      if (isPlaying) {
        const currentTime = time;
        const commitsOnThisDay = commits.filter(c => {
          const date = new Date(c.date);
          const start = new Date(date.getFullYear(), 0, 0);
          const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
          const oneDay = 1000 * 60 * 60 * 24;
          const dayOfYear = Math.floor(diff / oneDay) - 1;
          return date.getFullYear() === viewYear && dayOfYear === sliderValue;
        });

        const delay = (commitsOnThisDay.length > 0 ? 1000 : 100) / playbackSpeed;

        if (currentTime - lastSpawnTimeRef.current > delay) {
          if (commitsOnThisDay.length > 0 && lastSpawnedDayRef.current !== sliderValue) {
            commitsOnThisDay.forEach(c => {
              spawnCommitStar(c);
              const branches = commits.filter(b => b.branchOf === c.hash);
              branches.forEach(b => spawnCommitStar(b, Z_MAX + Math.random() * 200));
            });
            lastSpawnedDayRef.current = sliderValue;
          }

          const nextDay = (sliderValueRef.current + 1) % (getSliderMax() + 1);
          setSliderValue(nextDay);
          sliderValueRef.current = nextDay;

          // Sync currentCommitIndex based on the day
          const firstCommitNextDay = commits.findIndex(c => {
            const date = new Date(c.date);
            const start = new Date(date.getFullYear(), 0, 0);
            const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay) - 1;
            return date.getFullYear() === viewYear && dayOfYear >= nextDay;
          });

          if (firstCommitNextDay !== -1) {
             setCurrentCommitIndex(firstCommitNextDay);
             currentCommitIndexRef.current = firstCommitNextDay;
          }

          lastSpawnTimeRef.current = currentTime;
        }
      }

      // Update commit stars

      commitStarsRef.current = commitStarsRef.current.filter(star => {
        if (star.isGrounded) {
          const opacity = 0.6;
          const isDragon = star.commit.hash === 'dr4g0n999';
          const starColor = isDragon ? '#ff00ff' : (FOLDER_CONFIG[star.commit.folder || 'other']?.color || '#ffffff');
          
          const x = star.groundX || 0;
          const y = star.groundY || 0;
          const size = isDragon ? star.size * 2 : star.size;

          if (star.commit.branch === 'netlify' || star.commit.branch === 'net-install') {
            drawEUFlag(x, y, size, opacity, true);
          } else {
            drawUnionJack(x, y, size, opacity, true);
          }

          // Draw flame for grounded stars
          drawFlame(x, y, size, opacity * 0.5);
          return true;
        }

        star.z -= currentSpeed;
        
        const x = (star.x / star.z) * centerX + centerX;
        const y = (star.y / star.z) * centerY + centerY;
        star.px = x;
        star.py = y;

        // Check if it should be grounded (reaches any edge or z is too small)
        const margin = 10;
        const reachedLeft = x <= margin;
        const reachedRight = x >= canvas.width - margin;
        const reachedTop = y <= margin;
        const reachedBottom = y >= canvas.height - margin;
        const reachedZ = star.z <= 10;

        if (reachedZ || reachedLeft || reachedRight || reachedTop || reachedBottom) {
          star.isGrounded = true;
          
          // Determine which edge to stick to
          if (reachedLeft) {
            const bucket = Math.floor(y / 20);
            const currentOffset = stackHeightsRef.current.left[bucket] || 0;
            star.groundX = currentOffset + star.size;
            star.groundY = y;
            stackHeightsRef.current.left[bucket] = currentOffset + star.size * 1.2;
          } else if (reachedRight) {
            const bucket = Math.floor(y / 20);
            const currentOffset = stackHeightsRef.current.right[bucket] || 0;
            star.groundX = canvas.width - currentOffset - star.size;
            star.groundY = y;
            stackHeightsRef.current.right[bucket] = currentOffset + star.size * 1.2;
          } else if (reachedTop) {
            const bucket = Math.floor(x / 20);
            const currentOffset = stackHeightsRef.current.top[bucket] || 0;
            star.groundX = x;
            star.groundY = currentOffset + star.size;
            stackHeightsRef.current.top[bucket] = currentOffset + star.size * 1.2;
          } else {
            // Default to bottom
            const bucket = Math.floor(x / 20);
            const currentOffset = stackHeightsRef.current.bottom[bucket] || 0;
            star.groundX = x;
            star.groundY = canvas.height - currentOffset - star.size;
            stackHeightsRef.current.bottom[bucket] = currentOffset + star.size * 1.2;
          }
          return true;
        }

        if (x > -100 && x < canvas.width + 100 && y > -100 && y < canvas.height + 100) {
          const progress = 1 - star.z / Z_MAX;
          const size = star.size * (1 + progress * 5);
          const opacity = Math.min(1, progress * 2);
          
          if (!star.isMain && star.commit.branchOf) {
            const parent = commitStarsRef.current.find(s => s.commit.hash === star.commit.branchOf);
            if (parent && parent.z > 0) {
              ctx.strokeStyle = `rgba(100, 200, 255, ${opacity * 0.3})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(parent.px, parent.py);
              ctx.stroke();
            }
          }

          const isDragon = star.commit.hash === 'dr4g0n999';
          const starColor = isDragon ? '#ff00ff' : (FOLDER_CONFIG[star.commit.folder || 'other']?.color || '#ffffff');

          if (star.commit.branch === 'netlify' || star.commit.branch === 'net-install') {
            drawEUFlag(x, y, size, opacity);
          } else {
            drawUnionJack(x, y, size, opacity);
          }

          // Draw flame
          drawFlame(x, y, isDragon ? size * 2 : size, opacity);

          if (progress > 0.7 || hoveredCommit?.hash === star.commit.hash || selectedCommit?.hash === star.commit.hash) {
            ctx.fillStyle = 'white';
            ctx.font = `${Math.max(11, Math.min(14, size * 2))}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(star.commit.hash.substring(0, 7), x, y + size + 15);
          }
        }
        return true;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, hoveredCommit, selectedCommit, spawnCommitStar, initStars, isLoading, commits]);

  useEffect(() => {
    // Synchronize ref with slider for animation loop
    sliderValueRef.current = sliderValue;
  }, [sliderValue]);

  const getCommitOnDay = (dayOfYear: number) => {
    const targetDate = new Date(viewYear, 0, dayOfYear + 1);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    return commits.find(c => c.date === targetDateStr);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dayOfYear = parseInt(e.target.value);
    setSliderValue(dayOfYear);
    sliderValueRef.current = dayOfYear;
    if (commits.length === 0) return;

    // Find the first commit on or after this day in the current year
    const targetDate = new Date(viewYear, 0, dayOfYear + 1);
    const targetTime = targetDate.getTime();
    
    const nearestIndex = commits.findIndex(c => {
      const cDate = new Date(c.date);
      return cDate.getTime() >= targetTime;
    });

    if (nearestIndex !== -1) {
      setCurrentCommitIndex(nearestIndex);
      currentCommitIndexRef.current = nearestIndex;
    }
    
    // Optional: clear current stars on major seek
    // commitStarsRef.current = [];
  };

  const jumpToYear = (direction: 'prev' | 'next') => {
    if (commits.length === 0) return;
    
    const years = Array.from(new Set(commits.map(c => new Date(c.date).getFullYear()))).sort((a, b) => (a as number) - (b as number));
    const currentIndex = years.indexOf(viewYear as any);
    
    let targetYear: number | null = null;
    if (direction === 'prev' && currentIndex > 0) {
      targetYear = years[currentIndex - 1] as number;
    } else if (direction === 'next' && currentIndex < years.length - 1) {
      targetYear = years[currentIndex + 1] as number;
    }

    if (targetYear !== null) {
      setViewYear(targetYear);
      commitStarsRef.current = []; // Clear current flying/grounded flags
      
      const targetIndex = commits.findIndex(c => new Date(c.date).getFullYear() === targetYear);
      if (targetIndex !== -1) {
        setCurrentCommitIndex(targetIndex);
        currentCommitIndexRef.current = targetIndex;
        // Set slider to the actual day of the first commit in the target year
        const firstDate = new Date(commits[targetIndex].date);
        const start = new Date(targetYear, 0, 0);
        const diff = (firstDate.getTime() - start.getTime()) + ((start.getTimezoneOffset() - firstDate.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const newDay = Math.floor(diff / oneDay) - 1;
        setSliderValue(newDay);
        sliderValueRef.current = newDay;
      } else {
        setSliderValue(0);
        sliderValueRef.current = 0;
      }
    }
  };

  const getSliderValue = () => {
    const commit = commits[Math.max(0, currentCommitIndex - 1)];
    if (!commit) return 0;
    const date = new Date(commit.date);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay) - 1;
  };

  const getSliderMax = () => {
    const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return isLeap(viewYear) ? 365 : 364;
  };

  const formatChronalTime = (dateStr: string) => {
    if (!dateStr) return '00:00:00';
    const date = new Date(dateStr);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Calculate week of year
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const ww = Math.floor(diff / oneWeek).toString().padStart(2, '0');
    
    return `${yy}:${mm}:${ww}`;
  };

  const currentCommit = commits[Math.max(0, currentCommitIndex - 1)] || commits[0];
  const currentYear = currentCommit ? new Date(currentCommit.date).getFullYear() : null;
  const currentBranches = Array.from(new Set(commits.filter(c => c.date === currentCommit.date).map(c => c.branch))).filter(Boolean);

  const isActuallyLoading = isLoading || !isVideoReady;

  if (isActuallyLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center font-mono text-cyan-500">
        <div className="text-xl animate-pulse tracking-widest uppercase">loading ...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden font-sans text-white select-none">
      <AnimatePresence>
        {modalUrl && <Modal url={modalUrl} onClose={() => setModalUrl(null)} />}
      </AnimatePresence>

      {/* Internal Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onCanPlayThrough={() => setIsVideoReady(true)}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        src="./assets/background_v2.mp4"
      />

      {/* Audio Element - Only one needed */}
      <audio
        autoPlay
        loop
        muted={isMuted}
        onCanPlayThrough={() => setIsAudioReady(true)}
        ref={(el) => {
          if (el) {
            audioRef.current = el;
            el.volume = 0.05;
            if (isPlaying && !isMuted) el.play().catch(() => {});
            else el.pause();
          }
        }}
        src="https://stream.rcs.revma.com/fxp289cp81uvv"
      />

      {/* Canvas - Commits and Stars */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 block w-full h-full cursor-crosshair z-10"
      />

      {/* Centered Header */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-0">
        <h1 className="text-8xl font-black text-white/5 leading-none tracking-tighter uppercase">
          {viewYear}
        </h1>
      </div>

      {/* Burger Menu Button */}
      <div className="absolute top-12 right-6 z-[60] pointer-events-auto">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-black/40 backdrop-blur-md border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all hover:scale-110 shadow-2xl"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop - LIGHTER BLUR AS REQUESTED */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-[55] pointer-events-auto"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-72 bg-zinc-900/90 backdrop-blur-2xl border-l border-zinc-800 z-[56] p-8 pt-24 pointer-events-auto shadow-2xl overflow-y-auto"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-[10px] text-cyan-400 uppercase font-black tracking-[0.2em] mb-3">branches</h3>
                  <div className="flex flex-col gap-1">
                    <a 
                      href="https://github.com/unclehowell/datro/releases/tag/v0.0.1-rc.9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded transition-colors w-full group"
                    >
                      <Github 
                        size={12} 
                        className={`${currentBranches.includes('net-install') ? 'text-cyan-400 fill-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'text-white fill-white shadow-[0_0_5px_white]'} transition-all duration-300`} 
                      />
                      <span className={`text-sm font-bold tracking-wide transition-colors duration-300 ${currentBranches.includes('net-install') ? 'text-cyan-400' : 'text-zinc-300'}`}>software</span>
                    </a>

                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                        className="flex items-center gap-3 w-full hover:bg-white/5 p-1.5 rounded transition-colors"
                      >
                        <Star 
                          size={12} 
                          className={`${currentBranches.includes('gh-pages') ? 'text-cyan-400 fill-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'text-white fill-white shadow-[0_0_5px_white]'} transition-all duration-300`} 
                        />
                        <span className={`text-sm flex-1 text-left font-bold tracking-wide transition-colors duration-300 ${currentBranches.includes('gh-pages') ? 'text-cyan-400' : 'text-zinc-300'}`}>websites</span>
                        {isFoldersExpanded ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-500" />}
                      </button>

                      <AnimatePresence>
                        {isFoldersExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-6 flex flex-col gap-0.5 border-l border-zinc-800 ml-3.5 mt-0.5 overflow-hidden"
                          >
                            {/* Explicit Menu Order */}
                            {[
                              'static/gui',
                              'static/hbnb',
                              'static/datro',
                              'static/pcp',
                              'static/ccan',
                              'static/forces',
                              'static/bpvsbuckler',
                              'static/docs'
                            ].map((key) => {
                              const config = FOLDER_CONFIG[key];
                              if (!config) return null;
                              return (
                                <button 
                                  key={key} 
                                  onClick={() => config.url && config.url !== '#' && setModalUrl(config.url)}
                                  className="flex items-center gap-2 hover:bg-white/5 p-1 rounded transition-colors text-left w-full group"
                                >
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform" 
                                    style={{ backgroundColor: config.color, boxShadow: `0 0 5px ${config.color}` }} 
                                  />
                                  <span className="text-xs text-zinc-400 group-hover:text-white truncate font-medium">{config.label}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button 
                      onClick={() => setModalUrl('details/index.html')}
                      className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded transition-colors w-full group"
                    >
                      <Circle 
                        size={12} 
                        className={`${currentBranches.includes('netlify') ? 'text-cyan-400 fill-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'text-white fill-white shadow-[0_0_5px_white]'} transition-all duration-300`} 
                      />
                      <span className={`text-sm font-bold tracking-wide transition-colors duration-300 ${currentBranches.includes('netlify') ? 'text-cyan-400' : 'text-zinc-300'}`}>archives</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end z-50">
        {/* Hover/Selected Info */}
        <div className="absolute top-[20vw] right-8 flex flex-col items-end gap-4 z-50">
          <AnimatePresence>
            {(selectedCommit || hoveredCommit) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-black/80 backdrop-blur-xl border-2 border-zinc-700 p-4 rounded-lg max-w-xs pointer-events-auto"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[11px] rounded border border-red-500/30 uppercase font-bold">
                    {(selectedCommit || hoveredCommit)?.isMain ? 'MAIN' : 'BRANCH'}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {(selectedCommit || hoveredCommit)?.hash.substring(0, 7)}
                  </span>
                </div>
                <h2 className="text-[12px] font-medium leading-snug mb-3">
                  {(selectedCommit || hoveredCommit)?.message}
                </h2>
                <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider">
                  {(selectedCommit || hoveredCommit)?.date}
                </div>
                <div className="flex flex-col gap-2">
                  <a 
                    href={`https://github.com/unclehowell/datro/commit/${(selectedCommit || hoveredCommit)?.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 group"
                  >
                    <ExternalLink size={12} className="group-hover:scale-110 transition-transform" />
                    <span className="truncate">View on GitHub</span>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Toggle */}
        <div className="flex justify-center mb-0 pointer-events-auto">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-zinc-800 border-t border-x border-zinc-600 px-4 py-1 rounded-t-lg text-zinc-400 hover:text-white transition-colors pointer-events-auto"
          >
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Dashboard */}
        <motion.div
          initial={false}
          animate={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
          className="bg-zinc-900/40 backdrop-blur-xl border-t-4 border-zinc-700 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pointer-events-auto"
        >
          {/* YouTube Style Progress Bar at the very top */}
          <div className="relative w-full h-1 bg-zinc-800 group cursor-pointer">
            <div 
              className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-100"
              style={{ width: `${(sliderValue / getSliderMax()) * 100}%` }}
            />

            {/* Commit Markers (White Dots) */}
            <div className="absolute inset-0 pointer-events-none">
              {commits
                .filter(c => new Date(c.date).getFullYear() === viewYear)
                .map((c, i) => {
                  const date = new Date(c.date);
                  const start = new Date(date.getFullYear(), 0, 0);
                  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
                  const oneDay = 1000 * 60 * 60 * 24;
                  const dayOfYear = Math.floor(diff / oneDay) - 1;
                  const percent = (dayOfYear / getSliderMax()) * 100;
                  
                  return (
                    <div 
                      key={`${c.hash}-${i}`}
                      className="absolute top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/40"
                      style={{ left: `${percent}%` }}
                    />
                  );
                })
              }
            </div>
            
            {/* Modal Popup above the selector */}
            <AnimatePresence>
              {(isDragging || hoverValue !== null) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-6 bg-black/90 backdrop-blur-md border border-zinc-700 px-3 py-2 rounded shadow-2xl pointer-events-none z-30 flex flex-col items-center min-w-[120px]"
                  style={{ 
                    left: `${((isDragging ? sliderValue : hoverValue!) / getSliderMax()) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {(() => {
                    const day = isDragging ? sliderValue : hoverValue!;
                    const commit = getCommitOnDay(day);
                    if (commit) {
                      return (
                        <>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold mb-0.5">Commit Date</span>
                          <span className="text-xs text-white font-mono mb-1">{commit.date}</span>
                          <span className="text-[9px] text-cyan-400 font-mono">UID: {commit.hash.substring(0, 7)}</span>
                        </>
                      );
                    } else {
                      return (
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest py-1">No commit</span>
                      );
                    }
                  })()}
                  {/* Arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-zinc-700 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="range"
              min="0"
              max={getSliderMax()}
              value={sliderValue}
              onChange={handleSeek}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => {
                setIsDragging(false);
                sliderValueRef.current = sliderValue;
                // On drop, sync everything
                const targetDate = new Date(viewYear, 0, sliderValue + 1);
                const targetTime = targetDate.getTime();
                const nearestIndex = commits.findIndex(c => new Date(c.date).getTime() >= targetTime);
                if (nearestIndex !== -1) {
                  setCurrentCommitIndex(nearestIndex);
                  currentCommitIndexRef.current = nearestIndex;
                  // If we dropped on a commit, show it immediately
                  const commitsOnThisDay = commits.filter(c => {
                    const d = new Date(c.date);
                    return d.getFullYear() === viewYear && 
                           Math.floor((d.getTime() - new Date(viewYear, 0, 0).getTime()) / (1000*60*60*24)) - 1 === sliderValue;
                  });
                  if (commitsOnThisDay.length > 0) {
                     commitsOnThisDay.forEach(c => spawnCommitStar(c));
                  }
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                setHoverValue(Math.floor(percent * getSliderMax()));
              }}
              onMouseLeave={() => setHoverValue(null)}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            
            {/* Bubble (Thumb) */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-transform duration-100 pointer-events-none z-10 ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}
              style={{ left: `calc(${(sliderValue / getSliderMax()) * 100}% - 8px)` }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Media Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => jumpToYear('prev')}
                  className="p-2 text-zinc-400 hover:text-white transition-colors pointer-events-auto"
                  title="Previous Year"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                      setIsManuallyPaused(true);
                    } else {
                      setIsPlaying(true);
                      setIsManuallyPaused(false);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white hover:scale-110 transition-transform pointer-events-auto"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>

                <button
                  onClick={() => jumpToYear('next')}
                  className="p-2 text-zinc-400 hover:text-white transition-colors pointer-events-auto"
                  title="Next Year"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>

                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Nested Time Units */}
                <div className="flex items-center gap-3 ml-auto border-l border-zinc-800 pl-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-zinc-500 uppercase font-bold">YR</span>
                      <span className="text-[10px] font-mono text-cyan-500 font-bold leading-none">
                        {formatChronalTime(currentCommit?.date).split(':')[0]}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-zinc-500 uppercase font-bold">MO</span>
                      <span className="text-[10px] font-mono text-cyan-500 font-bold leading-none">
                        {formatChronalTime(currentCommit?.date).split(':')[1]}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-zinc-500 uppercase font-bold">WK</span>
                      <span className="text-[10px] font-mono text-cyan-500 font-bold leading-none">
                        {formatChronalTime(currentCommit?.date).split(':')[2]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-zinc-800 pl-3">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest">UID</span>
                    <span className="text-[9px] font-medium text-zinc-300 font-mono">
                      {currentCommit?.hash.substring(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
    </div>
  );
};
