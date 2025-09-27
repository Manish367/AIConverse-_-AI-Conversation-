const cloudinary = require("../config/cloudinary");

// handles upload of images + folders
exports.messageAttachments = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const MAX_IMAGES = 3;
    const MAX_FOLDER_FILES = 10;
    const MAX_BYTES = 10 * 1024 * 1024;

    const images = req.files?.images || [];
    const folderFiles = req.files?.folderFiles || [];
    const folderName = (req.body?.folderName || "folder").toString().slice(0, 80);

    // validate images
    if (images.length > MAX_IMAGES) {
      return res.status(400).json({ error: `Max ${MAX_IMAGES} images allowed` });
    }
    for (const f of images) {
      if (!f.mimetype?.startsWith("image/")) {
        return res.status(400).json({ error: `Invalid image type: ${f.originalname}` });
      }
      if (f.size > MAX_BYTES) {
        return res.status(400).json({ error: `Image too large: ${f.originalname}` });
      }
    }

    // validate folder
    if (folderFiles.length > 0) {
      if (folderFiles.length > MAX_FOLDER_FILES) {
        return res.status(400).json({ error: `Folder can contain at most ${MAX_FOLDER_FILES} files` });
      }
      const totalSize = folderFiles.reduce((s, f) => s + (f.size || 0), 0);
      if (totalSize > MAX_BYTES) {
        return res.status(400).json({ error: "Folder total size exceeds 10 MB" });
      }
    }

    // now files already uploaded to Cloudinary by Multer-Cloudinary storage
    const savedImages = images.map((f) => ({
      name: f.originalname,
      url: f.path, // Cloudinary URL
      size: f.size,
      mime: f.mimetype,
    }));

    let savedFolder = null;
    if (folderFiles.length > 0) {
      const files = folderFiles.map((f) => ({
        name: f.originalname,
        relPath: f.originalname, // metadata only
        url: f.path,
        size: f.size,
        mime: f.mimetype,
      }));

      savedFolder = {
        name: folderName,
        count: files.length,
        totalSize: files.reduce((s, x) => s + (x.size || 0), 0),
        files,
      };
    }

    return res.json({
      images: savedImages,
      folder: savedFolder,
    });
  } catch (err) {
    console.error("messageAttachments error:", err?.message || err);
    return res.status(500).json({ error: "Upload failed", details: err?.message });
  }
};