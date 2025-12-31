import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GooeyNav from "./GooeyNav";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "About us", path: "/"}
];

function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);

  // Sync active tab with current route
  useEffect(() => {
    const index = navItems.findIndex(
      item => item.path === location.pathname
    );
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 mt-6">
      <div className="mt-6">
        <GooeyNav
          items={navItems.map(item => ({
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
          initialActiveIndex={activeIndex}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
    </div>
  );
}

export default AppNavbar;
