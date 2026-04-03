// src/services/scraper.service.js
import axios from "axios";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { YoutubeTranscript } from "youtube-transcript-plus";
import { PDFParse } from 'pdf-parse';
import Tesseract from "tesseract.js";
import fetch from "node-fetch";

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
  if (u.includes("news.ycombinator.com") || u.includes("hackernews")) return "hackernews";
  return "website";
};

// MAIN SCRAPER

export const scrapeContent = async (url) => {
  const type = detectContentType(url);
  const platform = detectPlatform(url);

  try {
    if (type === "youtube") return await scrapeYoutube(url);
    if (type === "pdf") return await scrapePDF(url);
    if (type === "image") return await scrapeImage(url);

    let html;

    try {
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RavenBot/1.0; +https://raven.ai)",
        },
      });
      html = res.data;
    } catch {
      html = await scrapeWithPuppeteer(url);
    }

    return await extractReadable(html, url, platform);
  } catch (error) {
    console.error(`Scrape failed for ${url}:`, error.message);
    return {
      title: "Untitled",
      description: "",
      content: `Could not scrape content. Original URL: ${url}`,
      thumbnail: "",
      siteName: "",
      favicon: "",
      author: "",
      wordCount: 0,
      headings: [],
      platform,
      type,
    };
  }
};


// CONTENT CLEANING + READABILITY + HEADINGS

const extractReadable = async (html, url, platform) => {
  const $ = cheerio.load(html);
  
  // Content Cleaning - Remove noise

  $("script, style, nav, footer, header, aside, iframe, noscript, .ad, .ads, .cookie-banner, .popup").remove();

  // Extract Headings (H1-H6) with hierarchy for AI

  const headings = [];
  $("h1, h2, h3, h4, h5, h6").each((i, el) => {
    const level = parseInt(el.tagName[1]);
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 3) {
      headings.push({ level, text });
    }
  });


  // Meta extraction
  const getMeta = (prop, name) =>
    $(`meta[property="${prop}"]`).attr("content") ||
    $(`meta[name="${name}"]`).attr("content") || "";

  const title = getMeta("og:title", "title") || $("title").text().trim() || "";
  const description = getMeta("og:description", "description") || "";
  const thumbnail = getMeta("og:image") || "";
  const siteName = getMeta("og:site_name") || "";
  const author = getMeta("article:author") || getMeta("author") || "";
  const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

  // Readability for clean article text
  const dom = new JSDOM($.html(), { url });
  const reader = new Readability(dom.window.document, {
    debug: false,
  });
  const article = reader.parse();

  let content = article?.textContent?.trim() || $("body").text().replace(/\s+/g, " ").trim();

  // Final cleaning
  content = content.replace(/\s+/g, " ").trim().slice(0, 60000); // cap size

  return {
    title: title.slice(0, 500),
    description: description.slice(0, 1000),
    thumbnail,
    siteName,
    favicon,
    content,
    author,
    wordCount: content.split(/\s+/).length,
    headings, // Headings for AI
    platform,
    type: detectContentType(url),
  };
};

// PUPPETEER - Used as a fallback for dynamic sites or when axios fails, with optimizations for speed and resource blocking.

export const scrapeWithPuppeteer = async (url) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
    timeout: 30000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; RavenBot/1.0; +https://raven.ai)");
    await page.setRequestInterception(true);

    // Block unnecessary resources for speed
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { 
      waitUntil: "domcontentloaded", 
      timeout: 25000 
    });

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
};

// YOUTUBE EXTRACTION 

export const scrapeYoutube = async (url) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  let transcript = "Transcript unavailable.";
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = transcriptData.map((s) => s.text).join(" ");
  } catch (e) {
    console.warn("YouTube transcript failed:", e.message);
  }

  // Fetch basic metadata
  let title = "", description = "", thumbnail = "";
  try {
    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);
    title = $('meta[property="og:title"]').attr("content") || "";
    description = $('meta[property="og:description"]').attr("content") || "";
    thumbnail = $('meta[property="og:image"]').attr("content") || "";
  } catch {}

  return {
    title: title || `YouTube Video`,
    description,
    thumbnail,
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

// PDF EXTRACTION
export const scrapePDF = async (urlOrBuffer) => {
  let buffer;
  if (typeof urlOrBuffer === "string") {
    const res = await axios.get(urlOrBuffer, { responseType: "arraybuffer" });
    buffer = Buffer.from(res.data);
  } else {
    buffer = urlOrBuffer;
  }

  const data = await pdfParse(buffer);
  return {
    title: "PDF Document",
    description: "",
    content: data.text.trim().slice(0, 60000),
    wordCount: data.text.split(/\s+/).length,
    pages: data.numpages,
    headings: [],
    platform: "pdf",
    type: "pdf",
  };
};

// Image OCR EXTRACTION 

export const scrapeImage = async (urlOrBuffer) => {
  let buffer;
  if (typeof urlOrBuffer === "string") {
    const res = await axios.get(urlOrBuffer, { responseType: "arraybuffer" });
    buffer = Buffer.from(res.data);
  } else {
    buffer = urlOrBuffer;
  }

  const { data } = await Tesseract.recognize(buffer, "eng", {
    logger: (m) => console.log(m), // optional progress
  });

  return {
    title: "Image with OCR",
    description: "",
    content: data.text.trim().slice(0, 15000),
    wordCount: data.text.split(/\s+/).length,
    headings: [],
    platform: "image",
    type: "image",
  };
};

const extractYouTubeId = (url) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export default {
  scrapeContent,
  detectContentType,
  detectPlatform,
  scrapeWithPuppeteer,
  scrapeYoutube,
  scrapePDF,
  scrapeImage,
};