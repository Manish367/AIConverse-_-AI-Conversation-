const mongoose = require("mongoose");
const ImageGeneration = require("../models/ImageGeneration");
const ImageThread = require("../models/ImageThread");
const {
  pollinationsImage,
  deepaiImage,
  stableHordeImage,
} = require("../config/openimageai");
const { createChatCompletion } = require("../config/openai");

// Pick provider
function pickProvider(name = "pollinations") {
  switch ((name || "").toLowerCase()) {
    case "deepai":
      return deepaiImage;
    case "stablehorde":
      return stableHordeImage;
    default:
      return pollinationsImage;
  }
}

// ---------------- AI fallback message ----------------
const getAIFallbackMessage = async (req, res) => {
  const { prompt, error } = req.body;
  try {
    const systemMessage =
      "You are an AI assistant for an image generation app. The user's image generation failed. Your task is to provide a brief, friendly, and helpful message. Explain that the free AI service might be busy or the request was too complex. Encourage them to try again, simplify their prompt, or use more descriptive words. Do not use markdown or formatting. Keep it to 2-3 sentences.";
    const userMessage = `The user's prompt was: "${prompt}". The technical error was: "${error}". Generate the friendly failure message now.`;

    const result = await createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const fallbackText =
      result.choices?.[0]?.message?.content ||
      "Sorry, the image generation failed. The free service might be busy. Please try again with a simpler or more descriptive prompt.";
    res.json({ fallbackMessage: fallbackText });
  } catch (err) {
    console.error("AI Fallback generation failed:", err);
    res.status(500).json({ error: "Failed to generate fallback message." });
  }
};

// ---------------- Upload input images ----------------
const uploadGenerationImages = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const MAX_BYTES = 10 * 1024 * 1024;
    const files = Array.isArray(req.files)
      ? req.files
      : req.files?.images || [];
    if (!files.length)
      return res.status(400).json({ error: "No images uploaded" });
    if (files.length > 3)
      return res.status(400).json({ error: "Max 3 images allowed" });

    const images = files.map((f) => {
      if (!f.mimetype?.startsWith("image/")) {
        throw new Error(`Invalid image type: ${f.originalname}`);
      }
      if (f.size > MAX_BYTES) {
        throw new Error(`Image too large (>10 MB): ${f.originalname}`);
      }
      return {
        name: f.originalname,
        url: f.path, // Cloudinary URL
        size: f.size,
        mime: f.mimetype,
      };
    });

    return res.json({ images });
  } catch (err) {
    console.error("uploadGenerationImages error:", err?.message || err);
    return res
      .status(500)
      .json({ error: "Upload failed", details: err?.message });
  }
};

// ---------------- Threads & Generations ----------------
const createImageThread = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const title = (req.body.title || "New image chat").slice(0, 80);
    const thread = await ImageThread.create({ user: userId, title });
    res.json({
      id: thread._id.toString(),
      title: thread.title,
      createdAt: thread.createdAt,
    });
  } catch (err) {
    console.error("createImageThread error:", err?.message || err);
    res.status(500).json({ error: "Failed to create image thread" });
  }
};

const listImageThreads = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const items = await ImageThread.find({ user: userId })
      .select("_id title itemCount lastPrompt createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({
      items: items.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        itemCount: t.itemCount || 0,
        lastPrompt: t.lastPrompt || "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (err) {
    console.error("listImageThreads error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch image threads" });
  }
};

const listThreadItems = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const threadId = req.params.id;
    const docs = await ImageGeneration.find({ user: userId, thread: threadId })
      .select("_id prompt provider outputs status error createdAt params")
      .sort({ createdAt: 1 })
      .lean();
    const items = docs.map((d) => ({
      id: d._id.toString(),
      prompt: d.prompt,
      provider: d.provider,
      status: d.status,
      error: d.error,
      createdAt: d.createdAt,
      url: d.outputs?.[0]?.url || "",
      previewUrl: d.outputs?.[0]?.thumbnail || d.outputs?.[0]?.url || "",
      params: d.params,
    }));
    res.json({ items });
  } catch (err) {
    console.error("listThreadItems error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch thread images" });
  }
};

