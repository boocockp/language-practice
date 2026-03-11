import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const sessionQuestionValidator = v.object({
    questionTypeId: v.id("questionTypes"),
    count: v.number(),
});

/**
 * Internal: get auth and session type for session generation. Returns null if not authorized.
 */
export const getAuthAndSessionType = internalQuery({
    args: {
        sessionTypeId: v.id("sessionTypes"),
        language: v.string(),
    },
    returns: v.union(
        v.null(),
        v.object({
            userId: v.id("users"),
            questions: v.array(sessionQuestionValidator),
        }),
    ),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) return null;
        const doc = await ctx.db.get("sessionTypes", args.sessionTypeId);
        if (doc === null || doc.userId !== userId || doc.language !== args.language) {
            return null;
        }
        return {
            userId,
            questions: doc.questions,
        };
    },
});

/**
 * Internal: insert a session record. Called by generateSession action.
 */
export const insertSession = internalMutation({
    args: {
        userId: v.id("users"),
        language: v.string(),
        sessionTypeId: v.id("sessionTypes"),
    },
    returns: v.id("sessions"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("sessions", {
            userId: args.userId,
            language: args.language,
            sessionTypeId: args.sessionTypeId,
        });
    },
});
