import React from 'react';
import { FileSpreadsheet, Cpu, Shield, CreditCard, BarChart3, Settings, TrendingUp } from 'lucide-react';
import './WorkflowAnimation.css';

const WorkflowAnimation = () => {
    return (
        <div className="workflow-container">
            {/* Connection Lines */}
            <svg className="workflow-lines" viewBox="0 0 420 480">
                {/* Input to AI */}
                <path
                    className="connection-line line-1"
                    d="M 130 85 L 90 160"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
                {/* Input to Backend */}
                {/* <path
                    className="connection-line line-2"
                    d="M 210 85 L 390 100"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                /> */}
                {/* AI to Backend */}
                <path
                    className="connection-line line-3"
                    d="M 120 210 L 290 110"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
                <path
                    className="connection-line line-3"
                    d="M 330 210 L 300 110"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />

                {/* AI to Dashboard */}
                <path
                    className="connection-line line-4"
                    d="M 80 270 L 80 360"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
                {/* Security to Inventory */}
                <path
                    className="connection-line line-5"
                    d="M 340 240 L 340 350"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
            </svg>

            {/* Input Data Card */}
            <div className="workflow-card card-input">
                <div className="card-icon">
                    <FileSpreadsheet size={24} />
                </div>
                <span className="card-text">Input Data</span>
            </div>

            {/* AI Processing Card */}
            <div className="workflow-card card-ai">
                <div className="card-glow"></div>
                <div className="card-icon-large">
                    <Cpu size={32} />
                </div>
                <span className="card-label">AI</span>
                <span className="card-sublabel">Processing</span>
                <div className="pulse-ring"></div>
            </div>

            {/* Backend Card */}
            <div className="workflow-card card-backend">
                <div className="card-icon">
                    <Settings size={20} />
                </div>
                <span className="card-text">Backend</span>
                <div className="processing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            </div>

            {/* Security & Payment Card */}
            <div className="workflow-card card-security">
                <div className="icon-row">
                    <div className="mini-icon"><Shield size={16} /></div>
                    <div className="mini-icon"><CreditCard size={16} /></div>
                </div>
                <span className="card-text">Security & Payment</span>
            </div>

            {/* Dashboard Card */}
            <div className="workflow-card card-dashboard">
                <div className="card-icon">
                    <BarChart3 size={20} />
                </div>
                <span className="card-text">Dashboard</span>
            </div>

            {/* Inventory Card */}
            <div className="workflow-card card-inventory">
                <div className="card-icon">
                    <TrendingUp size={20} />
                </div>
                <span className="card-text">Inventory</span>
                <span className="stat-badge">+48%</span>
            </div>
        </div>
    );
};

export default WorkflowAnimation;
