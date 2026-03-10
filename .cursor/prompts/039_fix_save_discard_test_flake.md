# Chat transcript: Fix save-or-discard test flake

## 1. Intermittent test failures (WordsPage, QuestionTypesPage)

**User:** The tests WordsPage.test.tsx and QuestionTypesPage.test.tsx have intermittent failures, observed in "shows save-or-discard dialog when Add is clicked with valid unsaved changes, then navigates to new word on Discard" (and the similar test for QuestionTypes). When run alone, no failures after 5 runs. Most recent failure in terminal 3. Please debug and fix.

**Outcome:** Read terminal output and both test files; traced flow through WordsPage, QuestionTypesPage, ListDetailPage, and DetailsFormShell. Identified that on "Discard changes" the shell always called `onClose()` (navigate to list) and also resolved the leave promise so ListDetailPage called `onAddClick()` (navigate to _new)—two navigations racing. Added debug instrumentation to confirm.

---

## 2. Reproduce and confirm hypothesis

**User:** Issue reproduced, please proceed.

**Outcome:** Read debug log. **Cause:** Log showed `wasConfirmLeave: true` when dialog was opened by Add; we were still calling `onClose()` in code, so both list and _new navigations ran. Implemented fix: in `DetailsFormShell.handleConfirmDiscard`, call `onClose()` only when `!wasConfirmLeave` (i.e. when the dialog was opened by the Close button, not by confirmLeave). Left instrumentation in place for verification.

---

## 3. Second run: same error in both tests

**User:** First run ok, the same Error occurred in both the tests concerned in the second run.

**Cause:** Log showed some "Discard clicked" with `wasConfirmLeave: false`—when test files run in parallel, two dialogs can be in the DOM and the test can click the other test’s dialog (opened via Close). Also tried scoping to `within(container)` for the dialog; that failed because the dialog is rendered in a portal outside the container.

**Outcome:** (1) Reverted `within(container)` for dialog/buttons; kept `screen` for those. (2) Switched post-Discard assertion to `await screen.findByRole("heading", { name: "New Word" })` (and "New Question Type") so the test waits for the new form. (3) Set `fileParallelism: false` in `vitest.config.ts` so test files run sequentially and only one dialog is present at a time. Full suite passed; removed debug instrumentation.

---

## 4. Summary of fix

**Outcome:** Three changes: (1) **DetailsFormShell**: call `onClose()` only when the discard dialog was opened by the Close button (`pendingLeaveResolveRef.current == null`); when opened via confirmLeave (Add/row click), only resolve the promise so ListDetailPage calls `onAddClick()` and we navigate once to _new. (2) **Tests**: use `findByRole` for the "New Word" / "New Question Type" heading after Discard to wait for navigation. (3) **Vitest**: `fileParallelism: false` to avoid cross-file dialog interference.

---

## 5. Save transcript and commit

**Outcome:** New transcript written to `.cursor/prompts/039_fix_save_discard_test_flake.md`. Staged all changes and committed as `940859a` (fix: save-or-discard dialog double navigation and test flake).
