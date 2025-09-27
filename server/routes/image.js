const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");
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
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 3 }, fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only images allowed")), });

router.post("/uploads", upload.array("images", 3), uploadGenerationImages);
router.post("/threads", createImageThread);
router.get("/threads", listImageThreads);
router.get("/threads/:id/items", listThreadItems);
router.delete("/threads/:id", deleteImageThread);

router.post("/generate-image", generateImage);
router.post("/ai-fallback", getAIFallbackMessage);
router.delete("/:id", deleteImage);

module.exports = router;