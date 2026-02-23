---
name: ""
overview: ""
todos: []
isProject: false
---

# Manage Words – Part 4 Implementation Plan

## Scope (from docs/features/Manage Words.md)

- User can add a new word.
- Add button on same row as "Words" title, right-aligned, with '+' icon; click → navigate to `/words/_new`.
- Word details form shown at `/words/_new` (same as editing); Save inserts a new word.
- Screen layout, routing, form fields, and navigation behaviour same as Part 3 (reuse WordDetailsForm).
- **Other**: Text cannot be empty (validation); form title = word meaning when editing, "New Word" when adding; remove "Manage your vocabulary list here."

## Approach

1. **Tests first (TDD)**: Add Convex and UI unit tests; run and confirm they fail; then implement.
2. **No duplication**: Do not re-test full edit navigation (cancel, close, discard confirm) for the new-word flow; add only the minimal tests needed for add flow and validation.

---

## 1. Convex: `words.create`

- **New mutation** `words.create`:
  - Args: `language`, `text`, `pos`, `gender?`, `meaning`, `tags?` (same shape as update minus `wordId`).
  - Validation: `text` cannot be empty (trim and throw or return error).
  - Auth: require `getAuthUserId`; set `userId` on the new doc.
  - Returns: `Id<"words">` of the created word.
- **Unit tests** (`convex/words.test.ts`):
  - Unauthenticated call throws.
  - Authenticated call creates word and returns id; created doc has correct `userId`, `language`, and fields.
  - Empty (or whitespace-only) `text` throws or returns validation error.

---

## 2. WordDetailsForm: new-word mode and validation

- **Props**: Allow `word: Doc<"words"> | null`. When `null`, form is in "new word" mode.
- **Initial state when `word === null`**: `text: ""`, `pos: "noun"`, `gender: ""`, `meaning: ""`, `tags: ""`.
- **Payload**: Extend payload so `wordId` is optional. When `word === null`, call `onSave` without `wordId` (create payload).
- **Title**: When `word !== null` use `word.meaning`; when `word === null` use `"New Word"`.
- **Validation**: If `text.trim() === ""`, prevent submit (e.g. disable Save and/or show inline error); do not call `onSave`.
- **Unit tests** (`WordDetailsForm.test.tsx`):
  - When `word` is `null`, heading is "New Word" and fields are empty/default.
  - When `word` is `null` and user fills form and clicks Save, `onSave` is called once with payload that has no `wordId` (or equivalent create shape).
  - When `word` is `null` and Text is empty, Save is disabled or submit shows validation (and `onSave` is not called).

---

## 3. WordsPage: Add button, `/words/_new`, create flow

- **Routing**: Keep `words/:wordId?`. Treat `wordId === "_new"` as create mode (do not call `getById`; show details panel with form in new-word mode).
- **Add button**: Same row as "Words" title, right-aligned, '+' icon; click → `navigate("/words/_new")`.
- **At `/words/_new`**: Render `WordDetailsForm` with `word={null}` and `onSave={handleCreate}`. `handleCreate(payload)` calls `words.create` with `language` from `useCurrentLanguage()` and payload fields, then `goToWords()`.
- **handleSave**: When `payload.wordId` is present, call `words.update` (existing); when absent, call `words.create` and then `goToWords()`.
- **Copy**: Remove the paragraph "Manage your vocabulary list here."
- **Unit tests** (`WordsPage.test.tsx`):
  - Add button is visible and has '+' (or "Add") and is on the same row as "Words"; click navigates to `/words/_new`.
  - When at `/words/_new`, details form is shown with title "New Word"; submitting the form calls the create mutation (mock) with expected args (language, text, pos, etc.) and navigates back to `/words`.

No new tests for back/close/cancel/discard on _new (same behaviour as edit; already covered in existing tests).

---

## 4. Router

- No change. Existing route `words/:wordId?` already matches `/words` and `/words/_new`.

---

## 5. Docs

- **ARCHITECTURE.md**: Words screen: add that new words are created at `/words/_new` via `words.create`.
- **DATA_MODEL.md**: Mention `words.create` for creating words (in addition to `words.getById` and `words.update`).

---

## Implementation order

1. Write Convex tests for `words.create` → run → fail.
2. Write UI tests (WordDetailsForm new-word + validation, WordsPage Add + _new create) → run → fail.
3. Implement `words.create` in Convex → Convex tests pass.
4. Implement WordDetailsForm (word | null, title, validation, payload) → form tests pass.
5. Implement WordsPage (Add button, _new handling, create mutation, remove paragraph) → page tests pass.
6. Update ARCHITECTURE.md and DATA_MODEL.md.

