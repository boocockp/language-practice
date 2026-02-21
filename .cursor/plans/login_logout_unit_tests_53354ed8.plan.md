---
name: Login Logout Unit Tests
overview: Add a new describe("login and logout") block in AppLayout.test.tsx that tests AppHeader auth UI, LoginModal content and flows (sign-in/sign-up), user popover content (including parametrized identity display), and logout, using an extendable auth-aware render.
todos: []
isProject: false
---

# Login / Logout unit tests plan

## Scope

- **File**: All new tests go in [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx) inside a new top-level `describe("login and logout", () => { ... })`.
- **Dependencies**: Existing [src/test-utils.tsx](src/test-utils.tsx) uses `MockAuthProvider` with fixed `user: null` and no-op `signIn`/`signOut`. Login/logout tests need controllable auth state and spyable `signIn`/`signOut`.

## Test infrastructure

- **Auth-aware render**: Introduce a way to render `AppLayout` with overridable auth (e.g. `renderAppLayoutWithAuth({ user, signIn, signOut, isLoading })`). Options:
  - **Option A (recommended)**: Add in test-utils a `renderAppLayoutWithAuth(overrides?)` that uses a provider which merges `AuthContextValue` with `overrides` (defaulting to current `MockAuthProvider` behavior). Tests then call `renderAppLayoutWithAuth({ user: mockUser })` or pass mock functions.
  - **Option B**: Keep test-utils unchanged and define a local wrapper inside the test file that holds `user` state and mock `signIn`/`signOut`, and use `customRender` with that wrapper plus the same `Routes`/`AppLayout` structure as `renderAppLayout()`.

- **Mock user**: Use a minimal object compatible with `Doc<"users">` for layout/popover tests: at least `_id`, and optionally `email` and `name` (e.g. `{ _id: "mock-user-id", email: "user@example.com", name: "Test User" }`). Cast to `Doc<"users">` or use a type that satisfies the fields used in the UI (`email`, `name`).

## Test cases (by category)

### 1. AppHeader: logged-in vs logged-out

- **Logged out**: Render with `user: null`. Assert a "Log in" button is present (e.g. `getByRole("button", { name: "Log in" })`). Assert there is no "Account" button (e.g. `queryByRole("button", { name: "Account" })` is null).
- **Logged in**: Render with `user: mockUser`. Assert the Account button is present (`getByRole("button", { name: "Account" })`). Assert "Log in" is not present.
- **Loading**: Render with `isLoading: true`. Assert neither "Log in" nor "Account" is visible (auth block is not rendered while loading).

### 2. LoginModal content

- Open modal by clicking "Log in" (after rendering with `user: null`).
- Assert dialog is visible (e.g. by role `dialog` or by `Dialog.Title` content).
- **Sign-in step**: Title "Sign in", description "Enter your email and password to sign in.", one submit button "Sign in", one toggle button "Sign up instead", and a Close button. Assert Email and Password fields (by label and placeholders if needed).
- No need to test Kumo internals; focus on visible text and roles/labels that the app sets.

### 3. Sign-up flow (inside LoginModal)

- Open modal, then click "Sign up instead".
- Assert title is "Sign up", description is "Create an account with your email and password.", submit button text is "Sign up", and the toggle button text is "Sign in instead".
- **Sign-up submit**: Submit the form with email and password filled in; mock `signIn` to resolve. Assert `signIn` was called with first argument `"password"` and with form data indicating sign-up (e.g. `formData.get("flow") === "signUp"`). Assert the modal closes (e.g. dialog no longer in document or "Sign up" title not visible).

### 4. Login flow (inside LoginModal)

- **Success**: Open modal, fill email and password (e.g. via `userEvent.type` on inputs found by label or placeholder), submit. Mock `signIn` to resolve. Assert modal closes (e.g. dialog no longer in document or "Sign in" title not visible).
- **Error**: Mock `signIn` to reject. Submit form. Assert an alert or text "Invalid email or password" is present and modal remains open.

### 5. User icon popover content

- Render with `user` set. Click the Account button (`getByRole("button", { name: "Account" })`).
- Assert popover content: the text showing identity (`user.email ?? user.name ?? "Signed in"`) and a "Log out" button.
- **Parametrized identity display**: Add three cases so the fallback chain is covered:
  - **With email**: `user` has `email` (and optionally `name`); assert the displayed text is the email (e.g. `user@example.com`).
  - **Name only**: `user` has `name` but no `email`; assert the displayed text is the name.
  - **Neither**: `user` with neither `email` nor `name`; assert the displayed text is "Signed in".

### 6. Logout flow

- Render with `user: mockUser` and a mock `signOut` (e.g. `vi.fn()` that optionally updates a state to set user to null if using a stateful wrapper).
- Open the account popover, click "Log out". Assert `signOut` was called once.
- If the test wrapper updates `user` to `null` after `signOut`, assert the "Log in" button appears afterward; otherwise asserting the spy is sufficient for a unit test.

## Implementation notes

- Use `userEvent.setup()` (already used in the file) for clicks and form input.
- For modal and popover, prefer `findBy*` or wait for content after opening, as needed for Kumo's rendering.
- Keep assertions on observable UI and on mock calls; avoid testing Kumo component internals.
- Ensure no test depends on Convex or real auth; all auth is via the injected context.
- Reuse the same `Routes`/`AppLayout`/outlet structure as the existing `renderAppLayout()` so layout and nav behave the same.

## Files to touch

| File | Change |
|------|--------|
| [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx) | New `describe("login and logout")` with the cases above; import any new helper from test-utils if Option A is used. |
| [src/test-utils.tsx](src/test-utils.tsx) | Add `renderAppLayoutWithAuth(overrides?)` (and optionally a typed `AuthOverrides`) if Option A is chosen; otherwise only the test file changes (Option B). |

## Definition of done

- `npm run typecheck` and `npm run lint` pass.
- New tests are focused, use roles/labels for queries, and mock auth only via context (no Convex in tests).
