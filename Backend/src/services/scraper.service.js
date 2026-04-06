// src/services/scraper.service.js
import axios from "axios";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { YoutubeTranscript } from "youtube-transcript-plus";
// import PDFParse from "pdf-parse"; 
import Tesseract from "tesseract.js";
// Detect content type from URL and return one of: 'link', 'article', 'tweet', 'youtube', 'github', 'image', 'pdf'

// Detect content type

export const detectContentType = (url = "") => {
  if (!url) return "link";
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitter.com") || u.includes("x.com")) return "tweet";
  if (u.includes("github.com")) return "github";
  if (u.match(/\.(pdf)(\?|$)/i)) return "pdf";
  if (u.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return "image";
  if (
    u.includes("medium.com") ||
    u.includes("dev.to") ||
    u.includes("substack.com") ||
    u.includes("hashnode.com") ||
    u.includes("blog")
  )
    return "article";
  return "link";
};

// Detect platform for sourceMeta
export const detectPlatform = (url = "") => {
  const u = url.toLowerCase();
  if (u.includes("medium.com")) return "medium";
  if (u.includes("dev.to")) return "devto";
  if (u.includes("substack.com")) return "substack";
  if (u.includes("twitter") || u.includes("x.com")) return "twitter";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("github.com")) return "github";
  if (u.includes("youtube")) return "youtube";
  if (u.includes("stackoverflow.com")) return "stackoverflow";
  if (u.includes("dribbble.com")) return "dribbble";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("notion.so")) return "notion";
  if (u.includes("wikipedia.org")) return "wikipedia";
  if (u.includes("news.ycombinator.com") || u.includes("hackernews"))
    return "hackernews";
  return "website";
};


// ─── Safe hostname extraction 
const safeHostname = (url) => {
  try { 
    return new URL(url).hostname; 
  } catch { 
    return ""; 
  }
};
 
// ─── Graceful fallback 
const buildFallback = (url, platform, type) => ({
  title: url,
  description: "",
  content: `Saved from: ${url}`,
  thumbnail: "",
  siteName: "",
  favicon: `https://www.google.com/s2/favicons?domain=${safeHostname(url)}&sz=64`,
  author: "",
  wordCount: 0,
  headings: [],
  platform,
  type,
});
 

// Main scraper
export const scrapeContent = async (url) => {
  const type = detectContentType(url);
  const platform = detectPlatform(url);

  try {
    if (type === "youtube") return await scrapeYoutube(url);
    if (type === "pdf") return await scrapePDF(url);
    if (type === "image") return await scrapeImage(url);

    // Try fast axios first
    let html = null;
    try {
      const res = await axios.get(url, {
        timeout: 12000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        maxRedirects: 5,
      });
      html = res.data;
    } catch (axiosErr) {
      console.warn(
        `Axios failed for ${url}: ${axiosErr.message} — trying Puppeteer`,
      );
    
      try {
        html = await scrapeWithPuppeteer(url);
      } catch (puppeteerErr) {
        console.error(
          `Puppeteer also failed for ${url}: ${puppeteerErr.message}`,
        );
        return buildFallback(url, platform, type);
      }
    }

    if (!html) return buildFallback(url, platform, type);
    return await extractReadable(html, url, platform);
  } catch (error) {
    console.error(`Scrape failed for ${url}:`, error.message);
    return buildFallback(url, platform, type);
  }
};

// CONTENT CLEANING + READABILITY + HEADINGS extraction 
const extractReadable = async (html, url, platform) => {
  const $ = cheerio.load(html);
  // Content Cleaning - Remove noise
  $("script,style,nav,footer,header,aside,iframe,noscript,.ad,.ads,.cookie-banner,.popup",
  ).remove();
  // Extract Headings (H1-H6) with hierarchy for AI
  const headings = [];
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 3)
      headings.push({ level: parseInt(el.tagName[1]), text });
  });

  // Meta extraction

  const getMeta = (prop, name) =>
    $(`meta[property="${prop}"]`).attr("content") ||
    $(`meta[name="${name}"]`).attr("content") ||
    "";

  const title = getMeta("og:title", "title") || $("title").text().trim() || "";
  const description = getMeta("og:description", "description") || "";
  const thumbnail = getMeta("og:image", "og:image") || "";
  const siteName = getMeta("og:site_name", "og:site_name") || "";
  const author = getMeta("article:author", "author") || "";
  const favicon = `https://www.google.com/s2/favicons?domain=${safeHostname(url)}&sz=64`;

  let content = "";
  try {
    // Readability for clean article text

    const dom = new JSDOM($.html(), { url });
    const article = new Readability(dom.window.document).parse();
    content = article?.textContent?.trim() || "";
  } catch {}
  if (!content) content = $("body").text().replace(/\s+/g, " ").trim();
  
  // Final cleaning
  content = content.replace(/\s+/g, " ").trim().slice(0, 60000);

  return {
    title: title.slice(0, 500),
    description: description.slice(0, 1000),
    thumbnail,
    siteName,
    favicon,
    content,
    author,
    headings,
    platform,
    wordCount: content.split(/\s+/).length,
    type: detectContentType(url),
  };
};

