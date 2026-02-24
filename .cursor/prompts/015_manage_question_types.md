# Manage question types
_Exported on 24/02/2026 at 11:54:04 GMT from Cursor (2.5.20)_

---

**User**

Please plan the implementation of all the requirements in all parts of @docs/features/Manage Question Types.md .  The requirements are very similar to those already implemented in @docs/features/Manage Words.md .
Use the same patterns as those used to implement @docs/features/Manage Words.md .  I would expect to see convex/questionTypes.ts similar to @convex/words.ts , QuestionTypesTable.tsx similar to @src/features/words/WordsTable.tsx , QuestionTypesDetailsForm.tsx similar to @src/features/words/WordDetailsForm.test.tsx , and @src/routes/QuestionTypesPage.tsx updated to be similar to @src/routes/WordsPage.tsx .  
The @docs/DATA_MODEL.md for questionTypes has changed, so update @convex/schema.ts and any other files affected.
All the new code should be covered by unit tests.  Again, use the same patterns as in the existing unit tests for the @docs/features/Manage Words.md implementation.
Ask further questions as necessary.


---

**Cursor**


Re-reading the schema and DATA_MODEL to confirm the questionTypes shape, then creating the plan.



Checking for references to the current questionTypes schema and reviewing the Words test patterns:



Checking for Convex tests for words and the WordsTable test structure:



Creating the implementation plan.


---

**User**

@docs/features/Manage Question Types.md:48-49 please add this requirement to the plan
Include the Optional enhancement in Part 3 to scroll the selected row into view


---

**Cursor**


Creating an updated plan in the workspace that includes the new requirements and the scroll-into-view enhancement.



Updated the plan and saved it to [.cursor/plans/manage_question_types.plan.md](.cursor/plans/manage_question_types.plan.md) with both changes:

1. **Template fields as textareas**  
   In Section 3 (QuestionTypeDetailsForm), the plan now states that **the xxxTemplate fields (dataTemplate, questionTemplate, answerTemplate) are shown as textareas** (from Manage Question Types.md lines 48–49). The form still has a Save button as before.

2. **Scroll selected row into view**  
   In Section 4 (Page and routing), **scroll selected row into view** is no longer optional. It’s specified as a required Part 3 behavior: on wide screens, when a question type is selected (including from a deep link), the table scrolls so the selected row is visible (e.g. ref on the row + `useEffect` calling `scrollIntoView` when `selectedQuestionTypeId` changes).

---

**User**

OK please build this plan

---

**Cursor**


Implementing the Manage Question Types plan: working through the plan and reference files.



Creating the Question Types table and form components.



Adding a data attribute so the page can scroll the selected row, and removing the useless ref.



Updating the form test to use a more reliable name-field selector:



Fixing selectedQuestionTypeId so we don't treat "_new" as an id.



Guarding the scrollIntoView call so tests pass in jsdom (which doesn't implement it):



Summary of what was implemented:

**1. Schema** ([convex/schema.ts](convex/schema.ts))  
- `questionTypes` now has `dataTemplate`, `questionTemplate`, and `answerTemplate` (all strings); `promptTemplate` and `enabled` were removed to match DATA_MODEL.

**2. Convex API** ([convex/questionTypes.ts](convex/questionTypes.ts))  
- **getById** – fetch by `questionTypeId` and `language`, with auth and ownership checks.  
- **listByUserAndLanguage** – list for current user and language, sorted by `name` with `Intl.Collator`.  
- **create** – insert with “Name cannot be empty” validation.  
- **update** – patch with same validation and ownership check.

**3. Convex tests** ([convex/questionTypes.test.ts](convex/questionTypes.test.ts))  
- 17 tests for list (auth, empty, sort, language filter, isolation), getById (auth, wrong user/language, success), create (auth, success, name empty/whitespace), update (auth, wrong user, name empty, success).

**4. UI – table** ([src/features/questionTypes/QuestionTypesTable.tsx](src/features/questionTypes/QuestionTypesTable.tsx))  
- Columns: Name, Question template; truncation/ellipsis; row click and Enter/Space; selected row styling; `data-question-type-id` for scroll-into-view.

**5. UI – details form** ([src/features/questionTypes/QuestionTypeDetailsForm.tsx](src/features/questionTypes/QuestionTypeDetailsForm.tsx))  
- Fields: Name (input), Data template, Question template, Answer template (textareas). Title: question type name when editing, “New Question Type” when adding. Save/Cancel/Close, confirm-leave dialog, name required.

**6. Page and routing**  
- [src/routes/QuestionTypesPage.tsx](src/routes/QuestionTypesPage.tsx): same structure as WordsPage (list + getById, create/update, Add button, confirm-leave ref, responsive table + details). Selected row is scrolled into view when present (`el?.scrollIntoView` guarded for jsdom).  
- [src/app/router.tsx](src/app/router.tsx): route updated to `question-types/:questionTypeId?`.

**7. Tests**  
- [QuestionTypesTable.test.tsx](src/features/questionTypes/QuestionTypesTable.test.tsx) – headers, row content, onRowClick, selected styling.  
- [QuestionTypeDetailsForm.test.tsx](src/features/questionTypes/QuestionTypeDetailsForm.test.tsx) – all fields (including textareas), Save payload, Cancel/Close, discard dialog, new mode, name validation.  
- [QuestionTypesPage.test.tsx](src/routes/QuestionTypesPage.test.tsx) – table-only, details view, Add → _new, create on Save, discard flow.

**8. Docs** ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md))  
- Question Types key screen updated with routes and Convex API.

`npm run typecheck`, `npm run lint`, and `npm test -- --run` all pass (94 tests). If you have existing data in `questionTypes` with the old schema, you’ll need a one-off migration for `promptTemplate`/`enabled` → `dataTemplate`/`questionTemplate`/`answerTemplate`.

---

**User**

Please stage and commit all files, including the plan, with a suitable message

---

**Cursor**


All changes are staged and committed as `1e16e29` with this message:

**feat: implement Manage Question Types (list, detail, add, edit)**

- Align questionTypes schema with DATA_MODEL (dataTemplate, questionTemplate, answerTemplate)
- Add convex/questionTypes.ts: getById, listByUserAndLanguage, create, update
- Add QuestionTypesTable and QuestionTypeDetailsForm (name + template textareas)
- Implement QuestionTypesPage with /question-types/:questionTypeId?, Add button, scroll selected row into view
- Unit tests for Convex API, table, form, and page
- Update ARCHITECTURE.md; add plan to .cursor/plans/

13 files changed, 1710 insertions.

