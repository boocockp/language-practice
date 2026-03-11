---
name: Practice Sessions Unit Tests
overview: "Add unit tests for the Practice Sessions feature: Convex backend (sessions.getWithQuestions, sessions.endSession, sessionsActions.generateSession; practiceActions.generateQuestion with sessionId), shared PracticeQuestionBlock component, PracticeSessionPage (three states and flows), and AppLayout nav entry for Practice Session."
todos: []
isProject: false
---

# Practice Sessions Unit Tests

## Scope

Cover new and changed code from the Practice Sessions implementation:

- **Convex**: `sessions.getWithQuestions`, `sessions.endSession`, `sessionsActions.generateSession`; `practiceActions.generateQuestion` with optional `sessionId`.
- **Frontend**: `PracticeQuestionBlock`, `PracticeSessionPage`, AppLayout "Practice Session" nav/hamburger.

Follow existing patterns: Convex tests use `convex-test` + vitest ([convex/sessionTypes.test.ts](convex/sessionTypes.test.ts), [convex/practice.test.ts](convex/practice.test.ts)); React tests use Testing Library, mocked Convex hooks ([src/routes/PracticePage.test.tsx](src/routes/PracticePage.test.tsx)), and test-utils ([src/test-utils.tsx](src/test-utils.tsx)).

---

## 1. Convex: `convex/sessions.test.ts`

New file. Reuse the same setup as [convex/sessionTypes.test.ts](convex/sessionTypes.test.ts): `convexTest(schema, modules)`, `createUserAndSession`, `asUser`, and helpers `insertQuestionType`, `insertSessionType`. Add helpers:

- `**insertSession(t, userId, language, sessionTypeId)`**: `t.run` to insert into `sessions`, return `Id<"sessions">`.
- `**insertQuestionWithSession(t, userId, questionTypeId, language, sessionId, text, expected, opts?)`**: `t.run` to insert into `questions` with optional `sessionId`, `answerGiven`, `isCorrect`, `respondedAt` for endSession tests.

### 1.1 `sessions.getWithQuestions` (query)

- **Returns null when unauthenticated**: Insert session + questions via helpers, call `t.query(api.sessions.getWithQuestions, { sessionId, language })`, expect `null`.
- **Returns null when session belongs to another user**: Two users; session owned by A; B calls getWithQuestions with A’s sessionId; expect `null`.
- **Returns null when language does not match**: Session for `language: "en"`; call with `language: "fr"`; expect `null`.
- **Returns session and questions ordered by _creationTime**: One session, two questions inserted with small time gap or explicit ordering; expect result has `session` (userId, language, sessionTypeId, numberCorrect optional) and `questions` array with correct length and order (by _creationTime).
- **Returns only session’s questions**: Insert two sessions, each with one question; call getWithQuestions for first session; expect `questions.length === 1` and question belongs to that session.

### 1.2 `sessions.endSession` (mutation)

- **Throws when unauthenticated**: Insert session, call `t.mutation(api.sessions.endSession, { sessionId })`, expect throw (e.g. "Unauthorized").
- **Throws when session belongs to another user**: Two users, session owned by A; B calls endSession; expect throw (e.g. "Session not found or access denied").
- **Patches numberCorrect from questions**: Insert session, insert 3 questions with that sessionId, set two with `isCorrect: true` and one `isCorrect: false` (and `respondedAt` set). Call endSession as owner. Reload session via `t.run`; expect `numberCorrect === 2`.
- **Idempotent / no-op when no questions**: Insert session, no questions; call endSession; session has `numberCorrect` undefined or 0 (per schema). Expect patch succeeds and `numberCorrect === 0` (or undefined if that’s how it’s stored).

### 1.3 `sessionsActions.generateSession` (action)

