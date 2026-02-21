# Words table usable on phones
_Exported on 21/02/2026 at 14:13:55 GMT from Cursor (2.5.20)_

---

**User**

# Words table usable on phones
Please plan the the implementation of  Requirements - Part 2 in @docs/features/Manage Words.md 


---

**Cursor**


Locating the words table implementation and its structure.



Checking the Convex `words` type and Kumo Table usage for responsive behavior:



Checking for existing formatters and how Kumo handles inline styling:



Creating the implementation plan.


---

**User**

Please update the plan for the latest changes to Requirements - Part 2 in @Manage Words.md.  Keep the suggestion for the table overflow in para 3 of the plan, and use Option A in para 2 - Accessibility

---

**Cursor**


Creating an updated plan that reflects the revised Part 2 requirements and your choices.



Summary of what’s in the updated plan:

**Requirements – Part 2 (from Manage Words.md)**  
- POS item: first letter of POS + Gender (if present), **lowercase**, **no space between** parts.  
- **Each part in a span with coloured background and contrasting text:**  
  - POS: noun = green, verb = red, adjective = purple.  
  - Gender: M = blue, F = magenta.  
- **Two non-breaking spaces** between word text and the POS item.  
- Part of Speech and Gender columns removed.

**Your choices**  
- **Accessibility:** Option A — sr-only span in the Text cell with full “Part of speech: …” and “Gender: …” for screen readers.  
- **Table overflow:** Kept in section 3 — wrap the table in a div with `overflow-x-auto` and `min-w-0` so it can scroll horizontally on very small screens.

**Plan location**  
The plan is at [.cursor/plans/words_table_mobile_part_2.plan.md](.cursor/plans/words_table_mobile_part_2.plan.md).  

Note: Manage Words.md ends with “If a row” (incomplete). The plan doesn’t assume any extra “If a row” behaviour. Gender **N** has no colour in the doc (only M and F); the plan suggests either a neutral colour for N or leaving it unstyled until you decide.

---

**User**

Use a turqoise background for Gender N

---

**Cursor**


Updated the plan: Gender **N** is now defined to use a **turquoise background** (with contrasting text) in the POS item, alongside M = blue and F = magenta.

---

**User**

Please build this plan

---

**Cursor**


Implementing the plan: adding the formatter and updating the table in WordsPage, then updating the docs.



Summary of what was implemented:

**1. [src/routes/WordsPage.tsx](src/routes/WordsPage.tsx)**  
- **`formatWordWithPos(word)`**  
  - Renders word text, two non-breaking spaces, then a POS “pill”: first letter of POS (lowercase) in a coloured span (noun = green, verb = red, adjective = purple), then optional gender letter (m/f/n) in a second span (M = blue, F = fuchsia, N = teal). No space between the two spans.  
  - Uses `Doc<"words">` and Tailwind (`bg-*-600 text-white`, `px-1`) for the pills.  
  - Adds a **sr-only** span: “, Part of speech: {pos}, Gender: {gender}” for screen readers.  
- **Table**  
  - Reduced to 3 columns: Text, Meaning, Tags. Part of speech and Gender columns removed.  
  - First cell content: `formatWordWithPos(word)`.  
- **Layout**  
  - Table wrapped in `<div className="min-w-0 overflow-x-auto">` for horizontal scroll on small screens.

**2. [docs/features/Manage Words.md](docs/features/Manage Words.md)**  
- Under **Requirements - Part 2**, added:  
  “Implemented: POS and Gender merged into Text column as coloured spans (noun/verb/adj + M/F/N), columns removed; table in overflow wrapper; usable on small phones.”

**Verification**  
- `npm run typecheck` and `npm run lint` both pass.

---

**User**

Some final style changes: in the Text column, please remove the spaces between the word and the POS item, combine the Part of Speech and Gender spans into another span, and then justify the cell content so that the combined span is moved as far to the right as possible

---

**Cursor**


Removing the two nbsp, wrapping POS and Gender in one span (order: pos then gender), and making the Text cell a flex container so the combined span aligns right.



Wrapping the cell content in a div so flex layout works even if `Table.Cell` doesn't accept `className`:



Summary of changes:

1. **No space between word and POS**  
   The two non-breaking spaces between the word and the POS item were removed.

2. **Single wrapper for POS + Gender**  
   The Part of Speech and Gender pills are now inside one `<span>` (order: POS letter then gender letter).

3. **Text cell layout**  
   The Text cell content is wrapped in `<div className="flex justify-between items-baseline">`: the word (and sr-only text) stays on the left, and the combined POS+Gender span is aligned to the right.

`formatWordWithPos` now returns a fragment with two children: a span (word + sr-only) and a span (pos + gender pills). The flex container keeps the first on the left and the second on the right. Typecheck passes.

---

**User**

Also do not let the content of the tags column wrap

---

**Cursor**


Update made: the Tags cell content is now wrapped in `<span className="whitespace-nowrap">`, so the tags stay on one line. With the table’s existing `overflow-x-auto` wrapper, horizontal scrolling will show the full content on narrow screens.

---

**User**

Please commit all changes with a suitable comment

---

**Cursor**


Committed the implementation changes with this message:

**feat(words): make words table mobile-friendly (Part 2)**

- Merge Part of Speech and Gender into Text column as coloured pills (noun/verb/adj + M/F/N), remove separate POS and Gender columns  
- Remove two non-breaking spaces between word and pills; use one span for POS+Gender; flex layout with pills aligned right  
- Add overflow wrapper and no-wrap on Tags column for small screens  
- Add sr-only text for accessibility; update Manage Words feature doc  

Included files: `docs/features/Manage Words.md` and `src/routes/WordsPage.tsx`. The plan file at `.cursor/plans/words_table_mobile_part_2.plan.md` is still untracked; say if you want that committed too.

