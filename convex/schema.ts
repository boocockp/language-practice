import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const partOfSpeech = v.union(
  v.literal("noun"),
  v.literal("verb"),
  v.literal("adjective"),
);
const gender = v.union(
  v.literal("M"),
  v.literal("F"),
  v.literal("N"),
);

export default defineSchema({
  ...authTables,
  words: defineTable({
    userId: v.id("users"),
    language: v.string(),
    text: v.string(),
    pos: partOfSpeech,
    gender: v.optional(gender),
    meaning: v.string(),
    tags: v.optional(v.string()),
  }).index("by_userId_language", ["userId", "language"]),

  questionTypes: defineTable({
    userId: v.id("users"),
    language: v.string(),
    name: v.string(),
    promptTemplate: v.string(),
    enabled: v.boolean(),
  }).index("by_userId_language", ["userId", "language"]),

  attempts: defineTable({
    userId: v.id("users"),
    wordId: v.id("words"),
    questionTypeId: v.id("questionTypes"),
    questionText: v.string(),
    answerGiven: v.string(),
    isCorrect: v.boolean(),
    score: v.optional(v.number()),
    respondedAt: v.number(),
    durationMs: v.optional(v.number()),
  })
    .index("by_wordId", ["wordId", "respondedAt"])
    .index("by_questionTypeId", ["questionTypeId", "respondedAt"])
    .index("by_userId", ["userId", "respondedAt"]),
});
