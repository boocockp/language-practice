# Async helpers
_Exported on 05/03/2026 at 16:50:29 GMT from Cursor (2.5.26)_

---

**User**

Please plan the implementation of the changes in @docs/featureChanges/Async Helpers.md .  Update unit tests or add new ones as appropriate.  Ask questions where needed.

---

**Cursor**


Exploring the implementation and tests to plan the changes.



Checking how the data step passes context and whether practice tests need the lookup helper:



Checking the test environment and whether the async package works in edge:



Checking how the library handles helper arguments (awaiting subexpressions):



Creating the implementation plan.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the questionGeneration refactor: checking how Handlebars passes context into helpers so storeData can write to the execution context.



Implementing the full refactor in questionGeneration.ts.



Fixing TypeScript: typing the asyncHelpers return and handling `require`.



Checking how other Convex files import CJS modules:



Fixing types: adding a minimal async Handlebars type and making the require call type-safe.



Using dynamic import so we don't need Node types when the app config typechecks convex:



Adding a module declaration for the CJS package:



Adding a triple-slash reference so the declaration is included when the module is typechecked:



Running questionGeneration tests:



All tests passed. Implementing templateHelpers awaiting arguments and adding new tests.



Adding tests for context accumulation and data-expression-as-template:



Fixing the lint error by including the declaration file in the tsconfig instead of using a triple-slash reference:



Adding an eslint-disable for the triple-slash reference so the CJS module's types are visible.



Including the declaration in the project so we can remove the triple-slash.



Summary of what was implemented:

## 1. **convex/questionGeneration.ts**
- Wrapped Handlebars with **handlebars-async-helpers** via dynamic `import("handlebars-async-helpers")` so it works with the app’s TypeScript setup.
- Use a **single async Handlebars instance** for both the data step and the question/answer step; register `storeData`, `word`, and any `templateHelpers` on it once.
- **Data step**: Process the data template **line by line**. For each `name = expr` line:
  - If `expr` contains `{{`, compile and run it as a template with the current context and set `context[name]` to the string result.
  - Otherwise, render `{{{storeData "name" (expr)}}}` and run it; `storeData` awaits the value and assigns `this[key] = value` so the same context is updated.
- **storeData** is an async helper that does `this[key] = await Promise.resolve(value)` so the execution context is updated for the next line.
- **Question/answer step**: Reuse the same instance; compile question and answer templates and **await** `qTemplate(data)` and `aTemplate(data)`; then apply `postProcess`.
- Added **convex/handlebars-async-helpers.d.ts** for the CJS package and included it in **tsconfig.app.json** so the module is typed and lint is satisfied.

## 2. **convex/templateHelpers.ts**
- **noun** and **verb** are async and **await** all inputs (e.g. `word`, `hash.adj`, `hash.subject`, `hash.tense`) via a small `resolveArg()` helper so async subexpressions (e.g. `(word text="chat")`) work when passed to other helpers.

## 3. **Tests**
- **questionGeneration.test.ts**: Added three tests:
  - **Context accumulation**: `a = lookup this "first"` then `b = {{a}}` so a later line uses an earlier value; assert `{{a}}-{{b}}` → `A-A`.
  - **Data-expression as template**: `x = {{lookup this "key"}}` with `initialContext: { key: "hello" }` stores the evaluated string and it appears in question/answer.
  - **Async helper as subexpression**: `storeData "w" (word ...)` stores the awaited word result and it is used in question/answer.
- All 21 questionGeneration tests, 8 templateHelpers tests, and 12 practice tests pass.

## 4. **Docs**
- **Practice Questions.md**: Rewrote “Generating data for the question” and “Generate question and answer” to describe the single async instance, line-by-line data step, shared context, and the two data-expression rules (contains `{{` → run as template; otherwise use storeData). Updated Stage 1 and Template helpers notes to match.
- **Template Helpers.md**: Stated that noun/verb (and other template helpers) are available in the **data template** as well as question and answer, and that they are registered on the single instance used for all steps.
- **Async Helpers.md**: Added an “Implemented” note and pointer to Practice Questions.md.

`npm run typecheck` and `npm run lint` pass; all 161 tests pass.

---

**User**

Please fix the problem reported by convex dev in @/Users/paul/.cursor/projects/Users-paul-dev-language-practice/terminals/1.txt 

---

**Cursor**


Adding "use node" to `questionGeneration.ts` so Convex bundles it for the Node runtime — `handlebars-async-helpers` requires Node's `stream` module.



Checking whether `practiceActions` has "use node" and whether anything else imports `questionGeneration`:



Added `"use node"` to the top of `convex/questionGeneration.ts`. That file dynamically imports `handlebars-async-helpers`, which uses Node’s `stream` module, so Convex needs to treat it as a Node module. Marking it with `"use node"` makes the bundler use the Node platform for that file and its dependencies (including `handlebars-async-helpers`), which resolves the “Could not resolve "stream"” error.

Re-run `npx convex dev`; the bundle should succeed. If Convex still reports the error, say what you see and we can try isolating the async Handlebars usage in a separate Node-only module.

---

**User**

That works

---

**Cursor**


Good to hear. With `"use node"` at the top of `convex/questionGeneration.ts`, Convex now bundles that module (and `handlebars-async-helpers`, which uses Node’s `stream`) for the Node runtime, so question generation should work in your dev deployment.

---

**User**

Please commit all changes, including the plan, with a suitable message

---

**Cursor**


Committed all changes (including the plan) as `a1d705b` with this message:

**feat: Async Helpers – handlebars-async-helpers, line-by-line data step, shared instance**

- Use handlebars-async-helpers for all template evaluation; single async Handlebars instance for data and question/answer steps  
- Data step: line-by-line processing with accumulating context; storeData writes into context; data-expressions with `{{` evaluated as template  
- noun/verb helpers await arguments for async subexpressions  
- Add tests: context accumulation, data-expression as template, async helper as subexpression  
- Add `convex/handlebars-async-helpers.d.ts`, include in tsconfig.app.json  
- Add `"use node"` to questionGeneration.ts for Convex Node runtime  
- Update Practice Questions.md and Template Helpers.md; mark Async Helpers feature as implemented  
- Include implementation plan in .cursor/plans/  

9 files changed, 334 insertions, 110 deletions.

