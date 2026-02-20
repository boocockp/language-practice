# Unit tests for Convex functions
_Exported on 20/02/2026 at 11:55:59 GMT from Cursor (2.5.17)_

---

**User**

Please read https://docs.convex.dev/testing/convex-test  and then plan a suite of unit tests for the functions in @convex/words.ts . Ensure that all execution paths are covered.  Test that the results are correctly sorted.  

---

**Cursor**


Reading the Convex words module and checking the project's test setup so we can plan unit tests that cover all execution paths and verify sorting.



Checking the schema and how auth is used so we can plan identity handling in tests.



Checking how Convex Auth stores users and whether we need to seed them in tests:



Checking how Convex Auth's `getAuthUserId` works with the mock so we can plan authenticated tests:



Checking the shape of auth tables so we can plan seeding for authenticated tests:



Checking the Convex `UserIdentity` shape and whether we can pass `subject`:



Creating the plan:


---

**User**

Please implement test 4 with the two locales

---

**Cursor**


Implementing the full test suite with test 4 using two locales (en and sv). Checking the repo and auth table shape so we can add the tests.



Checking the auth tables shape so we can seed a user in tests:


---

**User**

PLease disregard the previous instruction.  To clarify: update the current plan to include test 4 using two different locales

---

**Cursor**


Updating the plan to explicitly include test 4 with two locales (en and sv).



Summary of changes:

1. **Test 4 row**  
   - **Case**: Renamed to “Sort order differs by requested language (two locales)”.  
   - **Setup**: Seed user + identity; insert one set of words (e.g. "äpple", "apple", "zoo") under a single `language`; call the query with `language: "en"` and with `language: "sv"`.  
   - **Assertion**: Result for `"en"` is sorted with `Intl.Collator("en")`, result for `"sv"` with `Intl.Collator("sv")`, and both orders are asserted (with a note that en vs sv can differ for accented letters).

2. **Implementation note**  
   Replaced “Implement 1–3 and 5–6 for sure. For 4, either…” with: implement **all six** tests, and **test 4** must use two locales (`"en"` and `"sv"`), use words that sort differently (e.g. "äpple", "apple", "zoo"), and assert that query results match the order from `new Intl.Collator("en")` and `new Intl.Collator("sv")` respectively.

3. **Order of work**  
   Step 3 now says: “Implement tests 1–6, including test 4 with two locales (en and sv) as above.”

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the plan step by step: checking existing todos and starting work.



Writing the test file with the auth helper and all six tests.



Fixing test 2: we're creating two users and the helper is wrong. Simplifying so we create one user and use that identity.



Fixing test 4: the query uses `language` for both filtering and collation. Inserting the same words with language "en" and "sv" so we can query each and assert different sort orders.



All six tests passed. Running typecheck, lint, and coverage:



Adding the coverage dependency and re-running coverage.



Coverage reports 0% for `words.ts` because convex-test loads Convex code in a way v8 coverage doesn't attribute. Our tests cover both branches (unauthenticated and authenticated). Updating the docs and marking the task complete.



Summary of what was implemented:

**1. Test setup**
- **package.json**: Added devDependencies `convex-test`, `vitest`, `@edge-runtime/vm`, `@vitest/coverage-v8` and scripts `test`, `test:once`, `test:debug`, `test:coverage`.
- **vitest.config.ts**: `environmentMatchGlobs` so `convex/**` uses `edge-runtime` and the rest use `jsdom`; `server.deps.inline: ["convex-test"]`.

