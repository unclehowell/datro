import { useState } from 'react';
import { Globe } from 'lucide-react';

export type Language = 'en' | 'cy' | 'gd';

interface LanguageSelectorProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

const languages = {
  en: 'English',
  cy: 'Cymraeg',
  gd: 'Gàidhlig'
};

export default function LanguageSelector({ currentLang, onLangChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-full hover:bg-paper transition-colors text-xs font-medium"
      >
        <Globe size={14} />
        {languages[currentLang]}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              onClick={() => {
                onLangChange(code as Language);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-paper transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
