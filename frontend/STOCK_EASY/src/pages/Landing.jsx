import React from "react";
import Squares from "../components/Squares";
import MagicBento from "../components/MagicBento";
import Shuffle from "../components/Shuffle";
import "../App.css";


function Landing() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares 
          speed={0.5} 
          squareSize={60}
          direction='diagonal'
          borderColor='#1a1a1a' 
          hoverFillColor='#2a2a2a'
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center">
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
              triggerOnce
              triggerOnHover
              respectReducedMotion
            />
          </div>
        </header>

        <div className="w-full">
          <MagicBento 
            textAutoHide
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt
            enableMagnetism
            clickEffect
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
          />
        </div>
      </div>
    </div>
  );
}

export default Landing;