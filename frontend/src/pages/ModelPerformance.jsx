import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Award } from "lucide-react";
import { FeatureImportanceChart, ModelComparisonChart } from "../components/Charts.jsx";
import { getModelPerformance, trainModel } from "../services/api.js";

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getModelPerformance();
      setData(res.data);
      setBackendDown(false);
    } catch (err) {
      setBackendDown(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTrain = async () => {
    setTraining(true);
    setTrainMessage("");
    try {
      await trainModel();
      setTrainMessage("Model retrained successfully.");
      await load();
    } catch (err) {
      setTrainMessage(err?.response?.data?.detail || "Training failed.");
    } finally {
      setTraining(false);
    }
  };

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  if (backendDown) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={28} color="var(--color-danger)" style={{ marginBottom: 8 }} />
        <p>Could not reach the backend at http://127.0.0.1:8000.</p>
      </div>
    );
  }

  if (!data?.ready) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={28} color="var(--color-warning)" style={{ marginBottom: 8 }} />
        <p>{data?.error || "Model not trained yet."}</p>
        <button className="btn btn-primary" onClick={handleTrain} disabled={training} style={{ marginTop: 12 }}>
          <RefreshCw size={16} /> {training ? "Training..." : "Train Model Now"}
        </button>
      </div>
    );
  }

  const modelRows = Object.entries(data.results).map(([name, m]) => ({ model: name, ...m }));
  const featureRows = Object.entries(data.feature_importance || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Model Performance</h1>
          <p>Comparison of trained classification models</p>
        </div>
        <button className="btn btn-secondary" onClick={handleTrain} disabled={training}>
          <RefreshCw size={16} /> {training ? "Training..." : "Retrain Model"}
        </button>
      </div>

      {trainMessage && (
        <div className="card" style={{ marginBottom: 16 }}>
          {trainMessage}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={20} color="var(--color-success)" />
          <span>
            Best performing model: <strong>{data.best_model}</strong>
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Model | Accuracy | Precision | Recall | F1 Score</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1 Score</th>
              </tr>
            </thead>
            <tbody>
              {modelRows.map((r) => (
                <tr key={r.model} style={r.model === data.best_model ? { background: "var(--color-primary-light)" } : {}}>
                  <td>{r.model} {r.model === data.best_model && <span className="badge badge-neutral">Best</span>}</td>
                  <td>{r.accuracy}</td>
                  <td>{r.precision}</td>
                  <td>{r.recall}</td>
                  <td>{r.f1_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Model Comparison</div>
          <ModelComparisonChart data={modelRows} />
        </div>
        <div className="card">
          <div className="card-title">Feature Importance ({data.best_model})</div>
          <FeatureImportanceChart data={featureRows} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Confusion Matrix — {data.best_model}</div>
        {data.results[data.best_model]?.confusion_matrix && (
          <table style={{ maxWidth: 320 }}>
            <thead>
              <tr><th></th><th>Predicted: Not Placed</th><th>Predicted: Placed</th></tr>
            </thead>
            <tbody>
              <tr>
                <th>Actual: Not Placed</th>
                <td>{data.results[data.best_model].confusion_matrix[0][0]}</td>
                <td>{data.results[data.best_model].confusion_matrix[0][1]}</td>
              </tr>
              <tr>
                <th>Actual: Placed</th>
                <td>{data.results[data.best_model].confusion_matrix[1][0]}</td>
                <td>{data.results[data.best_model].confusion_matrix[1][1]}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
