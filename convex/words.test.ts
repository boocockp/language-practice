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

async function insertWords(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  language: string,
  words: string[],
) {
  await t.run(async (ctx) => {
    for (const word of words) {
      await ctx.db.insert("words", {
        userId,
        language,
        text: word,
        pos: "noun",
        meaning: word,
      });
    }
  });
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

function textOf(words: { text: string }[]): string[] {
  return words.map((r) => r.text);
}

describe("words.listByUserAndLanguage", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns empty array when unauthenticated", async () => {
    const result = await t.query(api.words.listByUserAndLanguage, {
      language: "en",
    });
    expect(result).toEqual([]);
  });

  it("returns empty array when authenticated but no words exist", async () => {
    const { userSession } = await createUserAndSession(t);
    const result = await userSession.query(api.words.listByUserAndLanguage, {
      language: "en",
    });
    expect(result).toEqual([]);
  });

  it("returns words sorted by text for the given locale", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    await insertWords(t, userId, "en", ["café", "apple", "banana"]);
    const result = await userSession.query(api.words.listByUserAndLanguage, {
      language: "en",
    });
    expect(textOf(result)).toEqual(["apple", "banana", "café"]);
  });

  it("returns different sort order for en vs sv (two locales)", async () => {
    const words = ["äpple", "apple", "zoo"];
    const { userId, userSession } = await createUserAndSession(t);
    await insertWords(t, userId, "en", words);
    await insertWords(t, userId, "sv", words);
    const resultEn = await userSession.query(api.words.listByUserAndLanguage, {
      language: "en",
    });
    const resultSv = await userSession.query(api.words.listByUserAndLanguage, {
      language: "sv",
    });
    expect(textOf(resultEn)).toEqual(["apple", "äpple", "zoo"]);
    expect(textOf(resultSv)).toEqual(["apple", "zoo", "äpple"]);
  });

  it("filters by language (en vs fr)", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    await insertWords(t, userId, "en", ["hello"]);
    await insertWords(t, userId, "fr", ["bonjour"]);
    const enResult = await userSession.query(api.words.listByUserAndLanguage, {
      language: "en",
    });
    const frResult = await userSession.query(api.words.listByUserAndLanguage, {
      language: "fr",
    });
    expect(textOf(enResult)).toEqual(["hello"]);
    expect(textOf(frResult)).toEqual(["bonjour"]);
  });

  it("returns only the current user's words (user isolation)", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    await insertWords(t, userA.userId, "en", ["user-a-word"]);
    await insertWords(t, userB.userId, "en", ["user-b-word"]);
    const aWords = await userA.userSession.query(
      api.words.listByUserAndLanguage,
      { language: "en" },
    );
    const bWords = await userB.userSession.query(
      api.words.listByUserAndLanguage,
      { language: "en" },
    );
    expect(textOf(aWords)).toEqual(["user-a-word"]);
    expect(textOf(bWords)).toEqual(["user-b-word"]);
  });
});

async function insertWord(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  language: string,
  word: {
    text: string;
    pos: "noun" | "verb" | "adjective";
    gender?: "M" | "F" | "N";
    meaning: string;
    tags?: string;
  },
): Promise<Id<"words">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("words", {
      userId,
      language,
      text: word.text,
      pos: word.pos,
      meaning: word.meaning,
      ...(word.gender !== undefined && { gender: word.gender }),
      ...(word.tags !== undefined && { tags: word.tags }),
    });
  });
}

describe("words.getById", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns null when unauthenticated", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "hello",
      pos: "noun",
      meaning: "hi",
    });
    const result = await t.query(api.words.getById, {
      wordId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns null when word exists but belongs to another user", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    const wordId = await insertWord(t, userA.userId, "en", {
      text: "user-a-word",
      pos: "noun",
      meaning: "only for A",
    });
    const result = await userB.userSession.query(api.words.getById, {
      wordId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns null when word exists and is owned but language does not match", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "fr", {
      text: "bonjour",
      pos: "noun",
      meaning: "hello",
    });
    const result = await userSession.query(api.words.getById, {
      wordId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("returns the word when authenticated, owner, and language matches", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "hello",
      pos: "verb",
      gender: "M",
      meaning: "to greet",
      tags: "greeting",
    });
    const result = await userSession.query(api.words.getById, {
      wordId,
      language: "en",
    });
    expect(result).not.toBeNull();
    expect(result?._id).toBe(wordId);
    expect(result?.text).toBe("hello");
    expect(result?.pos).toBe("verb");
    expect(result?.gender).toBe("M");
    expect(result?.meaning).toBe("to greet");
    expect(result?.tags).toBe("greeting");
  });
});

