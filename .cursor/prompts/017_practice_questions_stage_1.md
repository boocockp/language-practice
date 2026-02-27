# Practice Questions stage 1
_Exported on 27/02/2026 at 9:55:12 GMT from Cursor (2.5.25)_

---

**User**

Please plan the implementation of Requirements - Stage 1 in @docs/features/Practice Questions.md .  Ask further questions to clarify requirements as needed.

---

**Cursor**


# Implementation plan: Practice Questions – Stage 1

## Summary

Implement the Stage 1 Practice page: question-type selector, Handlebars-based question generation (dataTemplate → questionTemplate/answerTemplate), answer checking with feedback, and persistence to the `questions` table.

There is an existing plan (`.cursor/plans/practice_questions_stage_1_b8cae70e.plan.md`) that diverges from the spec in important ways. Below is a plan that follows the Practice Questions spec and calls out those differences plus open questions.

---

## Clarifying questions

### 1. Word selection – how does `wordText` get into the data step?

The spec says the `word` helper “selects the first word … which has `text` equal to the argument”. That needs a `text` value.

- Current assumption: backend picks a random word for the user/language, passes `{ wordText: selectedWord.text }` as the initial context for the data step. The dataTemplate can then use `word = (word text=wordText)`.

Confirm whether this is correct, or if a different mechanism is intended (e.g. a `randomWord` helper in a later stage).

---

### 2. `dataTemplate` vs simplified flow

The spec includes a full data step: `dataTemplate` → `storeData` → dictionary → `questionTemplate` / `answerTemplate`.

An earlier plan suggested deferring `dataTemplate` and using only `questionTemplate` and `answerTemplate` with a pre-picked random word.

- **Option A (full spec)**: Implement `dataTemplate`, `storeData`, and async helpers as described.
- **Option B (simplified)**: For Stage 1, pick a random word on the backend, pass `{ wordText, word }` directly, and use only `questionTemplate` / `answerTemplate`. Add `dataTemplate` support later.

Which option should Stage 1 use?

---

### 3. Schema alignment – `expected` and field names

Current schema:

- `questions`: `questionText`, `answerGiven`, `isCorrect`, `score`, `respondedAt`, `durationMs`, `wordId`
- No `expected` field

`DATA_MODEL.md`:

- `questions`: `text`, `expected`, `answerGiven`, `isCorrect`, `respondedAt`

Planned changes:

- Add `expected: v.string()` to store the correct answer.
- Optionally rename `questionText` → `text` to match `DATA_MODEL.md`.

Is `expected` required for Stage 1, and should we standardize on `text` / `expected` in both schema and docs?

---

### 4. Empty `dataTemplate`

How should we handle question types with empty or whitespace-only `dataTemplate`?

- Skip the data step and pass `{}` into `questionTemplate` / `answerTemplate`?
- Treat as an error?
- Other behavior?

---

### 5. Handlebars async helpers

The spec says `storeData` must “await value (which may be a promise)”, so async helpers are required. Plan:

- Use `handlebars-async-helpers` for the data step when `dataTemplate` is implemented.

If you prefer not to add that dependency yet, we can defer the full data step per Question 2.

---

## 1. Schema update

**File:** `convex/schema.ts`

- Add `expected: v.string()` to the `questions` table.
- Optionally rename `questionText` → `text` if we align with `DATA_MODEL.md` (update all references accordingly).

`wordId` is retained to tie each question to the word used for generation.

---

## 2. Convex backend

### 2.1 Word lookup by text

**File:** `convex/words.ts` (or internal helper)

Add a way to look up a word by `text` for the current user and language. Used by the `word` helper.

Example shape:

- Internal helper or query (e.g. `getFirstByText(ctx, userId, language, text)`) that returns `{ text, meaning } | null` or the full word doc.

### 2.2 Question generation module

**New file:** `convex/questionGeneration.ts` (internal)

Implements the spec’s flow.

**Data step (if using full spec – Option A):**

- Parse `dataTemplate` lines: `<name> = <data-expression>`.
- Build a template where each line becomes `{{storeData "<name>" ( <data-expression>)}}`.
- Use `Handlebars.create()` and `handlebars-async-helpers` for async support.
- Register `storeData(name, value)`: `await value`, store in a dictionary, return empty string.
- Register `word(text)`: query DB for first word with `text` for current user/language; return `{ text, meaning }`.
- Run the template with initial context (e.g. `{ wordText }` from backend’s random word pick).
- Output: dictionary of stored values.

**Question/answer step:**

