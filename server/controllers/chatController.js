const mongoose = require("mongoose");
const { createChatCompletion, describeImage } = require("../config/openai");
const Conversation = require("../models/conversation");

function trimHistory(msgs, maxTurns = 20, maxChars = 12000) {
  const systemMsgs = msgs.filter((m) => m.role === "system");
  const others = msgs.filter((m) => m.role !== "system");
  let acc = 0;
  const kept = [];
  for (let i = others.length - 1; i >= 0; i--) {
    const m = others[i];
    const len = (m.content || "").length;
    if (kept.length >= maxTurns * 2) break;
    if (acc + len > maxChars && kept.length > 0) break;
    acc += len;
    kept.push(m);
  }
  kept.reverse();
  return [...systemMsgs.slice(0, 1), ...kept];
}

const chat = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const { messages, model = "gpt-3.5-turbo", conversationId, title } = req.body || {};
    if (!messages?.length) return res.status(400).json({ error: "messages required" });

    let conversation = null;
    let fullMessages = messages;

    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      fullMessages = [...conversation.messages.map((m) => ({ role: m.role, content: m.content })), ...messages];
    }

    // check if last user message has attachments.images
    const lastMsg = messages[messages.length - 1];
    let result;
    if (lastMsg.attachments?.images?.length) {
      const img = lastMsg.attachments.images[0]; // only first
      result = await describeImage(img.url, lastMsg.content || "Describe this image");
    } else {
      fullMessages = trimHistory(fullMessages);
      result = await createChatCompletion({ model, messages: fullMessages });
    }

    const replyText = result.choices?.[0]?.message?.content || "";
    const assistantMsg = { role: "assistant", content: replyText, provider: result._provider, model };

    if (!conversation) {
      const initialTitle = title || (messages.find((m) => m.role === "user")?.content || "New Chat").slice(0, 60);
      conversation = await Conversation.create({
        user: userId,
        title: initialTitle,
        model,
        provider: result._provider,
        messages: [...messages, assistantMsg],
      });
    } else {
      conversation.model = model;
      conversation.provider = result._provider;
      conversation.messages.push(...messages, assistantMsg);
      await conversation.save();
    }

    res.json({ conversationId: conversation._id, provider: result._provider, reply: replyText });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed", details: err.message });
  }
};

// POST /api/chat/compare (stub or your existing logic)
const compare = async (req, res) => {
  return res.status(501).json({ error: "Not implemented" });
};

// GET /api/chat/history
// Returns { items: [...] } with id instead of _id (matches image thread shape)
const listConversations = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

    const items = await Conversation.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [{ archived: { $exists: false } }, { archived: false }],
        },
      },
      {
        $project: {
          title: 1,
          model: 1,
          provider: 1,
          createdAt: 1,
          updatedAt: 1,
          messageCount: { $size: { $ifNull: ["$messages", []] } },
          lastMessage: {
            $let: {
              vars: { last: { $arrayElemAt: ["$messages", -1] } },
              in: { $ifNull: ["$$last.content", ""] },
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: limit },
    ]);

    res.json({
      items: items.map((c) => ({
        id: c._id.toString(),
        title: c.title || "New Chat",
        model: c.model,
        provider: c.provider || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messageCount || 0,
        lastMessage: (c.lastMessage || "").slice(0, 120),
      })),
    });
  } catch (err) {
    console.error("listConversations error:", err.message || err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

// GET /api/chat/:id
const getConversation = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const conversation = await Conversation.findOne({ _id: req.params.id, user: userId });
    if (!conversation) return res.status(404).json({ error: "Not found" });
    res.json({ conversation });
  } catch (err) {
    console.error("getConversation error:", err.message || err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

// PATCH /api/chat/:id/title
// Now returns { conversation: { id, title } }
const renameConversation = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });

    const doc = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { title: title.slice(0, 120) } },
      { new: true }
    )
      .select("_id title")
      .lean();

    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json({ conversation: { id: doc._id.toString(), title: doc.title } });
  } catch (err) {
    console.error("renameConversation error:", err.message || err);
    res.status(500).json({ error: "Failed to rename conversation" });
  }
};

// DELETE /api/chat/:id
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    await Conversation.deleteOne({ _id: req.params.id, user: userId });
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteConversation error:", err.message || err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

module.exports = {
  chat,
  compare,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
};