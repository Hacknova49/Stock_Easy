import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Wallet,
    BarChart3,
    Users,
    MessageSquare,
    Settings,
    HelpCircle,
    Search,
    Bell,
    Save,
    Pencil,
    Check,
    TrendingUp,
    TrendingDown,
    Package,
    AlertTriangle,
    Activity,
    ChevronRight,
    ChevronLeft,
    MoreVertical,
    Zap,
    Home,
    PanelLeftClose,
    PanelLeft
} from "lucide-react";
import "./controlPanel.css";

const API_BASE_URL = "https://stockeasy-backend-qi9b.onrender.com";

// Default configuration
const defaultConfig = {
    monthlyBudget: 500000,
    monthlyUsed: 18420,
    monthlyTotal: 500000,
    bufferStock: 7,
    minDemand: 5,
    restockBudgetLimit: 25,
    prioritySplit: {
        high: 50,
        medium: 30,
        low: 20,
    },
    suppliers: [
        { id: "SUP1", name: "TechSupply Co.", address: "0x4C2c...6Ed2", status: "Allowed", allocation: 30 },
        { id: "SUP2", name: "GlobalParts Ltd.", address: "0x7B3d...9Af1", status: "Allowed", allocation: 40 },
        { id: "SUP3", name: "FastStock Inc.", address: "0x2E8f...4Cd3", status: "Allowed", allocation: 30 },
    ],
    supplierBudgetSplit: {
        SUP1: 30,
        SUP2: 40,
        SUP3: 30,
    },
};

// Mock notifications data
const mockNotifications = [
    { id: 1, type: "success", message: "Budget updated successfully", time: "Just now" },
    { id: 2, type: "warning", message: "Low stock alert: 5 items", time: "5 mins ago" },
    { id: 3, type: "info", message: "AI restock completed", time: "1 hour ago" },
    { id: 4, type: "success", message: "Supplier SUP2 verified", time: "3 hours ago" },
];

// Mock activities data
const mockActivities = [
    { id: 1, action: "Budget limit changed", detail: "25% → 30%", time: "Just now", icon: "settings" },
    { id: 2, action: "177 Products restocked", detail: "Via AI agent", time: "17 mins ago", icon: "package" },
    { id: 3, action: "11 Products archived", detail: "Low demand", time: "1 Day ago", icon: "archive" },
    { id: 4, action: "Supplier removed", detail: "SUP4 revoked", time: "Feb 2, 2024", icon: "user" },
];

