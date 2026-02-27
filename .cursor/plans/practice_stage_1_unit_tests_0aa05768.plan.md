---
name: Practice Stage 1 Unit Tests
overview: "Add unit tests to cover the Practice Questions Stage 1 implementation: question generation logic, submitAnswer mutation, words.getFirstByText internal query, practice action (or fallback), PracticePage UI, and verify existing WordDetailsForm/WordsTable tests still pass after the convex/wordTypes import change."
todos: []
isProject: false
---

# Practice Questions Stage 1 – Unit Test Plan

## Scope

Cover all changes from the Stage 1 commit: question generation, practice mutations/actions, word lookup, schema, Practice page UI, and the `convex/wordTypes` import fix in `WordDetailsForm` and `WordsTable`.

---

## 1. questionGeneration.ts – Direct unit tests (new file)

**File:** `convex/questionGeneration.test.ts`  
**Approach:** Test the pure TypeScript module directly. No Convex runtime, no `"use node"`; runs in Vitest with default environment. Uses `import { generateQuestion, transformDataTemplate }` (export `transformDataTemplate` if needed for edge-case tests, or test via `generateQuestion` only).

**Test cases:**


| Case                            | Description                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty dataTemplate**          | `dataTemplate: ""` → passes `{}` to question/answer step; `questionTemplate: "Q"`, `answerTemplate: "A"` → returns `{ text: "Q", expected: "A" }`.                                       |
| **dataTemplate with literal**   | `dataTemplate: "x = hello"` (transforms to storeData), `questionTemplate: "{{x}}"`, `answerTemplate: "{{x}}"` → `{ text: "hello", expected: "hello" }`.                                  |
| **word helper**                 | `dataTemplate` with `word = (word text="chat")`, mock `lookupWord` returns `{ text: "chat", meaning: "cat" }`, question/answer use `{{word.text}}`, `{{word.meaning}}` → correct output. |
| **word helper returns null**    | `lookupWord` returns null → template may output nothing; assert behavior (e.g. empty or handled).                                                                                        |
| **dataTemplate transformation** | `"name = value"` → `{{{storeData "name" (value)}}}`; verify multiple lines, blank lines ignored, malformed lines left as-is.                                                             |
| **Template compile error**      | Invalid Handlebars in questionTemplate → throws with clear message.                                                                                                                      |
| **Template runtime error**      | Valid syntax but missing variable → assert error handling.                                                                                                                               |


**Pattern:** Mock `lookupWord: (text) => Promise.resolve(...)` in params.

---

## 2. practice.submitAnswer – Convex mutation tests

**File:** `convex/practice.test.ts` (new)  
**Approach:** Use `convexTest` with `@vitest-environment edge-runtime`, same pattern as [convex/words.test.ts](convex/words.test.ts). Reuse `createUserAndSession`, `insertQuestionType`-style helpers; add helper to insert a question via `t.run` or `internal.practiceInternal.insertGeneratedQuestion`.

**Test cases:**


| Case                                  | Description                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Unauthenticated**                   | Throws.                                                                                                  |
| **Question not found / wrong user**   | Question owned by user A, call as user B → throws.                                                       |
| **Correct answer (exact match)**      | `answerGiven: "hello"`, `expected: "hello"` → `isCorrect: true`, `answerGiven` and `respondedAt` stored. |
| **Correct answer (trim)**             | `answerGiven: " hello "`, `expected: "hello"` → `isCorrect: true`.                                       |
| **Correct answer (case-insensitive)** | `answerGiven: "HELLO"`, `expected: "hello"` → `isCorrect: true`.                                         |
| **Wrong answer**                      | `answerGiven: "wrong"`, `expected: "right"` → `isCorrect: false`.                                        |


---

## 3. words.getFirstByText – Internal query tests

**File:** Extend [convex/words.test.ts](convex/words.test.ts) (or add `convex/words.integration.test.ts`)  
**Approach:** Call `t.query(internal.words.getFirstByText, { userId, language, text })` after inserting a word via `t.run`. No auth needed for internal query.

**Test cases:**


| Case                               | Description                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Returns word when found**        | Insert word `{ text: "hello", meaning: "hi" }` for user+language → getFirstByText returns `{ text: "hello", meaning: "hi" }`. |
| **Returns null when no match**     | No word with given text → null.                                                                                               |
| **Filters by userId and language** | Word exists for user A / en; query for user B or different language → null.                                                   |


---

## 4. practiceActions.generateQuestion – Action tests (conditional)

**File:** `convex/practice.test.ts`  
**Approach:** Call `t.action(api.practiceActions.generateQuestion, { questionTypeId, language })` with authenticated session, question type, and optionally words. The action uses `"use node"` and Handlebars; convex-test typically runs in edge-runtime.

**Strategy:**

- **Try first:** Run action test in existing setup. If it passes (e.g. convex-test or Vitest supports Node actions), keep it.
- **If it fails:** Document limitation; rely on (1) `questionGeneration` unit tests and (5) PracticePage with mocked `useAction` for coverage.

**Test cases (if action runs):**


