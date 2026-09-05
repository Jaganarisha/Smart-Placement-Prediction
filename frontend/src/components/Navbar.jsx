import React from "react";
import { LogOut } from "lucide-react";

export default function Navbar({ title, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">
        <div className="avatar-circle">AD</div>
        <button className="btn btn-secondary" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
