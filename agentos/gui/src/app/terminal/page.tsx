"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const KEYS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
  ["123", ",", "Space", ".", "Enter"],
];

const KEYS_SHIFT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", "Backspace"],
  ["123", ",", "Space", ".", "Enter"],
];

const KEYS_SYM = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
  ["Shift", ".", ",", "?", "!", "'", "`", "~", "Backspace"],
  ["ABC", "_", "Space", "|", "Enter"],
];

const WS_URL = process.env.NEXT_PUBLIC_TERM_WS || "ws://localhost:3001";

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [shift, setShift] = useState(false);
  const [sym, setSym] = useState(false);

  const sendInput = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: "#0a0a0a",
        foreground: "#c0c0c0",
        cursor: "#c0c0c0",
        selectionBackground: "#ffffff33",
        black: "#000000",
        red: "#e34e4e",
        green: "#4e9a06",
        yellow: "#c4a000",
        blue: "#3465a4",
        magenta: "#75507b",
        cyan: "#06989a",
        white: "#d3d7cf",
        brightBlack: "#555753",
        brightRed: "#ef2929",
        brightGreen: "#8ae234",
        brightYellow: "#fce94f",
        brightBlue: "#729fcf",
        brightMagenta: "#ad7fa8",
        brightCyan: "#34e2e2",
        brightWhite: "#eeeeee",
      },
      allowProposedApi: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    fitRef.current = fit;

    if (termRef.current) {
      term.open(termRef.current);
    }

    term.onData((data) => sendInput(data));

    term.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.key === "k") {
        setShowKeyboard((prev) => !prev);
        setTimeout(() => fit.fit(), 100);
        return false;
      }
      return true;
    });

    term.focus();
    terminalRef.current = term;

    const connect = () => {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setConnected(true);
        term.clear();
        fit.fit();
        const dims = fit.proposeDimensions();
        if (dims) {
          sendResize(dims.cols, dims.rows);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "output") {
            term.write(msg.data);
          } else if (msg.type === "exit") {
            term.write(`\r\n\x1b[31m[process exited with code ${msg.code}]\x1b[0m\r\n`);
            setConnected(false);
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
      wsRef.current = ws;
    };

    connect();

    const resizeHandler = () => {
      fit.fit();
      const dims = fit.proposeDimensions();
      if (dims) {
        sendResize(dims.cols, dims.rows);
      }
    };

    window.addEventListener("resize", resizeHandler);
    const iv = setInterval(() => fit.fit(), 500);

    return () => {
      clearInterval(iv);
      window.removeEventListener("resize", resizeHandler);
      term.dispose();
      wsRef.current?.close();
    };
  }, [sendInput, sendResize]);

  const keyPress = (key: string) => {
    if (key === "Enter") {
      sendInput("\r");
    } else if (key === "Shift") {
      setShift((s) => !s);
    } else if (key === "123" || key === "ABC") {
      setSym((s) => !s);
      setShift(false);
    } else if (key === "Backspace") {
      sendInput("\x7f");
    } else if (key === "Space") {
      sendInput(" ");
    } else if (key === "Tab") {
      sendInput("\t");
    } else {
      sendInput(key);
      setShift(false);
    }
    terminalRef.current?.focus();
  };

  const currentKeys = sym ? KEYS_SYM : shift ? KEYS_SHIFT : KEYS;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black">
      <header className="border-b border-zinc-800 px-4 py-2 flex items-center gap-3 shrink-0 bg-zinc-950">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm font-mono text-emerald-400">Terminal</span>
        <span className={`text-xs font-mono ${connected ? "text-emerald-500" : "text-red-400"}`}>
          {connected ? "\u25CF connected" : "\u25CF disconnected"}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => {
            setShowKeyboard((prev) => !prev);
            setTimeout(() => fitRef.current?.fit(), 100);
          }}
          className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="Toggle keyboard (Ctrl+K)"
        >
          {showKeyboard ? "Hide KB" : "Show KB"}
        </button>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <div ref={termRef} className="flex-1 min-h-0" />
      </div>

      {showKeyboard && (
        <div className="shrink-0 bg-zinc-950 border-t border-zinc-800 select-none px-1 py-1">
          {currentKeys.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-0.5 mb-0.5 last:mb-0">
              {row.map((key) => {
                let cls = "flex items-center justify-center rounded text-sm font-mono transition-colors active:scale-95 select-none font-medium ";
                let style: React.CSSProperties = { height: "44px", minWidth: 0, flex: "1 1 0" };

                if (key === "Space") {
                  cls += "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ";
                  style.flex = "6 1 0";
                } else if (key === "Enter") {
                  cls += "bg-emerald-700/30 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-700/40 ";
                  style.flex = "1.5 1 0";
                } else if (key === "Backspace") {
                  cls += "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ";
                  style.flex = "1.5 1 0";
                } else if (key === "Shift" || key === "123" || key === "ABC") {
                  cls += (shift || sym) ? "bg-zinc-600 text-white " : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ";
                  style.flex = "1.3 1 0";
                } else {
                  cls += "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 ";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onTouchStart={(e) => { e.preventDefault(); keyPress(key); }}
                    onClick={() => keyPress(key)}
                    className={cls}
                    style={style}
                  >
                    {key === "Space" ? "" : key === "Backspace" ? "⌫" : key === "Enter" ? "↵" : key === "Shift" ? "⇧" : key === "123" ? "?123" : key === "ABC" ? "ABC" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
