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

async function insertQuestion(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    questionTypeId: Id<"questionTypes">,
    language: string,
    text: string,
    expected: string,
): Promise<Id<"questions">> {
    return await t.run(async (ctx) => {
        return await ctx.db.insert("questions", {
            userId,
            language,
            questionTypeId,
            text,
            expected,
        });
    });
}

describe("practice.submitAnswer", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("throws when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userId, questionTypeId, "en", "Q", "hello");

        await expect(
            t.mutation(api.practice.submitAnswer, {
                questionId,
                answerGiven: "hello",
            }),
        ).rejects.toThrow(/Unauthorized/);
    });

    it("throws when question belongs to another user", async () => {
        const userA = await createUserAndSession(t, "a");
        const userB = await createUserAndSession(t, "b");
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId: userA.userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userA.userId, questionTypeId, "en", "Q", "hello");

        await expect(
            userB.userSession.mutation(api.practice.submitAnswer, {
                questionId,
                answerGiven: "hello",
            }),
        ).rejects.toThrow(/Question not found or access denied/);
    });

    it("correct answer (exact match): sets isCorrect true, answerGiven, respondedAt", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userId, questionTypeId, "en", "Q", "hello");

        await userSession.mutation(api.practice.submitAnswer, {
            questionId,
            answerGiven: "hello",
        });

        const question = await t.run(async (ctx) => ctx.db.get("questions", questionId));
        expect(question?.isCorrect).toBe(true);
        expect(question?.answerGiven).toBe("hello");
        expect(question?.respondedAt).toBeDefined();
    });

    it("correct answer (trim): whitespace around answer is trimmed", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userId, questionTypeId, "en", "Q", "hello");

        await userSession.mutation(api.practice.submitAnswer, {
            questionId,
            answerGiven: "  hello  ",
        });

        const question = await t.run(async (ctx) => ctx.db.get("questions", questionId));
        expect(question?.isCorrect).toBe(true);
    });

    it("correct answer (case-insensitive): HELLO matches hello", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userId, questionTypeId, "en", "Q", "hello");

        await userSession.mutation(api.practice.submitAnswer, {
            questionId,
            answerGiven: "HELLO",
        });

        const question = await t.run(async (ctx) => ctx.db.get("questions", questionId));
        expect(question?.isCorrect).toBe(true);
    });

    it("wrong answer: sets isCorrect false", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language: "en",
                name: "QT",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
        const questionId = await insertQuestion(t, userId, questionTypeId, "en", "Q", "right");

        await userSession.mutation(api.practice.submitAnswer, {
            questionId,
            answerGiven: "wrong",
        });

        const question = await t.run(async (ctx) => ctx.db.get("questions", questionId));
        expect(question?.isCorrect).toBe(false);
        expect(question?.answerGiven).toBe("wrong");
        expect(question?.respondedAt).toBeDefined();
    });
});