| Case                                                       | Description                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Returns null when unauthenticated**                      | No identity → null.                                                                                                                |
| **Returns null when question type not found / wrong user** | QT owned by another user → null.                                                                                                   |
| **Generates question with empty dataTemplate**             | QT with empty dataTemplate, question/answer templates using literals → inserts question, returns `{ questionId, text, expected }`. |
| **Generates question with word helper**                    | QT with dataTemplate `word = (word text="chat")`, word "chat" in DB → question text and expected use word data.                    |


---

## 5. PracticePage – React component tests

**File:** `src/routes/PracticePage.test.tsx` (new)  
**Approach:** Same as [src/routes/QuestionTypesPage.test.tsx](src/routes/QuestionTypesPage.test.tsx): mock `useQuery`, `useMutation`, `useAction`, render with `AuthContext`, `CurrentLanguageProvider`, `MemoryRouter`. Use `@vitest-environment jsdom`.

**Mocks:**

- `useQuery(api.questionTypes.listByUserAndLanguage)` → list of question types or `[]`.
- `useAction(api.practiceActions.generateQuestion)` → mock that returns `{ questionId, text, expected }`.
- `useMutation(api.practice.submitAnswer)` → mock that resolves.

**Test cases:**


| Case                                                | Description                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Loading state**                                   | `useQuery` returns `undefined` → "Loading…" (or `aria-busy`).                                      |
| **Unauthenticated**                                 | `user: null` → "Log in to practice" empty state.                                                   |
| **No question types**                               | `questionTypes: []` → "No question types yet" / "Add question types...".                           |
| **Question type select shows Next Question**        | Question types exist, user selects one → Next Question button visible.                             |
| **Next Question triggers generateQuestion**         | Click Next Question → `useAction` called with `questionTypeId`, `language`.                        |
| **After generate, shows question and Check Answer** | After mock returns question → question text displayed, Check Answer visible, Next Question hidden. |
| **Check Answer triggers submitAnswer**              | Enter answer, click Check Answer → `useMutation` called with `questionId`, `answerGiven`.          |
| **After check, shows expected and result**          | After submit → Expected Answer and Result (Correct/Wrong) shown, Next Question visible again.      |
| **Check Answer disabled when answer empty**         | No input → Check Answer disabled.                                                                  |
| **Select renderValue**                              | Select shows question type name when `selectedQuestionTypeId` is set.                              |


---

## 6. WordDetailsForm and WordsTable – Regression

**Files:** [src/features/words/WordDetailsForm.test.tsx](src/features/words/WordDetailsForm.test.tsx), [src/features/words/WordsTable.test.tsx](src/features/words/WordsTable.test.tsx)

**Change in commit:** Import switched from `convex/words` to `convex/wordTypes` for `WORD_TYPES` and `WordType`. Tests do not import `convex/words`; they mock or pass props. No test changes expected.

**Action:** Run `npm run test:once` to confirm existing tests still pass. If any fail due to the import change, add a minimal fix (e.g. ensure `wordTypes` is resolvable in tests).

---

## 7. Vitest configuration

**File:** [vitest.config.ts](vitest.config.ts)

- Convex tests use `// @vitest-environment edge-runtime` in-file. Ensure `convex/**/*.test.ts` runs in edge-runtime (either via directive or `environmentMatchGlobs` if present).
- `questionGeneration.test.ts` should run in an environment where Handlebars works. Default `jsdom` or `node` is fine; keep it outside `convex/` if we want to avoid edge-runtime for it, **or** put it in `convex/` and rely on the directive—Handlebars is plain JS and should run in edge-runtime. Prefer `convex/questionGeneration.test.ts` with `@vitest-environment edge-runtime` for consistency, unless Handlebars fails there (then move to `src/` or use `node` env).

---

## 8. Documentation

**File:** [docs/TESTING.md](docs/TESTING.md)

- Add bullet: Practice flow (generateQuestion, submitAnswer) tested via convex-test and `questionGeneration` unit tests.
- Note any limitation for `practiceActions.generateQuestion` if action tests are skipped due to `"use node"`.

---

## File summary


| Action | File                                                                                         |
| ------ | -------------------------------------------------------------------------------------------- |
| Create | `convex/questionGeneration.test.ts` – template logic, empty/literal/word helper, errors      |
| Create | `convex/practice.test.ts` – submitAnswer mutation, optionally generateQuestion action        |
| Extend | `convex/words.test.ts` – getFirstByText internal query                                       |
| Create | `src/routes/PracticePage.test.tsx` – Practice page UI and flow                               |
| Update | `vitest.config.ts` – only if environment adjustment needed for questionGeneration or actions |
| Update | `docs/TESTING.md` – mention Practice tests                                                   |


---

## Execution order

1. Add `questionGeneration.test.ts` (no Convex deps).
2. Add `practice.test.ts` with `submitAnswer` tests.
3. Add `getFirstByText` tests to `words.test.ts`.
4. Add `PracticePage.test.tsx`.
5. Optionally try `generateQuestion` action tests; document if skipped.
6. Run full suite; fix any regressions.
7. Update `docs/TESTING.md`.

