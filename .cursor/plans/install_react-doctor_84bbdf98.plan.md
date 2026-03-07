---
name: Install react-doctor
overview: Add Million's react-doctor as a dev dependency with a dedicated script and config so the team (and CI) can run React health audits on demand, aligned with existing ignore patterns and docs.
todos: []
isProject: false
---

# Install react-doctor for language-practice

**Context:** [BACKLOG.md](docs/features/BACKLOG.md) line 15 lists "Use react doctor" ([https://github.com/millionco/react-doctor](https://github.com/millionco/react-doctor)). React Doctor scans the React codebase for security, performance, correctness, and architecture issues and outputs a 0–100 score with diagnostics (47+ rules). The project is Vite + React 19 with `check` already running typecheck, oxlint, and oxfmt in parallel.

---

## Recommended approach: devDependency + script + config

**1. Add dependency and scripts**

- Install: `npm install -D react-doctor`
- In [package.json](package.json), add:
  - `"doctor": "react-doctor ."`
  - Optionally: `"doctor:verbose": "react-doctor . --verbose"` for file/line details

**2. Config and ignores**

- Create `react-doctor.config.json` in the project root so react-doctor skips generated/build artifacts (same spirit as [.oxlintrc.json](.oxlintrc.json) `ignorePatterns`):
  - `ignore.files`: e.g. `["dist", "convex/_generated", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"]` so tests and generated code don’t affect the score. Omit test ignores if you want doctor to cover test files.
- Config can also set `lint: true`, `deadCode: true` (defaults); use `ignore.rules` later if you need to suppress specific rules.

**3. Documentation**

- In [AGENTS.md](AGENTS.md), add a line under **Commands**: e.g. `doctor: npm run doctor` (and optionally mention `npm run doctor:verbose` for details). This keeps the “single source of truth” for commands and makes it easy for humans and Cursor to run the audit.

**4. Do not add to `check` by default**

- Keep `check` as typecheck + lint + lint:format. React Doctor is a heavier, on-demand audit. Optionally run `npm run doctor` in CI as a separate job or step if you add CI later.

---

## Optional: Cursor agent skill

- For AI-assisted use inside Cursor: `npx skills add millionco/react-doctor`. This complements (does not replace) the project script; the script remains the canonical way to run the same audit in the repo and in CI.

---

## Alternative: npx-only (no install)

- Document in AGENTS.md: run `npx -y react-doctor@latest .` when needed. No lockfile entry; always latest. Prefer the devDependency approach if you want a pinned version and a single `npm run doctor` contract.

---

## Summary


| Step     | Action                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Install  | `npm install -D react-doctor`                                                                                  |
| Scripts  | Add `doctor` (and optionally `doctor:verbose`) to [package.json](package.json)                                 |
| Config   | Add `react-doctor.config.json` with `ignore.files` for `dist`, `convex/_generated` (and optionally test globs) |
| Docs     | Document `npm run doctor` in [AGENTS.md](AGENTS.md)                                                            |
| Optional | Add Cursor skill and/or a separate CI step for `npm run doctor`                                                |


No changes to existing typecheck/lint/format or the parallel `check` script are required.