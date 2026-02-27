// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
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
        type: "nf",
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
    type: "nf" | "nm" | "nmf" | "vtr" | "vi" | "adj" | "adv";
    meaning: string;
    tags?: string;
  },
): Promise<Id<"words">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("words", {
      userId,
      language,
      text: word.text,
      type: word.type,
      meaning: word.meaning,
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
      type: "nf",
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
      type: "nf",
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
      type: "nf",
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
      type: "vtr",
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
    expect(result?.type).toBe("vtr");
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
      type: "nf",
      meaning: "first",
    });
    await expect(
      t.mutation(api.words.update, {
        wordId,
        text: "hacked",
        type: "nf",
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
      type: "nf",
      meaning: "only for A",
    });
    await expect(
      userB.userSession.mutation(api.words.update, {
        wordId,
        text: "stolen",
        type: "nf",
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
      type: "nf",
      meaning: "first",
    });
    await expect(
      userSession.mutation(api.words.update, {
        wordId,
        text: "",
        type: "nf",
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
      type: "nf",
      meaning: "first",
    });
    await expect(
      userSession.mutation(api.words.update, {
        wordId,
        text: "   ",
        type: "nf",
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
      type: "nm",
      meaning: "first",
      tags: "old",
    });
    await userSession.mutation(api.words.update, {
      wordId,
      text: "updated",
      type: "nf",
      meaning: "second",
      tags: "new",
    });
    const word = await t.run(async (ctx) => ctx.db.get("words", wordId));
    expect(word?.text).toBe("updated");
    expect(word?.type).toBe("nf");
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
        type: "nf",
        meaning: "hi",
      }),
    ).rejects.toThrow();
  });

  it("creates word and returns id when authenticated", async () => {
    const { userId, userSession } = await createUserAndSession(t);
    const id = await userSession.mutation(api.words.create, {
      language: "en",
      text: "hello",
      type: "nf",
      meaning: "greeting",
      tags: "basic",
    });
    expect(id).toBeDefined();
    const word = await t.run(async (ctx) => ctx.db.get("words", id));
    expect(word).not.toBeNull();
    expect(word?.userId).toBe(userId);
    expect(word?.language).toBe("en");
    expect(word?.text).toBe("hello");
    expect(word?.type).toBe("nf");
    expect(word?.meaning).toBe("greeting");
    expect(word?.tags).toBe("basic");
  });

  it("throws when text is empty", async () => {
    const { userSession } = await createUserAndSession(t);
    await expect(
      userSession.mutation(api.words.create, {
        language: "en",
        text: "",
        type: "nf",
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
        type: "nf",
        meaning: "nothing",
      }),
    ).rejects.toThrow();
  });
});

describe("words.getFirstByText (internal)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns word when found for user and language", async () => {
    const { userId } = await createUserAndSession(t);
    await insertWords(t, userId, "en", ["hello"]);
    const result = await t.query(internal.words.getFirstByText, {
      userId,
      language: "en",
      text: "hello",
    });
    expect(result).toEqual({ text: "hello", meaning: "hello" });
  });

  it("returns null when no word matches text", async () => {
    const { userId } = await createUserAndSession(t);
    await insertWords(t, userId, "en", ["apple"]);
    const result = await t.query(internal.words.getFirstByText, {
      userId,
      language: "en",
      text: "banana",
    });
    expect(result).toBeNull();
  });

  it("returns null when word exists for different user or language", async () => {
    const userA = await createUserAndSession(t, "a");
    const userB = await createUserAndSession(t, "b");
    await insertWords(t, userA.userId, "en", ["hello"]);
    const resultUserB = await t.query(internal.words.getFirstByText, {
      userId: userB.userId,
      language: "en",
      text: "hello",
    });
    expect(resultUserB).toBeNull();

    await insertWords(t, userA.userId, "fr", ["bonjour"]);
    const resultWrongLang = await t.query(internal.words.getFirstByText, {
      userId: userA.userId,
      language: "en",
      text: "bonjour",
    });
    expect(resultWrongLang).toBeNull();
  });
});

