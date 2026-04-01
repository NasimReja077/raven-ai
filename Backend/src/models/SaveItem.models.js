import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-Schemas

// Highlight schema
const highlightSchema = new Schema({
  text: {
    type: String,
    required: true,
    maxlength: [500, "Highlight cannot exceed 500 characters"],
  },
  note: {
    type: String,
    default: "",
    maxlength: [300, "Note cannot exceed 300 characters"],
  },
  createdAt: { type: Date, default: Date.now },
});

const sourceMetaSchema = new Schema({
  platform: {
    type: String,
    enum: [
      'article', 'medium', 'devto', 'substack', 'wordpress', 'quora', 'newsletter', 'twitter', 'reddit', 'facebook', 'linkedin', 'instagram', 'threads', 'discord', 'telegram', 'whatsapp', 'bluesky', 'youtube', 'github', 'stackoverflow', 'dribbble', 'behance', 'pinterest', 'notion', 'wikipedia', 'docs', 'hackernews', 'news', 'pdf', 'image', 'audio', 'video_file', 'website', 'landing_page', 'chatgpt', 'claude', 'gemini', 'email', 'bookmark', 'other'
    ],
    default: 'website',
    index: true,
  },
  author: String,
  publishedAt: Date,
  readTime: Number,
  wordCount: Number,
  language: { type: String, default: "en" },

  favicon: String,
  siteName: String,
  ogImage: String,

  // Platform-specific fields
  videoId: String,
  duration: String,
  repoStars: Number,
  tweetId: String,
  tweetLikes: Number,

  // Add more platform-specific metadata fields as needed
});

const SAVE_TYPES = ['link', 'article', 'tweet', 'youtube', 'github', 'image', 'pdf', 'note', 'file'];

const saveItemSchema = new Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  saveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SaveItem",
    default: null,
  },

  url: {
    type: String,
    required: [true, "URL is required"],
    trim: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters'],
  },

  type: {
    type: String,
    enum: SAVE_TYPES,
    default: 'link',
    index: true,
  },

  description: {
    type: String,
    trim: true,
    default: "",
  },


  siteName: {
    type: String,
    default: ""
  },
  favicon: {
    type: String,
    default: ""
  },

  // AI-Generated Content
  summary: {
    type: String,
    default: "",
  },
  shortNote: {
    type: String,
    default: "",
  },
  keyPoints: [String],

  userNote: {
    type: String,
    trim: true,
    default: "",
    maxlength: [1000, "User note cannot exceed 1000 characters"],
  },

  // Media
  thumbnail: {
    type: String,
    default: "",
  },
  // cloudinaryId: String,
  // cloudinaryUrl: String,
  publicId: {
    type: String,
    default: "",
  },

  // Organization
  tags: [{
    type: Schema.Types.ObjectId,
    ref: "Tag",
  }],
  collections: [{
    type: Schema.Types.ObjectId,
    ref: "Collection",
  }],

  // Clustering / Grouping
  clusterId: {
    type: String,
    default: null
  },
  clusterLabel: {
    type: String,
    default: null
  },

  // Source Information
  sourceMeta: sourceMetaSchema,

  // AI Metadata
  topics: [{
    type: String,
  }],
  keywords: [{
    type: String,
  }],


  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate",
  },

  // Vector Search (for semantic search)
  embeddingId: { // Pinecone / vector DB ID
    type: String,
  },
  embedding: {
    type: [Number],
    default: undefined,
    select: false,
  },
  hasEmbedding: {
    type: Boolean,
    default: false
  },
  embeddingVersion: {
    type: Number,
    default: 0
  },

  // Processing Status
  processingStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
    index: true,
  },


  processingError: String,
  processedAt: Date,


  // User Interaction Flags
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  lastReadAt: Date,

  // Highlights (user-made)
  highlights: [highlightSchema],

  // Q&A
  // questions: [qaSchema],

  // Resurfacing Logic (Spaced Repetition style)
  resurfaceCount: {
    type: Number,
    default: 0
  },
  lastResurfacedAt: {
    type: Date,
    default: null
  },
  resurfaceScore: {
    type: Number,
    default: 0
  },

  // file upload
  fileUrl: { type: String, default: null },         // Cloudinary URL
  fileType: { type: String, default: null },        // mime type
  fileSize: { type: Number, default: null },

  // Origin of save
  source: {
    type: String,
    enum: ["web", "extension", "mobile", "upload", "api"],
    default: "web",
  },
}, { timestamps: true });


// Indexes (Very Important for Performance)
// ========================
saveItemSchema.index({ user: 1, createdAt: -1 });
saveItemSchema.index({ user: 1, isFavorite: 1 });
saveItemSchema.index({ user: 1, isArchived: 1 });
saveItemSchema.index({ user: 1, type: 1 }); // for filtering by type (article, tweet, etc.)
saveItemSchema.index({ user: 1, clusterId: 1 });
saveItemSchema.index({ url: 1, user: 1 }, { unique: true }); // Prevent duplicate URLs per user
saveItemSchema.index({ processingStatus: 1, createdAt: 1 });

// Text Search Index (for title + description + summary)
saveItemSchema.index(
  { title: "text", description: "text", summary: "text", userNote: "text" },
  { weights: { title: 10, summary: 5, description: 3, userNote: 2 } }
);

export const SaveItem = mongoose.model("SaveItem", saveItemSchema);
