import React, { useState, useEffect } from 'react';
import { Puck, Render } from '@measured/puck';
import { config } from './puck.config';
import { DB_CY, DB_EN } from './constants';
import { PageData, Database } from './types';

// Icons
const FacebookIcon = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const TwitterIcon = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
);
const GithubIcon = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);

const WelshDragon = () => (
    <svg viewBox="0 0 512 512" className="w-12 h-12 text-[#d30731]" fill="currentColor">
         {/* Simplified Dragon Shape */}
         <path d="M428.1 192.3c-11.8-19.6-32.5-35-50.6-39.7-5.9-1.5-12.2-2.1-18.7-1.6-18.4 1.2-31.5 8.7-44.5 16.2-7.8 4.5-15.6 9-24.1 12.3-26.6 10.4-56.1 5.9-79.6-12.1-3.6-2.7-7-5.6-10.2-8.7-21.4-20.7-39.2-46.6-47.5-75.3-2.6-9-4.2-18.3-4.8-27.7-.2-2.5-.2-5-.2-7.5 0-25.2 7.7-49.8 22.3-70.6 2.6-3.7 5.4-7.3 8.3-10.7 2.1-2.4 4.3-4.7 6.6-7 .5-.5 1-1 1.5-1.5 2.5-2.5 5.2-4.9 7.9-7.2 1.3-1.1 2.7-2.2 4-3.3 11-9 23.3-16.7 36.6-22.9 5.4-2.5 10.9-4.8 16.5-6.8 5.6-2 11.3-3.8 17.1-5.3 11.6-3 23.4-4.8 35.4-5.4 3-.2 6-.2 9-.2 36.1.4 71.3 10.8 101.9 30.1 7.6 4.8 14.8 10.1 21.6 15.8 6.8 5.7 13.1 11.9 18.9 18.5 5.8 6.6 11 13.6 15.7 20.9 4.7 7.3 8.7 15 12 22.9 3.3 7.9 5.9 16.1 7.7 24.5 1.8 8.4 2.9 17 3.2 25.6.3 8.6-.2 17.2-1.4 25.8-1.2 8.6-3.1 17.1-5.8 25.4-2.7 8.3-6.1 16.4-10.1 24.3-4 7.9-8.7 15.5-14 22.8-5.3 7.3-11.2 14.3-17.6 20.9-6.4 6.6-13.3 12.8-20.7 18.6-3.7 2.9-7.5 5.6-11.4 8.2zm-123-11.2c-5.8-5.6-11.2-11.6-16.1-17.9-4.9-6.3-9.3-13-13.2-19.9-3.9-6.9-7.2-14.1-9.9-21.6-2.7-7.5-4.8-15.2-6.3-23-1.5-7.8-2.4-15.7-2.7-23.7-.3-8 .1-16.1 1.1-24.1 1-8 2.6-15.9 4.8-23.7 2.2-7.8 5-15.4 8.4-22.8 3.4-7.4 7.3-14.5 11.8-21.3 4.5-6.8 9.5-13.3 15-19.5 5.5-6.2 11.4-12 17.8-17.4 6.4-5.4 13.2-10.4 20.4-14.9 7.2-4.5 14.8-8.5 22.7-12 7.9-3.5 16.1-6.4 24.6-8.7 8.5-2.3 17.2-3.9 26.1-4.9 8.9-1 18-.1 26.9 1.4 8.9 1.5 17.6 3.7 26.1 6.5 8.5 2.8 16.8 6.2 24.7 10.2 7.9 4 15.5 8.6 22.7 13.7 7.2 5.1 14 10.7 20.3 16.8 6.3 6.1 12.1 12.7 17.3 19.8 5.2 7.1 9.8 14.6 13.7 22.5 3.9 7.9 7.1 16.1 9.6 24.6 2.5 8.5 4.3 17.3 5.3 26.2 1 8.9 1.3 18 .9 27.2-.4 9.2-1.6 18.3-3.5 27.4-1.9 9.1-4.5 18-7.9 26.7-3.4 8.7-7.5 17.1-12.2 25.3-4.7 8.2-10.1 16.1-16 23.6-5.9 7.5-12.4 14.6-19.5 21.2-7.1 6.6-14.7 12.8-22.8 18.4-8.1 5.6-16.7 10.7-25.7 15.1-9 4.4-18.4 8.1-28.1 11.1-9.7 3-19.7 5.2-29.9 6.6-10.2 1.4-20.6 1.9-31.1 1.6-10.5-.3-21.1-1.5-31.6-3.5-10.5-2-20.9-4.8-31.1-8.5z"/>
    </svg>
);

