import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import AppNavbar from './components/AppNavbar';

function App() {
  return (
    <BrowserRouter>


      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/homepage" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;