const deleteImageThread = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const threadId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(threadId))
      return res.status(400).json({ ok: false, error: "Invalid thread id" });
    const t = await ImageThread.findOne({ _id: threadId, user: userId });
    if (!t) return res.status(404).json({ error: "Thread not found" });
    await ImageGeneration.deleteMany({ user: userId, thread: threadId });
    await ImageThread.deleteOne({ _id: threadId, user: userId });
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteImageThread error:", err?.message || err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
};

const generateImage = async (req, res) => {
  const userId = req.user?.sub || req.user?.id || req.user?._id;
  const {
    prompt,
    negativePrompt,
    provider = "pollinations",
    params = {},
    threadId,
    threadTitle,
    inputImages,
  } = req.body || {};
  if (!prompt && (!inputImages || inputImages.length === 0)) {
    return res.status(400).json({ error: "Prompt or image is required" });
  }

  const images = Array.isArray(inputImages)
    ? inputImages.slice(0, 3).map((img) => ({
        name: String(img.name || ""),
        url: String(img.url || ""),
        size: Number(img.size || 0),
        mime: String(img.mime || ""),
      }))
    : [];

  let thread = null;
  try {
    if (threadId) {
      thread = await ImageThread.findOne({ _id: threadId, user: userId });
      if (!thread) return res.status(404).json({ error: "Thread not found" });
    } else {
      thread = await ImageThread.create({
        user: userId,
        title: (threadTitle || prompt || "New Image Chat").slice(0, 60),
      });
    }

    const fn = pickProvider(provider);
    const paramsWithImages = { ...params, inputImages: images };
    const result = await fn(prompt, { ...paramsWithImages, negativePrompt });

    const doc = await ImageGeneration.create({
      user: userId,
      thread: thread._id,
      prompt,
      negativePrompt,
      provider: result._provider || provider,
      model: params?.model,
      params: paramsWithImages,
      outputs: [{ url: result.imageUrl, thumbnail: result.previewUrl }],
      status: "succeeded",
    });

    await ImageThread.findByIdAndUpdate(thread._id, {
      $inc: { itemCount: 1 },
      lastPrompt: prompt,
      updatedAt: new Date(),
    });

    res.json({
      id: doc._id.toString(),
      threadId: thread._id.toString(),
      provider: result._provider || provider,
      imageUrl: result.imageUrl,
      previewUrl: result.previewUrl,
      inputImages: images,
    });
  } catch (err) {
    console.error("Image generation failed:", err?.message || err);
    try {
      await ImageGeneration.create({
        user: userId,
        thread: thread?._id,
        prompt,
        negativePrompt,
        provider,
        params: { ...params, inputImages: images },
        status: "failed",
        error: err?.message,
      });
    } catch {}
    res
      .status(500)
      .json({ error: "Image generation failed", details: err?.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, error: "Invalid image id" });
    const doc = await ImageGeneration.findOneAndDelete({
      _id: id,
      user: userId,
    }).lean();
    if (!doc)
      return res.status(404).json({ ok: false, error: "Image not found" });
    if (doc.thread) {
      const count = await ImageGeneration.countDocuments({
        user: userId,
        thread: doc.thread,
        status: "succeeded",
      });
      const last = await ImageGeneration.findOne({
        user: userId,
        thread: doc.thread,
      })
        .sort({ createdAt: -1 })
        .select("prompt")
        .lean();
      await ImageThread.findByIdAndUpdate(doc.thread, {
        $set: { itemCount: count, lastPrompt: last?.prompt || "" },
      });
    }
    res.json({ ok: true, id });
  } catch (err) {
    console.error("deleteImage error:", err?.message || err);
    res.status(500).json({ error: "Failed to delete image item" });
  }
};

module.exports = {
  uploadGenerationImages,
  createImageThread,
  listImageThreads,
  listThreadItems,
  deleteImageThread,
  generateImage,
  deleteImage,
  getAIFallbackMessage,
};
