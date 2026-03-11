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

async function insertSession(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    language: string,
    sessionTypeId: Id<"sessionTypes">,
): Promise<Id<"sessions">> {
    return await t.run(async (ctx) => {
        return await ctx.db.insert("sessions", {
            userId,
            language,
            sessionTypeId,
        });
    });
}

async function insertQuestionWithSession(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    questionTypeId: Id<"questionTypes">,
    language: string,
    sessionId: Id<"sessions">,
    text: string,
    expected: string,
    opts?: { answerGiven?: string; isCorrect?: boolean; respondedAt?: number },
): Promise<Id<"questions">> {
    return await t.run(async (ctx) => {
        return await ctx.db.insert("questions", {
            userId,
            language,
            questionTypeId,
            sessionId,
            text,
            expected,
            ...(opts?.answerGiven !== undefined && { answerGiven: opts.answerGiven }),
            ...(opts?.isCorrect !== undefined && { isCorrect: opts.isCorrect }),
            ...(opts?.respondedAt !== undefined && { respondedAt: opts.respondedAt }),
        });
    });
}

describe("sessions.getWithQuestions", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("returns null when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        const sessionId = await insertSession(t, userId, "en", stId);
        await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Q", "A");

        const result = await t.query(api.sessions.getWithQuestions, {
            sessionId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when session belongs to another user", async () => {
        const userA = await createUserAndSession(t, "a");
        const userB = await createUserAndSession(t, "b");
        const qtId = await insertQuestionType(t, userA.userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userA.userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        const sessionId = await insertSession(t, userA.userId, "en", stId);

        const result = await userB.userSession.query(api.sessions.getWithQuestions, {
            sessionId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when language does not match", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        const sessionId = await insertSession(t, userId, "en", stId);
        await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Q", "A");

        const result = await userSession.query(api.sessions.getWithQuestions, {
            sessionId,
            language: "fr",
        });
        expect(result).toBeNull();
    });

    it("returns session and questions ordered by _creationTime", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 2 }],
        });
        const sessionId = await insertSession(t, userId, "en", stId);
        const q1Id = await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "First", "A1");
        const q2Id = await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Second", "A2");

        const result = await userSession.query(api.sessions.getWithQuestions, {
            sessionId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.session._id).toBe(sessionId);
        expect(result?.session.userId).toBe(userId);
        expect(result?.session.language).toBe("en");
        expect(result?.session.sessionTypeId).toBe(stId);
        expect(result?.questions).toHaveLength(2);
        expect(result?.questions[0]._id).toBe(q1Id);
        expect(result?.questions[0].text).toBe("First");
        expect(result?.questions[1]._id).toBe(q2Id);
        expect(result?.questions[1].text).toBe("Second");
    });

    it("returns only session's questions", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        const session1Id = await insertSession(t, userId, "en", stId);
        const session2Id = await insertSession(t, userId, "en", stId);
        await insertQuestionWithSession(t, userId, qtId, "en", session1Id, "Q1", "A1");
        await insertQuestionWithSession(t, userId, qtId, "en", session2Id, "Q2", "A2");

        const result = await userSession.query(api.sessions.getWithQuestions, {
            sessionId: session1Id,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.questions).toHaveLength(1);
        expect(result?.questions[0].text).toBe("Q1");
    });
});

