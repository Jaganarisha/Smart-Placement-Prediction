import React from "react";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";

export default function PredictionCard({ result }) {
  if (!result) return null;

  const isPlaced = result.placement_status === "Placed";
  const readinessColor =
    result.readiness_level === "High"
      ? "success"
      : result.readiness_level === "Medium"
      ? "warning"
      : "danger";

  return (
    <div
      className="card"
      style={{
        borderTop: `4px solid ${isPlaced ? "var(--color-success)" : "var(--color-danger)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {isPlaced ? (
          <CheckCircle2 size={32} color="var(--color-success)" />
        ) : (
          <XCircle size={32} color="var(--color-danger)" />
        )}
        <div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>
            PLACEMENT PREDICTION
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {isPlaced ? "High Chance of Placement" : "Placement Readiness Needed"}
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div>
          <div className="stat-label">Probability</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {result.placement_probability}%
          </div>
        </div>
        <div>
          <div className="stat-label">Status</div>
          <span className={`badge ${isPlaced ? "badge-success" : "badge-danger"}`}>
            {result.placement_status}
          </span>
        </div>
        <div>
          <div className="stat-label">Readiness</div>
          <span className={`badge badge-${readinessColor}`}>{result.readiness_level}</span>
        </div>
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{result.prediction_message}</p>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={16} color="var(--color-success)" /> Strengths
          </div>
          <ul className="list-clean">
            {result.strengths?.length ? (
              result.strengths.map((s, i) => (
                <li key={i}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ marginTop: 2 }} />
                  {s}
                </li>
              ))
            ) : (
              <li style={{ color: "var(--color-text-muted)" }}>No standout strengths yet</li>
            )}
          </ul>
        </div>
        <div>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={16} color="var(--color-danger)" /> Areas to Improve
          </div>
          <ul className="list-clean">
            {result.weaknesses?.length ? (
              result.weaknesses.map((w, i) => (
                <li key={i}>
                  <XCircle size={14} color="var(--color-danger)" style={{ marginTop: 2 }} />
                  {w}
                </li>
              ))
            ) : (
              <li style={{ color: "var(--color-text-muted)" }}>No major weaknesses detected</li>
            )}
          </ul>
        </div>
      </div>

      {(result.positive_factors?.length > 0 || result.negative_factors?.length > 0) && (
        <div style={{ marginTop: 16 }}>
          <div className="card-title">Explainable Prediction</div>
          <div className="grid grid-2">
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-success)" }}>
                Positive Factors
              </div>
              {result.positive_factors.map((f, i) => (
                <span key={i} className="tag-pill" style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}>
                  {f}
                </span>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-danger)" }}>
                Negative Factors
              </div>
              {result.negative_factors.length ? (
                result.negative_factors.map((f, i) => (
                  <span key={i} className="tag-pill" style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
                    {f}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>None</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