describe("words.update", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("does not update when unauthenticated", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "original",
      pos: "noun",
      meaning: "first",
    });
    await expect(
      t.mutation(api.words.update, {
        wordId,
        text: "hacked",
        pos: "noun",
        meaning: "first",
      }),
    ).rejects.toThrow();
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("original");
  });

  it("does not update when word belongs to another user", async () => {
    const userA = await createUserAndSession(t, "test-a");
    const userB = await createUserAndSession(t, "test-b");
    const wordId = await insertWord(t, userA.userId, "en", {
      text: "user-a-word",
      pos: "noun",
      meaning: "only for A",
    });
    await expect(
      userB.userSession.mutation(api.words.update, {
        wordId,
        text: "stolen",
        pos: "noun",
        meaning: "only for A",
      }),
    ).rejects.toThrow();
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("user-a-word");
  });

  it("throws when text is empty", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "original",
      pos: "noun",
      meaning: "first",
    });
    await expect(
      userSession.mutation(api.words.update, {
        wordId,
        text: "",
        pos: "noun",
        meaning: "first",
      }),
    ).rejects.toThrow();
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("original");
  });

  it("throws when text is whitespace only", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "original",
      pos: "noun",
      meaning: "first",
    });
    await expect(
      userSession.mutation(api.words.update, {
        wordId,
        text: "   ",
        pos: "noun",
        meaning: "first",
      }),
    ).rejects.toThrow();
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("original");
  });

  it("succeeds when owner and updates only editable fields", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "original",
      pos: "noun",
      gender: "M",
      meaning: "first",
      tags: "old",
    });
    await userSession.mutation(api.words.update, {
      wordId,
      text: "updated",
      pos: "verb",
      gender: "F",
      meaning: "second",
      tags: "new",
    });
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("updated");
    expect(word?.pos).toBe("verb");
    expect(word?.gender).toBe("F");
    expect(word?.meaning).toBe("second");
    expect(word?.tags).toBe("new");
    expect(word?.userId).toBe(userId);
    expect(word?.language).toBe("en");
  });
});

describe("words.create", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("throws when unauthenticated", async () => {
    await expect(
      t.mutation(api.words.create, {
        language: "en",
        text: "hello",
        pos: "noun",
        meaning: "hi",
      }),
    ).rejects.toThrow();
  });

  it("creates word and returns id when authenticated", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const id = await userSession.mutation(api.words.create, {
      language: "en",
      text: "hello",
      pos: "noun",
      meaning: "greeting",
      tags: "basic",
    });
    expect(id).toBeDefined();
    const word = await t.run(async (ctx) => ctx.db.get("words", id));
    expect(word).not.toBeNull();
    expect(word?.userId).toBe(userId);
    expect(word?.language).toBe("en");
    expect(word?.text).toBe("hello");
    expect(word?.pos).toBe("noun");
    expect(word?.meaning).toBe("greeting");
    expect(word?.tags).toBe("basic");
  });

  it("throws when text is empty", async () => {
    const { userSession } = await createUserAndSession(t);
    await expect(
      userSession.mutation(api.words.create, {
        language: "en",
        text: "",
        pos: "noun",
        meaning: "nothing",
      }),
    ).rejects.toThrow();
  });

  it("throws when text is whitespace only", async () => {
    const { userSession } = await createUserAndSession(t);
    await expect(
      userSession.mutation(api.words.create, {
        language: "en",
        text: "   ",
        pos: "noun",
        meaning: "nothing",
      }),
    ).rejects.toThrow();
  });
});
