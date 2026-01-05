import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    Activity,
    Settings,
    LayoutDashboard,
    MessageSquare,
    ShoppingCart,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Loader
} from "lucide-react";
import "./Home.css";

/**
 * ✅ Unified API base
 * - Local: http://127.0.0.1:8000
 * - Deployed: your backend URL (via env)
 */
const API_BASE =
    import.meta.env.VITE_API_BASE || "https://stockeasy-backend-qi9b.onrender.com";

function Home() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch(
                `${API_BASE}/api/dashboard/stats`
            );
            if (!response.ok) throw new Error("Failed to fetch stats");
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="home-dashboard">
            {/* Header */}
            <header className="home-header">
                <div className="header-content">
                    <div className="brand-section">
                        <h1 className="brand-title">Stock Easy</h1>
                    </div>

                    <nav className="main-nav">
                        <Link to="/control-panel" className="nav-item">
                            <Settings size={18} />
                            <span>Control Panel</span>
                        </Link>
                        <Link to="/dashboard" className="nav-item">
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
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
                            <p>
                                Monitor performance, review blocked items, and
                                adjust limits anytime.
                            </p>
                        </div>
                    </div>
                    <div className="session-badge">
                        <span className="session-dot"></span>
                        Session Active
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                {loading ? (
                    <div className="loading-state">
                        <Loader size={32} className="spinner" />
                        <span>Loading dashboard data...</span>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertTriangle size={24} />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="stats-grid">
                        {/* AI Status */}
                        <div className="stat-card status-card">
                            <div className="card-header">
                                <Activity size={20} className="card-icon cyan" />
                                <h3>AI Status</h3>
                            </div>
                            <div className="status-content">
                                <div
                                    className={`status-indicator ${stats?.aiStatus?.isActive
                                        ? "active"
                                        : "inactive"
                                        }`}
                                >
                                    {stats?.aiStatus?.isActive ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        <XCircle size={16} />
                                    )}
                                    <span>
                                        {stats?.aiStatus?.isActive
                                            ? "ACTIVE"
                                            : "INACTIVE"}
                                    </span>
                                </div>

                                <div className="status-details">
                                    <div className="status-row">
                                        <span className="label">
                                            Monthly Budget
                                        </span>
                                        <span className="value">
                                            {formatCurrency(
                                                stats?.aiStatus?.monthlyBudget ||
                                                0
                                            )}
                                        </span>
                                    </div>
                                    <div className="status-row">
                                        <span className="label">
                                            Budget Used
                                        </span>
                                        <span className="value">
                                            {formatCurrency(
                                                stats?.aiStatus?.budgetUsed || 0
                                            )}
                                        </span>
                                    </div>
                                    <div className="status-row">
                                        <span className="label">
                                            Remaining
                                        </span>
                                        <span className="value">
                                            {formatCurrency(
                                                stats?.aiStatus
                                                    ?.budgetRemaining || 0
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="card-footer-text">
                                Rules are enforced automatically. The AI cannot
                                exceed them.
                            </p>
                        </div>

                        {/* Stock Health */}
                        <div className="stat-card health-card">
                            <div className="card-header">
                                <Bell
                                    size={20}
                                    className="card-icon orange"
                                />
                                <h3>Stock Health</h3>
                            </div>
                            <div className="health-content">
                                <div className="health-item healthy">
                                    <CheckCircle size={18} />
                                    <span className="count">
                                        {stats?.stockHealth?.healthy || 0}
                                    </span>
                                    <span className="label">
                                        Healthy items
                                    </span>
                                </div>
                                <div className="health-item low">
                                    <AlertTriangle size={18} />
                                    <span className="count">
                                        {stats?.stockHealth?.low || 0}
                                    </span>
                                    <span className="label">Low stock</span>
                                </div>
                                <div className="health-item critical">
                                    <XCircle size={18} />
                                    <span className="count">
                                        {stats?.stockHealth?.critical || 0}
                                    </span>
                                    <span className="label">Critical</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;