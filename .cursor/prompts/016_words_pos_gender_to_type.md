# Words Pos-Gender to Type
_Exported on 25/02/2026 at 11:28:40 GMT from Cursor (2.5.25)_

---

**User**

Please plan the following change: 
The Pos and Gender fields of `words` are replaced by a single Type field.  The values of this field are shown in 
 @docs/DATA_MODEL.md:16-18 and the new fields of `words` are shown at @docs/DATA_MODEL.md:22-29 .
The requirements of Manage Words feature are updated at @docs/features/Manage Words.md:24-33 .
PLease update all database, UI components and tests accordingly.

---

**Cursor**

Exploring the codebase to locate the words schema, UI components, and tests so we can plan replacing Pos and Gender with a single Type field.


Checking WordsPage and test files for full scope:


Checking the rest of `convex/words.test.ts` and searching for other references to `pos` or `gender`:


Checking for a Convex migration pattern in the repo:


Creating the plan:


---

**User**

PLease update the plan to use Option B for data migration

---

**Cursor**

Updating the plan to use Option B for data migration.


Fixing the remaining typo on line 40 and updating the Order of operations and Summary to reflect Option B.


Updating the Docs bullet in section 7 to mention Option B (default backfill) instead of mapping.


Summary of what was updated:

**Section 2 – Data migration (Option B)**  
- Title set to “Data migration (Option B)” and intro states Option B: single deploy, then backfill; no mapping.  
- **Single deploy:** One deploy that removes `pos`/`gender` and adds required `type`.  
- **Backfill:** One-off mutation `words.backfillType` that queries all words and patches any missing `type` with a default (e.g. `nm`); optionally removes old fields.  
- **No mapping:** Do not derive `type` from pos/gender; users can fix types in the UI.  
- Optional doc note: document that Option B was used and words were backfilled with default type.  
- Removed the old Option A text and the **Mapping** subsection (noun+F→nf, etc.).

**Section 8 – Order of operations**  
- 1) Single deploy: schema + API use `type` only.  
- 2) Run backfill once: patch words missing `type` with default.  
- 3) Update UI and run tests.  
- 4) Typecheck and lint.  
- Removed the previous multi-step migration and “remove pos/gender from schema” step.

**Summary table**  
- Migration row now says: “One-off backfill mutation: set default `type` (e.g. nm) for docs missing it” instead of mapping from pos+gender.

**Cleanup**  
- Removed the stray “(replace the following Option A bullet block)” from the Backfill bullet.  
- Removed the orphan “No legacy for adv…” line that was left from the old Mapping section.

The plan now describes Option B only: single deploy with the new schema, then a one-time backfill that sets a default `type` for existing words, with no pos/gender mapping.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Implementing schema and words API changes:


Updating WordDetailsForm, WordsTable, and WordsPage tests:


Summary of what was implemented:

## Summary

### 1. Convex schema and API
- **convex/schema.ts**: Replaced `pos` and `gender` with a single `type` field (WordType: nf, nm, nmf, vtr, vi, adj, adv).
- **convex/words.ts**:
  - Updated `wordDocValidator`, `create`, and `update` to use `type` instead of `pos`/`gender`.
  - Added `backfillType` mutation to set default `type: "nm"` for any existing words missing it.

### 2. UI updates
- **WordsTable.tsx**: Single `TYPE_BG` map for WordType, one type badge in the Text column (lowercase, color-coded), with sr-only text “Type: {type}”.
- **WordDetailsForm.tsx**: Single Type dropdown (nf, nm, nmf, vtr, vi, adj, adv) instead of Part of speech and Gender; default `nf` for new words.
- **WordsPage.tsx**: Passes `type` instead of `pos`/`gender` to create and update mutations.

### 3. Tests
- **convex/words.test.ts**: Uses `type` in insertWords, insertWord, and all create/update calls and assertions.
- **WordDetailsForm.test.tsx**, **WordsTable.test.tsx**, **WordsPage.test.tsx**: Mocks and expectations updated to use `type`.

### 4. Verification
- `npm run typecheck` passes.
- `npm run lint` passes.
- All 94 tests pass.

### Post-deploy step
After deploying, run the **backfill** mutation once if you have existing words:

1. Open the Convex dashboard and run `words.backfillType` with `{}`.
2. Or call it from your app once (e.g. a one-off button) while logged in as an admin.

