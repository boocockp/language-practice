# Project setup for Cursor integration
_Exported on 19/02/2026 at 8:18:20 GMT from Cursor (2.5.17)_

---

**User**

What is the best way to set up this brand new project to work effectively with Cursor?  The initial vision and technical choices are described in @README.md .
Please tell me what instructions, rules and configurations  I should create, and what setup steps I should follow, to enable Cursor to work effectively in this project

---

**Cursor**

Got it. I’ll first read your `README.md` to understand the vision/stack, then propose a Cursor-ready setup: project conventions, `/.cursor/rules/*` guidance, recommended extensions/settings, and a practical “first hour” checklist for getting high-quality AI help on this repo.

### What Cursor needs from this repo (so it can help well)
Your `README.md` defines a **TypeScript + React** app using **Cloudflare Kumo** UI and a **Convex** backend. For Cursor to be consistently effective, give it: (1) persistent project rules, (2) a clear architecture map, (3) predictable scripts/lint/test, (4) environment + data-model documentation.

### Create these Cursor rule files
Create a folder `.cursor/rules/` and add a few small, focused `.mdc` rules.

#### 1) `.cursor/rules/00-project-brief.mdc` (always apply)
```markdown
---
description: Project brief, goals, and definition of done
alwaysApply: true
---

# Language Practice App — Cursor brief

## Product goal
A web app for intensive vocabulary + grammar practice.
- Words collection
- Question types collection
- Generated questions + user responses stored to inform future selection

## Tech stack
- TypeScript, React
- Cloudflare Kumo component library for UI
- Convex for backend (data + functions)

## Definition of done (for changes)
- Types are sound (no `any` unless justified)
- UI uses Kumo components + accessible semantics
- Convex functions validate inputs and handle auth if applicable
- Add/update tests when logic changes
- Update docs when behavior changes
```

#### 2) `.cursor/rules/typescript-react.mdc` (for `**/*.{ts,tsx}`)
```markdown
---
description: TypeScript + React coding conventions
globs: **/*.{ts,tsx}
alwaysApply: false
---

# TypeScript + React conventions

- Prefer explicit types at module boundaries (props, public functions, Convex args/returns).
- Avoid `any`; use `unknown` + narrowing when needed.
- Keep components small; extract hooks for reusable logic.
- Prefer composition over prop drilling; introduce context intentionally.
- Accessibility: labels for inputs, correct button types, keyboard/focus behavior.
```

#### 3) `.cursor/rules/kumo-ui.mdc` (for `src/**/*.{ts,tsx}`)
```markdown
---
description: Cloudflare Kumo UI usage patterns
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Kumo UI patterns

- Use Kumo components as the default primitives (layout, form controls, buttons).
- Keep styling consistent with Kumo tokens/utilities; avoid bespoke CSS unless necessary.
- Build reusable UI components in `src/components/` (thin wrappers over Kumo).
```

#### 4) `.cursor/rules/convex-backend.mdc` (for `convex/**/*.ts`)
```markdown
---
description: Convex data model + function conventions
globs: convex/**/*.ts
alwaysApply: false
---

# Convex conventions

- Validate all function args (and normalize data) at the boundary.
- Keep business logic in Convex functions; keep React thin.
- Name functions by intent (e.g. `logAnswer`, `generateQuestion`, `pickNextItems`).
- Data model:
  - `words`
  - `questionTypes`
  - `attempts` (generated question + user response + scoring/metadata)
- Add indexes for selection queries you run frequently.
```

### Add “human docs” that massively improve Cursor’s accuracy
- **`docs/ARCHITECTURE.md`**: one-page map of frontend vs Convex, key flows (generate question → answer → store attempt → next selection).
- **`docs/DATA_MODEL.md`**: tables/fields + what each field means (especially scoring, scheduling, “needs practice” signals).
- **`docs/DECISIONS.md`** or ADRs: short notes like “Why Convex”, “How we score answers”, “Spaced repetition approach”.

