const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const auth = require("../middleware/auth");
const uploadController = require("../controllers/uploadController");

const MAX_BYTES = 10 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "message_attachments",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 13 },
});

const router = express.Router();
router.use(auth);

router.post(
  "/message-attachments",
  upload.fields([
    { name: "images", maxCount: 3 },
    { name: "folderFiles", maxCount: 10 },
  ]),
  uploadController.messageAttachments
);

module.exports = router;