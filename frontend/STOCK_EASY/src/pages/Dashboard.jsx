import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  LayoutDashboard, ShoppingCart, BarChart2, MessageSquare, Globe, Users, Settings, Bell, LogOut,
  ChevronDown, Search, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Wallet, Package, Menu, TrendingUp, X
} from "lucide-react";
import "./Dashboard.css";

// API Config
const rawUrl = import.meta.env.VITE_BACKEND_URL || "https://stockeasy-backend-qi9b.onrender.com";
const API_BASE_URL = rawUrl.replace(/\/$/, ""); // Strip trailing slash

// Theme Colors
const COLORS = {
  primary: "#10b981", // Green
  secondary: "#3b82f6", // Blue
  accent: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  chartColors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"]
};

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="card summary-card">
    <div className="summary-header">
      <span>{title}</span>
      <MoreHorizontal size={16} />
    </div>
    <div>
      <h3 className="summary-value">{value}</h3>
    </div>
  </div>
);

const ActiveStatusCard = ({ data, config }) => (
  <div className="card summary-card">
    <div className="summary-header">
      <span>System Status</span>
    </div>
    <div style={{
      maxHeight: '180px',
      overflowY: 'auto',
      paddingRight: '0.5rem',
      scrollbarWidth: 'none', /* Firefox */
      msOverflowStyle: 'none'  /* IE and Edge */
    }}
      className="hide-scrollbar"
    >
      <div className="status-row" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={14} color="#3b82f6" />
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>Active SKUs</span>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{data?.active_skus_processed || 0}</span>
      </div>
      {config && (
        <>
          <div className="status-row" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={14} color="#10b981" />
              <span style={{ fontSize: '0.9rem', color: '#fff' }}>Buffer</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{config.bufferStock}d</span>
          </div>
          <div className="status-row" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={14} color="#f59e0b" />
              <span style={{ fontSize: '0.9rem', color: '#fff' }}>Min Demand</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{config.minDemand}</span>
          </div>
        </>
      )}
      <div className="status-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>Network</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#8b5cf6' }}>Polygon</span>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className, actionElement, style }) => (
  <div className={`card ${className}`} style={{ display: 'flex', flexDirection: 'column', ...style }}>
    <div className="summary-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{title}</h3>
      {actionElement ? actionElement : (
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span>Last week</span>
          <ChevronDown size={14} />
        </div>
      )}
    </div>
    <div className="chart-card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '250px' }}>
      {children}
    </div>
  </div>
);

// --- Main Component ---

