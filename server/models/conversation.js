const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["system", "user", "assistant", "tool"], required: true },
    content: { type: String, required: true },
    provider: String,
    model: String,
    // NEW: store attachment metadata alongside the message
    // Shape returned by /api/uploads/message-attachments: { images: [...], folder: {...} }
    attachments: { type: Object, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title: { type: String, default: "" },
    model: { type: String, default: "gpt-3.5-turbo" },
    provider: String,
    messages: { type: [MessageSchema], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);