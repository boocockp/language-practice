---
name: Template Helpers NLG
overview: Implement the `noun` and `verb` Handlebars helpers for French using Approach 1 (RosaeNLG wrapper), register them only in question/answer templates, add post-processing for contractions/elisions, and structure for future multi-language support.
todos:
  - id: extend-params
    content: Extend GenerateQuestionParams with language, templateHelpers, postProcess
    status: completed
  - id: run-qa-step
    content: Update runQuestionAnswerStep to register helpers and apply postProcess
    status: completed
  - id: nlg-wrapper
    content: Implement createNounHelper and createVerbHelper in practiceActions using NlgLib
    status: completed
  - id: post-process
    content: Implement post-process for French contractions on full output
    status: completed
  - id: wire-action
    content: Wire helpers and postProcess into practiceActions for French
    status: completed
  - id: unit-tests
    content: Add questionGeneration tests for helpers and postProcess
    status: completed
  - id: integration-tests
    content: Add integration tests for noun/verb helpers with real RosaeNLG
    status: completed
  - id: docs
    content: Update Template Helpers.md and architecture docs
    status: completed
isProject: false
---

# Template Helpers Implementation Plan (Approach 1: RosaeNLG Wrapper)

## Summary

Implement the `noun` and `verb` helpers from [Template Helpers.md](docs/features/Template%20Helpers.md) by wrapping `rosaenlg-lib`'s `NlgLib`, `ValueManager`, and `VerbsManager`. Helpers are available only in question/answer templates (not data template). Apply French contractions/elisions to the final template output. French only for this stage.

## Requirements Recap


| Helper   | Args                                                           | Behavior                                           |
| -------- | -------------------------------------------------------------- | -------------------------------------------------- |
| **noun** | `word` (required), `adj`, `adj2`, `art` (def/ind), `num` (S/P) | Noun phrase with agreeing article and adjectives   |
| **verb** | `word`, `subject`, `tense` (required), `num` (S/P)             | Conjugated verb, 3rd person, agreeing with subject |


- Language-specific implementations (French first)
- Post-process full template output for contractions (e.g. "la aile" → "l'aile")
- Helpers only in question/answer templates

## Architecture

```mermaid
flowchart TD
  subgraph action [practiceActions "use node"]
    LWH[createTemplateHelpers language]
    LWH -->|uses| NLG[NlgLib fr_FR]
    NLG --> VM[valueManager.value]
    NLG --> VbM[verbsManager.getAgreeVerb]
    NLG --> GF[getFiltered]
    LWH --> NH[noun helper]
    LWH --> VH[verb helper]
    LWH --> PP[postProcess for contractions]
  end

  subgraph qgen [questionGeneration]
    RQA[runQuestionAnswerStep]
    RQA -->|registers| NH
    RQA -->|registers| VH
    RQA -->|after render| PP
  end

  PP --> |text, expected| OUT[Final output]
```



## Implementation Plan

### 1. Extend GenerateQuestionParams with template helpers and post-process

**File:** [convex/questionGeneration.ts](convex/questionGeneration.ts)

- Add optional params:
  - `language: string` – used for helper context and documentation
  - `templateHelpers?: Record<string, Handlebars.HelperDelegate>` – helpers to register for question/answer step (e.g. `noun`, `verb`)
  - `postProcess?: (text: string) => string` – applied to question and answer text after rendering
- In `runQuestionAnswerStep`, register `templateHelpers` when provided
- After rendering, apply `postProcess` to both `text` and `expected` if provided
- Keep `runQuestionAnswerStep` synchronous; helpers must be sync (Handlebars limitation for these use cases)

### 2. Implement RosaeNLG wrapper in practiceActions

**File:** [convex/practiceActions.ts](convex/practiceActions.ts)

This file already has `"use node"` and can use `rosaenlg-lib`. Add:

**2a. Language mapping**

- Map app `language` to RosaeNLG locale: `'fr'` → `'fr_FR'`, `'en'` → `'en_US'`, etc.
- For non-French languages in this stage: skip template helpers and post-process (or no-op)

**2b. NlgLib instance cache**

- Lazy-create one `NlgLib` per locale: `new NlgLib({ language: 'fr_FR', renderDebug: false })`
- Cache in a `Map<string, NlgLib>` keyed by locale
- Use `SpyNoPug` (default) – no Pug dependency

**2c. Word type to gender mapping**

- `nm` → `'M'`, `nf` → `'F'`, `nmf` → `'M'` (per transcript)
- Used for noun phrase gender and verb subject agreement

**2d. createNounHelper(locale)**

- Returns a sync Handlebars helper
- Reads from `options.hash`: `word` (required), `adj`, `adj2`, `art`, `num`
- Validates `word` is object with `text`, `type`
- Maps `art`: `'def'` → `det: 'DEFINITE'`, `'ind'` → `det: 'INDEFINITE'`, omit if not provided
- Maps `num`: `'P'` → `number: 'P'`, else `'S'`
- Builds `ValueParams`: `det`, `number`, `gender` from `word.type`, `adj`/`adj2` as `adj: [adj?.text, adj2?.text].filter(Boolean)` (or single string if one)
- Flow: `nlg.spy.setPugHtml('')`; `nlg.valueManager.value(word.text, params)`; `return nlg.getFiltered()`
- Return empty string or safe fallback if `word` is null/undefined

