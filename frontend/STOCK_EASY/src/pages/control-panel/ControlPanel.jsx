import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Wallet,
    Brain,
    Users,
    Shield,
    Bell,
    Save,
    Pencil,
    Check
} from "lucide-react";
import "./controlPanel.css";

const API_BASE_URL = "http://localhost:8000";

// Default configuration (matching ai/default_config.py structure)
const defaultConfig = {
    monthlyBudget: 500000,
    monthlyUsed: 18420,
    monthlyTotal: 500000,

    bufferStock: 7,
    minDemand: 5, // matches min_demand_threshold in default_config.py

    suppliers: [
        { id: "SUP1", address: "0x11....111", status: "Allowed", allocation: 100 },
        { id: "SUP2", address: "0x22....222", status: "Allowed", allocation: 100 },
        { id: "SUP3", address: "0x33....333", status: "Allowed", allocation: 100 },
    ],

    alerts: {
        dailyLimitReached: true,
        criticalStockAlert: true,
        monthlyBudgetThreshold: 80,
    }
};

function ControlPanel() {
    const [config, setConfig] = useState(defaultConfig);
    const [editingSupplier, setEditingSupplier] = useState(null);

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

    const handleSupplierAddressChange = (supplierId, newAddress) => {
        const updatedSuppliers = config.suppliers.map(s =>
            s.id === supplierId
                ? { ...s, address: newAddress }
                : s
        );
        setConfig({ ...config, suppliers: updatedSuppliers });
    };

    const toggleEditSupplier = (supplierId) => {
        setEditingSupplier(editingSupplier === supplierId ? null : supplierId);
    };
    const saveConfigToBackend = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/agent/config`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(config)
            });

            if (!res.ok) {
                throw new Error("Failed to save config");
            }

            alert("Configuration saved successfully");
        } catch (err) {
            console.error(err);
            alert("Error saving configuration");
        }
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

                    <div className="cp-form-row">
                        <label>Monthly Budget:</label>
                        <div className="cp-number-input">
                            <span className="currency-prefix">₹</span>
                            <input
                                type="number"
                                value={config.monthlyBudget}
                                onChange={(e) => handleNumberInput('monthlyBudget', e.target.value)}
                                min="0"
                            />
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
                        <label>Min Demand:</label>
                        <div className="cp-number-input">
                            <input
                                type="number"
                                value={config.minDemand}
                                onChange={(e) => handleNumberInput('minDemand', e.target.value)}
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
                                <div className="supplier-address-wrapper">
                                    <input
                                        type="text"
                                        className={`supplier-address-input ${editingSupplier === supplier.id ? 'editing' : ''}`}
                                        value={supplier.address}
                                        onChange={(e) => handleSupplierAddressChange(supplier.id, e.target.value)}
                                        disabled={editingSupplier !== supplier.id}
                                    />
                                    <button
                                        className="supplier-edit-btn"
                                        onClick={() => toggleEditSupplier(supplier.id)}
                                        title={editingSupplier === supplier.id ? "Save address" : "Edit address"}
                                    >
                                        {editingSupplier === supplier.id ? (
                                            <Check size={14} />
                                        ) : (
                                            <Pencil size={14} />
                                        )}
                                    </button>
                                </div>
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

                {/* Safety Controls */}
                <div className="cp-card">
                    <h2 className="cp-card-title">
                        <Shield size={20} className="card-icon orange" />
                        Safety Controls
                    </h2>

                    <p className="cp-card-description">
                        Use the button below to immediately pause all AI spending activity.
                    </p>

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
                <button className="cp-save-btn" onClick={saveConfigToBackend}>
                    <Save size={18} />
                    Save Changes
                </button>
            </div>
        </div>
    );
}

export default ControlPanel;
