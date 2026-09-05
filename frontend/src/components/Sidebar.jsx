import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  BarChart3,
  Cpu,
  Settings as SettingsIcon,
  GraduationCap,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prediction", label: "Placement Prediction", icon: Target },
  { to: "/students", label: "Students", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/model-performance", label: "Model Performance", icon: Cpu },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <GraduationCap size={22} />
        <span>Placement Cell AI</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