### Recommended repo scaffolding (so Cursor can navigate predictably)
- **Frontend**: `src/` with `components/`, `features/` (words, practice, questionTypes), `lib/`, `routes/` (if using router)
- **Backend**: `convex/` (schema + functions)
- **Tests**: `src/**/__tests__` or `tests/` (pick one)
- **Env**: `.env.example` documenting required vars (especially Convex)

### Configurations that make Cursor’s suggestions “stick”
Even before you have lots of code, set up (or plan to set up):
- **Type checking**: `tsconfig.json` with strict mode
- **Lint + format**: ESLint + Prettier (so Cursor can follow and you can auto-fix)
- **Tests**: Vitest (typical for React+TS) or your preferred runner
- **Scripts**: `dev`, `build`, `test`, `lint`, `typecheck` in `package.json`

### Cursor workflow setup steps (quick checklist)
- **Use rules**: create the `.cursor/rules/*.mdc` files above early (they’ll guide every session).
- **Seed context**: write `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` before implementing selection/scoring logic.
- **Keep “source of truth” in docs**: when you change scoring/selection, update docs immediately—Cursor will then stay aligned.
- **Adopt consistent naming**: collections + Convex functions named by intent; Cursor will mirror patterns.

If you tell me whether you’re starting with **Vite** (typical) and whether you already created a **Convex project**, I can tailor the exact “first commit” file list (still as guidance, since you’re in Ask mode).

---

**User**

I will use Vite.  I have not yet created a Convex project.

---

**Cursor**

### Vite + React + TS: recommended “first hour” setup (Cursor-friendly)

#### 1) Initialize the repo (do this first)
- **Create the app**:

```bash
npm create vite@latest language-practice -- --template react-ts
cd language-practice
npm install
```

- **Initialize git** (highly recommended for Cursor + sane history):

```bash
git init
```

#### 2) Add baseline quality gates (so Cursor’s edits stay consistent)
- **Formatting + linting**: add Prettier + ESLint (or use Vite’s defaults and tighten them).
- **Typecheck script**: ensure you have a dedicated command Cursor can run mentally/you can run quickly:

```bash
npm run build
# and add a separate:
# "typecheck": "tsc -p tsconfig.json --noEmit"
```

- **Testing** (optional day 1, but great early): Vitest + React Testing Library.

#### 3) Add Convex (without an existing project)
Convex is designed to “bootstrap” a new project from your repo.

- **Install Convex**:

```bash
npm install convex
```

- **Start Convex dev** (this is the step that will create/link a Convex project and generate local files):

```bash
npx convex dev
```

This typically:
- Prompts you to log in / create a new Convex project
- Creates `convex/` (functions + `schema.ts`)
- Creates a generated API file used by the frontend
- Adds env/config needed to connect in dev

- **Wire the frontend to Convex** (high-level):
  - Add the Convex React provider in your app entry.
  - Use Convex queries/mutations from components/hooks.
  - Keep “selection/scoring” logic server-side (Convex) when possible.

#### 4) Add Kumo
Follow Cloudflare Kumo’s docs for the exact package(s) + setup. The key “Cursor-enabling” thing is: once you pick the import/style conventions, document them in one place (see rules below) so Cursor doesn’t invent patterns.

---

### Cursor instructions/rules/config to create for this repo

#### 1) Rules: keep them small, targeted, and file-scoped
Create these in `.cursor/rules/` (the content can be essentially what I proposed earlier), plus one Vite-specific rule:

- **`00-project-brief.mdc`** (always apply): product goal + stack + definition of done
- **`typescript-react.mdc`** (`**/*.{ts,tsx}`): TS/React conventions
- **`vite-conventions.mdc`** (`**/*.{ts,tsx}`):
  - Use `import.meta.env` correctly
  - Only expose client env vars with the `VITE_` prefix
  - Prefer path aliases if you set them up (and keep `tsconfig` + Vite config in sync)
