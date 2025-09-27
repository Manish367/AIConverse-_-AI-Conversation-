import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ theme }) {
  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  return (
    <nav
      className="d-flex justify-content-between align-items-center px-3 py-2"
      style={{
        backgroundColor: isDark ? "#222" : "#f8f9fa",
        color: isDark ? "#fff" : "#000",
        borderBottom: `1px solid ${isDark ? "#444" : "#ddd"}`,
      }}
    >
      <span className="fw-bold">👋 Welcome, {user?.name || "User"}</span>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={logout}
      >
        Logout
      </button>
    </nav>
  );
}
