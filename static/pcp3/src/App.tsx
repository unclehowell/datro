/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { News } from './pages/News';
import { About } from './pages/About';
import { Claim } from './pages/Claim';
import { ThankYou } from './pages/ThankYou';
import { Editor } from './pages/Editor';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/about" element={<About />} />
          <Route path="/claim" element={<Claim />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/edit" element={<Editor />} />
        </Routes>
      </Layout>
    </Router>
  );
}
