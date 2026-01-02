import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Squares from "../components/Squares";
import Shuffle from "../components/Shuffle";
import "../App.css";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">
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

      {/* PAGE CONTENT */}
      <div className="landing-content">

        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-title">
            <Shuffle
              text="STOCK EASY"
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
          <p className="hero-subtitle">Smart AI for Stock & Payments</p>
          <button className="demo-button">
            <span className="play-icon">▶</span>
            VIEW DEMO
          </button>
        </section>

        {/* FEATURE FLOW ROW */}
        <section className="feature-flow">
          <div className="flow-item">
            <span className="flow-icon">📊</span>
            <span className="flow-text">Track Sales</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-item">
            <span className="flow-icon">🤖</span>
            <span className="flow-text">AI Predicts Demand</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-item">
            <span className="flow-icon">📦</span>
            <span className="flow-text">Auto Restock & Pay</span>
          </div>
        </section>

        {/* TAGLINE SECTION */}
        <section className="tagline-section">
          <p className="tagline">
            AI-powered inventory & payments—fully automated, fully controlled.
          </p>
        </section>

        {/* WHY STOCK EASY SECTION */}
        <section className="why-section">
          <h2 className="why-title">
            Why STOCK EASY?
          </h2>

          <div className="feature-cards">
            {/* Autonomous Decisions Card */}
            <div className="feature-card">
              <div className="card-icon-container">
                <span className="card-icon">🧠</span>
              </div>
              <h3 className="card-title">
                <span className="card-title-icon">⚡</span>
                Autonomous Decisions
              </h3>
              <p className="card-description">
                An AI agent that manages stock and supplier payments without exceeding your rules.
              </p>
            </div>

            {/* Cost Control Card */}
            <div className="feature-card">
              <div className="card-icon-container">
                <span className="card-icon">💰</span>
              </div>
              <h3 className="card-title">
                <span className="card-title-icon">📊</span>
                Cost Control
              </h3>
              <p className="card-description">
                Never exceed budgets or reorder limits.
              </p>
            </div>

            {/* Built for Small Businesses Card */}
            <div className="feature-card">
              <div className="card-icon-container">
                <span className="card-icon">🏪</span>
              </div>
              <h3 className="card-title">
                <span className="card-title-icon">🏢</span>
                Built for Small Businesses
              </h3>
              <p className="card-description">
                Excel-friendly, simple, practical, deployable.
              </p>
            </div>
          </div>
        </section>

        {/* GET STARTED SECTION */}
        <section className="get-started-section">
          <button className="demo-button get-started-button">
            GET STARTED
          </button>
        </section>

      </div>

      {/* FLOATING DASHBOARD BUTTON */}
      <Link to="/dashboard" className="floating-dashboard-btn">
        <LayoutDashboard size={24} />
        <span className="dashboard-tooltip">View Dashboard</span>
      </Link>
    </div>
  );
}

export default Landing;
