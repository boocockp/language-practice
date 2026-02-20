---
name: AppLayout navigation unit tests
overview: Add unit tests in AppLayout.test.tsx that cover navigation via the hamburger menu (small viewport) and the nav bar (large viewport), including user interaction and asserting navigation to at least one other page (e.g. Words), using a viewport mock and an extended test route tree.
todos: []
isProject: false
---

# AppLayout navigation unit tests

## Current state

- [AppLayout.tsx](src/app/AppLayout.tsx): Primary nav is a **hamburger** (DropdownMenu with "Open menu" / "Close menu") below `md`, and a **nav list** (NavLinks) from `md` up (Tailwind `md:hidden` and `hidden md:flex`).
- [AppLayout.test.tsx](src/app/AppLayout.test.tsx): Only language-selector tests; uses [renderAppLayout](src/test-utils.tsx) from test-utils.
- [test-utils.tsx](src/test-utils.tsx): `renderAppLayout()` uses MemoryRouter with `initialEntries={["/"]}` and a single index route with `<div data-testid="outlet" />`. No child routes like `/words` exist, so navigation cannot be asserted by outlet content.

## Approach

1. **Extend the test route tree** so navigation has a target: add at least one child route (e.g. `/words`) with a placeholder element (e.g. `data-testid="words-page"`) so tests can assert navigation by checking that the outlet shows that content. Use a simple placeholder instead of the real WordsPage to avoid Convex and keep tests fast.
2. **Control viewport in tests** by mocking `window.matchMedia`. Tailwind `md` is 768px; when `(min-width: 768px).matches` is false the hamburger is shown and the nav list is hidden, and vice versa. Mock in the navigation describe block and restore in `afterEach`.
3. **Hamburger (small viewport)**: Simulate opening the menu (click "Open menu"), then clicking one item (e.g. "Words"); assert the outlet shows the Words placeholder (and optionally that the menu closes).
4. **Nav bar (large viewport)**: Click a visible nav link (e.g. "Words"); assert the outlet shows the Words placeholder.

No need to test every nav item; one target page (e.g. Words) is enough per the requirement.

## Implementation details

### 1. Test utils: add a child route for navigation tests

In [src/test-utils.tsx](src/test-utils.tsx), extend the Routes used by `renderAppLayout()` to include a child route so the outlet can reflect navigation:

- Add a route with `path="words"` and element e.g. `<div data-testid="words-page">Words page</div>` (or a tiny component that renders that).
- Keep the existing index route. No need to change `initialEntries` for these tests (start at `/`).

Alternative: add an optional parameter to `renderAppLayout({ initialEntries?, routes? })` and default to the current behavior so existing tests are unchanged; when present, render the extra child route. Simplest is to add the `/words` route unconditionally so all AppLayout tests have a valid navigation target (it does not affect existing language tests).

### 2. Viewport mock

In the new `describe("navigation", ...)` block in [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx):

- Before the block (or in `beforeEach`), store `window.matchMedia` and replace it with a function that returns an object with `matches: boolean`, `addListener`, `removeListener` (no-ops), and `dispatchEvent` if needed. Use a variable (e.g. `mdMatches`) so each test can set it.
- For **small viewport** tests set `mdMatches = false` (so `(min-width: 768px)` is false).
- For **large viewport** tests set `mdMatches = true`.
- In `afterEach`, restore the original `matchMedia`.

Note: React may have already rendered with the default matchMedia. To ensure the layout re-renders with the mocked value, either render after setting the mock in the same test, or force a re-render; typically setting the mock before `renderAppLayout()` in each test is enough if the component reads media at render time.

### 3. Hamburger menu tests (small viewport)

- Set viewport mock so `md` is false (small).
- Render with `renderAppLayout()`.
- Find and click the button with `aria-label="Open menu"` (or "Open menu" by name).
- Assert the menu is open: e.g. `expect(screen.getByRole('menuitem', { name: 'Words' })).toBeInTheDocument()` or `findByText('Words')` in the menu.
- Click the "Words" menu item.
- Assert navigation: `expect(screen.getByTestId('words-page')).toBeInTheDocument()` (and optionally that the hamburger button now has "Open menu" again if the menu closed).

### 4. Nav bar tests (large viewport)

- Set viewport mock so `md` is true (large).
- Render with `renderAppLayout()`.
- Find the "Words" link: `getByRole('link', { name: 'Words' })`.
- Click it.
- Assert navigation: `expect(screen.getByTestId('words-page')).toBeInTheDocument()`.

### 5. Test structure

- New top-level `describe("navigation", () => { ... })` in [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx).
- Inside it: `describe("hamburger menu (small viewport)", () => { ... })` with the open-menu and navigate-to-Words test(s).
- And: `describe("nav bar (large viewport)", () => { ... })` with the click-Words-link test.
- Shared `beforeEach` / `afterEach` for the matchMedia mock only within this describe block so language selector tests are unchanged.

## Files to touch


| File                                                     | Change                                                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/test-utils.tsx](src/test-utils.tsx)                 | Add a child route `path="words"` with a placeholder element (`data-testid="words-page"`) to the Routes used by `renderAppLayout()`.                                               |
| [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx) | Add `describe("navigation", ...)` with matchMedia mock, hamburger tests (small viewport), and nav bar tests (large viewport); assert navigation to Words page via outlet content. |


## Optional checks

- In hamburger flow: assert that after clicking a menu item the dropdown closes (e.g. "Open menu" button is visible again or menu content is not in document). Not strictly required by the request but improves coverage.
- If Kumo DropdownMenu uses a role other than `menuitem` for items, use the role that Testing Library reports (e.g. `getByText('Words')` within the open menu) so tests stay robust.

## Out of scope

- Testing every nav destination (Home, Practice, Words, Question Types, Stats, Settings); one destination (Words) is sufficient.
- Testing language selector or auth in the same describe; keep navigation tests focused.

