---
name: Manage Question Types
overview: Implement the full Manage Question Types feature by aligning the schema with DATA_MODEL, adding Convex questionTypes API, and building the Question Types list/detail UI and tests using the same patterns as Manage Words.
todos:
  - id: schema
    content: Update questionTypes in convex/schema.ts to dataTemplate, questionTemplate, answerTemplate
    status: pending
  - id: convex-api
    content: Add convex/questionTypes.ts with getById, listByUserAndLanguage, create, update
    status: pending
  - id: convex-tests
    content: Add convex/questionTypes.test.ts for all questionTypes API functions
    status: pending
  - id: table
    content: Add QuestionTypesTable.tsx and QuestionTypesTable.test.tsx
    status: pending
  - id: form
    content: Add QuestionTypeDetailsForm.tsx and QuestionTypeDetailsForm.test.tsx
    status: pending
  - id: page-router
    content: Implement QuestionTypesPage and router path question-types/:questionTypeId?
    status: pending
  - id: page-tests
    content: Add QuestionTypesPage.test.tsx
    status: pending
  - id: docs
    content: Update docs/ARCHITECTURE.md for Question Types screens and routes
    status: pending
isProject: false
---

# Manage Question Types implementation

## 1. Schema and data model alignment

**convex/schema.ts**

- Replace `questionTypes` fields `promptTemplate` and `enabled` with `dataTemplate`, `questionTemplate`, and `answerTemplate` (all `v.string()`), matching docs/DATA_MODEL.md.
- Keep `userId`, `language`, `name` and the existing index `by_userId_language`.
- If the Convex deployment already has rows in `questionTypes`, add a one-time migration; otherwise the schema change alone is sufficient.

---

## 2. Convex API: questionTypes

**New file: convex/questionTypes.ts**
Mirror the structure of convex/words.ts: validators, getById, listByUserAndLanguage (sort by name with Intl.Collator), create (name non-empty), update. Auth and language scoping like words.

---

## 3. UI: Question Types table and details form

**New file: src/features/questionTypes/QuestionTypesTable.tsx**

- Props: questionTypes, selectedQuestionTypeId, onRowClick.
- Columns: Name, Question template. Table in overflow wrapper; name and questionTemplate cells use truncation/ellipsis. Row click, keyboard (Enter/Space), selected row styling. Use Kumo Table.

**New file: src/features/questionTypes/QuestionTypeDetailsForm.tsx**

- Form fields: name (input), dataTemplate, questionTemplate, answerTemplate. **The xxxTemplate fields (dataTemplate, questionTemplate, answerTemplate) are shown as textareas** (per Manage Question Types.md lines 48–49).
- Title: questionType.name when editing, "New Question Type" when adding.
- Save, Cancel, Close (X). QuestionTypeUpdatePayload, ConfirmLeaveFn. Validation: name non-empty; discard-confirm dialog when leaving with unsaved changes; Cancel does not show dialog.

---

## 4. Page and routing

**src/routes/QuestionTypesPage.tsx**

- Same structure as WordsPage: useCurrentLanguage, useParams(questionTypeId), listByUserAndLanguage + getById, create/update mutations, Add button, confirmLeaveRef, responsive layout (table + details side-by-side on large screens).
- **Scroll selected row into view**: On wide screens, when a question type is selected (including deep link), scroll the table so the selected row is visible (e.g. ref on the selected row, useEffect when selectedQuestionTypeId changes calling element.scrollIntoView). This is a required part of the implementation (Part 3 requirement).

**src/app/router.tsx**

- Route: `path: "question-types/:questionTypeId?"` so /question-types, /question-types/_new, and /question-types/:id work.

---

## 5. Unit tests

- **convex/questionTypes.test.ts**: listByUserAndLanguage, getById, create, update (auth, validation, isolation, sort, language filter).
- **QuestionTypesTable.test.tsx**: headers, row content, onRowClick, selected styling.
- **QuestionTypeDetailsForm.test.tsx**: fields (including textareas for template fields), Save payload, Cancel/Close, discard dialog, new mode, name validation.
- **QuestionTypesPage.test.tsx**: table-only view, details view, Add → _new, create on Save at _new, discard flow; mock useQuery/useMutation.

---

## 6. Documentation

- **docs/ARCHITECTURE.md**: Update Key screens for Question Types (list at /question-types, detail at /question-types/:questionTypeId, add at /question-types/_new; Convex API).

---

## File summary


| Action | File                                                        |
| ------ | ----------------------------------------------------------- |
| Edit   | convex/schema.ts                                            |
| Create | convex/questionTypes.ts                                     |
| Create | convex/questionTypes.test.ts                                |
| Create | src/features/questionTypes/QuestionTypesTable.tsx           |
| Create | src/features/questionTypes/QuestionTypesTable.test.tsx      |
| Create | src/features/questionTypes/QuestionTypeDetailsForm.tsx      |
| Create | src/features/questionTypes/QuestionTypeDetailsForm.test.tsx |
| Edit   | src/routes/QuestionTypesPage.tsx                            |
| Create | src/routes/QuestionTypesPage.test.tsx                       |
| Edit   | src/app/router.tsx                                          |
| Edit   | docs/ARCHITECTURE.md                                        |


Run npm run typecheck and npm run lint; ensure all tests pass.