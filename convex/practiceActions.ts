"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

import { generateQuestion as runQuestionGeneration } from "./questionGeneration";

import type { Id } from "./_generated/dataModel";

export const generateQuestion = action({
  args: {
    questionTypeId: v.id("questionTypes"),
    language: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      questionId: v.id("questions"),
      text: v.string(),
      expected: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const authData = await ctx.runQuery(
      internal.practiceInternal.getAuthAndQuestionType,
      {
        questionTypeId: args.questionTypeId,
        language: args.language,
      },
    );
    if (authData === null) return null;

    const { userId, dataTemplate, questionTemplate, answerTemplate } =
      authData;

    const lookupWord = (text: string) =>
      ctx.runQuery(internal.words.getFirstByText, {
        userId,
        language: args.language,
        text,
      }) as Promise<{ text: string; meaning: string } | null>;

    let result: { text: string; expected: string };
    try {
      result = await runQuestionGeneration({
        dataTemplate,
        questionTemplate,
        answerTemplate,
        initialContext: {},
        lookupWord,
      });
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to generate question",
      );
    }

    const questionId = (await ctx.runMutation(
      internal.practiceInternal.insertGeneratedQuestion,
      {
        userId,
        language: args.language,
        questionTypeId: args.questionTypeId,
        text: result.text,
        expected: result.expected,
      },
    )) as Id<"questions">;

    return {
      questionId,
      text: result.text,
      expected: result.expected,
    };
  },
});
