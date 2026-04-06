# Raven - AI 🖤🐦

> **"Raven remembers everything."**

Raven - AI is an intelligent personal knowledge vault. Unlike traditional bookmarking apps that act as "link graveyards," Raven hoards, organizes, and automatically connects your saved articles, tweets, images, and PDFs into a living **Knowledge Graph**.

Inspired by the raven — the most intelligent bird, known for:

Hoarding shiny, interesting things
Remarkable memory — remembers faces, places, events
Problem solving — sees patterns others miss
Dark & mysterious aesthetic

---
# Raven AI — Your Personal Knowledge Vault

Raven AI is a full-stack AI-powered knowledge vault that lets you save anything from the web — articles, YouTube videos, PDFs, tweets, GitHub repos, and images — and automatically organizes, connects, and resurfaces it using AI.

**Live Demo:** [https://raven-ai-3xlj.onrender.com](https://raven-ai-3xlj.onrender.com)  
**Backend API:** [https://raven-ai-backend.onrender.com](https://raven-ai-backend.onrender.com)

---

## Features

**Smart Web Scraper** — Save any URL with automatic content type detection. Supports articles, YouTube videos, PDFs, images, tweets, and GitHub repositories. Uses Axios for fast scraping with Puppeteer as a fallback for JavaScript-heavy sites.

**AI Semantic Search** — Find saved items by meaning, not just keywords. Powered by Mistral AI embeddings stored in a Pinecone vector database.

**Auto Collections and Tags** — AI automatically clusters related saves and suggests tags using DBSCAN density-based clustering algorithms.

**Knowledge Graph** — Visualizes connections between your saved items as an interactive D3.js graph.

**PDF and Image OCR** — Extracts and indexes text from uploaded PDFs using pdf-parse and from images using Tesseract.js.

**YouTube Transcript Extraction** — Saves and indexes full video transcripts for semantic search.

**Background Job Queue** — BullMQ and Redis handle async processing of saves without blocking the user experience.

**Chrome Extension** — Save any page to your vault with one click directly from your browser.

**Secure Authentication** — JWT access tokens with refresh token rotation, HTTP-only cookies, OTP email verification, and password reset flow.

**Cloud File Storage** — Cloudinary handles image and file uploads.

---

## Tech Stack

### Frontend
- React 19 with Vite
- Redux Toolkit and React Query for state management
- React Router v7
- Tailwind CSS v4 with shadcn/ui components
- Framer Motion for animations
- D3.js for knowledge graph visualization
- Axios for API communication

### Backend
- Node.js with Express v5
- MongoDB with Mongoose
- Redis with BullMQ for job queues
- Puppeteer for dynamic web scraping
- Tesseract.js for OCR
- Nodemailer for email

### AI and ML
- Mistral AI for embeddings and AI processing
- Pinecone for vector database and semantic search
- DBSCAN clustering for auto-organization

### Infrastructure
- Render (frontend static site + backend web service)
- MongoDB Atlas
- Redis Cloud
- Cloudinary

---

## Project Structure

```
raven-ai/
├── Frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── features/       # Feature modules
│   │   │   ├── auth/       # Login, signup, OTP, password reset
│   │   │   ├── saves/      # Save items, favorites, archive
│   │   │   ├── collections/# Collections management
│   │   │   ├── tags/       # Tag management
│   │   │   ├── clusters/   # AI clusters view
│   │   │   ├── graph/      # Knowledge graph
│   │   │   └── user/       # User profile
│   │   ├── components/ui/  # Reusable UI components
│   │   ├── lib/            # Axios instance, utilities
│   │   └── router/         # App routing
│   └── public/
│       └── _redirects      # SPA routing for Render
│
├── Backend/                # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── models/         # Mongoose models
│   │   ├── services/       # Business logic
│   │   │   ├── scraper.service.js
│   │   │   ├── ai.service.js
│   │   │   ├── embedding.service.js
│   │   │   ├── clustering.service.js
│   │   │   └── upload.service.js
│   │   ├── middlewares/    # Auth, rate limiting, error handling
│   │   ├── workers/        # BullMQ background workers
│   │   └── config/         # Database, Cloudinary config
│   └── server.js
│
└── Extension/              # Chrome browser extension
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── background.js
    └── content.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/saves` | Get all saved items |
| POST | `/api/saves` | Create new save |
| DELETE | `/api/saves/:id` | Delete a save |
| GET | `/api/collections` | Get all collections |
| POST | `/api/collections` | Create collection |
| GET | `/api/tags` | Get all tags |
| GET | `/api/clusters` | Get AI clusters |
| GET | `/api/graph` | Get knowledge graph data |
| GET | `/api/users/me` | Get current user profile |

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Redis Cloud account
- Mistral AI API key
- Pinecone account
- Cloudinary account

### Backend Setup

```bash
cd Backend
npm install
npx puppeteer browsers install chrome
```

Create `Backend/.env`:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
EMAIL_FROM_TEAM_NAME=RavenAi Team

REDIS_URL=your_redis_url

MISTRAL_API_KEY=your_mistral_key

PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=raven-embeddings

FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment

### Render Setup

**Backend (Web Service)**
- Root Directory: `Backend`
- Build Command: `npm install && npx puppeteer browsers install chrome`
- Start Command: `npm start`
- Node Version: 20

**Frontend (Static Site)**
- Root Directory: `Frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

**Environment Variables**

Backend:
```
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com
MONGODB_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
REDIS_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MISTRAL_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=raven-embeddings
EMAIL_USER=...
EMAIL_PASS=...
```

Frontend:
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `Extension/` folder
5. Click the Raven AI icon in your toolbar to save any page

---

## Author

**Nasim Reja Mondal**  
GitHub: [NasimReja077](https://github.com/NasimReja077)  
LinkedIn: [linkedin.com/in/nasimrejamondal](https://www.linkedin.com/in/nasimrejamondal)

---

## License

ISC
