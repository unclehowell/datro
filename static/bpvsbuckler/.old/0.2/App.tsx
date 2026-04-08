import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimelinePage from './pages/TimelinePage';
import LegalPage from './pages/LegalPage';
import EvidencePage from './pages/EvidencePage';
import ActionPage from './pages/ActionPage';
import Editor from './pages/Editor';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Footer = () => (
  <footer className="bg-ink text-stone-500 py-8 text-center border-t border-stone-800">
    <div className="max-w-4xl mx-auto px-4">
      <p className="font-serif text-sm mb-2">The Buckler Family Case: A Quest for Justice</p>
      <p className="text-xs">Document compiled: January 2026</p>
    </div>
  </footer>
);

function App() {
  const location = window.location.hash;
  const isEditor = location.includes("/edit");

  return (
    <Router>
      <ScrollToTop />
      {/* Hide Navbar in Editor mode for cleaner interface */}
      {!isEditor && <Navbar />}
      
      <main className={isEditor ? "" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/action" element={<ActionPage />} />
          <Route path="/edit" element={<Editor />} />
        </Routes>
      </main>
      
      {!isEditor && <Footer />}
    </Router>
  );
}

export default App;