- **Returns null when unauthenticated**: Insert session type (with one question type, count 1), call `t.action(api.sessionsActions.generateSession, { sessionTypeId, language: "en" })`, expect `null`.
- **Returns null when session type belongs to another user**: Two users; session type owned by A; B calls generateSession; expect `null`.
- **Creates session and questions with sessionId when authorized**: One user, one question type (minimal: empty dataTemplate, static question/answer templates), one session type with that question type and count 1. Call `userSession.action(api.sessionsActions.generateSession, { sessionTypeId, language: "en" })`. Expect result `{ sessionId, questionIds }` with one questionId. Via `t.run`, load session and question: session has correct userId, language, sessionTypeId; question has `sessionId === result.sessionId`, correct text/expected. (Mirrors [convex/practice.test.ts](convex/practice.test.ts) “generates question with empty dataTemplate” style.)
- **Integration: generateSession with multiple questions**: Session type with one question type and **count 2** (or two items in `questions` array, e.g. same question type count 1 twice). Call generateSession as owner. Expect result has `questionIds.length === 2`. Via `t.run`, load both questions: each has same `sessionId`, and order of `questionIds` matches `_creationTime` order. Optionally assert getWithQuestions returns the same two questions in that order.

---

## 2. Convex: `practiceActions.generateQuestion` with `sessionId`

In [convex/practice.test.ts](convex/practice.test.ts), add one test:

- **Stores sessionId on question when sessionId is provided**: Create user, session type, and **session** (via `t.run` insert into `sessions`). Create question type (empty dataTemplate). Call `userSession.action(api.practiceActions.generateQuestion, { questionTypeId, language: "en", sessionId })`. Load inserted question; expect `question.sessionId === sessionId`. Ensures the public API passes sessionId through to `insertGeneratedQuestion`.

---

## 3. Frontend: `PracticeQuestionBlock`

New file [src/components/PracticeQuestionBlock.test.tsx](src/components/PracticeQuestionBlock.test.tsx). No Convex; test props and callbacks.

- **Renders question text, answer textarea, labels**: Pass `questionText="Q?"`, `expectedAnswer="A"`, `answer=""`, `feedback={ null }`. Expect "Question" label, content "Q?", "Answer" label, "Expected Answer" and "Result" labels.
- **Shows Check Answer button when feedback is null**: Same props; expect button "Check answer".
- **Hides Check Answer and shows expected answer and Correct when feedback is set**: `feedback={{ isCorrect: true }}`, `expectedAnswer="yes"`. Expect no Check Answer button, expected answer text "yes", "Correct" (and icon if present).
- **Shows Wrong when feedback.isCorrect is false**: `feedback={{ isCorrect: false }}`; expect "Wrong".
- **Calls onCheckAnswer when Check Answer is clicked**: `onCheckAnswer` mock; click button; expect mock called once.
- **Calls onAnswerChange when typing in answer**: `onAnswerChange` mock; type in textarea; expect mock called with typed value.
- **Check Answer disabled when checkAnswerDisabled is true**: `checkAnswerDisabled={ true }`; expect button disabled.
- **Renders children (action slot)**: Pass `children={<button>Next</button>`; expect "Next" button in document.
- **Answer textarea disabled when answerDisabled is true**: `answerDisabled={ true }`; expect textarea disabled.

Use simple `render(<PracticeQuestionBlock ... />)` with necessary props; no router/auth unless a child needs it.

---

## 4. Frontend: `PracticeSessionPage`

New file [src/routes/PracticeSessionPage.test.tsx](src/routes/PracticeSessionPage.test.tsx). Mirror [src/routes/PracticePage.test.tsx](src/routes/PracticePage.test.tsx): mock `useQuery`, `useAction`, `useMutation`; wrap in `LinkProvider`, `MemoryRouter` (initial entry `/practice/session`), `CurrentLanguageProvider`, `AuthContext.Provider`; use [src/test-utils](src/test-utils.tsx) patterns where useful.

Mock data:

