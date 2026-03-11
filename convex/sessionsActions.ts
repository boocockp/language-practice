"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const generateSessionReturn = v.union(
    v.null(),
    v.object({
        sessionId: v.id("sessions"),
        questionIds: v.array(v.id("questions")),
    }),
);

export const generateSession = action({
    args: {
        sessionTypeId: v.id("sessionTypes"),
        language: v.string(),
        userLanguage: v.optional(v.string()),
    },
    returns: generateSessionReturn,
    handler: async (ctx, args): Promise<null | { sessionId: Id<"sessions">; questionIds: Id<"questions">[] }> => {
        const authData = await ctx.runQuery(internal.sessionsInternal.getAuthAndSessionType, {
            sessionTypeId: args.sessionTypeId,
            language: args.language,
        });
        if (authData === null) return null;

        const sessionId: Id<"sessions"> = await ctx.runMutation(internal.sessionsInternal.insertSession, {
            userId: authData.userId,
            language: args.language,
            sessionTypeId: args.sessionTypeId,
        });

        const questionIds: Id<"questions">[] = [];
        for (const item of authData.questions) {
            for (let i = 0; i < item.count; i++) {
                const result = await ctx.runAction(api.practiceActions.generateQuestion, {
                    questionTypeId: item.questionTypeId,
                    language: args.language,
                    userLanguage: args.userLanguage,
                    sessionId,
                });
                if (result !== null) {
                    questionIds.push(result.questionId);
                }
            }
        }

        return { sessionId, questionIds };
    },
});
