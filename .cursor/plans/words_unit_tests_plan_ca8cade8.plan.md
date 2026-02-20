---
name: Words unit tests plan
overview: "Add Vitest and convex-test, then implement a test suite for convex/words.ts that covers the single query listByUserAndLanguage: unauthenticated (empty), authenticated with no words, authenticated with words and correct locale-based sorting, and cross-user isolation."
todos: []
isProject: false
---

# Unit tests for convex/words.ts

## Scope

- **Target**: [convex/words.ts](convex/words.ts) — single query `listByUserAndLanguage`.
- **Execution paths to cover**:
  1. **Unauthenticated**: `getAuthUserId(ctx)` returns `null` → handler returns `[]`.
  2. **Authenticated, no words**: userId present, index query returns no docs → return `[]`.
  3. **Authenticated, with words**: query returns docs → sort by `Intl.Collator(language).compare(a.text, b.text)` → return sorted docs.
- **Sorting**: Assert that returned order is correct for the requested `language` (locale-sensitive sort).
- **Isolation**: Second user does not see the first user’s words.

No Vitest or convex-test is present today ([package.json](package.json) has no test deps; no `*.test.ts` or `vitest.config.`* in repo).

---

## 1. Test setup (convex-test + Vitest)

- **Install**: `convex-test`, `vitest`, `@edge-runtime/vm` as devDependencies.
- **Scripts** in `package.json`: `test`, `test:once`, `test:debug`, `test:coverage` (per [convex-test get started](https://docs.convex.dev/testing/convex-test)).
- **Config**: Add `vitest.config.ts` at repo root:
  - Use `edge-runtime` for Convex tests: `environmentMatchGlobs: [["convex/**", "edge-runtime"], ["**", "jsdom"]]` so only `convex/`** uses edge-runtime.
  - `server.deps.inline: ["convex-test"]`.
- **Modules for convex-test**: In the new test file, pass `convexTest(schema, modules)` with `modules = import.meta.glob("./**/*.ts")` so the Convex loader can resolve all functions (including auth) used by `words.ts`.

---

## 2. Auth in tests

`listByUserAndLanguage` uses `getAuthUserId(ctx)` from `@convex-dev/auth/server`, which does:

```ts
const identity = await ctx.auth.getUserIdentity();
if (identity === null) return null;
const [userId] = identity.subject.split("|");
return userId as Id<"users">;
```

So the mock identity’s `subject` must be `userId|sessionId` and the `userId` must exist in the `users` table.

- **Unauthenticated**: Call `t.query(api.words.listByUserAndLanguage, { language: "en" })` without `withIdentity` → expect `[]`.
- **Authenticated**: Create a user and an identity that resolves to that user:
  1. Use `t.run` to insert a row into `users` (schema from `authTables` in [convex/schema.ts](convex/schema.ts); match the shape expected by `@convex-dev/auth`).
  2. Get the returned `userId` and build `subject =` ${userId}|${sessionId}`` (sessionId can be any non-empty string for the mock).
  3. Use `t.withIdentity({ subject, issuer: "...", tokenIdentifier: "..." })` so `getAuthUserId` returns that `userId`.
  4. Seed words with `t.run` (insert into `words` with that `userId`, plus `language`, `text`, `pos`, `meaning`, etc. per schema).
  5. Call `asUser.query(api.words.listByUserAndLanguage, { language })` and assert.

If the auth package’s `users` table shape is not trivial, use the auth skill or existing auth mutations to see the exact fields; otherwise derive from `authTables` and the schema.

---

## 3. Test cases (convex/words.test.ts)


| #   | Case                                                   | Setup                                                                                                                                                                                      | Assertion                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Unauthenticated returns empty                          | `t = convexTest(schema, modules)`, no identity                                                                                                                                             | `t.query(api.words.listByUserAndLanguage, { language: "en" })` → `[]`                                                                                                                                                                                   |
| 2   | Authenticated, no words                                | Seed user + identity, no words                                                                                                                                                             | `asUser.query(..., { language: "en" })` → `[]`                                                                                                                                                                                                          |
| 3   | Authenticated, words sorted by text (locale)           | Seed user + identity, insert several words with different `text` (e.g. "café", "apple", "banana") for one `language`                                                                       | Same language query returns docs in `Intl.Collator(language).compare` order (e.g. for "en": apple, banana, café); use `expect(result.map(r => r.text)).toEqual([...])`                                                                                  |
| 4   | Sort order differs by requested language (two locales) | Seed user + identity. Insert the same set of words (e.g. "äpple", "apple", "zoo") for one `language` tag. Call the query twice: once with `language: "en"` and once with `language: "sv"`. | Result for `language: "en"` is sorted by `new Intl.Collator("en").compare`; result for `language: "sv"` is sorted by `new Intl.Collator("sv").compare`. Assert both orders (e.g. expected order for en vs sv can differ for accented letters like å/ä). |
| 5   | Filter by language                                     | Same user, insert words for `language: "en"` and `language: "fr"`                                                                                                                          | `listByUserAndLanguage({ language: "en" })` returns only English words; `language: "fr"` only French                                                                                                                                                    |
| 6   | User isolation                                         | User A: seed user A + words. User B: seed user B, no words (or different words).                                                                                                           | Query as User B with same `language` as A → no docs (or only B’s docs)                                                                                                                                                                                  |


Implement all six tests. **Test 4** must use two distinct locales (e.g. `"en"` and `"sv"`): insert words that sort differently under each locale (e.g. "äpple", "apple", "zoo"—Swedish often sorts Å/Ä/Ö after Z, while English may treat accented characters differently). Compute expected order in the test with `new Intl.Collator("en")` and `new Intl.Collator("sv")` and assert the query results match each locale’s order.

---

## 4. Coverage and docs

- Run `npm run test:once` and `npm run test:coverage`; ensure `convex/words.ts` is fully covered (both branches: `userId === null` and the rest).
- Update [docs/features/Unit Tests.md](docs/features/Unit Tests.md) to mention that Convex functions are tested with convex-test in `convex/**/*.test.ts` and list `words.listByUserAndLanguage` as covered.

---

## 5. Files to add/change

- **New**: `vitest.config.ts` (root).
- **New**: `convex/words.test.ts` (test file with `modules = import.meta.glob("./**/*.ts")` and all cases above).
- **Edit**: `package.json` (devDependencies + scripts).
- **Edit**: `docs/features/Unit Tests.md` (note Convex tests and words coverage).

---

## 6. Order of work

1. Add devDependencies and scripts; add `vitest.config.ts`.
2. Implement authenticated test helper (seed user + identity, return `asUser` and `userId`).
3. Implement tests 1–6, including test 4 with two locales (en and sv) as above.
4. Run typecheck/lint and fix; run coverage and confirm full path coverage for `words.ts`.
5. Update `docs/features/Unit Tests.md`.

