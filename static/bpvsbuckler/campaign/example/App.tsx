import React, { useEffect, useState } from 'react';
import { Render } from '@measured/puck';
import { config } from './puck.config';
import { DB_EN, DB_ES, DB_CY } from './constants';
import { Database } from './types';

// Lightweight simple icons for a self-contained patch
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

type Lang = 'cy' | 'en' | 'es';

export default function App() {
  // Local navigation and data
  const [path, setPath] = useState<string>('/');
  const [lang, setLang] = useState<Lang>('en');
  const [db, setDb] = useState<Database>(DB_EN);
  const [cmsClick, setCmsClick] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // ES content wiring
  useEffect(() => {
    if (lang === 'es') setDb(DB_ES);
    else if (lang === 'cy') setDb(DB_CY);
    else setDb(DB_EN);
  }, [lang]);

  const data = db[path] ?? { content: [], root: { props: { title: '404' } } };

  // Simple multi-level menu (static scaffold)
  const ghf2Label =
    lang === 'en' ? 'Great House Farm II' : lang === 'es' ? 'Gran Casa Farm II' : 'Fferm Ty Mawr II';

  const goCms = () => {
    setPath('/cms');
    setCmsClick(true);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top bar with language switch and CMS access */}
      <div
        className="bg-[#009A49] text-white p-2 flex justify-between items-center"
        style={{ zIndex: 50 }}
      >
        <div>Truth • Justice • Change</div>
        <div className="flex items-center space-x-2">
          <button onClick={goCms} className="px-2 py-1 bg-black/25 rounded">
            CMS
          </button>
          <button onClick={() => setLang('en')} className="px-2 py-1 bg-black/25 rounded">
            EN
          </button>
          <button onClick={() => setLang('cy')} className="px-2 py-1 bg-black/25 rounded">
            CY
          </button>
          <button onClick={() => setLang('es')} className="px-2 py-1 bg-black/25 rounded">
            ES
          </button>
        </div>
      </div>

      {/* Header with menu per requested structure (simplified) */}
      <header className="bg-black text-white border-b border-[#009A49]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">
              {lang === 'en'
                ? 'Great House Farm'
                : lang === 'es'
                ? 'Gran Casa Farm'
                : 'Fferm Ty Mawr'}
            </span>
            {/* Welsh flag after branding */}
            <span className="ml-2">
              <WelshFlagIcon />
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-6">
            <button
              className="uppercase font-bold"
              onClick={() => setPath('/')}
            >
              {lang === 'es' ? 'Inicio' : 'Home'}
            </button>
            <button
              className="uppercase font-bold"
              onClick={() => setPath('/about')}
            >
              {lang === 'es' ? 'Acerca de' : 'About'}
            </button>
            <button
              className="uppercase font-bold"
              onClick={() => setPath('/ghf-2-0')}
            >
              {ghf2Label}
            </button>
            <button
              className="uppercase font-bold"
              onClick={() => setPath('/act')}
            >
              {lang === 'es' ? 'Tomar Acción' : 'Take Action'}
            </button>
            <button
              className="uppercase font-bold"
              onClick={() => setPath('/shop')}
            >
              Shop
            </button>
            <button
              className="uppercase font-bold"
              onClick={goCms}
              style={{ cursor: 'pointer' }}
            >
              CMS
            </button>
          </nav>

          <button className="xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            Menu
          </button>
        </div>

        {mobileOpen && (
          <div className="bg-black border-t border-[#009A49] p-4 xl:hidden">
            <div className="space-y-2">
              <button
                className="font-bold block text-left"
                onClick={() => setPath('/')}
              >
                {lang === 'es' ? 'Inicio' : 'Home'}
              </button>
              <button
                className="font-bold block text-left"
                onClick={() => setPath('/about')}
              >
                {lang === 'es' ? 'Acerca de' : 'About'}
              </button>
              <button
                className="font-bold block text-left"
                onClick={() => setPath('/ghf-2-0')}
              >
                {lang === 'es' ? 'Gran Casa Farm II' : ghf2Label}
              </button>
              <button
                className="font-bold block text-left"
                onClick={() => setPath('/act')}
              >
                {lang === 'es' ? 'Tomar Acción' : 'Take Action'}
              </button>
              <button
                className="font-bold block text-left"
                onClick={() => setPath('/shop')}
              >
                Shop
              </button>
              <button
                className="font-bold block text-left"
                onClick={goCms}
              >
                CMS
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="p-6">
        <Render config={config} data={data} />
      </main>

      {/* Footer with social icons (restored baseline) */}
      <footer className="bg-black text-white py-8 px-6 border-t border-[#009A49]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span>Great House Farm</span>
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
