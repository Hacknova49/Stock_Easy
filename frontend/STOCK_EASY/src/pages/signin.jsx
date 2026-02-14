// src/components/SignInModal.jsx
import React, { useState } from "react";
import "./signin.css";

function SignIn() {
  const [formData, setFormData] = useState({
    name: "",
    walletAddress: "",
    privateKey: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("📤 Sending:", formData);

    try {
      const res = await fetch("http://localhost:3000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setSuccess("Sign in successful!");
      setTimeout(() => {
        window.location.href = "/homepage";
      }, 1000);

    } catch (err) {
      setError("Server not reachable");
    }
  };

  return (
    <div className="signin-page">
      <h2>Sign In</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          name="walletAddress"
          placeholder="Wallet Address"
          value={formData.walletAddress}
          onChange={handleChange}
          required
        />

        <input
          name="privateKey"
          placeholder="Private Key"
          value={formData.privateKey}
          onChange={handleChange}
          required
        />

        <button type="submit">Sign In</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default SignIn;
