import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimelinePage from './pages/TimelinePage';
import LegalPage from './pages/LegalPage';
import EvidencePage from './pages/EvidencePage';
import ActionPage from './pages/ActionPage';
import PressPage from './pages/PressPage';
import LawsuitPage from './pages/LawsuitPage';
import AnalysisPage from './pages/AnalysisPage';
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
      <p className="font-serif text-sm mb-2">Great House Farm: Open Source Investigation</p>
      <p className="text-xs">Archive compiled: January 2026</p>
    </div>
  </footer>
);

function App() {
  const location = window.location.hash;
  const isEditor = location.includes("/edit");

  return (
    <Router>
      <ScrollToTop />
      {!isEditor && <Navbar />}
      
      <main className={isEditor ? "" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/action" element={<ActionPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/lawsuit" element={<LawsuitPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/edit" element={<Editor />} />
        </Routes>
      </main>
      
      {!isEditor && <Footer />}
    </Router>
  );
}

export default App;