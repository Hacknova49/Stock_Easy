import React from "react";
import Squares from "../components/Squares";
import MagicBento from "../components/MagicBento";
import Shuffle from "../components/Shuffle";
import AppNavbar from "../components/AppNavbar";
import "../App.css";

function Landing() {
  return (
    <div className="relative min-h-screen w-full bg-black">

      {/* NAVBAR */}
      <AppNavbar />

      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares 
          speed={0.5} 
          squareSize={60}
          direction="diagonal"
          borderColor="#303232ff" 
          hoverFillColor="#543838ff"
        />
      </div>

      {/* PAGE CONTENT (pushed down for navbar height) */}
      <div className="relative z-10 flex flex-col items-center pt-24">

        {/* HEADER */}
        <header className="pb-8 text-center w-full">
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

        {/* BENTO GRID */}
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
