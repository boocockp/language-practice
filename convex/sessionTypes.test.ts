// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createUserAndSession(t: ReturnType<typeof convexTest>, tokenIdentifier = "test") {
    const { userId, subject } = await t.run(async (ctx) => {
        const createdUserId = await ctx.db.insert("users", {});
        const sessionId = await ctx.db.insert("authSessions", {
            userId: createdUserId,
            expirationTime: Date.now() + 3600_000,
        });
        return { userId: createdUserId, subject: `${createdUserId}|${sessionId}` };
    });
    const userSession = asUser(t, subject, tokenIdentifier);
    return { userId, userSession };
}

function asUser(t: ReturnType<typeof convexTest>, subject: string, tokenIdentifier = "test") {
    return t.withIdentity({
        subject,
        issuer: "https://test",
        tokenIdentifier,
    });
}

async function insertQuestionType(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    language: string,
    qt: {
        name: string;
        dataTemplate: string;
        questionTemplate: string;
        answerTemplate: string;
    },
): Promise<Id<"questionTypes">> {
    return await t.run(async (ctx) => {
        return await ctx.db.insert("questionTypes", {
            userId,
            language,
            name: qt.name,
            dataTemplate: qt.dataTemplate,
            questionTemplate: qt.questionTemplate,
            answerTemplate: qt.answerTemplate,
        });
    });
}

async function insertSessionType(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    language: string,
    st: {
        name: string;
        questions: { questionTypeId: Id<"questionTypes">; count: number }[];
    },
): Promise<Id<"sessionTypes">> {
    return await t.run(async (ctx) => {
        return await ctx.db.insert("sessionTypes", {
            userId,
            language,
            name: st.name,
            questions: st.questions,
        });
    });
}

function namesOf(docs: { name: string }[]): string[] {
    return docs.map((r) => r.name);
}

describe("sessionTypes.listByUserAndLanguage", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("returns empty array when unauthenticated", async () => {
        const result = await t.query(api.sessionTypes.listByUserAndLanguage, {
            language: "en",
        });
        expect(result).toEqual([]);
    });

    it("returns empty array when authenticated but no session types exist", async () => {
        const { userSession } = await createUserAndSession(t);
        const result = await userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "en" });
        expect(result).toEqual([]);
    });

    it("returns session types sorted by name for the given locale", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        await insertSessionType(t, userId, "en", {
            name: "Type C",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        await insertSessionType(t, userId, "en", {
            name: "Type A",
            questions: [],
        });
        await insertSessionType(t, userId, "en", {
            name: "Type B",
            questions: [],
        });
        const result = await userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "en" });
        expect(namesOf(result)).toEqual(["Type A", "Type B", "Type C"]);
    });

    it("filters by language", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        await insertSessionType(t, userId, "en", {
            name: "English session",
            questions: [],
        });
        await insertSessionType(t, userId, "fr", {
            name: "French session",
            questions: [],
        });
        const enResult = await userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "en" });
        const frResult = await userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "fr" });
        expect(namesOf(enResult)).toEqual(["English session"]);
        expect(namesOf(frResult)).toEqual(["French session"]);
    });

    it("returns only the current user's session types (user isolation)", async () => {
        const userA = await createUserAndSession(t, "test-a");
        const userB = await createUserAndSession(t, "test-b");
        await insertSessionType(t, userA.userId, "en", {
            name: "User A session",
            questions: [],
        });
        await insertSessionType(t, userB.userId, "en", {
            name: "User B session",
            questions: [],
        });
        const aList = await userA.userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "en" });
        const bList = await userB.userSession.query(api.sessionTypes.listByUserAndLanguage, { language: "en" });
        expect(namesOf(aList)).toEqual(["User A session"]);
        expect(namesOf(bList)).toEqual(["User B session"]);
    });
});

describe("sessionTypes.getById", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("returns null when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "en", {
            name: "Test",
            questions: [],
        });
        const result = await t.query(api.sessionTypes.getById, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when session type exists but belongs to another user", async () => {
        const userA = await createUserAndSession(t, "test-a");
        const userB = await createUserAndSession(t, "test-b");
        const stId = await insertSessionType(t, userA.userId, "en", {
            name: "A session",
            questions: [],
        });
        const result = await userB.userSession.query(api.sessionTypes.getById, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when language does not match", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "fr", {
            name: "French",
            questions: [],
        });
        const result = await userSession.query(api.sessionTypes.getById, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns the session type with questions when authenticated, owner, and language matches", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "My session",
            questions: [
                { questionTypeId: qtId, count: 2 },
                { questionTypeId: qtId, count: 1 },
            ],
        });
        const result = await userSession.query(api.sessionTypes.getById, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?._id).toBe(stId);
        expect(result?.name).toBe("My session");
        expect(result?.questions).toHaveLength(2);
        expect(result?.questions[0]).toEqual({ questionTypeId: qtId, count: 2 });
        expect(result?.questions[1]).toEqual({ questionTypeId: qtId, count: 1 });
    });
});

