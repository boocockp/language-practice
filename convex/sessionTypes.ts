import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const sessionQuestionValidator = v.object({
    questionTypeId: v.id("questionTypes"),
    count: v.number(),
});

const sessionTypeDocValidator = v.union(
    v.null(),
    v.object({
        _id: v.id("sessionTypes"),
        _creationTime: v.number(),
        userId: v.id("users"),
        language: v.string(),
        name: v.string(),
        questions: v.array(sessionQuestionValidator),
    }),
);

export const getById = query({
    args: {
        sessionTypeId: v.id("sessionTypes"),
        language: v.string(),
    },
    returns: sessionTypeDocValidator,
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            return null;
        }
        const doc = await ctx.db.get("sessionTypes", args.sessionTypeId);
        if (doc === null || doc.userId !== userId || doc.language !== args.language) {
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
            .query("sessionTypes")
            .withIndex("by_userId_language", (q) => q.eq("userId", userId).eq("language", args.language))
            .collect();

        const collator = new Intl.Collator(args.language);
        docs.sort((a, b) => collator.compare(a.name, b.name));
        return docs;
    },
});

async function validateQuestions(
    ctx: MutationCtx,
    userId: Id<"users">,
    language: string,
    questions: { questionTypeId: Id<"questionTypes">; count: number }[],
) {
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.count < 1) {
            throw new Error(`Session question at index ${i}: count must be at least 1`);
        }
        const qt = await ctx.db.get("questionTypes", q.questionTypeId);
        if (qt === null || qt.userId !== userId || qt.language !== language) {
            throw new Error(`Session question at index ${i}: question type not found or access denied`);
        }
    }
}

export const create = mutation({
    args: {
        language: v.string(),
        name: v.string(),
        questions: v.optional(v.array(sessionQuestionValidator)),
    },
    returns: v.id("sessionTypes"),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("Unauthorized");
        }
        const nameTrimmed = args.name.trim();
        if (nameTrimmed === "") {
            throw new Error("Name cannot be empty");
        }
        const questions = args.questions ?? [];
        await validateQuestions(ctx, userId, args.language, questions);
        return await ctx.db.insert("sessionTypes", {
            userId,
            language: args.language,
            name: nameTrimmed,
            questions,
        });
    },
});

export const update = mutation({
    args: {
        sessionTypeId: v.id("sessionTypes"),
        name: v.string(),
        questions: v.array(sessionQuestionValidator),
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
        const doc = await ctx.db.get("sessionTypes", args.sessionTypeId);
        if (doc === null || doc.userId !== userId) {
            throw new Error("Session type not found or access denied");
        }
        await validateQuestions(ctx, userId, doc.language, args.questions);
        await ctx.db.patch(args.sessionTypeId, {
            name: nameTrimmed,
            questions: args.questions,
        });
        return null;
    },
});
