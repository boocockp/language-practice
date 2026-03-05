"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

import {
  generateQuestion as runQuestionGeneration,
  type WordLookupOptions,
} from "./questionGeneration";
import { getTemplateHelpersForLanguage } from "./templateHelpers";

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

    const wordIds: Id<"words">[] = [];
    const lookupWord = async (options: WordLookupOptions) => {
      const result = (await ctx.runAction(internal.words.getRandomByCriteria, {
        userId,
        language: args.language,
        ...options,
      })) as {
        _id: Id<"words">;
        text: string;
        type: string;
        meaning: string;
      } | null;
      if (result?._id) wordIds.push(result._id);
      return result;
    };

    const { templateHelpers, postProcess } =
      getTemplateHelpersForLanguage(args.language);

    let result: { text: string; expected: string };
    try {
      result = await runQuestionGeneration({
        dataTemplate,
        questionTemplate,
        answerTemplate,
        initialContext: {},
        lookupWord,
        language: args.language,
        templateHelpers,
        postProcess,
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
        wordIds: [...new Set(wordIds)],
      },
    )) as Id<"questions">;

    return {
      questionId,
      text: result.text,
      expected: result.expected,
    };
  },
});
