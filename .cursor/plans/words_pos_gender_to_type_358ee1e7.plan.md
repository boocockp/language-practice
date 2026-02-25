---
name: Words Pos Gender to Type
overview: "Replace the words table fields `pos` and `gender` with a single required `type` field (WordType: nf, nm, nmf, vtr, vi, adj, adv), update Convex schema and functions, migrate existing data, then update the words UI (table and details form) and all tests to match the new model and Part 2 requirements (Type in Text column with specified colors)."
todos: []
isProject: false
---

# Replace words Pos + Gender with single Type field

## Current vs target

- **Current:** `pos` (noun | verb | adjective), `gender` (optional M | F | N).
- **Target:** Single required `type` (WordType): `nf` | `nm` | `nmf` | `vtr` | `vi` | `adj` | `adv`.

Docs already describe the target: [docs/DATA_MODEL.md](docs/DATA_MODEL.md) (WordType and words fields) and [docs/features/Manage Words.md](docs/features/Manage Words.md) (Part 2: Type in Text column, colors, lowercase, end-justified).

---

## 1. Convex schema and API

**Schema** ([convex/schema.ts](convex/schema.ts))  

- Remove `partOfSpeech` and `gender` validators.  
- Add `wordType` validator: `v.union(v.literal("nf"), v.literal("nm"), ...)` for nf, nm, nmf, vtr, vi, adj, adv.  
- In `words` table: replace `pos` and `gender` with `type: wordType`.

**Words module** ([convex/words.ts](convex/words.ts))  

- Define same `wordType` validator (or export from schema and reuse if preferred).  
- Update `wordDocValidator`: use `type` instead of `pos` and `gender`.  
- `create` and `update`: args and handler use `type` only; remove `pos` and `gender`.

---

## 2. Data migration (Option B)

Use **Option B**: single deploy, then backfill default `type` for existing docs. No mapping from pos/gender; no temporary schema.

- **Single deploy:** Schema and API switch in one go: remove `pos` and `gender`, add required `type`. Existing documents in the DB may still have old fields and will not have `type`.
- **Backfill:** After deploy, run a **one-off migration mutation** (e.g. `words.backfillType`) that:
  - Queries all words (e.g. via `db.query("words")` or pagination if needed).
  - For each word that does not have `type`, patch it with `type: "nm"` (or another chosen default). Optionally patch to remove `pos` and `gender` if still present (per Convex docs for removing fields).
- **No mapping:** Do not derive `type` from old pos/gender; existing words simply get the default type (e.g. `nm`). Users can correct types in the UI afterward.  
- Optionally document in [docs/DATA_MODEL.md](docs/DATA_MODEL.md) or MIGRATION.md that Option B was used and existing words were backfilled with default type (e.g. `nm`).

---

## 3. UI – Words table (Part 2)

**File:** [src/features/words/WordsTable.tsx](src/features/words/WordsTable.tsx)

- Replace POS_BG/GENDER_BG and POS_LETTER/GENDER_LETTER with a single **TYPE_BG** map for WordType:
  - nf: magenta, nm: cyan, nmf: turquoise, vtr: red, vi: orange, adj: blue, adv: brown (use Tailwind classes, e.g. `bg-fuchsia-500`, `bg-cyan-500`, etc.).
- **Type in Text column:** One “Type” item after the word text:  
  - Content: the type value in **lowercase, no space** (e.g. `nf`, `nm`) — already lowercase in the model.  
  - Style: background from TYPE_BG, end-justified in the cell.
- Layout: keep the Text cell as a flex container; text first, then the type badge at the end (e.g. `justify-between` or `ml-auto` for the badge).  
- Screen reader: e.g. “Type: {type}” (replace “Part of speech” and “Gender” with single “Type”).

---

## 4. UI – Word details form

**File:** [src/features/words/WordDetailsForm.tsx](src/features/words/WordDetailsForm.tsx)

- **WordUpdatePayload:** `type: Doc<"words">["type"]` (required); remove `pos` and `gender`.
- **NEW_WORD_DEFAULTS:** e.g. `type: "nf"` (or another default); remove pos/gender.
- **Form state:** Single `type` state; remove `pos` and `gender`.
- **formValuesEqual:** Compare `type` instead of pos/gender.
- **Fields:** Remove “Part of speech” and “Gender (optional)”. Add one **Type** dropdown (required) with options: nf, nm, nmf, vtr, vi, adj, adv (display labels can be the same or human-readable, e.g. “nf (noun feminine)”).
- **Submit payload:** Send `type` only; remove pos/gender.

---

## 5. Words page

**File:** [src/routes/WordsPage.tsx](src/routes/WordsPage.tsx)

- In `handleSave`, pass `payload.type` to `createWord` and `updateWord`; remove `pos` and `gender`.

---

## 6. Tests

- **convex/words.test.ts**  
  - **insertWords:** Insert with `type` (e.g. `"nf"`) instead of `pos` (and no gender).  
  - **insertWord:** Same; signature and body use `type` only.  
  - All `create`/`update` calls: use `type`; remove pos/gender.  
  - Assertions: replace `result?.pos` / `result?.gender` with `result?.type`.
- **WordDetailsForm.test.tsx**  
  - **mockWord:** Include `type` (e.g. `"nf"`); remove `pos` and `gender`.  
  - Assert form shows Type dropdown and correct value; onSave payload has `type` and no pos/gender.  
  - New-word defaults: assert default type (e.g. `nf`).
- **WordsTable.test.tsx**  
  - **mockWord:** Use `type`; remove `pos` and `gender`.  
  - Assert Text cell shows word text and type badge (e.g. “nf”) with correct styling; no “Part of speech” or “Gender” in sr-only or content.  
  - Adjust badge/count assertions if needed (one badge per row for type).
- **WordsPage.test.tsx**  
  - **mockWord:** Use `type`; remove pos/gender.  
  - Any assertions that check payload or word shape use `type`.

---

## 7. Docs

- [docs/DATA_MODEL.md](docs/DATA_MODEL.md): Already describes WordType and words with `type`; no change unless you add a “Migration” note (e.g. “Pos and gender were replaced by type on dd/mm/yyyy; mapping: …”).  
- [docs/features/Manage Words.md](docs/features/Manage Words.md): Already updated for Part 2; no code change.

---

## 8. Order of operations

1. Implement schema + words API changes: switch to `type` only (remove `pos` and `gender` in one deploy).
2. Run backfill mutation once: patch every word missing `type` with default (e.g. `nm`); optionally remove old fields.
3. Update UI (table, form, page) and then run tests.
4. Run `npm run typecheck` and `npm run lint`.

---

## Summary of files to touch


| Area      | File                                                                                    | Changes                                                                     |
| --------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Schema    | convex/schema.ts                                                                        | wordType validator; words table: type, drop pos/gender                      |
| API       | convex/words.ts                                                                         | wordType validator; wordDocValidator, create, update use type only          |
| Migration | convex/words.ts or new file                                                             | One-off backfill mutation: set default `type` (e.g. nm) for docs missing it |
| Table     | src/features/words/WordsTable.tsx                                                       | TYPE_BG, single type badge in Text column, sr-only “Type: …”                |
| Form      | src/features/words/WordDetailsForm.tsx                                                  | Payload and form: type only; Type dropdown; remove Part of speech/Gender    |
| Page      | src/routes/WordsPage.tsx                                                                | handleSave: pass type only                                                  |
| Tests     | convex/words.test.ts, WordDetailsForm.test.tsx, WordsTable.test.tsx, WordsPage.test.tsx | Mock and assert type; remove pos/gender                                     |


No changes to questionTypes or attempts; they do not reference words pos/gender.