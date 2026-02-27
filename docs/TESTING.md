# Testing

Convex function tests
---------------------

Convex queries and mutations are tested with [convex-test](https://docs.convex.dev/testing/convex-test) and Vitest. Test files live in `convex/**/*.test.ts` and run in the edge-runtime environment.

- **Practice flow**: `practice.submitAnswer` and `practiceActions.generateQuestion` are tested via convex-test. The Handlebars-based question generation logic (dataTemplate, storeData, word helper) is covered by unit tests in `convex/questionGeneration.test.ts`.
- **Action limitation**: `practiceActions.generateQuestion` passes `initialContext: {}` to the template engine. Word-based templates that require `wordText` (or similar) in context are not exercised at the action level; the `questionGeneration` unit tests cover the word helper logic.


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
