# Chat transcript: Replace rosaenlg with vendored code

## 1. Plan: replace rosaenlg with vendored code

**User:** The rosaenlg package has been deprecated, and pnpm is no longer installing it correctly. We were also using a package patch, which is undesirable. Please analyse where functions from this package and its sub-packages are used, and plan how to replace the functions with copies from the rosaenlg codebase. There is a copy of the latest code at /Users/paul/dev/rosaenlg/

**Outcome:** Plan created (`.cursor/plans/replace_rosaenlg_with_vendored_code.plan.md`) analysing usage in `convex/templateHelpers.ts`: rosaenlg-commons (LanguageCommonFrench), rosaenlg-filter (filter), rosaenlg-pluralize-fr (pluralizeFr), french-verbs (getConjugation, Tense), french-adjectives (agree). Plan: vendor pluralize-fr, rosaenlg-commons, rosaenlg-filter (Option A), remove patch and rosaenlg dep; add titlecase-french and devDep french-verbs-lefff.

---

## 2. Extend plan: vendor french-verbs, french-adjectives, french-contractions

**User:** The french-verbs, french-adjectives, french-contractions packages are part of the rosaenlg github repo, and they are also deprecated, so plan to replace these packages with vendored code too. The titlecase-french package is independent and can be used from npm. Use Option A under Vendored code layout/3./Sources.

**Outcome:** Plan updated: vendor french-contractions (index, vowel, hmuet), french-verbs-transitive (transitive.json), french-verbs (with local types from french-verbs-lefff), french-adjectives; keep only titlecase-french from npm for NLG and french-verbs-lefff as devDep for script/test. Filter remains Option A (entire package).

---

## 3. Implement the plan

**User:** Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself. To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

**Outcome:** Implementation completed:

1. **Pluralize French** — Added `convex/vendor/pluralizeFr.ts` from rosaenlg-pluralize-fr; removed `convex/rosaenlg-pluralize-fr.d.ts` and `src/rosaenlg-pluralize-fr.d.ts`.
2. **Vendored under `convex/vendor/`:** rosaenlg-commons (French + stubs for filter), french-contractions (3 files), french-verbs-transitive (transitive.json), french-verbs-lefff-types (types only), french-verbs (index.ts), french-adjectives (index.ts), rosaenlg-filter (full package, 17 files). All imports pointed to vendored paths; filter keeps npm titlecase-french, better-title-case, english-a-an, english-a-an-list.
3. **templateHelpers** — Imports switched to `./vendor/french-adjectives`, `./vendor/french-verbs`, `./vendor/rosaenlg-commons`, `./vendor/rosaenlg-filter`, `./vendor/pluralizeFr`.
4. **package.json** — Removed rosaenlg; added titlecase-french; added devDeps french-verbs-lefff, better-title-case, english-a-an, english-a-an-list. Deleted `patches/rosaenlg-lib+4.4.0.patch`.
5. **Docs** — Updated AGENTS.md, docs/features/Verb conjugation.md, docs/features/Template Helpers.md, docs/ARCHITECTURE.md for vendored NLG and new deps.
6. **Lint/typecheck** — Fixed vendored lint (unused params, type-only imports, regex escapes, DictManager any with eslint-disable); added `convex/vendor/**/*.d.ts` to tsconfig.app.json; added declare modules for titlecase-french and better-title-case in vendor/rosaenlg-filter.

**Verification:** typecheck and lint pass; 167/169 tests pass (all Convex/template tests pass; two existing UI test failures in QuestionTypesPage/WordsPage).

---

## 4. Save transcript and commit

**User:** /commit

**Outcome:** New transcript `.cursor/prompts/032_replace_rosaenlg_vendored_code.md`. Staged all changes and committed with message summarizing the vendoring and inclusion of plan/transcript.
