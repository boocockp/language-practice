import type { GenericQueryCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";

import { wordTypeValidator, type WordType } from "./wordTypes";

/**
 * Internal helper: look up the first word by text for the given user and language.
 * Used by the `word` helper during question template execution.
 */
export async function lookupWordByText(
  ctx: GenericQueryCtx<DataModel>,
  userId: Id<"users">,
  language: string,
  text: string,
): Promise<{ text: string; meaning: string } | null> {
  const word = await ctx.db
    .query("words")
    .withIndex("by_userId_language", (q) =>
      q.eq("userId", userId).eq("language", language),
    )
    .filter((q) => q.eq(q.field("text"), text))
    .first();
  if (word === null) return null;
  return { text: word.text, meaning: word.meaning };
}

export { WORD_TYPES, type WordType } from "./wordTypes";

/**
 * Internal: look up the first word by text for the given user and language.
 * Used by the practice action for template word helper.
 * @deprecated Use getRandomByCriteria for the word helper (supports type, tags, random selection).
 */
export const getFirstByText = internalQuery({
  args: {
    userId: v.id("users"),
    language: v.string(),
    text: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({ text: v.string(), meaning: v.string() }),
  ),
  handler: async (ctx, args) => {
    const word = await ctx.db
      .query("words")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", args.userId).eq("language", args.language),
      )
      .filter((q) => q.eq(q.field("text"), args.text))
      .first();
    if (word === null) return null;
    return { text: word.text, meaning: word.meaning };
  },
});

/**
 * Parse comma-separated list, trim each part, filter empty.
 */
function parseCommaList(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "");
}

/**
 * Check if a word matches the tags criteria.
 * tagsOption format: groups joined by &; each group is comma-separated.
 * A word matches iff for every group, at least one tag in the group is in the word's tags.
 */
function matchesTags(
  wordTags: string | undefined,
  tagsOption: string,
): boolean {
  const recordTags = new Set(
    (wordTags ?? "")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t !== ""),
  );
  const groups = tagsOption.split("&").map((g) => parseCommaList(g));
  for (const group of groups) {
    if (group.length === 0) continue;
    const hasMatch = group.some((tag) => recordTags.has(tag));
    if (!hasMatch) return false;
  }
  return true;
}

const getRandomByCriteriaArgs = {
  userId: v.id("users"),
  language: v.string(),
  text: v.optional(v.string()),
  type: v.optional(v.string()),
  tags: v.optional(v.string()),
};

const wordResultValidator = v.object({
  _id: v.id("words"),
  text: v.string(),
  type: wordTypeValidator,
  meaning: v.string(),
});

/**
 * Internal: get list of words matching the given criteria (deterministic, used by getRandomByCriteria action).
 */
export const getMatchingWordsByCriteria = internalQuery({
  args: getRandomByCriteriaArgs,
  returns: v.array(wordResultValidator),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("words")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", args.userId).eq("language", args.language),
      )
      .collect();

    const textList =
      args.text && args.text.trim() !== ""
        ? parseCommaList(args.text)
        : null;
    const typeList =
      args.type && args.type.trim() !== ""
        ? parseCommaList(args.type)
        : null;
    const tagsOption =
      args.tags && args.tags.trim() !== "" ? args.tags : null;

    const matches = candidates.filter((word) => {
      if (textList !== null && !textList.includes(word.text)) return false;
      if (typeList !== null && !typeList.includes(word.type)) return false;
      if (tagsOption !== null && !matchesTags(word.tags, tagsOption))
        return false;
      return true;
    });

    return matches.map((w) => ({
      _id: w._id,
      text: w.text,
      type: w.type,
      meaning: w.meaning,
    }));
  },
});

/**
 * Internal: get a random word matching the given criteria for user and language.
 * Implemented as an action (not a query) so random selection is not cached.
 * Used by the practice action for the word helper during question generation.
 */
export const getRandomByCriteria = internalAction({
  args: getRandomByCriteriaArgs,
  returns: v.union(v.null(), wordResultValidator),
  handler: async (
    ctx,
    args,
  ): Promise<{
    _id: Id<"words">;
    text: string;
    type: WordType;
    meaning: string;
  } | null> => {
    const matches = await ctx.runQuery(
      internal.words.getMatchingWordsByCriteria,
      args,
    );
    if (matches.length === 0) return null;
    const chosen =
      matches[Math.floor(Math.random() * matches.length)] ?? matches[0];
    return chosen;
  },
});

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
      if (("pos" in doc) ) {
        // await ctx.db.patch(word._id, { pos: undefined });
        // await ctx.db.patch(word._id, { gender: undefined });
        patched += 1;
      }
    }
    return patched;
  },
});