function Dashboard() {
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null); // Add config state
  const [dashboardStats, setDashboardStats] = useState(null); // Actual budget usage
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing StockEasy Engine...");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllDecisions, setShowAllDecisions] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Track window size for responsive chart height
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Dynamic Loading Messages for Render Cold Starts
    let loadingTimer1, loadingTimer2;
    if (loading) {
      loadingTimer1 = setTimeout(() => {
        setLoadingMessage("Waking up backend (Render Free Tier can take ~50s)...");
      }, 5000);
      loadingTimer2 = setTimeout(() => {
        setLoadingMessage("Almost there! Optimizing inventory models...");
      }, 30000);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(loadingTimer1);
      clearTimeout(loadingTimer2);
    };
  }, [loading]);

  const isMobile = windowWidth < 768;

  // Refs for scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch configuration from Control Panel and dashboard stats
  const fetchConfig = useCallback(async () => {
    try {
      // Fetch config
      const configRes = await fetch(`${API_BASE_URL}/api/agent/config`);
      if (configRes.ok) {
        const json = await configRes.json();
        if (json?.config) {
          setConfig(json.config);
        }
      }

      // Fetch actual budget stats (real spent amount)
      const statsRes = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson?.aiStatus) {
          setDashboardStats(statsJson.aiStatus);
        }
      }
    } catch (err) {
      console.warn("Could not fetch config/stats:", err);
    }
  }, []);

  const fetchAgentData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_BASE_URL}/restock-items`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData(true); // Initial load with spinner
    fetchConfig();

    // 📡 WebSocket for Instant Updates (Professional Feel)
    const getWsUrl = (baseUrl) => {
      try {
        const url = new URL(baseUrl);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.pathname = url.pathname.replace(/\/$/, "") + "/ws";
        return url.toString();
      } catch (e) {
        return baseUrl.replace("http", "ws") + "/ws";
      }
    };

    const wsUrl = getWsUrl(API_BASE_URL);
    console.log("🔌 Attempting WebSocket connection to:", wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      if (event.data === "refresh_dashboard") {
        console.log("🚀 Real-time update received!");
        fetchAgentData(false); // Update without flashing
        fetchConfig();
      }
    };

    // 🔄 Slower Fallback Polling (60 seconds)
    const pollInterval = setInterval(() => {
      fetchAgentData(false);
      fetchConfig();
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      socket.close();
    };
  }, [fetchAgentData, fetchConfig]);

  const chartData = useMemo(() => {
    if (!data) return null;

    // Process data similar to before
    const supplierData = Object.entries(data.supplier_spend || {}).map(([key, val]) => ({
      name: key, value: val
    }));

    const categoryMap = {};
    data.decisions.forEach(d => {
      if (!categoryMap[d.category]) categoryMap[d.category] = { count: 0, quantity: 0 };
      categoryMap[d.category].quantity += d.restock_quantity;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, { quantity }]) => ({ name: name.substring(0, 10), quantity }))
      .sort((a, b) => b.quantity - a.quantity).slice(0, 7);

    const stockDemandData = data.decisions.slice(0, 8).map(d => ({
      name: d.product.substring(0, 10),
      stock: d.current_stock,
      demand: d.predicted_7d_demand
    }));

    const budgetUsed = dashboardStats?.budgetUsed || 0;
    const monthlyBudget = dashboardStats?.monthlyBudget || config?.monthlyBudget || data.monthly_budget || 0;
    const budgetPercent = ((budgetUsed / monthlyBudget) * 100).toFixed(1);

    // Priority distribution
    const priorityMap = { 1: 0, 2: 0, 3: 0 };
    data.decisions.forEach((d) => {
      priorityMap[d.priority]++;
    });

    const priorityData = [
      { name: "Low (1)", value: priorityMap[1], fill: COLORS.priority?.[0] || "#4ade80" }, // Fallback colors if COLORS.priority undefined
      { name: "Medium (2)", value: priorityMap[2], fill: COLORS.priority?.[1] || "#fbbf24" },
      { name: "High (3)", value: priorityMap[3], fill: COLORS.priority?.[2] || "#f87171" },
    ];

    return { supplierData, categoryData, stockDemandData, budgetPercent, priorityData };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="dashboard-container" style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="loading-spinner"></div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{loadingMessage}</p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>This might take a moment on the first visit.</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', padding: '2rem' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Connection Error</h2>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            Could not connect to the backend engine at:<br />
            <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '0.5rem' }}>{API_BASE_URL}</code>
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchAgentData(true);
              fetchConfig();
            }}
            className="cp-save-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Retry Connection
          </button>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '1rem' }}>
            If this persists, ensures your backend is running and the URL is correct in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`dashboard-container ${mobileMenuOpen ? 'menu-open' : ''}`}>
      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-brand">
          <Link to="/" className="dashboard-brand-name">StockEasy</Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="dashboard-nav-links">
          <Link to="/" className="dashboard-nav-link">Home</Link>
          <Link to="/dashboard" className="dashboard-nav-link active">Dashboard</Link>
          <Link to="/control-panel" className="dashboard-nav-link">Control Panel</Link>
        </div>

        <div className="dashboard-nav-actions">
          {/* Mobile Menu Toggle */}
          <button className="dashboard-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`dashboard-mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="dashboard-mobile-nav-links">
            <Link to="/" className="dashboard-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/dashboard" className="dashboard-mobile-nav-link active" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/control-panel" className="dashboard-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Control Panel</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="welcome-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>Welcome back</h1>
              <div className="live-indicator-badge" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                marginTop: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#10b981',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px #10b981',
                  animation: 'pulse 2s infinite'
                }}></div>
                LIVE
              </div>
            </div>
            <p>Here is your inventory overview for today</p>
          </div>

          <div className="header-actions">
            {/* Search Bar Removed */}
            {/* User Profile Removed */}
          </div>
        </header>

        <div className="dashboard-grid">

          {/* Row 1: Summary Stats (Wallet Section) */}
          <div id="wallet-section" style={{ display: 'contents' }}>
            <StatCard
              title="Total Budget"
              value={`₹${(dashboardStats?.monthlyBudget || config?.monthlyBudget || data.monthly_budget || 0).toLocaleString()}`}
            />
            <StatCard
              title="Total Spent"
              value={`₹${(dashboardStats?.budgetUsed || 0).toLocaleString()}`}
            />
            <StatCard
              title="Remaining"
              value={`₹${(dashboardStats?.budgetRemaining || ((dashboardStats?.monthlyBudget || config?.monthlyBudget || data.monthly_budget || 0) - (dashboardStats?.budgetUsed || 0))).toLocaleString()}`}
            />
            <ActiveStatusCard data={data} config={config} />
          </div>

          {/* Row 2: Charts Middle (Analytics Section) */}
          <div id="analytics-section" style={{ display: 'contents' }}>
            {/* Main Bar Chart (Category Restock) */}
            <ChartCard title="Restock by Category (Quantity)" className="chart-section-large">
              <div className="chart-container-responsive" style={{ width: '100%', height: isMobile ? 220 : 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.categoryData} barSize={isMobile ? 24 : 40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                      dy={10}
                      interval={0}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Right Col: Pie Chart & Priority */}
            <div className="side-charts-col">
              <ChartCard title="Supplier Spend" className="small-chart-card" actionElement={<></>}>
                <div style={{ height: '200px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.supplierData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.supplierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text overlay */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Total</span>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>100%</div>
                  </div>
                </div>
              </ChartCard>

              {/* Priority Distribution Chart */}
              <ChartCard title="Priority Distribution" className="small-chart-card" actionElement={<></>} style={{ minHeight: '380px' }}>
                <div style={{ height: '200px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {chartData.priorityData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.fill }}></div>
                        <span style={{ color: "#9ca3af" }}>{entry.name}</span>
                      </div>
                      <span style={{ color: "white" }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Row 3: Bottom Section */}

          {/* Decisions List */}
          <ChartCard
            title="Recent Decisions"
            className="bottom-section-wide"
            actionElement={
              <div
                style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', color: '#10b981' }}
                onClick={() => setShowAllDecisions(!showAllDecisions)}
              >
                <span>{showAllDecisions ? 'Show less' : 'View all'}</span>
                <ChevronDown size={14} style={{ transform: showAllDecisions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: showAllDecisions ? '400px' : 'auto', overflowY: showAllDecisions ? 'auto' : 'hidden' }}>
              {data.decisions.slice(0, showAllDecisions ? undefined : 4).map((d, i) => (
                <div key={i} className="transaction-item">
                  <div className="t-icon">
                    <Package size={20} color={COLORS.chartColors[i % 4]} />
                  </div>
                  <div className="t-info">
                    <span className="t-name">{d.product}</span>
                    <span className="t-date">{d.supplier_id} • Priority: {d.priority}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="t-amount" style={{ color: '#ef4444' }}>-₹{d.total_cost.toLocaleString()}</span>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{d.restock_quantity} units</div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Stock vs Demand (Wave/Area Chart style) */}
          <ChartCard title="Stock vs 7-Day Demand" className="bottom-side-col" actionElement={<></>}>

            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.stockDemandData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Area type="monotone" dataKey="stock" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStock)" />
                <Area type="monotone" dataKey="demand" stroke="#ec4899" fillOpacity={1} fill="url(#colorDemand)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></div> Current Stock
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899' }}></div> Demand
              </div>
            </div>
          </ChartCard>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;