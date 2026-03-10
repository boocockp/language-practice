# Chat transcript: Save-or-discard leave confirmation dialog

## 1. Implement the plan

**User:** Implement the plan as specified (save-or-discard leave confirmation dialog). Do NOT edit the plan file. Mark todos in progress and complete all.

**Outcome:** Implemented the plan:
- **DetailsFormShell** — Added `onSaveAndLeave?`, `isSavingAndLeaving` state; when valid (`!isSubmitDisabled` and `onSaveAndLeave` provided) show "Save changes?" dialog with title/description and three buttons (Save changes primary, Discard changes and Keep editing secondary); when invalid show existing "Discard changes?" two-button dialog; "Save changes" handler awaits `onSaveAndLeave()` then resolves leave `true` without calling `onClose`.
- **WordDetailsForm / QuestionTypeDetailsForm** — Added `onSaveWithoutNavigate?`, shared `buildPayload()`; pass `onSaveAndLeave` to shell that validates and calls `onSaveWithoutNavigate` without closing.
- **WordsPage / QuestionTypesPage** — Extracted `saveWord` / `saveQuestionType` (mutation only); `handleSave` calls that then navigates; forms receive `onSaveWithoutNavigate` for the dialog path.
- **Tests** — Updated WordsPage and QuestionTypesPage tests: valid unsaved changes show "Save changes?" and three buttons; added "Save changes" flow tests (mock mutation, assert called and navigation); added invalid-form tests (discard-only dialog, no "Save changes" button).

---

## 2. Add new test cases and run all checks

**User:** Please add new cases to test the changed functionality to the tests or run any checks and run all checks.

**Outcome:** Tests and checks were already added in (1). Ran `pnpm run format` on DetailsFormShell for oxfmt; `pnpm run check` (typecheck, lint, lint:format) passed. No additional test cases were required beyond those already added.

---

## 3. Run all tests and fix any failures

**User:** Please run all tests and fix any failures.

**Cause:** Route tests (WordsPage, QuestionTypesPage) failed with "Unable to find an accessible element with the role 'dialog'". Navigation was happening immediately on Add/row click because `confirmLeave()` was resolving `true` without showing the dialog. In ListDetailPage, `onDirtyChange(true)` stored `confirmLeaveFnRef.current` into `confirmLeaveRef` at that moment; the shell's effect that calls `onConfirmLeaveReady(confirmLeave)` runs after the form's effect that calls `onDirtyChange(true)`, so the stored function was the previous `confirmLeave` (with `isDirty === false` in its closure).

**Outcome:** Updated **ListDetailPage**: replaced `confirmLeaveRef` with `dirtyRef`; `onDirtyChange` only sets `dirtyRef.current = dirty`; when confirming (Add or row click), use `confirmLeaveFnRef.current` so the latest `confirmLeave` is always called; only run confirm flow when `dirtyRef.current` is true. All 173 tests passed.

---

## 4. Save transcript and commit

**User:** /commit

**Outcome:** Created `.cursor/prompts/037_save_or_discard_leave_dialog.md` with this transcript. Staged all changes and committed (7f1755c) with message: feat: save-or-discard leave dialog when navigating with unsaved changes; ListDetailPage fix; tests; transcript. Did not run `git push`.
