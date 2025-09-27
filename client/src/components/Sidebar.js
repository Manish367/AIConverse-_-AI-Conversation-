import React, { useMemo, useState } from "react";

export default function Sidebar({
  activePage,
  onSelect,
  theme,

  // Chat history
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onNewConversation,

  // Image chats
  imageThreads = [], // [{ id, title, itemCount, updatedAt }]
  activeImageThreadId,
  onSelectImageThread,
  onNewImageThread,
  onRefreshImageThreads,
  onDeleteImageThread,
}) {
  const isDark = theme === "dark";

  const navItemsTop = [
    { key: "chat", label: "Chat" },
    { key: "images", label: "Image Generator" },
  ];

  // Chat search
  const [qChat, setQChat] = useState("");
  const filteredConvs = useMemo(() => {
    const q = qChat.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.lastMessagePreview?.toLowerCase().includes(q)
    );
  }, [qChat, conversations]);

  // Image chat search
  const [qImg, setQImg] = useState("");
  const filteredThreads = useMemo(() => {
    const q = qImg.trim().toLowerCase();
    if (!q) return imageThreads;
    return imageThreads.filter((t) => t.title?.toLowerCase().includes(q));
  }, [qImg, imageThreads]);

  const colorActive = isDark ? "#0dcaf0" : "#0d6efd";
  const colorText = isDark ? "#fff" : "#000";
  const borderColor = isDark ? "#333" : "#ddd";
  const rowBgActive = isDark ? "#202020" : "#f1f5f9";
  const sidebarBg = isDark ? "#1e1e1e" : "#fff";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minHeight: 0 }}>
      {/* Top Nav */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {navItemsTop.map((item) => {
          const isActive = activePage === item.key;
          return (
            <li key={item.key}>
              <button
                onClick={() => onSelect(item.key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem",
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? colorActive : colorText,
                  cursor: "pointer",
                  transition: "color 0.3s, background 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colorActive)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = isActive ? colorActive : colorText)
                }
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Chat list */}
      {activePage === "chat" && (
        <div style={{ marginTop: "0.5rem", borderTop: `1px solid ${borderColor}`, paddingTop: "0.75rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong>Conversations</strong>
            <button className="btn btn-sm btn-primary" onClick={onNewConversation}>+ New</button>
          </div>

          <input
            className="form-control form-control-sm mb-2"
            placeholder="Search chats…"
            value={qChat}
            onChange={(e) => setQChat(e.target.value)}
            style={{ background: isDark ? "#2a2a2a" : "#fff", color: isDark ? "#fff" : "#000" }}
          />

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {filteredConvs.length === 0 && <div className="text-muted small">No conversations</div>}
            {filteredConvs.map((c) => {
              const active = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation && onSelectConversation(c.id)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: active ? rowBgActive : "transparent",
                    border: `1px solid ${active ? borderColor : "transparent"}`,
                    marginBottom: 6,
                  }}
                  title={c.title}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-truncate" style={{ maxWidth: 140, fontWeight: 600 }}>
                      {c.title || "Untitled"}
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-secondary" onClick={(e) => { e.stopPropagation(); onRenameConversation && onRenameConversation(c.id); }} title="Rename">Rename</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); if (!window.confirm("Delete this conversation?")) return; onDeleteConversation && onDeleteConversation(c.id); }} title="Delete">Delete</button>
                    </div>
                  </div>
                  {c.lastMessagePreview && (
                    <div className="small text-muted text-truncate" title={c.lastMessagePreview}>
                      {c.lastMessagePreview}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image chats (no thumbnails) */}
      {activePage === "images" && (
        <div style={{ marginTop: "0.5rem", borderTop: `1px solid ${borderColor}`, paddingTop: "0.75rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong>Image</strong>
            <div className="d-flex gap-2">
              {onRefreshImageThreads && (
                <button className="btn btn-sm btn-outline-secondary" onClick={onRefreshImageThreads}>
                  Refresh
                </button>
              )}
              {onNewImageThread && (
                <button className="btn btn-sm btn-primary" onClick={onNewImageThread}>
                  + New
                </button>
              )}
            </div>
          </div>

          <input
            className="form-control form-control-sm mb-2"
            placeholder="Search image chats…"
            value={qImg}
            onChange={(e) => setQImg(e.target.value)}
            style={{ background: isDark ? "#2a2a2a" : "#fff", color: isDark ? "#fff" : "#000" }}
          />

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {filteredThreads.length === 0 && <div className="text-muted small">No image chats</div>}

            {filteredThreads.map((t) => {
              const active = t.id === activeImageThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectImageThread && onSelectImageThread(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: active ? rowBgActive : "transparent",
                    border: `1px solid ${active ? borderColor : "transparent"}`,
                    marginBottom: 6,
                  }}
                  title={t.title}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-truncate" style={{ maxWidth: 160, fontWeight: 600 }}>
                      {t.title || "(untitled)"}
                    </div>
                    <div className="small text-muted">
                      {t.itemCount ?? 0} image{(t.itemCount ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>

                  {onDeleteImageThread && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!window.confirm("Delete this image chat (and its images)?")) return;
                        onDeleteImageThread(t.id);
                      }}
                      title="Delete image chat"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom: Settings pinned */}
      <div
        style={{
          marginTop: "auto",
          position: "sticky",
          bottom: 0,
          background: sidebarBg,
          paddingTop: "0.6rem",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <button
          onClick={() => onSelect?.("settings")}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "0.5rem",
            borderRadius: 4,
            border: "none",
            background: "transparent",
            fontWeight: activePage === "settings" ? 700 : 400,
            color: activePage === "settings" ? colorActive : colorText,
            cursor: "pointer",
            transition: "color 0.3s, background 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colorActive)}
          onMouseLeave={(e) => (e.currentTarget.style.color = activePage === "settings" ? colorActive : colorText)}
          title="Settings"
        >
          Settings
        </button>
      </div>
    </div>
  );
}