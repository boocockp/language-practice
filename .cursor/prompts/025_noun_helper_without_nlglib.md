# Noun helper without NlgLib
_Exported on 04/03/2026 at 10:40:46 GMT from Cursor (2.5.26)_

---

**User**

Plan the implementation of the changed requirements at @docs/features/Template Helpers.md:64-105 .  Ask further questions as needed

---

**Cursor**


Gathering the current implementation and dependencies to plan the noun-helper reimplementation.



Checking for `getNlgLib`, the structure of `french-words-gender-lefff`, and the APIs of `rosaenlg-pluralize-fr` and `french-adjectives`.



Checking the structure of `words.json` and whether `french-adjectives` is usable in Convex:



Checking how the noun helper receives word type and whether we should prefer word type or inferred gender:



Creating the implementation plan.


---

**User**

I have changed the Approach section to remove the nounGender function - just use nm or nf type to determine gender.  Revised Approach: @docs/features/Template Helpers.md:87-95 .  Please update the plan

---

**Cursor**


Updating the plan to use only the word object's type (nm/nf/nmf) for gender and to remove nounGender, gender rules, and the build script.



Updating the plan to use only the noun word-object's type (nm/nf/nmf) for gender and to remove nounGender, the build script, and genderExceptions.



Applying the updates in smaller edits:



Summary of updates to the plan:

**Overview**
- Gender now comes only from the **noun word object** (`word.type`: nm/nf/nmf). Removed all mention of nounGender and genderExceptions.

**Removed**
- **Step 1 (was “Gender inference: rules + exceptions”)** – research and rule-based guess.
- **Step 2 (was “Build script: genderExceptions.json”)** – script and generated file.
- **Step 3 (was “nounGender(noun)”)** – rule-based + exceptions lookup.
- **french-words-gender-lefff** from current state and from Dependencies.
- **File summary table** entries for `convex/frenchNoun.ts` (nounGender), `convex/genderExceptions.json`, `scripts/buildGenderExceptions.mjs`, and the AGENTS.md build note.

**Renumbered and kept**
- **Step 1** – Resolve gender: use only **wordTypeToGender(word.type)** (nf→F, nm/nmf→M), default M if missing.
- **Steps 2–5** – Plural/adjectives, determiners, noun phrase assembly, wire into createNounHelper (unchanged aside from “Resolve gender via wordTypeToGender(word.type)”).
- **Step 6** – Tests and docs: no nounGender fallback test; doc update points to templateHelpers and fixes “nooun” → “noun”.

**File summary**
- Now a short bullet list: only `convex/templateHelpers.ts`, `convex/templateHelpers.test.ts`, and `docs/features/Template Helpers.md`. Explicit note: “No new scripts, no genderExceptions.json, no build step.”

**Dependencies**
- Removed the french-words-gender-lefff bullet; only rosaenlg-pluralize-fr and french-adjectives are listed.

The plan now matches the revised Approach: pluralize-fr, french-adjectives, gender from the supplied noun word-object, determiner by gender/number, then concatenation.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the noun-helper plan: checking existing todos and the codebase.



Implementing the noun helper: adding imports and helper functions, then replacing createNounHelper.



Removing the obsolete comment from the verb helper and running the typecheck.



Fixing the type error by narrowing the gender to GendersMF:



Checking the Convex tsconfig and fixing the type/require issues:



Trying a default import for the CommonJS pluralize package to avoid Node's `require`:



Using a default ESM import for the CommonJS package:



Adding a module declaration for the pluralize package:



Moving the declaration into `src` so it's included by the app tsconfig:



Fixing lint: allowing unused parameters that start with `_` or adding eslint-disable.



Adding tests for indefinite article, plural, and adjective agreement:



Updating the docs and marking the tests todo complete.



Summary of what was implemented:

## 1. **convex/templateHelpers.ts**
- **Removed** NlgLib and any `getNlgLib` usage.
- **Imports**: `agree` from `french-adjectives`, `pluralizeFr` default from `rosaenlg-pluralize-fr`, and kept `FrenchVerbs` / `filter` for verb and post-process.
- **getDeterminer(gender, number, art)**  
  Returns `le`/`la`/`les` for `art="def"` and `un`/`une`/`des` for `art="ind"` from gender and number.
