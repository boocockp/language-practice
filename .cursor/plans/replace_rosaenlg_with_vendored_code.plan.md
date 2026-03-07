---
name: Replace rosaenlg with vendored code
overview: Remove the deprecated rosaenlg npm dependency and its patch by copying all used rosaenlg packages (pluralize-fr, commons, filter, french-verbs, french-adjectives, french-contractions, french-verbs-transitive) from the local rosaenlg codebase into the repo; keep only titlecase-french (npm) and french-verbs-lefff (devDep for script/test).
todos: []
isProject: false
---

# Replace rosaenlg with vendored code from local rosaenlg

## Current usage (all in [convex/templateHelpers.ts](convex/templateHelpers.ts))


| Import                                | Package               | Usage                                                           |
| ------------------------------------- | --------------------- | --------------------------------------------------------------- |
| `LanguageCommonFrench`                | rosaenlg-commons      | `langCommon.init()` then passed to `filter()`                   |
| `filter`                              | rosaenlg-filter       | `filter(text, langCommon, {})` for French contractions/elisions |
| `pluralizeFr` (default)               | rosaenlg-pluralize-fr | `pluralizeFr(nounText)` for plural nouns                        |
| `FrenchVerbs.getConjugation`, `Tense` | french-verbs          | Verb conjugation with local verb lookup proxy                   |
| `agree`                               | french-adjectives     | Adjective agreement (gender/number) for noun helper             |


The filter (LanguageFilterFrench) uses `french-contractions` (`contracts()`) and `titlecase-french`. The app does **not** import `rosaenlg-lib` (NlgLib). Verb conjugation uses `french-verbs` + a local proxy ([convex/frenchConjugation/](convex/frenchConjugation/)).

## Dependency changes

- **Remove**: `rosaenlg` from dependencies; delete [patches/rosaenlg-lib+4.4.0.patch](patches/rosaenlg-lib+4.4.0.patch); remove `postinstall: "patch-package"` if no other patches remain.
- **Add direct dependency**: `titlecase-french` only (independent of rosaenlg; used by vendored filter).
- **Add devDependency**: `french-verbs-lefff` (used by [scripts/buildIrregularVerbs.mjs](scripts/buildIrregularVerbs.mjs) and [convex/frenchConjugation/verbConjugation.test.ts](convex/frenchConjugation/verbConjugation.test.ts) to read `conjugations.json`; not used at runtime by vendored code).
- **Do not add** `french-verbs`, `french-adjectives`, or `french-contractions` as npm deps; they are vendored (same repo, deprecated).

## Vendored code layout

Copy from `/Users/paul/dev/rosaenlg/` into the repo. Use **Option A** for the filter (copy entire package). All vendored code under e.g. `convex/vendor/` so Convex can import it. Preserve Apache-2.0 (or upstream) license headers.

### 1. Pluralize French (single file)

- **Source**: `packages/rosaenlg-pluralize-fr/src/index.js` (plain JS, ~100 lines).
- **Target**: e.g. `convex/lib/pluralizeFr.ts` — copy logic, export `pluralizeFr(fullStr: string): string`. No sub-dependencies.
- Remove [convex/rosaenlg-pluralize-fr.d.ts](convex/rosaenlg-pluralize-fr.d.ts) and [src/rosaenlg-pluralize-fr.d.ts](src/rosaenlg-pluralize-fr.d.ts).

### 2. RosaeNLG commons (French only)

- **Sources** (from `packages/rosaenlg-commons/src/`): `LanguageCommon.ts`, `LanguageCommonFrench.ts`, `Constants.ts`, `DictManager.ts`. Do **not** copy `helper.ts` or other language classes.
- **Target**: `convex/vendor/rosaenlg-commons/`. Adjust imports to relative. Same class/API so the filter receives `LanguageCommon`-compatible instances.

### 3. French contractions (vendor — deprecated in rosaenlg repo)

- **Sources** (from `packages/french-contractions/src/`): `index.ts`, `vowel.ts`, `hmuet.ts`. No npm deps.
- **Target**: `convex/vendor/french-contractions/`. Used by vendored french-verbs, french-adjectives, and rosaenlg-filter.

### 4. French verbs transitive (vendor — data only)

- **Source**: `packages/french-verbs-transitive/resources/transitive.json` (or built `dist/transitive.json`). french-verbs imports this list.
- **Target**: e.g. `convex/vendor/french-verbs-transitive/transitive.json`. Vendored french-verbs will import from this path.

### 5. French verbs (vendor — deprecated in rosaenlg repo)

