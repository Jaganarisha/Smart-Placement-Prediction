import React from "react";

const COLOR_MAP = {
  primary: { bg: "var(--color-primary-light)", fg: "var(--color-primary)" },
  success: { bg: "var(--color-success-light)", fg: "var(--color-success)" },
  danger: { bg: "var(--color-danger-light)", fg: "var(--color-danger)" },
  warning: { bg: "var(--color-warning-light)", fg: "var(--color-warning)" },
};

export default function StatCard({ label, value, icon: Icon, color = "primary", suffix = "" }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <div>
          <div className="stat-value">
            {value}
            {suffix}
          </div>
          <div className="stat-label">{label}</div>
        </div>
        {Icon && (
          <div className="stat-icon" style={{ background: c.bg, color: c.fg }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
