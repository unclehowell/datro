import React, { useEffect, useState } from 'react';
import { Render, Puck } from '@measured/puck';
import { config } from './puck.config';
import { DB_EN, DB_ES, DB_CY } from './constants';
import { Database } from './types';

// Inline icons to keep it self-contained
const WelshFlagIcon = () => (
  <span
    aria-label="Welsh flag"
    style={{ display: 'inline-block', width: 16, height: 12, background: '#012169', marginLeft: 6 }}
  />
);

const ArgFlagIcon = () => (
  <span
    aria-label="Argentina flag"
    style={{ display: 'inline-block', width: 16, height: 12, background: '#74C2FF', marginLeft: 6 }}
  />
);

const WelshDragon = () => (
  <span aria-label="Welsh dragon" style={{ marginRight: 6 }}>
    🐉
  </span>
);

type Lang = 'cy' | 'en' | 'es';

export default function App() {
  // Core state
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Stage 3: nested menu (mobile)
  const [writingsOpen, setWritingsOpen] = useState<boolean>(false);
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);

  // Data maps
  const [database, setDatabase] = useState<Database>(DB_EN);

  // Stage 5 ES content wiring
  useEffect(() => {
    if (lang === 'es') setDatabase(DB_ES);
    else if (lang === 'cy') setDatabase(DB_CY);
    else setDatabase(DB_EN);
  }, [lang]);

  const data = database[currentPath] || { content: [], root: { props: { title: '404' } } };

  // Helpers
  const handleNavClick = (path: string) => {
    setCurrentPath(path);
    setMobileMenuOpen(false);
  };

  // Language switcher text (Stage 4)
  const langLabel = (code: Lang) => {
    if (lang === 'es') {
      if (code === 'en') return 'Inglés';
      if (code === 'cy') return 'Gales';
      if (code === 'es') return 'Español';
    }
    switch (code) {
      case 'en':
        return 'English';
      case 'cy':
        return 'Cymraeg';
      default:
        return 'Español';
    }
  };

  // Render
  return (
    <div className="min-h-screen font-sans bg-stone-900 text-white">
      {/* Top Bar: CMS link + language dropdown */}
      <div className="bg-[#009A49] text-white text-xs py-2 px-4 flex justify-between items-center tracking-widest uppercase font-bold relative z-50">
        <span>{lang === 'en' ? 'Truth • Justice • Change' : lang === 'es' ? 'Verdad • Justicia • Cambio' : 'Gwirionedd • Cyfiawnder • Newid'}</span>
        <div className="flex items-center gap-2 relative z-50">
          <button onClick={() => handleNavClick('/cms')} className="bg-black/25 px-2 py-1 rounded">
            CMS
          </button>
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="px-2 py-1 rounded bg-black/25 inline-flex items-center gap-1"
            >
              {lang === 'cy' ? <WelshFlagIcon /> : lang === 'en' ? <span>🇬🇧</span> : <span>🇪🇸</span>}
              <span className="uppercase">{langLabel(lang)}</span>
              <span style={{ marginLeft: 4 }}>▼</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-black border border-[#009A49] shadow-2xl z-50">
                {(['en', 'cy', 'es'] as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#009A49]"
                  >
                    {code === 'en' && <span>🇬🇧</span>}
                    {code === 'cy' && <span>🏴</span>}
                    {code === 'es' && <span>🇪🇸</span>}
                    <span className="ml-2">{langLabel(code)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header with nested menu (Stage 3) */}
      <header className="sticky top-0 z-40 w-full bg-black border-b border-[#009A49] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Branding */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavClick('/')}>
              <WelshDragon />
              <span className="text-2xl font-black text-white">
                {lang === 'en' ? 'Great House Farm' : lang === 'es' ? 'Gran Casa Farm' : 'Fferm Ty Mawr'}
              </span>
              <span aria-label="Welsh Flag" style={{ display: 'inline-flex', marginLeft: 6 }}>
                <WelshFlagIcon />
              </span>
            </div>

            {/* Desktop nested menu */}
            <nav className="hidden xl:flex items-center gap-4 relative z-30">
              <button
                onClick={() => handleNavClick('/')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-[#009A49]"
              >
                {lang === 'es' ? 'Inicio' : 'Home'}
              </button>
              <button
                onClick={() => handleNavClick('/about')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                {lang === 'es' ? 'Acerca de' : 'About'}
              </button>
              <button
                onClick={() => handleNavClick('/story')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                {lang === 'es' ? 'Nuestra Historia' : 'Our Story'}
              </button>
              <div className="relative group">
                <button className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]">
                  {lang === 'es' ? 'Escritos' : 'Writings'}
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-black border border-[#009A49] shadow-2xl opacity-0 hidden group-hover:opacity-100 group-hover:block transition-opacity duration-200 z-40 pointer-events-auto">
                  <div className="py-2 px-2">
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/writings/newsletter')}
                    >
                      {lang === 'es' ? 'Boletín' : 'Newsletter'}
                    </button>
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/writings/sion')}
                    >
                      {lang === 'es' ? 'La Historia de Sion' : lang === 'cy' ? 'Stori Sion' : 'Sion\'s Story'}
                    </button>
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/writings/david')}
                    >
                      {lang === 'es' ? 'La Historia de David' : lang === 'cy' ? 'Stori David' : 'David\'s Story'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]">
                  {lang === 'es' ? 'Galería' : 'Gallery'}
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-black border border-[#009A49] shadow-2xl opacity-0 hidden group-hover:opacity-100 group-hover:block transition-opacity duration-200 z-40 pointer-events-auto">
                  <div className="py-2 px-2">
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/gallery')}
                    >
                      {lang === 'es' ? 'Resumen' : lang === 'cy' ? 'Trosolwg' : 'Overview'}
                    </button>
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/gallery/historical')}
                    >
                      {lang === 'es' ? 'Histórico' : lang === 'cy' ? 'Hanesyddol' : 'Historical'}
                    </button>
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/gallery/excavations')}
                    >
                      {lang === 'es' ? 'Excavaciones' : lang === 'cy' ? 'Cloddfeydd' : 'Excavations'}
                    </button>
                    <button
                      className="block w-full text-left px-2 py-2 text-sm uppercase tracking-widest hover:bg-[#009A49]"
                      onClick={() => handleNavClick('/gallery/family')}
                    >
                      {lang === 'es' ? 'Familia' : lang === 'cy' ? 'Teulu' : 'Family'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleNavClick('/ghf-2-0')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                {lang === 'es' ? 'Gran Casa Farm II' : 'Great House Farm II'}
              </button>
              <button
                onClick={() => handleNavClick('/act')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                {lang === 'es' ? 'Tomar Acción' : 'Take Action'}
              </button>
              <button
                onClick={() => handleNavClick('/shop')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                {lang === 'es' ? 'Tienda' : 'Shop'}
              </button>
              <button
                onClick={() => handleNavClick('/cms')}
                className="font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#009A49]"
              >
                CMS
              </button>
            </nav>

            {/* Mobile menu toggle */}
            <button className="xl:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {lang === 'es' ? 'Menú' : lang === 'cy' ? 'Dewislen' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation (Stage 3) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-black border-b border-[#009A49]">
          <div className="p-4 space-y-3">
            <button
              onClick={() => handleNavClick('/')}
              className="block w-full text-left uppercase tracking-widest py-2"
            >
              {lang === 'es' ? 'Inicio' : 'Home'}
            </button>
            <button
              onClick={() => handleNavClick('/about')}
              className="block w-full text-left uppercase tracking-widest py-2"
            >
              {lang === 'es' ? 'Acerca de' : 'About'}
            </button>
            <button
              onClick={() => handleNavClick('/story')}
              className="block w-full text-left uppercase tracking-widest py-2"
            >
              {lang === 'es' ? 'Nuestra Historia' : lang === 'cy' ? 'Ein Hanes' : 'Our Story'}
            </button>

            <details className="block w-full" open={writingsOpen} onToggle={() => setWritingsOpen(!writingsOpen)}>
              <summary className="text-left uppercase tracking-widest py-2">
                {lang === 'es' ? 'Escritos' : 'Writings'}
              </summary>
              <div className="pl-4">
                <button
                  onClick={() => handleNavClick('/writings/newsletter')}
                  className="block w-full text-left py-2"
                >
                  {lang === 'es' ? 'Boletín' : 'Newsletter'}
                </button>
                <button onClick={() => handleNavClick('/writings/sion')} className="block w-full text-left py-2">
                  {lang === 'es' ? 'La Historia de Sion' : lang === 'cy' ? 'Stori Sion' : 'Sion\'s Story'}
                </button>
                <button onClick={() => handleNavClick('/writings/david')} className="block w-full text-left py-2">
                  {lang === 'es' ? 'La Historia de David' : lang === 'cy' ? 'Stori David' : 'David\'s Story'}
                </button>
              </div>
            </details>

            <details className="block w-full" open={galleryOpen} onToggle={() => setGalleryOpen(!galleryOpen)}>
              <summary className="text-left uppercase tracking-widest py-2">
                {lang === 'es' ? 'Galería' : 'Gallery'}
              </summary>
              <div className="pl-4">
                <button onClick={() => handleNavClick('/gallery')} className="block w-full text-left py-2">
                  {lang === 'es' ? 'Resumen' : lang === 'cy' ? 'Trosolwg' : 'Overview'}
                </button>
                <button
                  onClick={() => handleNavClick('/gallery/historical')}
                  className="block w-full text-left py-2"
                >
                  {lang === 'es' ? 'Histórico' : lang === 'cy' ? 'Hanesyddol' : 'Historical'}
                </button>
                <button
                  onClick={() => handleNavClick('/gallery/excavations')}
                  className="block w-full text-left py-2"
                >
                  {lang === 'es' ? 'Excavaciones' : lang === 'cy' ? 'Cloddfeydd' : 'Excavations'}
                </button>
                <button onClick={() => handleNavClick('/gallery/family')} className="block w-full text-left py-2">
                  {lang === 'es' ? 'Familia' : lang === 'cy' ? 'Teulu' : 'Family'}
                </button>
              </div>
            </details>

            <button
              onClick={() => handleNavClick('/ghf-2-0')}
              className="block w-full text-left uppercase tracking-widest py-2"
            >
              {lang === 'es' ? 'Gran Casa Farm II' : 'Great House Farm II'}
            </button>
            <button
              onClick={() => handleNavClick('/cms')}
              className="block w-full text-left uppercase tracking-widest py-2"
            >
              CMS
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {currentPath === '/cms' ? (
          <Puck config={config} data={data} onPublish={async (publishData) => {
            console.log("Published data:", publishData);
            // In a real application, you would save this data
            // For example, by sending it to a backend API or updating constants.ts
          }} />
        ) : (
          <Render config={config} data={data} />
        )}
      </main>

      {/* Footer with social icons (restored baseline) */}
      <footer className="bg-black text-white py-8 px-6 border-t border-[#009A49]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
                        <span>{lang === 'es' ? 'Gran Casa Farm' : lang === 'cy' ? 'Fferm Ty Mawr' : 'Great House Farm'}</span>
            <span style={{ fontSize: 20 }} aria-label="footer-socials">
              🐦
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="GitHub">
              GitHub
            </a>
            <a href="#" aria-label="Facebook">
              Facebook
            </a>
            <a href="#" aria-label="Twitter">
              Twitter
            </a>
            <a href="#" aria-label="Instagram">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
