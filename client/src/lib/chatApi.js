import { apiFetch } from './apiFetch';

const BASE = '/api/chat';

export const chatApi = {
  // GET /api/chat/history
  listConversations: (token) =>
    apiFetch(`${BASE}/history`, { token }),

  // GET /api/chat/:id
  getConversation: (token, id) =>
    apiFetch(`${BASE}/${id}`, { token }),

  // POST /api/chat (handles both create and continue)
  // payload: { model?, conversationId?, messages: [{role, content}], title? }
  sendChat: (token, payload) =>
    apiFetch(`${BASE}`, { method: 'POST', body: payload, token }),

  // PATCH /api/chat/:id/title { title }
  renameConversation: (token, id, title) =>
    apiFetch(`${BASE}/${id}/title`, {
      method: 'PATCH',
      body: { title },
      token,
    }),

  // DELETE /api/chat/:id
  deleteConversation: (token, id) =>
    apiFetch(`${BASE}/${id}`, { method: 'DELETE', token }),
};