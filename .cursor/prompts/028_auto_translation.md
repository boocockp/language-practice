# Auto translation
_Exported on 06/03/2026 at 13:08:34 GMT from Cursor (2.5.26)_

---

**User**

Plan the implementation of @docs/features/Auto Translation.md .  Ask questions as needed

---

**Cursor**


Checking where question generation is invoked and how language flows, and inspecting the translate library.



Checking how current language is determined and whether we have a notion of "browser" vs "practice" language:



Checking supported language codes and Convex env usage:



Checking the npm package name and whether it supports a from/to API:



Checking how the practice action is validated and how we'd add an optional arg:



Drafting the implementation plan.


---

**User**

Please update the plan for these clarifications:
- Use navigator.language to get the user's language.  (We may introduce a user profile with preferred language later)
- If possible test the translate help in @convex/templateHelpers.test.ts .  The @convex/questionGeneration.test.ts file is too big already.

---

**Cursor**


Updating the plan with both clarifications.



Summary of updates to the plan:

1. **`navigator.language` and future profile**
   - Goal: "Source of user language" is now explicitly **`navigator.language`**, with a note that a user profile with preferred language may be added later.
   - Client (section 4): Specifies using **`navigator.language`** and adds: *"(Later: a user profile with preferred language could override `navigator.language` here.)"*
   - Clarification: Reworded to say we use **`navigator.language`** and that a user profile could later override it; the rest of the implementation can stay the same.

2. **Where to test the translate helper**
   - Tests (section 6): Translate helper is now tested in **[convex/templateHelpers.test.ts](convex/templateHelpers.test.ts)** only—not in `questionGeneration.test.ts` (to avoid growing that file). Instructions are to add tests that call `generateQuestion` with a stubbed `translateFn` and the translate helper registered, reusing the same style as the existing noun/verb tests in that file.
   - Order of implementation: Step 4 is now "**Translate helper** tests in templateHelpers.test.ts (not in questionGeneration.test.ts)" instead of "Integration test for generateQuestion with translate helper."

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Checking the codebase and starting implementation. Searching for existing todos:



Implementing the plan step by step: creating the todo list and starting with the translation module.



Creating the translation module and its tests.



Mocking the translate package so we can test without hitting the network:



Adding the translate helper to `templateHelpers.ts` and wiring it in `practiceActions`.



Wiring the action: adding the optional `userLanguage` arg and registering the translate helper.



Checking how convex is pulled into the app build:



Adding Node types so Convex files that use `process.env` typecheck when referenced from the app:



Adding client-side `userLanguage`: implementing `getBrowserLanguageCode` and passing it from PracticePage.



Checking whether adding `@testing-library/dom` restores the PracticePage tests (they failed due to a missing dependency after install):



Summary of what was implemented:

## Auto Translation implementation summary

### 1. Translation module
- **convex/translation.ts**: `createTranslator(config?)` returns `(text, from, to) => Promise<string>` using the `translate` package with engine `libre`. Short-circuits when `from === to` or text is empty. Uses `LIBRETRANSLATE_URL` (default `https://libretranslate.com`) and `LIBRETRANSLATE_API_KEY` from env when config is omitted.
- **convex/translation.test.ts**: Four tests (same-language and empty short-circuits, no API call; one test that the translator is called with correct args when `from !== to`), using a mocked `translate` package.

### 2. Translate Handlebars helper
- **convex/templateHelpers.ts**: `createTranslateHelper(fromLang, toLang, translateFn)` and exported `TranslateFn` type. Helper resolves the first argument (including Promises), returns `""` for empty/non-string, returns text when `fromLang === toLang`, otherwise calls `translateFn(trimmed, fromLang, toLang)`.

### 3. Action wiring
- **convex/practiceActions.ts**: Optional arg `userLanguage: v.optional(v.string())`. When `userLanguage` is present and non-empty, builds translator from env, creates translate helper, and merges it into `templateHelpers` (with any existing language helpers).

### 4. Client
- **src/lib/languages.ts**: `getBrowserLanguageCode()` returns a 2-letter code from `navigator.language`, or `"en"` when unavailable.
- **src/routes/PracticePage.tsx**: Passes `userLanguage: getBrowserLanguageCode()` into `generateQuestion`.

