import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="theme-toggle"
      aria-label="Toggle theme"
      style={{
        position: 'fixed', top: '1rem', right: '1rem',
        background: dark ? '#e8b84e' : '#333',
        color: dark ? '#000' : '#fff',
        border: 'none', borderRadius: '50%',
        width: '40px', height: '40px', cursor: 'pointer',
        fontSize: '1.2rem', zIndex: 9999
      }}
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