- **createNounHelper**  
  Uses only the noun word object:
  - Gender from **wordTypeToGender(word.type)** (nm→M, nf→F, nmf→M), default M.
  - Number from `num` (`"P"` or `"S"`).
  - Noun form: **pluralizeFr(nounText)** when plural, else `word.text`.
  - Determiner from **getDeterminer**.
  - Up to two adjectives with **agree(adjText, gender, number, nounText, false, undefined)**.
  - Phrase built as `[det, nounForm, ...agreedAdjs].filter(Boolean).join(" ")`.
- Unused `locale` parameters renamed to `_locale`; ESLint configured with `argsIgnorePattern: '^_'` so they are allowed.

## 2. **Module declaration**
- **src/rosaenlg-pluralize-fr.d.ts**  
  Declares the CommonJS pluralize module so the app typecheck succeeds.

## 3. **Tests (convex/templateHelpers.test.ts)**
- Existing: definite article “le chat”, verb “mange”.
- New: indefinite “un chat”, definite plural “les chats”, indefinite plural “des chats”, adjective with masculine “le chat grand”, adjective with feminine “la maison grande”.

## 4. **Docs (docs/features/Template Helpers.md)**
- Re-implementation section updated: implementation done in `convex/templateHelpers.ts`, no NlgLib.
- Requirements: gender from noun word-object (nm/nf/nmf); removed “rules and list of exceptions”.
- Approach: typo “nooun” → “noun”.
- Implementation notes: noun helper uses rosaenlg-pluralize-fr + french-adjectives + word type; verb uses rule-based conjugation; both live in `convex/templateHelpers.ts`.

## 5. **Lint**
- **eslint.config.js**: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'` so `_locale` is allowed.

`npm run typecheck` and `npm run lint` pass, and all 20 tests in `convex/templateHelpers.test.ts` and `convex/practice.test.ts` pass.

---

**User**

For the code present, we get this error:
```
Could not find a declaration file for module 'rosaenlg-pluralize-fr'. '/Users/paul/dev/language-practice/node_modules/rosaenlg-pluralize-fr/dist/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/rosaenlg-pluralize-fr` if it exists or add a new declaration (.d.ts) file containing `declare module 'rosaenlg-pluralize-fr';`
```
But typecheck does succeed.  Is this because the declaration file is in src and the code with the error is in convex?
Fix it, verify, and then give a concise explanation. @convex/templateHelpers.ts:10-13 

---

**Cursor**


Adding the module declaration to `convex/` so the Convex tsconfig (used by the IDE for files in `convex/`) can find it.



Adding a triple-slash reference in `templateHelpers.ts` so the declaration is always loaded for that file:



Summary of what was done:

**Fix**
1. **Added** `convex/rosaenlg-pluralize-fr.d.ts` with the same `declare module "rosaenlg-pluralize-fr"` as in `src/`.
2. **Added** `/// <reference path="./rosaenlg-pluralize-fr.d.ts" />` at the top of `convex/templateHelpers.ts` so that whenever this file is type-checked, the declaration is included.

**Verification**
- `npm run typecheck` passes.
- `npx tsc -p convex/tsconfig.json --noEmit` passes.
- No linter errors on `convex/templateHelpers.ts`.

**Why the error appeared**
- **`npm run typecheck`** uses `tsconfig.app.json`, which has `include: ["src"]`. Convex is only pulled in as a dependency of `src`. In that run, `src/rosaenlg-pluralize-fr.d.ts` is a root file, so the module is declared and the error doesn’t show.
- **In the IDE** (and when using `convex/tsconfig.json`), `convex/templateHelpers.ts` is type-checked in the Convex project, whose `include` is only `convex/**/*`. That project never loads `src/`, so it never saw `src/rosaenlg-pluralize-fr.d.ts` and reported the missing declaration.
- Putting the same declaration in **`convex/`** and referencing it from `templateHelpers.ts` makes the Convex project self-contained, so both the Convex typecheck and the IDE use the declaration and the error goes away.

---

**User**

Please commit all changes, includng the plan, with a suitable message

---

**Cursor**


Committed on branch `no-lefff` as `66a2a4e` with message:

**Re-implement noun helper without NlgLib**

- Replace NlgLib-based noun helper with rosaenlg-pluralize-fr and french-adjectives; use word type (nm/nf/nmf) for gender only
- Add getDeterminer() and phrase assembly in templateHelpers.ts
- Add module declarations for rosaenlg-pluralize-fr (convex + src)
- Add tests: indefinite, plural, adjective agreement (m/f)
- Update Template Helpers doc and Implementation notes
- ESLint: allow unused args matching ^_
- Add noun helper re-implementation plan

7 files changed, 323 insertions, 47 deletions.

