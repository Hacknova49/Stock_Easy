import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Activity
} from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import "./Dashboard.css";
//comment this if not deployed
const API_BASE_URL = "https://stockeasy-backend-qi9b.onrender.com";

// Chart colors
const COLORS = {
  suppliers: ["#8b5cf6", "#06b6d4", "#f59e0b"],
  priority: ["#4ade80", "#fbbf24", "#f87171"],
  categories: ["#8b5cf6", "#06b6d4", "#f59e0b", "#4ade80", "#f87171", "#ec4899", "#84cc16", "#6366f1"],
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAgentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch(`${API_BASE_URL}/restock-items`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Backend service is slow to respond. This may be due to server cold start. Try again in a few moments.');
      } else {
        setError(`Connection error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
    // Only set up polling if initial fetch succeeds
    const setupPolling = () => {
      const interval = setInterval(fetchAgentData, 120000); // Increased to 2 minutes
      return () => clearInterval(interval);
    };
    
    return () => {
      // Cleanup will be handled by the polling interval
    };
  }, [fetchAgentData]);

  // Process data for charts (memoized)
  const chartData = useMemo(() => {
    if (!data) return null;

    const supplierSpendData = Object.entries(data.supplier_spend || {}).map(([key, value]) => ({
      name: key,
      value: value,
      displayValue: `₹${value.toLocaleString()}`,
    }));

    // Category distribution
    const categoryMap = {};
    data.decisions.forEach((d) => {
      if (!categoryMap[d.category]) {
        categoryMap[d.category] = { count: 0, quantity: 0, cost: 0 };
      }
      categoryMap[d.category].count++;
      categoryMap[d.category].quantity += d.restock_quantity;
      categoryMap[d.category].cost += d.total_cost;
    });

    const categoryData = Object.entries(categoryMap)
      .map(([name, { quantity }]) => ({ name: name.substring(0, 15), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    // Priority distribution
    const priorityMap = { 1: 0, 2: 0, 3: 0 };
    data.decisions.forEach((d) => {
      priorityMap[d.priority]++;
    });

    const priorityData = [
      { name: "Low (1)", value: priorityMap[1], fill: COLORS.priority[0] },
      { name: "Medium (2)", value: priorityMap[2], fill: COLORS.priority[1] },
      { name: "High (3)", value: priorityMap[3], fill: COLORS.priority[2] },
    ];

    // Stock vs Demand comparison (top 8)
    const stockDemandData = data.decisions
      .slice(0, 8)
      .map((d) => ({
        name: d.product.substring(0, 12),
        stock: d.current_stock,
        demand: d.predicted_7d_demand,
      }));

    // Budget percentage
    const budgetPercentage = ((data.total_spent / data.monthly_budget) * 100).toFixed(1);

    return {
      supplierSpendData,
      categoryData,
      priorityData,
      stockDemandData,
      budgetPercentage
    };
  }, [data]);

  // Priority label helper
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 3: return { label: "HIGH", class: "high" };
      case 2: return { label: "MEDIUM", class: "medium" };
      default: return { label: "LOW", class: "low" };
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <p className="error-text">{error}</p>
        <div className="error-actions">
          <button onClick={fetchAgentData} className="retry-button" disabled={loading}>
            {loading ? 'Retrying...' : 'Retry'}
          </button>
          <button onClick={() => window.location.reload()} className="refresh-button">
            Refresh Page
          </button>
        </div>
        <div className="error-tips">
          <p className="error-tip">💡 Tips:</p>
          <ul className="error-tip-list">
            <li>The backend may be starting up (cold start)</li>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
      </div>
    );
  }

  // Debug fallback - ensure something always renders
  if (loading && !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading AI Agent Data...</p>
        <p className="loading-subtitle">Connecting to backend service...</p>
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <p style={{ color: '#fbbf24', fontSize: '0.9rem' }}>Debug: Loading state active</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading AI Agent Data...</p>
        <p className="loading-subtitle">Connecting to backend service...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <AppNavbar />

      <div style={{ paddingTop: "80px" }}>
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Live Agent Dashboard</h1>
          <p className="dashboard-subtitle">
            AI-powered inventory management • Cycle: {data.cycle_id?.substring(0, 10)}
          </p>
        </div>

        {/* Status Cards */}
        <div className="status-grid">
          <div className="status-card">
            <p className="status-label">AI Agent</p>
            <p className="status-value">ACTIVE</p>
          </div>
          <div className="status-card">
            <p className="status-label">Session Key</p>
            <p className="status-value">ACTIVE</p>
          </div>
          <div className="status-card">
            <p className="status-label">Network</p>
            <p className="status-value">Polygon Amoy</p>
          </div>
          <div className="status-card">
            <p className="status-label">SKUs Processed</p>
            <p className="status-value">{data.active_skus_processed}</p>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="budget-card">
          <div className="budget-header">
            <h2 className="budget-title">
              <DollarSign size={20} style={{ color: "#4ade80" }} />
              Budget Overview
            </h2>
            <span className="budget-period">Monthly Cycle</span>
          </div>

          <div className="budget-stats">
            <div className="budget-stat">
              <p className="budget-stat-label">Total Budget</p>
              <p className="budget-stat-value total">₹{data.monthly_budget?.toLocaleString()}</p>
            </div>
            <div className="budget-stat">
              <p className="budget-stat-label">Total Spent</p>
              <p className="budget-stat-value spent">₹{data.total_spent?.toLocaleString()}</p>
            </div>
            <div className="budget-stat">
              <p className="budget-stat-label">Remaining</p>
              <p className="budget-stat-value remaining">₹{data.budget_remaining?.toLocaleString()}</p>
            </div>
          </div>

          <div className="budget-progress-container">
            <div className="budget-progress-label">
              <span>Budget Utilization</span>
              <span>{chartData.budgetPercentage}%</span>
            </div>
            <div className="budget-progress-bar">
              <div
                className={`budget-progress-fill ${chartData.budgetPercentage > 90 ? "danger" : chartData.budgetPercentage > 70 ? "warning" : ""
                  }`}
                style={{ width: `${Math.min(chartData.budgetPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Supplier Spend Pie Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <PieIcon size={18} className="chart-icon" />
              Supplier Spend Distribution
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.supplierSpendData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, displayValue }) => `${name}: ${displayValue}`}
                    labelLine={{ stroke: "#8080a0" }}
                  >
                    {chartData.supplierSpendData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.suppliers[index % COLORS.suppliers.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Spent"]}
                    contentStyle={{
                      background: "rgba(20, 20, 50, 0.95)",
                      border: "1px solid rgba(138, 100, 255, 0.3)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">
              <Activity size={18} className="chart-icon" />
              Priority Distribution
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#8080a0" }}
                  >
                    {chartData.priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, "Items"]}
                    contentStyle={{
                      background: "rgba(20, 20, 50, 0.95)",
                      border: "1px solid rgba(138, 100, 255, 0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <BarChart3 size={18} className="chart-icon" />
              Restock by Category
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 180, 0.2)" />
                  <XAxis type="number" stroke="#8080a0" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#8080a0"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(138, 100, 255, 0.1)" }}
                  />
                  <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock vs Demand */}
          <div className="chart-card">
            <h3 className="chart-title">
              <TrendingUp size={18} className="chart-icon" />
              Stock vs 7-Day Demand
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.stockDemandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 180, 0.2)" />
                  <XAxis dataKey="name" stroke="#8080a0" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8080a0" />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(138, 100, 255, 0.1)" }}
                  />
                  <Legend />
                  <Bar dataKey="stock" name="Current Stock" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demand" name="Predicted Demand" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Decisions Section */}
        <div className="decisions-section">
          <h2 className="decisions-title">
            <Package size={24} style={{ marginRight: "0.5rem", color: "#a0a0ff" }} />
            AI Restock Decisions ({data.decisions.length} items)
          </h2>

          <div className="decisions-grid">
            {data.decisions.slice(0, 6).map((d, index) => {
              const priority = getPriorityLabel(d.priority);
              return (
                <div key={index} className="decision-card">
                  <div className="decision-header">
                    <h3 className="decision-product">{d.product}</h3>
                    <span className={`decision-priority ${priority.class}`}>{priority.label}</span>
                  </div>

                  <div className="decision-details">
                    <div className="decision-detail">
                      <span className="decision-detail-label">Supplier</span>
                      <span className="decision-detail-value">{d.supplier_id}</span>
                    </div>
                    <div className="decision-detail">
                      <span className="decision-detail-label">Category</span>
                      <span className="decision-detail-value">{d.category}</span>
                    </div>
                    <div className="decision-detail">
                      <span className="decision-detail-label">Current Stock</span>
                      <span className="decision-detail-value">{d.current_stock} units</span>
                    </div>
                    <div className="decision-detail">
                      <span className="decision-detail-label">7-Day Demand</span>
                      <span className="decision-detail-value">{d.predicted_7d_demand} units</span>
                    </div>
                    <div className="decision-detail">
                      <span className="decision-detail-label">Restock Qty</span>
                      <span className="decision-detail-value highlight">{d.restock_quantity} units</span>
                    </div>
                    <div className="decision-detail">
                      <span className="decision-detail-label">Total Cost</span>
                      <span className="decision-detail-value highlight">₹{d.total_cost.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="decision-reason">{d.reason}</p>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;