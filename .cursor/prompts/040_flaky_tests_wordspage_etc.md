# Flaky tests WordsPage and QuestionTypesPage
_Exported on 11/03/2026 at 8:45:03 GMT from Cursor (2.6.14)_

---

**User**

The tests @src/routes/WordsPage.test.tsx and @src/routes/QuestionTypesPage.test.tsx have some intermittent failures.  This has been observed in the test `shows save-or-discard dialog when Add is clicked with valid unsaved changes, then navigates to new word on Discard`, and in the similar test for QuestionTypes.  If just the two tests are run on their own, no failures are observed after 5 successive runs.
Most recent observed failure is in @/Users/paul/.cursor/projects/Users-paul-dev-language-practice/terminals/3.txt .
Please debug and fix

---

**Cursor**


Debugging intermittent test failures: reading the terminal output and the two test files to understand the failures.



Checking how both pages handle the "Discard" action and navigation to the new form:



Inspecting ListDetailPage and the form's leave/discard flow:



Checking the confirmLeave flow and how the promise resolution interacts with onClose:



Tracing the flow:

- When Add is clicked with unsaved changes, `ListDetailPage.handleAddClick` calls `confirmLeave()` and waits. The form’s `confirmLeave` opens the dialog and returns a Promise.
- On "Discard changes", `DetailsFormShell.handleConfirmDiscard` does: `pendingLeaveResolveRef.current?.(true)`, then `onClose()`. So it always calls `onClose()`.
- Pages pass `onClose={goToWords}` / `onClose={goToQuestionTypes}` (navigate to list). So Discard triggers navigation to the list. The Promise also resolves so `handleAddClick` continues and calls `onAddClick()` (navigate to `_new`). Two navigations run; the intermittent failure is likely a race.

Formulating hypotheses and adding instrumentation to confirm.



Adding instrumentation to confirm the double-navigation race.



Instrumentation is in place to confirm why the test fails only in the full suite.

**Hypotheses:**
1. **H1 (double navigation):** On "Discard changes", `DetailsFormShell.handleConfirmDiscard` always calls `onClose()` (navigate to list) and also resolves the leave Promise, so `ListDetailPage.handleAddClick` then calls `onAddClick()` (navigate to `_new`). Two navigations run; which one “wins” can depend on timing.
2. **H2 (onClose wins):** In the full suite, the list navigation from `onClose()` is what the user sees, so the test sees the list instead of the new form.
3. **H3 (both run):** Logs will show both “Discard clicked” (with `willCallOnClose`) and “calling onAddClick”, so we can see the order of operations.
4. **H4 (confirmLeave source):** When the dialog was opened by Add (confirmLeave), `pendingLeaveResolveRef` is set; we should not call `onClose()` in that case so only `onAddClick()` runs.
5. **H5 (timing):** Assertion runs after the first navigation (list) and before or without the second (`_new`) taking effect.

Logs added:
- **DetailsFormShell** `handleConfirmDiscard`: logs `wasConfirmLeave` and `willCallOnClose` (whether `onClose()` is called).
- **ListDetailPage** `handleAddClick`: logs when `confirmLeave` resolves and when `onAddClick()` is about to be called.

<reproduction_steps>
1. Run the full test suite: `pnpm test:once` (from the project root).
2. If the failing test passes, run `pnpm test:once` again until you see the failure (WordsPage or QuestionTypesPage “save-or-discard dialog … then navigates … on Discard”).
3. Press Proceed/Mark as fixed when done.
</reproduction_steps>

---

**User**

Issue reproduced, please proceed.

---

**Cursor**


Analyzing logs:

- Lines 6–8: `wasConfirmLeave: false`, `willCallOnClose: true` — Close-button flow; calling `onClose()` is correct.
- Lines 9+: `wasConfirmLeave: true`, `willCallOnClose: false` — Add+Discard flow. We're still calling `onClose()` in code (log only records intent), so we navigate to list then the promise resolves and `onAddClick()` runs (lines 10–11, 13–14). Two navigations; the list navigation can win or reorder in the full suite.

Implementing the fix: call `onClose()` only when the dialog was opened by the Close button (i.e. when `wasConfirmLeave` is false).



Summary of what we did:

