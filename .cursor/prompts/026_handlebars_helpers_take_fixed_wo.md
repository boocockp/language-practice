# Handlebars helpers take fixed word argument
_Exported on 04/03/2026 at 11:23:57 GMT from Cursor (2.5.26)_

---

**User**

Make the noun and verb Handlebars helpers in @convex/templateHelpers.ts take `word` as a fixed first argument.  UPdate the tests too 

---

**Cursor**


Reading the test files to get exact usage and update them.



Checking how Handlebars passes arguments to helpers and searching for other template usages:



Implementing changes: updating helpers to accept `word` as the first argument, then updating all tests.



Updating questionGeneration.test.ts: mock helpers should accept (word, options) and templates should use positional `word`.



Running the templateHelpers and questionGeneration tests:



Summary of changes:

**`convex/templateHelpers.ts`**
- **Noun helper**: Takes `word` as the first parameter instead of reading it from `options.hash`. Signature is now `(this, word, options)`; other options (`adj`, `adj2`, `art`, `num`) still come from `options.hash`.
- **Verb helper**: Same idea — `word` is the first parameter; `subject`, `tense`, `num` stay in `options.hash`.

**Tests**
- **`convex/templateHelpers.test.ts`**: All templates updated from `{{noun word=noun ...}}` to `{{noun noun ...}}` and from `{{verb word=verb ...}}` to `{{verb verb ...}}`.
- **`convex/practice.test.ts`**: Same template updates for the French noun and verb helper tests.
- **`convex/questionGeneration.test.ts`**: Mock helpers now use `(word, options)` and record `{ word, ...options.hash }`; templates changed to `{{noun foo}}` and `{{verb bar subject=foo tense="PRESENT"}}`; existing assertions still pass because the recorded object still has `word`, `subject`, and `tense`.

Templates now pass the word as the first argument, e.g. `{{noun noun art="def"}}` and `{{verb verb subject=noun tense="PRESENT"}}`. All 38 tests pass and there are no new lint issues.

