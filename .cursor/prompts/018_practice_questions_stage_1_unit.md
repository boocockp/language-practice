# Practice Questions Stage 1 unit tests
_Exported on 27/02/2026 at 10:55:03 GMT from Cursor (2.5.25)_

---

**User**

Please plan new or updated unit tests to cover all the changes made in the most recent commit, which was a result of the actions in the plan @.cursor/plans/practice_questions_stage_1.plan.md 

---

**Cursor**


Gathering the plan, recent commit changes, and project test structure.



Checking convex-test support for actions, reading frontend changes, and inspecting the schema.



Checking how `convex-test` invokes internal functions and whether `questionGeneration` can be tested in isolation:



Creating the test plan:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the unit test plan step by step. Starting with the first task: adding `questionGeneration.test.ts`.



Running tests and checking vitest config:



Investigating the Handlebars syntax and fixing the tests.



Fixing tests: using Handlebars' `lookup` for context values and correcting the word-helper syntax:



Adding the edge-runtime directive for consistency with other Convex tests.



Creating `convex/practice.test.ts`.



Running PracticePage tests and fixing issues.



Simplifying the assertion: "cat" appears in multiple places and the selector was wrong.



Removing the word-helper action test and documenting the limitation. The action uses `initialContext: {}`, so word-based generation isn't covered at the action level.



Summary of changes:

## Summary

### 1. `convex/questionGeneration.test.ts`
Tests for the Handlebars-based question generator:
- Empty dataTemplate, literals via `lookup`, word helper, word helper returns null
- Multiple lines, malformed lines, compile/runtime errors, error propagation

### 2. `convex/practice.test.ts`
- **submitAnswer**: unauthenticated, wrong user, exact/trim/case-insensitive correct answers, wrong answer
- **generateQuestion action**: unauthenticated, wrong user, empty dataTemplate generation
- Documented why word-helper-with-context is not covered at the action level

### 3. `convex/words.test.ts`
- **getFirstByText**: found word, no match, filtering by `userId`/language

### 4. `src/routes/PracticePage.test.tsx`
- Loading, unauthenticated, no question types
- Question type selection, Next Question, Check Answer
- Expected answer and result (Correct/Wrong), Check Answer disabled when empty
- Select `renderValue` behavior

### 5. `questionGeneration.ts`
- Removed unused `flushMicrotasks` to fix typecheck

### 6. `docs/TESTING.md`
- Documented Practice flow tests and the action’s `initialContext` limitation

All 126 tests pass, and typecheck and lint succeed.

---

**User**

Good - please stage and commit all changes including the plan with a suitable message

---

**Cursor**


All changes are committed with this message:

```
test: Practice Stage 1 unit tests

- Add questionGeneration.test.ts for Handlebars template logic
- Add practice.test.ts for submitAnswer mutation and generateQuestion action
- Add getFirstByText tests to words.test.ts
- Add PracticePage.test.tsx for practice UI and flow
- Remove unused flushMicrotasks from questionGeneration.ts
- Update docs/TESTING.md with Practice test coverage notes
```

7 files changed, 1043 insertions, 11 deletions.