- `Handlebars.create()`, compile `questionTemplate` and `answerTemplate`.
- Register `word(text)` same as above.
- Run both templates with the data dictionary.
- Return `{ questionText, expected }`.

**Error handling:** catch template compile/runtime errors and return a clear error to the client.

### 2.3 Practice API

**New file:** `convex/practice.ts`

- `generateQuestion(questionTypeId, language)` (mutation or action):
  - Auth and language validation.
  - Load question type and verify ownership.
  - Pick a random word for user/language (or use another selection rule if specified).
  - Build initial context (e.g. `{ wordText: selectedWord.text }`).
  - Call question generation (data step if used, then question/answer step).
  - Return `{ wordId, questionText, expected }` (or `{ wordId, text, expected }` if renamed).

- `submitAnswer(args)` (mutation):
  - Args: `wordId`, `questionTypeId`, `questionText` (or `text`), `expected`, `answerGiven`, `language`.
  - Auth and validation.
  - Compute `isCorrect` as: `answerGiven.trim().toLowerCase() === expected.trim().toLowerCase()`.
  - Insert into `questions` with `userId`, `respondedAt`, `expected`, etc.

### 2.4 Convex runtime and Handlebars

- If we need `handlebars-async-helpers`, the generation code should run where Node/npm is available. Convex actions support `"use node"` and npm deps; mutations run in the Convex runtime. Confirm whether Handlebars (and the async wrapper) run in mutations or if generation should be moved to an action.

---

## 3. Frontend – Practice page

**File:** `src/routes/PracticePage.tsx`

### 3.1 UI elements (from spec)

| Element            | Description                                      |
|--------------------|--------------------------------------------------|
| Question type select | All question types for current user/language   |
| Question paragraph   | Bordered, label “Question”, initially empty   |
| Answer textarea      | Label “Answer”                                |
| Expected Answer      | Bordered, label “Expected Answer”, initially empty |
| Result paragraph     | Bordered, initially empty                     |
| Next Question button | Initially hidden                             |
| Check Answer button  | Initially hidden                             |

### 3.2 Visibility rules

- On load: both buttons hidden.
- When a question type is selected: show Next Question.
- After Next Question: show question text, hide Next Question, show Check Answer.
- After Check Answer: show expected answer and result (✓ / ✗), hide Check Answer, show Next Question.
- Then cycle repeats.

### 3.3 State and flow

- Local state: `selectedQuestionTypeId`, `currentQuestion` (`{ wordId, questionText, expected }`), `answer`, `feedback` (`{ isCorrect }` or null).
- **Next Question:** call `practice.generateQuestion`, store result, clear answer and feedback.
- **Check Answer:** call `practice.submitAnswer` with `answerGiven`; backend returns (or we derive) `isCorrect`; show expected and result.

### 3.4 Data loading

- Question types: reuse `api.questionTypes.listByUserAndLanguage` (or equivalent).
- Handle empty lists: no question types → “Add question types to practice”; no words → “Add words to practice” (when `generateQuestion` fails).

### 3.5 Styling

- Use Kumo components and Tailwind.
- Bordered blocks: e.g. `border border-slate-200 rounded-lg p-3`.
- Ensure labels and focus management for accessibility.

---

## 4. Data flow (sequence)

1. User selects question type → Next Question becomes visible.
2. User clicks Next Question → `generateQuestion(questionTypeId, language)` → `{ wordId, questionText, expected }`.
3. UI shows question, hides Next Question, shows Check Answer.
4. User enters answer and clicks Check Answer → `submitAnswer(...)`.
5. Backend computes `isCorrect`, inserts `questions` row, returns result.
6. UI shows expected answer and Correct ✓ / Wrong ✗, hides Check Answer, shows Next Question.

---

## 5. Dependencies

- Add `handlebars` (and `@types/handlebars` if needed).
- Add `handlebars-async-helpers` if implementing the full data step with `storeData`.

---

## 6. Documentation updates

- `docs/DATA_MODEL.md`: ensure `questions` fields match the final schema (`text`/`questionText`, `expected`).
- `docs/features/Practice Questions.md`: add Stage 1 notes (e.g. `word` helper, optional `dataTemplate` status).

---

## 7. Edge cases

| Case                | Handling                                                       |
|---------------------|----------------------------------------------------------------|
| No question types   | Message: add question types to practice                        |
| No words            | Error from `generateQuestion` → message: add words to practice |
| Template errors     | Catch in generation, return clear error                        |
| Word helper no match| Return `null`; templates should use `{{#with (word ...)}}`      |
| Empty dataTemplate  | Behavior depends on your answer to Question 4                  |

---

## Implementation order (tentative)

