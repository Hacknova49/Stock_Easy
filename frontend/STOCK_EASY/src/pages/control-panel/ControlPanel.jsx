import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Wallet,
    Brain,
    Users,
    Shield,
    Bell,
    ChevronDown,
    ChevronUp,
    Save
} from "lucide-react";
import "./controlPanel.css";

// Default configuration (matching ai/default_config.py structure)
const defaultConfig = {
    monthlyBudget: 50000,
    maxPerTransaction: 1000,
    dailySpendLimit: 5000,
    monthlyUsed: 18420,
    monthlyTotal: 50000,

    bufferStock: 5,
    minDailyDemand: 10,
    demandSensitivity: "Medium",
    minRestockQuantity: 5,

    suppliers: [
        { id: "SUP1", address: "0xA3F....92D", status: "Allowed", allocation: 70 },
        { id: "SUP2", address: "0x91B....33E", status: "Allowed", allocation: 20 },
        { id: "SUP3", address: "0xC7E....A1F", status: "Revoked", allocation: 10 },
    ],

    sessionDuration: "24 hours",
    autoRotateKeys: true,

    alerts: {
        dailyLimitReached: true,
        criticalStockAlert: true,
        monthlyBudgetThreshold: 80,
    }
};

function ControlPanel() {
    const [config, setConfig] = useState(defaultConfig);
    const [openDropdown, setOpenDropdown] = useState(null);

    const budgetOptions = [10000, 25000, 50000, 100000, 250000, 500000];
    const transactionOptions = [500, 1000, 2500, 5000, 10000];
    const dailyLimitOptions = [1000, 2500, 5000, 10000, 25000];
    const sessionOptions = ["1 hour", "6 hours", "12 hours", "24 hours", "48 hours", "7 days"];

    const handleDropdownToggle = (dropdownName) => {
        setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    };

    const handleSelectOption = (field, value) => {
        setConfig({ ...config, [field]: value });
        setOpenDropdown(null);
    };

    const handleNumberInput = (field, value) => {
        const numValue = parseInt(value) || 0;
        setConfig({ ...config, [field]: numValue });
    };

    const handleSensitivityChange = (level) => {
        setConfig({ ...config, demandSensitivity: level });
    };

    const handleToggle = (field) => {
        setConfig({ ...config, [field]: !config[field] });
    };

    const handleAlertToggle = (alertType) => {
        setConfig({
            ...config,
            alerts: { ...config.alerts, [alertType]: !config.alerts[alertType] }
        });
    };

    const toggleSupplierStatus = (supplierId) => {
        const updatedSuppliers = config.suppliers.map(s =>
            s.id === supplierId
                ? { ...s, status: s.status === "Allowed" ? "Revoked" : "Allowed" }
                : s
        );
        setConfig({ ...config, suppliers: updatedSuppliers });
    };

    const usagePercentage = ((config.monthlyUsed / config.monthlyTotal) * 100).toFixed(0);

    return (
        <div className="control-panel-page">
            {/* Header */}
            <div className="cp-header">
                <Link to="/homepage" className="back-button">
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                </Link>
                <div className="cp-title-section">
                    <h1 className="cp-title">Control Panel</h1>
                    <p className="cp-subtitle">Configure how the AI manages stock & spending.</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="cp-grid">
                {/* Budget & Spending Limits */}
                <div className="cp-card">
                    <h2 className="cp-card-title">
                        <Wallet size={20} className="card-icon gold" />
                        Budget & Spending Limits
                    </h2>

                    <div className="cp-form-group">
                        <label>Monthly Budget</label>
                        <div className="cp-dropdown-wrapper">
                            <button
                                className="cp-dropdown-trigger"
                                onClick={() => handleDropdownToggle('monthlyBudget')}
                            >
                                <span className="currency">₹</span>
                                <span className="value">{config.monthlyBudget.toLocaleString()}</span>
                                <ChevronDown size={16} className={`chevron ${openDropdown === 'monthlyBudget' ? 'open' : ''}`} />
                            </button>
                            {openDropdown === 'monthlyBudget' && (
                                <div className="cp-dropdown-menu">
                                    {budgetOptions.map(opt => (
                                        <div
                                            key={opt}
                                            className="cp-dropdown-item"
                                            onClick={() => handleSelectOption('monthlyBudget', opt)}
                                        >
                                            ₹{opt.toLocaleString()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cp-form-group">
                        <label>Max per Transaction</label>
                        <div className="cp-dropdown-wrapper">
                            <button
                                className="cp-dropdown-trigger"
                                onClick={() => handleDropdownToggle('maxPerTransaction')}
                            >
                                <span className="currency">₹</span>
                                <span className="value">{config.maxPerTransaction.toLocaleString()}</span>
                                <ChevronDown size={16} className={`chevron ${openDropdown === 'maxPerTransaction' ? 'open' : ''}`} />
                            </button>
                            {openDropdown === 'maxPerTransaction' && (
                                <div className="cp-dropdown-menu">
                                    {transactionOptions.map(opt => (
                                        <div
                                            key={opt}
                                            className="cp-dropdown-item"
                                            onClick={() => handleSelectOption('maxPerTransaction', opt)}
                                        >
                                            ₹{opt.toLocaleString()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cp-form-group">
                        <label>Daily Spend Limit</label>
                        <div className="cp-dropdown-wrapper">
                            <button
                                className="cp-dropdown-trigger"
                                onClick={() => handleDropdownToggle('dailySpendLimit')}
                            >
                                <span className="currency">₹</span>
                                <span className="value">{config.dailySpendLimit.toLocaleString()}</span>
                                <ChevronDown size={16} className={`chevron ${openDropdown === 'dailySpendLimit' ? 'open' : ''}`} />
                            </button>
                            {openDropdown === 'dailySpendLimit' && (
                                <div className="cp-dropdown-menu">
                                    {dailyLimitOptions.map(opt => (
                                        <div
                                            key={opt}
                                            className="cp-dropdown-item"
                                            onClick={() => handleSelectOption('dailySpendLimit', opt)}
                                        >
                                            ₹{opt.toLocaleString()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cp-progress-section">
                        <div className="cp-progress-label">
                            <span>This Month:</span>
                            <span>₹{config.monthlyUsed.toLocaleString()} / ₹{config.monthlyTotal.toLocaleString()} used</span>
                        </div>
                        <div className="cp-progress-bar">
                            <div
                                className="cp-progress-fill"
                                style={{ width: `${usagePercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Inventory Intelligence */}
                <div className="cp-card">
                    <h2 className="cp-card-title">
                        <Brain size={20} className="card-icon yellow" />
                        Inventory Intelligence
                    </h2>

                    <div className="cp-form-row">
                        <label>Buffer Stock:</label>
                        <div className="cp-number-input">
                            <input
                                type="number"
                                value={config.bufferStock}
                                onChange={(e) => handleNumberInput('bufferStock', e.target.value)}
                                min="1"
                            />
                            <span className="unit">days</span>
                        </div>
                    </div>

                    <div className="cp-form-row">
                        <label>Min Daily Demand:</label>
                        <div className="cp-number-input">
                            <input
                                type="number"
                                value={config.minDailyDemand}
                                onChange={(e) => handleNumberInput('minDailyDemand', e.target.value)}
                                min="1"
                            />
                            <span className="unit">units/day</span>
                        </div>
                    </div>

                    <div className="cp-form-row">
                        <label>Demand Sensitivity:</label>
                        <div className="cp-toggle-group">
                            {["Low", "Medium", "High"].map(level => (
                                <button
                                    key={level}
                                    className={`cp-toggle-btn ${config.demandSensitivity === level ? 'active' : ''}`}
                                    onClick={() => handleSensitivityChange(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cp-form-row">
                        <label>Min Restock Quantity:</label>
                        <div className="cp-number-input">
                            <input
                                type="number"
                                value={config.minRestockQuantity}
                                onChange={(e) => handleNumberInput('minRestockQuantity', e.target.value)}
                                min="1"
                            />
                            <span className="unit">units</span>
                        </div>
                    </div>
                </div>

                {/* Supplier Configuration */}
                <div className="cp-card">
                    <h2 className="cp-card-title">
                        <Users size={20} className="card-icon blue" />
                        Supplier Configuration
                    </h2>

                    <div className="cp-supplier-list">
                        {config.suppliers.map(supplier => (
                            <div key={supplier.id} className="cp-supplier-row">
                                <span className="supplier-id">{supplier.id}</span>
                                <span className="supplier-address">{supplier.address}</span>
                                <button
                                    className={`supplier-status ${supplier.status.toLowerCase()}`}
                                    onClick={() => toggleSupplierStatus(supplier.id)}
                                >
                                    {supplier.status}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cp-allocation-section">
                        <div className="cp-allocation-label">
                            <span>Budget Allocation:</span>
                            <span className="allocation-value">SUP1 <span className="allocation-bar"><span style={{ width: '70%' }}></span></span> 70%</span>
                        </div>
                    </div>
                </div>

                {/* Session & Safety Controls */}
                <div className="cp-card">
                    <h2 className="cp-card-title">
                        <Shield size={20} className="card-icon orange" />
                        Session & Safety Controls
                    </h2>

                    <div className="cp-form-row">
                        <label>Session Duration:</label>
                        <div className="cp-dropdown-wrapper small">
                            <button
                                className="cp-dropdown-trigger"
                                onClick={() => handleDropdownToggle('sessionDuration')}
                            >
                                <span className="value">{config.sessionDuration}</span>
                                <ChevronDown size={16} className={`chevron ${openDropdown === 'sessionDuration' ? 'open' : ''}`} />
                            </button>
                            {openDropdown === 'sessionDuration' && (
                                <div className="cp-dropdown-menu">
                                    {sessionOptions.map(opt => (
                                        <div
                                            key={opt}
                                            className="cp-dropdown-item"
                                            onClick={() => handleSelectOption('sessionDuration', opt)}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cp-form-row checkbox-row">
                        <label className="cp-checkbox">
                            <input
                                type="checkbox"
                                checked={config.autoRotateKeys}
                                onChange={() => handleToggle('autoRotateKeys')}
                            />
                            <span className="checkmark"></span>
                            Auto-Rotate Session Keys
                        </label>
                    </div>

                    <button className="cp-danger-btn">
                        Pause AI Spending Session
                    </button>
                </div>
            </div>

            {/* Alerts & Notifications */}
            <div className="cp-card full-width">
                <h2 className="cp-card-title">
                    <Bell size={20} className="card-icon yellow" />
                    Alerts & Notifications
                </h2>

                <div className="cp-alerts-row">
                    <label className="cp-checkbox">
                        <input
                            type="checkbox"
                            checked={config.alerts.dailyLimitReached}
                            onChange={() => handleAlertToggle('dailyLimitReached')}
                        />
                        <span className="checkmark"></span>
                        Daily limit reached
                    </label>

                    <label className="cp-checkbox">
                        <input
                            type="checkbox"
                            checked={config.alerts.criticalStockAlert}
                            onChange={() => handleAlertToggle('criticalStockAlert')}
                        />
                        <span className="checkmark"></span>
                        Critical stock alert
                    </label>

                    <div className="cp-alert-indicator">
                        <span className="alert-icon warning">⚠</span>
                        Monthly budget {config.alerts.monthlyBudgetThreshold}% used
                    </div>
                </div>
            </div>

            {/* Save Changes Button */}
            <div className="cp-save-section">
                <button className="cp-save-btn">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>
        </div>
    );
}

export default ControlPanel;
