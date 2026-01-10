import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Shield, HeadphonesIcon, BarChart3, Users, Zap, Check } from "lucide-react";
import Squares from "../components/Squares";
import Shuffle from "../components/Shuffle";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">
      {/* Grid Background */}
      <div className="grid-background">
        <Squares
          speed={0.3}
          squareSize={50}
          direction="diagonal"
          borderColor="#1a3a1a"
          hoverFillColor="#0d2a0d"
        />
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <img src="/src/assets/stock easy photo.png" alt="StockEasy" className="brand-logo" />
          <span className="brand-name">StockEasy</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#about" className="nav-link">About</a>
        </div>
        <div className="nav-actions">
          <Link to="/homepage" className="nav-signin">Sign In</Link>
          <Link to="/homepage" className="nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
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
        <p className="hero-subtitle">
          Welcome to StockEasy — Your AI-Powered Solution for Inventory Insights and
          Automated Payment Processing
        </p>
        <div className="hero-buttons">
          <Link to="/homepage" className="btn-primary">
            <Zap size={18} />
            Start trial now
          </Link>
          <button className="btn-secondary">Demo Video</button>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="features">
        <span className="section-badge">Best picks</span>
        <h2 className="section-title">Services included in every plan</h2>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <HeadphonesIcon size={28} />
            </div>
            <h3 className="service-title">AI-Powered Insights</h3>
            <p className="service-description">
              Intelligent demand forecasting and stock optimization powered by advanced machine learning algorithms.
            </p>
            <a href="#" className="service-link">Learn more</a>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <TrendingUp size={28} />
            </div>
            <h3 className="service-title">Sales & Analytics</h3>
            <p className="service-description">
              Real-time sales tracking and comprehensive analytics to drive your business decisions.
            </p>
            <a href="#" className="service-link">Learn more</a>
          </div>

          <div className="service-card">
            <div className="service-icon">
              <Shield size={28} />
            </div>
            <h3 className="service-title">Automated Payments</h3>
            <p className="service-description">
              Secure, automated supplier payments with budget controls and approval workflows.
            </p>
            <a href="#" className="service-link">Contact support</a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <span className="section-badge">Pricing plans</span>
        <h2 className="section-title">Pricing that suits your needs</h2>
        <p className="section-subtitle">
          Whether you are a small startup, a growing e-commerce store, or an enterprise-level
          organization, we have the right plan to suit your unique inventory management needs.
        </p>

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3 className="plan-name">Starter</h3>
            <p className="plan-description">
              Perfect for small businesses just getting started with AI-powered inventory.
            </p>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">50</span>
              <span className="period">/month</span>
            </div>
            <Link to="/homepage" className="plan-cta">Buy now</Link>
            <ul className="plan-features">
              <li><Check size={16} /> Up to 500 products</li>
              <li><Check size={16} /> Basic analytics</li>
              <li><Check size={16} /> Email support</li>
            </ul>
          </div>

          <div className="pricing-card featured">
            <h3 className="plan-name">Standard</h3>
            <p className="plan-description">
              Ideal for growing businesses with advanced inventory and payment needs.
            </p>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">60</span>
              <span className="period">/month</span>
            </div>
            <Link to="/homepage" className="plan-cta">Buy now</Link>
            <ul className="plan-features">
              <li><Check size={16} /> Up to 2000 products</li>
              <li><Check size={16} /> Advanced analytics</li>
              <li><Check size={16} /> Priority support</li>
              <li><Check size={16} /> Auto-payments</li>
            </ul>
          </div>

          <div className="pricing-card">
            <h3 className="plan-name">Enterprise</h3>
            <p className="plan-description">
              For large organizations requiring unlimited scale and custom solutions.
            </p>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">12</span>
              <span className="period">/month</span>
            </div>
            <Link to="/homepage" className="plan-cta">Buy now</Link>
            <ul className="plan-features">
              <li><Check size={16} /> Unlimited products</li>
              <li><Check size={16} /> Custom integrations</li>
              <li><Check size={16} /> 24/7 support</li>
              <li><Check size={16} /> Dedicated manager</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-visual">
          <div className="about-circle">
            <div className="circle-inner">
              <BarChart3 size={48} />
            </div>
          </div>
          <div className="about-decorator"></div>
        </div>
        <div className="about-content">
          <h2 className="about-title">A people-first approach<br />to inventory management</h2>
          <p className="about-description">
            Your inventory challenges are our challenges, and your goals are our
            priority. We're here to help you design the right solution to drive
            business growth and set up custom fee profiles to optimize payment
            pathways. StockEasy support team is also available 24/7 to address
            emergencies.
          </p>
          <Link to="/homepage" className="btn-outline">More About Us</Link>
        </div>
      </section>

      {/* Newsletter Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="brand-icon">📊</span>
          <span className="brand-name">StockEasy</span>
        </div>
        <h3 className="footer-title">Sign up for the StockEasy Newsletter</h3>
        <div className="newsletter-form">
          <input type="email" placeholder="Email" className="newsletter-input" />
          <button className="newsletter-submit">
            <Zap size={18} />
          </button>
        </div>
        <div className="social-links">
          <a href="#" className="social-link">📘</a>
          <a href="#" className="social-link">📷</a>
          <a href="#" className="social-link">🐦</a>
          <a href="#" className="social-link">🔗</a>
        </div>
        <p className="footer-copyright">© 2026 StockEasy. All rights reserved.</p>
      </footer>

      {/* Floating Dashboard Button */}
      <Link to="/dashboard" className="floating-dashboard-btn">
        <LayoutDashboard size={24} />
        <span className="dashboard-tooltip">Dashboard</span>
      </Link>
    </div>
  );
}

export default Landing;