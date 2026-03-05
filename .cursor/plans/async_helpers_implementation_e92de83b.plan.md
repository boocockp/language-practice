---
name: Async Helpers implementation
overview: Integrate handlebars-async-helpers so that data and question/answer templates run on a single async Handlebars instance, with line-by-line data evaluation, accumulating context, optional data-expressions as templates, and helpers that await their arguments. Update tests and docs accordingly.
todos: []
isProject: false
---

# Async Helpers implementation

## Summary

Implement the [Async Helpers](docs/featureChanges/Async%20Helpers.md) feature: use **handlebars-async-helpers** for all template evaluation, one shared Handlebars instance for data and question/answer steps, line-by-line data evaluation with accumulating context, and two ways to process data-expressions (literal vs template). All helpers must await their arguments so async helpers work as subexpressions.

## Current behavior (to change)

- **Data step** ([convex/questionGeneration.ts](convex/questionGeneration.ts)): `Handlebars.create()`, registers `storeData` and `word`, transforms entire dataTemplate into one string of `{{{storeData "name" (expr)}}}`, compiles once, runs once with `initialContext`, then `Promise.all` to resolve any stored promises. Single execution, no cross-line context.
- **Question/answer step**: Separate `Handlebars.create()`, registers `templateHelpers`, compiles and runs question/answer templates synchronously. No shared instance with data step.
- **Data-expression**: Always wrapped as `(expr)` in storeData; no “expression as template” path.

## Target behavior

- **Single Handlebars instance**: Create one instance via `asyncHelpers(Handlebars)` (the library calls `Handlebars.create()` internally and wraps it). Use this for both data step and question/answer step. Register all helpers once: `storeData`, `word`, and `templateHelpers` (noun, verb, etc.).
- **Await template execution**: Compiled templates return Promises; every `template(context)` must be `await`ed.
- **storeData semantics**: Store the resolved value in the **context** passed to the template (so `storeData` mutates the execution context, e.g. `this[key] = await value`). The same context object is passed to each line so values from earlier lines are visible in later lines.
- **Line-by-line data step**: For each line `name = data-expression`:
  - **If data-expression contains `{{`**: Treat as a Handlebars template. Compile the expression string, run with current context (`await template(context)`), assign the resulting string to `context[name]`.
  - **Otherwise**: Keep current transform for that line: `{{{storeData "name" (expr)}}}`. Compile and run that single-line template with current context (await). `storeData` stores the resolved value into the same context so the next line sees it.
- **Helpers await arguments**: In `storeData`, `word`, and in [convex/templateHelpers.ts](convex/templateHelpers.ts) (`noun`, `verb`), await any Promise arguments/hash values (e.g. `value = await Promise.resolve(value)`, and for noun/verb await `word`, `hash.subject`, `hash.adj`, etc.) so async helpers work correctly as subexpressions.

## Key files


| File                                                                         | Role                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [convex/questionGeneration.ts](convex/questionGeneration.ts)                 | Integrate asyncHelpers, single instance, line-by-line data step, storeData writes to context, await all template runs                   |
| [convex/templateHelpers.ts](convex/templateHelpers.ts)                       | Await helper arguments (word, subject, hash.adj, etc.) in noun/verb                                                                     |
| [convex/questionGeneration.test.ts](convex/questionGeneration.test.ts)       | Keep existing tests passing; add tests for async behavior, “expr as template”, and context accumulation                                 |
| [convex/templateHelpers.test.ts](convex/templateHelpers.test.ts)             | No API change; ensure still pass (noun/verb with async Handlebars)                                                                      |
| [convex/practice.test.ts](convex/practice.test.ts)                           | Integration tests; confirm generateQuestion action still works                                                                          |
| [docs/features/Practice Questions.md](docs/features/Practice%20Questions.md) | Update “Generating data” and “Generate question and answer” to describe async instance, line-by-line context, and data-expression rules |
| [docs/features/Template Helpers.md](docs/features/Template%20Helpers.md)     | State that noun/verb (and other template helpers) are now available in the data template as well                                        |


## Implementation details

### 1. questionGeneration.ts

- **Import**: Add `handlebars-async-helpers` (default import). Use as `const asyncHelpers = require('handlebars-async-helpers')` or ensure the package is ESM-compatible / re-exported for TypeScript; if it’s CJS-only, use `require` in a small adapter or ensure Vitest/Convex can load it.
- **Single instance**: In `generateQuestion`, create `const hb = asyncHelpers(Handlebars)` once (the library’s API takes the Handlebars constructor and creates a wrapped instance). Do **not** call `Handlebars.create()` yourself for this path.
- **storeData**: Register an async helper that (1) awaits the value: `value = await Promise.resolve(value)`, (2) assigns into the execution context: e.g. `options.data.root[key] = value` or the context passed at template invocation—confirm Handlebars’ “root” or `this` so the same object is used for every line. So “context passed to the template for each line” is one mutable object; storeData writes into it.
- **Data step refactor**: Replace single full-template run with a loop over lines (split by `\n`, trim, skip empty). For each line with `name = expr`:
  - If `expr.includes('{{')`: compile `expr` with `hb.compile(expr)`, then `context[name] = await compiled(context)`.
  - Else: build one line `{{{storeData "name" (expr)}}}` (reuse existing transform logic for this line), compile with `hb.compile`, then `await compiled(context)` (no assignment; storeData updates context).
