## Decisions (ADRs-lite)

### Stack
- Vite SPA + React + TypeScript
- React Router used as a library (client-side routing)
- Tailwind CSS for styling
- Cloudflare Kumo styled components for UI primitives
- Convex for backend data + functions

### UI approach
- Use Kumo styled components where available.
- Use Tailwind for layout/spacing/composition around Kumo components.
- Light mode only initially.

### Backend approach
- Convex owns selection/scoring/scheduling logic.
- Frontend should not duplicate backend scheduling logic.

