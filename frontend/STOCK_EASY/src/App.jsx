import React from 'react';
import Squares from "./components/Squares";
import MagicBento from './components/MagicBento';
import './App.css';

function App() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      
      {/* BACKGROUND LAYER: Square border component */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares 
          speed={0.5} 
          squareSize={60}
          direction='diagonal'
          borderColor='#1a1a1a' 
          hoverFillColor='#2a2a2a'
        />
      </div>

      {/* CONTENT LAYER: Bento UI */}
      <div className="relative z-10">
        <header className="pt-10 pb-4 text-center">
          <h1 className="text-white text-5xl font-bold tracking-tight">Stock Easy</h1>

        </header>

        <MagicBento 
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="132, 0, 255"
        />
      </div>
    </div>
  );
}

export default App;