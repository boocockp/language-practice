// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createUserAndSession(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier = "test",
) {
  const { userId, subject } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 3600_000,
    });
    return { userId, subject: `${userId}|${sessionId}` };
  });
  const userSession = asUser(t, subject, tokenIdentifier);
  return { userId, userSession };
}

function asUser(
  t: ReturnType<typeof convexTest>,
  subject: string,
  tokenIdentifier = "test",
) {
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

function namesOf(docs: { name: string }[]): string[] {
  return docs.map((r) => r.name);
}

describe("questionTypes.listByUserAndLanguage", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns empty array when unauthenticated", async () => {
    const result = await t.query(api.questionTypes.listByUserAndLanguage, {
      language: "en",
    });
    expect(result).toEqual([]);
  });

  it("returns empty array when authenticated but no question types exist", async () => {
    const { userSession } = await createUserAndSession(t);
    const result = await userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "en" },
    );
    expect(result).toEqual([]);
  });

  it("returns question types sorted by name for the given locale", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    await insertQuestionType(t, userId, "en", {
      name: "Type C",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await insertQuestionType(t, userId, "en", {
      name: "Type A",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await insertQuestionType(t, userId, "en", {
      name: "Type B",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    const result = await userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "en" },
    );
    expect(namesOf(result)).toEqual(["Type A", "Type B", "Type C"]);
  });

  it("filters by language", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    await insertQuestionType(t, userId, "en", {
      name: "English type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await insertQuestionType(t, userId, "fr", {
      name: "French type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    const enResult = await userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "en" },
    );
    const frResult = await userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "fr" },
    );
    expect(namesOf(enResult)).toEqual(["English type"]);
    expect(namesOf(frResult)).toEqual(["French type"]);
  });

  it("returns only the current user's question types (user isolation)", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    await insertQuestionType(t, userA.userId, "en", {
      name: "User A type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await insertQuestionType(t, userB.userId, "en", {
      name: "User B type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    const aList = await userA.userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "en" },
    );
    const bList = await userB.userSession.query(
      api.questionTypes.listByUserAndLanguage,
      { language: "en" },
    );
    expect(namesOf(aList)).toEqual(["User A type"]);
    expect(namesOf(bList)).toEqual(["User B type"]);
  });
});

describe("questionTypes.getById", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns null when unauthenticated", async () => {
    const { userId } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "en", {
      name: "Test",
      dataTemplate: "d",
      questionTemplate: "q",
      answerTemplate: "a",
    });
    const result = await t.query(api.questionTypes.getById, {
      questionTypeId: qtId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns null when question type exists but belongs to another user", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    const qtId = await insertQuestionType(t, userA.userId, "en", {
      name: "A type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    const result = await userB.userSession.query(api.questionTypes.getById, {
      questionTypeId: qtId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns null when language does not match", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "fr", {
      name: "French",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    const result = await userSession.query(api.questionTypes.getById, {
      questionTypeId: qtId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns the question type when authenticated, owner, and language matches", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "en", {
      name: "My type",
      dataTemplate: "data {{x}}",
      questionTemplate: "Q: {{y}}",
      answerTemplate: "A: {{z}}",
    });
    const result = await userSession.query(api.questionTypes.getById, {
      questionTypeId: qtId,
      language: "en",
    });
    expect(result).not.toBeNull();
    expect(result?._id).toBe(qtId);
    expect(result?.name).toBe("My type");
    expect(result?.dataTemplate).toBe("data {{x}}");
    expect(result?.questionTemplate).toBe("Q: {{y}}");
    expect(result?.answerTemplate).toBe("A: {{z}}");
  });
});

