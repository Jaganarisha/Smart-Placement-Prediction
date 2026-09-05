import React, { useEffect, useState } from "react";
import { Users, UserCheck, Percent, Award, TrendingUp, AlertTriangle } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import { PlacementPieChart, DepartmentBarChart } from "../components/Charts.jsx";
import { getAnalytics, getHealth } from "../services/api.js";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await getHealth();
        const res = await getAnalytics();
        if (mounted) {
          setAnalytics(res.data);
          setBackendDown(false);
        }
      } catch (err) {
        if (mounted) setBackendDown(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (backendDown) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={32} color="var(--color-danger)" style={{ marginBottom: 10 }} />
        <p>
          Could not reach the backend at <code>http://127.0.0.1:8000</code>. Make sure the FastAPI
          server is running: <code>uvicorn main:app --reload</code>
        </p>
      </div>
    );
  }

  if (!analytics || analytics.total_students === 0) {
    return (
      <div className="card empty-state">
        <p>No student data available yet. Train the model and add students to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of placement readiness across the college</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Students" value={analytics.total_students} icon={Users} color="primary" />
        <StatCard label="Placed Students" value={analytics.placed_students} icon={UserCheck} color="success" />
        <StatCard label="Placement %" value={analytics.placement_percentage} suffix="%" icon={Percent} color="success" />
        <StatCard label="Average CGPA" value={analytics.average_cgpa} icon={Award} color="primary" />
        <StatCard label="Avg. Placement Probability" value={analytics.average_placement_probability} suffix="%" icon={TrendingUp} color="warning" />
        <StatCard label="At-Risk Students" value={analytics.at_risk_students} icon={AlertTriangle} color="danger" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Placement Status Distribution</div>
          <PlacementPieChart data={analytics.placement_distribution} />
        </div>
        <div className="card">
          <div className="card-title">Department-wise Placement Rate</div>
          <DepartmentBarChart data={analytics.department_comparison} />
        </div>
      </div>
    </div>
  );
}