- **Source**: `packages/french-verbs/src/index.ts` (single file). It imports: `french-contractions` (vendored), `french-verbs-lefff` (types + avoir/être conj), `french-verbs-transitive/dist/transitive.json` (vendored JSON).
- **Target**: `convex/vendor/french-verbs/`. Point imports to vendored `french-contractions` and vendored `french-verbs-transitive` JSON. For `french-verbs-lefff`: copy only the **type** definitions (`VerbInfo`, `VerbInfoIndex`, `VerbsInfo`) from `packages/french-verbs-lefff/src/index.ts` into the vendor (e.g. `convex/vendor/french-verbs-lefff-types.ts`) so runtime does not depend on the npm package; the avoir/être conjugations are inlined in french-verbs. Keep npm `french-verbs-lefff` as **devDependency** only for the regression test and buildIrregularVerbs script (they need `conjugations.json`).

### 6. French adjectives (vendor — deprecated in rosaenlg repo)

- **Source**: `packages/french-adjectives/src/index.ts` (single file). Imports `french-contractions` (`contracts`, `ContractsData`).
- **Target**: `convex/vendor/french-adjectives/`. Point `french-contractions` to vendored package.

### 7. RosaeNLG filter (Option A — entire package)

- **Sources** (from `packages/rosaenlg-filter/src/`): Copy the **entire** filter package (all 17 TS files): `index.ts`, `languageFilterHelper.ts`, `LanguageFilter.ts`, `LanguageFilterFrench.ts`, `LanguageFilterEnglish.ts`, `LanguageFilterGerman.ts`, `LanguageFilterItalian.ts`, `LanguageFilterSpanish.ts`, `LanguageFilterOther.ts`, `punctuation.ts`, `clean.ts`, `protect.ts`, `protectTag.ts`, `html.ts`, `titlecase.ts`, `interfaces.ts`, `index.d.ts`.
- **Target**: `convex/vendor/rosaenlg-filter/`. Point `rosaenlg-commons` to `../rosaenlg-commons` (vendored). Point `french-contractions` to `../french-contractions` (vendored). Keep **npm** dependency `titlecase-french`; the filter imports it and we do not vendor it. Remove or stub dependencies that are only for other languages (`better-title-case`, `english-a-an`, `english-a-an-list`) if they are not on the French code path, or add them as npm deps if the filter index imports them unconditionally (check before removing).

After vendoring, [convex/templateHelpers.ts](convex/templateHelpers.ts) should import:

- `LanguageCommonFrench` from vendored commons
- `filter` from vendored filter
- `pluralizeFr` from local pluralize module
- `FrenchVerbs` (default) and type `Tense` from vendored french-verbs
- `agree` from vendored french-adjectives

## Files to remove or update

- **Delete**: [patches/rosaenlg-lib+4.4.0.patch](patches/rosaenlg-lib+4.4.0.patch), [convex/rosaenlg-pluralize-fr.d.ts](convex/rosaenlg-pluralize-fr.d.ts), [src/rosaenlg-pluralize-fr.d.ts](src/rosaenlg-pluralize-fr.d.ts).
- **Edit**: [package.json](package.json) — remove `rosaenlg`; add `titlecase-french`; add devDep `french-verbs-lefff`; remove or keep `postinstall` / `patch-package` depending on other patches.
- **Docs**: [AGENTS.md](AGENTS.md), [docs/features/Verb conjugation.md](docs/features/Verb conjugation.md), [docs/features/Template Helpers.md](docs/features/Template Helpers.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — remove references to the rosaenlg patch and rosaenlg npm packages; document that French NLG helpers use vendored code from the rosaenlg repo (path or URL), plus npm `titlecase-french` and devDep `french-verbs-lefff` for script/test.

## Verification

- `pnpm install` (no patch, no rosaenlg; only titlecase-french and devDep french-verbs-lefff).
- `pnpm run typecheck` and `pnpm run lint` pass.
- Convex: run `pnpm exec convex dev` and trigger question generation for French (noun, verb, postProcess).
- Run [convex/frenchConjugation/verbConjugation.test.ts](convex/frenchConjugation/verbConjugation.test.ts).
- Run `node scripts/buildIrregularVerbs.mjs` to confirm the irregular verb dictionary still builds.

## Optional: reference the rosaenlg copy in docs

In [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) or a short "Vendored NLG" note, state that French pluralization, commons, filter, french-verbs, french-adjectives, and french-contractions are copied from the rosaenlg codebase (e.g. local path `/Users/paul/dev/rosaenlg` or repo URL) to avoid deprecated npm packages and patches; upstream is Apache-2.0. Only `titlecase-french` remains from npm for NLG.