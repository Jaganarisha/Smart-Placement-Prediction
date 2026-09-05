import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import { DepartmentBarChart, ImpactBarChart, PlacementPieChart } from "../components/Charts.jsx";
import { getAnalytics } from "../services/api.js";
import { Award, Code2, Brain, MessageSquare } from "lucide-react";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAnalytics()
      .then((res) => mounted && setAnalytics(res.data))
      .catch(() => mounted && setBackendDown(true))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;

  if (backendDown || !analytics || analytics.total_students === 0) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={28} color="var(--color-danger)" style={{ marginBottom: 8 }} />
        <p>Analytics data isn't available. Make sure the backend is running and has student data.</p>
      </div>
    );
  }

  const internshipImpact = [
    { name: "With Internship", rate: analytics.internship_impact.with },
    { name: "Without", rate: analytics.internship_impact.without },
  ];
  const certificationImpact = [
    { name: "With Cert.", rate: analytics.certification_impact.with },
    { name: "Without", rate: analytics.certification_impact.without },
  ];
  const projectImpact = [
    { name: "Multiple Projects", rate: analytics.project_impact.with },
    { name: "Few/None", rate: analytics.project_impact.without },
  ];

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1>Analytics</h1>
          <p>Deep-dive into placement performance drivers</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Overall Placement %" value={analytics.placement_percentage} suffix="%" icon={Award} color="success" />
        <StatCard label="Average CGPA" value={analytics.average_cgpa} icon={Award} color="primary" />
        <StatCard label="Average Coding Score" value={analytics.average_coding_score} icon={Code2} color="primary" />
        <StatCard label="Average Aptitude Score" value={analytics.average_aptitude_score} icon={Brain} color="warning" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Placement Distribution</div>
          <PlacementPieChart data={analytics.placement_distribution} />
        </div>
        <div className="card">
          <div className="card-title">Department Comparison</div>
          <DepartmentBarChart data={analytics.department_comparison} />
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-title">Internship Impact on Placement</div>
          <ImpactBarChart data={internshipImpact} title="Placement Rate %" />
        </div>
        <div className="card">
          <div className="card-title">Certification Impact on Placement</div>
          <ImpactBarChart data={certificationImpact} title="Placement Rate %" />
        </div>
        <div className="card">
          <div className="card-title">Project Work Impact on Placement</div>
          <ImpactBarChart data={projectImpact} title="Placement Rate %" />
        </div>
      </div>
    </div>
  );
}
