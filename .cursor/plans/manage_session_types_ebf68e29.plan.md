---
name: Manage Session Types
overview: "Implement the Manage Question Session Types feature: new Convex schema and API for sessionTypes (with embedded session questions), a Session Types list+detail page following the Words/Question Types pattern, an editable Session Questions list in the details form (add/delete/edit/reorder via up-down buttons), and full unit test coverage for Convex and React."
todos: []
isProject: false
---

# Manage Question Session Types – Implementation Plan

## Technical issues (recommendations)

### 1. Session questions: separate table vs array inside `sessionTypes`

**Recommendation: store session questions as an array inside the `sessionTypes` document.**

- **Reasons:** One read/write for the whole session type; no orphan rows; reorder = array reorder; matches “session type is one unit” mental model. Convex document size limit (~1MB) is not a concern for typical session-question counts (e.g. 5–20 items).
- **Alternative (separate table):** Would require `sessionQuestions` table with `sessionTypeId`, `sequence`, `questionTypeId`, `count`, plus logic to replace or diff the list on save. More code and more round-trips; only justified if you need to query “which session types use question type X” (can be added later via index or denormalization).

**Data shape:** Each session type has `questions: Array<{ questionTypeId: Id<"questionTypes">, count: number }>`. Order = array index. No `userId`/`language` on each item (inherited from parent).

### 2. Editable list UI: drag-and-drop vs up/down buttons

**Recommendation: implement reorder with up/down buttons first.**

- No new dependency; works on all devices and is fully keyboard-accessible. The feature doc allows “maybe by up/down buttons.”
- Drag-and-drop (e.g. `@dnd-kit/core` + `@dnd-kit/sortable`) can be added later if desired; the form state and Convex payload stay the same (ordered array).

---

## 1. Schema and Convex API

**Files:** [convex/schema.ts](convex/schema.ts), new [convex/sessionTypes.ts](convex/sessionTypes.ts).

- **Schema:** Add `sessionTypes` table with `userId`, `language`, `name`, `questions: v.array(v.object({ questionTypeId: v.id("questionTypes"), count: v.number() }))`. Add index `by_userId_language` for list queries.
- **Validators:** Reuse Convex patterns from [convex/questionTypes.ts](convex/questionTypes.ts): validate args at boundary, return types for queries.
- **API (mirror questionTypes):**
  - `listByUserAndLanguage({ language })` – return session types for current user + language, sorted by name (locale-aware).
  - `getById({ sessionTypeId, language })` – return session type or null (auth + language check).
  - `create({ language, name, questions })` – name non-empty; `questions` optional (default `[]`); validate each `questionTypeId` exists and `count >= 1` (or allow 0 and treat as “include 0” if you prefer; doc says “count” so assume ≥ 1).
  - `update({ sessionTypeId, name, questions })` – same validation; replace entire `questions` array on save.

**Auth:** All four use `getAuthUserId`; unauthenticated list returns `[]`, getById returns `null`; create/update throw when unauthenticated. Enforce same-user and language match for get/update.

---

## 2. Frontend structure

Follow existing list+detail pattern: [src/routes/QuestionTypesPage.tsx](src/routes/QuestionTypesPage.tsx), [src/features/questionTypes/QuestionTypeDetailsForm.tsx](src/features/questionTypes/QuestionTypeDetailsForm.tsx), [src/components/ListDetailPage.tsx](src/components/ListDetailPage.tsx), [src/components/DetailsFormShell.tsx](src/components/DetailsFormShell.tsx).

- **Route and nav:** Path `**/session-types`** (recommended for consistency with `/question-types`; doc says `/sessiontypes` – confirm with product). Add route in [src/app/router.tsx](src/app/router.tsx) and nav item “Session Types” in [src/app/AppLayout.tsx](src/app/AppLayout.tsx) (and hamburger).
- **Page:** New [src/routes/SessionTypesPage.tsx](src/routes/SessionTypesPage.tsx) – same structure as QuestionTypesPage: `useQuery(sessionTypes.listByUserAndLanguage)`, `useQuery(sessionTypes.getById)` for selected, `useMutation(create|update)`, `ListDetailPage` with `renderTable` and `renderDetailsForm`.
- **Table:** New [src/features/sessionTypes/SessionTypesTable.tsx](src/features/sessionTypes/SessionTypesTable.tsx) – single column “Name” (with truncation/ellipsis), `data-session-type-id`, row click/keyboard, selected styling.
- **Details form:** New [src/features/sessionTypes/SessionTypeDetailsForm.tsx](src/features/sessionTypes/SessionTypeDetailsForm.tsx):
  - Uses `DetailsFormShell`; title = session type name when editing, “New Session Type” when creating.
  - Field: Name (required; validation: non-empty).
  - Editable list “Session Questions”: each row = question type (show name from lookup) + count (number input) + Move up / Move down + Remove. Buttons “Add session question” to append a row. List state held in component state until Save; on Save send full `name` + `questions` array to Convex.
  - Question type lookup: either pass `questionTypes` from page via `useQuery(api.questionTypes.listByUserAndLanguage)` and resolve `questionTypeId` → name in the form, or add a small Convex query that returns names for a list of IDs. Prefer passing list from page to avoid N+1 and keep form testable.
