import React from "react";
import { API_BASE_URL } from "../services/api.js";
import { Info } from "lucide-react";

export default function Settings() {
  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Settings</h1>
          <p>System information for this demo deployment</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={16} /> Backend Connection
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          API base URL: <code>{API_BASE_URL}</code>
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          Swagger docs: <code>{API_BASE_URL}/docs</code>
        </p>
      </div>

      <div className="card">
        <div className="card-title">Demo Login</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          Username: <strong>admin</strong> &nbsp;|&nbsp; Password: <strong>admin123</strong>
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          This is a simplified demo authentication flow for academic presentation purposes only —
          not intended for production use.
        </p>
      </div>
    </div>
  );
}
