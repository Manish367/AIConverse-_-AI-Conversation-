import { API_URL } from "../config/constants";

export const imagesApi = {
  async createThread(token, title) {
    const res = await fetch(`${API_URL}/api/images/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create image chat");
    return res.json(); // { id, title, createdAt }
  },

  async listThreads(token) {
    const res = await fetch(`${API_URL}/api/images/threads`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error("Failed to fetch image chats");
    return res.json(); // { items: [...] }
  },

  async listThreadItems(token, threadId) {
    const res = await fetch(`${API_URL}/api/images/threads/${threadId}/items`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error("Failed to fetch images in chat");
    return res.json(); // { items: [...] }
  },

  async generate(token, { threadId, prompt, provider, params }) {
    const res = await fetch(`${API_URL}/api/images/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ threadId, prompt, provider, params }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || data.message || "Image generation failed");
    return data; // { id, threadId, imageUrl, previewUrl, provider }
  },

  async deleteThread(token, threadId) {
    const res = await fetch(`${API_URL}/api/images/threads/${threadId}`, {
      method: "DELETE",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      throw new Error(data.error || "Failed to delete image thread");
    }
    return res.json(); // { ok: true, id }
  },

  async deleteImage(token, imageId) {
    const res = await fetch(`${API_URL}/api/images/${imageId}`, {
      method: "DELETE",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      throw new Error(data.error || "Failed to delete image");
    }
    return res.json(); // { ok: true, id }
  },
};