- **Session question row:** For “Add”, user must pick a question type (dropdown or autocomplete) and optionally set count (default 1). Same question type can appear multiple times (doc: “there may be more than one Session Question … with the same Question Type”). So no uniqueness constraint; list is ordered and can have duplicates.

---

## 3. Session Questions list UX (details)

- **Add:** Button “Add session question” appends `{ questionTypeId: selectedId, count: 1 }`. Question type picker: dropdown of current-language question types (from props). If no question types exist, show message and disable add (or allow add and show “Unknown” until they create one).
- **Edit:** In-row number input for `count` (min 1); optional: change question type via dropdown (same list).
- **Delete:** “Remove” button per row; removes from local state only until Save.
- **Reorder:** “Move up” / “Move down” buttons; disabled at first/last. No drag-and-drop in initial scope.
- **Validation:** Name required. Allow empty `questions` array (doc: “Session Type can be saved with an empty Session Question list”). Optionally validate each `questionTypeId` exists and belongs to current user/language in Convex on create/update.

---

## 4. Unit tests

### Convex ([convex/sessionTypes.test.ts](convex/sessionTypes.test.ts))

- Reuse patterns from [convex/questionTypes.test.ts](convex/questionTypes.test.ts): `convexTest`, `createUserAndSession`, insert helpers.
- **listByUserAndLanguage:** unauthenticated → `[]`; authenticated + none → `[]`; sorted by name (locale); filter by language; user isolation (only own).
- **getById:** unauthenticated / wrong user / wrong language → `null`; owner + language match → document with `questions` array.
- **create:** unauthenticated → throw; authenticated → returns id, doc has name and questions; name empty/whitespace → throw; allow `questions: []`.
- **update:** unauthenticated / wrong user → throw; owner → patch name and questions; name empty → throw. Add a test that replaces `questions` (e.g. add then update to different list) and verify final state.

### React – Session types page ([src/routes/SessionTypesPage.test.tsx](src/routes/SessionTypesPage.test.tsx))

- Mirror [src/routes/QuestionTypesPage.test.tsx](src/routes/QuestionTypesPage.test.tsx): mock `useQuery` / `useMutation`; test table-only at `/session-types`; details form when navigating to `/:sessionTypeId`; Add button → new form; confirm-leave when dirty (discard/save from dialog); create mutation called on Save at `/_new` with `language`, `name`, `questions`.

### React – Session type details form ([src/features/sessionTypes/SessionTypeDetailsForm.test.tsx](src/features/sessionTypes/SessionTypeDetailsForm.test.tsx))

- Mirror [src/features/questionTypes/QuestionTypeDetailsForm.test.tsx](src/features/questionTypes/QuestionTypeDetailsForm.test.tsx): render with session type vs null (new); all fields and buttons; onSave payload (name + questions); validation (name empty → Save disabled / not called); Cancel/Close/discard dialog behavior.
- **Session questions list:** Add row → payload includes new item; remove row → payload no longer includes it; reorder (move up/down) → order in payload changes; edit count → payload has updated count. Use mock question types list for dropdown.

### Optional – table component ([src/features/sessionTypes/SessionTypesTable.test.tsx](src/features/sessionTypes/SessionTypesTable.test.tsx))

- Render with list; selected row has correct styling; row click triggers callback with id; accessibility (e.g. keyboard).

---

## 5. Docs and cleanup

- **[docs/DATA_MODEL.md](docs/DATA_MODEL.md):** Update `sessionTypes` to describe `questions` as embedded array of `{ questionTypeId, count }`. Remove or shorten “Issue: separate table or array”; note “stored as array in sessionTypes document.” Remove `sessionQuestion` as standalone table; keep a short “Session question (embedded)” subsection for the shape.
- **[docs/features/Manage Question Sessions.md](docs/features/Manage Question Sessions.md):** Add “Implemented” notes for requirements (path, table, form, validation, reorder via up/down). Resolve Technical Issues section with short note: “Session questions stored as array in sessionTypes; reorder via up/down buttons (drag-and-drop can be added later).”
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):** Add Session Types to key screens and mention Convex `sessionTypes` API.

---

## 6. Order of work

1. Schema + Convex `sessionTypes` API + Convex unit tests.
2. Session types table + details form (with Session Questions list and question type picker from page-supplied list); SessionTypesPage and routing/nav.
3. React unit tests (page, form, optionally table).
4. Doc updates.

---

## 7. Out of scope (for later)

- Delete session type (“under certain conditions”) – not in initial scope.
- Drag-and-drop reorder – can be added after up/down is in place.
- Statistics “based on the sessions in which it has been used” – depends on a future “sessions” concept (practice runs); not required for this feature.

