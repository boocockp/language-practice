import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

const wordDocValidator = v.union(
  v.null(),
  v.object({
    _id: v.id("words"),
    _creationTime: v.number(),
    userId: v.id("users"),
    language: v.string(),
    text: v.string(),
    pos: partOfSpeech,
    gender: v.optional(gender),
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
    pos: partOfSpeech,
    gender: v.optional(gender),
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
      pos: args.pos,
      gender: args.gender,
      meaning: args.meaning,
      tags: args.tags,
    });
  },
});

export const update = mutation({
  args: {
    wordId: v.id("words"),
    text: v.string(),
    pos: partOfSpeech,
    gender: v.optional(gender),
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
      pos: args.pos,
      gender: args.gender,
      meaning: args.meaning,
      tags: args.tags,
    });
    return null;
  },
});
