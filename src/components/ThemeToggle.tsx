import { useState, useEffect } from 'react';

const THEMES = {
  light: { bg: '#ffffff', text: '#000000', accent: '#e8b84e' },
  dark: { bg: '#1a1a2e', text: '#d0c8b8', accent: '#e8b84e' },
  blue: { bg: '#0a1628', text: '#c8d8e8', accent: '#4a90d9' },
  green: { bg: '#0a1a0a', text: '#c8e8c8', accent: '#4ad94a' },
  purple: { bg: '#1a0a1a', text: '#e8c8e8', accent: '#d94ad9' }
};

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('color-theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const t = THEMES[theme] || THEMES.dark;
    document.documentElement.style.backgroundColor = t.bg;
    document.documentElement.style.color = t.text;
    document.documentElement.style.setProperty('--accent', t.accent);
    localStorage.setItem('color-theme', theme);
  }, [theme]);

  return (
    <div className="theme-toggle-group" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', gap: '4px' }}>
      {Object.keys(THEMES).map(t => (
        <button key={t} onClick={() => setTheme(t)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', border: theme === t ? '2px solid #e8b84e' : '2px solid transparent',
            background: THEMES[t].bg, color: THEMES[t].text, cursor: 'pointer', fontSize: '10px'
          }}
          title={t}>{t[0].toUpperCase()}</button>
      ))}
    </div>
  );
}
