# Chat transcript: Convex vendor paths and better-title-case fix

## 1. Convex bundling error: better-title-case and Node "url"

**User:** Please assess the cause of this error, where the better-title-case package is used, and possible solutions. (Error: Could not resolve "url"; package "url" wasn't found but is built into node; path component must use "use node" or platform: 'node'.)

**Cause:** Convex bundles code from `convex/`; the npm package `better-title-case` uses `require('url')`. Only Convex files with "use node" get the Node runtime; the dependency is bundled in a non-Node context, so the bundler cannot resolve the Node built-in.

**Outcome:** Added vendored `convex/vendor/rosaenlgFilter/titleCaseEnUs.ts` with the same behavior as better-title-case but using the global `URL` (no Node `url` module). Updated `LanguageFilterEnglish.ts` to import from `./titleCaseEnUs` instead of `'better-title-case'`. Removed `better-title-case` from package.json devDependencies.

---

## 2. InvalidConfig: vendor/rosaenlg-filter path

**User:** Another error has appeared: InvalidConfig: vendor/rosaenlg-filter/protectTag.js is not a valid path. Path component rosaenlg-filter can only contain alphanumeric characters, underscores, or periods.

**Outcome:** Renamed `convex/vendor/rosaenlg-filter` → `convex/vendor/rosaenlg_filter` and updated the import in `convex/templateHelpers.ts` to `"./vendor/rosaenlg_filter"`.

---

## 3. InvalidConfig: vendor/rosaenlg-commons path

**User:** A similar problem: InvalidConfig for vendor/rosaenlg-commons/LanguageCommonItalian.js.

**Outcome:** Renamed `convex/vendor/rosaenlg-commons` → `convex/vendor/rosaenlg_commons` and updated all imports (templateHelpers.ts and every file under rosaenlg_filter that referenced `../rosaenlg_commons`).

---

## 4. Rename all vendor packages to camelCase

**User:** Another similar problem for vendor/french-verbs-lefff-types.js. Please rename all the packages under convex/vendor by changing the names to their camelCase version (e.g. french-adjectives → frenchAdjectives). Do the same for the rosaenlg_ packages already renamed.

**Outcome:** Renamed all vendor dirs and the standalone types file to camelCase:
- `french-adjectives` → `frenchAdjectives`
- `french-verbs` → `frenchVerbs`
- `french-verbs-transitive` → `frenchVerbsTransitive`
- `french-contractions` → `frenchContractions`
- `french-verbs-lefff-types.ts` → `frenchVerbsLefffTypes.ts`
- `rosaenlg_commons` → `rosaenlgCommons`
- `rosaenlg_filter` → `rosaenlgFilter`

Updated all imports in `convex/templateHelpers.ts` and in every affected file under the vendor modules. `pluralizeFr.ts` was left unchanged (already valid).

---

## 5. Clean up instrumentation

**User:** The issue has been fixed. Please clean up the instrumentation. (Repeated after the rosaenlg_commons fix and again after the full camelCase renames.)

**Outcome:** No debug instrumentation had been added during these fixes (build-time/config fixes only); nothing to remove.

---

## 6. Save transcript and commit

**User:** /commit

**Outcome:** This transcript was written to `.cursor/prompts/033_convex_vendor_paths_and_title_case_fix.md`. All changes were staged and committed with a single conventional commit message.
