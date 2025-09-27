const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const {
  uploadGenerationImages,
  createImageThread,
  listImageThreads,
  listThreadItems,
  deleteImageThread,
  generateImage,
  deleteImage,
  getAIFallbackMessage,
} = require("../controllers/imageController");

const router = express.Router();
router.use(auth);

const MAX_BYTES = 10 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "generation_inputs",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const upload = multer({ storage, limits: { fileSize: MAX_BYTES, files: 3 } });

router.post("/uploads", upload.array("images", 3), uploadGenerationImages);
router.post("/threads", createImageThread);
router.get("/threads", listImageThreads);
router.get("/threads/:id/items", listThreadItems);
router.delete("/threads/:id", deleteImageThread);

router.post("/generate-image", generateImage);
router.post("/ai-fallback", getAIFallbackMessage);
router.delete("/:id", deleteImage);

module.exports = router;