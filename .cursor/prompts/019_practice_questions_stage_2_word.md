# Practice Questions Stage 2 - word selection
_Exported on 27/02/2026 at 14:38:25 GMT from Cursor (2.5.25)_

---

**User**

Please plan the impementation of the new requirements at @docs/features/Practice Questions.md:79-98 .  Ask further questions as necessary, especially if  the word selection logic is not clear

---

**Cursor**


Exploring the codebase to understand the current implementation and plan Stage 2 requirements.



Searching where `lookupWord` is implemented and how the word helper is invoked.



Checking the `internal` API for words and the practice flow:



Clarifying one point about the tags-matching logic:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Summary of the Stage 2 implementation:

## Summary

### 1. questionGeneration refactor ([convex/questionGeneration.ts](convex/questionGeneration.ts))
- Introduced `WordLookupOptions` and updated `LookupWordFn` to take an options object instead of a string
- Added `createWordHelper(lookupWord)` that reads `text`, `type`, and `tags` from `options.hash` and passes them to `LookupWordFn`
- Treats empty string options as “not provided”

### 2. New Convex query ([convex/words.ts](convex/words.ts))
- Added `getRandomByCriteria` internal query with optional `text`, `type`, and `tags`
- Matching logic:
  - **text**: comma-separated list; word must be in the list
  - **type**: comma-separated list; word type must be in the list
  - **tags**: groups separated by `&`; each group is comma-separated; AND across groups (each group must match at least one tag)
- Picks one random word from matches; returns null when there are no matches

### 3. practiceActions changes ([convex/practiceActions.ts](convex/practiceActions.ts))
- Switched from `getFirstByText` to `getRandomByCriteria`
- `lookupWord` now forwards `WordLookupOptions` to the query

### 4. Tests
- **questionGeneration.test.ts**: Adjusted existing tests and added tests for type/tags/multiple options/no options and for `createWordHelper`
- **words.test.ts**: 11 tests for `getRandomByCriteria` (text, type, tags, AND, no options, no matches, random selection)
- **practice.test.ts**: Test for `word type="nm"` with the action

### 5. Docs
- **Practice Questions.md**: Stage 2 implementation notes (helper behavior, lookup function, query, template syntax)
- **DATA_MODEL.md**: Note on word lookup for question generation

`npm run typecheck`, `npm run lint`, and all 144 tests pass.

---

**User**

The random word selected for a given set of criteria seems to be always the same.  The Convex logs show the call to getRandomByCriteria is cached.  Please fix this so there is a new result each time it is called

---

**Cursor**


Investigating the implementation and fixing Convex query caching. Queries are deterministic and cached; we'll move random selection into an action.



Convex queries are deterministic and cached; `Math.random()` in a query yields the same cached result. Moving the random selection into an internal action (actions aren't cached):



Adding explicit types to resolve the circular reference and fixing the action definition:



Here’s what changed:

## Summary

Convex **queries** are deterministic and cached, so using `Math.random()` inside a query produces the same result on repeated calls. To fix this:

1. **Split the logic**
   - `getMatchingWordsByCriteria` (internal **query**): deterministic filtering and returning the list of matching words.
   - `getRandomByCriteria` (internal **action**): calls the query, then picks a random word with `Math.random()`.

2. **Change usage**
   - `practiceActions` now calls `ctx.runAction(internal.words.getRandomByCriteria, ...)` instead of `ctx.runQuery(...)`.

3. **Update tests**
   - `words.test.ts` uses `t.action()` instead of `t.query()` when testing `getRandomByCriteria`.

4. **Docs**
   - `docs/features/Practice Questions.md` updated to describe `getRandomByCriteria` as an internal action.

Actions are not cached like queries, so each call runs again and returns a fresh random word.

---

**User**

OK please commit al lfiles including the plan with a suitable message

---

**Cursor**


Commit completed. All 10 files were committed (including the plan and BACKLOG) with this message:

```
Practice Questions Stage 2: random word selection by properties

- Word helper: add optional type, tags, multi-value text filters
- createWordHelper(lookupWord): extract hash options, pass to LookupWordFn
- getRandomByCriteria (internal action): fetch matches via query, pick at random
- getMatchingWordsByCriteria (internal query): deterministic filter by text/type/tags
- Use ctx.runAction for getRandomByCriteria so random selection is not cached
- Unit tests: createWordHelper, generateQuestion with new options
- Integration tests: getRandomByCriteria (text, type, tags, random), practice action
- Docs: implementation notes, DATA_MODEL word lookup note
- Add plan and BACKLOG
```

---

**User**

Please plan the further requirements at @docs/features/Practice Questions.md:112-116 

---

**Cursor**


Creating the plan:


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Stage 2a is implemented. Summary:

## Summary

### 1. Schema ([convex/schema.ts](convex/schema.ts))
- Replaced `wordId` with `wordIds: v.optional(v.array(v.id("words")))`

### 2. Words module ([convex/words.ts](convex/words.ts))
- Added `_id` to `wordResultValidator`
- `getMatchingWordsByCriteria` returns `{ _id, text, meaning }`
- `getRandomByCriteria` returns the same shape, including `_id`

### 3. questionGeneration ([convex/questionGeneration.ts](convex/questionGeneration.ts))
- `LookupWordFn` now returns `Promise<{ _id: string; text: string; meaning: string } | null>`

### 4. practiceActions ([convex/practiceActions.ts](convex/practiceActions.ts))
- Maintains a `wordIds` array and appends `result._id` when lookup returns a word
- Passes `wordIds: [...new Set(wordIds)]` to the insert mutation

### 5. practiceInternal ([convex/practiceInternal.ts](convex/practiceInternal.ts))
- Added optional `wordIds` to `insertGeneratedQuestion`
- Inserts `wordIds` into the question document when provided

### 6. Tests
- **questionGeneration.test.ts**: Mocks return `{ _id, text, meaning }`
- **words.test.ts**: Assertions updated for `{ _id, text, meaning }` using IDs from `insertWord`
- **practice.test.ts**: Checks that the stored question has `wordIds` containing the used word’s ID

### 7. Documentation
- **DATA_MODEL.md**: `wordId` replaced with `wordIds`
- **Practice Questions.md**: Added Stage 2a implementation notes

`npm run typecheck`, `npm run lint`, and all 144 tests pass.

---

**User**

PLease commit with a suitable message

---

**Cursor**


All Stage 2a changes are committed in 11 files with this message:

```
Stage 2a: store word IDs used in questions

- Schema: replace wordId with wordIds (array of word IDs)
- Words: getRandomByCriteria returns _id with text/meaning
- questionGeneration: LookupWordFn returns { _id, text, meaning }
- practiceActions: collect word IDs from lookup, pass to insert
- practiceInternal: insertGeneratedQuestion accepts optional wordIds
- Tests: update mocks, assert _id and wordIds on questions
- Docs: DATA_MODEL, Practice Questions Stage 2a notes
- Add Stage 2a plan
```