**2. Tests in `convex/words.test.ts`**
- **Auth**: Each test that needs a user uses `t.run` to insert into `users` and `authSessions`, then `t.withIdentity({ subject: \`${userId}|${sessionId}\`, ... })` so `getAuthUserId` returns that `userId`.
- **Test 1** — Unauthenticated: no identity → `[]`.
- **Test 2** — Authenticated, no words → `[]`.
- **Test 3** — Authenticated, words sorted by locale: insert "café", "apple", "banana" for `"en"`, assert order matches `Intl.Collator("en")`.
- **Test 4** — Two locales: insert the same set "äpple", "apple", "zoo" for both `"en"` and `"sv"`; query with `language: "en"` and `language: "sv"`; assert order matches `Intl.Collator("en")` and `Intl.Collator("sv")` and that the two orders differ.
- **Test 5** — Language filter: words in `"en"` and `"fr"`; query each language returns only that language’s words.
- **Test 6** — User isolation: user A has words, user B has none; query as B with same language → `[]`.

**3. Commands**
- `npm run typecheck` and `npm run lint` pass.
- `npm run test:once` — all 6 tests pass.
- `npm run test:coverage` — runs (coverage for `convex/words.ts` can show 0% because convex-test loads Convex code in a way v8 doesn’t attribute; all paths are exercised by the tests).

**4. Docs**
- **docs/features/Unit Tests.md**: Added a “Convex function tests” section describing convex-test in `convex/**/*.test.ts` and listing `words.listByUserAndLanguage` as covered.

---

**User**

Please commit changes with a suitable comment

---

**Cursor**


Committed the unit test work with this message:

**Commit `0cce0c2`:** Add unit tests for convex/words.listByUserAndLanguage

- Add Vitest + convex-test + @edge-runtime/vm and test scripts  
- Add `vitest.config.ts` with edge-runtime for `convex/**`  
- Add `convex/words.test.ts`: 6 tests (unauthenticated, authenticated empty/sorted/filtered, two-locale sort en vs sv, user isolation)  
- Update `docs/features/Unit Tests.md` with Convex test coverage  

5 files changed (package.json, package-lock.json, vitest.config.ts, convex/words.test.ts, docs/features/Unit Tests.md).

---

**User**

Please upgrade versions of the following packages to the latest:
convex-test
@edge-runtime/vm

Please upgrade to the most recent versions of the packages, but specify the version number explicitly

---

**Cursor**


Updating package.json to pin exact versions and running npm install:



Summary of changes:

**`package.json`** – versions pinned to exact numbers:
- **convex-test**: `^0.0.14` → `0.0.41`
- **@edge-runtime/vm**: `^4.0.0` → `5.0.0`

`npm install` was run to refresh the lockfile, and `npm run test:once` completed successfully (6 tests passed).

---

**User**

For the code present, we get this error:
```
Property 'glob' does not exist on type 'ImportMeta'.
```
Fix it, verify, and then give a concise explanation. @convex/words.test.ts:5-8 

---

**Cursor**


**Change made:** Added at the top of the file:

```ts
/// <reference types="vite/client" />
```

**Verification:** Lint is clean, `npm run typecheck` passes, and `npm run test:once` (6 tests) passes.

**Why it works:** `import.meta.glob` is provided by Vite, not by standard TypeScript. The default `ImportMeta` type doesn’t include `glob`, so TypeScript reports a type error. The directive `/// <reference types="vite/client" />` pulls in Vite’s type declarations, which extend `ImportMeta` with `glob`, so the type checker recognizes `import.meta.glob` and the error goes away.

---

**User**

Please can you make a number of refactorings in words.test.ts, which I will describe one by one, in order to make the code more compact, reduce duplication and therefore improve maintainability

---

**Cursor**


Understood. I’ll apply the refactors you describe one by one to make `convex/words.test.ts` more compact and easier to maintain.

What’s the first refactor you want to do?

---

**User**

First, move the repeated line `const t = convexTest(schema, modules);` to a top-level variable, initialised in a beforeEach function

---

**Cursor**


Summary of changes:

1. **Imported `beforeEach`** from `"vitest"`.
2. **Declared a suite-level variable**  
   `let t: ReturnType<typeof convexTest>;` inside the `describe` block.
3. **Added a `beforeEach`** that sets `t = convexTest(schema, modules)` before each test.
4. **Removed** the six per-test `const t = convexTest(schema, modules);` lines.

