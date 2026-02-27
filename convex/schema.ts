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

  questions: defineTable({
    userId: v.id("users"),
    language: v.string(),
    questionTypeId: v.id("questionTypes"),
    text: v.string(),
    expected: v.string(),
    answerGiven: v.optional(v.string()),
    isCorrect: v.optional(v.boolean()),
    respondedAt: v.optional(v.number()),
    wordId: v.optional(v.id("words")),
    score: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  })
    .index("by_questionTypeId", ["questionTypeId"])
    .index("by_userId", ["userId"])
    .index("by_userId_respondedAt", ["userId", "respondedAt"]),
});
