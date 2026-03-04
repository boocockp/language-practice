---
name: Noun helper without NlgLib
overview: Re-implement the French noun Handlebars helper without NlgLib by using rosaenlg-pluralize-fr, french-adjectives, and the gender from the noun word object (word.type: nm/nf/nmf). This fixes the currently broken noun helper (which calls undefined getNlgLib) and keeps the Convex bundle small.
todos: []
isProject: false
---

# Noun helper re-implementation (no NlgLib)

## Current state

- In [convex/templateHelpers.ts](convex/templateHelpers.ts), **createNounHelper** calls **getNlgLib(locale)**, which is not defined (NlgLib import is commented out). The noun helper is therefore broken at runtime.
- Verb helper and post-process (rosaenlg-filter) already work without NlgLib.
- Dependencies **rosaenlg-pluralize-fr** and **french-adjectives** are already in the tree via the rosaenlg meta-package.

## Target behavior (unchanged API)

- **noun** helper: `word` (required), optional `adj`, `adj2`, `art` (`def`|`ind`), `num` (`S`|`P`).
- Output: determiner (if art) + noun (singular/plural) + up to two adjectives agreed in gender and number. Contractions (e.g. l'aile) remain the responsibility of the existing post-process.

## Implementation plan

### 1. Resolve gender for the noun phrase

- Use **only** the noun word-object's type: existing **wordTypeToGender(word.type)** — `nf` → F, `nm` → M, `nmf` → M. No inference from noun text; no nounGender function or exceptions list. If type is missing, default to `"M"` for safety.

### 2. Plural and adjectives

- **Plural**: Use **rosaenlg-pluralize-fr** default export: `pluralize(noun)` returns the plural form (handles multi-word phrases like "machine à laver"). The package uses CommonJS; use `require` or default import in a "use node" file.
- **Adjectives**: Use **french-adjectives** `agree(adjective, gender, number, noun, isBeforeNoun, contractsData)`:
  - `gender`: from step 1; `number`: S or P from `num`; `noun`: the noun string (for special agreement if needed); **isBeforeNoun**: `false` (pre-noun adjectives deferred per doc); **contractsData**: `undefined` (contractions handled by post-process).

### 3. Determiners

- Map from (gender, number, art) to string:
  - def: M+S → "le", F+S → "la", P → "les".
  - ind: M+S → "un", F+S → "une", P → "des".
  - No article: "".

### 4. Noun phrase assembly

- Order: **determiner + space (if any) + nounForm + " " + adj1Form + " " + adj2Form**, trimming empty parts. Noun form = singular or plural via pluralize; adj forms = agreed via `agree(...)`.

### 5. Wire into createNounHelper

- Replace the current NlgLib-based body of **createNounHelper** in [convex/templateHelpers.ts](convex/templateHelpers.ts) with the new logic:
  - Parse hash (word, adj, adj2, art, num) as today.
  - Resolve gender via **wordTypeToGender(word.type)** (default M if missing).
  - Resolve number (num === "P" ? "P" : "S").
  - Compute determiner, noun form (pluralize if P), agreed adj/adj2.
  - Return concatenated string.
- Remove any reference to **getNlgLib** and the commented NlgLib import.

### 6. Tests and docs

- **convex/templateHelpers.test.ts**: Existing test "noun helper: definite article for chat produces le chat" should pass. Add tests for: indefinite (un/une), plural (les chats, des chats), and adjective agreement (e.g. "grand" with nm/nf).
- **convex/practice.test.ts**: Keep or adjust the test "generates French question with noun helper (definite article)" so it still passes.
- **docs/features/Template Helpers.md**: Update the "Re-implementation of noun helper without NlgLib" section to state that implementation is done and point to templateHelpers; fix typo "nooun" → "noun" in the Approach section.

## File summary

- **convex/templateHelpers.ts**: Replace createNounHelper implementation with logic above; add getDeterminer (and optionally a small buildNounPhrase helper) in the same file or a thin convex/frenchNoun.ts; remove getNlgLib/NlgLib; import pluralize, agree.
- **convex/templateHelpers.test.ts**: Add cases for ind/plural/adjective; ensure existing chat test passes.
- **docs/features/Template Helpers.md**: Update re-implementation section; fix "nooun" → "noun".

No new scripts, no genderExceptions.json, no build step.

## Dependencies and Convex

- **rosaenlg-pluralize-fr**: small, no heavy deps; safe for Convex.
- **french-adjectives**: depends on french-contractions; we pass `undefined` for contractsData. If the package fails to bundle or is heavy, we can revisit (e.g. minimal agreement rules); current assumption is it is acceptable.

## Optional / later

- Use **french-determiners** `getDet` for more determiner cases (as in doc “Later improvements”).
- Support adjectives **before** the noun (adjPos) in a follow-up.

