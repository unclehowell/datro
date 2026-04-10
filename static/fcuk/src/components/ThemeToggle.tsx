import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  onToggle?: () => void;
}

export default function ThemeToggle({ onToggle }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check system preference or stored preference
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    if (onToggle) {
      onToggle();
      setIsDark(!isDark);
    } else {
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDark(false);
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDark(true);
      }
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full border border-border hover:bg-paper transition-colors text-ink"
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
