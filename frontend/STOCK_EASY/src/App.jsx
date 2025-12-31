import React from 'react';
import Squares from "./components/Squares";
import MagicBento from './components/MagicBento';
import Shuffle from './components/Shuffle';
import './App.css';

function App() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      
      {/* BACKGROUND LAYER: Fixed and non-interactive */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares 
          speed={0.5} 
          squareSize={60}
          direction='diagonal'
          borderColor='#1a1a1a' 
          hoverFillColor='#2a2a2a'
        />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* HEADER AREA with Shuffle Logo */}
        <header className="pt-16 pb-8 text-center w-full">
          <div className="inline-block text-white text-5xl font-bold tracking-tight">
            <Shuffle
              text="Stock Easy"
              shuffleDirection="right"
              duration={0.35}
              animationMode="evenodd"
              shuffleTimes={1}
              ease="power3.out"
              stagger={0.03}
              threshold={0.1}
              triggerOnce={true}
              triggerOnHover={true}
              respectReducedMotion={true}
            />
          </div>
        </header>

        {/* BENTO GRID AREA */}
        <div className="w-full">
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
    </div>
  );
}

export default App;