**2e. createVerbHelper(locale)**

- Returns a sync Handlebars helper
- Reads from `options.hash`: `word` (verb), `subject` (required), `tense` (required), `num`
- Validates `word` and `subject` have `text`, `type`
- Subject: `subjectAnon = nlg.genderNumberManager.getAnonymous(wordTypeToGender(subject.type), num === 'P' ? 'P' : 'S')`
- Person: `'3P'` if `num === 'P'`, else `'3S'`
- `return nlg.verbsManager.getAgreeVerb(subjectAnon, person, { verb: word.text, tense }, {})`
- Tense: pass through as-is; must match RosaeNLG tense names (e.g. `PRESENT`, `PASSE_COMPOSE`)

**2f. Post-process for contractions**

- Use `nlg.getFiltered()` on the full string: `nlg.spy.setPugHtml(text)`; `return nlg.getFiltered()`
- Or call `rosaenlg-filter`'s `filter(text, languageCommon, {})` with the language's `languageCommon`
- Apply to both question `text` and `expected` after `runQuestionAnswerStep`

**2g. Wire into generateQuestion call**

- For `args.language === 'fr'` (or mapped `fr_FR`): create helpers and post-process, pass to `runQuestionGeneration`
- For other languages: pass no helpers, no post-process (templates fall back to `{{word.text}}` etc.)

### 3. Adjective handling

- RosaeNLG expects adjectives in dictionary form (e.g. masculine singular for French)
- If words store adjectives in a specific form, we may need a convention; otherwise use `word.text` as-is and rely on RosaeNLG's agreement where possible
- `adjPos`: French default is `AFTER`; for adjectives that go before (e.g. "beau"), either use `adjPos: 'BEFORE'` or document that adjective words should be in correct form for position
- Initial implementation: pass `adj` as single string or array; use `adjPos: 'AFTER'` as default (can extend with optional `adjPos` hash param later)

### 4. Convex / runtime considerations

- All RosaeNLG usage stays in [convex/practiceActions.ts](convex/practiceActions.ts) (already `"use node"`)
- [convex/questionGeneration.ts](convex/questionGeneration.ts) remains runtime-agnostic; it receives helper functions and `postProcess` as parameters
- `questionGeneration.test.ts` continues to run in edge runtime; tests pass mock or no helpers

### 5. Tests

**File:** [convex/questionGeneration.test.ts](convex/questionGeneration.test.ts)

- Add tests for `runQuestionAnswerStep` with mock `noun` and `verb` helpers
- Test that `postProcess` is applied to output
- Test that helpers receive correct hash args (mock implementations that record calls)

**File:** [convex/practice.test.ts](convex/practice.test.ts) (or new `convex/nlgHelpers.test.ts`)

- Integration tests for noun helper: e.g. `{{noun word=noun art="def"}}` with French noun "chat" (nm) → "le chat"
- Integration tests for verb helper: e.g. `{{verb word=verb subject=noun tense="PRESENT"}}` with "manger", "chat" → "mange"
- Test post-process: e.g. "la aile" → "l'aile" (may require crafting a template that produces that)
- Skip or stub for non-French if no helpers registered

### 6. Documentation

- [docs/features/Template Helpers.md](docs/features/Template%20Helpers.md): Add implementation notes (Approach 1, RosaeNLG wrapper, French only, supported tenses reference)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) or Practice Questions: Note that template helpers are language-specific and built on rosaenlg-lib

## RosaeNLG API Quick Reference


| Component                                | Usage                                                               |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `NlgLib`                                 | `new NlgLib({ language: 'fr_FR', renderDebug: false })`             |
| `valueManager.value(noun, params)`       | Writes to spy; `params`: `det`, `number`, `gender`, `adj`, `adjPos` |
| `getFiltered()`                          | Returns spy content with contractions/elisions applied              |
| `genderNumberManager.getAnonymous('M'    | 'F', 'S'                                                            |
| `verbsManager.getAgreeVerb(subject, '3S' | '3P', { verb, tense }, {})`                                         |
| `spy.setPugHtml('')`                     | Clear buffer before each helper call                                |


## Edge Cases

- **word null/undefined:** Return empty string from helpers
- **Unsupported language:** Do not register helpers; no post-process
- **Missing tense:** Verb helper should validate and return sensible fallback or throw
- **Unknown word type:** Default gender to `'M'` for `nmf` and other types
- **Verbs not in dictionary:** RosaeNLG uses Lefff; custom verbs may need `setEmbeddedVerbs` (future enhancement)

## Future: Other Languages

- Add `en_US`, `de_DE`, etc. to locale mapping
- Implement language-specific helpers (English may need different logic)
- Keep helper interface consistent: `noun(word, { adj, adj2, art, num })`, `verb(word, subject, tense, { num })`

