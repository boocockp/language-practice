import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const questionTypeDocValidator = v.union(
  v.null(),
  v.object({
    _id: v.id("questionTypes"),
    _creationTime: v.number(),
    userId: v.id("users"),
    language: v.string(),
    name: v.string(),
    dataTemplate: v.string(),
    questionTemplate: v.string(),
    answerTemplate: v.string(),
  }),
);

export const getById = query({
  args: {
    questionTypeId: v.id("questionTypes"),
    language: v.string(),
  },
  returns: questionTypeDocValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const doc = await ctx.db.get("questionTypes", args.questionTypeId);
    if (
      doc === null ||
      doc.userId !== userId ||
      doc.language !== args.language
    ) {
      return null;
    }
    return doc;
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
      .query("questionTypes")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("language", args.language),
      )
      .collect();

    const collator = new Intl.Collator(args.language);
    docs.sort((a, b) => collator.compare(a.name, b.name));
    return docs;
  },
});

export const create = mutation({
  args: {
    language: v.string(),
    name: v.string(),
    dataTemplate: v.string(),
    questionTemplate: v.string(),
    answerTemplate: v.string(),
  },
  returns: v.id("questionTypes"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const nameTrimmed = args.name.trim();
    if (nameTrimmed === "") {
      throw new Error("Name cannot be empty");
    }
    return await ctx.db.insert("questionTypes", {
      userId,
      language: args.language,
      name: nameTrimmed,
      dataTemplate: args.dataTemplate,
      questionTemplate: args.questionTemplate,
      answerTemplate: args.answerTemplate,
    });
  },
});

export const update = mutation({
  args: {
    questionTypeId: v.id("questionTypes"),
    name: v.string(),
    dataTemplate: v.string(),
    questionTemplate: v.string(),
    answerTemplate: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const nameTrimmed = args.name.trim();
    if (nameTrimmed === "") {
      throw new Error("Name cannot be empty");
    }
    const doc = await ctx.db.get("questionTypes", args.questionTypeId);
    if (doc === null || doc.userId !== userId) {
      throw new Error("Question type not found or access denied");
    }
    await ctx.db.patch(args.questionTypeId, {
      name: nameTrimmed,
      dataTemplate: args.dataTemplate,
      questionTemplate: args.questionTemplate,
      answerTemplate: args.answerTemplate,
    });
    return null;
  },
});
