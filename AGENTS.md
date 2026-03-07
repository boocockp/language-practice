## Working in this repo (for humans + Cursor)

### Commands

Use **pnpm** for install and scripts (npm works too).

- dev: `pnpm run dev` (or `pnpm dev`)
- build: `pnpm run build`
- lint: `pnpm run lint`
- typecheck: `pnpm run typecheck`
- format: `pnpm run format` / lint:format: `pnpm run lint:format`
- check: `pnpm run check` (runs typecheck, lint, and lint:format in parallel)
- doctor: `pnpm run doctor` (React health audit; use `pnpm run doctor:verbose` for file/line details)
- convex dev (interactive): `pnpm exec convex dev`

### Architecture intentions

- React routes are thin UI shells.
- Question selection/scoring/scheduling logic belongs in Convex.
- UI should use Kumo styled components + Tailwind for layout/spacing.
- Light mode only for now.

### Intended structure

- `src/app/`: app shell (`App`), router, layout
- `src/routes/`: top-level pages
- `src/features/`: domain modules (practice/words/questionTypes/stats)
- `src/components/`: shared components
- `src/lib/`: utilities (e.g. `cn`)
- `convex/`: backend schema + functions (generated/created during Convex bootstrap)
- `docs/`: ARCHITECTURE, DATA_MODEL, DECISIONS

### Notes

- This is an SPA: deploy needs a rewrite-to-`index.html` rule for all routes.
- **French verb conjugation**: We patch `rosaenlg-lib` with patch-package so it does not load the 6MB `french-verbs-lefff` conjugations file. After `pnpm install`, the `postinstall` script runs `patch-package` to apply `patches/rosaenlg-lib+4.4.0.patch`. Convex uses a rule-based verb lookup (regular rules + irregular dictionary) instead; see `docs/features/Verb conjugation.md`.
