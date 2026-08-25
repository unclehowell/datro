"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  "dark", "light",
  "obsidian", "obsidian-light",
  "slate", "slate-light",
  "carbon", "carbon-light",
  "midnight", "midnight-light",
  "forest", "forest-light",
  "rose", "rose-light",
  "amber", "amber-light",
  "ocean", "ocean-light",
  "monochrome", "monochrome-light",
  "sunset", "sunset-light",
  "aurora", "aurora-light",
  "neon", "neon-light",
  "lava", "lava-light",
  "arctic", "arctic-light",
  "violet", "violet-light",
  "solarized", "solarized-light",
  "matrix", "matrix-light",
    "obsidian", "obsidian-light",
    "slate", "slate-light",
    "carbon", "carbon-light",
    "midnight", "midnight-light",
    "forest", "forest-light",
    "rose", "rose-light",
    "amber", "amber-light",
    "ocean", "ocean-light",
    "monochrome", "monochrome-light",
] as const;

export type Theme = typeof THEMES[number];

const ThemeContext = createContext<{
  theme: Theme;
  cycle: () => void;
  toggle: () => void;
}>({ theme: "dark", cycle: () => {}, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("agentos-theme");
    const initial = (stored && THEMES.includes(stored as Theme)) ? (stored as Theme) : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("agentos-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const toggle = () => {
    const next = theme.endsWith("-light") ? theme.replace("-light", "") : `${theme}-light` as Theme;
    applyTheme(next);
  };

  const cycle = () => {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, cycle, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
