// src/services/ai.service.js
import { Mistral } from "@mistralai/mistralai";
import ApiError from "../utils/ApiError.js";

// Singleton Mistral client

let mistralClient = null;

export const getMistralClient = () => {
     if (!mistralClient) {
          if (!process.env.MISTRAL_API_KEY) {
               throw new Error("MISTRAL_API_KEY is not set in .env");
          }
          mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
          console.log("✅ Mistral AI client initialized");
     }
     return mistralClient;
};

// ─── Model constants ──────────────────────────────────────────────────────────
const MODEL_SMALL = "mistral-small-latest"; // fast + cheap — tags, keyPoints, topics
const MODEL_LARGE = "mistral-large-latest"; // smart  — summaries, RAG answers
const EMBED_MODEL = "mistral-embed";


// CORE: Chat completion  (plain text response)

/**
 * generateChatCompletion(prompt, options)
 *
 * Returns a plain text string.
 * Use for: summary, shortNote, any free-form text generation.
 *
 * Options:
 *   model       — defaults to MODEL_LARGE
 *   temperature — defaults to 0.3
 *   maxTokens   — defaults to 1200
 *   system      — optional system message string
 */

export const generateChatCompletion = async (prompt, options = {}) => {
     const client = getMistralClient();
     const {
          model = MODEL_LARGE,
          temperature = 0.3,
          maxTokens = 1200,
          system = null,
     } = options;

     const messages = [];
     if (system) messages.push({ role: "system", content: system });
     messages.push({ role: "user", content: prompt });

     try {
          const response = await client.chat.complete({
               model,
               messages,
               temperature,
               maxTokens,
          });
          return response.choices?.[0]?.message?.content?.trim() || "";
     } catch (error) {
          console.error("Mistral Chat Error:", error.message);
          throw new ApiError(500, `AI generation failed: ${error.message}`);
     }
};


// CORE: Structured JSON output

/**
 * generateStructuredOutput(prompt, options)
 *
 * Returns a parsed JS object/array — never a raw string.
 * Use for: tags, keyPoints, topics, flashcards, questions.
 * The prompt should instruct the model to respond with a JSON object/array.
 * The function will attempt to parse the response as JSON, and will throw an error if parsing fails.
 * Options: same as generateChatCompletion, but defaults to MODEL_SMALL and lower temperature for more deterministic output.
 * 
 */
export const generateStructuredOutput = async (prompt, options = {}) => {
     const client = getMistralClient();
     const {
          model = MODEL_SMALL,
          temperature = 0.2,
          maxTokens = 1000,
     } = options;

     let raw = "{}";

     try {
          const response = await client.chat.complete({
               model,
               messages: [{ role: "user", content: prompt }],
               responseFormat: { type: "json_object" },
               temperature,
               maxTokens,
          });

          raw = response.choices?.[0]?.message?.content || "{}";
          const clean = raw.replace(/```json|```/g, "").trim(); // strip fences
          return JSON.parse(clean);
     } catch (error) {
          console.error("Structured Output Error:", error.message, "\nRaw:", raw);
          throw new ApiError(500, `Failed to generate structured AI output: ${error.message}`);
     }
};


// CORE: Embeddings

/**
 * generateEmbedding(text)
 * Single embedding — for RAG query + duplicate check.
 * Returns null (not throws) on empty/short text so callers can decide.
 * Trims and limits input to 8000 chars to avoid API errors.
 * Uses a dedicated embedding model for better performance and relevance.
 * Throws ApiError on API failure for consistent error handling in routes.
 */
export const generateEmbedding = async (text) => {
     const client = getMistralClient();
     if (!text || text.trim().length < 20) return null;

     try {
          const response = await client.embeddings.create({
               model: EMBED_MODEL,
               inputs: [text.trim().slice(0, 8000)],
          });
          return response.data?.[0]?.embedding || null;
     } catch (error) {
          console.error("Embedding Error:", error.message);
          throw new ApiError(500, "Failed to generate embedding");
     }
};


/**
 * generateEmbeddingsBatch(texts[])
 * Batch embedding — for chunked item processing in the worker.
 * Sends in groups of 50 (Mistral limit). Returns vectors in SAME ORDER as input.
 * Filters out invalid texts (null/short)
 */