- **`convex-backend.mdc`** (`convex/**/*.ts`): schema, validation, naming, indexes
- **`kumo-ui.mdc`** (`src/**/*.{ts,tsx}`): “default to Kumo components/tokens”

#### 2) Add “context docs” so Cursor stops guessing
Create (early!) these lightweight docs:
- `docs/ARCHITECTURE.md`: request flow (generate question → answer → log attempt → next pick)
- `docs/DATA_MODEL.md`: collections + fields (words, questionTypes, attempts) + meaning
- `docs/DECISIONS.md`: brief decisions (scoring approach, scheduling/spaced repetition approach, why Convex, etc.)

These become the anchor references you can point Cursor at with `@docs/DATA_MODEL.md`, etc.

#### 3) Add a “how to run” section in README
Cursor performs better when the repo has canonical commands. Include:
- dev server, tests, lint, typecheck
- Convex dev command and prerequisites

---

### Setup steps I’d follow next (in order)
- **Scaffold Vite app**
- **Add ESLint/Prettier + typecheck script**
- **Run `npx convex dev` to create/link your Convex project**
- **Create the 3 docs** (`ARCHITECTURE`, `DATA_MODEL`, `DECISIONS`)
- **Write the `.cursor/rules/*.mdc` files** so Cursor follows your intended patterns from day 1

If you tell me whether you want **routing** (React Router) and whether you prefer **Tailwind vs “Kumo-only” styling**, I can suggest a concrete folder structure + the exact minimal doc templates to drop into `docs/` (still as guidance in Ask mode).

---

**User**

I will use Tailwind styling.  I will use React Router in SPA mode as described here @React Router 

---

**Cursor**

### Key decision first: React Router “framework SPA” vs Vite SPA
What you linked (`react-router.config.ts`, `react-router build`, `build/client`) is **React Router’s framework mode SPA**. That stack generally **replaces Vite’s build pipeline**, not “runs inside” it.

Given you said “I will use Vite”, the clean choice is:

- **Option A (recommended with Vite)**: React Router **as a library** (e.g. `createBrowserRouter` / `RouterProvider`) + Vite build.
- **Option B**: React Router **framework SPA** (ssr: false) and **don’t use Vite** as the primary scaffold.

Everything below assumes **Option A** (Vite + React Router library) and notes what changes for Option B where relevant.

---

### Cursor setup: what to create (high leverage)
#### 1) `.cursor/rules/` (persistent AI behavior)
Create these rules (small, focused):

- **`00-project-brief.mdc`** (always apply): goal, stack, “definition of done”, core collections (`words`, `questionTypes`, `attempts`).
- **`frontend-react.mdc`** (`src/**/*.{ts,tsx}`): component conventions, hooks, state boundaries, accessibility.
- **`styling-tailwind.mdc`** (`src/**/*.{ts,tsx,css}`): Tailwind usage rules (see below).
- **`routing-react-router.mdc`** (`src/**/*.{ts,tsx}`): routing conventions (file layout, loaders vs component fetching, error boundaries).
- **`backend-convex.mdc`** (`convex/**/*.ts`): schema conventions, function naming, validation, indexing, auth patterns.

Tailwind rule should explicitly tell Cursor things like:
- Prefer **Tailwind utilities**; avoid ad-hoc CSS except for globals.
- Use a single `cn()` helper (e.g. `clsx` + `tailwind-merge`) for conditional classes.
- Prefer extracting repeated class sets into small components or variants (often `class-variance-authority`) rather than copy/paste.

#### 2) `AGENTS.md` (or `docs/AI_CONTEXT.md`)
Add a short “AI handoff” doc Cursor can follow when you say “read AGENTS”:
- **Commands**: `npm run dev`, `npm run test`, `npm run lint`, `npm run typecheck`, `npx convex dev`
- **Repo map**: where routes/components/features live
- **Non-goals**: styling constraints (Kumo + Tailwind boundaries), “don’t invent DB tables”, etc.