- **Session types**: list of `{ _id, name }` (e.g. "Daily drill").
- **getWithQuestions**: when `sessionId` is used, return `{ session: { _id, userId, language, sessionTypeId, numberCorrect }, questions: [{ _id, text, expected, answerGiven, isCorrect, respondedAt }, ...] }`.

Tests:

- **Loading**: `useQuery` for session types returns `undefined`; expect "Loading…" and aria-busy.
- **Unauthenticated**: `user: null`; expect "Log in to practice" (or similar empty state).
- **No session types**: session types `[]`; expect "No session types yet" (or similar).
- **Initial: session type select, Start disabled until selection, instruction**: With session types loaded; expect combobox "Session Type", button "Start" disabled, text "Choose a session type and click Start". After selecting a session type, expect Start enabled.
- **Start calls generateSession**: Select session type, click Start; expect `generateSession` called with `{ sessionTypeId, language, userLanguage: expect.any(String) }`.
- **Running: after Start, shows Question n of N, Score, Stop**: Mock generateSession to resolve with `{ sessionId, questionIds }`; mock getWithQuestions to return session + one question. Trigger Start; expect "Question 1 of 1", "Score 0", button "Stop", and question text in the block.
- **Check Answer and submitAnswer**: In running state, type answer, click Check answer; expect `submitAnswer` called with `{ questionId, answerGiven }`.
- **Next advances to next question**: Mock getWithQuestions with two questions; after answering first (submitAnswer + SET_FEEDBACK), click Next; expect second question text (or "Question 2 of 2").
- **Continue on last question calls endSession and shows ended state**: One question, after check show "Continue", click Continue; expect `endSession` called with `{ sessionId }` and summary (e.g. "You answered 1 question", "1 correct", percentage).
- **Stop calls endSession and shows ended state**: In running state, click Stop; expect `endSession` called and summary shown (e.g. "You answered 0 questions" if none answered).
- **Ended: summary content**: After end, expect summary shows answered count, correct count, and percentage (or "—" when 0).

Use `vi.mocked(useQuery).mockImplementation(...)` to return different values per call (session types vs getWithQuestions) if both are used in one test.

---

## 5. Frontend: AppLayout – Practice Session nav

In [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx):

- **Nav bar (large viewport)**: With `mdMatches = true`, expect a link with name "Practice Session" (`getByRole("link", { name: "Practice Session" })`) that has `href` or navigates to `/practice/session`. Optional: click it and assert outlet shows practice session content (requires adding `path="practice/session"` and a placeholder or real page in [src/test-utils.tsx](src/test-utils.tsx) `appLayoutRoutes` with `data-testid="practice-session-page"`).
- **Hamburger (small viewport)**: With `mdMatches = false`, open menu, expect "Practice Session" in menu; click it and assert navigation to practice session page (same route addition in test-utils).

Minimal approach: add to test-utils `appLayoutRoutes` a route `path="practice/session"` with element `<div data-testid="practice-session-page">Practice Session page</div>`, then in AppLayout tests assert link exists and, on click, `getByTestId("practice-session-page")` is in the document.

---

## 6. Optional / follow-up

- **PracticePage still works with PracticeQuestionBlock**: Existing [src/routes/PracticePage.test.tsx](src/routes/PracticePage.test.tsx) already covers flow; no new tests required unless a regression appears.

---

## Implementation order

1. Add Convex test helpers and `convex/sessions.test.ts` (getWithQuestions, endSession, generateSession).
2. Add test in `convex/practice.test.ts` for generateQuestion with sessionId.
3. Add `src/components/PracticeQuestionBlock.test.tsx`.
4. Add `src/routes/PracticeSessionPage.test.tsx` (mocks and state/flow tests).
5. Extend test-utils with practice/session route; add AppLayout tests for Practice Session link and hamburger.
6. Run `pnpm run test -- --run` and fix any failures; ensure `pnpm run check` still passes.

