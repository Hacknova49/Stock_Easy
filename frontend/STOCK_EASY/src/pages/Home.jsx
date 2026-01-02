import React from "react";
import { Link } from "react-router-dom";
import { Bell, Activity, Info } from "lucide-react";
import "./Home.css";

function Home() {
    return (
        <div className="sketch-dashboard">
            {/* HEADER */}
            <header className="sketch-header">
                <div className="header-top">
                    <h1 className="logo-text">Stock Easy</h1>
                    <div className="session-info">
                        <span className="dot">●</span> Session Active | Expires in 5h 42m
                    </div>
                </div>
                <div className="header-divider"></div>

                {/* WELCOME BANNER */}
                <div className="welcome-banner">
                    <div className="welcome-text">
                        Welcome! Your AI is actively managing your inventory.
                        <br />
                        Monitor performance, review blocked items, and adjust limits, anytime.
                    </div>
                    <div className="welcome-icons">
                        <Activity size={24} className="banner-icon" />
                        <div className="signal-bars">
                            <div className="bar b1"></div>
                            <div className="bar b2"></div>
                            <div className="bar b3"></div>
                        </div>
                        <Info size={24} className="banner-icon" />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="sketch-main">
                {/* TOP ROW CARDS */}
                <div className="cards-container">

                    {/* STATUS CARD */}
                    <div className="sketch-card status-card-sketch">
                        <h3 className="card-title">Status Card</h3>
                        <div className="card-content">
                            <p className="status-row">Status: ACTIVE</p>
                            <p className="status-row">Valid until: Today,<br />6:30 PM</p>

                            <div className="status-divider"></div>

                            <p className="status-row">Daily spend limit: ₹1,000</p>
                            <p className="status-row">Daily spend limit: ₹100000<br />automatically.</p>

                            <p className="fine-print">
                                These rules are enforced automatically. The AI cannot exceed them.
                            </p>
                        </div>
                    </div>

                    {/* ACTIVITY SUMMARY (OVAL) */}
                    <div className="sketch-oval">
                        <h3 className="oval-title">Today's Activity Summary<br />Summary</h3>
                        <div className="oval-content">
                            <p className="summary-row">AI actions executed: 6</p>
                            <p className="summary-row big-price">Total spent: ₹3,500</p>
                            <p className="summary-row">Actions blocked by policy: 1</p>
                        </div>
                    </div>

                    {/* NOTIFICATION */}
                    <div className="sketch-notification">
                        <div className="notification-icon-wrapper">
                            <Bell size={40} color="#ff4444" fill="#ff4444" />
                            <div className="wifi-lines">
                                <span>)</span>
                                <span>)</span>
                            </div>
                        </div>
                        <div className="jagged-box">
                            <p>Healthy items: 18</p>
                            <p>Low stock: 3</p>
                            <p>Critical stock 1</p>
                        </div>
                    </div>
                </div>

                {/* RECENT ACTIONS HEADER */}
                <div className="actions-header-container">
                    <span className="sparkle left">
                        <i className="line l1"></i>
                        <i className="line l2"></i>
                        <i className="line l3"></i>
                    </span>
                    <h2 className="actions-title">Recent AI Actions</h2>
                    <span className="sparkle right">
                        <i className="line l1"></i>
                        <i className="line l2"></i>
                        <i className="line l3"></i>
                    </span>
                </div>

                {/* ACTIONS LIST */}
                <div className="actions-list-container">

                    {/* ITEMS BOUGHT */}
                    <div className="action-column">
                        <h3 className="column-title">Items bought:</h3>
                        <div className="action-item">
                            <p className="product-name">Nachos Tangy Tomato</p>
                            <p>Restocked: 12 units</p>
                            <p>Supplier: SUP1</p>
                            <p>Amount: ₹777.60</p>
                            <p className="status-executed">
                                <span className="check-box">☑</span> Status: Executed
                            </p>
                            <p className="time">Time: 14:32</p>
                        </div>
                    </div>

                    {/* VERTICAL DIVIDER */}
                    <div className="vertical-line-container">
                        <div className="square-end top"></div>
                        <div className="vertical-line"></div>
                        <div className="square-end bottom"></div>
                    </div>

                    {/* BLOCKED ITEMS */}
                    <div className="action-column">
                        <h3 className="column-title">Blocked Items:</h3>
                        <div className="action-item">
                            <p className="product-name">Milk Packets</p>
                            <p>Attempted restock: 20 units</p>
                            <p>Amount: ₹1,200</p>
                            <p className="status-blocked">
                                <span className="stop-icon">⛔</span> Status: Blocked
                            </p>
                            <p className="reason">Reason: Exceeds per-transaction<br />limit</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Home;