#### 3) `docs/ARCHITECTURE.md` + `docs/DATA_MODEL.md`
These two eliminate most “AI guessing”:
- **Architecture**: generate question → render → submit answer → store attempt → selection algorithm.
- **Data model**: exact fields + meaning + indexes you expect.

---

### Vite + Tailwind + React Router (library) setup steps
#### 1) Scaffold with Vite React TS
```bash
npm create vite@latest language-practice -- --template react-ts
cd language-practice
npm install
```

#### 2) Add Tailwind (Vite path)
Follow Tailwind’s Vite+React guide, but enforce conventions early:
- Add `src/index.css` (Tailwind base/components/utilities) or `src/styles.css`
- Add `tailwind.config.*` with `content` including `index.html` and `src/**/*.{ts,tsx}`

Strongly recommended add-ons for a good Cursor + Tailwind experience:
- **`clsx` + `tailwind-merge`** and a `cn()` utility
- (Optional) **`class-variance-authority`** for component variants (buttons, chips, etc.)

#### 3) Add React Router (library mode)
```bash
npm install react-router-dom
```
Conventions to document in your routing rule:
- Use `createBrowserRouter` + `RouterProvider`
- Centralize routes in `src/routes/` (or `src/app/router.tsx`)
- Use route-level error boundaries
- Put route components in `src/routes/<RouteName>.tsx` and shared UI in `src/components/`

SPA deployment note to include in README: your host must rewrite all paths to `index.html`.

---

### Convex setup (since you haven’t created a project yet)
Convex is easiest to bootstrap from the repo:
```bash
npm install convex
npx convex dev
```
That flow will prompt you to create/link a Convex project and will generate the local Convex scaffolding. In your Convex rule, tell Cursor:
- All business logic around “what to practice next” should live in Convex functions
- `attempts` is append-only (usually) and drives scheduling

---

### What changes if you insist on React Router “framework SPA” (your link)
If you want the `react-router build` / `react-router.config.ts (ssr: false)` setup, I’d **not start from Vite**. You’d scaffold from React Router’s framework tooling instead, and your Cursor rules should reference:
- `react-router.config.ts`
- build output `build/client`
- the “SSR-safe even when ssr disabled for pre-render” constraint from the docs (no `window` in initial render)

---

### Recommended “Cursor-friendly” conventions for *this* stack (Kumo + Tailwind)
Because you’re using both:
- **Kumo**: default for components (buttons/inputs/layout primitives if provided)
- **Tailwind**: layout glue + spacing + responsive composition around those components
- Document “when to wrap Kumo vs when to style directly” in `kumo-ui.mdc` + `styling-tailwind.mdc`

If you want, I can give you copy-paste-ready contents for the 5 `.mdc` rules + an `AGENTS.md` template tailored to your exact folder layout (once you decide Option A vs Option B).

---

**User**

I will follow Option A and use a Vite SPA with React router as a library

---

**Cursor**

### Recommended “Cursor-effective” setup (Option A: Vite SPA + React Router library)

#### 1) Scaffold + baseline deps
```bash
npm create vite@latest language-practice -- --template react-ts
cd language-practice
npm install

npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge
# optional but nice for variants:
npm install class-variance-authority
```

#### 2) Create these repo files/folders (high leverage for Cursor)
- **`.cursor/rules/`**: persistent AI rules (see below)
- **`AGENTS.md`**: “how to work in this repo” for humans + Cursor
- **`docs/ARCHITECTURE.md`** and **`docs/DATA_MODEL.md`**: anchor truth so Cursor stops guessing
- **`.env.example`**: document required env vars (Convex will add some later)

#### 3) The `.cursor/rules/*.mdc` rules to create (copy/paste templates)