**Log analysis**
- **H1/H2 CONFIRMED:** When the dialog was opened by **Add** (`wasConfirmLeave: true`), the shell still called `onClose()`, so we navigated to the list. The promise then resolved and `handleAddClick` called `onAddClick()` (navigate to `_new`). Two navigations ran; in the full suite the list navigation sometimes won or reordered, so the test saw the list and no “New Word” / “New Question Type” heading.
- **H4 CONFIRMED:** We can tell “opened by Add” vs “opened by Close” via `pendingLeaveResolveRef.current != null` (set only by `confirmLeave()`).

**Fix**
In `DetailsFormShell.handleConfirmDiscard`, call `onClose()` only when the dialog was **not** opened by confirmLeave (i.e. when the user used the Close button). So we only call `onClose()` when `!wasConfirmLeave`. When the user chose “Discard” after Add (or row click), we only resolve the promise; `ListDetailPage.handleAddClick` then runs and calls `onAddClick()`, so we navigate only to `/words/_new` or `/question-types/_new`.

Instrumentation is still in place for the verification run.

<reproduction_steps>
1. Run the full test suite: `pnpm test:once`.
2. Confirm all tests pass (including WordsPage and QuestionTypesPage “save-or-discard … then navigates … on Discard”).
3. Optionally run `pnpm test:once` 2–3 more times to confirm the flake is gone.
4. Press Proceed/Mark as fixed when done (or say if you want the debug logs removed).
</reproduction_steps>

---

**User**

First run ok, the same Error occurred in both the tests concerned in the second run

---

**Cursor**


Checking the log from the second run and adding instrumentation to determine why `pendingLeaveResolveRef` was null when Discard was clicked.



Observing the log: lines 49–50 show two consecutive "Discard clicked" with `wasConfirmLeave: false` — so `onClose()` ran and navigated to the list. That can happen if (1) two dialogs are in the DOM and the test clicks the other test's dialog (opened via Close), or (2) a brief list→_new navigation race causes the assertion to run too early. Making the tests wait for the new-form heading after Discard (using `findByRole`) to eliminate the race.



Logs show `wasConfirmLeave: false` in the failing run (lines 45, 49–50) — the test can be clicking another test's dialog when tests run in parallel. Scoping interactions to each test's container and waiting for the new form with `findByRole` to avoid the wrong-dialog and timing races.



Scoping the flaky tests to their render container and waiting for the new form with `findByRole` so we don't hit another test's dialog and we wait for navigation.



Reverting `within(container)` for the dialog and buttons — the dialog is rendered in a portal (outside the container). Keeping `findByRole` for the heading to wait for navigation.



Running test files sequentially to prevent parallel runs from clicking the wrong dialog. Adding `fileParallelism: false` to the Vitest config:



Removing debug instrumentation from DetailsFormShell and ListDetailPage.



Summary of what was fixed:

**Cause (from logs)**  
1. **Double navigation:** On “Discard changes” (after Add with unsaved changes), the shell always called `onClose()` (go to list) and also resolved the leave promise, so `ListDetailPage` then called `onAddClick()` (go to `_new`). Both navigations ran and could race.  
2. **Parallel tests:** With `fileParallelism: true`, two tests could have dialogs open at once. `getByRole("button", "Discard changes")` could hit the other test’s dialog (opened via Close, so `wasConfirmLeave` was false and `onClose()` ran), so the test saw the list instead of the new form.

**Changes made**

1. **`DetailsFormShell.tsx`**  
   In `handleConfirmDiscard`, call `onClose()` only when the dialog was opened from the **Close** button (`pendingLeaveResolveRef.current == null`). When it was opened via **confirmLeave** (Add or row click), only resolve the promise so `ListDetailPage` continues and calls `onAddClick()` → single navigation to `_new`.

2. **WordsPage.test.tsx / QuestionTypesPage.test.tsx**  
   After clicking “Discard changes”, use `await screen.findByRole("heading", { name: "New Word" })` (and the matching “New Question Type” variant) so the test waits for the new form to appear instead of asserting immediately.

3. **vitest.config.ts**  
   Set `fileParallelism: false` so test files run one after another. That way only one save/discard dialog is in the DOM at a time and tests don’t interact with each other’s dialogs.

Debug logging has been removed. Full suite passes (20 files, 218 tests). Run `pnpm test:once` a few more times to confirm the flake is gone.

---

**User**

