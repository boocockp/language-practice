# Manage Words feature
_Exported on 19/02/2026 at 10:05:40 GMT from Cursor (2.5.17)_

---

**User**

Please plan how to implement the requirements of the feature described in @docs/features/Manage Words.md .  
Only consider the Current Requirements.
Ask questions to clarify requirements or implementation details as necessary.

---

**Cursor**


Checking how current language works and exploring the codebase for words, schema, and routing.



Checking how other pages handle the loading/unauthenticated state and whether Convex can sort by text:



Checking the Convex query API for optional args when the user is null:



Creating the implementation plan.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**


Summary of what was implemented:

**1. Backend – [convex/words.ts](convex/words.ts)**  
- Added `listByUserAndLanguage` query with arg `language: v.string()`.  
- Uses `getAuthUserId(ctx)`; returns `[]` when not logged in.  
- Reads words via index `by_userId_language`, then sorts by `text` with `Intl.Collator(language)` and returns the full word docs.

**2. Frontend – [src/routes/WordsPage.tsx](src/routes/WordsPage.tsx)**  
- Uses `useAuth()`, `useCurrentLanguage()`, and `useQuery(api.words.listByUserAndLanguage, { language })`.  
- Loading: shows “Loading…” when `words === undefined`.  
- Empty: uses Kumo `Empty` with “No words yet” when logged in and “Log in to manage your words” when not.  
- Table: Kumo `Table` with columns Text, Part of speech, Gender, Meaning, Tags; optional fields shown as “—”; rows keyed by `word._id`.

**3. Docs – [docs/features/Manage Words.md](docs/features/Manage Words.md)**  
- Added an “Implemented” line under Current Requirements describing the list + table and the Convex query.

`npm run typecheck` and `npm run lint` both pass.

---

**User**

Please commit the changes with a suitable comment

---

**Cursor**


Committed the Manage Words work with:

**Commit:** `0cb101a` — `feat(words): add Manage Words page with list and table`

**Included files:**
- `convex/words.ts` (new)
- `convex/_generated/api.d.ts` (updated for the new query)
- `docs/features/Manage Words.md`
- `src/routes/WordsPage.tsx`

The plan file under `.cursor/plans/` was not committed. Say if you want that added too.

---

**User**

Yes commit that too

---

**Cursor**


Committed the plan file as `3545faa` with message: **docs: add Manage Words implementation plan**.

