import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const questionDocValidator = v.object({
    _id: v.id("questions"),
    _creationTime: v.number(),
    text: v.string(),
    expected: v.string(),
    answerGiven: v.optional(v.string()),
    isCorrect: v.optional(v.boolean()),
    respondedAt: v.optional(v.number()),
});

const sessionDocValidator = v.object({
    _id: v.id("sessions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    language: v.string(),
    sessionTypeId: v.id("sessionTypes"),
    numberCorrect: v.optional(v.number()),
});

export const getWithQuestions = query({
    args: {
        sessionId: v.id("sessions"),
        language: v.string(),
    },
    returns: v.union(
        v.null(),
        v.object({
            session: sessionDocValidator,
            questions: v.array(questionDocValidator),
        }),
    ),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) return null;

        const session = await ctx.db.get("sessions", args.sessionId);
        if (session === null || session.userId !== userId || session.language !== args.language) {
            return null;
        }

        const questions = await ctx.db
            .query("questions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .collect();
        questions.sort((a, b) => a._creationTime - b._creationTime);

        return {
            session: {
                _id: session._id,
                _creationTime: session._creationTime,
                userId: session.userId,
                language: session.language,
                sessionTypeId: session.sessionTypeId,
                numberCorrect: session.numberCorrect,
            },
            questions: questions.map((q) => ({
                _id: q._id,
                _creationTime: q._creationTime,
                text: q.text,
                expected: q.expected,
                answerGiven: q.answerGiven,
                isCorrect: q.isCorrect,
                respondedAt: q.respondedAt,
            })),
        };
    },
});

export const endSession = mutation({
    args: {
        sessionId: v.id("sessions"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("Unauthorized");
        }

        const session = await ctx.db.get("sessions", args.sessionId);
        if (session === null || session.userId !== userId) {
            throw new Error("Session not found or access denied");
        }

        const questions = await ctx.db
            .query("questions")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        const numberCorrect = questions.filter((q) => q.isCorrect === true).length;

        await ctx.db.patch(args.sessionId, { numberCorrect });
        return null;
    },
});