describe("questionTypes.create", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("throws when unauthenticated", async () => {
    await expect(
      t.mutation(api.questionTypes.create, {
        language: "en",
        name: "New type",
        dataTemplate: "",
        questionTemplate: "",
        answerTemplate: "",
      }),
    ).rejects.toThrow();
  });

  it("creates question type and returns id when authenticated", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const id = await userSession.mutation(api.questionTypes.create, {
      language: "en",
      name: "New type",
      dataTemplate: "d",
      questionTemplate: "q",
      answerTemplate: "a",
    });
    expect(id).toBeDefined();
    const doc = await t.run(async (ctx) =>
      ctx.db.get("questionTypes", id),
    );
    expect(doc).not.toBeNull();
    expect(doc?.userId).toBe(userId);
    expect(doc?.language).toBe("en");
    expect(doc?.name).toBe("New type");
    expect(doc?.dataTemplate).toBe("d");
    expect(doc?.questionTemplate).toBe("q");
    expect(doc?.answerTemplate).toBe("a");
  });

  it("throws when name is empty", async () => {
    const { userSession } = await createUserAndSession(t);
    await expect(
      userSession.mutation(api.questionTypes.create, {
        language: "en",
        name: "",
        dataTemplate: "",
        questionTemplate: "",
        answerTemplate: "",
      }),
    ).rejects.toThrow();
  });

  it("throws when name is whitespace only", async () => {
    const { userSession } = await createUserAndSession(t);
    await expect(
      userSession.mutation(api.questionTypes.create, {
        language: "en",
        name: "   ",
        dataTemplate: "",
        questionTemplate: "",
        answerTemplate: "",
      }),
    ).rejects.toThrow();
  });
});

describe("questionTypes.update", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("does not update when unauthenticated", async () => {
    const { userId } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "en", {
      name: "Original",
      dataTemplate: "d",
      questionTemplate: "q",
      answerTemplate: "a",
    });
    await expect(
      t.mutation(api.questionTypes.update, {
        questionTypeId: qtId,
        name: "Hacked",
        dataTemplate: "d",
        questionTemplate: "q",
        answerTemplate: "a",
      }),
    ).rejects.toThrow();
    const doc = await t.run(async (ctx) =>
      ctx.db.get("questionTypes", qtId),
    );
    expect(doc?.name).toBe("Original");
  });

  it("does not update when question type belongs to another user", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    const qtId = await insertQuestionType(t, userA.userId, "en", {
      name: "A type",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await expect(
      userB.userSession.mutation(api.questionTypes.update, {
        questionTypeId: qtId,
        name: "Stolen",
        dataTemplate: "",
        questionTemplate: "",
        answerTemplate: "",
      }),
    ).rejects.toThrow();
    const doc = await t.run(async (ctx) =>
      ctx.db.get("questionTypes", qtId),
    );
    expect(doc?.name).toBe("A type");
  });

  it("throws when name is empty", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "en", {
      name: "Original",
      dataTemplate: "",
      questionTemplate: "",
      answerTemplate: "",
    });
    await expect(
      userSession.mutation(api.questionTypes.update, {
        questionTypeId: qtId,
        name: "",
        dataTemplate: "",
        questionTemplate: "",
        answerTemplate: "",
      }),
    ).rejects.toThrow();
    const doc = await t.run(async (ctx) =>
      ctx.db.get("questionTypes", qtId),
    );
    expect(doc?.name).toBe("Original");
  });

  it("succeeds when owner and updates only editable fields", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const qtId = await insertQuestionType(t, userId, "en", {
      name: "Original",
      dataTemplate: "d1",
      questionTemplate: "q1",
      answerTemplate: "a1",
    });
    await userSession.mutation(api.questionTypes.update, {
      questionTypeId: qtId,
      name: "Updated",
      dataTemplate: "d2",
      questionTemplate: "q2",
      answerTemplate: "a2",
    });
    const doc = await t.run(async (ctx) =>
      ctx.db.get("questionTypes", qtId),
    );
    expect(doc?.name).toBe("Updated");
    expect(doc?.dataTemplate).toBe("d2");
    expect(doc?.questionTemplate).toBe("q2");
    expect(doc?.answerTemplate).toBe("a2");
    expect(doc?.userId).toBe(userId);
    expect(doc?.language).toBe("en");
  });
});