##### `.cursor/rules/00-project-brief.mdc` (always apply)
```markdown
---
description: Project brief + definition of done
alwaysApply: true
---

# Language Practice App (Cursor brief)

## Goal
Help language learners intensively practice vocabulary + grammar.

## Core data (conceptual)
- words
- questionTypes
- attempts (generated question + user response + scoring/metadata)

## Stack
- TypeScript + React (Vite SPA)
- React Router (library mode)
- Tailwind CSS for styling
- Cloudflare Kumo component library for UI primitives
- Convex backend (schema + functions)

## Definition of done
- Typecheck passes
- Lint/format pass
- UI uses Kumo + Tailwind conventions
- Convex functions validate inputs and keep business logic server-side
- Docs updated when behavior changes (ARCHITECTURE/DATA_MODEL)
```

##### `.cursor/rules/frontend-react.mdc` (`src/**/*.{ts,tsx}`)
```markdown
---
description: React + TS conventions for frontend
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Frontend conventions

- Prefer functional components + hooks.
- Keep route components thin; put reusable UI in `src/components/` and domain logic in `src/features/`.
- No `any` without comment justification; prefer `unknown` + narrowing.
- Accessibility is required (labels, focus, keyboard, semantic elements).
```

##### `.cursor/rules/routing-react-router.mdc` (`src/**/*.{ts,tsx}`)
```markdown
---
description: React Router (library mode) conventions
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Routing conventions (Vite SPA)

- Use `createBrowserRouter` + `RouterProvider`.
- Define routes in `src/app/router.tsx` (or `src/routes/router.tsx`) as the single source of truth.
- Route components live in `src/routes/`.
- Add route-level error boundaries for robust UX.
- SPA deploy requires rewriting all paths to `/index.html`.
```

##### `.cursor/rules/styling-tailwind.mdc` (`src/**/*.{ts,tsx,css}`)
```markdown
---
description: Tailwind styling conventions
globs: src/**/*.{ts,tsx,css}
alwaysApply: false
---

# Tailwind conventions

- Prefer Tailwind utilities over custom CSS.
- Use a single `cn()` helper (clsx + tailwind-merge) for conditional class strings.
- Extract repeated styling into components/variants (optionally CVA).
- Avoid inline styles except for truly dynamic values.
```

##### `.cursor/rules/kumo-ui.mdc` (`src/**/*.{ts,tsx}`)
```markdown
---
description: Cloudflare Kumo UI usage conventions
globs: src/**/*.{ts,tsx}
alwaysApply: false
---

# Kumo UI conventions

- Default to Kumo components for form controls, buttons, and common UI primitives.
- Use Tailwind for layout/spacing/composition around Kumo components.
- Wrap Kumo primitives in `src/components/ui/` when you need app-specific defaults.
```

##### `.cursor/rules/backend-convex.mdc` (`convex/**/*.ts`)
```markdown
---
description: Convex schema + function conventions
globs: convex/**/*.ts
alwaysApply: false
---

# Convex conventions

- All inputs validated at the function boundary.
- Business logic for scoring/selection lives in Convex, not React.
- Name functions by intent (`generateQuestion`, `logAttempt`, `pickNextItems`).
- Keep `attempts` append-only unless there’s a strong reason.
- Add indexes for any frequently-used selection queries.
```

#### 4) `AGENTS.md` (template)
Create this at repo root:
```markdown
## Working in this repo

### Commands
- dev: `npm run dev`
- typecheck: `npm run typecheck`
- lint: `npm run lint`
- test: `npm run test`
- convex dev: `npx convex dev`

### Structure (intended)
- `src/app/` app shell + router
- `src/routes/` route components
- `src/features/` domain modules (words, practice, question types)
- `src/components/` reusable components
- `src/components/ui/` app-wrapped Kumo primitives
- `convex/` backend schema + functions
- `docs/` architecture + data model

### Project principles
- Keep selection/scoring on the backend (Convex)
- Keep UI accessible and consistent (Kumo + Tailwind)
- Update `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` when behavior/data changes
```

