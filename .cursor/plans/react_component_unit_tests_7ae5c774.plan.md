---
name: React component unit tests
overview: Add a React component testing approach using Vitest and React Testing Library, with value-based assertions and user-interaction tests (exemplified by the AppLayout language selector), and no snapshot tests.
todos: []
isProject: false
---

# React component unit testing approach

## Recommended stack

- **Vitest** (already in the project) as the test runner.
- **@testing-library/react** for rendering and querying components by role/label/text.
- **@testing-library/user-event** for realistic user interactions (preferred over `fireEvent`; use `await userEvent.click(...)` etc.).

Vitest is already configured with **jsdom** for non-Convex tests ([vitest.config.ts](vitest.config.ts)); Convex tests stay in `convex/`** with `edge-runtime`. No change needed there. Add the two Testing Library packages as dev dependencies.

## Where to put tests

- **Colocated**: `AppLayout.test.tsx` next to [src/app/AppLayout.tsx](src/app/AppLayout.tsx), and similarly for other components. Keeps tests close to the code and avoids a single large test folder.
- **Exclude from Convex env**: Keep React tests outside `convex/` so they run in jsdom, not edge-runtime.

## Testing philosophy (no snapshots)

- **Query by semantics**: Use `getByRole`, `getByLabelText`, `getByText` so tests reflect how assistive tech and users find elements. Prefer `getByRole('button', { name: 'Current language' })` over class or DOM structure.
- **Assert specific values**: Assert only the content that matters (e.g. button text includes the language code and flag, menu has "Français" and "English"). Do not assert full markup or styles.
- **Test interactions and effects**: After simulating a click (e.g. open menu, choose "Français"), assert the resulting state (e.g. button text updates, or sessionStorage) rather than implementation details.

## Providing context and router in tests

[AppLayout](src/app/AppLayout.tsx) depends on:

- `useCurrentLanguage()` → wrap in [CurrentLanguageProvider](src/contexts/CurrentLanguageContext.tsx).
- `useAuth()` → supply a **mock auth provider** (e.g. `user: null`, `isLoading: false`, no-op `signOut`/`signIn`) so unit tests do not touch Convex.
- `useNavigate()` and `<Outlet />` → wrap in **MemoryRouter** and a small route tree so the layout renders and navigation works.

Recommended pattern: a **custom `render` helper** (e.g. in `src/test-utils.tsx`) that wraps the component in:

```text
LinkProvider (Kumo) → MemoryRouter → CurrentLanguageProvider → MockAuthProvider → {children}
```

Use `<Routes><Route path="/" element={<AppLayout />}><Route index element={<div />} /></Route></Routes>` so `<Outlet />` has something to render. Then tests can call `render(<AppLayout />)` (or render with the helper and the route that renders AppLayout) without repeating provider setup.

## Example: language selector tests (AppLayout)

Target behavior from the code:

- Trigger: button with `aria-label="Current language"`, content `getLanguageFlag(language) + " " + language` (e.g. `"🇬🇧 en"`).
- Menu: [LANGUAGES](src/lib/languages.ts) (e.g. "Français", "English"); each item calls `setLanguage(code)` on click.

Suggested tests:

1. **Initial state**
  - Render AppLayout with the wrapper (default language from context, e.g. `en`).  
  - Find the button by role and name (`getByRole('button', { name: 'Current language' })`).  
  - Assert its text content includes the current language code (e.g. `"en"`) and the expected flag (e.g. `"🇬🇧"`).  
  - Do not assert exact styling or full string; assert the meaningful values.
2. **Open menu and see options**
  - Click the language button with `userEvent`.  
  - Assert that menu options appear: e.g. `getByRole('menuitem', { name: 'Français' })` and `getByRole('menuitem', { name: 'English' })` (or equivalent if Kumo uses different roles).  
  - If the component uses a different role (e.g. `option` or a custom role), query by the visible option text instead.
3. **Change language**
  - Open the menu, then click "Français".  
  - Assert the trigger button’s text now includes `"fr"` and the French flag (e.g. `"🇫🇷"`).  
  - Assert that `sessionStorage` was updated (CurrentLanguageContext persists to `sessionStorage` under the key used in [CurrentLanguageContext](src/contexts/CurrentLanguageContext.tsx)), e.g. that the stored value is `"fr"`.
4. **Persistence across re-render**
  - After selecting a language (e.g. "Français"), unmount and re-render AppLayout within the same test (same wrapper so the new tree reads from sessionStorage again).  
  - Assert the language button still shows the selected language (e.g. `"fr"` and the French flag), confirming that persistence is wired correctly from UI → context → sessionStorage → next mount.

Use **async tests** where you use `userEvent` (e.g. `it('...', async () => { ... await user.click(...); })`).

## Mocking Auth

Create a small **MockAuthProvider** (e.g. in `src/test-utils.tsx` or a dedicated `src/test/mocks.tsx`) that:

- Uses the same React context type (or a subset) as the real [AuthContext](src/contexts/AuthContext.tsx).
- Provides `user: null`, `isLoading: false`, and stub `signIn`/`signOut` so layout and "Log in" button render without Convex. No need to mock Convex or `convex-test` in these tests.

## Optional: test setup file

If you want a single place for global test config (e.g. extending `expect`, or resetting `sessionStorage` between tests), add a **setup file** (e.g. `src/test/setup.ts`) and in [vitest.config.ts](vitest.config.ts) set `test.setupFiles: ['src/test/setup.ts']`. Not required for the approach above; only add if you need it.

## Summary


| Item                         | Choice                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner                       | Vitest (existing)                                                                                                                                   |
| DOM / queries / interactions | @testing-library/react + @testing-library/user-event                                                                                                |
| Assertions                   | Specific values (text, roles, storage), no snapshots                                                                                                |
| Context / router             | Custom render with MemoryRouter, CurrentLanguageProvider, MockAuthProvider                                                                          |
| Auth in tests                | Mock provider (no Convex in component tests)                                                                                                        |
| Example                      | AppLayout language selector: button content, open menu, select language, assert updated button, sessionStorage update, and persistence on re-render |


After implementation, extend [docs/features/Unit Tests.md](docs/features/Unit%20Tests.md) with a "React component tests" section describing this approach, where tests live, and how to run them (`npm run test` / `vitest`).