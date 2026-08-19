"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/jobs", label: "Jobs", icon: "⚡" },
  { href: "/connect", label: "Connect", icon: "🔗" },
  { href: "/terminal", label: "Terminal", icon: "⌨️" },
  { href: "/docs", label: "Docs", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Dock() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <div className="shrink-0 bg-surface border-t border-border px-2 py-1 flex items-center justify-center">
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
          onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-accent hover:bg-surface-hover transition-colors ml-2 border border-transparent hover:border-accent/20"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="text-sm">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
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
  );
}