#### 5) Convex bootstrap (when ready)
After the Vite app runs, bootstrap Convex:
```bash
npm install convex
npx convex dev
```
That will walk you through creating/linking the Convex project and will generate the needed `convex/` scaffolding.

---

### One small but important deployment note (SPA)
In your README, document that your static host must rewrite all paths to `index.html` (otherwise deep links 404).

---

If you want, paste your intended top-level pages (e.g. “Practice”, “Words”, “Question Types”, “History/Stats”, “Settings”), and I’ll suggest a route map + minimal folder layout that Cursor will follow reliably.

---

**User**

Use this list of top-level pages:
Home (no pathname)
Practice
Words
Question Types
Stats
Settings

Please prepare a plan to set up the project as you have described, and tell me which steps you can carry out and which I will need to do manually

---

**Cursor**

I’m going to quickly inspect the current repo contents (it looks basically empty aside from the README), then I’ll produce a concrete step-by-step setup plan with the exact route map for your pages and a clear split between what I can automate vs what you’ll need to do manually (mainly interactive Convex login/project creation).

---

**User**

I want to use Kumo styled components (not primitives) with Tailwind CSS.  Does this answer your question "Confirm the exact Cloudflare Kumo packages + setup steps"?

---

**Cursor**

That answers the *style approach* part (use Kumo’s pre-styled components, Tailwind for layout/spacing), but we still need the exact **npm package(s)** and any required **CSS/provider setup**—those vary by Kumo version/distribution. I’ll quickly look up the current Kumo package naming, then ask you 1–2 concrete choices to lock it in for the plan.

Yes—**it answers the intent**, and now we also have the missing specifics:

- **Install method**: npm package (e.g. `@cloudflare/kumo`)
- **Theming**: use **Kumo’s recommended CSS/theme setup** alongside Tailwind

With that, the “Kumo integration” part of the plan becomes concrete: we’ll add `@cloudflare/kumo`, follow their Vite+Tailwind installation (CSS import + any provider/theme wrapper they require), then document the convention “Kumo styled components for UI; Tailwind for layout/spacing; use `cn()` for class composition.”

If you want one more detail locked in before execution: **should the app support dark mode on day 1** (Kumo theme + Tailwind `dark`), or keep light-only until later?

---

**User**

Light only until later, please

---

**Cursor**

I’ll pull Kumo’s current installation guidance to make the plan’s Kumo+Tailwind steps precise (and explicitly keep it light-mode only for now).

### Updates to the plan (based on your Kumo + Tailwind + light-only decisions)

- **Kumo install/setup is now fully specified**:
  - **Package**: `@cloudflare/kumo` (npm dependency)
  - **Tailwind integration (per Kumo docs)**: in your main CSS file we must add:
    - `@source "../node_modules/@cloudflare/kumo/dist/**/*.{js,jsx,ts,tsx}";` (Tailwind v4 won’t scan `node_modules` by default)
    - `@import "@cloudflare/kumo/styles/tailwind";` **before** `@import "tailwindcss";` so Kumo theme tokens register first
  - **Peer deps**: `@phosphor-icons/react` (along with React/ReactDOM you already have)

- **Classname merging**:
  - Kumo exports a `cn` utility, so we can **use Kumo’s `cn`** instead of adding our own `clsx` + `tailwind-merge` wrapper (unless you prefer your own). This simplifies dependencies and keeps conventions aligned with Kumo.

- **React Router integration point**:
  - Kumo exports a `LinkProvider`. With React Router, we should plan to wrap the app so Kumo components that render links can use React Router’s `Link` component.

- **Light-only for now**:
  - We will **not** add a theme toggle, Tailwind `dark` strategy, or any “dark mode” wiring. (Kumo tokens may still support dark later; we’ll defer all of that intentionally.)

### What I can do vs what you do (unchanged, but clarified)
- **I can do (in execution mode)**: install Kumo, wire CSS import order + `@source`, set up `LinkProvider`, build the router + pages, Tailwind setup, Cursor rules, docs templates, SPA rewrite config.
- **You must do manually**: the **interactive Convex** login/project creation during `npx convex dev` (you’ll complete the prompts/auth flow).

