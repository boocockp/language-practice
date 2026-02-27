import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Internal: get auth and question type for generation. Returns null if not authorized.
 */
export const getAuthAndQuestionType = internalQuery({
  args: {
    questionTypeId: v.id("questionTypes"),
    language: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      dataTemplate: v.string(),
      questionTemplate: v.string(),
      answerTemplate: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const qt = await ctx.db.get("questionTypes", args.questionTypeId);
    if (
      qt === null ||
      qt.userId !== userId ||
      qt.language !== args.language
    ) {
      return null;
    }
    return {
      userId,
      dataTemplate: qt.dataTemplate,
      questionTemplate: qt.questionTemplate,
      answerTemplate: qt.answerTemplate,
    };
  },
});

/**
 * Internal: insert a generated question. Called by the action after template execution.
 */
export const insertGeneratedQuestion = internalMutation({
  args: {
    userId: v.id("users"),
    language: v.string(),
    questionTypeId: v.id("questionTypes"),
    text: v.string(),
    expected: v.string(),
  },
  returns: v.id("questions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", {
      userId: args.userId,
      language: args.language,
      questionTypeId: args.questionTypeId,
      text: args.text,
      expected: args.expected,
    });
  },
});
