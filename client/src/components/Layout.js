import React from "react";
import Sidebar from "./Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function Layout({
  activePage,
  onSelectPage,
  children,
  theme,
  onToggleTheme,

  // Chat history props
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onNewConversation,

  // Image chats (threads)
  imageThreads = [],
  selectedImageThreadId,
  onSelectImageThread,
  onNewImageThread,
  onRefreshImageThreads,
  onDeleteImageThread,

  // User details
  user = { username: "Guest", email: "guest@example.com" },
  onLogout,
}) {
  const isDark = theme === "dark";

  return (
    <div
      className="d-flex"
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: isDark ? "#121212" : "#f8f9fa",
        color: isDark ? "#fff" : "#000",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 250,
          minWidth: 250,
          maxWidth: 250,
          overflowY: "auto",
          padding: "1rem",
          backgroundColor: isDark ? "#1e1e1e" : "#fff",
          color: isDark ? "#fff" : "#000",
          transition: "background-color 0.3s, color 0.3s",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h4
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "1rem",
          }}
        >
          My App
        </h4>

        {/* Theme toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={() => theme !== "light" && onToggleTheme?.()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(255,223,85,0.5)",
              background: "transparent",
              color: isDark ? "#fff" : "rgba(255,223,85,0.8)",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s",
              animation:
                theme === "light"
                  ? "breathingSun 2.5s infinite ease-in-out"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: theme === "light" ? 1 : 0.6,
            }}
            title="Light Mode"
          >
            <FontAwesomeIcon icon={faSun} />
          </button>

          <button
            onClick={() => theme !== "dark" && onToggleTheme?.()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(100,149,237,0.5)",
              background: "transparent",
              color: isDark ? "#6495ED" : "#000",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s",
              animation:
                theme === "dark"
                  ? "breathingMoon 1.8s infinite ease-in-out"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: theme === "dark" ? 1 : 0.6,
            }}
            title="Dark Mode"
          >
            <FontAwesomeIcon icon={faMoon} />
          </button>
        </div>

        <Sidebar
          activePage={activePage}
          onSelect={onSelectPage}
          theme={theme}
          // Chat
          conversations={conversations}
          activeConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
          onNewConversation={onNewConversation}
          // Image chats
          imageThreads={imageThreads}
          activeImageThreadId={selectedImageThreadId}
          onSelectImageThread={onSelectImageThread}
          onNewImageThread={onNewImageThread}
          onRefreshImageThreads={onRefreshImageThreads}
          onDeleteImageThread={onDeleteImageThread}
        />
      </div>

      {/* Main content */}
      <div
        style={{
          flexGrow: 1,
          padding: "1.5rem",
          overflowY: "auto",
          backgroundColor: isDark ? "#121212" : "#f8f9fa",
          color: isDark ? "#fff" : "#000",
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        {children}
        <hr></hr>

        {/* My Profile Details in Settings */}
        {activePage === "settings" && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              borderRadius: 8,
              backgroundColor: isDark ? "#1e1e1e" : "#fff",
              border: `1px solid ${isDark ? "#333" : "#ddd"}`,
              maxWidth: 400,
            }}
          >
            <h5 style={{ marginBottom: "1rem" }}>Profile Details</h5>

            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Username:</strong>
              <div>{user.username}</div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Email:</strong>
              <div>{user.email}</div>
            </div>

            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  onLogout?.();
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes breathingSun { 
          0% { box-shadow: 0 0 4px 1px rgba(255,223,85,0.3); } 
          50% { box-shadow: 0 0 8px 2px rgba(255,223,85,0.4); } 
          100% { box-shadow: 0 0 4px 1px rgba(255,223,85,0.3); } 
        }
        @keyframes breathingMoon { 
          0% { box-shadow: 0 0 3px 1px rgba(100,149,237,0.3); } 
          50% { box-shadow: 0 0 6px 2px rgba(100,149,237,0.5); } 
          100% { box-shadow: 0 0 3px 1px rgba(100,149,237,0.3); } 
        }
      `}</style>
    </div>
  );
}
