# Template helpers
_Exported on 02/03/2026 at 11:34:15 GMT from Cursor (2.5.26)_

---

**User**

Please plan the implementation of the requirements in @docs/features/Template Helpers.md , using Approach 1 in @/Users/paul/.cursor/projects/Users-paul-dev-language-practice/agent-transcripts/9d8e0176-0de3-407e-a922-80f49034177f/9d8e0176-0de3-407e-a922-80f49034177f.jsonl 

---

**Cursor**


Exploring the codebase and RosaeNLG to create an implementation plan using Approach 1.



Creating the implementation plan:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Adding `type` to the word result and implementing the NLG helpers.



Implementing the NLG wrapper in `practiceActions`:



Adding unit tests for template helpers and postProcess:



Summary of the implementation:

## Summary

### 1. Extended `GenerateQuestionParams` ([convex/questionGeneration.ts](convex/questionGeneration.ts))
- Added optional `language`, `templateHelpers`, and `postProcess` parameters.

### 2. Updated `runQuestionAnswerStep`
- Registers `templateHelpers` when provided.
- Runs `postProcess` on both question and answer text after rendering.

### 3. RosaeNLG wrapper in [convex/practiceActions.ts](convex/practiceActions.ts)
- **Language mapping**: `fr` → `fr_FR`, `en` → `en_US`, etc.
- **`createNounHelper(locale)`**: Uses `ValueManager.value()` for noun phrases with articles and adjectives (art: `def`/`ind`, num: `S`/`P`).
- **`createVerbHelper(locale)`**: Uses `VerbsManager.getAgreeVerb()` for third-person conjugation.
- **`createPostProcess(locale)`**: Runs `getFiltered()` for French contractions and elisions.
- **Word type → gender**: `nm` → M, `nf` → F, `nmf` → M.

### 4. Word result includes `type`
- `getRandomByCriteria` and `getMatchingWordsByCriteria` now return `type` for gender agreement in the helpers.

### 5. Tests
- **questionGeneration.test.ts**: Mock `noun`/`verb` helpers and `postProcess`.
- **practice.test.ts**: French noun helper (“le chat”) and verb helper (“mange” for manger + chat).

### 6. Documentation
- **Template Helpers.md**: Implementation notes, RosaeNLG usage, supported tenses.
- **ARCHITECTURE.md**: Note on template helpers.
- **Practice Questions.md**: Notes on noun/verb helpers and `type` in word results.

`npm run typecheck`, `npm run lint`, and all 148 tests pass.

