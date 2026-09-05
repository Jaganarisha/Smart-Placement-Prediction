import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Prediction from "./pages/Prediction.jsx";
import Students from "./pages/Students.jsx";
import Analytics from "./pages/Analytics.jsx";
import ModelPerformance from "./pages/ModelPerformance.jsx";
import Settings from "./pages/Settings.jsx";

function useAuth() {
  const [isAuthed, setIsAuthed] = useState(
    () => localStorage.getItem("spp_authed") === "true"
  );

  const login = () => {
    localStorage.setItem("spp_authed", "true");
    setIsAuthed(true);
  };

  const logout = () => {
    localStorage.removeItem("spp_authed");
    setIsAuthed(false);
  };

  return { isAuthed, login, logout };
}

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/prediction": "Placement Prediction",
  "/students": "Student Management",
  "/analytics": "Analytics",
  "/model-performance": "Model Performance",
  "/settings": "Settings",
};

function AppLayout({ onLogout, children, path }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Navbar title={PAGE_TITLES[path] || "Smart Placement Prediction"} onLogout={onLogout} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthed, login, logout } = useAuth();

  if (!isAuthed) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={login} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <AppLayout onLogout={logout} path="/dashboard">
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/prediction"
        element={
          <AppLayout onLogout={logout} path="/prediction">
            <Prediction />
          </AppLayout>
        }
      />
      <Route
        path="/students"
        element={
          <AppLayout onLogout={logout} path="/students">
            <Students />
          </AppLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <AppLayout onLogout={logout} path="/analytics">
            <Analytics />
          </AppLayout>
        }
      />
      <Route
        path="/model-performance"
        element={
          <AppLayout onLogout={logout} path="/model-performance">
            <ModelPerformance />
          </AppLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AppLayout onLogout={logout} path="/settings">
            <Settings />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
