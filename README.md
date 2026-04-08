<div align="center">

<img src="https://img.shields.io/badge/Raven-AI%20Knowledge%20Vault-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==" />

# 🖤 Raven AI — Your Personal Knowledge Vault

**"Raven remembers everything."**

An AI-powered knowledge vault that saves, organizes, and resurfaces anything from the web — articles, YouTube videos, PDFs, tweets, GitHub repos — connected through a living Knowledge Graph.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-7c3aed?style=flat-square)](https://raven-ai-3xlj.onrender.com)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-0891b2?style=flat-square)](https://raven-ai-backend.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)

</div>

---

## 🌟 Why Raven?

Most bookmarking tools are link graveyards. You save something, forget it exists, and never see it again. **Raven is different.**

Inspired by the raven — the most intelligent bird, known for hoarding shiny things, having a remarkable memory, and seeing patterns others miss — Raven doesn't just store links. It **reads**, **understands**, **connects**, and **resurfaces** your saved knowledge at the right moment.

---

## ✨ Key Features

### 🔍 Smart Saving
- **Auto Content Detection** — Automatically identifies articles, YouTube videos, PDFs, tweets, images, and GitHub repos from any URL
- **Web Scraper with Fallback** — Axios for fast scraping; Puppeteer for JavaScript-heavy sites
- **YouTube Transcript Extraction** — Saves and indexes full video transcripts
- **PDF Text Extraction** — Indexes PDFs with `pdf-parse`; OCR for scanned images via Tesseract.js
- **Chrome Extension** — Save any page with one click from your browser

### 🤖 AI Processing Pipeline
- **Auto Summarization** — Generates 2-4 sentence summaries + punchy short notes via Mistral AI
- **Key Points Extraction** — Distills 5 key takeaways per save
- **AI Tag Generation** — Automatically creates and assigns relevant tags
- **Topics & Keywords** — Extracts broad topics and specific domain keywords
- **Difficulty Rating** — Labels content as beginner / intermediate / advanced

### 🔎 Semantic Search
- **Vector Embeddings** — Every save is embedded using Mistral's embedding model
- **Pinecone Vector DB** — Fast approximate nearest-neighbor search across your vault
- **Hybrid Search** — Combines semantic vector search with traditional text search
- **Title/Tag Boosting** — Elevates exact matches above semantic results

### 🕸️ Knowledge Graph
- **D3.js Visualization** — Interactive force-directed graph of your entire vault
- **Three Link Types** — Shared-tag links, cluster links, embedding-similarity links (cosine ≥ 0.80)
- **Click-to-Inspect** — Click any node to open the save detail panel

### 🎯 AI Clustering
- **K-Means Clustering** — Groups semantically similar saves (K-Means++ initialization)
- **DBSCAN Clustering** — Density-based clustering; handles noise/outliers
- **AI-Generated Labels** — Each cluster gets a 2-4 word label from Mistral AI
- **Parameter Suggestion** — Auto-suggests optimal DBSCAN epsilon using k-distance graphs

### 📂 Organization
- **Collections** — Custom folders with icons and descriptions
- **Tags** — Color-coded labels; AI-generated + user-created
- **Favorites** — Star saves for quick access
- **Archive** — Soft-delete with restore capability
- **Highlights** — Save text snippets with personal notes

### 🔁 Resurfacing
- **Memory Resurface** — Intelligently resurfaces saves you haven't seen in 30+ days
- **Spaced Repetition Style** — Tracks resurface count and last-seen date
- **Homepage Memories Strip** — Shows 3 resurfaced saves on every visit

### 🔐 Authentication & Security
- **JWT Access Tokens** — Short-lived (15m), stored in memory only
- **Refresh Token Rotation** — Long-lived (30d), HTTP-only cookie; blacklisted on logout
- **OTP Email Verification** — 6-digit OTP with 1-hour expiry via Nodemailer
- **Password Reset Flow** — Secure token-based reset with email confirmation
- **Redis Token Blacklist** — Invalidates tokens instantly on logout
- **Rate Limiting** — Express-rate-limit on all API and auth routes

### ⚡ Background Processing
- **BullMQ Job Queue** — Async processing of saves without blocking the UI
- **Redis-Backed Workers** — 3 concurrent workers with exponential backoff retry (3x)
- **Job Priority Levels** — Fresh saves take priority over reprocessing jobs

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend
- React 19 + Vite 8
- Redux Toolkit + React Query
- React Router v7
- Tailwind CSS v4
- shadcn/ui components
- Framer Motion
- D3.js (knowledge graph)
- Axios

</td>
<td valign="top" width="33%">

### Backend
- Node.js 20 + Express v5
- MongoDB + Mongoose
- Redis + BullMQ
- Puppeteer (scraping fallback)
- Tesseract.js (OCR)
- Nodemailer
- Multer + Cloudinary

</td>
<td valign="top" width="33%">

### AI & Infrastructure
- Mistral AI (LLM + Embeddings)
- Pinecone (Vector DB)
- Render (Hosting)
- MongoDB Atlas
- Redis Cloud
- Cloudinary (File Storage)

</td>
</tr>
</table>

---

## 📁 Project Structure

```
raven-ai/
├── Frontend/                    # React + Vite SPA
│   └── src/
│       ├── features/            # Feature-sliced architecture
│       │   ├── auth/            # Login, signup, OTP, password reset
│       │   ├── saves/           # Core save CRUD + detail view
│       │   ├── collections/     # Collection management
│       │   ├── tags/            # Tag management
│       │   ├── clusters/        # AI clusters view
│       │   ├── graph/           # D3 knowledge graph
│       │   └── user/            # Profile + settings
│       ├── components/
│       │   ├── common/          # SaveCard, FilterTabs, modals
│       │   ├── layout/          # AppLayout, Topbar, Sidebar
│       │   └── ui/              # shadcn primitives + custom
│       ├── app/                 # Redux store + UI slice
│       ├── lib/                 # Axios instance, React Query client, utils
│       └── hooks/               # useDebounce, useIsMobile
│
├── Backend/                     # Node.js + Express REST API
│   └── src/
│       ├── routes/              # Auth, saves, collections, tags, clusters, graph
│       ├── controllers/         # Request handlers
│       ├── models/              # Mongoose schemas (User, SaveItem, Tag, Collection)
│       ├── services/
│       │   ├── scraper.service.js      # Web scraping pipeline
│       │   ├── ai.service.js           # Mistral AI wrapper
│       │   ├── aiProcessor.service.js  # Full AI pipeline
│       │   ├── embedding.service.js    # Vector processing + Pinecone
│       │   ├── clustering.service.js   # K-Means clustering
│       │   └── dbscan.service.js       # DBSCAN clustering
│       ├── workers/             # BullMQ background workers
│       ├── jobs/                # Queue definitions
│       ├── middlewares/         # Auth, rate limiting, validation, error handling
│       └── config/              # DB, Redis, Cloudinary, Pinecone, Mailer
│
└── Extension/                   # Chrome browser extension
    ├── manifest.json            # MV3 manifest
    ├── popup.html / popup.js    # Extension UI
    ├── background.js            # Service worker + context menus
    └── content.js               # Token bridge (web app ↔ extension)

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Redis Cloud account (or local Redis)
- Mistral AI API key — [console.mistral.ai](https://console.mistral.ai)
- Pinecone account — [pinecone.io](https://pinecone.io)
- Cloudinary account — [cloudinary.com](https://cloudinary.com)
- Gmail account with App Password for email

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/NasimReja077/raven-ai.git
cd raven-ai/Backend

# Install dependencies
npm install

# Install Puppeteer's Chrome binary
npx puppeteer browsers install chrome

# Create environment file
cp .env.sample .env
# Fill in all required values in .env

# Start development server
npm run dev
```

**Backend `.env` reference:**

```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/raven_ai

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Redis
REDIS_URL=redis://default:password@host:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
MISTRAL_API_KEY=your_mistral_api_key

# Vector DB
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=raven

# Email (Gmail App Password)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_TEAM_NAME=Raven AI Team

# Frontend URL (for CORS + email links)
FRONTEND_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd raven-ai/Frontend

# Install dependencies
npm install

# Create environment file
cp .env.sample .env
# Set VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
# → Runs at http://localhost:5173
```

### Chrome Extension Setup

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `Extension/` folder
5. Log into the Raven web app; the extension auto-receives your token

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register with email, username, password |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP |
| `POST` | `/api/auth/resend-otp` | Resend verification OTP |
| `POST` | `/api/auth/login` | Login → returns access token |
| `POST` | `/api/auth/refresh-token` | Refresh access token via cookie |
| `POST` | `/api/auth/logout` | Blacklist tokens + clear cookie |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/api/auth/reset-password/:token` | Reset password with token |
| `GET` | `/api/auth/me` | Get authenticated user |

### Saves

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/saves` | List saves (filter, search, semantic, paginate) |
| `POST` | `/api/saves` | Create save from URL |
| `POST` | `/api/saves/uploadFile` | Upload PDF or image file |
| `GET` | `/api/saves/stats` | Get vault statistics |
| `GET` | `/api/saves/resurface` | Get random old saves |
| `GET` | `/api/saves/:id` | Get single save |
| `PATCH` | `/api/saves/:id` | Update title, note, favorite, archive |
| `DELETE` | `/api/saves/:id` | Delete save + Pinecone vectors |
| `GET` | `/api/saves/:id/related` | Get related saves by embedding |
| `POST` | `/api/saves/:id/reprocess` | Re-run AI pipeline |
| `POST` | `/api/saves/:id/highlights` | Add highlight |
| `DELETE` | `/api/saves/:id/highlights/:hId` | Remove highlight |

### Collections, Tags, Clusters, Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/collections` | List / create collections |
| `GET/PATCH/DELETE` | `/api/collections/:id` | Get / update / delete collection |
| `GET/POST/DELETE` | `/api/collections/:id/saves` | Manage saves in collection |
| `GET/POST` | `/api/tags` | List / create tags |
| `POST` | `/api/tags/:id/saves/:saveId` | Add tag to save |
| `DELETE` | `/api/tags/:id/saves/:saveId` | Remove tag from save |
| `POST` | `/api/clusters/run` | Run K-Means clustering |
| `POST` | `/api/clusters/dbscan` | Run DBSCAN clustering |
| `GET` | `/api/clusters/dbscan/suggest` | Suggest DBSCAN parameters |
| `GET` | `/api/clusters` | Get cluster stats |
| `GET` | `/api/graph` | Get full graph data (nodes + links) |

---

## 🚢 Deployment (Render)

### Backend — Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `Backend` |
| Runtime | Node |
| Build Command | `npm install && npx puppeteer browsers install chrome` |
| Start Command | `npm start` |
| Node Version | `20` |

Required environment variables: all listed in `.env.sample` plus:
```
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
PUPPETEER_EXECUTABLE_PATH=/opt/render/.cache/puppeteer/chrome/linux-*/chrome
```

### Frontend — Static Site

| Setting | Value |
|---------|-------|
| Root Directory | `Frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Set `VITE_API_URL` to your deployed backend URL.

---

## 🔧 Key Engineering Decisions

**Why BullMQ instead of in-process async?**
AI processing (scraping → summarization → embedding → clustering) can take 10-30 seconds per save. Doing it synchronously would block the API response. BullMQ decouples saving from processing, with retry logic for transient failures.

**Why mean-pooled embeddings in MongoDB instead of just Pinecone?**
Pinecone is used for RAG semantic search (full-text retrieval). Local MongoDB embeddings enable fast cosine similarity for clustering and the knowledge graph without a Pinecone query per operation.

**Why K-Means AND DBSCAN?**
K-Means requires specifying `k` but produces clean equal-sized clusters. DBSCAN discovers clusters naturally and marks noise/outliers — better when the number of topics is unknown. Raven exposes both.

**Why short-lived access tokens in memory (not localStorage)?**
localStorage is accessible to any JavaScript on the page, making it vulnerable to XSS. In-memory storage (`window.__accessToken`) is cleared on tab close and cannot be accessed by injected scripts.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👤 Author

**Nasim Reja Mondal**

- 💼 GitHub: [@NasimReja077](https://github.com/NasimReja077)
- 🔗 LinkedIn: [linkedin.com/in/nasim-reja-mondal](https://linkedin.com/in/nasim-reja-mondal)
- 📧 Email: rejanasim611@gmail.com

---

<div align="center">

**Built with 🖤 by Nasim Reja Mondal**

*"Like the raven, Raven remembers everything — so you don't have to."*

</div>
