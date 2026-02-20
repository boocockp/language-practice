# Unit testing for React components
_Exported on 20/02/2026 at 16:59:25 GMT from Cursor (2.5.17)_

---

**User**

Please suggest one or more approaches for unit tests of the React components in the project, using the latest  testing techniques and/or frameworks.  Prefer testing the values contained in relevant specific elements rather than snapshot tests.  Also test user interactions and their effects.  For example, when testing the @src/app/AppLayout.tsx language selector button and menu, we would want to test the content of the button rather than its exact styles, and include tests that simulated changing the language by clicking the button and selecting the new language from the menu

---

**Cursor**


Researching the project's testing setup and component structure to draft a plan for React component unit tests.



Checking how the app is mounted (router and providers) and whether Vitest extends the Vite config:



Checking how Kumo's DropdownMenu renders (roles for the menu):



Checking for an existing test setup file and how Convex is typically mocked in the app:



Creating a plan for React component unit testing.


---

**User**

This looks good.  Please just update the plan to definitely include the optional tests for updating sessionStorage when the language is changed and re-render to test persistence

---

**Cursor**


Updating the plan to require the sessionStorage and persistence tests.



Summary of changes:

- **Test 3 (Change language)**  
  - It now **requires** asserting that `sessionStorage` was updated (e.g. stored value is `"fr"`) after selecting a language, and the plan references the key used in `CurrentLanguageContext`.

- **Test 4 (Persistence)**  
  - Renamed from "Optional: persistence" to **"Persistence across re-render"** and made part of the plan. It specifies: after selecting a language, unmount and re-render AppLayout, then assert the language button still shows the selected language so persistence (UI → context → sessionStorage → next mount) is covered.

- **Summary table**  
  - The Example row now says tests should assert "updated button, sessionStorage update, and persistence on re-render" instead of "optionally sessionStorage".

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Marking the first todo complete and creating the test-utils with custom render and MockAuthProvider. Exporting `AuthContext` and `AuthContextValue` from AuthContext so we can provide a mock value.



Exporting the context and type from AuthContext, then adding test-utils.



Creating the test-utils module with the custom render helper.



Adding AppLayout tests. Checking how Kumo renders dropdown items (roles):



Writing the AppLayout test file.



Checking the Vitest config: tests are running without jsdom.



Adding an explicit jsdom directive to the test file and a default environment in the config.



Installing jsdom.



Adding @testing-library/jest-dom for matchers and fixing the duplicate-button issue.



Adding a test setup file and fixing the tests: extend expect with jest-dom and run cleanup in beforeEach.



First test passed. The dropdown doesn't expose `menuitem`; we'll query by visible text and wait for the menu to appear.



Waiting for the dropdown to appear (it may render in a portal or after a short delay) using `findByText`:



All four tests passed. Verifying the full test suite (including Convex) and updating the docs.



Fixing lint: moving MockAuthProvider into test-utils and adding eslint-disable for the context/type exports in AuthContext.



Disabling react-refresh for the test-utils file (test-only, not part of the app bundle).



Summary of what was implemented:

**1. Dependencies**
- Added: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`.

**2. Vitest**
- [vitest.config.ts](vitest.config.ts): `environment: "jsdom"`, `setupFiles: ["src/test/setup.ts"]`.
- [src/test/setup.ts](src/test/setup.ts): imports `@testing-library/jest-dom/vitest` for matchers like `toHaveTextContent` and `toBeInTheDocument`.

**3. Auth for tests**
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx): exported `AuthContext` and `AuthContextValue` (with an eslint-disable for the context export).
- [src/test-utils.tsx](src/test-utils.tsx): `MockAuthProvider` that provides `AuthContext` with `user: null`, `isLoading: false`, and no-op `signIn`/`signOut`.

**4. Test helpers**
- [src/test-utils.tsx](src/test-utils.tsx): `customRender` (wrapper with LinkProvider → MemoryRouter → CurrentLanguageProvider → MockAuthProvider), `renderAppLayout()` (renders `AppLayout` with a minimal outlet), and exported `STORAGE_KEY` and `screen`.

**5. AppLayout language selector tests**
- [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx): four tests:
  - **Initial state**: button has current language code and flag (e.g. `en`, 🇬🇧).
  - **Open menu**: click trigger, then assert “Français” and “English” (using `findByText` for async menu).
  - **Change language**: click “Français”, assert button shows `fr` and 🇫🇷 and `sessionStorage` has `fr`.
  - **Persistence**: select French, unmount, render again, assert button still shows `fr` and 🇫🇷.

**6. Docs**
- [docs/features/Unit Tests.md](docs/features/Unit%20Tests.md): new “React component tests” section (stack, approach, how to run, what’s covered).

`npm run typecheck`, `npm run lint`, and `npm run test:once` (6 Convex + 4 AppLayout) all pass.

---

**User**

Please move the sections entitles Convex function tests and React component tests in @docs/features/Unit Tests.md to a new file docs/TESTING.md

---

**Cursor**


Summary of changes:

1. **Added [docs/TESTING.md](docs/TESTING.md)**  
   - **Convex function tests** – convex-test, Vitest, `convex/**/*.test.ts`, edge-runtime, and what’s covered.  
   - **React component tests** – stack, approach, how to run, and what’s covered.

2. **Updated [docs/features/Unit Tests.md](docs/features/Unit Tests.md)**  
   - Left the feature overview and requirements.  
   - Removed the Convex and React testing sections.  
   - Added: “See [docs/TESTING.md](../TESTING.md) for Convex function tests and React component tests.”

---

**User**

Please make two refactorings to @src/app/AppLayout.test.tsx :
- use the word "button" instead of "trigger"
- make user a top-level variable and initialise it in a beforeEach function

---

**Cursor**


Summary of changes:

1. **"trigger" → "button"**  
   - Test name: "shows current language and flag in the **button**".  
   - All variables renamed: `trigger` → `button`, `triggerAfterRemount` → `buttonAfterRemount`.

2. **Shared `user` and `beforeEach`**  
   - Added `let user: ReturnType<typeof userEvent.setup>;` at the top of the `describe("AppLayout")` block.  
   - In `beforeEach`, added `user = userEvent.setup();`.  
   - Removed `const user = userEvent.setup();` from each test.

All four tests still pass.

---

**User**

Please commit all changes with a suitable comment

---

**Cursor**


Committed all staged changes as `319fa69` with this message:

**Add React component testing with Vitest and Testing Library**

- Add @testing-library/react, user-event, jest-dom, jsdom; Vitest setup with jsdom and setup file  
- Add test-utils: custom render with MemoryRouter, CurrentLanguageProvider, MockAuthProvider; renderAppLayout helper  
- Export AuthContext and AuthContextValue for test wrappers; MockAuthProvider in test-utils  
- Add AppLayout.test.tsx: language selector tests (initial state, open menu, change language + sessionStorage, persistence on re-render)  
- Add docs/TESTING.md (Convex and React test sections); slim docs/features/Unit Tests.md with link to TESTING.md  
- Minor doc/plan updates