export const generateEmbeddingsBatch = async (texts) => {
     const client = getMistralClient();

     const validTexts = texts
          .map((t) => t?.trim())
          .filter((t) => t && t.length >= 20)
          .map((t) => t.slice(0, 8000));

     if (validTexts.length === 0) return [];

     const BATCH_SIZE = 50;
     const result = [];

     for (let i = 0; i < validTexts.length; i += BATCH_SIZE) {
          const batch = validTexts.slice(i, i + BATCH_SIZE);
          const response = await client.embeddings.create({
               model: EMBED_MODEL,
               inputs: batch,
          });
          result.push(...response.data.map((item) => item.embedding));
     }

     return result;
};


// HIGH-LEVEL: Summary + shortNote + keyPoints

/**
 * generateSummary({ title, description, content, type })
 * Returns { summary, shortNote, keyPoints[] }
 */
export const generateSummary = async ({ title, description, content, type }) => {
     const textBlock = [title, description, content]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 6000);

     const prompt = `
You are a knowledge management assistant for Raven AI.
Analyze this ${type || "content"} and return JSON.
 
Content:
${textBlock}
 
Return ONLY valid JSON:
{
  "summary":   "2-4 sentence summary of the core idea",
  "shortNote": "one punchy tweet-length sentence (max 120 chars)",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"]
}
 
Rules:
- summary:   clear and informative, 3-4 sentences
- shortNote: what makes this worth saving, max 120 characters
- keyPoints: exactly 5 distinct points, each under 100 chars
`;

     const result = await generateStructuredOutput(
          prompt, {
          model: MODEL_LARGE,
          maxTokens: 800
     });

     return {
          summary: typeof result.summary === "string" ? result.summary.trim() : "",
          shortNote: typeof result.shortNote === "string" ? result.shortNote.trim() : "",
          keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints.slice(0, 7) : [],
     };
};

// HIGH-LEVEL: Topics + keywords + difficulty
/**
 * generateTopicsAndKeywords({ title, summary, type })
 * Returns { topics[], keywords[], difficulty }
 */
export const generateTopicsAndKeywords = async ({ title, summary, type }) => {
     const prompt = `
Analyze this saved ${type || "content"} for a personal knowledge vault.
 
Title:   ${title || ""}
Summary: ${(summary || "").slice(0, 500)}
 
Return ONLY valid JSON:
{
  "topics":     ["topic1", "topic2"],
  "keywords":   ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "difficulty": "intermediate"
}
 
Rules:
- topics:     2-4 broad subject areas (e.g. "machine learning", "productivity")
- keywords:   5-8 specific technical/domain terms
- difficulty: one of exactly: "beginner", "intermediate", "advanced"
`;

     const result = await generateStructuredOutput(prompt, { model: MODEL_SMALL, maxTokens: 400 });

     return {
          topics: Array.isArray(result.topics) ? result.topics.slice(0, 4) : [],
          keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 8) : [],
          difficulty: ["beginner", "intermediate", "advanced"].includes(result.difficulty)
               ? result.difficulty
               : "intermediate",
     };
};


// HIGH-LEVEL: Follow-up questions
/**
 * generateQuestions({ title, summary })
 * Returns string[] — 3 questions to deepen understanding of the saved item
 */
export const generateQuestions = async ({ title, summary }) => {
     const prompt = `
Generate 3 insightful follow-up questions a curious reader would ask after saving this content.
Questions should deepen understanding — not just restate what's already said.
 
Title:   ${title || ""}
Summary: ${(summary || "").slice(0, 400)}
 
Return ONLY valid JSON:
{ "questions": ["question 1?", "question 2?", "question 3?"] }
`;

     const result = await generateStructuredOutput(prompt, {
          model: MODEL_SMALL,
          maxTokens: 300
     });
     return Array.isArray(result.questions) ? result.questions.slice(0, 5) : [];
};



// HIGH-LEVEL: Flashcard generation

/**
 * generateFlashcards({ title, summary, keyPoints, highlights })
 * Returns [{ front, back }]
 */
