import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GooeyNav from "./GooeyNav";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "About", path: "/about" }
];

function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to get index from current URL
  // Using a function inside useState is called "Lazy Initialization"
  const getIndexFromPath = () => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    return index !== -1 ? index : 0;
  };

  // We set the initial state by checking the URL immediately
  const [activeIndex, setActiveIndex] = useState(getIndexFromPath);

  const formattedItems = useMemo(() => 
    navItems.map((item, index) => ({
      label: item.label,
      href: item.path,
      onClick: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        // Update local state immediately for instant feedback
        setActiveIndex(index);
        navigate(item.path);
      },
    })), 
  [navigate]);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-auto">
      <div className="mt-6">
        <GooeyNav
          items={formattedItems}
          // Use the computed activeIndex
          initialActiveIndex={activeIndex} 
          activeIndex={activeIndex} 
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
    </nav>
  );
}

export default AppNavbar;