describe("practiceActions.generateQuestion (action)", () => {
    let t: ReturnType<typeof convexTest>;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    async function insertQuestionType(
        userId: Id<"users">,
        qt: {
            name: string;
            dataTemplate: string;
            questionTemplate: string;
            answerTemplate: string;
        },
        language = "en",
    ): Promise<Id<"questionTypes">> {
        return await t.run(async (ctx) =>
            ctx.db.insert("questionTypes", {
                userId,
                language,
                name: qt.name,
                dataTemplate: qt.dataTemplate,
                questionTemplate: qt.questionTemplate,
                answerTemplate: qt.answerTemplate,
            }),
        );
    }

    it("returns null when unauthenticated", async () => {
        const { userId } = await createUserAndSession(t);
        const questionTypeId = await insertQuestionType(userId, {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "Q",
            answerTemplate: "A",
        });

        const result = await t.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("returns null when question type belongs to another user", async () => {
        const userA = await createUserAndSession(t, "a");
        const userB = await createUserAndSession(t, "b");
        const questionTypeId = await insertQuestionType(userA.userId, {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "Q",
            answerTemplate: "A",
        });

        const result = await userB.userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
        });
        expect(result).toBeNull();
    });

    it("generates question with empty dataTemplate", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await insertQuestionType(userId, {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "What is 2+2?",
            answerTemplate: "4",
        });

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.text).toBe("What is 2+2?");
        expect(result?.expected).toBe("4");
        expect(result?.questionId).toBeDefined();

        const question = await t.run(async (ctx) => ctx.db.get("questions", result!.questionId));
        expect(question?.userId).toBe(userId);
        expect(question?.text).toBe("What is 2+2?");
        expect(question?.expected).toBe("4");
    });

    it("stores sessionId on question when sessionId is provided", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await insertQuestionType(userId, {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "What is 2+2?",
            answerTemplate: "4",
        });
        const stId = await t.run(async (ctx) =>
            ctx.db.insert("sessionTypes", {
                userId,
                language: "en",
                name: "ST",
                questions: [{ questionTypeId, count: 1 }],
            }),
        );
        const sessionId = await t.run(async (ctx) =>
            ctx.db.insert("sessions", {
                userId,
                language: "en",
                sessionTypeId: stId,
            }),
        );

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
            sessionId,
        });
        expect(result).not.toBeNull();

        const question = await t.run(async (ctx) => ctx.db.get("questions", result!.questionId));
        expect(question?.sessionId).toBe(sessionId);
    });

    it("generates question with word helper using type filter", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const wordId = await t.run(async (ctx) =>
            ctx.db.insert("words", {
                userId,
                language: "en",
                text: "chat",
                type: "nm",
                meaning: "cat",
            }),
        );
        const questionTypeId = await insertQuestionType(userId, {
            name: "Word meaning",
            dataTemplate: 'word = word type="nm"',
            questionTemplate: "What does {{word.text}} mean?",
            answerTemplate: "{{word.meaning}}",
        });

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
        });
        expect(result).not.toBeNull();
        expect(result?.text).toBe("What does chat mean?");
        expect(result?.expected).toBe("cat");

        const question = await t.run(async (ctx) => ctx.db.get("questions", result!.questionId));
        expect(question?.wordIds).toEqual([wordId]);
    });

    it("generates French question with noun helper (definite article)", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        await t.run(async (ctx) =>
            ctx.db.insert("words", {
                userId,
                language: "fr",
                text: "chat",
                type: "nm",
                meaning: "cat",
            }),
        );
        const questionTypeId = await insertQuestionType(
            userId,
            {
                name: "Noun phrase",
                dataTemplate: 'noun = word text="chat"',
                questionTemplate: '{{noun noun art="def"}}',
                answerTemplate: "le chat",
            },
            "fr",
        );

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "fr",
        });
        expect(result).not.toBeNull();
        // RosaeNLG/postProcess may capitalize
        expect(result?.text.toLowerCase()).toBe("le chat");
        expect(result?.expected.toLowerCase()).toBe("le chat");
    });

    it("accepts optional userLanguage and succeeds (translate helper registered when provided)", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        const questionTypeId = await insertQuestionType(userId, {
            name: "QT",
            dataTemplate: "",
            questionTemplate: "Translate this: hello",
            answerTemplate: "bonjour",
        });

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "en",
            userLanguage: "fr",
        });
        expect(result).not.toBeNull();
        expect(result?.text).toBe("Translate this: hello");
        expect(result?.expected).toBe("bonjour");
    });

    it("generates French question with verb helper (conjugated)", async () => {
        const { userId, userSession } = await createUserAndSession(t);
        await t.run(async (ctx) => {
            await ctx.db.insert("words", {
                userId,
                language: "fr",
                text: "chat",
                type: "nm",
                meaning: "cat",
            });
            await ctx.db.insert("words", {
                userId,
                language: "fr",
                text: "manger",
                type: "vtr",
                meaning: "to eat",
            });
        });
        const questionTypeId = await insertQuestionType(
            userId,
            {
                name: "Verb conjugation",
                dataTemplate: 'noun = word text="chat"\nverb = word text="manger"',
                questionTemplate: 'Le chat ___. Réponse: {{verb verb subject=noun tense="PRESENT"}}',
                answerTemplate: '{{verb verb subject=noun tense="PRESENT"}}',
            },
            "fr",
        );

        const result = await userSession.action(api.practiceActions.generateQuestion, {
            questionTypeId,
            language: "fr",
        });
        expect(result).not.toBeNull();
        expect(result?.text).toContain("mange");
        // RosaeNLG may capitalize
        expect(result?.expected.toLowerCase()).toBe("mange");
    });
});
