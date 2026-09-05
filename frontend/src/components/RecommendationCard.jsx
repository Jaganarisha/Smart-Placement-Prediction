import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

export default function RecommendationCard({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Lightbulb size={16} color="var(--color-warning)" />
        Personalized Recommendations
      </div>
      <ul className="list-clean">
        {recommendations.map((rec, i) => (
          <li key={i}>
            <ArrowRight size={14} color="var(--color-primary)" style={{ marginTop: 2 }} />
            {rec}
          </li>
        ))}
      </ul>
    </div>
  );
}
