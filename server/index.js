require("dotenv").config();
console.log("API Key exists?", !!process.env.OPENAI_API_KEY);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const modelRoutes = require("./routes/models");
const imageRoutes = require("./routes/image");
const uploadRoutes = require("./routes/uploads");

// Init app
const app = express();

// -------------------- MIDDLEWARES -------------------- //

// Configure Helmet to allow cross-origin resource requests.
app.use(helmet({ crossOriginResourcePolicy: false }));

// Define CORS options
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// -------------------- STATIC UPLOADS -------------------- //
// NOTE: old local uploads removed -> Cloudinary now handles hosting.
// So we completely skip creating/serving `uploads/` folder.
// If you keep this, it can conflict or be redundant.
// ---- Removed this section:
// const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
// if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// app.use("/uploads", express.static(UPLOAD_DIR));

// -------------------- API ROUTES -------------------- //
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/uploads", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    openaiKey: !!process.env.OPENAI_API_KEY,
    chatanywhereKey: !!process.env.CHATANYWHERE_API_KEY,
    deepaiKey: !!process.env.DEEPAI_API_KEY,
    hfKey: !!process.env.HF_API_KEY,
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY,
  });
});

// -------------------- SERVE FRONTEND BUILD -------------------- //
const clientBuildPath = path.join(__dirname, "client", "build");
if (fs.existsSync(clientBuildPath)) {
  console.log("Serving React build from", clientBuildPath);
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// -------------------- 404 + ERROR HANDLERS -------------------- //
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
      console.log("Server is running...");
    });

    server.on("error", (err) => {
      console.error("Error starting server:", err);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();