- **Pass context**: Use one `context` object (copy of `initialContext` or start from `{}`), pass it into every data-step template call so storeData and “expr as template” both read/write the same object. After the loop, `data = context` for the question/answer step.
- **Question/answer step**: Take the same `hb` and `data`. `const qTemplate = hb.compile(questionTemplate); const aTemplate = hb.compile(answerTemplate);` then `text = await qTemplate(data); expected = await aTemplate(data);` then apply `postProcess`. So `runQuestionAnswerStep` becomes async and receives `hb` and options (e.g. postProcess); no longer creates its own Handlebars.
- **Helper registration**: Register `storeData`, `word`, and (when provided) all `templateHelpers` on `hb` once, before the data step, so they are available in data template and in question/answer templates.
- **Error handling**: Preserve existing try/catch and error messages (“Data template error” / “Question/answer template error”); ensure async rejections are caught.

### 2. templateHelpers.ts

- **noun / verb**: At the start of each helper, resolve any Promise arguments: e.g. `word = await Promise.resolve(word);` and for hash options used in the helper (e.g. `subject`, `adj`, `adj2`) do the same so that when `word` or `subject` is an async subexpression (e.g. from `(word text="chat")`), the helper awaits before using them. This satisfies “all helpers must await all of their arguments before proceeding.”
- **Types**: Helper delegates may receive Promise values; type as `unknown` or a union that includes `Promise<...>` where appropriate, and use `await Promise.resolve(...)` so TypeScript is satisfied.

### 3. Tests

- **questionGeneration.test.ts**:  
  - Existing tests use `lookup this "val"` (Handlebars built-in `lookup`). The wrapped instance should still expose built-ins; if the library replaces only `compile`/template and doesn’t strip helpers, these should keep passing.  
  - Add tests:  
    - **Context accumulation**: e.g. line 1 stores `a`, line 2 uses `a` in an expression (e.g. `b = lookup this "prefix"` with context that has `a` and a custom helper, or a simple `b = a`-style storeData) and later template uses both; assert both present in question/answer.  
    - **Data-expression as template**: One line with `name = {{...}}` (e.g. literal `x = {{"hello"}}` or a helper that returns a string), assert stored value is the evaluated string and appears in question/answer.  
    - **Async helper as subexpression**: Ensure `storeData "x" (word ...)` still works (word returns Promise; storeData awaits it and stores).
  - If the test runner or Convex uses **edge** and `handlebars-async-helpers` fails (e.g. CJS or Node-only), switch the test environment for this file to `node` (e.g. `// @vitest-environment node`) or run only question generation tests in Node.
- **templateHelpers.test.ts**: Already call `generateQuestion` with French and noun/verb; no API change. Ensure they still pass (async compilation and execution).
- **practice.test.ts**: No changes required unless integration fails; then fix any broken expectations (e.g. error messages or timing).

### 4. Docs

- **Practice Questions.md**: In “Generating data for the question” and “Generate question and answer”: (1) state that one async Handlebars instance is used for both steps; (2) describe line-by-line processing and that the same context is used for each line so earlier values are available later; (3) describe data-expression rules: contains `{{` → evaluate as template and store string result; otherwise wrap in storeData and store the result. Align “Generate question and answer” with awaiting template execution and use of the same instance and helpers.
- **Template Helpers.md**: Update to say that noun/verb (and any other template helpers) are registered on the same instance and are available in the **data template** as well as in question and answer templates.
- **docs/featureChanges/Async Helpers.md**: Optional: add a short “Implemented” note and link to Practice Questions.md once done.

## Architecture diagram (conceptual)

```mermaid
flowchart LR
  subgraph params [generateQuestion params]
    DT[dataTemplate]
    QT[questionTemplate]
    AT[answerTemplate]
    IC[initialContext]
    LW[lookupWord]
    TH[templateHelpers]
  end

  subgraph single [Single async Handlebars instance]
    HB[asyncHelpers Handlebars]
    storeData[storeData]
    word[word]
    noun_verb[noun, verb, ...]
  end

  subgraph data_step [Data step]
    context[context = copy of initialContext]
    line_loop[For each line name = expr]
    branch{expr contains "{{" ?}
    eval_template[Compile expr, await template context]
    store_line[Compile storeData line, await template context]
    context --> line_loop
    line_loop --> branch
    branch -->|yes| eval_template
    branch -->|no| store_line
    eval_template --> context
    store_line --> context
  end

  subgraph qa_step [Question/answer step]
    q_comp[Compile questionTemplate]
    a_comp[Compile answerTemplate]
    q_run[await qTemplate data]
    a_run[await aTemplate data]
    post[postProcess]
  end

  params --> HB
  HB --> storeData
  HB --> word
  HB --> noun_verb
  HB --> data_step
  context --> data_step
  data_step --> data[data = context]
  data --> qa_step
  HB --> qa_step
  qa_step --> result[text, expected]
```



## Risks and mitigations

- **handlebars-async-helpers** is CJS and uses `require`; Convex actions use `"use node"` and support Node, so the package should load in actions. For Vitest, if `questionGeneration.test.ts` runs in edge and the package fails, switch that file to `// @vitest-environment node` so it runs in Node.
- **Breaking tests**: Existing tests assume one-shot data template run and synchronous question/answer. After the refactor, ensure the same context object is used and storeData writes to it; then “multiple lines” and “literal from context” tests should still pass. If “lookup” is not on the wrapped instance, we may need to re-register a small `lookup` helper for tests or use a different test helper.
- **Template Helpers doc** previously said helpers are “only available in the question and answer templates”; the feature change makes them available in the data template too—update the doc to avoid confusion.

## Definition of done

- `npm run typecheck` and `npm run lint` pass.
- All existing questionGeneration and templateHelpers tests pass; new tests added for context accumulation and data-expression-as-template.
- Practice Questions.md and Template Helpers.md updated as above.
- Business logic remains in Convex; no change to practiceActions API beyond what’s required by the new generation flow.

