"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";

const ITEMS = [
  { href: "/", label: "Home", icon: "◉" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/logs", label: "Logs", icon: "📋" },
  { href: "/jobs", label: "Jobs", icon: "⚡" },
  { href: "/connect", label: "Connect", icon: "🔗" },
  { href: "/terminal", label: "Terminal", icon: "⌨️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Dock() {
  const pathname = usePathname();
  const { theme, cycle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shrink-0 bg-surface border-t border-border">
      {/* Mobile: scrollable icon bar */}
      <div className="md:hidden flex items-center justify-around px-1 py-2 overflow-x-auto">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] px-2 py-1 rounded-lg transition-colors ${
                active
                  ? "text-accent"
                  : "text-text-muted active:text-text-primary"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] mt-1 leading-none">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={cycle}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] px-2 py-1 rounded-lg text-text-muted active:text-accent transition-colors"
          title={`Theme: ${theme}`}
        >
          <span className="text-xl leading-none">🎨</span>
          <span className="text-[10px] mt-1 leading-none">Theme</span>
        </button>
      </div>

      {/* Desktop: horizontal label bar */}
      <div className="hidden md:flex items-center justify-center px-2 py-1">
        <div className="flex items-center gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  active
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={cycle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-accent hover:bg-surface-hover transition-colors ml-2 border border-transparent hover:border-accent/20"
            title={`Theme: ${theme} (click for next)`}
          >
            <span className="text-sm">🎨</span>
            <span>{theme}</span>
          </button>

          {pathname === "/chat" && (
            <button
              onClick={() => {
                if (confirm("Reset chat? All messages will be lost.")) {
                  localStorage.removeItem("agentos-chat-messages");
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/20"
            >
              <span className="text-sm">🗑</span>
              <span>Reset Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