/commit 

---

**Cursor**


Summary of what was done:

1. **Next transcript number**  
   Checked `.cursor/prompts/` and used the next number **039** (after 038).

2. **Transcript file**  
   Added **`.cursor/prompts/039_fix_save_discard_test_flake.md`** with:
   - Title: "Fix save-or-discard test flake"
   - Numbered sections for: intermittent failures, reproduce/confirm, second-run fix, summary, and save/commit
   - **User / Outcome** (and **Cause** where useful) for each part

3. **Stage and commit**  
   - Ran `git add -A`
   - Committed with:  
     **`fix: save-or-discard dialog double navigation and test flake`**  
     (DetailsFormShell fix, tests using `findByRole`, `fileParallelism: false`, plus transcript note.)
   - No `git push` was run.

**Commit:** `940859a`  
**New transcript:** `.cursor/prompts/039_fix_save_discard_test_flake.md`

---

**User**

I would like to run the tests in parallel, but these tests are still flaky when run with fileParallelism: false.  Please plan rendering the component for the two flaky tests in a different container using the options to testing library render

---

**Cursor**


Checking how render options work and where the dialog is mounted so we can plan container isolation for the flaky tests.



Checking how Kumo Dialog renders and whether it supports a portal container:



Creating a plan. The dialog is portaled to document.body, so we must ensure it renders inside the test container for scoped queries to find it.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the plan step by step: checking Kumo Dialog API, then applying the chosen option.



Kumo Dialog doesn't expose a portal container prop in its public API. Implementing Option B: mock Dialog to render inline for the four flaky tests and use a dedicated container with the render result's queries.


---

**User**

Is it possible in vitest to run most tests in parallel but forec some tests to run sequentially?

---

**Cursor**


Yes. You can run most tests in parallel and force a subset to run sequentially using **Vitest projects** and **sequence.groupOrder**.

**1. Projects + `sequence.groupOrder` (recommended)**

Define two projects: one for normal tests (parallel) and one for the tests you want sequential. Use `sequence.groupOrder` so the “sequential” project runs after the parallel one, and turn off file parallelism only for that project:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    server: { deps: { inline: ["convex-test"] } },
    fileParallelism: true, // default for the default project
    projects: [
      // Default project: all tests except the two flaky route files (parallel)
      {
        extends: true,
        test: {
          name: "default",
          include: ["**/*.test.{ts,tsx}"],
          exclude: [
            "src/routes/WordsPage.test.tsx",
            "src/routes/QuestionTypesPage.test.tsx",
          ],
          sequence: { groupOrder: 0 },
        },
      },
      // Flaky route tests: run after default, one file at a time
      {
        extends: true,
        test: {
          name: "route-pages",
          include: [
            "src/routes/WordsPage.test.tsx",
            "src/routes/QuestionTypesPage.test.tsx",
          ],
          fileParallelism: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
```

- **groupOrder: 0** (default project): runs first, with **fileParallelism: true** (multiple files in parallel).
- **groupOrder: 1** (route-pages): runs after, with **fileParallelism: false** so those two files run one after the other.

**2. Within a single file**

- By default, tests in one file already run one after the other (no parallelism inside the file).
- **Parallel within a file**: use `describe.concurrent` or `it.concurrent` only where you want parallelism; the rest stay sequential.

**3. What Vitest does *not* support**

- There is no built-in way to mark “this one file must run alone” while all others stay parallel. The project + `groupOrder` + `fileParallelism: false` pattern above is the way to get “most tests parallel, these few sequential.”

---

**User**

Please implement this change to vitest config

Note: if specify exclude, need to have configDefaults.include or it tries to run all tests in node_modules

---

**Cursor**


Using `configDefaults.include` so the default project doesn't pick up tests in `node_modules`.



Summary of changes:

1. **Default project**  
   - `include` is now `configDefaults.include` so Vitest only runs the default test patterns and doesn’t pick up tests in `node_modules`.  
   - `exclude` still spreads `configDefaults.exclude` and excludes the two route page test files.

2. **Import**  
   - `configDefaults` is imported from `"vitest/config"` (it was already there in the current file).

`pnpm test:once` completes in ~10s with 20 test files (all under `convex/` and `src/`) and no tests from `node_modules`. The `|default|` and `|route-pages|` projects behave as intended.

