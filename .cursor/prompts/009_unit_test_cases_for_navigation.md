# Unit test cases for navigation
_Exported on 20/02/2026 at 17:50:22 GMT from Cursor (2.5.17)_

---

**User**

Plan a new set of unit test cases in @src/app/AppLayout.test.tsx for navigation.
Test both the hamburger menu for small screen sizes and the nav bar for larger screens.  In each case, test user interaction and check that the navigation can move to at least one other page - it is not necessary to check every page.

---

**Cursor**


Reviewing AppLayout and its tests to plan navigation unit tests.



Checking test utilities and router setup to determine how navigation and viewport are handled.



Checking for viewport/media-query handling and how the router defines routes:



Checking how Vitest is configured and whether Tailwind is loaded in tests (affects visibility):



Checking how to assert the current path with MemoryRouter (e.g. `useLocation`):



Creating the plan.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Implementing the plan: checking todos and current files, then making the changes.



Adding the `/words` child route to test-utils.



All tests passed. Running typecheck and lint to satisfy the definition of done:



Summary of what was implemented:

**1. [src/test-utils.tsx](src/test-utils.tsx)**  
- Added a child route `path="words"` with element `<div data-testid="words-page">Words page</div>` so navigation tests can assert the Words outlet is shown.

**2. [src/app/AppLayout.test.tsx](src/app/AppLayout.test.tsx)**  
- **Navigation describe** with a shared `window.matchMedia` mock keyed off `MD_BREAKPOINT` (`(min-width: 768px)`). Each test sets `mdMatches`; the mock is restored in `afterEach`.
- **Hamburger menu (small viewport)**: One test sets `mdMatches = false`, clicks the "Open menu" button, then clicks "Words" in the menu and asserts `screen.getByTestId('words-page')` is in the document.
- **Nav bar (large viewport)**: One test sets `mdMatches = true`, clicks the "Words" link and asserts the Words page placeholder is shown.

All 6 tests pass (4 existing language selector + 2 new navigation). `npm run typecheck` and `npm run lint` both pass.

---

**User**

PLease commit changes with a suitable comment

---

**Cursor**


Committed the changes with this message:

**test(AppLayout): add navigation unit tests for hamburger and nav bar**

- Add /words child route in test-utils for navigation assertions  
- Mock matchMedia for small vs large viewport in navigation tests  
- Hamburger (small viewport): open menu, click Words, assert outlet  
- Nav bar (large viewport): click Words link, assert outlet  

The commit includes the two modified files (`AppLayout.test.tsx`, `test-utils.tsx`) and the plan file that was already staged. To drop the plan from the commit, run `git reset HEAD~1 -- .cursor/plans/` and then `git commit --amend --no-edit`.

