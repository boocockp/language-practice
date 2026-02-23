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
