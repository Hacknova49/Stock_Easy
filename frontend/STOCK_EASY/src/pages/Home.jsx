import React from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    Activity,
    Settings,
    LayoutDashboard,
    MessageSquare,
    TrendingUp,
    ShoppingCart,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Zap
} from "lucide-react";
import "./Home.css";

function Home() {
    return (
        <div className="home-dashboard">
            {/* Header */}
            <header className="home-header">
                <div className="header-content">
                    <div className="brand-section">
                        <h1 className="brand-title">Stock Easy</h1>
                        <span className="brand-badge">AI Powered</span>
                    </div>

                    {/* Navigation */}
                    <nav className="main-nav">
                        <Link to="/control-panel" className="nav-item">
                            <Settings size={18} />
                            <span>Control Panel</span>
                        </Link>
                        <Link to="/dashboard" className="nav-item">
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/feedback" className="nav-item">
                            <MessageSquare size={18} />
                            <span>Feedback</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Welcome Banner */}
            <section className="welcome-section">
                <div className="welcome-card">
                    <div className="welcome-content">
                        <div className="welcome-icon-wrapper">
                            <Zap size={24} className="welcome-icon" />
                        </div>
                        <div className="welcome-text">
                            <h2>Your AI is actively managing your inventory</h2>
                            <p>Monitor performance, review blocked items, and adjust limits anytime.</p>
                        </div>
                    </div>
                    <div className="session-badge">
                        <span className="session-dot"></span>
                        Session Active
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {/* AI Status Card */}
                    <div className="stat-card status-card">
                        <div className="card-header">
                            <Activity size={20} className="card-icon cyan" />
                            <h3>AI Status</h3>
                        </div>
                        <div className="status-content">
                            <div className="status-indicator active">
                                <CheckCircle size={16} />
                                <span>ACTIVE</span>
                            </div>
                            <div className="status-details">
                                <div className="status-row">
                                    <span className="label">Valid until</span>
                                    <span className="value">Today, 6:30 PM</span>
                                </div>
                                <div className="status-row">
                                    <span className="label">Daily limit</span>
                                    <span className="value">₹1,000</span>
                                </div>
                                <div className="status-row">
                                    <span className="label">Monthly limit</span>
                                    <span className="value">₹100,000</span>
                                </div>
                            </div>
                        </div>
                        <p className="card-footer-text">Rules are enforced automatically. The AI cannot exceed them.</p>
                    </div>

                    {/* Activity Summary Card */}
                    <div className="stat-card summary-card">
                        <div className="card-header">
                            <TrendingUp size={20} className="card-icon purple" />
                            <h3>Today's Activity</h3>
                        </div>
                        <div className="summary-content">
                            <div className="summary-stat">
                                <span className="stat-number">6</span>
                                <span className="stat-label">AI actions executed</span>
                            </div>
                            <div className="summary-stat highlight">
                                <span className="stat-number">₹3,500</span>
                                <span className="stat-label">Total spent today</span>
                            </div>
                            <div className="summary-stat warning">
                                <span className="stat-number">1</span>
                                <span className="stat-label">Actions blocked by policy</span>
                            </div>
                        </div>
                    </div>

                    {/* Stock Health Card */}
                    <div className="stat-card health-card">
                        <div className="card-header">
                            <Bell size={20} className="card-icon orange" />
                            <h3>Stock Health</h3>
                        </div>
                        <div className="health-content">
                            <div className="health-item healthy">
                                <CheckCircle size={18} />
                                <span className="count">18</span>
                                <span className="label">Healthy items</span>
                            </div>
                            <div className="health-item low">
                                <AlertTriangle size={18} />
                                <span className="count">3</span>
                                <span className="label">Low stock</span>
                            </div>
                            <div className="health-item critical">
                                <XCircle size={18} />
                                <span className="count">1</span>
                                <span className="label">Critical</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Actions Section */}
            <section className="actions-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <Clock size={22} />
                        Recent AI Actions
                    </h2>
                </div>

                <div className="actions-grid">
                    {/* Executed Actions */}
                    <div className="action-card executed">
                        <div className="action-card-header">
                            <ShoppingCart size={18} className="action-icon" />
                            <h4>Items Bought</h4>
                            <span className="action-badge success">Executed</span>
                        </div>
                        <div className="action-details">
                            <div className="product-info">
                                <span className="product-name">Nachos Tangy Tomato</span>
                                <span className="product-time">14:32</span>
                            </div>
                            <div className="action-meta">
                                <div className="meta-row">
                                    <span className="meta-label">Restocked</span>
                                    <span className="meta-value">12 units</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Supplier</span>
                                    <span className="meta-value">SUP1</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Amount</span>
                                    <span className="meta-value highlight">₹777.60</span>
                                </div>
                            </div>
                            <div className="action-status success">
                                <CheckCircle size={14} />
                                Status: Executed
                            </div>
                        </div>
                    </div>

                    {/* Blocked Actions */}
                    <div className="action-card blocked">
                        <div className="action-card-header">
                            <AlertTriangle size={18} className="action-icon" />
                            <h4>Blocked Items</h4>
                            <span className="action-badge danger">Blocked</span>
                        </div>
                        <div className="action-details">
                            <div className="product-info">
                                <span className="product-name">Milk Packets</span>
                                <span className="product-time">14:28</span>
                            </div>
                            <div className="action-meta">
                                <div className="meta-row">
                                    <span className="meta-label">Attempted</span>
                                    <span className="meta-value">20 units</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Amount</span>
                                    <span className="meta-value">₹1,200</span>
                                </div>
                            </div>
                            <div className="action-status danger">
                                <XCircle size={14} />
                                Blocked: Exceeds per-transaction limit
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
