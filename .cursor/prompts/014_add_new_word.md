# Add new word
_Exported on 23/02/2026 at 13:08:17 GMT from Cursor (2.5.20)_

---

**User**

Please plan the implementation of Requirements - Part 4 in @docs/features/Manage Words.md .  Add unit tests for the Convex changes and the UI changes, but do not duplicate all the existing navigation tests for editing a word.  Write the unit tests first and check that they fail before implementing the production code.

---

**Cursor**


Exploring the codebase to understand the current structure before planning.



Checking the router param name and how WordsPage uses it:



Checking the Convex test pattern and whether the router needs a separate `_new` route:



Creating the implementation plan and adding tests first (TDD).



Adding Convex tests for `words.create` and UI tests.



Fixing the WordsPage test: the create-mutation mock must distinguish `api.words.create` from `api.words.update`. Checking how the test mocks mutations and adding the `api` import.



Importing `api` and fixing the create-mutation mock. Checking the Add button: spec says "Add" with '+' icon — use aria-label "Add" or visible "Add".



Checking navigation in tests: MemoryRouter doesn't update `window.location`. Asserting the "New Word" form appears after clicking Add instead of checking the pathname.



Running tests to confirm they fail (TDD):



Confirming test failures:
- Convex: `words.create` not exported
- WordDetailsForm: crashes when `word` is null
- WordsPage: no Add button and no _new handling

Implementing production code.



Updating WordDetailsForm to support `word: Doc<"words"> | null`, default initial values, title "New Word", and optional payload (no wordId); disabling Save when `text.trim()` is empty.



Updating WordsPage: add Add button, handle _new (skip getById, show form with word=null), and call create when saving a new word.



Updating the docs and running tests:



Fixing the two failing tests:



All tests passed. Removing the unused `api` import and running typecheck and lint:



Updating the feature doc to mark Part 4 as implemented:



Summary of what was done:

---

## Plan: Manage Words Part 4

The plan is in **`.cursor/plans/manage_words_part_4.plan.md`**. It covers:

- **Convex**: `words.create` mutation (auth, non-empty `text`, returns new id).
- **WordDetailsForm**: `word: Doc<"words"> | null`, title by mode (meaning vs "New Word"), validation (Save disabled when text empty), optional `wordId` in payload.
- **WordsPage**: Add button (same row as title, + icon) → `/words/_new`; treat `_new` as create (no `getById`); `handleSave` calls create when no `wordId`; remove “Manage your vocabulary list here.”
- **Docs**: ARCHITECTURE.md and DATA_MODEL.md updated; feature doc updated with “Implemented” for Part 4.

---

## Tests written first (TDD)

1. **Convex** (`convex/words.test.ts`):
   - `words.create`: unauthenticated throws; authenticated creates and returns id; empty text throws; whitespace-only text throws.

2. **WordDetailsForm** (`WordDetailsForm.test.tsx`):
   - New-word mode: title “New Word” and empty/default fields; Save calls `onSave` without `wordId` when valid; Save not called when Text is empty.

3. **WordsPage** (`WordsPage.test.tsx`):
   - Add button on same row as title; click shows new-word form (heading “New Word”).
   - At `/words/_new`: form with “New Word” title; Save calls create mutation with `language`, `text`, `pos`, `meaning`.

No extra navigation tests for the new-word flow (cancel/close/discard) beyond existing edit tests.

Tests were run and failed before implementing the behaviour, then implementation was added and all 53 tests passed.

---

## Implementation summary

| Area | Changes |
|------|--------|
| **convex/words.ts** | `create` mutation: args `language`, `text`, `pos`, `gender?`, `meaning`, `tags?`; auth required; `text.trim()` non-empty; returns `Id<"words">`. |
| **WordDetailsForm** | `word` may be `null`; default initial values when null; title = `word.meaning` or `"New Word"`; `isTextValid` (trim); Save disabled when invalid; payload omits `wordId` for create. |
| **WordsPage** | `isNewWord = wordId === "_new"`; skip `getById` for `_new`; Add button (Plus + “Add”) in header row; `handleSave` uses `createWord` when no `wordId`; “Manage your vocabulary list here.” removed. |
| **Docs** | ARCHITECTURE.md, DATA_MODEL.md, Manage Words.md updated. |

`npm run typecheck` and `npm run lint` both pass.

---

**User**

This looks good.  Please find and fix the following problem:
- When the user selects an existing word to display the details form, then clicks Add, the contents of the details form fields are not reset to the new word defaults

---

**Cursor**


Checking how the form is rendered when switching from an existing word to Add:



React can reuse the same `WordDetailsForm` when switching from edit to add (same component type in the same slot), so `useState(initialValues)` doesn't re-run and the form keeps the previous word's state. Adding a `key` so the form remounts when switching between edit and new.



Verifying existing tests still pass:



Adding a test that verifies the form resets when navigating from an existing word to Add:



Summary of changes:

**Cause:** When switching from “edit word” to “Add”, React kept the same `WordDetailsForm` instance and only changed the `word` prop. Because state is initialized only on first mount, the fields stayed at the previous word’s values.

**Fix:** Give each form instance a stable `key` so React unmounts/remounts when switching mode:
- New-word form: `key="_new"` so it always mounts with empty state.
- Edit form: `key={selectedWord._id}` so each word gets its own instance.