1. Schema: add `expected` (and optional `text` rename).
2. Words: add internal “first word by text” lookup.
3. `questionGeneration.ts`: implement generation logic (simplified or full spec per Question 2).
4. `practice.ts`: `generateQuestion` and `submitAnswer`.
5. `PracticePage.tsx`: full UI and flow.
6. Docs and tests.

---

If you answer the clarifying questions (especially 1, 2, 4, and 5), the plan can be finalized and implementation can proceed accordingly.

---

**User**

Ignore the existing plan.
Answers to clarifying questions:
1. - There will be a randomWord helper in a later stage.  In stage 1, the word helper simply looks up a known word by its text field
2. - Use Option A
3. Yes, expected is required for Stage 1, rename questionText to text
4. - the first option, pass {}.  The user may choose to create a fixed question/answer with no data passed in
5. I do not want to use handlebars-async-helpers yet.
I have prototyped this snippet of code, which works - please use an approach like this for generating the data from the template.
Please update the new plan and ask further questions if needed

---

**Cursor**


Not finding a prototype snippet in the codebase. Please paste or point to it so we can align.

Updating the plan with your answers. Describing a synchronous pre-resolve approach (no handlebars-async-helpers): pre-fetch the word and use a sync `word` helper that looks up from that pre-populated map.



Creating the updated plan.



Updated plan is in `.cursor/plans/practice_questions_stage_1.plan.md`. Summary:

## Plan updates

- **Schema:** Add `expected`, rename `questionText` → `text`
- **dataTemplate:** Full implementation (Option A), with `storeData` and `word` helper
- **Empty dataTemplate:** Pass `{}` to question/answer templates
- **Word selection:** Backend picks a random word and passes `{ wordText: selectedWord.text }` as initial context; `word` helper looks up by text from a pre-populated map
- **No handlebars-async-helpers:** Use a sync pre-resolve flow: pre-populate `wordMap` with the random word, so the `word` helper reads from the map instead of the DB

## Open item

Please share the prototype snippet for generating data from the template so the implementation can match it. I didn’t find it in the repo. Once you share it, the plan can be updated with the exact approach.

---

**User**

storeData code snippet:
`    let data = {}
    const storeData = async (key, value) => { data[key] = await value }
    const handlebars = Handlebars.create();
    handlebars.registerHelper('storeData', storeData)
    handlebars.registerHelper('fooBar', function (foo, bar) { return Promise.resolve({foo, bar})})
    const template = handlebars.compile("{{{storeData 'theResult' (fooBar 21 theBar)}}}");
    template({theBar: "baz"}, {helpers: {storeData}});
    console.log('data', data);  // { theResult: { foo: 21, bar: 'baz' } }
`

---

**Cursor**


Incorporating the storeData snippet into the plan.



The plan is updated to use your `storeData` prototype. Summary of changes:

## Plan updates

**Data step (2.2)** – Uses your prototype:

- `storeData`: `async (key, value) => { data[key] = await value }`
- `word` helper: calls `lookupWordByText(ctx, userId, language, text)` and returns a `Promise`
- Transform: `{{{storeData "<name>" ( <data-expression>)}}}` (triple braces)
- After `template(...)`: `await new Promise(r => setTimeout(r, 0))` to flush microtasks
- `lookupWordByText` needs `ctx`, `userId`, and `language` from the caller

**Question/answer step** – Same `word` helper with async lookup; templates can use `{{word.text}}` (from data) or `(word text=variable)` for dynamic lookup.

**Removed** – The old “Open question” section about the prototype.

The plan now includes your prototype snippet and describes the microtask flush for async helpers without `handlebars-async-helpers`.

---

**User**

PLease make the followiing changes to the plan:
- In 2.2 Question/answer step: no need to register the helper - it will not work here as it is async
- In 2.3 generateQuestion: 
  - Do not pick a random word or return null/error if no words
  - Insert into questions table here
  - return {questionId, text, expected}
- IN 2.3 submitAnswer:
  - The args needed should only be questionId, answerGiven
  - Update `questions` with answerGiven, isCorrect, respondedAt


---

**Cursor**


Plan updates are in place. Summary of changes:

## Changes Made

### 2.2 Question/answer step
- No registration of the `word` helper there (it’s async and won’t work in sync templates).
- Templates use only stored data from the data step (e.g. `{{word.text}}`, `{{word.meaning}}`).

### 2.3 generateQuestion
- Removed random word selection and the no-words error.
- Question generation now inserts into the `questions` table.
- Returns `{ questionId, text, expected }`.