describe("sessionTypes.create", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("throws when unauthenticated", async () => {
        await expect(
            t.mutation(api.sessionTypes.create, {
                language: "en",
                name: "New session type",
            }),
        ).rejects.toThrow();
    });

    it("creates session type with empty questions and returns id when authenticated", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const id = await userSession.mutation(api.sessionTypes.create, {
            language: "en",
            name: "New session type",
        });
        expect(id).toBeDefined();
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", id));
        expect(doc).not.toBeNull();
        expect(doc?.userId).toBe(userId);
        expect(doc?.language).toBe("en");
        expect(doc?.name).toBe("New session type");
        expect(doc?.questions).toEqual([]);
    });

    it("creates session type with questions when question types exist and belong to user", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const id = await userSession.mutation(api.sessionTypes.create, {
            language: "en",
            name: "With questions",
            questions: [{ questionTypeId: qtId, count: 3 }],
        });
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", id));
        expect(doc?.questions).toEqual([{ questionTypeId: qtId, count: 3 }]);
    });

    it("throws when name is empty", async () => {
        const { userSession } = await createUserAndSession(t);
        await expect(
            userSession.mutation(api.sessionTypes.create, {
                language: "en",
                name: "",
            }),
        ).rejects.toThrow();
    });

    it("throws when name is whitespace only", async () => {
        const { userSession } = await createUserAndSession(t);
        await expect(
            userSession.mutation(api.sessionTypes.create, {
                language: "en",
                name: "   ",
            }),
        ).rejects.toThrow();
    });

    it("throws when question type does not exist or belongs to another user", async () => {
        const userA = await createUserAndSession(t, "test-a");
        const userB = await createUserAndSession(t, "test-b");
        const qtId = await insertQuestionType(t, userA.userId, "en", {
            name: "A QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        await expect(
            userB.userSession.mutation(api.sessionTypes.create, {
                language: "en",
                name: "With other user QT",
                questions: [{ questionTypeId: qtId, count: 1 }],
            }),
        ).rejects.toThrow();
    });

    it("throws when count is less than 1", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        await expect(
            userSession.mutation(api.sessionTypes.create, {
                language: "en",
                name: "Bad count",
                questions: [{ questionTypeId: qtId, count: 0 }],
            }),
        ).rejects.toThrow();
    });
});

describe("sessionTypes.update", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("does not update when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "en", {
            name: "Original",
            questions: [],
        });
        await expect(
            t.mutation(api.sessionTypes.update, {
                sessionTypeId: stId,
                name: "Hacked",
                questions: [],
            }),
        ).rejects.toThrow();
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", stId));
        expect(doc?.name).toBe("Original");
    });

    it("does not update when session type belongs to another user", async () => {
        const userA = await createUserAndSession(t, "test-a");
        const userB = await createUserAndSession(t, "test-b");
        const stId = await insertSessionType(t, userA.userId, "en", {
            name: "A session",
            questions: [],
        });
        await expect(
            userB.userSession.mutation(api.sessionTypes.update, {
                sessionTypeId: stId,
                name: "Stolen",
                questions: [],
            }),
        ).rejects.toThrow();
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", stId));
        expect(doc?.name).toBe("A session");
    });

    it("throws when name is empty", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "en", {
            name: "Original",
            questions: [],
        });
        await expect(
            userSession.mutation(api.sessionTypes.update, {
                sessionTypeId: stId,
                name: "",
                questions: [],
            }),
        ).rejects.toThrow();
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", stId));
        expect(doc?.name).toBe("Original");
    });

    it("succeeds when owner and updates name and questions", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qt1 = await insertQuestionType(t, userId, "en", {
            name: "QT1",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const qt2 = await insertQuestionType(t, userId, "en", {
            name: "QT2",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "Original",
            questions: [{ questionTypeId: qt1, count: 1 }],
        });
        await userSession.mutation(api.sessionTypes.update, {
            sessionTypeId: stId,
            name: "Updated",
            questions: [
                { questionTypeId: qt2, count: 2 },
                { questionTypeId: qt1, count: 3 },
            ],
        });
        const doc = await t.run(async (ctx) => ctx.db.get("sessionTypes", stId));
        expect(doc?.name).toBe("Updated");
        expect(doc?.questions).toHaveLength(2);
        expect(doc?.questions[0]).toEqual({ questionTypeId: qt2, count: 2 });
        expect(doc?.questions[1]).toEqual({ questionTypeId: qt1, count: 3 });
        expect(doc?.userId).toBe(userId);
        expect(doc?.language).toBe("en");
    });
});
