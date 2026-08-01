"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/terminal", label: "Terminal", icon: "⌨️" },
  { href: "/docs", label: "Docs", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Dock() {
  const pathname = usePathname();

  return (
    <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-2 py-1 flex items-center justify-center">
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
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {pathname === "/chat" && (
          <button
            onClick={() => {
              if (confirm("Reset chat? All messages will be lost.")) {
                localStorage.removeItem("agentos-chat-messages");
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors ml-2 border border-transparent hover:border-red-900/30"
          >
            <span className="text-sm">🗑</span>
            <span>Reset Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}