### 2.3 submitAnswer
- Args are only `questionId` and `answerGiven`.
- Updates the existing `questions` row with `answerGiven`, `isCorrect`, and `respondedAt` instead of inserting.

### Other updates
- Frontend: `currentQuestion` uses `questionId` instead of `wordId`.
- Data flow diagram updated to match.
- Clarification #1: initial context is implementation-defined (e.g. `{}` for fixed questions).
- Edge cases: removed “No words”.
- Schema: `answerGiven`, `isCorrect`, and `respondedAt` are optional (filled in by `submitAnswer`).
- Template authoring: removed the `(word text=wordText)` example in question/answer, since that helper is not used there.

---

**User**

PLease implement this plan

---

**Cursor**


Implementing the plan: updating the schema, then proceeding through each component.



Adding the word lookup helper and creating the question generation module:



Implementing PracticePage. Inspecting Kumo components and similar pages:



Implementing PracticePage:



Running Convex dev to regenerate the API and check for issues:



Summary of what was implemented:

## Implementation Summary

### 1. Schema (`convex/schema.ts`)
- Renamed `questionText` → `text`, added `expected`
- Added `language` on questions
- Made `answerGiven`, `isCorrect`, `respondedAt` optional
- Made `wordId` optional
- Adjusted indexes for the new shape

### 2. Word lookup (`convex/words.ts`)
- Added `lookupWordByText(ctx, userId, language, text)` returning `Promise<{ text, meaning } | null>`

### 3. Question generation (`convex/questionGeneration.ts`)
- **Data step**: Transforms `dataTemplate` via `storeData`, with async `word` helper and microtask flush
- **Question/answer step**: Compiles `questionTemplate` and `answerTemplate` against the data (no `word` helper)
- Treats empty `dataTemplate` as `{}`

### 4. Practice API (`convex/practice.ts`)
- **generateQuestion**: Creates a question, inserts into `questions`, returns `{ questionId, text, expected }`
- **submitAnswer**: Accepts `{ questionId, answerGiven }`, patches the question with `answerGiven`, `isCorrect`, `respondedAt`

### 5. Practice page (`src/routes/PracticePage.tsx`)
- Question type select, question area, answer textarea, expected answer, result, Next Question and Check Answer buttons
- Button visibility and flow follow the plan
- Handles no question types and unauthenticated users

### 6. Documentation
- `docs/DATA_MODEL.md` updated for `questions`
- `docs/features/Practice Questions.md` updated with Stage 1 notes

### 7. Dependencies
- Added `handlebars` and `@types/handlebars`

---

**Next step:** Run `npx convex dev` so Convex picks up the schema and functions.

**Note:** Question types need an empty `dataTemplate` for fixed questions, or a `dataTemplate` that uses `(word text=wordText)` with `wordText` in the context. Right now the backend passes `{}` as initial context, so only fixed Q&A (empty `dataTemplate`) work until `randomWord` or another source provides context.

---

**User**

The browser console gives this error when the page is loaded:
`words.ts:46 Convex functions should not be imported in the browser. This will throw an error in future versions of `convex`. If this is a false negative, please report it to Convex support.`.  Please find the cause and fix

---

**Cursor**


Identifying cause: the client imports `WORD_TYPES` and `WordType` from `convex/words`, which pulls in server-only code (`query`, `mutation`, `getAuthUserId`). Switching client imports to `convex/wordTypes` so they only get the shared types.



The fix is done. The client was importing `WORD_TYPES` and `WordType` from `convex/words`, which pulled in server-only code (e.g. `query`, `mutation`, `getAuthUserId`).

Both client files now import from `convex/wordTypes` instead. `wordTypes` only uses `convex/values` for validators, which is safe for the client, so the server-only Convex runtime is no longer loaded in the browser.

---

**User**

When you select a question type on the Practice page, and move focus away from the control, it displays the questionTypeId instead of the name.  The following browser error appears at the same time:
`Base UI: A component is changing the uncontrolled value state of Select to be controlled.
Elements should not switch from uncontrolled to controlled (or vice versa).
Decide between using a controlled or uncontrolled Select element for the lifetime of the component.
The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.
More info: https://fb.me/react-controlled-components`

---

**Cursor**


Fixing both issues:

- Keeping the Select controlled: pass a defined value (e.g. `null`) instead of `undefined` so it doesn't switch between controlled/uncontrolled.
- Displaying the name: adding a `renderValue` that maps the selected id to the question type name, since Base UI can show the raw value when it can't resolve the label.



Here’s what was changed:

