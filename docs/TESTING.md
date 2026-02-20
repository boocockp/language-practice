# Testing

Convex function tests
---------------------

Convex queries and mutations are tested with [convex-test](https://docs.convex.dev/testing/convex-test) and Vitest. Test files live in `convex/**/*.test.ts` and run in the edge-runtime environment.

**Covered:**

- `words.listByUserAndLanguage` — unauthenticated (empty), authenticated with no words, locale-sorted results (including en vs sv), language filter, and user isolation.

React component tests
---------------------

React components are tested with [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/react), and [user-event](https://testing-library.com/docs/user-event/intro). Test files are colocated (e.g. `AppLayout.test.tsx` next to `AppLayout.tsx`) and run in the jsdom environment.

**Approach:**

- Query by role and accessible name (e.g. `getByRole('button', { name: 'Current language' })`) rather than by class or DOM structure.
- Assert specific values (text, storage) instead of snapshots.
- Test user interactions and their effects (e.g. click language button, choose option, assert button and sessionStorage update).
- Components that need router, language context, or auth use a custom render from `src/test-utils.tsx` (MemoryRouter, CurrentLanguageProvider, MockAuthProvider). Auth is mocked so component tests do not hit Convex.

**How to run:**

- `npm run test` or `npx vitest` — watch mode.
- `npm run test:once` — single run (CI).

**Covered:**

- `AppLayout` language selector — initial button content (language code and flag), open menu and see options, change language (button and sessionStorage update), persistence across re-render (unmount and remount still shows selected language).