describe("words.getRandomByCriteria (internal)", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("returns word matching text (single value)", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "chat",
      type: "nm",
      meaning: "cat",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      text: "chat",
    });
    expect(result).toEqual({ _id: wordId, text: "chat", meaning: "cat" });
  });

  it("returns word matching text (comma-separated list)", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "chaise",
      type: "nf",
      meaning: "chair",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      text: "chat,chaise,table",
    });
    expect(result).toEqual({ _id: wordId, text: "chaise", meaning: "chair" });
  });

  it("returns word matching type (single)", async () => {
    const { userId } = await createUserAndSession(t);
    const chienId = await insertWord(t, userId, "en", {
      text: "chien",
      type: "nm",
      meaning: "dog",
    });
    await insertWord(t, userId, "en", {
      text: "maison",
      type: "nf",
      meaning: "house",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      type: "nm",
    });
    expect(result).toEqual({ _id: chienId, text: "chien", meaning: "dog" });
  });

  it("returns word matching type (comma-separated list)", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "livre",
      type: "nm",
      meaning: "book",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      type: "nm,nf",
    });
    expect(result).toEqual({ _id: wordId, text: "livre", meaning: "book" });
  });

  it("returns word matching tags (one group)", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "animal",
      type: "nm",
      meaning: "animal",
      tags: "noun vocabulary",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      tags: "noun",
    });
    expect(result).toEqual({
      _id: wordId,
      text: "animal",
      meaning: "animal",
    });
  });

  it("returns word matching tags (AND across groups)", async () => {
    const { userId } = await createUserAndSession(t);
    const matchId = await insertWord(t, userId, "en", {
      text: "match",
      type: "nm",
      meaning: "match",
      tags: "abc ghi xyz",
    });
    await insertWord(t, userId, "en", {
      text: "nomatch",
      type: "nm",
      meaning: "nomatch",
      tags: "ghi pqr",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      tags: "abc&ghi,jkl",
    });
    expect(result).toEqual({
      _id: matchId,
      text: "match",
      meaning: "match",
    });
  });

  it("returns null when tags do not match (missing tag from one group)", async () => {
    const { userId } = await createUserAndSession(t);
    await insertWord(t, userId, "en", {
      text: "nomatch",
      type: "nm",
      meaning: "nomatch",
      tags: "ghi pqr",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      tags: "abc&ghi,jkl",
    });
    expect(result).toBeNull();
  });

  it("returns one of user words when no options provided", async () => {
    const { userId } = await createUserAndSession(t);
    const wordId = await insertWord(t, userId, "en", {
      text: "hello",
      type: "nf",
      meaning: "hi",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
    });
    expect(result).toEqual({ _id: wordId, text: "hello", meaning: "hi" });
  });

  it("returns null when no matches", async () => {
    const { userId } = await createUserAndSession(t);
    await insertWord(t, userId, "en", {
      text: "apple",
      type: "nf",
      meaning: "fruit",
    });
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
      text: "banana",
    });
    expect(result).toBeNull();
  });

  it("returns null when no words exist for user", async () => {
    const { userId } = await createUserAndSession(t);
    const result = await t.action(internal.words.getRandomByCriteria, {
      userId,
      language: "en",
    });
    expect(result).toBeNull();
  });

  it("can return different words when multiple match (random selection)", async () => {
    const { userId } = await createUserAndSession(t);
    await insertWord(t, userId, "en", {
      text: "a",
      type: "nm",
      meaning: "first",
    });
    await insertWord(t, userId, "en", {
      text: "b",
      type: "nm",
      meaning: "second",
    });
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = await t.action(internal.words.getRandomByCriteria, {
        userId,
        language: "en",
        type: "nm",
      });
      expect(result).not.toBeNull();
      results.add(result!.text);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
