"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [recording, setRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [duplexActive, setDuplexActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const duplexRef = useRef(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    duplexRef.current = duplexActive;
  }, [duplexActive]);

  const speakText = async (text: string) => {
    speakingRef.current = true;
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
        audio.onended = () => { speakingRef.current = false; resolve(); };
        audio.onerror = () => { speakNative(text); speakingRef.current = false; resolve(); };
        audio.play().catch(() => { speakNative(text); speakingRef.current = false; resolve(); });
      });
    } catch {
      speakNative(text);
      speakingRef.current = false;
    }
  };

  const speakNative = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size < 500) return;
    try {
      const sttForm = new FormData();
      sttForm.append("audio", audioBlob, "audio.webm");
      const sttRes = await fetch("/api/voice?action=stt", { method: "POST", body: sttForm });
      if (!sttRes.ok) throw new Error("STT failed");
      const { text } = await sttRes.json();
      if (text && text.trim()) {
        await send(text.trim());
      }
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
        if (!duplexRef.current) return;
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

            const silenceTimer = setTimeout(() => {
              if (recorder.state === "recording") recorder.stop();
            }, 3000);

            const checkVolume = () => {
              if (!duplexRef.current || recorder.state !== "recording") return;
              clearTimeout(silenceTimer);
              silenceTimer_2 = setTimeout(() => {
                if (recorder.state === "recording") recorder.stop();
              }, 3000);
            };

            let silenceTimer_2 = silenceTimer;
          });
        }
      };
      loop();
    } catch (err) {
      setDuplexActive(false);
      duplexRef.current = false;
    }
  }, []);

  const stopDuplex = useCallback(() => {
    duplexRef.current = false;
    setDuplexActive(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

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
    } catch {
      setRecording(false);
    }
  }, [recording, streaming, model]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput("");
    setStreaming(true);

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

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");
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
      }

      if (accumulated && autoSpeak) {
        await speakText(accumulated);
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
          <span className="text-text-muted">/</span>
          <h1 className="text-sm font-medium">Chat</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
            <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="accent-accent" />
            Auto-speak
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-text-secondary"
          >
            <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
            <option value="llama-3.1-8b-instant">Groq Llama 3.1 8B</option>
            <option value="mixtral-8x7b-32768">Groq Mixtral 8x7B</option>
            <option value="gemma2-9b-it">Groq Gemma2 9B</option>
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl">A</div>
            <div className="text-center">
              <div className="text-sm text-text-primary mb-1">How can I help you?</div>
              <div className="text-xs text-text-muted">Type, click mic, or enable voice mode for full duplex</div>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`animate-slide-up flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-black"
                  : "bg-surface border border-border text-text-primary"
              }`}
            >
              {msg.role === "assistant" && <div className="text-xs text-accent mb-1 font-medium">Hermes</div>}
              <div className="whitespace-pre-wrap">{msg.content || (streaming && i === messages.length - 1 ? <span className="text-text-muted animate-pulse">thinking...</span> : "")}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 shrink-0">
        <div className="flex gap-2 items-center mb-2">
          <button
            type="button"
            onClick={() => duplexActive ? stopDuplex() : startDuplex()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              duplexActive
                ? "bg-accent text-black animate-pulse"
                : "bg-surface border border-border text-text-secondary hover:border-accent/50"
            }`}
            title={duplexActive ? "Stop voice mode" : "Start full duplex voice"}
          >
            {duplexActive ? "Stop Voice Mode" : "Voice Mode"}
          </button>
          {duplexActive && (
            <span className="text-xs text-accent animate-pulse">Listening continuously...</span>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2 items-end"
        >
          <button
            type="button"
            onClick={toggleRecording}
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              recording
                ? "bg-error text-white animate-pulse"
                : "bg-surface border border-border text-text-secondary hover:border-accent/50"
            }`}
            title={recording ? "Stop recording" : "Push to talk"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={recording ? "Listening..." : duplexActive ? "Voice mode active" : "Ask Hermes anything..."}
            disabled={streaming}
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-6 py-3 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? "..." : "Send"}
          </button>
        </form>
        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
          <span>{recording ? "Recording..." : duplexActive ? "Voice mode ON" : "Ready"}</span>
          <span>&middot;</span>
          <span>Auto-speak: {autoSpeak ? "on" : "off"}</span>
          <span>&middot;</span>
          <span>Model: {model}</span>
        </div>
      </div>
    </div>
  );
}