**Test:** Added “resets form to new-word defaults when Add is clicked while viewing an existing word”: open a word’s details, click Add, then assert the form shows “New Word” and empty Text/Meaning. All 6 WordsPage tests pass.

---

**User**

OK that works.  PLease find and fix this problem:
- When the user selects an existing word and makes changes, then clicks Add, the form switches to new word mode, resets the fields to the new word defaults, and the changes to the existing are lost.  In this situation the user should see the Confirm dialog that is shown when trying to navigate away from a details form with changes, by Close or clicking on another table entry

---

**Cursor**


Checking how the confirm-leave flow is used for row click and close:



Running the same confirm-leave flow before navigating to /words/_new when the details form is visible (so unsaved edits show the discard dialog).



Adding a test: when the details form has unsaved changes and the user clicks Add, the confirm dialog is shown.



Summary of changes:

**Fix**
- **WordsPage**: Replaced the Add button’s direct `navigate("/words/_new")` with an async `handleAddClick` that:
  1. If the details panel is open (`showDetails`), calls `confirmLeaveRef.current` (same as row click and close).
  2. If the user cancels (e.g. “Keep editing”), returns without navigating.
  3. If the user confirms or the form isn’t dirty, navigates to `/words/_new`.

So when a user has unsaved changes and clicks Add, they get the same “Discard changes?” dialog as with Close or clicking another row.

**Tests**
- **“shows discard confirm dialog when Add is clicked with unsaved changes, then navigates to new word on Discard”**: Edit a word, click Add → dialog appears → choose “Discard changes” → new-word form with empty fields.
- **“shows discard confirm when Add clicked with unsaved changes, keeps editing on Keep editing”**: Edit a word, click Add → dialog appears → choose “Keep editing” → dialog closes and edited content remains.

All 8 WordsPage tests pass; typecheck and lint are clean.

---

**User**

Good.  Please stage and commit all changes including the plan with a suitable message.

---

**Cursor**


All changes are committed as `7713ae2` with this message:

**Manage Words Part 4: add new word, validation, confirm on Add when dirty**

- Add `words.create` mutation (auth, non-empty text); Convex unit tests
- WordDetailsForm: support `word=null` (new-word mode), title by mode (meaning / New Word), text required validation (Save disabled when empty), optional `wordId` in payload
- WordsPage: Add button (same row as title, + icon) → `/words/_new`; create flow; confirm-leave before Add when details open (discard dialog); key on form for reset
- Remove “Manage your vocabulary list here”; update ARCHITECTURE, DATA_MODEL, feature doc
- Plan: `.cursor/plans/manage_words_part_4.plan.md`

10 files changed, 435 insertions, 33 deletions.

---

**User**

@convex/words.ts:87-91 : please add this validation to the update mutation and the test

---

**Cursor**


Summary of changes:

**`convex/words.ts` (update mutation)**  
- Trim `args.text` and throw `"Text cannot be empty"` when the trimmed value is empty.  
- Use the trimmed value in the patch so leading/trailing spaces are normalized.

**`convex/words.test.ts`**  
- **"throws when text is empty"**: owner calls update with `text: ""` → mutation throws, word text stays `"original"`.  
- **"throws when text is whitespace only"**: owner calls update with `text: "   "` → mutation throws, word text stays `"original"`.

All 19 Convex words tests pass.

---

**User**

@src/features/words/WordDetailsForm.test.tsx:66-74 Please plan a refactor to replace the calls to customRender in each test with a local renderForm function that has default values with overrides - similar principle to mockWord

---

**Cursor**


Checking the component's prop type for the plan:



Creating the plan:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Adding the `renderForm` helper and React import, then replacing all `customRender` calls.



Summary of what was implemented:

**1. `renderForm` helper**
- Added `import React from "react"` for `React.ComponentProps`.
- After `mockWord`, added `renderForm(overrides?)` that:
  - Defaults: `word: mockWord()`, `onSave: vi.fn()`, `onCancel: vi.fn()`, `onClose: vi.fn()`.
  - Takes `Partial<React.ComponentProps<typeof WordDetailsForm>>` and merges it over the defaults.
  - Renders via `customRender(<WordDetailsForm {...props} />)` and returns that result.

**2. Replaced all 10 `customRender` usages**
- “renders all fields with the word values” → `renderForm({ word })` with `word` from `mockWord({...})`.
- “calls onSave with updated payload...” → `renderForm({ word: mockWord({ text: "original", meaning: "first" }), onSave })`.
- “calls onCancel when Cancel is clicked” → `renderForm({ onCancel })`.
- “calls onClose when Close is clicked and form is not dirty” → `renderForm({ onClose })`.
- “shows confirm dialog when Close is clicked and form is dirty” → `renderForm({ onClose })`.
- “Cancel does not show discard confirm dialog when form is dirty” → `renderForm()`.
- “new word mode ... shows title New Word and empty/default fields” → `renderForm({ word: null })`.
- “new word mode ... calls onSave without wordId when Save is clicked...” → `renderForm({ word: null, onSave })`.
- “new word mode ... does not call onSave when Text is empty...” → `renderForm({ word: null, onSave })`.

All 9 tests pass and there are no new linter issues.

