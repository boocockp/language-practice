# Refactoring practiceActions functionality
_Exported on 02/03/2026 at 14:07:50 GMT from Cursor (2.5.26)_

---

**User**

Please plan a refactoring in @convex/practiceActions.ts:168-178 that moves this section and the functions it calls to a separate file.  Create a unit test for this new file that checks the same functionality as @convex/practice.test.ts:377-448 .  Remove the imports at @convex/practiceActions.ts:6-7 .

---

**Cursor**


Exploring the codebase to map the structure and dependencies of the refactor.



Checking questionGeneration's expected types and how tests are structured:



Creating the refactoring plan:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Refactoring is done. Summary of changes:

## Summary

**Created [`convex/templateHelpers.ts`](convex/templateHelpers.ts)**
- Moved `toNlgLocale`, `nlgCache`, `getNlgLib`, `wordTypeToGender`, `WordObj`, `createNounHelper`, `createVerbHelper`, and `createPostProcess`
- Added `getTemplateHelpersForLanguage(language)` that returns `{ templateHelpers, postProcess }` for French and `undefined` for other languages

**Updated [`convex/practiceActions.ts`](convex/practiceActions.ts)**
- Removed `Handlebars` and `NlgLib` imports
- Imported `getTemplateHelpersForLanguage` from `./templateHelpers`
- Replaced the inlined helper creation with: `const { templateHelpers, postProcess } = getTemplateHelpersForLanguage(args.language)`

**Created [`convex/templateHelpers.test.ts`](convex/templateHelpers.test.ts)**
- `@vitest-environment node` for NlgLib
- Three tests: non-French returns `undefined`; noun helper produces `le chat`; verb helper produces `mange`

**Updated [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**
- Documented that helpers live in `convex/templateHelpers.ts`

All 151 tests pass, and `npm run typecheck` and `npm run lint` succeed.

