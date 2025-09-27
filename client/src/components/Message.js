import React from "react";
import { absUrl } from "../lib/absUrl";

export default function Message({ m }) {
  const isUser = m.role === "user";

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
              width: 42,
              height: 42,
              objectFit: "cover",
              borderRadius: 5,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`d-flex mb-3 ${isUser ? "justify-content-end" : "justify-content-start"}`}
    >
      <div
        className={`p-3 rounded-3 shadow-sm ${
          isUser ? "bg-primary text-white" : "bg-light"
        }`}
        style={{ maxWidth: "80%" }}
      >
        <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
        {m.attachments ? renderAttachments(m.attachments) : null}
      </div>
    </div>
  );
}