Each test now uses the shared `t` created in `beforeEach`, so every test gets a new Convex test instance and the duplication is gone. Typecheck and all 6 tests pass.

---

**User**

Next, change the data setup part of each test so the user and authSession are in one t.run call, and the words are in another 

---

**Cursor**


Splitting setup so user + authSession are in one `t.run` and word inserts are in a second `t.run`. Returning `userId` from the first run when a test inserts words.



Summary of changes:

- **"returns empty array when authenticated but no words exist"**  
  Unchanged: one `t.run` that creates user + authSession only (no words).

- **"returns words sorted by text for the given locale"**  
  - First `t.run`: create user and authSession, return `{ userId, subject }`.  
  - Second `t.run`: insert the three words using `userId`.

- **"returns different sort order for en vs sv (two locales)"**  
  - First `t.run`: user + authSession, return `{ userId, subject }`.  
  - Second `t.run`: insert words for `"en"` and `"sv"` using `userId`.

- **"filters by language (en vs fr)"**  
  - First `t.run`: user + authSession, return `{ userId, subject }`.  
  - Second `t.run`: insert "hello" (en) and "bonjour" (fr) using `userId`.

- **"returns only the current user's words (user isolation)"**  
  - First `t.run`: create both users and both authSessions, return `{ subjectA, subjectB, userIdA }`.  
  - Second `t.run`: insert the single word for `userIdA` only.

Typecheck and all 6 tests pass.

---

**User**

@convex/words.test.ts:49-57 Extract this into a shared top-level function, and refactor the other tests to use it

---

**Cursor**


Checking the type of `userId` from `ctx.db.insert`:



Summary of changes:

**1. Top-level helper**
- **`createUserAndSession(t)`** – Calls `t.run` to insert a user and an authSession, then returns `{ userId, subject }` (return type is inferred from Convex).

**2. Tests now using it**
- **"returns empty array when authenticated but no words exist"** – `const { subject } = await createUserAndSession(t);`
- **"returns words sorted by text for the given locale"** – `const { userId, subject } = await createUserAndSession(t);` and the words-insert `t.run` is unchanged.
- **"returns different sort order for en vs sv"** – Same pattern with `createUserAndSession(t)`.
- **"filters by language (en vs fr)"** – Same pattern with `createUserAndSession(t)`.
- **"returns only the current user's words (user isolation)"** – Replaced the single two-user `t.run` with two helpers: `const userA = await createUserAndSession(t); const userB = await createUserAndSession(t);`, then the words-insert uses `userA.userId`, and identities use `userA.subject` and `userB.subject`.

Typecheck and all 6 tests pass; lints are clean.

---

**User**

Ok good. @convex/words.test.ts:54-77 extract a function insertWords with arguments for t, userId, language, words . Then refactor the other tests to use this

---

**Cursor**


Adding `insertWords` and refactoring all tests that insert words to use it.



Summary of changes:

**1. `insertWords` helper**
- **Signature:** `insertWords(t, userId, language, words)` with `words: { text: string; meaning: string }[]`.
- **Behavior:** Runs a single `t.run` that inserts one row per entry in `words` (with `pos: "noun"`).
- **Types:** `userId` is `Id<"users">` from `./_generated/dataModel`.

**2. Call sites**
- **"returns words sorted by text for the given locale"** – Replaced the inline `t.run` with `insertWords(t, userId, "en", [{ text: "café", meaning: "cafe" }, ...])`.
- **"returns different sort order for en vs sv"** – `words` is now `{ text, meaning }[]`; `insertWords(t, userId, "en", words)` and `insertWords(t, userId, "sv", words)`; expectations use `texts = words.map(w => w.text)`.
- **"filters by language (en vs fr)"** – Two calls: `insertWords(t, userId, "en", [...])` and `insertWords(t, userId, "fr", [...])`.
- **"returns only the current user's words (user isolation)"** – Replaced the inline `t.run` with `insertWords(t, userA.userId, "en", [{ text: "user-a-word", meaning: "only for A" }])`.

