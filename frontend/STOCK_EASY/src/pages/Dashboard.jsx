import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  LayoutDashboard, ShoppingCart, BarChart2, MessageSquare, Globe, Users, Settings, Bell, LogOut,
  ChevronDown, Search, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Wallet, Package, Menu
} from "lucide-react";
import "./Dashboard.css";

// API Config
const API_BASE_URL = "https://stockeasy-backend-qi9b.onrender.com";

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

// --- Sub-Components ---

const Sidebar = ({ isCollapsed, toggleCollapse, onNavigate }) => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Analytics');

  const handleNav = (label, path, sectionId) => {
    setActiveItem(label);
    if (path) {
      navigate(path);
    } else if (sectionId) {
      onNavigate(sectionId);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon" onClick={toggleCollapse} style={{ cursor: 'pointer' }}>
          <LayoutDashboard size={20} />
        </div>
        {!isCollapsed && <span>Develop</span>}
      </div>

      <div className="nav-links">
        <div
          className={`nav-item ${activeItem === 'Home' ? 'active' : ''}`}
          onClick={() => handleNav('Home', '/homepage')}
          title="Home"
        >
          <LayoutDashboard size={20} />
          {!isCollapsed && <span>Home</span>}
        </div>

        <div
          className={`nav-item ${activeItem === 'Dashboard' ? 'active' : ''}`}
          onClick={() => handleNav('Dashboard', '/dashboard')}
          title="Dashboard"
        >
          <Activity size={20} />
          {!isCollapsed && <span>Dashboard</span>}
        </div>

        {/* Wallet Removed */}

        <div
          className={`nav-item ${activeItem === 'Landing' ? 'active' : ''}`}
          onClick={() => handleNav('Landing', '/')}
          title="Landing Page"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Landing Page</span>}
        </div>
      </div>


      <div className="nav-bottom">
        {/* Settings and Exit removed as requested */}
      </div>
    </aside>
  );
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

const ActiveStatusCard = ({ data }) => (
  <div className="card summary-card active-dark" style={{ height: 'auto', minHeight: '160px' }}>
    <div className="summary-header" style={{ marginBottom: '1rem' }}>
      <span>System Status</span>
      {/* View all removed */}
    </div>

    <div className="active-status-grid">
      <div className="status-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>AI Agent</span>
        </div>
        <span style={{ fontSize: '0.9rem', color: '#10b981' }}>Active</span>
      </div>
      <div className="status-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={14} color="#8b5cf6" />
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>Network</span>
        </div>
        <span style={{ fontSize: '0.9rem', color: '#8b5cf6' }}>Polygon Amoy</span>
      </div>
      <div className="status-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={14} color="#3b82f6" />
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>SKUs</span>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{data?.active_skus_processed || 0}</span>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className, actionElement, style }) => (
  <div className={`card ${className}`} style={style}>
    <div className="summary-header" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{title}</h3>
      {actionElement ? actionElement : (
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span>Last week</span>
          <ChevronDown size={14} />
        </div>
      )}
    </div>
    {children}
  </div>
);

// --- Main Component ---

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showAllDecisions, setShowAllDecisions] = useState(false);

  // Refs for scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchAgentData = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
  }, [fetchAgentData]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

    const budgetPercent = ((data.total_spent / data.monthly_budget) * 100).toFixed(1);

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

  if (loading || !data) {
    return (
      <div className="dashboard-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
        onNavigate={scrollToSection}
      />

      <main className={`main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {/* Header */}
        <header className="top-header">
          <div className="welcome-text">
            <h1>Hello, Admin welcome back</h1>
            <p>Here is your inventory overview for today</p>
          </div>

          <div className="header-actions">
            {/* Search Bar Removed */}
            <div className="user-profile">
              <div className="user-avatar"></div>
              <span>Admin User</span>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">

          {/* Row 1: Summary Stats (Wallet Section) */}
          <div id="wallet-section" style={{ display: 'contents' }}>
            <StatCard
              title="Total Budget"
              value={`₹${data.monthly_budget?.toLocaleString()}`}
            />
            <StatCard
              title="Total Spent"
              value={`₹${data.total_spent?.toLocaleString()}`}
            />
            <StatCard
              title="Remaining"
              value={`₹${data.budget_remaining?.toLocaleString()}`}
            />
            <ActiveStatusCard data={data} />
          </div>

          {/* Row 2: Charts Middle (Analytics Section) */}
          <div id="analytics-section" style={{ display: 'contents' }}>
            {/* Main Bar Chart (Category Restock) */}
            <ChartCard title="Restock by Category (Quantity)" className="chart-section-large">
              <div className="chart-container-responsive" style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.categoryData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
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