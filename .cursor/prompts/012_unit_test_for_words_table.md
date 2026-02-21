# Unit test for words table
_Exported on 21/02/2026 at 15:14:48 GMT from Cursor (2.5.20)_

---

**User**

Please plan a unit test for the words table.
First extract the Table element in @src/routes/WordsPage.tsx into a separate component with a property for words.
Then unit test this component passing in words data.
Check that the correct data is shown in each cell

---

**Cursor**


Reading the Words page and test setup to plan extracting the table and adding unit tests.



Checking the test setup and words schema for fixtures:



Checking test-utils and feature structure:



Checking how Convex `Doc` and `Id` are used in tests for fixture typing:



Creating the plan.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


All tests passed. Marking the final todo complete.



Summary of what was implemented:

**1. `WordsTable` component** ([src/features/words/WordsTable.tsx](src/features/words/WordsTable.tsx))
- Accepts a single prop: `words: Doc<"words">[]`.
- Contains the POS/GENDER constants, `formatWordWithPos`, and the table markup (wrapping div, Kumo `Table` with Text, Meaning, Tags columns).
- Renders one row per word with text+POS/gender badges, meaning, and tags (or "—").

**2. `WordsPage` updates** ([src/routes/WordsPage.tsx](src/routes/WordsPage.tsx))
- Removed the table-related constants, `formatWordWithPos`, and the `Table` import.
- When there are words, it renders `<WordsTable words={words} />`.
- Loading and empty states are unchanged and still use `Empty` and the section heading.

**3. Unit tests** ([src/features/words/WordsTable.test.tsx](src/features/words/WordsTable.test.tsx))
- Uses `@vitest-environment jsdom`, `customRender`, and `screen` from test-utils (for Kumo’s `LinkProvider`).
- Adds a `mockWord()` helper that returns a `Doc<"words">`-shaped object.
- **Test 1:** Renders with empty `words` and checks column headers "Text", "Meaning", "Tags".
- **Test 2:** Renders two words (one with `tags` and `gender`, one without tags) and checks:
  - First row: "maison", "house", "home building", and sr-only "Part of speech: noun", "Gender: F".
  - Second row: "manger", "to eat", and "—" in the Tags cell.

**4. Verification**
- `npm run typecheck` and `npm run lint` both pass.
- `npm run test:once` passes (all 26 tests, including 2 new WordsTable tests).

---

**User**

Please add to the test: assertions that the visible elements posSpan and genderSpan have the correct content

---

**Cursor**


Adding assertions for the visible POS and gender badge spans (aria-hidden, showing letters "n", "v", "a", "m", "f", "n"). Querying the Text cell for those spans and asserting their content.



Summary of changes:

**In [src/features/words/WordsTable.test.tsx](src/features/words/WordsTable.test.tsx):**

- **First row (maison, noun, gender F):** After the existing Text cell checks, the test now finds all `span[aria-hidden="true"]` in that cell and asserts:
  - There are 2 such spans (pos + gender).
  - The first has text `"n"` (pos badge for noun).
  - The second has text `"f"` (gender badge for F).

- **Second row (manger, verb, no gender):** The test finds `span[aria-hidden="true"]` in the Text cell and asserts:
  - There is 1 such span (pos only).
  - Its text is `"v"` (pos badge for verb).

So the test now checks both the sr-only content and the visible pos/gender badge letters. All tests pass.

---

**User**

Please commit all changes including the plan with a suitable comment

---

**Cursor**


Committed all changes with this message:

**feat(words): extract WordsTable component and add unit tests**

- Move table markup, POS/gender constants, and `formatWordWithPos` into `src/features/words/WordsTable.tsx` with a `words` prop
- Update WordsPage to render `WordsTable` when there are words
- Add `WordsTable.test.tsx`: column headers, cell data (text, meaning, tags), and visible pos/gender badge content (aria-hidden spans)
- Add plan: `words_table_component_and_tests_1e9c5757.plan.md`

Commit `c71cdab`: 4 files changed, 244 insertions, 79 deletions.

