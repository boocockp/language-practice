## Working in this repo (for humans + Cursor)

### Commands

- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- format: `npm run format` / lint:format: `npm run lint:format`
- check: `npm run check` (runs typecheck, lint, and lint:format in parallel)
- convex dev (interactive): `npx convex dev`

You can use pnpm instead of npm if you prefer: `pnpm install`, `pnpm run check`, etc.

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
- **French verb conjugation**: We patch `rosaenlg-lib` with patch-package so it does not load the 6MB `french-verbs-lefff` conjugations file. After `npm install`, the `postinstall` script runs `patch-package` to apply `patches/rosaenlg-lib+4.4.0.patch`. Convex uses a rule-based verb lookup (regular rules + irregular dictionary) instead; see `docs/features/Verb conjugation.md`.