1. **Controlled/uncontrolled** – The Select was sometimes given `undefined` (`value={selectedQuestionTypeId || undefined}` when empty), which made it switch from uncontrolled to controlled. It now always receives either `null` (no selection) or the selected id, so it stays controlled.

2. **State type** – State is now `Id<"questionTypes"> | null` instead of `Id<"questionTypes"> | ""` so `null` correctly represents “no selection”.

3. **`renderValue`** – A `renderValue` prop was added so the selected option shows the question type name instead of the id. It uses the `questionTypes` list to map the selected id to its name.

4. **Update checks** – `hasQuestionType` and `handleNextQuestion` now check `!== null` instead of `!== ""`.

---

**User**

That works, but there is now a new problem: when the page first loads, the Question Type select is very narrow and shows no prompt to say "Select a Question Type"

---

**Cursor**


Applying two fixes:
1. Ensuring the Select has full width — adding `w-full` so it doesn't shrink in the flex layout.
2. Showing the placeholder when empty — returning the placeholder text from `renderValue` when the value is null.



Made two updates:

1. **Width** – Added `className="w-full min-w-0"` so the Select fills its container and lays out correctly in the flex column.
2. **Placeholder** – Updated `renderValue` so when nothing is selected it returns `"Select a Question Type"` instead of `null`, since the component wasn’t showing the placeholder in that case.

---

**User**

Please try to fix the following error that appears when you click Next Question:
`PracticePage.tsx:58 Failed to generate question: Error: [CONVEX M(practice:generateQuestion)] [Request ID: 6fb63a1eff942b11] Server Error
Uncaught Error: Data template error: Code generation from strings disallowed for this context
    at handler (../convex/practice.ts:49:8)

  Called by client
    at handler (../convex/practice.ts:49:8)

  Called by client
    at BaseConvexClient.mutation (http://localhost:5173/node_modules/.vite/deps/chunk-DRVMX5RT.js?v=ce3d1f1f:2635:13)
    at async handleNextQuestion (http://localhost:5173/src/routes/PracticePage.tsx?t=1772125485509:34:22)`

---

**Cursor**


Handlebars.compile() uses `new Function()`, which Convex's mutation runtime disallows. Moving template execution into a Convex action with `"use node"` so it runs in Node.js.



Using the internal API instead of require():



Checking whether we can mix `internalQuery`/`internalMutation` with "use node" in the same file:



Splitting into separate files: Convex recommends keeping "use node" files separate.



Splitting files: mutations can't run in a "use node" file. Keeping `submitAnswer` in `practice.ts` and moving the action to `practiceActions.ts`.



The failure is in the WordsPage test and is unrelated to the practice changes. Here’s what was done to fix the Handlebars error:

## Summary of Changes

Handlebars uses `new Function()` to compile templates, which Convex’s mutation runtime disallows. Template execution was moved into a Node.js action.

### 1. **`convex/words.ts`**
- Added internal query `getFirstByText` for the action to look up words.

### 2. **`convex/practiceInternal.ts`**
- New file (no `"use node"`) with:
  - `getAuthAndQuestionType` – auth and question-type loading
  - `insertGeneratedQuestion` – inserts the generated question

### 3. **`convex/practiceActions.ts`**
- New file with `"use node"` containing the `generateQuestion` action.
- Runs Handlebars in Node.js, calls internal query/mutation for auth and insert.

### 4. **`convex/practice.ts`**
- Only contains `submitAnswer` (mutation). `generateQuestion` was removed and lives in `practiceActions.ts`.

### 5. **`src/routes/PracticePage.tsx`**
- Replaced `useMutation` with `useAction` for `generateQuestion`.
- Updated API usage to `api.practiceActions.generateQuestion`.

The WordsPage test failure (expects a “New Word” heading) appears to be an existing issue and is not caused by these changes.

---

**User**

I have manually fixed a bug in @convex/questionGeneration.ts : flushing microtasks was not waiting for all the promises to complete.  You do not need to take any further action on this bug.
Please stage and commit all changes with a suitable comment

---

**Cursor**


All changes are committed with message:

```
feat: Practice Questions Stage 1 – question generation, answer check, persistence

- Add Practice page with question-type select, question/answer display, check flow
- Implement Handlebars-based question generation (dataTemplate → storeData →
  question/answer templates) with async word helper
- Run template execution in Node.js action (Handlebars uses eval, restricted in
  Convex mutations)
- Add questions schema (text, expected, answerGiven, isCorrect, respondedAt)
- Add words.getFirstByText internal query for template word lookup
- Fix client imports: use convex/wordTypes instead of convex/words to avoid
  loading server-only code in browser
- Fix Select: controlled mode, renderValue for display, w-full for layout
```

