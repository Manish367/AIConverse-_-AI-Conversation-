const mongoose = require("mongoose");

const OutputSchema = new mongoose.Schema(
  {
    url: String,
    thumbnail: String,
    width: Number,
    height: Number,
    format: String,
  },
  { _id: false }
);

const ImageGenerationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ImageThread", index: true },
    prompt: { type: String, required: true },
    negativePrompt: String,
    provider: String,
    model: String,
    params: { type: Object, default: {} },
    outputs: { type: [OutputSchema], default: [] },
    status: { type: String, enum: ["succeeded", "failed"], default: "succeeded" },
    error: String,
  },
  { timestamps: true }
);

ImageGenerationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ImageGeneration", ImageGenerationSchema);