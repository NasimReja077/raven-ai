# Raven - AI 🖤🐦

> **"Raven remembers everything."**

Raven - AI is an intelligent personal knowledge vault. Unlike traditional bookmarking apps that act as "link graveyards," Raven hoards, organizes, and automatically connects your saved articles, tweets, images, and PDFs into a living **Knowledge Graph**.

Inspired by the raven — the most intelligent bird, known for:

Hoarding shiny, interesting things
Remarkable memory — remembers faces, places, events
Problem solving — sees patterns others miss
Dark & mysterious aesthetic

---

## 🚀 The Vision
Raven uses **Semantic Search** and **Topic Clustering** to ensure that what you save today isn't forgotten tomorrow. It builds a "Second Brain" that resurfaces relevant information exactly when you need it.

## ✨ Key Features
* **Smart Hoarding:** Save content via a dedicated browser extension.
* **Knowledge Graph:** Visualize connections between your saved items using `D3.js`.
* **AI Tagging & Clustering:** Automatic categorization using NLP and Vector Embeddings.
* **Memory Resurfacing:** Smart notifications ("2 months ago you saved this...") to keep your knowledge fresh.
* **Semantic Search:** Search by the *meaning* of your content, not just keywords.

## 🛠 Tech Stack
### Frontend
* **Framework:** React / Next.js
* **Styling:** Tailwind CSS
* **State Management:** Redux Toolkit
* **Visualization:** D3.js (Graph Visualization)

### Backend
* **Runtime:** Node.js (Express)
* **AI/ML:** Python Microservices (for Embeddings & Clustering)
* **Database:** MongoDB (Metadata) & Pinecone/Milvus (Vector DB)
* **Storage:** AWS S3 / Cloudinary (Object Storage)

## 🏗 Project Structure
- `/client` - Next.js dashboard & visualization
- `/extension` - Browser extension for saving content
- `/server` - Node.js API & authentication
- `/ai-service` - Python service for semantic processing