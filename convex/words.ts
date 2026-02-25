import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { wordTypeValidator } from "./wordTypes";

export { WORD_TYPES, type WordType } from "./wordTypes";

const wordDocValidator = v.union(
  v.null(),
  v.object({
    _id: v.id("words"),
    _creationTime: v.number(),
    userId: v.id("users"),
    language: v.string(),
    text: v.string(),
    type: wordTypeValidator,
    meaning: v.string(),
    tags: v.optional(v.string()),
  }),
);

export const getById = query({
  args: {
    wordId: v.id("words"),
    language: v.string(),
  },
  returns: wordDocValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const word = await ctx.db.get("words", args.wordId);
    if (word === null || word.userId !== userId || word.language !== args.language) {
      return null;
    }
    return word;
  },
});

export const listByUserAndLanguage = query({
  args: {
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const docs = await ctx.db
      .query("words")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("language", args.language),
      )
      .collect();

    const collator = new Intl.Collator(args.language);
    docs.sort((a, b) => collator.compare(a.text, b.text));
    return docs;
  },
});

export const create = mutation({
  args: {
    language: v.string(),
    text: v.string(),
    type: wordTypeValidator,
    meaning: v.string(),
    tags: v.optional(v.string()),
  },
  returns: v.id("words"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const textTrimmed = args.text.trim();
    if (textTrimmed === "") {
      throw new Error("Text cannot be empty");
    }
    return await ctx.db.insert("words", {
      userId,
      language: args.language,
      text: textTrimmed,
      type: args.type,
      meaning: args.meaning,
      tags: args.tags,
    });
  },
});

export const update = mutation({
  args: {
    wordId: v.id("words"),
    text: v.string(),
    type: wordTypeValidator,
    meaning: v.string(),
    tags: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const textTrimmed = args.text.trim();
    if (textTrimmed === "") {
      throw new Error("Text cannot be empty");
    }
    const word = await ctx.db.get("words", args.wordId);
    if (word === null || word.userId !== userId) {
      throw new Error("Word not found or access denied");
    }
    await ctx.db.patch(args.wordId, {
      text: textTrimmed,
      type: args.type,
      meaning: args.meaning,
      tags: args.tags,
    });
    return null;
  },
});

/**
 * One-off migration: backfill default `type` for words that don't have it.
 * Run once after deploying the schema change (Option B).
 * Existing words get type "nm"; users can correct in the UI.
 */
export const backfillType = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const words = await ctx.db.query("words").collect();
    let patched = 0;
    for (const word of words) {
      const doc = word as { _id: typeof word._id; type?: string };
      if (!("type" in doc) || doc.type === undefined) {
        await ctx.db.patch(word._id, { type: "nm" });
        patched += 1;
      }
    }
    return patched;
  },
});
