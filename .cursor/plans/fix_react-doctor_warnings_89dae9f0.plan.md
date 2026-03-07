---
name: Fix react-doctor warnings
overview: Address the three react-doctor warnings by refactoring multiple useState to useReducer in WordDetailsForm, QuestionTypeDetailsForm, and PracticePage, and by removing the "reset on open" useEffect in LoginModal via a key-based remount in the parent.
todos: []
isProject: false
---

# Fix react-doctor reported issues

**Source:** [terminals/10.txt:168-180](file:///Users/paul/.cursor/projects/Users-paul-dev-language-practice/terminals/10.txt) — three warnings:

1. **WordDetailsForm** (and similar components): 6 useState calls — consider useReducer for related state.
2. **LoginModal**: 3 setState calls in a single useEffect — consider useReducer or deriving state.
3. **LoginModal**: useEffect simulating an event handler — move logic to an actual event handler.

---

## 1. LoginModal — remove reset useEffect (fixes warnings 2 and 3)

**Problem:** A `useEffect` runs when `open` becomes true and resets `error`, `step`, and `isSubmitting`. React-doctor flags both “multiple setState in useEffect” and “useEffect simulating an event handler”.

**Approach:** Avoid the effect by resetting state on open via remount. Have the parent pass a `key` so the modal content remounts when `open` toggles; initial state is then correct without any useEffect.

**Changes:**

- **[src/app/AppLayout.tsx](src/app/AppLayout.tsx)**  
Where `<LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />` is rendered (~line 168), add:
`key={loginModalOpen ? "open" : "closed"}`  
so when the user opens the modal, the component instance is new and `step` / `error` / `isSubmitting` start at their initial values.
- **[src/features/auth/LoginModal.tsx](src/features/auth/LoginModal.tsx)**  
Remove the entire `useEffect` that depends on `open` and resets `setError(null)`, `setStep("signIn")`, `setIsSubmitting(false)` (lines 16–22). Remove the `useEffect` import if it becomes unused.

No useReducer needed in LoginModal; the three useState remain for the single instance’s lifecycle.

---

## 2. WordDetailsForm — useReducer for form + UI state

**Problem:** Six `useState` calls: `text`, `type`, `meaning`, `tags`, `isSubmitting`, `showDiscardConfirm`.

**Approach:** One `useReducer` holding all of that state, with actions for field updates, submit toggle, and discard-dialog visibility. Keep `pendingLeaveResolveRef` and the `confirmLeave` / effect logic as-is; only the state shape and setters change.

**Changes in [src/features/words/WordDetailsForm.tsx](src/features/words/WordDetailsForm.tsx):**

- Define state type and initial state, e.g.:
  - `type WordFormState = { text: string; type: WordType; meaning: string; tags: string; isSubmitting: boolean; showDiscardConfirm: boolean }`
  - Initial state derived from `word ?? NEW_WORD_DEFAULTS` (must be computed inside the component or via a function that takes `word`).
- Define action type: e.g. `SET_FIELD` (payload: partial fields), `SET_SUBMITTING`, `SHOW_DISCARD_CONFIRM`, and optionally `RESET` (for when `word` prop changes, if you want to sync — current code does not reset fields when `word` changes, so RESET may be out of scope).
- Replace the six `useState` calls with `useReducer(reducer, initialValues)` (or a lazy init if initial depends on `word`).
- In the reducer, handle each action and return new state; for `SET_FIELD`, merge payload into state.
- Update JSX: `setText` → `dispatch({ type: 'SET_FIELD', payload: { text: e.target.value } })`, and similarly for type, meaning, tags. `setIsSubmitting(true/false)` → `dispatch({ type: 'SET_SUBMITTING', payload: true/false })`. `setShowDiscardConfirm` → `dispatch({ type: 'SHOW_DISCARD_CONFIRM', payload: true/false })`.
- Keep `formValuesEqual(current, initial)` using state from the reducer; `current` = state, `initial` = derived from `word ?? NEW_WORD_DEFAULTS` (same as now).
- **Sync state when `word` changes:** If the form should reflect a new `word` when the prop changes (e.g. user selects another word), either dispatch a `RESET` from a `useEffect` that depends on `word`, or use a key on the form from the parent so it remounts. Current code does not sync when `word` changes; preserve that behavior unless you explicitly add it.

---

## 3. QuestionTypeDetailsForm — useReducer (same pattern as WordDetailsForm)

**Problem:** Six `useState`: `name`, `dataTemplate`, `questionTemplate`, `answerTemplate`, `isSubmitting`, `showDiscardConfirm`.

**Approach:** Same as WordDetailsForm. One `useReducer` with state type and actions (`SET_FIELD` for the four form fields, `SET_SUBMITTING`, `SHOW_DISCARD_CONFIRM`). Replace all six useState with reducer state and dispatch. Keep `pendingLeaveResolveRef`, `confirmLeave`, and the two useEffects unchanged.

**Changes in [src/features/questionTypes/QuestionTypeDetailsForm.tsx](src/features/questionTypes/QuestionTypeDetailsForm.tsx):** Mirror the WordDetailsForm refactor: reducer, single initial state from `questionType ?? NEW_QUESTION_TYPE_DEFAULTS`, dispatch in handlers and for dialog open/close.

---

## 4. PracticePage — useReducer for practice flow state

**Problem:** Five `useState`: `selectedQuestionTypeId`, `currentQuestion`, `answer`, `feedback`, `isGenerating`.

**Approach:** One `useReducer` for the practice UI state. Actions can be: `SELECT_QUESTION_TYPE`, `SET_CURRENT_QUESTION`, `SET_ANSWER`, `SET_FEEDBACK`, `SET_GENERATING`. Handlers (`handleNextQuestion`, `handleCheckAnswer`, and the Select’s `onValueChange`) dispatch instead of calling multiple setters.

**Changes in [src/routes/PracticePage.tsx](src/routes/PracticePage.tsx):**

- Define state type (e.g. `PracticeState`) and action union; initial state: all null/false/empty as today.
- Replace the five `useState` with `useReducer`.
- In `handleNextQuestion`: dispatch `SET_GENERATING(true)`, then after the action result dispatch `SET_CURRENT_QUESTION`, `SET_ANSWER("")`, `SET_FEEDBACK(null)`, and `SET_GENERATING(false)` (or a single composite action if you prefer).
- In `handleCheckAnswer`: dispatch `SET_FEEDBACK({ isCorrect })` after submit.
- Select: `onValueChange` dispatches `SELECT_QUESTION_TYPE`.
- Derive `hasQuestionType`, `hasCurrentQuestion`, `showNextButton`, `showCheckButton` from reducer state (same logic as now).

---

## Verification

- Run `pnpm run doctor` (or `pnpm run doctor:verbose`) and confirm the three warnings are gone.
- Run `pnpm run typecheck` and `pnpm run lint`.
- Manually test: open/close login modal (state resets when reopened); edit and save/discard in Word and Question Type forms; run through practice flow (select type, next question, answer, check).

---

## Order of implementation

1. **LoginModal + AppLayout** — smallest change, fixes two warnings.
2. **WordDetailsForm** — useReducer refactor.
3. **QuestionTypeDetailsForm** — useReducer refactor (can reuse pattern from WordDetailsForm).
4. **PracticePage** — useReducer refactor.

Implementing in this order keeps each step independently testable and avoids big-bang changes.