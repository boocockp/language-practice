# Chat transcript: Refactor data form pages (Phase 1)

## 1. Plan and complexity assessment

**User:** Please plan the implementation of the Refactor data form pages doc, and provide an assessment of whether the code would be more complex with or without the refactoring.

**Outcome:** A plan was created (`.cursor/plans/refactor_data_form_pages_a2378b59.plan.md`) covering:
- Current state: WordsPage and QuestionTypesPage share the same list+detail pattern; details forms and tables differ by domain.
- Repeated vs different: page orchestration, form shell, table structure; route/API/copy differ.
- Assessment: refactor recommended—shared `ListDetailPage` and optional `DetailsFormShell` reduce duplication; complexity lower if API stays narrow.
- Option A (render props) recommended: `ListDetailPage` with config, `renderTable({ containerRef })`, `renderDetailsForm({ confirmLeaveRef })`.
- Phase 1: add ListDetailPage, refactor both pages, add `data-word-id` to WordsTable. Phase 2 (optional): DetailsFormShell.

---

## 2. Plan update: common scroll-into-view and selectedId convention

**User:** Update the plan to say that the two features only in Question Types (scroll-into-view and _new excluded from selectedId) will be included in the common components and apply to both pages.

**Outcome:** Plan updated: scroll-into-view and excluding `_new` from `selectedId` are always provided by the common component for both pages. Table row “Differs” updated; API sketch and Files/Phase 1 text updated accordingly.

---

## 3. Build Phase 1 using Option A (render props)

**User:** Please build Phase 1 using Option A Render Props.

**Outcome:** Phase 1 implemented:
1. **ListDetailPage** (`src/components/ListDetailPage.tsx`): generic list+detail layout with config (title, empty/not-found copy, addButtonAriaLabel), `selectedId` (excluding _new), `selectedItem`, `dataRowIdAttribute` for scroll-into-view; confirm-before-leave for Add and row click (internal `confirmLeaveRef`); scroll-selected-row effect; render props `renderTable({ containerRef, onRowClick })` and `renderDetailsForm({ confirmLeaveRef })`. Exported `ConfirmLeaveFn`.
2. **WordsTable:** added `data-word-id={word._id}` for scroll-into-view.
3. **WordsPage:** refactored to use `ListDetailPage`; `selectedId` excludes _new; passes `dataRowIdAttribute="data-word-id"`; thin handlers (navigate only), confirm-leave in ListDetailPage.
4. **QuestionTypesPage:** refactored to use `ListDetailPage`; same pattern, `dataRowIdAttribute="data-question-type-id"`.
5. **Docs:** `docs/ARCHITECTURE.md` updated to describe ListDetailPage and that new list+detail data pages should use it.
- Typecheck, lint, and all tests (including WordsPage and QuestionTypesPage) pass.

---

## 4. Save transcript and commit

**User:** /commit

**Outcome:** This transcript file (`.cursor/prompts/034_refactor_data_form_pages_phase1.md`) was created. All changes were staged and committed as `f040256` (feat: add ListDetailPage and refactor Words/QuestionTypes pages).