// Puppeteer (fallback for JS-heavy sites) - Used as a fallback for dynamic sites or when axios fails, with optimizations for speed and resource blocking.

export const scrapeWithPuppeteer = async (url) => {
  const puppeteer = (await import("puppeteer")).default;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",         // ← required on Render free tier
      "--disable-extensions",
    ],
    timeout: 20000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      ["image", "stylesheet", "font", "media"].includes(req.resourceType())
        ? req.abort()
        : req.continue();
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 18000 });
    return await page.content();
  } finally {
    await browser.close().catch(() => {});
  }
};

// YouTube
export const scrapeYoutube = async (url) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  let transcript = "Transcript unavailable.";
  try {
    const data = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = data.map((s) => s.text).join(" ");
  } catch (e) {
    console.warn("YouTube transcript failed:", e.message);
  }

  // Fetch basic metadata
  
  let title = "",
    description = "",
    thumbnail = "";
  try {
    const res = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RavenBot/1.0)" },
    });
    const $ = cheerio.load(res.data);
    title = $('meta[property="og:title"]').attr("content") || "";
    description = $('meta[property="og:description"]').attr("content") || "";
    thumbnail = $('meta[property="og:image"]').attr("content") || "";
  } catch {}

  return {
    title: title || "YouTube Video",
    description,
    thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    content: transcript,
    siteName: "YouTube",
    favicon: "https://www.youtube.com/favicon.ico",
    author: "",
    wordCount: transcript.split(/\s+/).length,
    headings: [],
    platform: "youtube",
    type: "youtube",
    videoId,
  };
};

// PDF
export const scrapePDF = async (urlOrBuffer) => {
  let buffer;

  try {
    if (typeof urlOrBuffer === "string") {
      const res = await axios.get(urlOrBuffer, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RavenBot/1.0)" },
      });
      buffer = Buffer.from(res.data);
    } else {
      buffer = urlOrBuffer;
    }

    // ✅ Correct way for pdf-parse in ESM (use .default)
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    return {
      title: "PDF Document",
      description: "",
      content: data.text.trim().slice(0, 60000),
      wordCount: data.text.split(/\s+/).length,
      pages: data.numpages || 1,
      headings: [],
      platform: "pdf",
      type: "pdf",
    };
  } catch (error) {
    console.error("PDF parsing failed:", error.message);
    return {
      title: "PDF Document",
      description: "",
      content: "Could not extract text from PDF.",
      wordCount: 0,
      pages: 1,
      headings: [],
      platform: "pdf",
      type: "pdf",
    };
  }
};

// Image OCR
export const scrapeImage = async (urlOrBuffer) => {
  let buffer;
  if (typeof urlOrBuffer === "string") {
    const res = await axios.get(urlOrBuffer, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    buffer = Buffer.from(res.data);
  } else {
    buffer = urlOrBuffer;
  }
  const { data } = await Tesseract.recognize(buffer, "eng");
  return {
    title: "Image",
    description: "",
    content: data.text.trim().slice(0, 15000),
    wordCount: data.text.split(/\s+/).length,
    headings: [],
    platform: "image",
    type: "image",
  };
};

// YouTube ID extraction 
const extractYouTubeId = (url) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export default { 
  scrapeContent, 
  detectContentType, 
  detectPlatform, 
  scrapeWithPuppeteer, 
  scrapeYoutube, 
  scrapePDF, 
  scrapeImage 
};