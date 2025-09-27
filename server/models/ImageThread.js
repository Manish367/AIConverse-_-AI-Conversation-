const mongoose = require("mongoose");

const ImageThreadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title: { type: String, default: "New image chat" },
    itemCount: { type: Number, default: 0 },
    lastPrompt: String,
  },
  { timestamps: true }
);

ImageThreadSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("ImageThread", ImageThreadSchema);