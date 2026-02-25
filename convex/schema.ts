import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { wordTypeValidator } from "./wordTypes";

export default defineSchema({
  ...authTables,
  words: defineTable({
    userId: v.id("users"),
    language: v.string(),
    text: v.string(),
    type: wordTypeValidator,
    meaning: v.string(),
    tags: v.optional(v.string()),
  }).index("by_userId_language", ["userId", "language"]),

  questionTypes: defineTable({
    userId: v.id("users"),
    language: v.string(),
    name: v.string(),
    dataTemplate: v.string(),
    questionTemplate: v.string(),
    answerTemplate: v.string(),
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
