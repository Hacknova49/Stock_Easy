import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ControlPanel from './pages/control-panel/ControlPanel';
import AppNavbar from './components/AppNavbar';

function App() {
  return (
    <BrowserRouter>


      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/control-panel" element={<ControlPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;