Typecheck and all 6 tests pass; lints are clean.

---

**User**

Everywhere that insertWords is used, the text and meaning of each word are the same.  Please change the words argument of insertWords to be an array of string, and use the same string for both text and meaning in the inserted words record

---

**Cursor**


Summary of changes:

**`insertWords`**
- Fourth parameter type is now `words: string[]` instead of `words: { text: string; meaning: string }[]`.
- Each entry is inserted with that string as both `text` and `meaning`: `text: word`, `meaning: word`.

**Call sites**
- **Sorted locale:** `insertWords(t, userId, "en", ["café", "apple", "banana"])`
- **Two locales:** `words = ["äpple", "apple", "zoo"]`; `insertWords(t, userId, "en", words)` and `insertWords(t, userId, "sv", words)`; expectations use `words` with `sortedByLocale` (no `.map(w => w.text)`).
- **Filter by language:** `insertWords(t, userId, "en", ["hello"])` and `insertWords(t, userId, "fr", ["bonjour"])`
- **User isolation:** `insertWords(t, userA.userId, "en", ["user-a-word"])`

Typecheck and all 6 tests pass.

---

**User**

@convex/words.test.ts:133 this test does not correctly check isolation as there are no words for userB.  PLease change to insert a test word for both users

---

**Cursor**


Summary of changes:

- **Insert words for both users:** `await insertWords(t, userB.userId, "en", ["user-b-word"]);` so both users have one word in `"en"`.
- **Assert both lists:** User A’s list has one word, `"user-a-word"`; user B’s list has one word, `"user-b-word"`. So each user only sees their own word and isolation is checked for both.

All 6 tests pass.

---

**User**

@convex/words.test.ts:127-129 Instead of asserting on the length and individual element(s) of the array, compare the actual with the expected array, using .toEqual.  Refactor wherever this pattern occurs in the test

@convex/words.test.ts:127-129 Replace this with `expect(enResult).toEqual(["hello"])`. Do the same thing wherever the pattern of checking the length and then the individual elements occurs  

---

**Cursor**


Summary of changes:

**"filters by language (en vs fr)"**
- Replaced `toHaveLength(1)` and `expect(...[0].text).toBe(...)` with:
  - `expect(enResult.map((r) => r.text)).toEqual(["hello"])`
  - `expect(frResult.map((r) => r.text)).toEqual(["bonjour"])`

**"returns only the current user's words (user isolation)"**
- Replaced the same pattern with:
  - `expect(aWords.map((r) => r.text)).toEqual(["user-a-word"])`
  - `expect(bWords.map((r) => r.text)).toEqual(["user-b-word"])`

The “returns words sorted…” and “returns different sort order…” tests were already using `.map((r) => r.text)` and `.toEqual(expectedOrder)` / `.toEqual(expectedEn)` etc., so they were left as-is. All 6 tests pass.

---

**User**

@convex/words.test.ts:92-97 Extract a top-level helper function withIdentity.  User the helper wherever this pattern occurs

---

**Cursor**


Summary of changes:

**1. Top-level helper**
- **`withIdentity(t, subject, tokenIdentifier?)`** – Calls `t.withIdentity({ subject, issuer: "https://test", tokenIdentifier })` and returns the result. `tokenIdentifier` defaults to `"test"`.

**2. Use in tests**
- **"returns empty array when authenticated but no words exist"** – `const asUser = withIdentity(t, subject);`
- **"returns words sorted by text for the given locale"** – `const asUser = withIdentity(t, subject);`
- **"returns different sort order for en vs sv"** – `const asUser = withIdentity(t, subject);`
- **"filters by language (en vs fr)"** – `const asUser = withIdentity(t, subject);`
- **"returns only the current user's words (user isolation)"** – `const asUserA = withIdentity(t, userA.subject, "test-a");` and `const asUserB = withIdentity(t, userB.subject, "test-b");`