This sets `type: "nm"` for any existing words that don’t have `type`. Users can correct values in the UI afterward.

---

**User**

Please commit all changes including the plan with a suitable message

---

**Cursor**


Commit completed. 14 files were committed with the message:

**Replace words pos/gender with single type field (WordType)**

- Schema: replace `pos` and `gender` with required `type` (nf, nm, nmf, vtr, vi, adj, adv)
- Add `words.backfillType` mutation for Option B migration (default type for existing docs)
- WordsTable: Type badge in Text column with Part 2 colors (magenta, cyan, turquoise, etc.)
- WordDetailsForm: single Type dropdown instead of Part of speech + Gender
- WordsPage: pass `type` to create/update mutations
- Update all tests (convex, WordDetailsForm, WordsTable, WordsPage)
- Add plan for migration (Option B)

---

**User**

Please plan this refactoring:
- Move the constant WORD_TYPES from @src/features/words/WordDetailsForm.tsx to @convex/words.ts 
- Define a Typescript type WordType from the values of WORDS_TYPE
- Use WordType wherever Doc<"words">["type"] is used
- Change the convex type definition at @convex/words.ts:5-14 to be generated from a map operation on WORDS_TYPE

---

**Cursor**


Exploring the codebase to locate `WORD_TYPES` and usages of `Doc<"words">["type"]`.



Checking whether the schema can import from `words` and whether Convex requires a separate module:



Creating the refactoring plan:



Here’s the refactoring plan.

## Plan: Centralize `WORD_TYPES` and `WordType`

### Approach

Use a shared module `convex/wordTypes.ts` instead of defining everything in `convex/words.ts` because:

- `schema.ts` must not import `words.ts` (it would create a circular dependency with `_generated/server`).
- Both `schema` and `words` need the same validator and type.

So the constants live in `convex/wordTypes.ts`, and `convex/words.ts` re-exports them so the frontend imports from `convex/words`.

### Changes

1. **Add `convex/wordTypes.ts`** – `WORD_TYPES`, `WordType`, and `wordTypeValidator` derived with `v.union(...WORD_TYPES.map(t => v.literal(t)))`.

2. **Update `convex/schema.ts`** – Import `wordTypeValidator` from `wordTypes`, remove inline validator.

3. **Update `convex/words.ts`** – Import from `wordTypes`, use `wordTypeValidator`, re-export `WORD_TYPES` and `WordType`.

4. **Update `WordDetailsForm.tsx`** – Remove local `WORD_TYPES`, import `WORD_TYPES` and `WordType` from `convex/words`, and replace `Doc<"words">["type"]` with `WordType`.

5. **Update `WordsTable.tsx`** – Import `WordType` and use it in `TYPE_BG` and `formatWordWithType`.

The full plan is in [.cursor/plans/word_types_refactor.plan.md](.cursor/plans/word_types_refactor.plan.md).

---

**User**

PLease build this latest plan

---

**Cursor**


Summary of changes:

## Summary

### 1. `convex/wordTypes.ts`
- Central definitions: `WORD_TYPES`, `WordType`, `wordTypeValidator`
- `wordTypeValidator` built from `WORD_TYPES` using `v.union(...WORD_TYPES.map((t) => v.literal(t)))`

### 2. `convex/schema.ts`
- Imports `wordTypeValidator` from `./wordTypes` instead of defining it inline

### 3. `convex/words.ts`
- Imports `wordTypeValidator` from `./wordTypes`
- Re-exports `WORD_TYPES` and `WordType` for the frontend
- Replaces all uses of the inline `wordType` validator with `wordTypeValidator`

### 4. `src/features/words/WordDetailsForm.tsx`
- Removed local `WORD_TYPES`
- Imports `WORD_TYPES` and `WordType` from `../../../convex/words`
- Uses `WordType` instead of `Doc<"words">["type"]` in `WordUpdatePayload`, `useState`, and the `setType` handler

### 5. `src/features/words/WordsTable.tsx`
- Imports `WordType` from `../../../convex/words`
- Uses `Record<WordType, string>` for `TYPE_BG`
- Updates `formatWordWithType` to accept `{ text: string; type: WordType }`

Typecheck, lint, and all 94 tests pass.