export default function App() {
  // Navigation State
  const [currentPath, setCurrentPath] = useState("/");
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'cy'|'en'>('cy'); // Default to Welsh
  
  // Database State (Mocking a backend)
  const [database, setDatabase] = useState<Database>(DB_CY);

  // Labels based on Language
  const labels = {
      home: lang === 'cy' ? 'Hafan' : 'Home',
      about: lang === 'cy' ? 'Amdanom Ni' : 'About Us',
      story: lang === 'cy' ? 'Ein Stori' : 'Our Story',
      writings: lang === 'cy' ? 'Ysgrifennu' : 'Writings',
      gallery: lang === 'cy' ? 'Oriel' : 'Gallery',
      issues: lang === 'cy' ? 'Materion' : 'Issues',
      timeline: lang === 'cy' ? 'Llinell Amser' : 'Timeline',
      evidence: lang === 'cy' ? 'Tystiolaeth' : 'Evidence',
      ghf2: lang === 'cy' ? 'Tŷ Mawr 2.0' : 'GHF 2.0',
      support: lang === 'cy' ? 'Cefnogi' : 'Support',
      latest: lang === 'cy' ? 'Diweddaraf' : 'Latest',
      shop: lang === 'cy' ? 'Siop' : 'Shop',
      admin: lang === 'cy' ? 'Ardal Weinyddol' : 'Admin Area',
      adminExit: lang === 'cy' ? 'Gadael' : 'Exit Admin',
      standWithUs: lang === 'cy' ? 'Sefwch Gyda Ni' : 'Stand With Us',
      standDesc: lang === 'cy' ? 'Mae\'r frwydr dros Fferm y Tŷ Mawr yn parhau. Mae arnom angen eich cymorth i ailadeiladu hanes.' : 'The fight for Great House Farm continues. We need your help to rebuild history.',
      btnSupport: lang === 'cy' ? 'Cefnogwch Ein Achos' : 'Support Our Cause',
      famHistory: lang === 'cy' ? 'Hanes Teulu' : 'Family History',
      marconi: lang === 'cy' ? 'Cysylltiad Marconi' : 'Marconi Connection',
      brand: lang === 'cy' ? 'Canllawiau Brand' : 'Brand Guidelines',
      press: lang === 'cy' ? 'Y Wasg' : 'Press',
      act: lang === 'cy' ? 'Gweithredwch' : 'Take Action',
      contact: lang === 'cy' ? 'Cysylltwch' : 'Contact Us'
  };

  // Switch Database content when Language Toggles
  useEffect(() => {
    // Preserve edits if any? For this demo, we assume switching resets content source to the correct DB default.
    setDatabase(lang === 'cy' ? DB_CY : DB_EN);
  }, [lang]);

  // Derived Data
  const data = database[currentPath] || { content: [], root: { props: { title: "404" } } };

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false); // Close mobile menu on nav change
  }, [currentPath, isEditing]);

  const handlePublish = (newData: PageData) => {
    setDatabase(prev => ({
      ...prev,
      [currentPath]: newData
    }));
    setIsEditing(false);
  };

  const handleNavClick = (path: string) => {
    setCurrentPath(path);
    setIsEditing(false); 
  };

  return (
    <div className="min-h-screen font-sans flex flex-col bg-stone-900 text-white">
      {/* Top Banner */}
      <div className="bg-[#009A49] text-white text-xs py-2 px-4 flex justify-between items-center tracking-widest uppercase font-bold">
        <span>Truth • Justice • Change</span>
        <button 
            onClick={() => setLang(lang === 'cy' ? 'en' : 'cy')} 
            className="hover:underline bg-black/20 px-2 py-1 rounded"
        >
            {lang === 'cy' ? 'English' : 'Cymraeg'}
        </button>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full bg-black border-b border-[#009A49] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo Area */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => handleNavClick('/')}>
              <WelshDragon />
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none group-hover:text-[#009A49] transition-colors uppercase">Great House</span>
                <span className="text-2xl sm:text-3xl font-black text-[#009A49] tracking-tighter leading-none group-hover:text-white transition-colors uppercase">Campaign</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-4">
              <NavButton label={labels.home} active={currentPath === '/'} onClick={() => handleNavClick('/')} />
              
              {/* Info Dropdown */}
              <Dropdown 
                  label={labels.about}
                  active={['/about', '/family-history', '/marconi'].some(p => currentPath.startsWith(p))}
                  items={[
                      { label: labels.about, onClick: () => handleNavClick('/about') },
                      { label: labels.famHistory, onClick: () => handleNavClick('/family-history') },
                      { label: labels.marconi, onClick: () => handleNavClick('/marconi') },
                      { label: labels.story, onClick: () => handleNavClick('/story') },
                  ]}
              />
              
              <Dropdown 
                  label={labels.writings}
                  active={currentPath.startsWith('/writings')}
                  items={[
                      { label: "Newsletter", onClick: () => handleNavClick('/writings/newsletter') },
                      { label: "Sion's Story", onClick: () => handleNavClick('/writings/sion') },
                      { label: "David's Story", onClick: () => handleNavClick('/writings/david') }
                  ]}
              />

              <Dropdown 
                  label={labels.gallery} 
                  active={currentPath.startsWith('/gallery')}
                  items={[
                      { label: "Overview", onClick: () => handleNavClick('/gallery') },
                      { label: "Historical", onClick: () => handleNavClick('/gallery/historical') },
                      { label: "Excavations", onClick: () => handleNavClick('/gallery/excavations') },
                      { label: "Family", onClick: () => handleNavClick('/gallery/family') }
                  ]}
              />

              <NavButton label={labels.ghf2} active={currentPath === '/ghf-2-0'} onClick={() => handleNavClick('/ghf-2-0')} />
              <NavButton label={labels.act} active={currentPath === '/act'} onClick={() => handleNavClick('/act')} />
              <NavButton label={labels.shop} active={currentPath === '/shop'} onClick={() => handleNavClick('/shop')} />
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 xl:hidden">
              <button 
                className="text-white p-2 hover:text-[#009A49]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                 </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
           <div className="xl:hidden bg-black border-b-4 border-[#009A49] absolute w-full left-0 z-40 shadow-2xl">
              <div className="flex flex-col py-6 px-6 space-y-4 h-screen overflow-y-auto pb-48">
                 <MobileLink label={labels.home} onClick={() => handleNavClick('/')} />
                 
                 <div className="pl-4 border-l-2 border-[#009A49] space-y-3 my-2">
                    <p className="text-xs font-bold text-[#009A49] uppercase tracking-widest mb-2">{labels.about}</p>
                    <MobileLink label={labels.about} onClick={() => handleNavClick('/about')} />
                    <MobileLink label={labels.famHistory} onClick={() => handleNavClick('/family-history')} />
                    <MobileLink label={labels.marconi} onClick={() => handleNavClick('/marconi')} />
                    <MobileLink label={labels.story} onClick={() => handleNavClick('/story')} />
                 </div>

                 <div className="pl-4 border-l-2 border-[#009A49] space-y-3 my-2">
                    <p className="text-xs font-bold text-[#009A49] uppercase tracking-widest mb-2">{labels.writings}</p>
                    <MobileLink label="Newsletter" onClick={() => handleNavClick('/writings/newsletter')} />
                    <MobileLink label="Sion's Story" onClick={() => handleNavClick('/writings/sion')} />
                    <MobileLink label="David's Story" onClick={() => handleNavClick('/writings/david')} />
                 </div>

                 <div className="pl-4 border-l-2 border-[#009A49] space-y-3 my-2">
                    <p className="text-xs font-bold text-[#009A49] uppercase tracking-widest mb-2">{labels.gallery}</p>
                    <MobileLink label="Overview" onClick={() => handleNavClick('/gallery')} />
                    <MobileLink label="Historical" onClick={() => handleNavClick('/gallery/historical')} />
                    <MobileLink label="Excavations" onClick={() => handleNavClick('/gallery/excavations')} />
                 </div>

                 <MobileLink label={labels.ghf2} onClick={() => handleNavClick('/ghf-2-0')} />
                 <MobileLink label={labels.act} onClick={() => handleNavClick('/act')} />
                 <MobileLink label={labels.shop} onClick={() => handleNavClick('/shop')} />
                 <MobileLink label={labels.contact} onClick={() => handleNavClick('/contact')} />
              </div>
           </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-stone-900">
        {isEditing ? (
           <div className="h-[calc(100vh-100px)] overflow-hidden bg-white text-black">
            <Puck
              config={config}
              data={data}
              onPublish={handlePublish}
              headerTitle={`Editing: ${data.root.props.title || 'Untitled'}`}
              headerPath={currentPath}
            />
          </div>
        ) : (
          <div className="min-h-[50vh]">
            <Render config={config} data={data} />
          </div>
        )}
      </main>

      {/* Global Support Call to Action */}
      {!isEditing && (
          <div className="bg-[#009A49] py-16 px-6 text-center">
              <div className="max-w-4xl mx-auto">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">{labels.standWithUs}</h2>
                  <p className="text-xl md:text-2xl font-bold text-white mb-8">
                      {labels.standDesc}
                  </p>
                  <button 
                      onClick={() => handleNavClick('/support')}
                      className="bg-black text-white hover:bg-white hover:text-[#009A49] font-black text-lg py-5 px-12 uppercase tracking-widest transition-all duration-300 shadow-xl border-4 border-black"
                  >
                      {labels.btnSupport}
                  </button>
              </div>
          </div>
      )}

      {/* Footer */}
      {!isEditing && (
        <footer className="bg-black text-white py-16 px-6 border-t border-[#009A49]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                  <WelshDragon />
                  <h3 className="text-3xl font-black text-[#009A49] uppercase tracking-tighter">Great House Farm</h3>
              </div>
              <p className="text-stone-400 text-lg leading-relaxed max-w-md">
                An archive of resistance. Preserving the memory of the Williams family and the fight against erasure.
              </p>
              
              <div className="mt-8 flex flex-col gap-2">
                  <button onClick={() => handleNavClick('/brand')} className="text-stone-500 hover:text-white text-sm text-left uppercase tracking-widest">{labels.brand}</button>
                  <button onClick={() => handleNavClick('/press')} className="text-stone-500 hover:text-white text-sm text-left uppercase tracking-widest">{labels.press}</button>
                  
                  {/* Admin Area Toggle */}
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-stone-700 hover:text-red-500 text-sm text-left uppercase tracking-widest font-bold mt-4"
                  >
                    {labels.admin}
                  </button>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-6">
                <div className="flex items-center gap-6">
                    <a href="#" className="text-stone-400 hover:text-[#009A49] transition-colors transform hover:scale-110"><GithubIcon /></a>
                    <a href="#" className="text-stone-400 hover:text-[#009A49] transition-colors transform hover:scale-110"><FacebookIcon /></a>
                    <a href="#" className="text-stone-400 hover:text-[#009A49] transition-colors transform hover:scale-110"><TwitterIcon /></a>
                    <a href="#" className="text-stone-400 hover:text-[#009A49] transition-colors transform hover:scale-110"><InstagramIcon /></a>
                </div>
                
                <button 
                    onClick={() => handleNavClick('/writings/newsletter')}
                    className="text-stone-300 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors"
                >
                    Subscribe to Newsletter
                </button>
                <p className="text-xs text-stone-600 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Great House Farm Campaign.
                </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// Sub-components for Nav
const NavButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      font-bold text-sm tracking-widest uppercase transition-all whitespace-nowrap border-b-2
      ${active ? 'text-[#009A49] border-[#009A49]' : 'text-white border-transparent hover:text-[#009A49]'}
    `}
  >
    {label}
  </button>
);

const DropdownItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="block w-full text-left px-6 py-3 text-sm font-bold text-stone-300 hover:bg-[#009A49] hover:text-white transition-colors uppercase tracking-widest"
  >
    {label}
  </button>
);

const Dropdown = ({ label, active, items }: { label: string; active: boolean; items: { label: string; onClick: () => void }[] }) => (
    <div className="relative group">
        <button 
            className={`
            flex items-center gap-1 font-bold text-sm tracking-widest uppercase transition-colors py-2 border-b-2
            ${active ? 'text-[#009A49] border-[#009A49]' : 'text-white border-transparent hover:text-[#009A49]'}
            `}
        >
            {label}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        {/* Dropdown Menu */}
        <div className="absolute left-0 mt-0 w-56 bg-black border border-[#009A49] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
            <div className="py-2">
                {items.map((item, i) => (
                    <DropdownItem key={i} label={item.label} onClick={item.onClick} />
                ))}
            </div>
        </div>
    </div>
);

const MobileLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick} className="text-left font-black text-xl text-white block w-full hover:text-[#009A49] uppercase tracking-tighter">
        {label}
    </button>
);