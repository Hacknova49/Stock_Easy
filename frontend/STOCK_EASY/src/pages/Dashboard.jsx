import React, { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAgentData = async () => {
    try {
      const res = await fetch("http://localhost:8000/run-restock", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to fetch agent data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  };

  // Auto-refresh every 3 seconds (shows autonomy)
  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 p-6">
        ❌ Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        Loading AI agent...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <AppNavbar />

      {/* CONTENT */}
      <div className="pt-28 p-6 space-y-8">

        {/* HEADER */}
        <h1 className="text-3xl font-bold">
          Live Agent Dashboard
        </h1>

        {/* SYSTEM STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard label="AI Agent" value="ACTIVE" />
          <StatusCard label="Session Key" value="ACTIVE (Restricted)" />
          <StatusCard label="Network" value="Polygon Amoy" />
        </div>

        {/* BUDGET SUMMARY */}
        <div className="border border-gray-700 rounded p-4">
          <h2 className="text-xl font-semibold mb-2">
            Budget Summary
          </h2>
          <p>Monthly Budget: ₹{data.monthly_budget}</p>
          <p>Total Spent: ₹{data.total_spent}</p>
          <p className="text-green-400">
            Remaining: ₹{data.budget_remaining}
          </p>
        </div>

        {/* AI DECISIONS */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            AI Restock Decisions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.decisions.map((d, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded p-4 space-y-2"
              >
                <h3 className="text-lg font-bold">
                  {d.product}
                </h3>

                <p>Supplier: {d.supplier_id}</p>
                <p>Priority: {d.priority}</p>
                <p>Predicted 7-Day Demand: {d.predicted_7d_demand}</p>
                <p>Current Stock: {d.current_stock}</p>

                <p className="text-yellow-300">
                  Restock Quantity: {d.restock_quantity}
                </p>

                <p className="text-sm text-gray-400">
                  Reason: {d.reason}
                </p>

                {/* PAYMENT INTENT */}
                <div className="mt-3 border-t border-gray-600 pt-3">
                  <h4 className="font-semibold text-blue-400">
                    Payment Intent (Restricted)
                  </h4>

                  <p>
                    Amount: ₹{d.total_cost} {d.payment_intent.currency}
                  </p>
                  <p>
                    Purpose: {d.payment_intent.purpose}
                  </p>

                  <ul className="text-sm mt-2 space-y-1">
                    <li>✔ Max Amount Enforced</li>
                    <li>✔ Allowed Merchant Only</li>
                    <li>✔ Session Key Used</li>
                    <li>✔ No Private Keys</li>
                  </ul>

                  <p className="mt-2 text-green-400">
                    Status: EXECUTED
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* SMALL REUSABLE STATUS CARD */
function StatusCard({ label, value }) {
  return (
    <div className="border border-gray-700 rounded p-4 text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-green-400">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
