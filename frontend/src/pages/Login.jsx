import React, { useState } from "react";
import { GraduationCap, LogIn } from "lucide-react";

const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin123";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setError("");
      onLogin();
    } else {
      setError("Invalid username or password. Try the demo credentials below.");
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <GraduationCap size={26} />
          Placement Cell AI
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 0 }}>
          Smart Placement Prediction System
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 18, justifyContent: "center" }}>
            <LogIn size={16} />
            Sign In
          </button>
        </form>

        <div className="hint-text">
          Demo credentials — Username: <strong>admin</strong> &nbsp;|&nbsp; Password: <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}
