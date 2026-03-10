---
name: Refactor data form pages
overview: Extract shared list+detail page orchestration and optionally a details-form shell from WordsPage/QuestionTypesPage and their Table/DetailsForm components, with a clear recommendation on whether the refactor reduces or increases complexity.
todos: []
isProject: false
---

# Refactor data form pages – plan and complexity assessment

## Current state

Two pages follow the same pattern:

- **[WordsPage.tsx](src/routes/WordsPage.tsx)** (~~153 lines) and **[QuestionTypesPage.tsx](src/routes/QuestionTypesPage.tsx)** (~~187 lines): list + detail panel, URL-driven selection, confirm-before-leave when dirty.
- **Details forms**: [WordDetailsForm.tsx](src/features/words/WordDetailsForm.tsx) (~~248 lines) and [QuestionTypeDetailsForm.tsx](src/features/questionTypes/QuestionTypeDetailsForm.tsx) (~~274 lines): same structure (reducer state, dirty check, discard dialog, `onConfirmLeaveReady`), different fields and payloads.
- **Tables**: [WordsTable.tsx](src/features/words/WordsTable.tsx) (~~85 lines) and [QuestionTypesTable.tsx](src/features/questionTypes/QuestionTypesTable.tsx) (~~58 lines): Kumo `Table`, selection highlight, row click/keyboard, different columns.

QuestionTypesPage currently has scroll-selected-row-into-view and excludes `_new` from `selectedId`; WordsPage does not. The common component will provide both behaviors for both pages.

---

## What is repeated vs what differs


| Area             | Repeated                                                                                                                                                                                                                                 | Differs                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page**         | Layout (header + Add, loading/empty/list+detail), `confirmLeaveRef` + clear on `!showDetails`, `handleRowClick` / `handleAddClick` / `goTo`* / `handleSave` pattern, routing and `_new` handling, not-found/loading copy in detail panel | Route base (`/words` vs `/question-types`), API (list/getById/create/update), copy (title, empty, “Back to…”). **Scroll-into-view and excluding `_new` from selectedId will move into the common component and apply to both pages.** |
| **Details form** | Shell: header (title + close), form submit/cancel, discard dialog, `confirmLeave` + `onConfirmLeaveReady`, `isDirty` + `isSubmitting` flow                                                                                               | Fields, validation, payload type, reducer state shape                                                                                                                                                                                 |
| **Table**        | Kumo Table, row click + Enter/Space, `isSelected` styling, `data-selected`                                                                                                                                                               | Columns, row content. **Both tables will set `data-row-id` (or a configurable attribute name) so scroll-into-view works on both pages.**                                                                                              |


---

## Complexity assessment: with vs without refactor

### Without refactor (keep as-is)

- **Pros:** No new abstractions; each page is self-contained and easy to follow; adding a third page is “copy and adapt” with no shared API to maintain.
- **Cons:** ~120 lines of page orchestration duplicated per page; ~120 lines of details-form shell (reducer + discard dialog + confirmLeave) duplicated per form. A third entity (e.g. “Phrases”) would add another full copy; fixes (e.g. a11y, confirm-leave edge case) must be applied in multiple places.

**Verdict:** Simple locally, but duplication grows linearly and consistency is manual.

### With refactor (shared page + optional form shell)

- **Pros:** One place for list+detail behavior (navigation, confirm leave, loading/empty/not-found); one place for discard/confirm-leave UI if you extract a form shell; future entities become thin wrappers.
- **Cons:** Shared component needs a clear, stable API (routes, API hooks, copy, table + form as props/children). Over-abstraction would add indirection and generics and make debugging harder.

**Verdict:** Slightly higher abstraction cost up front, but less duplicated logic and fewer places to change when behavior or a11y is updated. Net complexity is **lower** if the extraction is kept **narrow and concrete** (e.g. one shared layout component with explicit props, and optionally one form-shell component).

**Recommendation:** Do the refactor, in two steps: (1) shared list+detail page component, (2) optional shared details-form shell. Skip a generic “table” component; the tables are small and domain-specific.

---

## Proposed implementation

### 1. Shared list+detail page component

Introduce a single component that owns the page layout and behavior; each entity provides configuration and the table/form as props or children.

**Option A – Render props (recommended)**  
A component like `ListDetailPage` in e.g. `src/components/ListDetailPage.tsx` that receives:

- **Config:** `basePath` (e.g. `"/words"`), `title`, empty-state `title`/`description`, “Back to …” link text.
- **Data/handlers:** `list`, `selectedId` (always excluding `_new` — the common component expects this), `showDetails`, `showTable`, `isNew`, `selectedItem` (doc or null), loading states; `onRowClick`, `onAddClick`, `onGoBack`, `onSave`, and a way to pass `confirmLeaveRef` into the details form (e.g. `renderDetailsForm({ confirmLeaveRef })`).
- **Content:** `renderTable({ containerRef })` and `renderDetailsForm({ confirmLeaveRef })` so the page doesn’t need to know Convex types or form payloads.

The page component would:

- Render the header (title + Add), loading/empty states, and the two-column layout.
- Render table and details panel only when appropriate; inside the details panel it would render loading / not-found / form based on `selectedItem` and `isNew`.
- **Scroll-into-view:** Always scroll the selected row into view when the list or selection changes (e.g. deep link). The component uses a container ref and a `data-row-id` attribute on table rows (each page’s table must set this so the effect can find the row).

**Option B – Hook + presentational layout**  
A hook `useListDetailPage(config)` that returns `{ ...handlers, ...state, confirmLeaveRef }` and a presentational `ListDetailPageLayout` that takes that plus `children` for table and detail panel. Pages would compose the hook and layout with their own table and form. This separates “behavior” from “layout” but adds one more concept (the hook).