describe("sessions.endSession", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("throws when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [],
        });
        const sessionId = await insertSession(t, userId, "en", stId);

        await expect(
            t.mutation(api.sessions.endSession, {
                sessionId,
            }),
        ).rejects.toThrow(/Unauthorized/);
    });

    it("throws when session belongs to another user", async () => {
        const userA = await createUserAndSession(t, "a");
        const userB = await createUserAndSession(t, "b");
        const stId = await insertSessionType(t, userA.userId, "en", {
            name: "ST",
            questions: [],
        });
        const sessionId = await insertSession(t, userA.userId, "en", stId);

        await expect(
            userB.userSession.mutation(api.sessions.endSession, {
                sessionId,
            }),
        ).rejects.toThrow(/Session not found or access denied/);
    });

    it("patches numberCorrect from questions", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "",
            answerTemplate: "",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 3 }],
        });
        const sessionId = await insertSession(t, userId, "en", stId);
        const now = Date.now();
        await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Q1", "A1", {
            answerGiven: "A1",
            isCorrect: true,
            respondedAt: now,
        });
        await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Q2", "A2", {
            answerGiven: "wrong",
            isCorrect: false,
            respondedAt: now + 1,
        });
        await insertQuestionWithSession(t, userId, qtId, "en", sessionId, "Q3", "A3", {
            answerGiven: "A3",
            isCorrect: true,
            respondedAt: now + 2,
        });

        await userSession.mutation(api.sessions.endSession, { sessionId });

        const session = await t.run(async (ctx) => ctx.db.get("sessions", sessionId));
        expect(session?.numberCorrect).toBe(2);
    });

    it("succeeds when no questions and numberCorrect is 0", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [],
        });
        const sessionId = await insertSession(t, userId, "en", stId);

        await userSession.mutation(api.sessions.endSession, { sessionId });

        const session = await t.run(async (ctx) => ctx.db.get("sessions", sessionId));
        expect(session?.numberCorrect).toBe(0);
    });
});

describe("sessionsActions.generateSession", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("returns null when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "Q",
            answerTemplate: "A",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });

        const result = await t.action(api.sessionsActions.generateSession, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when session type belongs to another user", async () => {
        const userA = await createUserAndSession(t, "a");
        const userB = await createUserAndSession(t, "b");
        const qtId = await insertQuestionType(t, userA.userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "Q",
            answerTemplate: "A",
        });
        const stId = await insertSessionType(t, userA.userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });

        const result = await userB.userSession.action(api.sessionsActions.generateSession, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("creates session and questions with sessionId when authorized", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "What is 2+2?",
            answerTemplate: "4",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 1 }],
        });

        const result = await userSession.action(api.sessionsActions.generateSession, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.sessionId).toBeDefined();
        expect(result?.questionIds).toHaveLength(1);

        const session = await t.run(async (ctx) => ctx.db.get("sessions", result!.sessionId));
        expect(session).not.toBeNull();
        expect(session?.userId).toBe(userId);
        expect(session?.language).toBe("en");
        expect(session?.sessionTypeId).toBe(stId);

        const question = await t.run(async (ctx) => ctx.db.get("questions", result!.questionIds[0]));
        expect(question).not.toBeNull();
        expect(question?.sessionId).toBe(result!.sessionId);
        expect(question?.text).toBe("What is 2+2?");
        expect(question?.expected).toBe("4");
    });

    it("generateSession with multiple questions creates two questions in order", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const qtId = await insertQuestionType(t, userId, "en", {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "What is 2+2?",
            answerTemplate: "4",
        });
        const stId = await insertSessionType(t, userId, "en", {
            name: "ST",
            questions: [{ questionTypeId: qtId, count: 2 }],
        });

        const result = await userSession.action(api.sessionsActions.generateSession, {
            sessionTypeId: stId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.questionIds).toHaveLength(2);

        const [q1, q2] = await Promise.all(
            result!.questionIds.map((id) => t.run(async (ctx) => ctx.db.get("questions", id))),
        );
        expect(q1?.sessionId).toBe(result!.sessionId);
        expect(q2?.sessionId).toBe(result!.sessionId);
        expect(q1!._creationTime).toBeLessThanOrEqual(q2!._creationTime);

        const getResult = await userSession.query(api.sessions.getWithQuestions, {
            sessionId: result!.sessionId,
            language: "en",
        });
        expect(getResult?.questions).toHaveLength(2);
        expect(getResult?.questions[0]._id).toBe(result!.questionIds[0]);
        expect(getResult?.questions[1]._id).toBe(result!.questionIds[1]);
    });
});
