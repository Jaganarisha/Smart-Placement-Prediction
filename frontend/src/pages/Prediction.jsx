import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import StudentForm from "../components/StudentForm.jsx";
import PredictionCard from "../components/PredictionCard.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import { predictPlacement } from "../services/api.js";

export default function Prediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { name, ...payload } = formData;
      const res = await predictPlacement({ name, ...payload });
      setResult(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        detail ||
          "Could not reach the backend. Make sure FastAPI is running on http://127.0.0.1:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Placement Prediction</h1>
          <p>Enter a student's academic and skill profile to predict placement readiness</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-title">Student Profile</div>
          <StudentForm onSubmit={handleSubmit} submitLabel="Predict Placement" loading={loading} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {error && (
            <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <AlertTriangle size={20} color="var(--color-danger)" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="card empty-state">
              <p>Fill out the form and click "Predict Placement" to see results here.</p>
            </div>
          )}

          {result && (
            <>
              <PredictionCard result={result} />
              <RecommendationCard recommendations={result.recommendations} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