Typecheck and all 6 tests pass.

---

**User**

@convex/words.test.ts:123 extract a helper function textOf to do this mapping and use it wherever this pattern occurs

---

**Cursor**


Summary of changes:

**1. New helper**
- **`textOf(words)`** – Accepts an array of `{ text: string }[]` and returns `words.map((r) => r.text)`.

**2. Use in tests**
- **"returns words sorted by text for the given locale"** – `expect(textOf(result)).toEqual(expectedOrder)`
- **"returns different sort order for en vs sv"** – `const orderEn = textOf(resultEn);` and `const orderSv = textOf(resultSv);`
- **"filters by language (en vs fr)"** – `expect(textOf(enResult)).toEqual(["hello"])` and `expect(textOf(frResult)).toEqual(["bonjour"])`
- **"returns only the current user's words (user isolation)"** – `expect(textOf(aWords)).toEqual(["user-a-word"])` and `expect(textOf(bWords)).toEqual(["user-b-word"])`

All 6 tests pass.

---

**User**

The subject returned by createUserAndSession is only ever used to pass to asUser.  Refactor so that createUserAndSession calls asUser and returns the result, with the name user, instead of subject.  Then remove the calls to asUser in the individual tests and call .query on the user returned from createUserAndSession

Refactor so that createUserAndSession calls asUser with the subject and returns the result, with the name userSession, in the returned object.

---

**Cursor**


Updating `createUserAndSession` to call `asUser` and include `userSession` in its return value; adding an optional `tokenIdentifier` for the isolation test.



Summary of changes:

**1. `createUserAndSession`**
- Takes an optional second argument: `tokenIdentifier` (default `"test"`).
- Still runs `t.run` to create user and authSession and get `{ userId, subject }`.
- Calls `asUser(t, subject, tokenIdentifier)` and stores the result as `userSession`.
- Returns `{ userId, userSession }` (no longer returns `subject`).

**2. Tests**
- **"returns empty array when authenticated but no words exist"** – Uses `const { userSession } = await createUserAndSession(t)` and `userSession.query(...)`.
- **"returns words sorted by text for the given locale"** – Uses `const { userId, userSession } = await createUserAndSession(t)` and `userSession.query(...)`.
- **"returns different sort order for en vs sv"** – Same pattern with `userSession.query(...)`.
- **"filters by language (en vs fr)"** – Same pattern with `userSession.query(...)`.
- **"returns only the current user's words (user isolation)"** – Uses `const userA = await createUserAndSession(t, "test-a")` and `const userB = await createUserAndSession(t, "test-b")`, then `userA.userSession.query(...)` and `userB.userSession.query(...)`.

Typecheck and all 6 tests pass.

---

**User**

Replace the sortedByLocale calls with the actual result of calling the function as a literal

---

**Cursor**


Verifying sort order produced by Intl.Collator in the test environment:



Summary of changes:

**1. "returns words sorted by text for the given locale"**
- Replaced `const expectedOrder = sortedByLocale("en", ["café", "apple", "banana"]); expect(textOf(result)).toEqual(expectedOrder)` with:
- `expect(textOf(result)).toEqual(["apple", "banana", "café"]);`

**2. "returns different sort order for en vs sv (two locales)"**
- Replaced the `orderEn` / `orderSv` and `expectedEn` / `expectedSv` logic with:
- `expect(textOf(resultEn)).toEqual(["apple", "äpple", "zoo"]);`
- `expect(textOf(resultSv)).toEqual(["apple", "zoo", "äpple"]);`
- Removed the `expect(expectedEn).not.toEqual(expectedSv)` check, since the two literals already differ.

**3. Removed `sortedByLocale`**
- Deleted the `sortedByLocale` helper and its use.

The literal arrays match the sort order from `Intl.Collator("en")` and `Intl.Collator("sv")` (verified with a quick Node run). All 6 tests pass.