**Recommendation:** Option A (single component with render props) keeps “one place that does list+detail” and avoids generics over Convex types by pushing data fetching and mutations into the page; the shared component stays UI + routing only.

**Concrete API sketch:**

```tsx
// ListDetailPage receives:
type ListDetailPageProps<TId extends string, TDoc> = {
  basePath: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  backLinkText: string;
  list: TDoc[] | undefined;
  selectedId: TId | null;  // must exclude _new (e.g. null when creating new)
  selectedItem: TDoc | null | undefined;
  isNew: boolean;
  showDetails: boolean;
  showTable: boolean;
  dataRowIdAttribute?: string;  // e.g. "data-word-id" or "data-question-type-id" for scroll-into-view
  onRowClick: (id: TId) => void;
  onAddClick: () => void;
  onGoBack: () => void;
  onSave: (payload: unknown) => Promise<void>;
  renderTable: (opts: { containerRef: React.RefObject<HTMLDivElement | null> }) => ReactNode;
  renderDetailsForm: (opts: { confirmLeaveRef: React.MutableRefObject<ConfirmLeaveFn | null> }) => ReactNode;
};
```

Pages (WordsPage, QuestionTypesPage) become thin: they call Convex hooks, compute `selectedId` (excluding `_new`), `selectedItem`, `showDetails`, `showTable`, `isNew`, and pass these plus the two render functions into `ListDetailPage`. **Both pages get scroll-into-view:** the common component always runs the scroll effect; each table must set the agreed `data-row-id` attribute (e.g. `data-word-id`, `data-question-type-id`) so the effect can find the selected row. WordsPage will be updated to use the same `selectedId` convention as QuestionTypesPage (exclude `_new` so no row is highlighted when creating new).

**Files to add/change:**

- Add `src/components/ListDetailPage.tsx` (and export a shared `ConfirmLeaveFn` type if not already from a single place).
- Refactor [WordsPage.tsx](src/routes/WordsPage.tsx) and [QuestionTypesPage.tsx](src/routes/QuestionTypesPage.tsx) to use `ListDetailPage` with the above contract. Both pages must pass `selectedId` with `_new` excluded (e.g. `null` when creating).
- Add `data-word-id` to [WordsTable.tsx](src/features/words/WordsTable.tsx) so scroll-into-view works on the Words page; QuestionTypesTable already has `data-question-type-id`.

Tests: Update [WordsPage.test.tsx](src/routes/WordsPage.test.tsx) and [QuestionTypesPage.test.tsx](src/routes/QuestionTypesPage.test.tsx) so they still render the page (and optionally assert that `ListDetailPage` receives expected props). No need to test `ListDetailPage` in isolation unless you want to; integration tests on the two pages are enough.

---

### 2. Optional: shared details-form shell

Both details forms share:

- `useReducer` for form state + `isSubmitting` + `showDiscardConfirm`.
- Dirty detection and `confirmLeave` that opens the discard dialog and resolves a promise on “Discard” / “Keep editing”.
- `onConfirmLeaveReady(confirmLeave)` and optional `onDirtyChange`.
- Same header (title + close button), same discard dialog copy, same button row (Save / Cancel).

A **DetailsFormShell** (e.g. in `src/components/DetailsFormShell.tsx`) could:

- Accept: `title`, `onClose`, `onConfirmLeaveReady`, `onDirtyChange`, `isDirty`, `isSubmitting`, `isSubmitDisabled`, `onSubmit`, `onCancel`, `children` (form fields only).
- Own: the header, the discard dialog, and the Save/Cancel buttons; call `children` in between.
- **Not** own: field definitions, validation, or payload building. Each form keeps its own reducer and state shape and passes `isDirty` / `isSubmitting` / etc. into the shell.

Then `WordDetailsForm` and `QuestionTypeDetailsForm` would use `<DetailsFormShell ...>` and only render their fields inside it. This removes ~50–60 lines of repeated shell/dialog code per form and centralizes any future changes to the discard dialog or confirm-leave behavior.

**Recommendation:** Do this as a second step after the list+detail page refactor, so you don’t change too much at once. If the form shell feels awkward (e.g. too many props), you can keep the two forms as they are and still benefit from the page refactor.

---

## Order of work and docs

1. **Phase 1 – ListDetailPage**
  - Add `ListDetailPage` with the props above (including scroll-into-view and the convention that `selectedId` excludes `_new`); move shared types (`ConfirmLeaveFn`) to a single place if needed.
  - Refactor WordsPage and QuestionTypesPage to use it; WordsPage must adopt `selectedId` excluding `_new`. Add `data-word-id` to WordsTable so scroll-into-view works on the Words page.
  - Run typecheck/lint and fix any issues.
  - Adjust page tests so they still pass.
2. **Phase 2 (optional) – DetailsFormShell**
  - Add `DetailsFormShell` and refactor WordDetailsForm and QuestionTypeDetailsForm to use it.
  - Re-run checks and tests.
3. **Docs**
  - Update [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to mention `ListDetailPage` (and `DetailsFormShell` if added) and that new list+detail data pages should use it.
  - No schema or API changes, so DATA_MODEL need not change.

---

## Summary

- **Repeated:** Page orchestration (~~120 lines per page) and details-form shell (~~50–60 lines per form). Tables are small and domain-specific.
- **Assessment:** Refactoring is **worth it**: a single list+detail component and an optional form shell reduce duplication and keep behavior in one place. Complexity is **lower** with the refactor as long as the shared API stays narrow (render props + explicit config, no heavy generics).
- **Scope:** Implement `ListDetailPage` first and migrate both pages; then optionally add `DetailsFormShell` and migrate both details forms. Leave tables as they are.

