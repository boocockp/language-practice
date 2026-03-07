---
name: Fast frontend tooling adoption
overview: Plan to adopt the tools from Christoph Nakazawa's "Fastest Frontend Tooling" article (tsgo, Oxfmt, Oxlint, npm-run-all2) in the language-practice repo, with clear boundaries for what can be automated in code, what you must do locally/editor/CI, and what does not apply.
todos: []
isProject: false
---

# Adopt Fast Frontend Tooling (cpojer.net article)

This plan maps each recommendation from [Fastest Frontend Tooling for Humans & AI](https://cpojer.net/posts/fastest-frontend-tooling.md) to your current setup and states what can be implemented in the repo, what you must do yourself, and what cannot be done.

---

## Current state

- **Package manager**: npm (lockfile: [package-lock.json](package-lock.json)).
- **TypeScript**: Two projects checked separately ([tsconfig.app.json](tsconfig.app.json), [tsconfig.node.json](tsconfig.node.json)); [build](package.json) uses `tsc -b` then Vite. Convex has its own [convex/tsconfig.json](convex/tsconfig.json) and is not part of `npm run typecheck`.
- **Lint**: ESLint 9 flat config ([eslint.config.js](eslint.config.js)) with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. No `@convex-dev/eslint-plugin` in use.
- **Format**: No Prettier; [.editorconfig](.editorconfig) only (indent 4 for TS/JS, max line length 120).
- **Vite**: Already in use; no change needed.

---

## 1. tsgo (TypeScript Go) — partial

**What it is:** Replace `tsc` with the Go-based `tsgo` for much faster type-checking.

**Can implement:**

- Install `@typescript/native-preview` and use `tsgo` for the **typecheck** script: `tsgo -p tsconfig.app.json --noEmit && tsgo -p tsconfig.node.json --noEmit`.
- **Build script (option b):** Replace `tsc -b` with the same two `tsgo -p ... --noEmit` calls before `vite build`, then run Vite. So: `tsgo -p tsconfig.app.json --noEmit && tsgo -p tsconfig.node.json --noEmit && vite build`. This removes the need for `tsc` in the build step entirely.

**Cannot do in code:**

- **Project references (`tsc -b`)**: tsgo does not yet support full `--build` / project-reference mode. The plan uses option (b): no `tsc -b`; build runs two `tsgo -p ... --noEmit` then `vite build`.

**You must do:**

- **Editor**: Enable tsgo in VS Code/Cursor: add `"typescript.experimental.useTsgo": true` to your settings (or install the “TypeScript (Native Preview)” extension if required by the docs at the time you do this).
- **CI**: If CI runs `npm run typecheck` (or a combined check script), no change needed once scripts use `tsgo`; ensure the same commands are used in CI.

---

## 2. Prettier → Oxfmt — adopt Oxfmt (no Prettier to migrate)

**What it is:** Use Oxfmt as the primary formatter (with optional import/Tailwind sorting).

**Can implement:**

- Add `oxfmt` as a dev dependency and create [.oxfmtrc.jsonc](.oxfmtrc.jsonc) to align with [.editorconfig](.editorconfig):
  - `tabWidth: 4`, `printWidth: 120` (or 100 if you prefer Oxfmt’s default), and other options as needed.
- Add scripts, e.g. `"format": "oxfmt"`, `"format:check"` or `"lint:format": "oxfmt --check"`.
- Optionally configure built-in import and Tailwind class sorting in `.oxfmtrc.jsonc` (see [Oxfmt Tailwind/import sorting](https://github.com/nkzw-tech/fate-template/blob/main/.oxfmtrc.jsonc)).
- Add `dist` and `convex/_generated` (and any other generated dirs) to Oxfmt ignore so the formatter doesn’t touch generated code.
- There is **no Prettier** in this repo, so this is “adopt Oxfmt” rather than “migrate from Prettier”. No Prettier config or dependencies to remove.

**You must do:**

- Install the [Oxc VS Code extension](https://oxc.rs/) (`code --install-extension oxc.oxc-vscode`) so formatting uses Oxfmt in the editor.
- If you use format-on-save or a pre-commit hook, point them at `oxfmt` (e.g. run `oxfmt` on staged files).

---

## 3. ESLint → Oxlint — can implement with one caveat

**What it is:** Use Oxlint as the main linter (Rust-based, fast), with optional ESLint plugin support via JS Plugins.

**Can implement:**

- Run the official migration from your existing flat config:
  - `npx @oxlint/migrate [eslint.config.js]`
  - This produces `.oxlintrc.json` and maps rules/plugins where supported.
- Your config uses `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. Oxlint has a native rule for the react-refresh case (`react/only-export-components`). For react-hooks, the migration can keep the plugin via [Oxlint JS Plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins); the migrate tool will preserve JS plugins by default.
- Add `oxlint` (and if you use type-aware rules, `oxlint-tsgolint`) as dev dependencies.
- Update [package.json](package.json) scripts: e.g. `"lint": "oxlint"` (and optionally `"lint:type-aware": "oxlint --type-aware"` if you adopt type-aware linting).
- Set `globalIgnores` / `ignorePatterns` in Oxlint config to match current ESLint (e.g. `dist`, `convex/_generated`).
- Optionally adopt **@nkzw/oxlint-config** for strict, “error-only” defaults (see article); that can be applied after the base migration and may require resolving new rule violations.
- After migration, remove ESLint config and dependencies (or keep ESLint temporarily and run `oxlint && eslint` with overlapping rules disabled via `eslint-plugin-oxlint` if you need a safety net).

**You must do:**

- Run the migration and fix any new rule violations (or relax rules in `.oxlintrc.json` where appropriate).
- If you use Convex’s recommended `@convex-dev/eslint-plugin` later, confirm Oxlint/JS-plugin compatibility or keep ESLint only for that plugin until support is clear.

**Cannot / should not:**

- Convex workspace rule says “Always use ESLint with @convex-dev/eslint-plugin”. You don’t use that plugin today. If you add it later, you may need to keep ESLint for Convex-specific rules and run both linters (Oxlint first, then ESLint), or wait until Oxlint supports that plugin.

---

## 4. npm-run-all2 — can implement

**What it is:** Run typecheck, lint, and format-check in parallel for a single “check” command.

**Can implement:**

- Add `npm-run-all2` as a dev dependency.
- Add a single script that runs your checks in parallel, e.g.:
  - `"check": "npm-run-all --parallel typecheck lint lint:format"`
  (using the same pattern as in the article). Assumes `typecheck` and `lint` and `lint:format` (or `format:check`) are already defined as above.
- Optionally document in [AGENTS.md](AGENTS.md) that “full check” is `npm run check`.

**You must do:**

- Use `npm run check` locally or in CI instead of (or in addition to) separate typecheck/lint/format steps.

---

## 5. pnpm — optional, your choice

**What it is:** Use pnpm as the package manager for speed and strictness.

**Can implement:**

- Add a note in docs (e.g. README or AGENTS.md) that the project can be used with pnpm (`pnpm install`, `pnpm run check`, etc.) if you switch.

**You must do:**

- Actually switch: delete `package-lock.json`, run `pnpm install`, and use pnpm in CI and locally. This is a lockfile and workflow change, not something to fully automate in the plan.

---

## 6. ts-node + nodemon — not applicable

**What it is:** Fast dev loop for a Node.js server with instant restart.

**Cannot / not applicable:** Your backend is Convex (serverless). There is no traditional Node server to run with nodemon. Skip this recommendation.

---

## Summary table


| Tool / change       | Implement in repo                                                                                                                               | You do                                                    | Cannot / N/A                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| **tsgo**            | Use tsgo for `typecheck` and for build (two `tsgo -p ... --noEmit` then `vite build`); no `tsc -b`                                              | Enable tsgo in editor; ensure CI uses new scripts         | Use tsgo for `tsc -b` (unsupported); use option (b) instead          |
| **Oxfmt**           | Add oxfmt, .oxfmtrc.jsonc, format + lint:format scripts, ignores                                                                                | Install Oxc extension; wire format-on-save/hooks to oxfmt | N/A (no Prettier to migrate)                                         |
| **Oxlint**          | Migrate with @oxlint/migrate; add oxlint (and optionally tsgolint / @nkzw/oxlint-config); update lint script; handle react-hooks via JS plugins | Fix new violations; decide on Convex ESLint plugin later  | Full removal of ESLint may wait if you add @convex-dev/eslint-plugin |
| **npm-run-all2**    | Add dependency and `check` script                                                                                                               | Run `npm run check` in CI/local                           | —                                                                    |
| **pnpm**            | Document optional pnpm usage                                                                                                                    | Switch lockfile and commands if desired                   | —                                                                    |
| **ts-node/nodemon** | —                                                                                                                                               | —                                                         | No Node server in this project                                       |


---

## Suggested implementation order

1. **Oxfmt** — Add formatter and scripts without touching existing lint/typecheck.
2. **npm-run-all2 + check script** — Add parallel `check` (still using current typecheck/lint); add `lint:format` when Oxfmt is in place.
3. **tsgo** — Switch typecheck and build to tsgo (build: two `tsgo -p ... --noEmit` then `vite build`); you enable editor support.
4. **Oxlint** — Run @oxlint/migrate, fix issues, switch lint script; remove or keep ESLint as above.
5. **pnpm** (optional) — Only if you decide to switch package manager.

This keeps each step independently verifiable and avoids big-bang changes.