export const generateFlashcards = async ({
     title,
     summary,
     keyPoints = [],
     highlights = [],
}) => {
     const highlightText = highlights.map((h) => h.text).join("\n");
     const keyPointText = keyPoints.join("\n");

     const prompt = `
Create 4-6 flashcards from this content for spaced-repetition learning.
Each card should test a distinct concept or fact.
 
Title:      ${title || ""}
Summary:    ${(summary || "").slice(0, 800)}
Key Points: ${keyPointText.slice(0, 600)}
Highlights: ${highlightText.slice(0, 400)}
 
Return ONLY valid JSON:
{
  "flashcards": [
    { "front": "question or concept to recall", "back": "concise answer or explanation" }
  ]
}
 
Rules:
- front: clear specific question or prompt (max 200 chars)
- back:  accurate, concise answer (max 400 chars)
- 4-6 cards, each covering a different aspect
`;

     const result = await generateStructuredOutput(prompt, { model: MODEL_SMALL, maxTokens: 900 });
     const cards = Array.isArray(result.flashcards) ? result.flashcards : [];

     return cards
          .filter((c) => c.front && c.back)
          .slice(0, 6)
          .map((c) => ({
               front: c.front.toString().slice(0, 200),
               back: c.back.toString().slice(0, 400),
          }));
};

// HIGH-LEVEL: RAG answer generation

/**
 * generateRAGAnswer({ question, context[], userName })
 * context = [{ text, score, title }] from Pinecone retrieval
 * Returns { answer, tokensUsed }
 */

export const generateRAGAnswer = async ({ question, context, userName = "there" }) => {
     const contextBlock = context
          .map((c, i) => `[Source ${i + 1} — "${c.title}"]: ${c.text}`)
          .join("\n\n");

     const system = `You are Raven, an intelligent personal knowledge assistant.
Answer questions STRICTLY based on the user's saved knowledge vault.
Always cite sources using [Source N] notation.
If the answer is not in the provided sources, say so honestly — never fabricate.
Be concise, accurate, and helpful.`;

     const userPrompt = `Context from ${userName}'s knowledge vault:\n\n${contextBlock}\n\n---\nQuestion: ${question}\n\nAnswer based only on the sources above:`;

     const client = getMistralClient();

     try {
          const response = await client.chat.complete({
               model: MODEL_LARGE,
               messages: [
                    { role: "system", content: system },
                    { role: "user", content: userPrompt },
               ],
               temperature: 0.2,
               maxTokens: 900,
          });

          return {
               answer: response.choices?.[0]?.message?.content?.trim() || "I couldn't generate an answer.",
               tokensUsed: response.usage?.totalTokens || 0,
          };
     } catch (error) {
          console.error("RAG Answer Error:", error.message);
          throw new ApiError(500, `RAG answer generation failed: ${error.message}`);
     }
};


// HIGH-LEVEL: Contradiction detection

/**
 * checkContradiction(textA, textB)
 * Returns { isContradiction: bool, reason: string }
 * Never throws — returns false on any failure.
 */
export const checkContradiction = async (textA, textB) => {
     const prompt = `
Compare these two pieces of saved content and determine if they make contradictory claims.
 
Text A: ${textA.slice(0, 800)}
 
Text B: ${textB.slice(0, 800)}
 
Return ONLY valid JSON:
{
  "isContradiction": false,
  "reason": "brief explanation — or empty string if no contradiction"
}
`;

     try {
          const result = await generateStructuredOutput(prompt, {
               model: MODEL_SMALL,
               maxTokens: 200
          });
          return {
               isContradiction: Boolean(result.isContradiction),
               reason: result.reason || "",
          };
     } catch {
          return { isContradiction: false, reason: "" };
     }
};

// Cluster label
export const generateClusterLabel = async (titles = []) => {
  try {
    const result = await generateStructuredOutput(
      `These saved items belong to the same cluster. Give a short 2-4 word label for their common theme.\n\nItems:\n${titles.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nReturn ONLY: { "label": "short label", "description": "one sentence" }`,
      { model: MODEL_SMALL, maxTokens: 150 }
    );
    return { label: result.label || "Knowledge Cluster", description: result.description || "" };
  } catch {
    return { label: "Knowledge Cluster", description: "" };
  }
};