const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');

const uploadController = require('../controllers/uploadController');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_BYTES, // per-file
    files: 13, // 3 images + 10 folder files
  },
});

const router = express.Router();
router.use(auth);

// POST /api/uploads/message-attachments
// fields: images (<=3), folderFiles (<=10), folderName (text)
router.post(
  '/message-attachments',
  upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'folderFiles', maxCount: 10 },
  ]),
  uploadController.messageAttachments
);

module.exports = router;