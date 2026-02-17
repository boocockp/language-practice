## Working in this repo (for humans + Cursor)

### Commands
- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- convex dev (interactive): `npx convex dev`

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