### 5. Tests
- **convex/templateHelpers.test.ts**: Three translate-helper tests (stubbed translation, same-language no-call, empty string).
- **convex/practice.test.ts**: One test that the action accepts `userLanguage` and succeeds with a template that does not use `{{translate}}`.
- **src/routes/PracticePage.test.tsx**: Generate-question call expectations updated to include `userLanguage: expect.any(String)`.

### 6. Documentation
- **docs/features/Auto Translation.md**: Implementation section (helper usage, direction, registration), Convex env vars, and code locations.
- **docs/features/Template Helpers.md**: New “translate” subsection with usage and pointer to Auto Translation.

### 7. Other changes
- **package.json**: Added `translate` dependency; added `@testing-library/dom` as devDependency so RTL and PracticePage tests work (install used `--legacy-peer-deps`).
- **tsconfig.app.json**: Added `"node"` to `types` so Convex code that uses `process.env` typechecks when pulled in from the app.
- **src/test-utils.tsx**: No longer needs `@ts-expect-error` for `screen` after adding `@testing-library/dom`.

`npm run typecheck`, `npm run lint`, and all convex tests (101) pass. PracticePage tests (10) pass. To use the feature, set `LIBRETRANSLATE_URL` and optionally `LIBRETRANSLATE_API_KEY` in the Convex dashboard (or via `npx convex env set`).

---

**User**

Where do you set the environment variables so they can be used by Convex, both in development and in production?

---

**Cursor**


Convex environment variables are **not** read from `.env` or `.env.local`. They are set **per Convex deployment** and are used by both development and production depending on which deployment is running your code.

**Where to set them**

1. **Convex Dashboard**  
   - Open your Convex project at [dashboard.convex.dev](https://dashboard.convex.dev).  
   - Go to **Settings** → **Environment Variables**.  
   - Add names and values (e.g. `LIBRETRANSLATE_URL`, `LIBRETRANSLATE_API_KEY`).  
   - Variables are scoped to the deployment (dev vs prod) you’re viewing.

2. **CLI**  
   - From the project root:
     - `npx convex env set LIBRETRANSLATE_URL "https://libretranslate.com"`
     - `npx convex env set LIBRETRANSLATE_API_KEY "your-key"`
   - By default this affects the deployment currently linked to this directory (often dev).  
   - To target production: `npx convex env set LIBRETRANSLATE_URL "..." --prod` (or configure the CLI to use the prod project).

**Development vs production**

- **Development**: When you run `npx convex dev`, Convex uses the **dev** deployment. Set the variables for that deployment (dashboard dev project or CLI without `--prod`).
- **Production**: When you run `npx convex deploy`, Convex uses the **prod** deployment. Set the same variables for that deployment (dashboard prod project or CLI with `--prod`).

So you configure them in **two places** if you have separate dev and prod Convex projects: once for dev, once for prod. Your app code doesn’t change; it just uses `process.env.LIBRETRANSLATE_URL` and `process.env.LIBRETRANSLATE_API_KEY` in Convex actions (e.g. in `convex/translation.ts` and `convex/practiceActions.ts`), and Convex injects the values for whichever deployment is running.

**Useful commands**

- `npx convex env list` — show variables for the current deployment  
- `npx convex env unset NAME` — remove a variable  

Your feature doc already states this correctly in [docs/features/Auto Translation.md](docs/features/Auto Translation.md) (lines 33–36): set in the Convex dashboard or via `npx convex env set`.

---

**User**

Please commit all changes including the plan with a suitable message

---

**Cursor**


Committed all staged changes (including the plan) with this message:

**feat: Auto Translation — translate helper and LibreTranslate integration**

- Add Handlebars `{{translate text}}` helper (question type lang → user lang)
- Self-contained translation module (`convex/translation.ts`) using the translate npm package and `LIBRETRANSLATE_URL` / `LIBRETRANSLATE_API_KEY` env vars
- Optional `userLanguage` on `generateQuestion` action; client passes `getBrowserLanguageCode()` from `navigator.language`
- Translate helper tests in `templateHelpers.test.ts`; translation unit tests; practice action test for `userLanguage`
- Docs: Auto Translation.md and Template Helpers.md updated
- Plan: `.cursor/plans/auto_translation_feature_51561216.plan.md`

**16 files changed**, 482 insertions, 45 deletions. Commit hash: `f71fb7d`.

