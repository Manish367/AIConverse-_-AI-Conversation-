import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import ChatPage from "../components/ChatPage";
import ImagesPage from "../components/ImagePage";
import { useAuth } from "../context/AuthContext";
import { imagesApi } from "../lib/imagesApi";
import { chatApi } from "../lib/chatApi";

export default function HomePage() {
  const { token, user, logout } = useAuth();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("activePage") || "chat"
  );
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(() =>
    localStorage.getItem("selectedConversationId")
  );
  const [imageThreads, setImageThreads] = useState([]);
  const [selectedImageThreadId, setSelectedImageThreadId] = useState(() =>
    localStorage.getItem("selectedImageThreadId")
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

  useEffect(() => {
    if (selectedConversationId)
      localStorage.setItem("selectedConversationId", selectedConversationId);
    else localStorage.removeItem("selectedConversationId");
  }, [selectedConversationId]);

  useEffect(() => {
    if (selectedImageThreadId)
      localStorage.setItem("selectedImageThreadId", selectedImageThreadId);
    else localStorage.removeItem("selectedImageThreadId");
  }, [selectedImageThreadId]);

  // 2. Wrap your functions in useCallback
  const refreshConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.listConversations(token);
      const items = Array.isArray(data) ? data : data?.items || [];
      items.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setConversations(items);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  }, [token]); // Add `token` as a dependency for this function

  const refreshImageThreads = useCallback(async () => {
    if (!token) return;
    try {
      const data = await imagesApi.listThreads(token);
      const items = data.items || [];
      items.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setImageThreads(items);
    } catch (err) {
      console.error("Failed to load image threads", err);
    }
  }, [token]); // Add `token` as a dependency for this function

  useEffect(() => {
    if (!token) {
      setConversations([]);
      setSelectedConversationId(null);
      setImageThreads([]);
      setSelectedImageThreadId(null);
      return;
    }
    refreshConversations();
    refreshImageThreads();
    // 3. Now you can safely add the stable functions to the dependency array
  }, [token, refreshConversations, refreshImageThreads]);

  // ... rest of your component logic (no changes needed below)

  const onToggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  const onSelectPage = (key) => setActivePage(key);

  const onSelectConversation = (id) => {
    setSelectedConversationId(id);
    setActivePage("chat");
  };
  const onNewConversation = () => {
    setSelectedConversationId(null);
    setActivePage("chat");
  };

  const onRenameConversation = async (id) => {
    const current = conversations.find((c) => c.id === id);
    const title = window.prompt(
      "Rename conversation",
      current?.title || "Untitled"
    );
    if (title == null) return;
    try {
      await chatApi.renameConversation(token, id, title);
      await refreshConversations();
    } catch (err) {
      window.alert("Failed to rename conversation");
    }
  };

  const onDeleteConversation = async (id) => {
    try {
      await chatApi.deleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) setSelectedConversationId(null);
    } catch (err) {
      window.alert("Failed to delete conversation");
    }
  };

  const updateConversationMeta = (id, patch) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) {
        const item = {
          id,
          title: patch.title || "Untitled",
          lastMessagePreview: patch.lastMessagePreview || "",
          updatedAt: patch.updatedAt || new Date().toISOString(),
        };
        const list = [item, ...prev];
        list.sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
        return list;
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      updated.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      return updated;
    });
  };

  const onSelectImageThread = (id) => {
    setSelectedImageThreadId(id);
    setActivePage("images");
  };
  const onNewImageThread = () => {
    setSelectedImageThreadId(null);
    setActivePage("images");
  };

  const onDeleteImageThread = async (id) => {
    if (!window.confirm("Delete this image chat (and its images)?")) return;
    try {
      await imagesApi.deleteThread(token, id);
      await refreshImageThreads();
      if (selectedImageThreadId === id) setSelectedImageThreadId(null);
    } catch (err) {
      window.alert("Failed to delete image chat");
    }
  };

  return (
    <Layout
      activePage={activePage}
      onSelectPage={onSelectPage}
      theme={theme}
      onToggleTheme={onToggleTheme}
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      onSelectConversation={onSelectConversation}
      onRenameConversation={onRenameConversation}
      onDeleteConversation={onDeleteConversation}
      onNewConversation={onNewConversation}
      imageThreads={imageThreads}
      selectedImageThreadId={selectedImageThreadId}
      onSelectImageThread={onSelectImageThread}
      onNewImageThread={onNewImageThread}
      onRefreshImageThreads={refreshImageThreads}
      onDeleteImageThread={onDeleteImageThread}
      user={{ username: user?.name || "User", email: user?.email || "" }}
      onLogout={logout}
    >
      {activePage === "chat" && (
        <ChatPage
          theme={theme}
          conversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          updateConversationMeta={updateConversationMeta}
        />
      )}
      {activePage === "images" && (
        <ImagesPage
          theme={theme}
          imageThreadId={selectedImageThreadId}
          onSelectImageThread={setSelectedImageThreadId}
          onRefreshImageThreads={refreshImageThreads}
        />
      )}
      {activePage === "settings" && (
        <div>
          {" "}
          <h3 style={{ marginBottom: 12 }}>Settings</h3>{" "}
          <div className="mb-2">Theme: {theme}</div>{" "}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={onToggleTheme}
          >
            Toggle Theme
          </button>{" "}
        </div>
      )}
    </Layout>
  );
}
