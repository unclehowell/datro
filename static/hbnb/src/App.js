import React from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

import './index.css';

function App() {
  return (
    <React.Fragment>
      <Navbar />
      <Sidebar />
    </React.Fragment>
  );
}

export default App;

