import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { chatApi } from "../lib/chatApi";
import { API_URL } from "../config/constants";
import { absUrl } from "../lib/absUrl";

const MAX_IMAGES = 3;
const MAX_FOLDER_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function bytesToMB(b) {
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

// This component is defined outside to prevent the input from losing focus.
const ComposerUI = React.memo(
  ({
    theme,
    newMessage,
    setNewMessage,
    sendMessage,
    onPaste,
    onSelectImages,
    onSelectFolder,
    images,
    folder,
    removeImage,
    clearFolder,
    sending,
    errors,
  }) => {
    const isDark = theme === "dark";
    const imageInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const attachMenuRef = useRef(null);
    const [isAttachButtonVisible, setAttachButtonVisible] = useState(false);
    const [isAttachButtonSticky, setAttachButtonSticky] = useState(false);
    const commonStyle = { transition: "all 0.3s" };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          attachMenuRef.current &&
          !attachMenuRef.current.contains(event.target)
        ) {
          setAttachButtonSticky(false);
          setAttachButtonVisible(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const folderImagePreviews = (folder?.files || [])
      .filter((f) => f.type?.startsWith("image/"))
      .slice(0, 3)
      .map((f, i) => ({ i, url: URL.createObjectURL(f) }));

    // Handlers to close the menu after selection ---
    const handleImageSelect = (e) => {
      onSelectImages(e); // Call original function from props
      setAttachButtonSticky(false);
      setAttachButtonVisible(false);
    };

    const handleFolderSelect = (e) => {
      onSelectFolder(e); // Call original function from props
      setAttachButtonSticky(false);
      setAttachButtonVisible(false);
    };


    return (
      <div className="w-100">
        {(images.length > 0 || folder) && (
          <div
            className="mb-2"
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {images.map((img, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={img.preview}
                  alt={img.file.name}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                />
                <button
                  className="btn btn-sm btn-dark"
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    padding: 0,
                    lineHeight: "18px",
                    borderRadius: "50%",
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            {folder && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "6px 10px",
                  background: isDark ? "#333" : "#f1f1f1",
                }}
              >
                <span>
                  📁 {folder.name} · {folder.files.length} files ·{" "}
                  {bytesToMB(folder.totalSize)}
                </span>
                <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                  {folderImagePreviews.map(({ i, url }) => (
                    <img
                      key={i}
                      src={url}
                      alt="preview"
                      style={{
                        width: 24,
                        height: 24,
                        objectFit: "cover",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                      }}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={clearFolder}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
        <div
          ref={attachMenuRef}
          className="d-flex w-100 gap-2 align-items-center"
        >
          <div className="flex-grow-1" style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                cursor: "pointer",
              }}
              onMouseEnter={() => setAttachButtonVisible(true)}
              onMouseLeave={() =>
                !isAttachButtonSticky && setAttachButtonVisible(false)
              }
              onClick={() => setAttachButtonSticky((prev) => !prev)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                  fill={isDark ? "#aaa" : "#555"}
                />
              </svg>
            </div>
            <input
              type="text"
              className="form-control"
              style={{
                ...commonStyle,
                backgroundColor: isDark ? "#444" : "#fff",
                color: isDark ? "#fff" : "#000",
                paddingLeft: "42px",
                height: "3rem",
              }}
              placeholder="Type your message... (paste or drop images here)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onPaste={onPaste}
              disabled={sending}
            />
            {(isAttachButtonVisible || isAttachButtonSticky) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: "8px",
                  zIndex: 10,
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  className="btn btn-outline-secondary"
                  style={{
                    height: "3rem",
                    background: isDark ? "#333" : "#fff",
                  }}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                >
                  + Images ({images.length}/{MAX_IMAGES})
                </button>
                <button
                  className="btn btn-outline-secondary"
                  style={{
                    height: "3rem",
                    background: isDark ? "#333" : "#fff",
                  }}
                  onClick={() => folderInputRef.current?.click()}
                  disabled={!!folder}
                >
                  + Folder {folder ? `(selected)` : ""}
                </button>
              </motion.div>
            )}
          </div>
          <button
            className="btn"
            style={{
              ...commonStyle,
              height: "3rem",
              backgroundColor: isDark ? "#0dcaf0" : "#0d6efd",
              color: "#fff",
            }}
            onClick={sendMessage}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleImageSelect} // handler
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          hidden
          onChange={handleFolderSelect} // handler
        />
        {errors.length > 0 && (
          <ul style={{ color: "crimson", marginTop: 8 }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

export default function ChatPage({
  theme,
  conversationId,
  onSelectConversation,
  updateConversationMeta,
}) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [randomTip, setRandomTip] = useState("");
  const [images, setImages] = useState([]);
  const [folder, setFolder] = useState(null);
  const [errors, setErrors] = useState([]);
  const chatEndRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const isDark = theme === "dark";
  const started = messages.length > 0;

  // --- Marquee text ---
  const marqueeText = "Please Note : Image validation may fail due to free AI limits. For better results, try describing your image using text prompts.";


  useEffect(() => {
    const tips = [
      "🚀 Ready to make today productive?",
      "💡 Did you know? You can ask me anything!",
      "🌟 A new day, a new idea!",
      "🔥 Keep pushing forward, success is near!",
      "🌿 Take a deep breath, let’s start fresh.",
    ];
    setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  useEffect(() => {
    if (!token || !conversationId) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const data = await chatApi.getConversation(token, conversationId);
        const conv = data.conversation;
        const msgs = (conv?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          attachments: m.attachments || null,
        }));
        setMessages(msgs);
      } catch (e) {
        console.error("Failed to load conversation", e);
        localStorage.removeItem("selectedConversationId");
      }
    })();
  }, [conversationId, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      images.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    };
  }, [images]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const addError = (msg) => setErrors((e) => [...e, msg]);

  const addImages = (files) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      addError(`Max ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toAdd = imgs.slice(0, remaining);
    const valid = [];
    toAdd.forEach((f) => {
      if (f.size > MAX_BYTES) {
        addError(`"${f.name}" is over 10 MB (${bytesToMB(f.size)}).`);
      } else {
        valid.push({ file: f, preview: URL.createObjectURL(f) });
      }
    });
    if (valid.length) {
      setImages((prev) => [...prev, ...valid]);
    }
  };

  const onSelectImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      addImages(files);
    }
    e.target.value = "";
  };

  const onPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const pastedFiles = items
      .filter((it) => it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (pastedFiles.length) {
      addImages(pastedFiles);
    }
  };

  const onSelectFolder = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length > MAX_FOLDER_FILES) {
      addError(`Folder has ${files.length} files. Max ${MAX_FOLDER_FILES}.`);
      e.target.value = "";
      return;
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_BYTES) {
      addError(`Folder total size is ${bytesToMB(total)} (max 10 MB).`);
      e.target.value = "";
      return;
    }
    const first = files[0];
    const relPath =
      first.webkitRelativePath || first.relativePath || first.name;
    const name = relPath.split("/")[0] || "folder";
    setFolder({ name, files, totalSize: total });
    e.target.value = "";
  };

  const removeImage = (idx) => {
    const list = [...images];
    const [removed] = list.splice(idx, 1);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setImages(list);
  };

  const clearFolder = () => setFolder(null);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragEnter = (e) => {
    prevent(e);
    setDragActive(true);
  };
  const onDragOver = (e) => {
    prevent(e);
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    prevent(e);
    setDragActive(false);
  };
  const onDrop = (e) => {
    prevent(e);
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) addImages(files);
  };

  const uploadAttachments = async () => {
    if (images.length === 0 && !folder) return null;
    const fd = new FormData();
    images.forEach(({ file }) => fd.append("images", file));
    if (folder) {
      fd.append("folderName", folder.name);
      folder.files.forEach((f) => {
        const filename = f.webkitRelativePath || f.relativePath || f.name;
        fd.append("folderFiles", f, filename);
      });
    }
    const url = `${API_URL}/api/uploads/message-attachments`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const text = await res.text().catch(() => "");
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {}
    if (!res.ok) throw new Error(data.error || data.message || "Upload failed");
    return data;
  };

  const resetAttachments = () => {
    images.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    setImages([]);
    setFolder(null);
    setErrors([]);
  };

  const sendMessage = async () => {
    if ((!newMessage || !newMessage.trim()) && images.length === 0 && !folder)
      return;
    if (!token) return;
    setErrors([]);
    setSending(true);
    const firstMessage = newMessage;
    setNewMessage("");
    try {
      let attachments = null;
      if (images.length > 0 || folder) {
        attachments = await uploadAttachments();
      }
      const userMsg = {
        role: "user",
        content: firstMessage || "",
        createdAt: new Date().toISOString(),
        attachments: attachments || null,
      };
      setMessages((prev) => [...prev, userMsg]);
      const userMessageForApi = {
        role: "user",
        content: firstMessage || "",
        ...(attachments ? { attachments } : {}),
      };
      let modelName = "gpt-3.5-turbo";
      if (attachments?.images?.length > 0) {
        modelName = "gpt-4o-mini";
      }
      let payload;
      if (conversationId) {
        payload = {
          model: modelName,
          conversationId,
          messages: [userMessageForApi],
        };
      } else {
        payload = {
          model: modelName,
          title: (firstMessage || "").slice(0, 60),
          messages: [
            { role: "system", content: "How can i help you." },
            userMessageForApi,
          ],
        };
      }
      const res = await chatApi.sendChat(token, payload);
      const newId = res.conversationId;
      const aiContent = res.reply || "⚠ No reply from AI";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiContent,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (!conversationId && newId) {
        onSelectConversation?.(newId);
        updateConversationMeta?.(newId, {
          title: payload.title || (firstMessage || "New Chat").slice(0, 60),
          lastMessagePreview: aiContent.slice(0, 120),
          updatedAt: new Date().toISOString(),
        });
      } else if (conversationId) {
        updateConversationMeta?.(conversationId, {
          lastMessagePreview: aiContent.slice(0, 120),
          updatedAt: new Date().toISOString(),
        });
      }
      resetAttachments();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠ Chat error - see console" },
      ]);
      addError(err.message || "Chat failed");
    } finally {
      setSending(false);
    }
  };

  const commonStyle = { transition: "all 0.3s" };

  const renderAttachments = (att) => {
    if (!att) return null;
    const imgs = Array.isArray(att.images) ? att.images : [];
    const folderObj = att.folder;
    return (
      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {imgs.map((img, i) => (
          <img
            key={i}
            src={absUrl(img.url)}
            alt={img.name || "image"}
            crossOrigin={undefined}
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#fff",
            }}
            loading="lazy"
          />
        ))}
        {folderObj && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "6px 10px",
              background: isDark ? "#2a2a2a" : "#f9f9f9",
              color: isDark ? "#fff" : "#000",
            }}
            title={`${folderObj.name} • ${folderObj.count} files • ${bytesToMB(
              folderObj.totalSize || 0
            )}`}
          >
            <span>
              📁 {folderObj.name} · {folderObj.count} files ·{" "}
              {bytesToMB(folderObj.totalSize || 0)}
            </span>
            <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
              {(folderObj.files || [])
                .filter((f) => (f.mime || "").startsWith("image/"))
                .slice(0, 3)
                .map((f, idx) => (
                  <img
                    key={idx}
                    src={absUrl(f.url)}
                    alt="preview"
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "cover",
                      borderRadius: 4,
                      border: "1px solid #ddd",
                    }}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const composerProps = {
    theme,
    newMessage,
    setNewMessage,
    sendMessage,
    onPaste,
    onSelectImages,
    onSelectFolder,
    images,
    folder,
    removeImage,
    clearFolder,
    sending,
    errors,
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <Navbar theme={theme} />
      {/* --- NEW: MARQUEE COMPONENT --- */}
      <div
        className="marquee-container"
        style={{
          backgroundColor: isDark ? '#343a40' : '#fffbe6',
          padding: '0.5rem 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          borderBottom: isDark ? '1px solid #495057' : '1px solid #ffeeba'
        }}
      >
        <p 
          className="marquee-text"
          style={{
            color: isDark ? '#f8f9fa' : '#856404',
            margin: 0,
            display: 'inline-block',
            animation: 'marquee-animation 25s linear infinite'
          }}
        >
          {marqueeText}
        </p>
      </div>
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          // minHeight: "80vh",
          padding: "1rem",
          border: dragActive ? "2px dashed #0d6efd" : "none",
          borderRadius: 10,
        }}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {!started ? (
          <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1 text-center">
            <motion.h1
              className="fw-bold mb-3"
              style={{
                fontSize: "2.5rem",
                display: "flex",
                gap: "0.1rem",
                background:
                  "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shine 6s linear infinite",
              }}
            >
              {("Hello " + (user?.name || "User"))
                .split("")
                .map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                  >
                    {letter}
                  </motion.span>
                ))}
            </motion.h1>
            <motion.h5
              style={{
                color: isDark ? "#ccc" : "#333",
                marginBottom: "1rem",
                fontWeight: 400,
              }}
            >
              {"How can I assist you today?".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.h5>
            <motion.p
              style={{
                fontSize: "0.95rem",
                color: isDark ? "#aaa" : "#555",
                fontStyle: "italic",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              {randomTip}
            </motion.p>
            <div className="w-75 mt-4">
              <ComposerUI {...composerProps} />
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex-grow-1 mb-3"
              style={{ overflowY: "auto", paddingRight: "5px" }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`my-2 ${
                    msg.role === "user" ? "text-end" : "text-start"
                  }`}
                >
                  <div
                    className="d-inline-block px-3 py-2 rounded position-relative"
                    style={{
                      ...commonStyle,
                      maxWidth: "75%",
                      whiteSpace: "pre-wrap",
                      backgroundColor:
                        msg.role === "user"
                          ? isDark
                            ? "#444"
                            : "#e9ecef"
                          : isDark
                          ? "#555"
                          : "#6c757d",
                      color:
                        msg.role === "user"
                          ? isDark
                            ? "#fff"
                            : "#000"
                          : "#fff",
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div className="text-end mb-1">
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className="btn btn-sm btn-light"
                            style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                          >
                            {copiedIndex === i ? "✅ Copied!" : "📋 Copy"}
                          </button>
                        </div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              const codeText = String(children).replace(
                                /\n$/,
                                ""
                              );
                              if (!inline && match) {
                                return (
                                  <div
                                    className="position-relative mb-2"
                                    style={commonStyle}
                                  >
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {codeText}
                                    </SyntaxHighlighter>
                                    <button
                                      onClick={() => handleCopy(codeText, i)}
                                      className="btn btn-sm btn-light position-absolute top-0 end-0 me-1 mt-1"
                                      style={{
                                        fontSize: "0.75rem",
                                        padding: "2px 6px",
                                      }}
                                    >
                                      {copiedIndex === i
                                        ? "✅ Copied!"
                                        : "Copy code"}
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <code
                                  className="bg-dark text-white px-1 rounded"
                                  style={commonStyle}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {msg.attachments
                          ? renderAttachments(msg.attachments)
                          : null}
                      </>
                    ) : (
                      <>
                        {msg.content}
                        {msg.attachments
                          ? renderAttachments(msg.attachments)
                          : null}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              {sending && (
                <div
                  className="d-flex align-items-center fst-italic mb-2"
                  style={{ gap: 4 }}
                >
                  {[0, 1, 2].map((n) => (
                    <motion.span
                      key={n}
                      style={{
                        fontSize: "1.5rem",
                        color: isDark ? "#0dcaf0" : "#0d6efd",
                      }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: n * 0.2,
                      }}
                    >
                      •
                    </motion.span>
                  ))}
                  <span
                    style={{ marginLeft: 8, color: isDark ? "#ccc" : "#555" }}
                  >
                    AI is typing...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="mt-auto">
              <ComposerUI {...composerProps} />
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes shine { 
          0% { background-position: 0% center; } 
          100% { background-position: 200% center; } 
        }
        @keyframes marquee-animation {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}