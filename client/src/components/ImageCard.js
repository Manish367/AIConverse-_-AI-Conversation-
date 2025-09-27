import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/constants";

export default function ImageCard({
  image,
  imageUrl,
  provider,
  theme,
  align = "right",
  onDelete,
  onCopyPrompt,
  onRegenerate,
  loadingMessage,
}) {
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  const img = useMemo(() => {
    if (image && typeof image === "object") return image;
    return {
      id: undefined,
      prompt: "",
      provider: provider || "",
      url: imageUrl,
      previewUrl: imageUrl,
      status: "succeeded",
      error: "",
    };
  }, [image, imageUrl, provider]);

  const isPending = img?.status === "pending";
  const isFailed = img?.status === "failed";

  const absUrl = (u = "") => {
    if (!u) return "";
    if (
      u.startsWith("http://") ||
      u.startsWith("https://") ||
      u.startsWith("data:") ||
      u.startsWith("blob:")
    )
      return u;
    if (u.startsWith("/uploads/")) return `${API_URL}${u}`;
    return u;
  };

  const src = img?.previewUrl || img?.url || "";
  const srcAbs = absUrl(src);
  const fullAbs = absUrl(img?.url || src);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  const cardShadow = isDark
    ? "0 2px 6px rgba(255,255,255,0.08)"
    : "0 2px 6px rgba(0,0,0,0.2)";
  const providerBg = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.65)";
  const actionsBg = isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.55)";
  const textColor = "#fff";

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const url = fullAbs || srcAbs;
      let filename = "image";
      try {
        const u = new URL(url);
        const parts = u.pathname.split("/");
        filename = parts[parts.length - 1] || "image";
      } catch {
        filename = "image";
      }
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      window.open(fullAbs || srcAbs, "_blank");
    }
  };

  const skeleton = useMemo(
    () => (
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: 10,
          background: isDark
            ? "linear-gradient(90deg, #2a2a2a, #333, #2a2a2a)"
            : "linear-gradient(90deg, #e9ecef, #f8f9fa, #e9ecef)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.2s infinite",
        }}
      >
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    ),
    [isDark]
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: 220,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: cardShadow,
          position: "relative",
          background: isDark ? "#1f1f1f" : "#fff",
          border: isDark ? "1px solid #2b2b2b" : "1px solid #e5e7eb",
          cursor: isPending ? "default" : "pointer",
        }}
        onClick={() => !isPending && !isFailed && setOpen(true)}
      >
        {img?.provider && !isPending && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 2,
              background: providerBg,
              color: textColor,
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
            }}
            title={img.provider}
          >
            {img.provider}
          </span>
        )}

        {isFailed ? (
          <div
            style={{
              width: 220,
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#ff6b6b" : "#b00020",
              fontWeight: 600,
              padding: 10,
              textAlign: "center",
            }}
            title={img?.error || "Generation failed"}
          >
            {img?.error || "Generation failed"}
          </div>
        ) : isPending ? (
          <div style={{ position: "relative" }}>
            {skeleton}
            {loadingMessage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "10px",
                  color: isDark ? "#ccc" : "#333",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {loadingMessage}
              </div>
            )}
          </div>
        ) : (
          <img
            src={srcAbs}
            alt="Generated"
            style={{
              width: 220,
              height: 220,
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
          />
        )}

        {!isPending && !isFailed && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              display: "flex",
              gap: 6,
              zIndex: 2,
            }}
          >
            <button
              onClick={handleDownload}
              style={{
                background: actionsBg,
                color: textColor,
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
              title="Download"
            >
              ⬇
            </button>
            {img?.prompt && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyPrompt?.(img.prompt);
                }}
                style={{
                  background: actionsBg,
                  color: textColor,
                  fontSize: 12,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
                title="Copy prompt"
              >
                ⎘
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(img);
                }}
                style={{
                  background: actionsBg,
                  color: textColor,
                  fontSize: 12,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
                title="Regenerate"
              >
                ⟳
              </button>
            )}
            {onDelete && img?.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(img.id);
                }}
                style={{
                  background: actionsBg,
                  color: textColor,
                  fontSize: 12,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
                title="Delete image"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      {open && !isPending && !isFailed && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: isDark ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <img
            src={fullAbs || srcAbs}
            alt="Full size"
            style={{
              maxWidth: "92%",
              maxHeight: "92%",
              borderRadius: 12,
              boxShadow: isDark
                ? "0 2px 10px rgba(255,255,255,0.18)"
                : "0 2px 10px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      )}
    </div>
  );
}
