"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

const CHAT_CACHE_KEY = "agentos-chat-messages";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const duplexRef = useRef(false);
  const speakingRef = useRef(false);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const depSpinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pipelineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const JarvisPulseRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { duplexRef.current = duplexActive; }, [duplexActive]);

  useEffect(() => { saveMessages(messages); }, [messages]);

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
  const speakText = useCallback(async (text: string) => {
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
        audio.onended = () => { speakingRef.current = false; setTtsPulsing(false); resolve(); };
        audio.onerror = () => { speakNative(text); speakingRef.current = false; setTtsPulsing(false); resolve(); };
        audio.play().catch(() => { speakNative(text); speakingRef.current = false; setTtsPulsing(false); resolve(); });
      });
    } catch {
      speakNative(text);
      speakingRef.current = false;
      setTtsPulsing(false);
    }
  }, []);

  const speakNative = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Voice input ───────────────────────────────────────
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

  const startDuplex = useCallback(async () => {
    if (duplexRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      duplexRef.current = true;
      setDuplexActive(true);
      const loop = async () => {
        while (duplexRef.current) {
          await new Promise<void>((resolve) => {
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            const chunks: Blob[] = [];
            recorderRef.current = recorder;
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: "audio/webm" });
              processVoiceInput(blob).then(() => resolve());
            };
            recorder.start();
            setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 3000);
          });
        }
      };
      loop();
    } catch { setDuplexActive(false); duplexRef.current = false; }
  }, []);

  const stopDuplex = useCallback(() => {
    duplexRef.current = false;
    setDuplexActive(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
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
        body: JSON.stringify({ messages: chatHistory, model }),
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

      {/* ─── Header (simplified: back arrow + breadcrumb) ─── */}
      <header className="border-b border-border px-4 py-2 flex items-center gap-3 shrink-0 sticky top-0 z-20 bg-surface/80 backdrop-blur-md shadow-lg shadow-black/20">
        {/* Back arrow */}
        <Link href="/" className="text-text-muted hover:text-text-primary transition-colors p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Pipeline breadcrumbs */}
        <div className="flex items-center gap-0 text-[10px] font-mono overflow-x-auto">
          {breadcrumbData.map((seg, i) => {
            const colors = STATUS_COLORS[seg.status];
            return (
              <span key={seg.id} className="flex items-center">
                {i > 0 && <span className="text-text-muted mx-0.5">&gt;</span>}
                <span
                  className="px-1 py-0.5 rounded transition-all duration-300 whitespace-nowrap"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    boxShadow: seg.status === "green" ? colors.glow : "none",
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

        {/* Separator */}
        <span className="text-text-muted mx-0.5">&gt;</span>

        {/* Fruit Machine Tool Selector */}
        <div
          className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-300 cursor-pointer select-none shrink-0"
          style={{
            borderColor: currentToolColors.border,
            backgroundColor: currentToolColors.bg,
            boxShadow: spinning ? `0 0 12px ${currentToolColors.border}, inset 0 0 8px ${currentToolColors.bg}` : currentToolColors.glow,
            minWidth: "100px",
          }}
          title={currentTool.desc}
          onClick={() => {
            if (!spinning) {
              const nextIndex = (ALL_TOOLS.findIndex((t) => t.id === activeRoute) + 1) % ALL_TOOLS.length;
              setActiveRoute(ALL_TOOLS[nextIndex].id);
            }
          }}
        >
          <div className="overflow-hidden h-5 relative" style={{ width: "70px" }}>
            <div
              className="absolute inset-0 flex flex-col items-center transition-transform"
              style={{
                transform: `translateY(-${spinIndex * 20}px)`,
                transition: spinning ? "transform 50ms ease-out" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {ALL_TOOLS.map((tool) => (
                <div key={tool.id} className="h-5 flex items-center justify-center text-xs font-bold whitespace-nowrap" style={{ color: currentToolColors.text }}>
                  <span className="mr-1">{tool.icon}</span>
                  <span>{tool.label}</span>
                </div>
              ))}
            </div>
          </div>
          {activeProvider && !spinning && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-700">{activeProvider}</span>
          )}
          {spinning && <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentToolColors.text }} />}
        </div>

        {/* Dependency roulette */}
        {!depSpinning && activeDependency && activeRoute !== "idle" && (
          <>
            <span className="text-text-muted mx-0.5">&rarr;</span>
            <div className="relative flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0" style={{ borderColor: STATUS_COLORS.green.border, backgroundColor: STATUS_COLORS.green.bg, minWidth: "80px" }}>
              <div className="overflow-hidden h-5 relative" style={{ width: "60px" }}>
                <div className="absolute inset-0 flex flex-col items-center transition-transform" style={{ transform: `translateY(-${depSpinIndex * 20}px)`, transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                  {(DEPENDENCY_MAP[activeRoute] || DEPENDENCY_MAP.idle).map((dep) => (
                    <div key={dep.id} className="h-5 flex items-center justify-center text-xs font-bold whitespace-nowrap" style={{ color: STATUS_COLORS.green.text }}>
                      <span className="mr-1">{dep.icon}</span><span>{dep.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        {depSpinning && (
          <>
            <span className="text-text-muted mx-0.5">&rarr;</span>
            <div className="relative flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0" style={{ borderColor: STATUS_COLORS.amber.border, backgroundColor: STATUS_COLORS.amber.bg, minWidth: "80px" }}>
              <div className="overflow-hidden h-5 relative" style={{ width: "60px" }}>
                <div className="absolute inset-0 flex flex-col items-center" style={{ transform: `translateY(-${depSpinIndex * 20}px)`, transition: "transform 40ms ease-out" }}>
                  {(DEPENDENCY_MAP[activeRoute] || DEPENDENCY_MAP.idle).map((dep) => (
                    <div key={dep.id} className="h-5 flex items-center justify-center text-xs font-bold whitespace-nowrap" style={{ color: STATUS_COLORS.amber.text }}>
                      <span className="mr-1">{dep.icon}</span><span>{dep.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: STATUS_COLORS.amber.text }} />
            </div>
          </>
        )}
      </header>

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
              <div className="whitespace-pre-wrap">{msg.content || (streaming && i === messages.length - 1 ? <span className="text-text-muted animate-pulse">thinking...</span> : "")}</div>

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

      {/* ─── Input Bar ─── */}
      <div className="border-t border-border px-6 py-4 shrink-0 relative z-10 bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Voice mode button */}
          <button
            onClick={() => duplexActive ? stopDuplex() : startDuplex()}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              duplexActive ? "bg-green-500/20 border border-green-500/40 text-green-400 animate-pulse" : "bg-surface border border-border text-text-muted hover:text-text-primary"
            }`}
            title={duplexActive ? "Stop voice mode" : "Start voice mode"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          {/* Mic button (push-to-talk) */}
          <button
            onClick={toggleRecording}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              recording ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" : "bg-surface border border-border text-text-muted hover:text-text-primary"
            }`}
            title={recording ? "Stop recording" : "Push to talk"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={recording ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill={recording ? "currentColor" : "none"} />
            </svg>
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={proxyLocked ? "Session locked by parent proxy..." : recording ? "Listening..." : duplexActive ? "Voice mode active..." : "Type a message..."}
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            disabled={streaming || recording || proxyLocked}
          />

          {/* Send button */}
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming || proxyLocked}
            className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
          <span>{proxyLocked ? "Locked (parent proxy)" : recording ? "Recording..." : duplexActive ? "Voice mode active" : "Ready"}</span>
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
