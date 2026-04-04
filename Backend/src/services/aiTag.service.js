// src/services/aiTag.service.js
import { generateStructuredOutput } from "./ai.service.js";
import Tag from "../models/Tag.models.js";

// Palette of distinct colors for AI-generated tags
const AI_TAG_COLORS = [
  "#7555f8", "#f85555", "#55b8f8",
  "#40fa6c", "#fadfa9", "#f59e0b",
  "#6116a6", "#ec4899", "#10b981",
];

const pickColor = (tagName) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++)
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  return AI_TAG_COLORS[Math.abs(hash) % AI_TAG_COLORS.length];
};

// Generate AI tags and persist them to MongoDB
export const generateAITags = async (item) => {
  if (!item?.title && !item?.description && !item?.summary)
    return { tagNames: [], tagIds: [] };

  const prompt = `You are an intelligent tagging system for Raven AI.
Analyze the following content and generate 5-8 relevant, concise tags.
Rules: 1-3 words max, lowercase, focus on topic/technology/concept, no generics like "article" or "link".
  Content:
Title: ${item.title || ""}
Description: ${(item.description || "").slice(0, 400)}
Summary: ${(item.summary || "").slice(0, 400)}
User Note:   ${item.userNote || ""}

Return ONLY valid JSON: { "tags": ["tag1", "tag2", "tag3"] }`;

  try {
    const result = await generateStructuredOutput(prompt);
    const rawTags = Array.isArray(result.tags) ? result.tags : [];
    const tagNames = rawTags
      .map((t) => t.toString().toLowerCase().trim().replace(/\s+/g, "-"))
      .filter((t) => t.length >= 2 && t.length <= 50)
      .slice(0, 8);

    if (tagNames.length === 0) return { tagNames: [], tagIds: [] };

// Atomic upsert + usage count increment
    const tagIds = await Promise.all(
      tagNames.map(async (name) => {
        const tag = await Tag.findOneAndUpdate(
          { user: item.user, name },
          {
            $setOnInsert: { 
              isAiGenerated: true, 
              color: pickColor(name) 
            },
            $inc: { usageCount: 1 },
          },
          { 
            upsert: true, 
            new: true 
          },
        );
        return tag._id;
      }),
    );

    return { tagNames, tagIds };
  } catch (error) {
    console.error("AI Tag Generation Failed:", error.message);
    return { 
      tagNames: [], 
      tagIds: [] 
    };
  }
};
