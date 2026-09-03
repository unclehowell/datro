"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { startDialTone, stopDialTone, playAnswerChime, startHoldTone, stopHoldTone, playHangUpTone, playBeep } from "@/lib/voice";

const CHAT_CACHE_KEY = "agentos-chat-messages";
const VOICE_CACHE_KEY = "agentos-voice-call-messages";
const VOICE_SESSION_KEY = "agentos-voice-session-id";

// ─── Phone call ack lines ──────────────────────────────────
const CALL_ACK_LINE = "Hello? Finance Cheque UK speaking. Go ahead, caller.";
const HOLD_ACK_LINE = "One moment, let me check that for you.";
const VOICEMAIL_GREETING = "Nobody is available to take your call right now. Please leave a message after the beep.";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: Array<{ tool: string; params: Record<string, string>; result?: string }>;
  routed?: string;
  dependency?: string;
  provider?: string;
  videoResult?: { filename: string; path: string };
}

function loadCachedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(msgs.slice(-100)));
  } catch {}
}

function loadVoiceMessages(): Message[] {
  try {
    const raw = localStorage.getItem(VOICE_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveVoiceMessages(msgs: Message[]) {
  try {
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(msgs.slice(-100)));
  } catch {}
}

function getVoiceSessionId(): string {
  try {
    let id = localStorage.getItem(VOICE_SESSION_KEY);
    if (!id) {
      id = `call-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(VOICE_SESSION_KEY, id);
    }
    return id;
  } catch {
    return `call-${Date.now().toString(36)}`;
  }
}

// ─── Pipeline breadcrumb steps ─────────────────────────────
const PIPELINE_STEPS = [
  { id: "webgui", label: "webgui", icon: "\uD83C\uDF10" },
  { id: "roulette", label: "roulette", icon: "\uD83C\uDFB2" },
  { id: "hermes", label: "hermes", icon: "\uD83E\uDD16" },
  { id: "ollama", label: "ollama", icon: "\uD83E\uDD13" },
  { id: "minicpm5", label: "minicpm5", icon: "\uD83E\uDDE0" },
  { id: "router", label: "router", icon: "\uD83D\uDD04" },
  { id: "tools", label: "tools", icon: "\uD83D\uDD27" },
  { id: "mcp", label: "mcp", icon: "\uD83D\uDD17" },
];

const STATUS_COLORS = {
  green: { text: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", glow: "0 0 8px rgba(34,197,94,0.4)" },
  amber: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", glow: "0 0 8px rgba(245,158,11,0.4)" },
  red:   { text: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", glow: "0 0 8px rgba(239,68,68,0.4)" },
  off:   { text: "#525252", bg: "rgba(30,30,30,0.3)", border: "rgba(50,50,50,0.3)", glow: "none" },
};

const ROUTE_ICONS: Record<string, string> = {
  chat: "\uD83D\uDCAC", exec: "\u2699\uFE0F", math: "\uD83E\uDDEE",
  video: "\uD83C\uDFAC", tool: "\uD83D\uDD27", mcp: "\uD83D\uDD17", idle: "\u23FA",
};

const ALL_TOOLS = [
  { id: "chat", label: "CHAT", icon: "\uD83D\uDCAC", desc: "Conversational AI (Cloud LLM)" },
  { id: "exec", label: "EXEC", icon: "\u2699\uFE0F", desc: "Terminal Command" },
  { id: "math", label: "MATH", icon: "\uD83E\uDDEE", desc: "Calculator (Shell)" },
  { id: "video", label: "VIDEO", icon: "\uD83C\uDFAC", desc: "Video Generation (ai-video / SVG scene engine)" },
  { id: "tool", label: "TOOL", icon: "\uD83D\uDD27", desc: "Agent Tool" },
  { id: "mcp",  label: "MCP",  icon: "\uD83D\uDD17", desc: "MCP Server" },
  { id: "idle", label: "IDLE", icon: "\u23FA", desc: "Waiting..." },
];

const DEPENDENCY_MAP: Record<string, Array<{ id: string; label: string; icon: string }>> = {
  chat: [
    { id: "groq", label: "Groq", icon: "\u26A1" },
    { id: "openrouter", label: "OpenRouter", icon: "\uD83C\uDF10" },
    { id: "cerebras", label: "Cerebras", icon: "\uD83E\uDDE0" },
    { id: "google", label: "Gemini", icon: "\uD83D\uDD35" },
    { id: "mistral", label: "Mistral", icon: "\uD83C\uDF0C" },
  ],
  exec: [{ id: "terminal", label: "Terminal", icon: "\u2328\uFE0F" }],
  math: [{ id: "python3", label: "Python3", icon: "\uD83D\uDC0D" }],
  video: [{ id: "ai-video", label: "ai-video", icon: "\uD83C\uDFAC" }],
  tool: [
    { id: "terminal", label: "Terminal", icon: "\u2328\uFE0F" },
    { id: "file_read", label: "File Read", icon: "\uD83D\uDCC4" },
    { id: "git", label: "Git", icon: "\uD83D\uDD00" },
    { id: "python", label: "Python", icon: "\uD83D\uDC0D" },
    { id: "pm2", label: "PM2", icon: "\uD83D\uDCCA" },
  ],
  mcp: [{ id: "obsidian-brain", label: "Obsidian Brain", icon: "\uD83E\uDDE0" }],
  idle: [{ id: "standby", label: "Standby", icon: "\u23FA" }],
};

// ─── Sub-cluster graph data ────────────────────────────────
const CLUSTERS = [
  { id: "core", label: "Core", color: "#667eea", nodes: ["brain", "vault", "mem0", "hermes", "opencode"] },
  { id: "agents", label: "Agents", color: "#764ba2", nodes: ["datro", "command", "financecheque", "gui", "dcc"] },
  { id: "runtime", label: "Runtime", color: "#f093fb", nodes: ["session", "loop", "scheduler", "graph", "procedure"] },
  { id: "tools", label: "Tools", color: "#4facfe", nodes: ["mcp", "tool-registry", "skill", "flywheel", "release"] },
  { id: "infra", label: "Infrastructure", color: "#22c55e", nodes: ["minicpm5", "ollama", "groq", "remotion", "voice"] },
];

// ─── Obsidian-style Knowledge Graph (clustered, zoomable) ──
function ObsidianGraph({ pulsing }: { pulsing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number; r: number;
    label: string; color: string; cluster: string; clusterX: number; clusterY: number;
  }>>([]);
  const pulseRef = useRef(0);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate clustered nodes
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;
    const clusterRadius = Math.min(w, h) * 0.28;
    const nodeRadius = 50;

    const nodes: typeof nodesRef.current = [];
    CLUSTERS.forEach((cluster, ci) => {
      const angle = (ci / CLUSTERS.length) * Math.PI * 2 - Math.PI / 2;
      const clusterX = cx + Math.cos(angle) * clusterRadius;
      const clusterY = cy + Math.sin(angle) * clusterRadius;

      cluster.nodes.forEach((label, ni) => {
        const subAngle = (ni / cluster.nodes.length) * Math.PI * 2;
        const subRadius = nodeRadius + Math.random() * 20;
        nodes.push({
          x: clusterX + Math.cos(subAngle) * subRadius,
          y: clusterY + Math.sin(subAngle) * subRadius,
          vx: 0,
          vy: 0,
          r: 3 + Math.random() * 3,
          label,
          color: cluster.color,
          cluster: cluster.label,
          clusterX,
          clusterY,
        });
      });
    });

    nodesRef.current = nodes;

    // Edges: connect nodes within cluster, plus some cross-cluster
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].cluster === nodes[j].cluster) {
          if (Math.random() < 0.4) edges.push([i, j]);
        } else if (Math.random() < 0.03) {
          edges.push([i, j]);
        }
      }
    }

    // Zoom handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current * delta));
    };

    const handleMouseDown = (e: MouseEvent) => {
      dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panRef.current.x, startPanY: panRef.current.y };
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      panRef.current.x = dragRef.current.startPanX + (e.clientX - dragRef.current.startX);
      panRef.current.y = dragRef.current.startPanY + (e.clientY - dragRef.current.startY);
    };
    const handleMouseUp = () => { dragRef.current = null; };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      pulseRef.current += pulsing ? 0.08 : 0.02;
      const pulseScale = pulsing ? 1 + Math.sin(pulseRef.current) * 0.15 : 1;

      const zoom = zoomRef.current;
      const pan = panRef.current;

      ctx.save();
      ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      const nodes = nodesRef.current;

      // Gentle force: pull nodes toward cluster center
      for (const n of nodes) {
        const dx = n.clusterX - n.x;
        const dy = n.clusterY - n.y;
        n.vx += dx * 0.001;
        n.vy += dy * 0.001;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.95;
        n.vy *= 0.95;
      }

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 60) {
            const force = (60 - dist) / dist * 0.1;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
      }

      // Draw edges
      ctx.lineWidth = 0.3;
      for (const [a, b] of edges) {
        ctx.strokeStyle = nodes[a].cluster === nodes[b].cluster
          ? nodes[a].color + "30"
          : "rgba(100,100,140,0.1)";
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }

      // Draw cluster labels (only show cluster name, not individual nodes)
      const drawnClusters = new Set<string>();
      for (const n of nodes) {
        if (!drawnClusters.has(n.cluster)) {
          drawnClusters.add(n.cluster);
          // Find cluster centroid
          const clusterNodes = nodes.filter(nn => nn.cluster === n.cluster);
          const avgX = clusterNodes.reduce((s, nn) => s + nn.x, 0) / clusterNodes.length;
          const avgY = clusterNodes.reduce((s, nn) => s + nn.y, 0) / clusterNodes.length;

          // Cluster label above centroid
          ctx.fillStyle = n.color + "90";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(n.cluster.toUpperCase(), avgX, avgY - 35);

          // Cluster ring
          ctx.strokeStyle = n.color + "20";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(avgX, avgY, 55, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const r = n.r * pulseScale;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color + "50";
        ctx.fill();
        ctx.strokeStyle = n.color + "90";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Small label
        ctx.fillStyle = n.color + "50";
        ctx.font = "6px monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + r + 8);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pulsing]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style={{ opacity: 0.7 }}
    />
  );
}

// ─── Title: Finance Cheque UK - Child Proxy ────────────────
function ProxyTitle({ pulsing }: { pulsing: boolean }) {
  return (
    <div
      className="absolute left-0 right-0 text-center pointer-events-none transition-all duration-700"
      style={{
        top: "60px",
        opacity: 1,
        transform: pulsing ? `scale(${1 + Math.sin(Date.now() * 0.003) * 0.02})` : "scale(1)",
      }}
    >
      <h1
        className="text-3xl font-light tracking-[0.2em] select-none"
        style={{
          color: "#e8b84e",
          textShadow: pulsing
            ? "0 0 30px rgba(232,184,78,0.6), 0 0 60px rgba(232,184,78,0.3)"
            : "0 0 20px rgba(232,184,78,0.4)",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.2em",
        }}
      >
        Finance Cheque UK — Child Proxy
      </h1>
    </div>
  );
}

// Animated pipeline breadcrumb shown in the voicemail list while a
// recorded message is being processed (stt > think > tts).
// Animated pipeline breadcrumb shown on the voicemail modal while a
// recorded message is being processed (stt > think > tts). The active
// step pulses; completed steps stay lit green.
function VmProcessingBreadcrumb({ active }: { active: string }) {
  const steps = [
    { id: "stt", label: "stt" },
    { id: "llm", label: "think" },
    { id: "tts", label: "tts" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === active);
  return (
    <div className="flex items-center gap-0 text-[10px] font-mono justify-center">
      {steps.map((s, i) => {
        const done = activeIdx > i || active === "complete";
        const isActive = activeIdx === i;
        return (
          <span key={s.id} className="flex items-center">
            {i > 0 && <span className="text-text-muted mx-0.5">&gt;</span>}
            <span
              className={`px-1.5 py-0.5 rounded border transition-all ${
                isActive
                  ? "border-accent/50 bg-accent/15 text-accent animate-pulse"
                  : done
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-border bg-surface text-text-muted opacity-60"
              }`}
            >
              {s.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── PlaybackBar: music-style voicemail reply player ───────
function PlaybackBar({ vmId, onDelete, onClose }: { vmId: string; onDelete: () => void; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = new Audio(`/api/voicemail?action=audio&id=${vmId}`);
    audioRef.current = audio;
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
    audio.addEventListener("play", () => {
      setPlaying(true);
      tickRef.current = setInterval(() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }, 100);
    });
    audio.addEventListener("pause", () => setPlaying(false));
    fetch("/api/voicemail?action=update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vmId, played: true }),
    });
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      audio.pause();
      audio.src = "";
    };
  }, [vmId]);

  const togglePlay = () => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play(); };
  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) { audioRef.current.currentTime = pct * duration; setProgress(pct * duration); }
  };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="mb-3">
        <div className="relative h-2 bg-zinc-800 rounded-full cursor-pointer group" onClick={seek}>
          <div className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-surface shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${pct}% - 6px)` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-text-muted">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={toggleSpeed} className="px-2 py-1 rounded bg-zinc-800 text-xs font-mono text-text-muted hover:text-accent transition-colors border border-zinc-700">{speed}x</button>
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors">
          {playing
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
        </button>
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration); }} className="px-2 py-1 rounded bg-zinc-800 text-xs text-text-muted hover:text-accent transition-colors border border-zinc-700" title="Skip 10s">+10s</button>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <button onClick={onDelete} className="text-xs text-text-muted hover:text-red-400 transition-colors flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary transition-colors">Close</button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const cached = loadCachedMessages();
    if (cached.length > 0) {
      setMessages(cached);
    }
  }, []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState("openbmb/minicpm5");
  const [recording, setRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [duplexActive, setDuplexActive] = useState(false);
  // ─── Mode options (act / plan) ─────────────────────────
  const [mode, setMode] = useState<"act" | "plan">("act");
  // ─── Separate voice-call session ───────────────────────
  const [voiceMessages, setVoiceMessages] = useState<Message[]>([]);
  // ─── In-call error toast ───────────────────────────────
  const [callToast, setCallToast] = useState<string | null>(null);

  // ─── Breadcrumb state ──────────────────────────────────
  const [pipelineStep, setPipelineStep] = useState(0);
  const [rouletteLabel, setRouletteLabel] = useState("text");
  const [healthStatus, setHealthStatus] = useState<Record<string, string>>({});

  // ─── Voice/TTS graph state ─────────────────────────────
  const [ttsPulsing, setTtsPulsing] = useState(false);

  // ─── Roulette state ────────────────────────────────────
  const [activeRoute, setActiveRoute] = useState<string>("idle");
  const [spinning, setSpinning] = useState(false);
  const [spinIndex, setSpinIndex] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [activeDependency, setActiveDependency] = useState<string>("");
  const [depSpinning, setDepSpinning] = useState(false);
  const [depSpinIndex, setDepSpinIndex] = useState(0);
  const [tools, setTools] = useState<Array<{ name: string; category: string }>>([]);

  // ─── Proxy lock state ──────────────────────────────────
  const [proxyLocked, setProxyLocked] = useState(false);
  const [proxyLockInfo, setProxyLockInfo] = useState<{ sessionId: string; origin: string; expiresAt: number } | null>(null);
  const [videoModal, setVideoModal] = useState<{ filename: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clearingStorage, setClearingStorage] = useState(false);

  // ─── Voicemail state ───────────────────────────────────
  const [voicemails, setVoicemails] = useState<Array<{
    id: string; userText: string; agentText: string; audioPath: string;
    timestamp: number; played: boolean; taskId?: string;
  }>>([]);
  const [voicemailOpen, setVoicemailOpen] = useState(false);
  const [deletingVm, setDeletingVm] = useState<string | null>(null);
  const [playbackVmId, setPlaybackVmId] = useState<string | null>(null);
  // Voicemails recorded but still processing (hang-up → reply lands)
  const [pendingVms, setPendingVms] = useState<Array<{ id: string; ts: number }>>([]);
  // Voicemail modal: tracks the pending/real ID to show in the overlay
  const [voicemailModalPendingId, setVoicemailModalPendingId] = useState<string | null>(null);
  const [voicemailModalRealId, setVoicemailModalRealId] = useState<string | null>(null);
  // Live pipeline status for the voicemail modal (stt → llm → tts → complete)
  const [vmStatus, setVmStatus] = useState<{ status: string; userText?: string; agentText?: string; error?: string } | null>(null);

  // ─── Version state ─────────────────────────────────────
  const [versionInfo, setVersionInfo] = useState<{
    local: string; remote: string; latestRelease: string; releaseUrl: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const duplexRef = useRef(false);
  const speakingRef = useRef(false);
  // ─── Call flow refs ────────────────────────────────────
  const callPhaseRef = useRef<"idle" | "dialing" | "listening" | "generating" | "voicemail">("idle");
  const callModeRef = useRef<"act" | "plan">("act");
  const draftRef = useRef("");
  const lastVoiceAtRef = useRef(0);
  const lastSpeechEndRef = useRef(0);
  const voiceAbortRef = useRef(false);
  const voiceStreamingRef = useRef(false);
  const voiceSessionIdRef = useRef<string>("");
  const voiceMessagesRef = useRef<Message[]>([]);
  const sendCallReplyRef = useRef<(t: string) => Promise<void>>(async () => {});
  const sttFailCountRef = useRef(0);
  const callToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  // ─── Voicemail recording (unanswered calls) ────────────
  const vmRecorderRef = useRef<MediaRecorder | null>(null);
  const vmChunksRef = useRef<Blob[]>([]);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const depSpinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pipelineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const JarvisPulseRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { duplexRef.current = duplexActive; }, [duplexActive]);

  useEffect(() => { saveMessages(messages); }, [messages]);

  useEffect(() => {
    setVoiceMessages(loadVoiceMessages());
    voiceSessionIdRef.current = getVoiceSessionId();
  }, []);

  useEffect(() => { saveVoiceMessages(voiceMessages); }, [voiceMessages]);

  useEffect(() => { callModeRef.current = mode; }, [mode]);

  // ─── First-run setup gate + health polling ─────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const setupRes = await fetch("/api/setup", { cache: "no-store" });
        if (setupRes.ok) {
          const setup = await setupRes.json();
          if (!setup.complete) {
            window.location.href = "/setup";
            return;
          }
        }

        const res = await fetch("/api/status");
        const data = await res.json();
        const status: Record<string, string> = {};
        for (const seg of data.breadcrumbs || []) {
          status[seg.label] = seg.status;
        }
        setHealthStatus(status);
      } catch {}
    };
    check();
    const iv = setInterval(check, 15000);
    return () => clearInterval(iv);
  }, []);

  // ─── Proxy lock polling ────────────────────────────────
  useEffect(() => {
    const checkLock = async () => {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        if (data.proxyLock) {
          setProxyLocked(true);
          setProxyLockInfo(data.proxyLock);
        } else {
          setProxyLocked(false);
          setProxyLockInfo(null);
        }
      } catch {}
    };
    checkLock();
    const iv = setInterval(checkLock, 5000);
    return () => clearInterval(iv);
  }, []);

  // ─── Tools list ────────────────────────────────────────
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await fetch("/api/tools");
        const data = await res.json();
        if (data.tools) setTools(data.tools);
      } catch {}
    };
    fetchTools();
    const iv = setInterval(fetchTools, 30000);
    return () => clearInterval(iv);
  }, []);

  // ─── Voicemail list ────────────────────────────────────
  const fetchVoicemails = useCallback(async () => {
    try {
      const res = await fetch("/api/voicemail?action=list");
      const data = await res.json();
      if (data.voicemails) setVoicemails(data.voicemails);
      // Drop pending placeholders older than 10 min (stuck pipeline).
      setPendingVms((prev) => prev.filter((p) => Date.now() - p.ts < 600000));
    } catch {}
  }, []);

  useEffect(() => {
    fetchVoicemails();
    const iv = setInterval(fetchVoicemails, 30000);
    return () => clearInterval(iv);
  }, [fetchVoicemails]);

  const deleteVoicemail = useCallback(async (id: string) => {
    setDeletingVm(id);
    try {
      await fetch("/api/voicemail?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setVoicemails((prev) => prev.filter((vm) => vm.id !== id));
    } catch {}
    setDeletingVm(null);
  }, []);

  // ─── Version info (fetched from GitHub releases) ──────
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/version");
        const data = await res.json();
        setVersionInfo(data);
      } catch {}
    };
    fetchVersion();
    const iv = setInterval(fetchVersion, 60000);
    return () => clearInterval(iv);
  }, []);

  // ─── Pipeline breadcrumb: sequential ignition ──────────
  const ignitePipeline = useCallback((targetStep: number, delayMs = 120) => {
    if (pipelineTimerRef.current) clearTimeout(pipelineTimerRef.current);
    let step = 0;
    const tick = () => {
      step++;
      setPipelineStep(step);
      if (step < targetStep) {
        pipelineTimerRef.current = setTimeout(tick, delayMs);
      }
    };
    pipelineTimerRef.current = setTimeout(tick, delayMs);
  }, []);

  const resetPipeline = useCallback(() => {
    if (pipelineTimerRef.current) clearTimeout(pipelineTimerRef.current);
    setPipelineStep(0);
  }, []);

  // ─── Roulette spin ─────────────────────────────────────
  const startSpin = useCallback(() => {
    setSpinning(true);
    setSpinIndex(0);
    let count = 0;
    const totalSpins = 15 + Math.floor(Math.random() * 10);
    const tick = () => {
      count++;
      setSpinIndex((prev) => (prev + 1) % ALL_TOOLS.length);
      const progress = count / totalSpins;
      if (count < totalSpins) {
        spinTimerRef.current = setTimeout(tick, 50 + progress * 200);
      }
    };
    spinTimerRef.current = setTimeout(tick, 50);
  }, []);

  const stopSpin = useCallback((target: string) => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    const targetIndex = ALL_TOOLS.findIndex((t) => t.id === target);
    if (targetIndex === -1) { setSpinning(false); setActiveRoute(target); return; }
    let current = spinIndex;
    let step = 0;
    const decel = () => {
      step++;
      current = (current + 1) % ALL_TOOLS.length;
      setSpinIndex(current);
      if (step < 8) setTimeout(decel, 40 + step * 30);
      else { setSpinIndex(targetIndex); setSpinning(false); setActiveRoute(target); }
    };
    decel();
  }, [spinIndex]);

  // ─── Dependency spin ───────────────────────────────────
  const startDepSpin = useCallback(() => {
    setDepSpinning(true);
    setDepSpinIndex(0);
    let count = 0;
    const totalSpins = 12 + Math.floor(Math.random() * 8);
    const tick = () => {
      count++;
      setDepSpinIndex((prev) => {
        const opts = DEPENDENCY_MAP[activeRoute] || DEPENDENCY_MAP.idle;
        return (prev + 1) % opts.length;
      });
      const progress = count / totalSpins;
      if (count < totalSpins) depSpinTimerRef.current = setTimeout(tick, 40 + progress * 180);
    };
    depSpinTimerRef.current = setTimeout(tick, 40);
  }, [activeRoute]);

  const stopDepSpin = useCallback((target: string) => {
    if (depSpinTimerRef.current) clearTimeout(depSpinTimerRef.current);
    const opts = DEPENDENCY_MAP[activeRoute] || DEPENDENCY_MAP.idle;
    const targetIndex = opts.findIndex((d) => d.id === target);
    if (targetIndex === -1) { setDepSpinning(false); setActiveDependency(target); return; }
    let current = depSpinIndex;
    let step = 0;
    const decel = () => {
      step++;
      current = (current + 1) % opts.length;
      setDepSpinIndex(current);
      if (step < 6) setTimeout(decel, 35 + step * 25);
      else { setDepSpinIndex(targetIndex); setDepSpinning(false); setActiveDependency(target); }
    };
    decel();
  }, [depSpinIndex, activeRoute]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (depSpinTimerRef.current) clearTimeout(depSpinTimerRef.current);
      if (pipelineTimerRef.current) clearTimeout(pipelineTimerRef.current);
      if (JarvisPulseRef.current) clearInterval(JarvisPulseRef.current);
    };
  }, []);

  // ─── Clear storage (delete all videos) ────────────────────
  const clearStorage = useCallback(async () => {
    if (!confirm("Delete all rendered videos? This cannot be undone.")) return;
    setClearingStorage(true);
    try {
      const res = await fetch("/api/video/clear", { method: "DELETE" });
      const data = await res.json();
      alert(data.reply || (data.deleted ? `Deleted ${data.deleted} files` : "Nothing to delete"));
    } catch {
      alert("Failed to clear storage");
    } finally {
      setClearingStorage(false);
    }
  }, []);

  // ─── TTS with graph ────────────────────────────────────
  // Text-message narration is muted while on a call (the call
  // speaks its own replies via speakForCall).
  const speakText = useCallback(async (text: string, opts?: { call?: boolean }) => {
    if (duplexRef.current && !opts?.call) return;
    speakingRef.current = true;
    setTtsPulsing(true);
    try {
      const res = await fetch("/api/voice?action=tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { speakNative(text); return; }
      const audioData = await res.arrayBuffer();
      await new Promise<void>((resolve) => {
        const audio = new Audio(URL.createObjectURL(new Blob([audioData], { type: "audio/mpeg" })));
        const done = () => {
          speakingRef.current = false;
          lastSpeechEndRef.current = Date.now();
          setTtsPulsing(false);
          resolve();
        };
        audio.onended = done;
        audio.onerror = () => { speakNative(text); done(); };
        audio.play().catch(() => { speakNative(text); done(); });
      });
    } catch {
      speakNative(text);
      speakingRef.current = false;
      lastSpeechEndRef.current = Date.now();
      setTtsPulsing(false);
    }
  }, []);

  const speakForCall = useCallback(async (text: string) => {
    await speakText(text, { call: true });
  }, [speakText]);

  const speakNative = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Voice input (push-to-talk → text conversation) ────
  const processVoiceInput = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size < 500) return;
    try {
      const sttForm = new FormData();
      sttForm.append("audio", audioBlob, "audio.webm");
      const sttRes = await fetch("/api/voice?action=stt", { method: "POST", body: sttForm });
      if (!sttRes.ok) throw new Error("STT failed");
      const { text } = await sttRes.json();
      if (text && text.trim()) await send(text.trim(), "voice");
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Voice error: ${err instanceof Error ? err.message : "Failed"}`,
        timestamp: Date.now(),
      }]);
    }
  };

  // ─── Call chunk: STT → draft accumulation (echo-guarded) ──
  const showCallToast = (msg: string) => {
    setCallToast(msg);
    if (callToastTimerRef.current) clearTimeout(callToastTimerRef.current);
    callToastTimerRef.current = setTimeout(() => setCallToast(null), 4000);
  };

  // A call that can't hear or answer is a dropped call — hang up cleanly
  // instead of leaving the caller in silence.
  const dropCall = (msg: string) => {
    showCallToast(msg);
    stopDuplex();
  };

  const processCallChunk = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size < 500) return;
    if (!duplexRef.current) return;                          // hung up mid-chunk → discard
    if (callPhaseRef.current !== "listening") return;        // not accepting speech now
    if (speakingRef.current) return;                         // echo guard: agent talking
    if (Date.now() - lastSpeechEndRef.current < 500) return; // echo tail guard
    try {
      const sttForm = new FormData();
      sttForm.append("audio", audioBlob, "audio.webm");
      const sttRes = await fetch("/api/voice?action=stt", { method: "POST", body: sttForm });
      if (!sttRes.ok) throw new Error("STT failed");
      const { text } = await sttRes.json();
      sttFailCountRef.current = 0;
      // Hang-up during STT must never submit.
      if (!duplexRef.current || callPhaseRef.current !== "listening") return;
      const said = (text || "").trim();
      if (said) {
        draftRef.current = `${draftRef.current} ${said}`.trim();
        lastVoiceAtRef.current = Date.now();
      }
    } catch {
      // STT service down → don't leave the caller in silence.
      sttFailCountRef.current += 1;
      if (sttFailCountRef.current >= 3 && duplexRef.current) {
        sttFailCountRef.current = 0;
        dropCall("Call dropped — speech recognition unavailable");
      }
    }
  };

  const finalizeDraft = useCallback(() => {
    const t = draftRef.current.trim();
    draftRef.current = "";
    if (t && duplexRef.current && callPhaseRef.current === "listening") {
      callPhaseRef.current = "generating";
      sendCallReplyRef.current(t);
    }
  }, []);

  // ─── Voicemail: greeting → beep → record → hang-up → modal ──
  const submitVoicemail = async (blob: Blob) => {
    const pendingId = `vm-pending-${Date.now().toString(36)}`;
    setPendingVms((prev) => [...prev, { id: pendingId, ts: Date.now() }]);
    setVoicemailOpen(true); // bring the list up so the inline animation is visible
    setVoicemailModalPendingId(pendingId);
    setVoicemailModalRealId(null);
    setVmStatus({ status: "queued" });
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voicemail.webm");
      const res = await fetch("/api/voicemail?action=process-async", { method: "POST", body: fd });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data.id) {
        const poll = setInterval(async () => {
          try {
            const sr = await fetch(`/api/voicemail?action=status&id=${data.id}`);
            const sd = await sr.json();
            setVmStatus(sd);
            if (sd.status === "complete" || sd.status === "error") {
              clearInterval(poll);
              // The finished voicemail replaces the processing card inline
              // in the list — no modal popup.
              setVoicemailModalPendingId(null);
              fetchVoicemails();
            }
          } catch {}
        }, 2000);
        setTimeout(() => clearInterval(poll), 300_000);
      } else {
        setVoicemailModalPendingId(null);
        fetchVoicemails();
      }
    } catch {
      setVmStatus({ status: "error", error: "Could not save voicemail" });
    } finally {
      setPendingVms((prev) => prev.filter((p) => p.id !== pendingId));
    }
  };

  const divertToVoicemail = async () => {
    if (!duplexRef.current) return;
    callPhaseRef.current = "voicemail";
    // Play hardcoded greeting MP3
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio("/audio/greeting.mp3");
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("greeting failed"));
        audio.play().catch(reject);
      });
    } catch {
      await speakForCall(VOICEMAIL_GREETING);
    }
    if (!duplexRef.current || callPhaseRef.current !== "voicemail") return;
    playBeep();
    const stream = streamRef.current;
    if (!stream) return;
    vmChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) vmChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      vmRecorderRef.current = null;
      const blob = new Blob(vmChunksRef.current, { type: "audio/webm" });
      if (blob.size > 500) void submitVoicemail(blob);
    };
    vmRecorderRef.current = recorder;
    recorder.start(1000);
  };

  // Phone button: tap to start voicemail recording, tap again to hang up
  const startVoicemail = useCallback(async () => {
    if (duplexRef.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { return; }
    streamRef.current = stream;
    duplexRef.current = true;
    setDuplexActive(true);
    callPhaseRef.current = "voicemail";
    draftRef.current = "";
    voiceAbortRef.current = false;

    // Play greeting MP3 → beep → start recording
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio("/audio/greeting.mp3");
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("greeting failed"));
        audio.play().catch(reject);
      });
    } catch {
      await speakForCall(VOICEMAIL_GREETING);
    }
    if (!duplexRef.current || callPhaseRef.current !== "voicemail") return;
    playBeep();
    vmChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) vmChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      vmRecorderRef.current = null;
      const blob = new Blob(vmChunksRef.current, { type: "audio/webm" });
      if (blob.size > 500) void submitVoicemail(blob);
    };
    vmRecorderRef.current = recorder;
    recorder.start(1000);
  }, [speakForCall]);

  const stopDuplex = useCallback(() => {
    const wasActive = duplexRef.current;
    const wasVoicemail = callPhaseRef.current === "voicemail";
    duplexRef.current = false;
    setDuplexActive(false);
    setVoiceMode(false);
    callPhaseRef.current = "idle";
    voiceAbortRef.current = true;
    voiceStreamingRef.current = false;
    draftRef.current = "";
    stopDialTone();
    stopHoldTone();
    if (wasActive) playHangUpTone();
    // Flush voicemail recorder first — its onstop submits to the modal.
    // Defer stream teardown so onstop fires before tracks die.
    if (wasVoicemail && vmRecorderRef.current && vmRecorderRef.current.state !== "inactive") {
      const stream = streamRef.current;
      vmRecorderRef.current.onstop = () => {
        vmRecorderRef.current = null;
        const blob = new Blob(vmChunksRef.current, { type: "audio/webm" });
        if (blob.size > 500) void submitVoicemail(blob);
        if (stream) { stream.getTracks().forEach((t) => t.stop()); }
      };
      vmRecorderRef.current.stop();
      streamRef.current = null;
    } else {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    try { window.speechSynthesis.cancel(); } catch {}
  }, []);

  const toggleRecording = useCallback(async () => {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecording(false);
        await processVoiceInput(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
    } catch { setRecording(false); }
  }, [recording, streaming, model]);

  const executeTool = async (tool: string, params: Record<string, string>, msgIndex: number, toolIndex: number) => {
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, params }),
      });
      const data = await res.json();
      setMessages((prev) => {
        const updated = [...prev];
        const msg = { ...updated[msgIndex] };
        const tc = [...(msg.toolCalls || [])];
        tc[toolIndex] = { ...tc[toolIndex], result: data.result || data.error };
        msg.toolCalls = tc;
        updated[msgIndex] = msg;
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const msg = { ...updated[msgIndex] };
        const tc = [...(msg.toolCalls || [])];
        tc[toolIndex] = { ...tc[toolIndex], result: `Error: ${err instanceof Error ? err.message : "Failed"}` };
        msg.toolCalls = tc;
        updated[msgIndex] = msg;
        return updated;
      });
    }
  };

  const AI_VIDEO_TEMPLATES = ["dance", "nature", "city", "space", "fire", "snow"];

  const isVideoToolCall = (tool: string, params: Record<string, string>): boolean => {
    if (tool !== "remotion") return false;
    const template = params.template || params.scene;
    if (template && AI_VIDEO_TEMPLATES.includes(template)) return true;
    return false;
  };

  const parseToolCalls = (content: string) => {
    const calls: Array<{ tool: string; params: Record<string, string> }> = [];
    const regex = /\[TOOL:(\w+):\{([^}]+)\}\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const params: Record<string, string> = {};
      for (const pair of match[2].split(",")) {
        const [k, ...v] = pair.split(":");
        if (k && v.length) params[k.trim()] = v.join(":").trim().replace(/^["']|["']$/g, "");
      }
      const tool = isVideoToolCall(match[1], params) ? "ai-video" : match[1];
      calls.push({ tool, params });
    }
    return calls;
  };

  // ─── New Session (unlock from proxy) ───────────────────
  const startNewSession = async () => {
    try {
      await fetch("/api/proxy/unlock", { method: "POST" });
      setProxyLocked(false);
      setProxyLockInfo(null);
      setMessages([]);
    } catch {}
  };

  // ─── Auto-preload then auto-play a finished video ─────
  const preloadAndPlayVideo = useCallback((filename: string) => {
    const url = `/api/video/${filename}`;
    const pre = document.createElement("video");
    pre.preload = "auto";
    pre.src = url;
    pre.muted = true;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      pre.removeAttribute("src");
      setVideoModal({ filename });
    };
    pre.addEventListener("canplaythrough", show);
    pre.addEventListener("loadeddata", show);
    setTimeout(show, 6000);
  }, []);

  // ─── Autoplay the modal video (sound first, muted fallback) ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [videoModal]);

  // ─── Call reply: separate voice session, hold-tone flow ──
  const sendCallReply = async (spoken: string) => {
    if (voiceStreamingRef.current) return;
    voiceStreamingRef.current = true;
    // Immediate hold ack so the caller knows they were heard.
    speakForCall(HOLD_ACK_LINE).catch(() => {});
    startHoldTone();

    const userMsg: Message = { role: "user", content: spoken, timestamp: Date.now() };
    const history = [...voiceMessagesRef.current, userMsg];
    voiceMessagesRef.current = history;
    setVoiceMessages(history);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          model,
          mode: callModeRef.current,
          voiceCall: true,
          sessionId: voiceSessionIdRef.current,
        }),
      });
      if (!res.ok) throw new Error(`Chat error: ${res.status}`);
      const json = await res.json();
      if (!duplexRef.current || voiceAbortRef.current) return; // hung up while generating → drop
      const reply = (json.reply || "").trim() || "Sorry, I did not catch that.";
      const updated: Message[] = [...voiceMessagesRef.current, {
        role: "assistant", content: reply, timestamp: Date.now(),
        routed: json.routed, provider: json.provider, dependency: json.dependency,
      }];
      voiceMessagesRef.current = updated;
      setVoiceMessages(updated);
      stopHoldTone();
      // Save voice exchange as a voicemail so the user can replay it later
      void fetch("/api/voicemail?action=save-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: spoken, agentText: reply }),
      }).catch(() => {});
      await speakForCall(reply);
    } catch {
      stopHoldTone();
      if (duplexRef.current && !voiceAbortRef.current) {
        dropCall("Call dropped — assistant unavailable");
      }
    } finally {
      voiceStreamingRef.current = false;
      if (duplexRef.current) {
        callPhaseRef.current = "listening";
        lastVoiceAtRef.current = Date.now();
      }
    }
  };
  sendCallReplyRef.current = sendCallReply;

  // ─── Send message ──────────────────────────────────────
  const send = async (text?: string, inputType: "text" | "voice" = "text") => {
    const msg = text || input.trim();
    if (!msg || streaming || proxyLocked) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput("");
    setStreaming(true);

    setRouletteLabel(inputType);

    resetPipeline();
    setTimeout(() => ignitePipeline(2), 100);
    setTimeout(() => ignitePipeline(3), 300);
    setTimeout(() => ignitePipeline(4), 500);
    setTimeout(() => ignitePipeline(5), 700);

    startSpin();

    const assistantMsg: Message = { role: "assistant", content: "", timestamp: Date.now() };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, model, mode }),
      });

      if (!res.ok) throw new Error(`Chat error: ${res.status}`);

      const rawText = await res.text();
      let accumulated = "";
      let routed = "";
      let provider = "";
      let dependency = "";

      try {
        const json = JSON.parse(rawText);
        if (json.reply) {
          accumulated = json.reply;
          routed = json.routed || "";
          provider = json.provider || "";
          dependency = json.dependency || "";
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: accumulated,
              routed,
              dependency,
              provider,
              videoResult: json.videoResult || undefined,
            };
            return updated;
          });

          // ── Video job polling ──────────────────────────────
          if (json.videoJobId && json.success) {
            const jobId = json.videoJobId;
            const msgIdx = messages.length + 1; // index of the assistant msg we just added
            let pollCount = 0;
            const maxPolls = 120; // 120 * 5s = 10 min max
            const poll = async () => {
              pollCount++;
              if (pollCount > maxPolls) return;
              try {
                const statusRes = await fetch(`/api/chat?videoJobId=${jobId}`);
                if (!statusRes.ok) return;
                const status = await statusRes.json();
                if (status.status === "done") {
                  const videoPath = status.result?.output || "unknown";
                  const filename = videoPath.split(/[\/\s]+/).filter((p: string) => p.endsWith(".mp4")).pop() || "video.mp4";
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[msgIdx] = {
                      ...updated[msgIdx],
                      content: `Video ready`,
                      videoResult: { filename, path: videoPath },
                    };
                    return updated;
                  });
                  preloadAndPlayVideo(filename);
                  return;
                }
                if (status.status === "failed") {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[msgIdx] = {
                      ...updated[msgIdx],
                      content: `Video render failed: ${status.result?.error || "Unknown error"}`,
                    };
                    return updated;
                  });
                  return;
                }
                // Still running — poll again in 5s
                setTimeout(poll, 5000);
              } catch {
                setTimeout(poll, 5000);
              }
            };
            setTimeout(poll, 5000); // first poll after 5s
          }
        }
      } catch {
        const lines = rawText.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }

      ignitePipeline(6, 150);
      setTimeout(() => ignitePipeline(7, 150), 200);

      if (routed) {
        stopSpin(routed);
        setActiveProvider(provider);
        setTimeout(() => {
          startDepSpin();
          setTimeout(() => stopDepSpin(dependency || "standby"), 800);
        }, 500);
      } else {
        stopSpin("chat");
      }

      const toolCalls = parseToolCalls(accumulated);
      if (toolCalls.length > 0) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], toolCalls };
          return updated;
        });
      }

      if (accumulated && autoSpeak) await speakText(accumulated);
    } catch (err) {
      stopSpin("idle");
      resetPipeline();
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const currentTool = spinning ? ALL_TOOLS[spinIndex] : ALL_TOOLS.find((t) => t.id === activeRoute) || ALL_TOOLS[ALL_TOOLS.length - 1];
  const currentToolColors = spinning ? STATUS_COLORS.amber : (activeRoute !== "idle" ? STATUS_COLORS.green : STATUS_COLORS.amber);

  const breadcrumbData = useMemo(() => {
    return PIPELINE_STEPS.map((step, i) => {
      let status: "green" | "amber" | "red" | "off" = "off";
      if (i === 0) {
        status = "green";
      } else if (i <= pipelineStep) {
        if (step.id === "hermes") status = healthStatus.hermes === "green" ? "green" : healthStatus.hermes ? "amber" : "green";
        else if (step.id === "ollama") status = healthStatus.ollama === "green" ? "green" : healthStatus.ollama ? "amber" : "green";
        else if (step.id === "minicpm5") status = healthStatus.model === "green" ? "green" : healthStatus.model ? "amber" : "green";
        else if (step.id === "tools") status = healthStatus.tools === "green" ? "green" : healthStatus.tools ? "amber" : "green";
        else if (step.id === "mcp") status = healthStatus.mcp === "green" ? "green" : healthStatus.mcp ? "amber" : "amber";
        else status = "green";
      }
      if (step.id === "roulette") {
        return { ...step, label: `roulette(${rouletteLabel})`, status };
      }
      return { ...step, status };
    });
  }, [pipelineStep, healthStatus, rouletteLabel]);

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* ─── Graph Background (always visible, behind everything) ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 pointer-events-auto">
          <ObsidianGraph pulsing={ttsPulsing} />
        </div>
        <ProxyTitle pulsing={ttsPulsing} />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d1a]/70 to-[#0d0d1a]/95 pointer-events-none" />
      </div>

      {/* ─── Header (back arrow + voicemail inbox) ─── */}
      <header className="border-b border-border px-3 md:px-4 py-2 flex items-center gap-2 shrink-0 sticky top-0 z-20 bg-surface/80 backdrop-blur-md shadow-lg shadow-black/20 min-w-0">
        {/* Back arrow */}
        <Link href="/" className="text-text-muted hover:text-text-primary transition-colors p-1 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Title */}
        <span className="text-sm font-semibold text-text-primary">Chat</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Voicemail inbox button — opens the right-side voicemail list.
            Badge shows the count of voicemails that have not been played
            yet. Mirrors the icon the user is used to seeing on phone. */}
        <button
          onClick={() => setVoicemailOpen((v) => !v)}
          className="relative p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface/60 transition-colors"
          title="Voicemails"
          aria-label="Open voicemails"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
            <path d="M15.05 2A10 10 0 0 1 22 8.95" />
            <path d="M15.05 6A6 6 0 0 1 18 8.95" />
          </svg>
          {voicemails.filter((v) => !v.played).length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {voicemails.filter((v) => !v.played).length}
            </span>
          )}
        </button>
      </header>

      {/* ─── Voicemail List Panel ─── */}
      {voicemailOpen && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setVoicemailOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-surface border-l border-border shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                  <path d="M15.05 2A10 10 0 0 1 22 8.95" />
                  <path d="M15.05 6A6 6 0 0 1 18 8.95" />
                </svg>
                Voicemails
                {voicemails.filter(v => !v.played).length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] text-white">{voicemails.filter(v => !v.played).length} new</span>
                )}
              </h2>
              <button onClick={() => setVoicemailOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-3 space-y-2">
              {voicemails.length === 0 && !voicemailModalPendingId && (
                <div className="text-text-muted text-xs text-center py-8">No voicemails yet. Tap the green handset to leave one.</div>
              )}

              {/* Processing voicemail — inline animation standing in for the
                  reply card until it lands. No modal popup. */}
              {voicemailModalPendingId && (
                <div className="p-3 rounded-lg border border-dashed border-accent/40 bg-surface/70">
                  {vmStatus?.status === "error" ? (
                    <div className="space-y-1">
                      <div className="text-red-300 text-xs">{vmStatus.error || "Processing failed"}</div>
                      <div className="text-text-muted text-[10px]">Your message was not processed.</div>
                      <button
                        onClick={() => { setVoicemailModalPendingId(null); setVoicemailModalRealId(null); }}
                        className="text-[10px] text-text-muted hover:text-text-primary transition-colors mt-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-text-muted text-[10px] mb-1.5">Voicemail</div>
                      <VmProcessingBreadcrumb
                        active={vmStatus?.status === "llm" ? "llm" : vmStatus?.status === "tts" ? "tts" : "stt"}
                      />
                      <div className="text-text-muted text-[11px] mt-3 animate-pulse">
                        {vmStatus?.status === "tts"
                          ? "Generating spoken reply\u2026"
                          : vmStatus?.status === "llm"
                          ? "Waking Hermes & Ollama \u2014 thinking\u2026"
                          : "Transcribing your message\u2026"}
                      </div>
                    </>
                  )}
                </div>
              )}

              {voicemails.map((vm) => (
                <div key={vm.id} className={`p-3 rounded-lg border ${vm.played ? "bg-zinc-800/30 border-zinc-700/50" : "bg-accent/10 border-accent/30"} transition-colors`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-primary truncate">{vm.userText || "(no transcript)"}</div>
                      <div className="text-[10px] text-text-muted mt-1 truncate">{vm.agentText || "(no reply)"}</div>
                    </div>
                    {!vm.played && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setVoicemailModalRealId(vm.id); setVoicemailOpen(false); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-accent/20 border border-accent/30 text-accent text-xs hover:bg-accent/30 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {vm.played ? "Replay" : "Play"}
                    </button>
                    <button
                      onClick={async () => { await deleteVoicemail(vm.id); }}
                      className="px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <div className="text-[10px] text-text-muted mt-2">{new Date(vm.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 relative z-10">
        {proxyLocked && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Session locked by parent proxy ({proxyLockInfo?.origin || "unknown"})</span>
            <button
              onClick={startNewSession}
              className="ml-auto px-3 py-1 rounded border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-xs"
            >
              New Session
            </button>
          </div>
        )}

        {messages.length === 0 && !streaming && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-text-muted gap-4">
            <div className="text-4xl" aria-hidden>📞</div>
            <p className="text-sm max-w-xs text-center">
              Tap the green handset for a voice call, or type below.
              <br />
              Mode: <span className="text-accent font-mono">{mode}</span>
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`animate-slide-up flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-accent/20 text-text-primary border border-accent/30"
                  : "bg-surface border border-border text-text-secondary"
              }`}
            >
              {msg.role === "assistant" && msg.content && (
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {msg.routed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: STATUS_COLORS.green.text, backgroundColor: STATUS_COLORS.green.bg, border: `1px solid ${STATUS_COLORS.green.border}` }}>
                      {ROUTE_ICONS[msg.routed] || "\uD83D\uDD27"} {msg.routed.toUpperCase()}
                    </span>
                  )}
                  {msg.dependency && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: STATUS_COLORS.green.text, backgroundColor: STATUS_COLORS.green.bg, border: `1px solid ${STATUS_COLORS.green.border}` }}>
                      {msg.dependency}
                    </span>
                  )}
                  {msg.provider && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-700">via {msg.provider}</span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {msg.content
                  || (streaming && i === messages.length - 1
                    ? (
                      <div className="space-y-2">
                        {/* Horizontal breadcrumb (hermes > ollama > llm > tool) —
                            lights up each stage as the pipeline advances so the
                            user sees which dependency is currently handling the
                            request. Replaces the old flat "thinking…" string. */}
                        <div className="flex items-center gap-0 text-[10px] font-mono flex-wrap">
                          {breadcrumbData.map((seg, j) => {
                            const colors = STATUS_COLORS[seg.status];
                            return (
                              <span key={seg.id} className="flex items-center">
                                {j > 0 && <span className="text-text-muted mx-0.5">&gt;</span>}
                                <span
                                  className="px-1.5 py-0.5 rounded whitespace-nowrap transition-all"
                                  style={{
                                    color: colors.text,
                                    backgroundColor: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    opacity: seg.status === "off" ? 0.35 : 1,
                                    boxShadow: seg.status !== "off" ? colors.glow : "none",
                                  }}
                                  title={seg.label}
                                >
                                  {seg.icon} {seg.label}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-text-muted animate-pulse text-xs">thinking…</div>
                      </div>
                    )
                    : "")}
              </div>

              {/* Video result (from background render) */}
              {msg.videoResult && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setVideoModal({ filename: msg.videoResult!.filename })} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-colors">
                    <span>&#9654;</span><span>Play Video</span>
                  </button>
                  <a href={`/api/video/${msg.videoResult.filename}`} download className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600/30 bg-zinc-800/30 text-zinc-300 text-sm hover:bg-zinc-700/30 transition-colors">
                    <span>&#8681;</span><span>Download</span>
                  </a>
                </div>
              )}

              {msg.routed === "video" && msg.content && (() => {
                const videoMatch = msg.content.match(/(video-[\d]+\.mp4)/);
                if (videoMatch) {
                  return (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setVideoModal({ filename: videoMatch[1] })} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-colors">
                        <span>&#9654;</span><span>Play Video</span>
                      </button>
                      <a href={`/api/video/${videoMatch[1]}`} download className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600/30 bg-zinc-800/30 text-zinc-300 text-sm hover:bg-zinc-700/30 transition-colors">
                        <span>&#8681;</span><span>Download</span>
                      </a>
    </div>
  );
}

                return null;
              })()}

              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.toolCalls.map((tc, j) => (
                    <div key={j} className="bg-zinc-800/50 rounded p-2 border border-zinc-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-accent">{tc.tool}</span>
                        <span className="text-xs text-zinc-500">({JSON.stringify(tc.params)})</span>
                      </div>
                      {tc.result ? (
                        <div className="text-xs text-zinc-400 whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">{tc.result}</div>
                      ) : (
                        <button onClick={() => executeTool(tc.tool, tc.params, i, j)} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/30 transition-colors">Execute</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Voicemail Replay Modal (only when the user taps Play/Replay —
          the processing animation lives inline in the voicemail list) ─── */}
      {voicemailModalRealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setVoicemailModalRealId(null)}>
          <div className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              {/* Full pipeline breadcrumb in lieu of voicemail reply */}
              <div className="flex items-center gap-0 text-[10px] font-mono justify-center flex-wrap">
                {breadcrumbData.map((seg, i) => {
                  const colors = STATUS_COLORS[seg.status];
                  return (
                    <span key={seg.id} className="flex items-center">
                      {i > 0 && <span className="text-text-muted mx-0.5">&gt;</span>}
                      <span
                        className="px-1.5 py-0.5 rounded whitespace-nowrap"
                        style={{
                          color: colors.text,
                          backgroundColor: colors.bg,
                          border: `1px solid ${colors.border}`,
                          opacity: seg.status === "off" ? 0.35 : 1,
                        }}
                        title={seg.label}
                      >
                        {seg.icon} {seg.label}
                      </span>
                    </span>
                  );
                })}
              </div>
              {vmStatus?.userText && (
                <div className="text-[11px] text-text-muted border-l-2 border-border pl-2">{vmStatus.userText}</div>
              )}
              {vmStatus?.agentText && (
                <div className="text-xs text-text-primary whitespace-pre-wrap border-l-2 border-accent/40 pl-2">{vmStatus.agentText}</div>
              )}
              <PlaybackBar
                vmId={voicemailModalRealId}
                onDelete={() => { setVoicemailModalRealId(null); }}
                onClose={() => { setVoicemailModalRealId(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Input Bar ─── */}
      <div className="border-t border-border px-3 md:px-6 py-3 md:py-4 shrink-0 relative z-10 bg-surface/80 backdrop-blur-sm">
        {/* Mobile: two rows. Desktop: one row (use md:flex-row override). */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          {/* Row 1 (mobile) / Left side (desktop): mode toggle + phone + mic */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mode options: act / plan */}
            <div className="flex rounded-lg border border-border overflow-hidden shrink-0" title={mode === "act" ? "Act mode — execute tasks" : "Plan mode — propose plans only"}>
              {(["act", "plan"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 h-10 text-xs font-medium capitalize transition-colors ${
                    mode === m ? "bg-accent/25 text-accent" : "bg-surface text-text-muted hover:text-text-primary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Phone button: green = call, red = hang up */}
            <button
              onClick={() => duplexActive ? stopDuplex() : startVoicemail()}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                duplexActive
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                  : "bg-surface border border-green-500/40 text-green-400 hover:bg-green-500/10"
              }`}
              title={duplexActive ? "Hang up" : "Start call"}
            >
              {duplexActive ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.86-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.49c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.74-1.68-1.37-2.66-1.86-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9Z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
                </svg>
              )}
            </button>

            {/* Mic button (push-to-talk) */}
            <button
              onClick={toggleRecording}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                recording ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" : "bg-surface border border-border text-text-muted hover:text-text-primary"
              }`}
              title={recording ? "Stop recording" : "Push to talk"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={recording ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill={recording ? "currentColor" : "none"} />
              </svg>
            </button>
          </div>

          {/* Row 2 (mobile) / Right side (desktop): text input + send button */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Text input */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={proxyLocked ? "Session locked by parent proxy..." : recording ? "Listening..." : duplexActive ? "On call..." : "Type a message..."}
              className={`flex-1 min-w-0 bg-surface border border-border rounded-lg px-3 md:px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors ${proxyLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={streaming || recording || proxyLocked}
            />

            {/* Send button */}
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming || proxyLocked}
              className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors disabled:opacity-30 shrink-0"
            >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
          <span>{proxyLocked ? "Locked (parent proxy)" : recording ? "Recording..." : duplexActive ? "On call" : "Ready"}</span>
          <span>Mode: {mode}</span>
          <span>Auto-speak: {autoSpeak ? "on" : "off"}</span>
          <span>Model: {model}</span>
          {ttsPulsing && <span className="text-accent">Active</span>}
          <button onClick={clearStorage} disabled={clearingStorage} className="ml-auto text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-30">
            {clearingStorage ? "Clearing..." : "Clear Storage"}
          </button>
        </div>
      </div>

      {/* Video player modal */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setVideoModal(null)}>
          <div className="relative bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl max-w-[90vw] max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
              <span className="text-sm text-zinc-300">{videoModal.filename}</span>
              <div className="flex gap-2">
                <a href={`/api/video/${videoModal.filename}`} download className="text-xs text-zinc-400 hover:text-accent transition-colors">Download</a>
                <button onClick={() => setVideoModal(null)} className="text-zinc-400 hover:text-white transition-colors ml-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <video
              ref={videoRef}
              src={`/api/video/${videoModal.filename}`}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