function ControlPanel() {
    const [config, setConfig] = useState(defaultConfig);
    const [editingSupplier, setEditingSupplier] = useState(null);

    useEffect(() => {
        async function loadConfig() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/agent/config`);
                const data = await res.json();
                if (data?.config) {
                    setConfig({
                        ...defaultConfig,
                        ...data.config,
                        prioritySplit: {
                            ...defaultConfig.prioritySplit,
                            ...(data.config.prioritySplit || {})
                        },
                        supplierBudgetSplit: {
                            ...defaultConfig.supplierBudgetSplit,
                            ...(data.config.supplierBudgetSplit || {})
                        },
                        suppliers: data.config.suppliers || defaultConfig.suppliers
                    });
                }
            } catch (e) {
                console.warn("No saved config found");
            }
        }
        loadConfig();
    }, []);

    const handleNumberInput = (field, value) => {
        const numValue = parseInt(value) || 0;
        setConfig({ ...config, [field]: numValue });
    };

    const toggleSupplierStatus = (supplierId) => {
        const updatedSuppliers = config.suppliers.map(s =>
            s.id === supplierId
                ? { ...s, status: s.status === "Allowed" ? "Revoked" : "Allowed" }
                : s
        );
        setConfig({ ...config, suppliers: updatedSuppliers });
    };

    const handleSupplierAddressChange = (supplierId, value) => {
        const updatedSuppliers = config.suppliers.map(s =>
            s.id === supplierId ? { ...s, address: value } : s
        );
        setConfig({
            ...config,
            suppliers: updatedSuppliers
        });
    };

    const toggleEditSupplier = (supplierId) => {
        setEditingSupplier(editingSupplier === supplierId ? null : supplierId);
    };

    const handleSupplierAllocationChange = (supplierId, value) => {
        const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
        const otherSuppliersTotal = config.suppliers
            .filter(s => s.id !== supplierId)
            .reduce((sum, s) => sum + s.allocation, 0);

        // Ensure total doesn't exceed 100%
        const maxAllowedValue = 100 - otherSuppliersTotal;
        const finalValue = Math.min(numValue, maxAllowedValue);

        const updatedSuppliers = config.suppliers.map(s =>
            s.id === supplierId ? { ...s, allocation: finalValue } : s
        );
        setConfig({
            ...config,
            suppliers: updatedSuppliers,
            supplierBudgetSplit: { ...config.supplierBudgetSplit, [supplierId]: finalValue }
        });
    };

    const handlePrioritySplitChange = (priority, value) => {
        const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
        const otherPrioritiesTotal = Object.entries(config.prioritySplit)
            .filter(([key]) => key !== priority)
            .reduce((sum, [, val]) => sum + val, 0);

        // Ensure total doesn't exceed 100%
        const maxAllowedValue = 100 - otherPrioritiesTotal;
        const finalValue = Math.min(numValue, maxAllowedValue);

        setConfig({
            ...config,
            prioritySplit: { ...config.prioritySplit, [priority]: finalValue }
        });
    };

    const handleRestockLimitChange = (value) => {
        const numValue = parseInt(value) || 0;
        setConfig({ ...config, restockBudgetLimit: Math.min(100, Math.max(0, numValue)) });
    };

    const saveConfigToBackend = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/agent/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error("Failed to save config");
            alert("Configuration saved successfully");
        } catch (err) {
            console.error(err);
            alert("Error saving configuration");
        }
    };

    const usagePercentage = config.monthlyBudget > 0
        ? ((config.monthlyUsed / config.monthlyBudget) * 100).toFixed(1)
        : 0;

    const quarterlyGoal = 71; // Mock quarterly goal percentage
    const activeSuppliers = config.suppliers.filter(s => s.status === "Allowed").length;

    return (
        <div className="cp-dashboard">
            {/* Main Content */}
            <main className="cp-main">
                <header className="main-header">
                    <div className="breadcrumb">
                        <span>Dashboards</span>
                        <ChevronRight size={14} />
                        <span className="current">Control Panel</span>
                    </div>
                    <div className="header-actions">
                        <span className="date-badge">Today</span>
                        <button className="icon-btn"><Bell size={18} /></button>
                        <button className="save-btn" onClick={saveConfigToBackend}>
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </header>

                <div className="main-content">
                    <h1 className="page-title">Control Panel</h1>

                    {/* Inventory Intelligence Section */}
                    <div className="inventory-intelligence-section">
                        {/* Inventory Intelligence Card */}
                        <div className="config-card">
                            <div className="config-card-header">
                                <Package size={20} className="config-icon yellow" />
                                <h3>Inventory Intelligence</h3>
                            </div>
                            <p className="config-desc">Configure safety stock levels and demand thresholds.</p>

                            <div className="config-form">
                                <div className="config-row">
                                    <label>Buffer Stock:</label>
                                    <div className="config-input-group">
                                        <input
                                            type="number"
                                            value={config.bufferStock}
                                            onChange={(e) => handleNumberInput('bufferStock', e.target.value)}
                                            min="1"
                                        />
                                        <span className="config-unit">days</span>
                                    </div>
                                </div>
                                <div className="config-row">
                                    <label>Min Demand Threshold:</label>
                                    <div className="config-input-group">
                                        <input
                                            type="number"
                                            value={config.minDemand}
                                            onChange={(e) => handleNumberInput('minDemand', e.target.value)}
                                            min="1"
                                        />
                                        <span className="config-unit">units</span>
                                    </div>
                                </div>
                                <div className="config-row">
                                    <label>Monthly Budget:</label>
                                    <div className="config-input-group">
                                        <span className="config-currency">₹</span>
                                        <input
                                            type="number"
                                            value={config.monthlyBudget}
                                            onChange={(e) => handleNumberInput('monthlyBudget', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mini Stats (Beside Inventory Intelligence) */}
                        <div className="mini-stats">
                            <div className="mini-stat-card">
                                <div className="mini-icon green">
                                    <Package size={20} />
                                </div>
                                <div className="mini-content">
                                    <span className="mini-label">Buffer Stock</span>
                                    <span className="mini-value">{config.bufferStock} days</span>
                                </div>
                            </div>
                            <div className="mini-stat-card">
                                <div className="mini-icon blue">
                                    <Activity size={20} />
                                </div>
                                <div className="mini-content">
                                    <span className="mini-label">Min Demand</span>
                                    <span className="mini-value">{config.minDemand} units</span>
                                </div>
                            </div>
                            <div className="mini-stat-card total-profit">
                                <span className="profit-label">Total Budget</span>
                                <span className="profit-value">₹{config.monthlyBudget.toLocaleString()}</span>
                                <div className="profit-chart">
                                    <svg viewBox="0 0 100 30" className="sparkline">
                                        <polyline
                                            fill="none"
                                            stroke="#4ade80"
                                            strokeWidth="2"
                                            points="0,25 20,20 40,15 60,18 80,10 100,5"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Row - Below Inventory Intelligence */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-label">Monthly Budget</span>
                            <div className="stat-value">₹{(config.monthlyBudget / 100000).toFixed(1)}L</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Budget Used</span>
                            <div className="stat-value">₹{config.monthlyUsed.toLocaleString()}</div>
                            <div className="stat-change positive">
                                <TrendingUp size={14} />
                                <span>{usagePercentage}% of total</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Quarterly Goal</span>
                            <div className="stat-value">{quarterlyGoal}%</div>
                            <div className="stat-sub">Goal: ₹15L</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Active Suppliers</span>
                            <div className="stat-value">{activeSuppliers}</div>
                            <div className="stat-change positive">
                                <TrendingUp size={14} />
                                <span>All operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Section - Below Stats Row */}
                    <div className="supplier-section">
                        {/* Supplier List */}
                        <div className="supplier-table-card">
                            <div className="card-header">
                                <h3>Supplier List</h3>
                                <button className="more-btn"><MoreVertical size={16} /></button>
                            </div>
                            <table className="supplier-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {config.suppliers.map(supplier => (
                                        <tr key={supplier.id}>
                                            <td>
                                                <div className="supplier-info">
                                                    <div className="supplier-avatar">{supplier.id.slice(-1)}</div>
                                                    <div>
                                                        <span className="supplier-name">{supplier.name || supplier.id}</span>
                                                        {editingSupplier === supplier.id ? (
                                                            <input
                                                                type="text"
                                                                className="address-input"
                                                                value={supplier.address}
                                                                onChange={(e) => handleSupplierAddressChange(supplier.id, e.target.value)}
                                                            />
                                                        ) : (
                                                            <span className="supplier-address">{supplier.address}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className={`status-badge ${supplier.status.toLowerCase()}`}
                                                    onClick={() => toggleSupplierStatus(supplier.id)}
                                                >
                                                    {supplier.status}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => toggleEditSupplier(supplier.id)}
                                                >
                                                    {editingSupplier === supplier.id ? <Check size={14} /> : <Pencil size={14} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Supplier Budget Split Card */}
                        <div className="config-card">
                            <div className="config-card-header">
                                <Wallet size={20} className="config-icon green" />
                                <h3>Supplier Budget Split</h3>
                            </div>
                            <p className="config-desc">Allocate what percentage of your monthly budget goes to each supplier.</p>

                            <div className="budget-split-list">
                                {config.suppliers.map(supplier => (
                                    <div key={supplier.id} className="budget-split-row">
                                        <span className="split-supplier-id">{supplier.id}</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={supplier.allocation}
                                            onChange={(e) => handleSupplierAllocationChange(supplier.id, e.target.value)}
                                            className="supplier-slider"
                                        />
                                        <span className="split-value">{supplier.allocation}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="split-total">
                                <span>Total:</span>
                                <span className={config.suppliers.reduce((a, b) => a + b.allocation, 0) === 100 ? 'valid' : 'invalid'}>
                                    {config.suppliers.reduce((a, b) => a + b.allocation, 0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Budget Section - Priority Split on Left, Budget Overview on Right */}
                    <div className="budget-section">
                        {/* Priority Split Card */}
                        <div className="config-card">
                            <div className="config-card-header">
                                <BarChart3 size={20} className="config-icon purple" />
                                <h3>Priority Budget Split</h3>
                            </div>
                            <p className="config-desc">Set how the cycle budget is distributed across priority levels.</p>

                            <div className="priority-split-form">
                                <div className="priority-split-row">
                                    <span className="priority-label-card">
                                        <span className="dot high"></span>High Priority
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={config.prioritySplit.high}
                                        onChange={(e) => handlePrioritySplitChange('high', e.target.value)}
                                        className="priority-slider-card high"
                                    />
                                    <span className="priority-value-card">{config.prioritySplit.high}%</span>
                                </div>
                                <div className="priority-split-row">
                                    <span className="priority-label-card">
                                        <span className="dot medium"></span>Medium Priority
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={config.prioritySplit.medium}
                                        onChange={(e) => handlePrioritySplitChange('medium', e.target.value)}
                                        className="priority-slider-card medium"
                                    />
                                    <span className="priority-value-card">{config.prioritySplit.medium}%</span>
                                </div>
                                <div className="priority-split-row">
                                    <span className="priority-label-card">
                                        <span className="dot low"></span>Low Priority
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={config.prioritySplit.low}
                                        onChange={(e) => handlePrioritySplitChange('low', e.target.value)}
                                        className="priority-slider-card low"
                                    />
                                    <span className="priority-value-card">{config.prioritySplit.low}%</span>
                                </div>
                            </div>
                            <div className="split-total">
                                <span>Total:</span>
                                <span className={Object.values(config.prioritySplit).reduce((a, b) => a + b, 0) === 100 ? 'valid' : 'invalid'}>
                                    {Object.values(config.prioritySplit).reduce((a, b) => a + b, 0)}%
                                </span>
                            </div>
                        </div>

                        {/* Budget Overview */}
                        <div className="budget-overview-card">
                            <div className="card-header">
                                <h3>Budget Overview</h3>
                                <button className="more-btn"><MoreVertical size={16} /></button>
                            </div>
                            <div className="budget-content">
                                <div className="donut-chart">
                                    <svg viewBox="0 0 100 100" className="donut">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a2e1a" strokeWidth="12" />
                                        <circle
                                            cx="50" cy="50" r="40" fill="none"
                                            stroke="#4ade80" strokeWidth="12"
                                            strokeDasharray={`${config.prioritySplit.high * 2.51} 251`}
                                            strokeDashoffset="0"
                                            transform="rotate(-90 50 50)"
                                        />
                                        <circle
                                            cx="50" cy="50" r="40" fill="none"
                                            stroke="#fbbf24" strokeWidth="12"
                                            strokeDasharray={`${config.prioritySplit.medium * 2.51} 251`}
                                            strokeDashoffset={`${-config.prioritySplit.high * 2.51}`}
                                            transform="rotate(-90 50 50)"
                                        />
                                        <circle
                                            cx="50" cy="50" r="40" fill="none"
                                            stroke="#60a5fa" strokeWidth="12"
                                            strokeDasharray={`${config.prioritySplit.low * 2.51} 251`}
                                            strokeDashoffset={`${-(config.prioritySplit.high + config.prioritySplit.medium) * 2.51}`}
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <div className="donut-center">
                                        <span className="donut-value">{config.restockBudgetLimit}%</span>
                                        <span className="donut-label">Per Run</span>
                                    </div>
                                </div>
                                <div className="budget-breakdown">
                                    <div className="breakdown-header">
                                        <Wallet size={18} />
                                        <div>
                                            <span className="label">Restock Limit</span>
                                            <span className="value">₹{((config.monthlyBudget * config.restockBudgetLimit) / 100).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {/* Editable Restock Limit Slider */}
                                    <div className="restock-limit-control">
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            value={config.restockBudgetLimit}
                                            onChange={(e) => handleRestockLimitChange(e.target.value)}
                                            className="restock-slider"
                                        />
                                        <span className="restock-value">{config.restockBudgetLimit}%</span>
                                    </div>
                                    <div className="breakdown-items">
                                        <div className="breakdown-item">
                                            <span className="dot high"></span>
                                            <span className="name">High Priority</span>
                                            <span className="amount">{config.prioritySplit.high}%</span>
                                        </div>
                                        <div className="breakdown-item">
                                            <span className="dot medium"></span>
                                            <span className="name">Medium Priority</span>
                                            <span className="amount">{config.prioritySplit.medium}%</span>
                                        </div>
                                        <div className="breakdown-item">
                                            <span className="dot low"></span>
                                            <span className="name">Low Priority</span>
                                            <span className="amount">{config.prioritySplit.low}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ControlPanel;

