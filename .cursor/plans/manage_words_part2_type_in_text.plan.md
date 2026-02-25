---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan: Manage Words Part 2 — Type in Text column (small phones)

## Goal

Implement [Requirements - Part 2](docs/features/Manage Words.md) (lines 24–33):

- Words table usable on small phones in portrait.
- **Type** is part of the **Text** column (no separate Type column).
- In the Text cell: word text, then a **Type item** (single coloured pill) showing the type.
- Type item: **lowercase, no spaces** (e.g. `nf`, `nm`, `vtr`, `adj`).
- Type item is **justified at the end** of the cell.
- **Background colours** for Type:  
`nf`: magenta, `nm`: cyan, `nmf`: turquoise, `vtr`: red, `vi`: orange, `adj`: blue, `adv`: brown.

---

## Spec vs current code


| Source                          | Word type model                                                              | Notes                  |
| ------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
| **Feature doc + DATA_MODEL.md** | Single field `type`: WordType = `nf`, `nm`, `nmf`, `vtr`, `vi`, `adj`, `adv` | Desired product spec   |
| **Convex schema + app**         | `pos`: noun | verb | adjective; `gender`: M | F | N (optional)               | Current implementation |


The table currently has **3 columns** (Text, Meaning, Tags) and already shows **pos + gender** inside the Text cell as two separate pills (e.g. `n` + `f`). Part 2 spec asks for a **single Type item** with the **WordType** codes and the **spec colours** above.

---

## Implementation paths

### Option A — Align schema with spec (recommended if product wants WordType)

1. **Schema**
  - In `convex/schema.ts`: replace `pos` and `gender` on `words` with a single field, e.g. `type: v.union(v.literal("nf"), v.literal("nm"), ...)` for all 7 WordType values.
2. **Migration**
  - One-time migration of existing data: map (pos, gender) → type (e.g. noun+F→nf, noun+M→nm, noun+N→nmf, verb→vtr, adjective→adj; decide defaults for missing gender or future vi/adv).
3. **Convex**
  - Update `convex/words.ts`: validators and all reads/writes use `type` instead of `pos`/`gender`.
4. **UI**
  - **WordsTable**: one Type pill per row — `word.type` in lowercase, background from the 7 colours, placed at end of Text cell (see “UI behaviour” below).
  - **WordDetailsForm**: single control for `type` (e.g. select with 7 options) instead of pos + gender.
5. **Tests & docs**
  - Update words tests and form/table tests; update DATA_MODEL.md to match schema; add “Implemented” under Part 2 in Manage Words.md.

### Option B — Keep current schema (display-only mapping)

1. **No schema change**
  - Keep `pos` and `gender`.
2. **Display mapping**
  - In the table only, derive a **display type code** from (pos, gender), e.g.  
   noun+F→nf, noun+M→nm, noun+N→nmf, noun+no gender→e.g. nmf or “n”; verb→vtr; adjective→adj.  
   (vi and adv cannot be represented without schema change.)
3. **UI**
  - **WordsTable**: single Type pill per row showing this derived code, using the **spec colours** and same layout as below. Replace current two-pill (pos + gender) with this one pill.
4. **Form**
  - No change (still edit pos + gender).
5. **Docs**
  - Add “Implemented” under Part 2; optionally note in feature doc that type code is derived from pos+gender until schema uses WordType.

---

## UI behaviour (both options)

- **Text column content**  
  - Word text (e.g. “maison”), then the Type item (e.g. coloured pill “nf”).
- **Layout**  
  - Type item **at the end of the cell** (e.g. `flex justify-between` or `ml-auto` so the pill is right-aligned in the cell).
- **Type pill**  
  - One `<span>` (or similar):  
    - Text: type code in **lowercase**, **no spaces** (e.g. `nf`, `vtr`, `adj`).  
    - Background (and text colour for contrast): use the 7 colours from the spec.
  - Example Tailwind-style mapping:  
  nf→magenta, nm→cyan, nmf→turquoise, vtr→red, vi→orange, adj→blue, adv→brown (e.g. `bg-… text-white` or equivalent for accessibility).
- **Accessibility**  
  - Keep or add a screen-reader-only description of the type (e.g. “Type: nf”) so the cell remains meaningful when read aloud.
- **Mobile**  
  - Keep current table wrapper (e.g. `min-w-0 overflow-x-auto`) so the table stays usable on small viewports.

---

## Files to touch


| File                                          | Action                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/features/words/WordsTable.tsx`           | Use single Type pill with spec colours; layout so Type is at end of Text cell; keep sr-only type description.   |
| `src/features/words/WordsTable.test.tsx`      | Update expectations: one Type pill per row, correct colours/codes (and optionally derived mapping if Option B). |
| **If Option A**                               |                                                                                                                 |
| `convex/schema.ts`                            | Replace `pos` + `gender` with `type` (WordType).                                                                |
| `convex/words.ts`                             | Replace pos/gender with type in validators and mutations; add migration if needed.                              |
| `src/features/words/WordDetailsForm.tsx`      | Replace pos + gender controls with single type selector.                                                        |
| `src/features/words/WordDetailsForm.test.tsx` | Update for type field.                                                                                          |
| `convex/words.test.ts`                        | Update for type.                                                                                                |
| **Docs**                                      |                                                                                                                 |
| `docs/features/Manage Words.md`               | Add “Implemented” note under Requirements - Part 2.                                                             |
| `docs/DATA_MODEL.md`                          | If Option A: ensure it matches schema (already describes WordType).                                             |


---

## Verification

- `npm run typecheck` and `npm run lint` pass.
- Words table: 3 columns (Text, Meaning, Tags); Text cell shows word + one Type pill at end of cell; Type pill lowercase, no spaces; colours match spec (nf→magenta, nm→cyan, nmf→turquoise, vtr→red, vi→orange, adj→blue, adv→brown).
- On a narrow viewport, table remains usable (no layout break); horizontal scroll if needed.
- Screen reader: type information still announced (e.g. via sr-only text).
- If Option A: create/update word flows use `type`; existing words migrated to `type`.

---

## Summary

- **Part 2** requires: Type in Text column, single Type item at end of cell, lowercase/no spaces, 7 colours. Current code already puts “type-like” info in the Text column but with pos+gender and different colours.
- **Decision**: Choose **Option A** (migrate to WordType) if the product is standardising on `type`; otherwise **Option B** (display-only mapping, same UI behaviour, spec colours) with a note that vi/adv need a later schema change to be shown.

