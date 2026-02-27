import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const submitAnswer = mutation({
  args: {
    questionId: v.id("questions"),
    answerGiven: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }

    const question = await ctx.db.get("questions", args.questionId);
    if (question === null || question.userId !== userId) {
      throw new Error("Question not found or access denied");
    }

    const expected = question.expected ?? "";
    const isCorrect =
      args.answerGiven.trim().toLowerCase() === expected.trim().toLowerCase();

    await ctx.db.patch(args.questionId, {
      answerGiven: args.answerGiven,
      isCorrect,
      respondedAt: Date.now(),
    });

    return null;
  },
});
