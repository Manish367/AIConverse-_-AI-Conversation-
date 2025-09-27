import React from "react";
import { absUrl } from "../lib/absUrl";

export default function ChatHistoryPage({ selectedChat, theme }) {
  const isDark = theme === "dark";
  const userBg = "#0d6efd";
  const aiBg = isDark ? "#2a2a2a" : "#e0e0e0";
  const userColor = "#fff";
  const aiColor = isDark ? "#fff" : "#000";

  if (!selectedChat) {
    return (
      <div
        style={{
          flex: 1,
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: isDark ? "#fff" : "#000",
        }}
      >
        Select a chat to start conversation
      </div>
    );
  }

  // helper to render image attachments
  const renderAttachments = (att) => {
    if (!att) return null;
    const imgs = Array.isArray(att.images) ? att.images : [];
    return (
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {imgs.map((img, i) => (
          <img
            key={i}
            src={absUrl(img.url)}
            alt={img.name || "attachment"}
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#fff",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        padding: "1rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {selectedChat.messages.map((msg, index) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                background: isUser ? userBg : aiBg,
                color: isUser ? userColor : aiColor,
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              {msg.attachments ? renderAttachments(msg.attachments) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}