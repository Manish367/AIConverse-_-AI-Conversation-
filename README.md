# AIConverse — AI Conversation Platform

A full-stack, ChatGPT-style conversational AI platform built with React and Node.js. AIConverse supports persistent multi-conversation chat, image-based vision queries, and AI image generation — all backed by a resilient, multi-provider architecture designed to keep working even when a given AI service is down, rate-limited, or out of free credits.

**Live demo:** ai-converse-ai-conversation.vercel.app
**Repo:** https://github.com/Manish367/AIConverse-_-AI-Conversation-

---

## ✨ Features

### Chat
- Persistent, multi-conversation chat history (create, rename, delete, revisit past conversations)
- Vision queries — upload an image and ask questions about it (GPT-4o-mini)
- Model selector — dynamically lists available OpenAI models
- Context-window trimming — automatically caps conversation history sent to the model (by turn count and character length) to control token usage and cost
- Six-layer AI provider fallback chain for chat completions: **OpenAI → ChatAnywhere (dual endpoints) → OpenRouter → Pollinations → HuggingFace → DeepAI** — if one provider fails or rate-limits, the app automatically tries the next

### Image Generation
- Multiple selectable image-generation providers: **Pollinations, DeepAI, Stable Horde**
- Stable Horde integration includes:
  - Async job submission + polling with exponential backoff on rate limits (HTTP 429)
  - Image-to-image mode (modify an existing image via prompt)
- AI-generated, human-friendly fallback messages when image generation fails (instead of raw error text)
- Image threads — generations are grouped into their own persistent, revisitable threads (separate from chat conversations)
- Image uploads via Cloudinary, with file-type and size validation (max 3 images, 10MB each)

### Platform
- JWT-based authentication
- MongoDB/Mongoose persistence for users, conversations, and image threads
- REST API with clean separation of concerns (routes → controllers → config/providers)

---

## 🛠️ Tech Stack

**Frontend:** React.js, React Router, Bootstrap, Framer Motion, React Markdown, React Syntax Highlighter, FontAwesome

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer, Cloudinary, Axios

**AI Providers:**
- Chat: OpenAI, ChatAnywhere, OpenRouter, Pollinations, HuggingFace, DeepAI
- Vision: OpenAI (GPT-4o-mini)
- Image Generation: Pollinations, DeepAI, Stable Horde

---

## 🏗️ Architecture Notes

The most interesting engineering in this project is the **resilience layer**:

- Rather than depending on a single AI API, both chat and image generation are built as provider-agnostic functions that try a prioritized list of services in sequence, normalizing each provider's response shape into a consistent format before returning it to the frontend.
- The Stable Horde integration handles the fact that it's a free, crowd-sourced, queue-based service — the backend submits a generation job, then polls for completion with exponential backoff whenever it hits a 429, rather than failing immediately.
- When every fallback for image generation fails, instead of surfacing a raw error to the user, the backend calls the OpenAI chat API to generate a short, friendly explanation of what likely went wrong and what the user can try next.

---

## 📁 Project Structure

```
AIConverse/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Chat UI, image cards, sidebar, auth forms, navbar
│       ├── context/        # App-level state/context providers
│       ├── hooks/          # Custom React hooks
│       └── routes/         # Protected route handling
└── server/                 # Express backend
    ├── config/             # DB, JWT, Cloudinary, and AI provider configs
    ├── controllers/        # Auth, chat, image, model, upload logic
    ├── middleware/          # JWT auth middleware
    ├── models/              # Mongoose schemas (Conversation, ImageThread, ImageGeneration)
    └── routes/              # Express route definitions
```

---

## ⚙️ Environment Variables

The server expects a `.env` file with (as applicable to the providers you want enabled):

```
OPENAI_API_KEY=
CHATANYWHERE_API_KEY=
OPENROUTER_API_KEY=
HF_API_KEY=
DEEPAI_API_KEY=
STABLEHORDE_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MONGODB_URI=
JWT_SECRET=
```

---

## 🚀 Running Locally

```bash
# Server
cd server
npm install
npm start

# Client (in a separate terminal)
cd client
npm install
npm start
```

---

## 📌 Note on the Live Demo

The hosted demo has been taken offline. This was a personal learning project built to explore multi-provider AI integration, resilience patterns, and full-stack architecture — not affiliated with or endorsed by OpenAI, Stability AI, DeepAI, or any other referenced service.

---

## 👤 Author

**Monish Kumar Das**
[LinkedIn](https://linkedin.com/in/monish-kumar-das-07662b17b/) · [GitHub](https://github.com/Manish367)