If you’re happy with these updates, the next step is simply: **tell me to begin executing the plan** (switch out of Plan mode), and I’ll implement it end-to-end with the light-only Kumo+Tailwind setup and the 6-page router.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Plan accepted—I'll now scaffold the Vite React+TS app in this repo root, then layer in routing, Tailwind+Kumo styling, Cursor rules/docs, and finally Convex bootstrap + SPA rewrites. I’ll keep the existing project vision from your `README.md` but expand it with run/setup instructions.

Vite’s scaffolder aborted (it still tried to prompt/cancel because the repo isn’t empty). Next I’ll scaffold into a temporary subfolder non-interactively, then move the generated files into the repo root and proceed with installs.

I’ve scaffolded the Vite app into a temp folder; next I’ll move it into the repo root (keeping your existing `README.md` content to merge back in), then install dependencies.

### Implemented setup (all todos completed)
- **Vite + React + TS scaffold** in repo root, plus `typecheck` script and `.editorconfig`.
- **React Router (library mode)** with your top-level pages:
  - `/`, `/practice`, `/words`, `/question-types`, `/stats`, `/settings`
  - Files: `src/app/router.tsx`, `src/app/AppLayout.tsx`, `src/routes/*Page.tsx`
- **Tailwind CSS v4** wired via the Vite plugin, plus `cn()` helper at `src/lib/cn.ts`.
- **Kumo (styled components) + Tailwind integration**:
  - `src/index.css` now includes Kumo’s required `@source` + `@import "@cloudflare/kumo/styles/tailwind"` before Tailwind.
  - `LinkProvider` is wired with a small adapter: `src/app/KumoLinkAdapter.tsx`.
  - Home page demonstrates Kumo usage (`Surface`, `Text`, `Button`).
- **Cursor enablement**:
  - Rules added under `.cursor/rules/*.mdc`
  - `AGENTS.md` plus `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md`
- **SPA rewrites**: `public/_redirects` added and documented in `README.md`.

### What you still need to do manually (Convex)
Convex first-time setup is interactive and can’t run in this tool environment. Run this in a normal interactive terminal:

```bash
npx convex dev
```

That will create `convex/` and write `VITE_CONVEX_URL` to `.env.local` (see `.env.example`).

### Where to look
- **README**: `/Users/paul/dev/language-practice/README.md`
- **Cursor rules**: `/Users/paul/dev/language-practice/.cursor/rules/`
- **Router/pages**: `/Users/paul/dev/language-practice/src/app/` and `/Users/paul/dev/language-practice/src/routes/`

---

**User**

Please init a git repo in the project directory

Please init a git repo in the project directory

PLease commit all files with a message describing the initial set of files

---

**Cursor**

Created the initial commit on `main` (44 files, 5,824 insertions) with this message:

**Initial commit: Vite SPA with React, Router, Tailwind, Kumo, Convex**

- Vite + React + TypeScript scaffold with typecheck/lint scripts  
- React Router (library mode) with routes: Home, Practice, Words, Question Types, Stats, Settings  
- Tailwind CSS v4 + `cn()` utility (clsx + tailwind-merge)  
- Cloudflare Kumo styled components, LinkProvider adapter, Kumo styles in CSS  
- Convex dependency and `.env.example`; `convex/` folder for backend (run `npx convex dev` to bootstrap)  
- Cursor rules (`.cursor/rules/*.mdc`), AGENTS.md, docs (ARCHITECTURE, DATA_MODEL, DECISIONS)  
- SPA rewrite config (`public/_redirects`), README with run and Convex setup instructions  
- `.editorconfig` for consistent formatting  

`.env.example` is not in the commit; if it’s listed in `.gitignore`, you can remove it from there and add/commit it if you want it tracked.

