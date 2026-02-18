---
name: Cursor-ready Vite SPA setup
overview: Scaffold a Vite + React + TypeScript SPA using React Router (library mode), Tailwind for styling, Kumo for UI primitives, and prepare Convex for backend logic. Add Cursor-specific rules and lightweight docs so Cursor consistently follows your architecture and conventions.
todos:
  - id: scaffold-vite
    content: Create Vite React+TS project, baseline scripts, and repo structure.
    status: completed
  - id: router-pages
    content: Add React Router (library mode), AppLayout, and route components for /, /practice, /words, /question-types, /stats, /settings.
    status: completed
  - id: tailwind-cn
    content: Set up Tailwind + global styles and add a `cn()` utility using clsx + tailwind-merge.
    status: completed
  - id: cursor-rules-docs
    content: Add `.cursor/rules/*.mdc`, `AGENTS.md`, and `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md` templates.
    status: completed
  - id: convex-bootstrap
    content: Install Convex and run `npx convex dev` to bootstrap (user completes interactive auth/project creation).
    status: completed
  - id: kumo-integration
    content: After user confirms Kumo package/setup choice, integrate Kumo primitives and document conventions.
    status: completed
  - id: spa-rewrites
    content: Add SPA rewrite config for static hosting and document it in README.
    status: completed
isProject: false
---

## Goals

- Create a predictable repo structure and scripts so Cursor can reason about changes and you can validate them quickly.
- Establish a stable routing/layout pattern for your top-level pages: Home, Practice, Words, Question Types, Stats, Settings.
- Set up Tailwind (with a `cn()` helper) and leave clear conventions for combining Tailwind with Cloudflare Kumo components.
- Bootstrap Convex locally and document the intended data model and flows.
- Add `.cursor/rules/*.mdc` + `AGENTS.md` + `docs/*` so Cursor has persistent context.

## Target route map (React Router library mode)

- `/` → Home
- `/practice` → Practice
- `/words` → Words
- `/question-types` → QuestionTypes
- `/stats` → Stats
- `/settings` → Settings

Suggested router structure:

- `src/app/router.tsx`: `createBrowserRouter([...])`
- `src/app/AppLayout.tsx`: shared layout + nav
- `src/routes/*Page.tsx`: page components

## Planned repo structure

- `src/app/` (app shell, router, layout)
- `src/routes/` (route-level pages)
- `src/features/` (domain modules: practice/words/questionTypes/stats)
- `src/components/` (reusable components)
- `src/components/ui/` (thin wrappers around Kumo primitives with app defaults)
- `src/lib/` (helpers like `cn()`, api clients)
- `convex/` (created by Convex bootstrap: schema + functions)
- `docs/` (ARCHITECTURE, DATA_MODEL, DECISIONS)
- `.cursor/rules/` (Cursor rules)

## Cursor guidance files to add

- `[.cursor/rules/00-project-brief.mdc](.cursor/rules/00-project-brief.mdc)` (always apply): goals/stack/definition-of-done
- `[.cursor/rules/frontend-react.mdc](.cursor/rules/frontend-react.mdc)` (`src/**/*.{ts,tsx}`): React+TS conventions
- `[.cursor/rules/routing-react-router.mdc](.cursor/rules/routing-react-router.mdc)` (`src/**/*.{ts,tsx}`): router conventions, route file placement
- `[.cursor/rules/styling-tailwind.mdc](.cursor/rules/styling-tailwind.mdc)` (`src/**/*.{ts,tsx,css}`): Tailwind conventions + `cn()` requirement
- `[.cursor/rules/kumo-ui.mdc](.cursor/rules/kumo-ui.mdc)` (`src/**/*.{ts,tsx}`): how to use Kumo + when to wrap
- `[.cursor/rules/backend-convex.mdc](.cursor/rules/backend-convex.mdc)` (`convex/**/*.ts`): schema/function conventions and the conceptual collections (`words`, `questionTypes`, `attempts`)
- `[AGENTS.md](AGENTS.md)`: “how to run”, scripts, repo map, and “don’t guess” constraints for AI

## Docs to anchor behavior (so Cursor doesn’t invent details)

- `[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)`: request/response flow
  - generate question → render → submit answer → store attempt → pick next items
- `[docs/DATA_MODEL.md](docs/DATA_MODEL.md)`: fields + meanings
  - `words`, `questionTypes`, `attempts` (plus indexes you expect to need)
- `[docs/DECISIONS.md](docs/DECISIONS.md)`: short notes like “why Convex”, “scoring approach”, “selection approach”

## Implementation steps (what I can do vs what you do)

### Steps I can carry out (once you approve this plan and switch to execution mode)

- Scaffold the Vite app (React + TS) and set up npm scripts.
- Add React Router (library mode) and create the router/layout/pages per the route map.
- Add Tailwind configuration, global CSS entry, and the `cn()` helper (`clsx` + `tailwind-merge`).
- Add recommended project hygiene files (typical): `.editorconfig`, `README` run instructions, optional `.vscode/extensions.json` and `.vscode/settings.json`.
- Add `.cursor/rules/*.mdc`, `AGENTS.md`, and the `docs/*` templates.
- Add SPA rewrite config appropriate for static hosting (e.g. `public/_redirects` with `/* /index.html 200`).

### Steps you will need to do manually

- Convex account/auth + project creation during `npx convex dev` (interactive login, choose org/project name). I can run the command, but you’ll need to complete the prompts/auth flow.
- Confirm the exact Cloudflare Kumo packages + setup steps (the package names and required providers/styles can vary). After you confirm the intended Kumo install method, I can wire it in.
- Any hosting-specific settings beyond a standard SPA rewrite (depending on where you deploy).

## Validation checklist (quick)

- `npm run dev` works
- Routes render and nav works for all 6 pages
- Tailwind styles apply
- Typecheck/lint scripts run cleanly
- SPA refresh on a deep link works in your target host (rewrite to `index.html`)
- Convex dev runs and generates the `convex/` scaffolding after you complete login

