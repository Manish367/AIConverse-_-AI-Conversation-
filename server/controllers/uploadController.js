const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 3;
const MAX_FOLDER_FILES = 10;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Safer: drop any directories and keep only a clean basename
function safeName(name = '') {
  const base = path.basename(String(name)); // drops any directories
  return base.replace(/[^a-zA-Z0-9._-]/g, '_'); // only allow safe chars
}

function toPublicUrl(absPath) {
  const rel = path.relative(UPLOAD_DIR, absPath).split(path.sep).join('/');
  return '/uploads/' + rel;
}

function saveBuffer(buffer, destDir, originalname) {
  ensureDir(destDir);
  const unique = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
  const base = safeName(originalname || 'file');
  const finalName = `${unique}-${base}`;
  const finalPath = path.join(destDir, finalName);
  fs.writeFileSync(finalPath, buffer);
  return { path: finalPath, url: toPublicUrl(finalPath), name: finalName };
}

exports.messageAttachments = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const images = (req.files?.images || []);
    const folderFiles = (req.files?.folderFiles || []);
    const folderName = (req.body?.folderName || 'folder').toString().slice(0, 80);

    // Validate images
    if (images.length > MAX_IMAGES) {
      return res.status(400).json({ error: `Max ${MAX_IMAGES} images allowed` });
    }
    for (const f of images) {
      if (!f.mimetype?.startsWith('image/')) {
        return res.status(400).json({ error: `Invalid image type: ${f.originalname}` });
      }
      if (f.size > MAX_BYTES) {
        return res.status(400).json({ error: `Image too large: ${f.originalname}` });
      }
    }

    // Validate folder
    if (folderFiles.length > 0) {
      if (folderFiles.length > MAX_FOLDER_FILES) {
        return res.status(400).json({ error: `Folder can contain at most ${MAX_FOLDER_FILES} files` });
      }
      const total = folderFiles.reduce((s, f) => s + (f.size || 0), 0);
      if (total > MAX_BYTES) {
        return res.status(400).json({ error: 'Folder total size exceeds 10 MB' });
      }
    }

    // Save files
    const baseDir = path.join(UPLOAD_DIR, 'users', String(userId));
    const imagesDir = path.join(baseDir, 'images');
    const folderDir = path.join(baseDir, 'folders', safeName(folderName) + '-' + crypto.randomBytes(4).toString('hex'));

    const savedImages = images.map((f) => {
      const saved = saveBuffer(f.buffer, imagesDir, f.originalname);
      return {
        name: safeName(f.originalname),
        url: saved.url,
        size: f.size,
        mime: f.mimetype,
      };
    });

    let savedFolder = null;
    if (folderFiles.length > 0) {
      const files = folderFiles.map((f) => {
        // Preserve original relative path as metadata (sanitized), but save to disk using basename only
        const relOriginal = String(f.originalname || f.fieldname || 'file');
        const relPathMeta = relOriginal.replace(/[\u0000-\u001F]/g, '').slice(0, 200); // safe-ish metadata
        const basenameOnly = path.basename(relOriginal);
        const saved = saveBuffer(f.buffer, folderDir, basenameOnly);
        return {
          name: safeName(basenameOnly),
          relPath: relPathMeta, // metadata only, not used for writing
          url: saved.url,
          size: f.size,
          mime: f.mimetype,
        };
      });

      savedFolder = {
        name: folderName,
        count: files.length,
        totalSize: files.reduce((s, x) => s + (x.size || 0), 0),
        files,
      };
    }

    return res.json({
      images: savedImages, // [{ name, url, size, mime }]
      folder: savedFolder, // { name, count, totalSize, files: [...] } or null
    });
  } catch (err) {
    console.error('messageAttachments error:', err?.message || err);
    return res.status(500).json({ error: 'Upload failed', details: err?.message });
  }
};