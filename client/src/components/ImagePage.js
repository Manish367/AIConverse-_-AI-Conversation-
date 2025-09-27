import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import ImageCard from "./ImageCard";
import { useAuth } from "../context/AuthContext";
import { imagesApi } from "../lib/imagesApi";
import { API_URL } from "../config/constants";

const MAX_IMAGES = 1;
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImagesPage({
  theme,
  imageThreadId,
  onSelectImageThread,
  onRefreshImageThreads,
}) {
  const { user, token } = useAuth();
  const [imagePrompt, setImagePrompt] = useState("");
  const [provider, setProvider] = useState("stablehorde");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [randomTip, setRandomTip] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [items, setItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);
  const isDark = theme === "dark";
  const started = items.length > 0;

  const [isAttachButtonVisible, setAttachButtonVisible] = useState(false);
  const [isAttachButtonSticky, setAttachButtonSticky] = useState(false);
  const attachMenuRef = useRef(null);

    // --- Marquee text ---
  const marqueeText = "Please Note: Deep AI will not work due to credit expiry, Generated images expire in 30 mins. After that, they may break, and editing uploads may fail due to free AI limits";

  // All original useEffects, preserved and functional
  useEffect(() => {
    const tips = [
      "💡 Tip: Use descriptive prompts for better results!",
      "🌟 Try combining styles for creative results!",
    ];
    setRandomTip(tips[Math.floor(Math.random() * tips.length)]);
    const intros = [
      "✨ Start creating your visual stories with AI.",
      "🎨 Describe your imagination and let AI paint it.",
    ];
    setIntroMessage(intros[Math.floor(Math.random() * intros.length)]);
  }, []);

  useEffect(() => {
    const placeholders = [
      "A cat wearing a wizard hat...",
      "Make the background snowy...",
      "Turn this into a Picasso painting...",
    ];
    const setRandom = () =>
      setPlaceholder(
        placeholders[Math.floor(Math.random() * placeholders.length)]
      );
    setRandom();
    const startCycle = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(setRandom, 5000);
    };
    if (!imagePrompt) startCycle();
    return () => clearInterval(intervalRef.current);
  }, [imagePrompt]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token || !imageThreadId) {
      setItems([]);
      return;
    }
    (async () => {
      try {
        const data = await imagesApi.listThreadItems(token, imageThreadId);
        const mappedItems = data.items
          .map((item) => [
            {
              type: "user",
              id: `${item.id}-user`,
              prompt: item.prompt,
              images: (item.params?.inputImages || []).map(
                (img) => img.url),
            },
            { type: "ai", id: item.id, ...item },
          ])
          .flat();
        setItems(mappedItems);
      } catch (e) {
        console.error("Failed to load images for chat", e);
      }
    })();
  }, [token, imageThreadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items, loading]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  useEffect(() => {
    if (!loading) return;
    const messages = [
      { text: "Sending to the image queue...", delay: 0 },
      { text: "Waiting for a free worker...", delay: 5000 },
      { text: "The queue is busy, this might take a moment...", delay: 20000 },
      {
        text: "Still waiting, the free service is under heavy load...",
        delay: 60000,
      },
    ];
    const timeouts = messages.map((msg) =>
      setTimeout(() => setLoadingMessage(msg.text), msg.delay)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  const addError = (msg) => setErrors((e) => [...e, msg]);

  const onSelectFiles = (e) => {
    setErrors([]);
    const chosen = Array.from(e.target.files || []).slice(
      0,
      MAX_IMAGES - files.length
    );
    const valid = [],
      urls = [];
    chosen.forEach((f) => {
      if (!f.type.startsWith("image/")) {
        addError(`Not an image: ${f.name}`);
        return;
      }
      if (f.size > MAX_BYTES) {
        addError(`Too large (>10 MB): ${f.name}`);
        return;
      }
      valid.push(f);
      urls.push(URL.createObjectURL(f));
    });
    setFiles((p) => [...p, ...valid]);
    setPreviews((p) => [...p, ...urls]);
    e.target.value = "";
  };
  
  const handleFileSelect = (e) => {
    onSelectFiles(e); // Call original function
    setAttachButtonSticky(false);
    setAttachButtonVisible(false);
  };

  const removeAt = (i) => {
    const newFiles = [...files],
      newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews.splice(i, 1)[0]);
    newFiles.splice(i, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleCopyPrompt = (promptText) => {
    if (!promptText) return;
    navigator.clipboard
      .writeText(promptText)
      .then(() => alert("Prompt copied to clipboard!"))
      .catch((err) => console.error("Failed to copy prompt:", err));
  };

  const handleRegenerate = (imageToRegen) => {
    if (!imageToRegen || loading) return;
    generateImage({
      prompt: imageToRegen.prompt,
      provider: imageToRegen.provider,
      params: imageToRegen.params,
      inputImages: imageToRegen.params?.inputImages || [],
    });
  };

  const uploadInputImages = async (filesToUpload) => {
    if (!filesToUpload?.length) return { images: [] };
    const fd = new FormData();
    filesToUpload.forEach((f) => fd.append("images", f));
    const res = await fetch(`${API_URL}/api/images/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  };

  const generateImage = async (overrideData = {}) => {
    const promptText = overrideData.prompt || imagePrompt.trim();
    const filesToProcess = overrideData.files || files;
    const inputImagesToUse = overrideData.inputImages || [];
    if (
      !promptText &&
      filesToProcess.length === 0 &&
      inputImagesToUse.length === 0
    )
      return;
    if (!token) return;
    setLoading(true);
    setErrors([]);
    if (!overrideData.prompt) {
      setImagePrompt("");
      setFiles([]);
      setPreviews([]);
    }
    let uploaded = { images: inputImagesToUse };
    if (filesToProcess.length > 0) {
      try {
        uploaded = await uploadInputImages(filesToProcess);
      } catch (uploadErr) {
        addError(`Upload failed: ${uploadErr.message}`);
        setLoading(false);
        return;
      }
    }
    const userInputItem = {
      type: "user",
      id: `user-${Date.now()}`,
      prompt: promptText,
      images: uploaded.images.map((img) => `${API_URL}${img.url}`),
    };
    setItems((prev) => [...prev, userInputItem]);
    const tempId = `temp-${Date.now()}`;
    const pendingItem = {
      type: "ai",
      id: tempId,
      status: "pending",
      prompt: promptText,
    };
    setItems((prev) => [...prev, pendingItem]);
    try {
      const body = {
        prompt: promptText,
        provider: overrideData.provider || provider,
        params: overrideData.params || {},
        inputImages: uploaded.images,
      };
      if (imageThreadId) {
        body.threadId = imageThreadId;
      } else {
        body.threadTitle = promptText;
      }
      const res = await fetch(`${API_URL}/api/images/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.details || data.error || "Generation failed");
      if (!imageThreadId && data.threadId) onSelectImageThread(data.threadId);
      const finalItem = {
        type: "ai",
        id: data.id,
        prompt: promptText,
        provider: data.provider || provider,
        url: data.imageUrl,
        previewUrl: data.previewUrl,
        status: "succeeded",
        params: body.params,
      };
      setItems((prev) => prev.map((it) => (it.id === tempId ? finalItem : it)));
      onRefreshImageThreads?.();
    } catch (err) {
      console.error("Image generation error:", err);
      const failedItem = {
        type: "ai",
        id: tempId,
        status: "failed",
        error: err.message,
        prompt: promptText,
      };
      setItems((prev) =>
        prev.map((it) => (it.id === tempId ? failedItem : it))
      );
    } finally {
      setLoading(false);
    }
  };

  const commonStyle = { transition: "all 0.3s" };
  const ChatRow = ({ children, align }) => (
    <div
      style={{
        display: "flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
  const PromptBubble = ({ text, images }) => (
    <div
      style={{
        maxWidth: 600,
        padding: "10px 12px",
        borderRadius: 12,
        background: isDark ? "#232323" : "#ffffff",
        color: isDark ? "#f1f5f9" : "#0f172a",
        border: isDark ? "1px solid #2b2b2b" : "1px solid #e5e7eb",
        boxShadow: isDark
          ? "0 2px 6px rgba(255,255,255,0.06)"
          : "0 2px 6px rgba(0,0,0,0.06)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text}
      {images?.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Input"
              style={{
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

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
      {!started ? (
        <div
          className="d-flex flex-column align-items-center"
          style={{ padding: "1rem", flex: 1, justifyContent: "center" }}
        >
          <motion.h1
            className="fw-bold mb-3 text-center"
            style={{ fontSize: "2.5rem", display: "flex", gap: "0.1rem" }}
          >
            {("Hello " + (user?.name || "User"))
              .split("")
              .map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    backgroundImage:
                      "linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% auto",
                    animation: "shine 3s linear infinite",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
          </motion.h1>
          <motion.h5
            className="text-center"
            style={{
              color: isDark ? "#ccc" : "#333",
              marginBottom: "1rem",
              fontWeight: 400,
            }}
          >
            {introMessage.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.03 * i }}
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
              marginBottom: "1.5rem",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {randomTip}
          </motion.p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 900,
            margin: "0 auto",
            padding: "1rem 1rem 0",
            overflowY: "auto",
          }}
        >
          {items.map((item) =>
            item.type === "user" ? (
              <ChatRow key={item.id} align="left">
                <PromptBubble text={item.prompt} images={item.images} />
              </ChatRow>
            ) : (
              <ChatRow key={item.id} align="right">
                <ImageCard
                  image={item}
                  theme={theme}
                  loadingMessage={loadingMessage}
                  onCopyPrompt={handleCopyPrompt}
                  onRegenerate={handleRegenerate}
                />
              </ChatRow>
            )
          )}
        </div>
      )}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: "1rem",
          position: "sticky",
          bottom: "2rem",
          background: "transparent", // Making background transparent to not block content underneath
        }}
      >
        <div ref={attachMenuRef} style={{ position: "relative" }}>
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
              width="20"
              height="20"
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
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              color: isDark ? "#fff" : "#000",
              height: "3rem",
              paddingLeft: "42px",
            }}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generateImage();
              }
            }}
          />
          {!imagePrompt && (
            <div
              style={{
                position: "absolute",
                left: "40px",
                top: "50%",
                transform: "translateY(-50%)",
                color: isDark ? "#aaa" : "#666",
                pointerEvents: "none",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholder}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {placeholder}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
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
              }}
            >
              <button
                className="btn btn-outline-secondary"
                style={{ height: "3rem", background: isDark ? "#333" : "#fff" }}
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_IMAGES}
              >
                + Image ({files.length}/{MAX_IMAGES})
              </button>
            </motion.div>
          )}
        </div>
        <div className="d-flex gap-2 mt-2 align-items-center">
          <select
            className="form-select"
            style={{
              ...commonStyle,
              width: 220,
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              color: isDark ? "#fff" : "#000",
              height: "3rem",
            }}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="stablehorde">Stable Horde (Image Edit)</option>
            <option value="pollinations">Pollinations (Text-to-Image)</option>
            <option value="deepai">DeepAI (Text-to-Image)</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileSelect} // Use the new handler
          />
          <button
            className="btn btn-primary flex-grow-1"
            style={{ ...commonStyle, height: "3rem" }}
            onClick={() => generateImage()}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
        {previews.length > 0 && (
          <div className="mt-2 d-flex gap-2">
            {previews.map((src, i) => (
              <div key={i} className="position-relative">
                <img
                  src={src}
                  alt="preview"
                  style={{
                    width: 52,
                    height: 52,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
                <button
                  className="btn btn-sm btn-dark position-absolute"
                  onClick={() => removeAt(i)}
                  style={{
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    padding: 0,
                    lineHeight: "18px",
                    borderRadius: "50%",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.length > 0 && (
          <ul className="text-danger mt-2 mb-0 ps-4">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
      @keyframes shine { 
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; } 
      }
      @keyframes marquee-animation {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        `}</style>
    </div>
  );
}