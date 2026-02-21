---
name: ""
overview: ""
todos: []
isProject: false
---

# Words table usable on phones (Part 2)

## Goal

Implement [Requirements - Part 2](docs/features/Manage Words.md): make the words table usable on small phones in portrait by folding Part of Speech and Gender into the Text column (as a coloured POS item) and removing those columns.

## Current state

- **[src/routes/WordsPage.tsx](src/routes/WordsPage.tsx)** renders a Kumo `Table` with 5 columns: Text, Part of speech, Gender, Meaning, Tags.
- Data comes from `words.listByUserAndLanguage`; each word has `text`, `pos` (`"noun" | "verb" | "adjective"`), optional `gender` (`"M" | "F" | "N"`), `meaning`, optional `tags`.
- Schema: [convex/schema.ts](convex/schema.ts) (no changes needed).

## Implementation

### 1. Format POS + Gender for the Text cell (updated spec)

- **Rule**: After the word text, add **two non-breaking spaces** (`\u00A0\u00A0`), then a **POS item** with no space between its parts:
  - **Part of Speech**: first letter of `pos`, lowercase (`n`, `v`, `a`), in a `<span>` with background + contrasting text colour:
    - noun: green background
    - verb: red background
    - adjective: purple background
  - **Gender** (if present): letter lowercase (`m`, `f`, or `n` for N), in a separate `<span>` with background + contrasting text colour:
    - M: blue background
    - F: magenta background
    - N: turquoise background
- **No space between** the POS span and the Gender span; letters in the POS item are lowercase.
- **Examples**: `"hello"` + noun → `hello\u00A0\u00A0` + `<span class="...">n</span>`; `"maison"` + noun + F → `maison\u00A0\u00A0` + `<span>n</span><span>f</span>` (each span with its colour).
- Implement as a small helper (e.g. `formatWordWithPos(word)`) returning React elements; use Tailwind (or Kumo-compatible) classes for the coloured pills (e.g. `bg-green-600 text-white`, `bg-red-600 text-white`, etc., with sufficient contrast). Place in [src/routes/WordsPage.tsx](src/routes/WordsPage.tsx) or `src/lib/words.ts`.

### 2. Update the table in WordsPage

- **Header**: Remove the "Part of speech" and "Gender" `<Table.Head>` cells. Keep: Text, Meaning, Tags (three columns).
- **Body**: For each row, remove the two cells that rendered `word.pos` and `word.gender`. The first `<Table.Cell>` renders the combined content: word text + two nbsp + POS item (coloured spans as above).
- **Accessibility (Option A)**: Add a visually hidden span inside the Text cell so screen readers get full info, e.g. `<span className="sr-only">, Part of speech: {word.pos}{word.gender ?` , Gender: ${word.gender} `: ""}</span>`.

### 3. Mobile usability

- Reducing to three columns (Text, Meaning, Tags) improves fit on narrow viewports.
- Wrap the table in a div with `overflow-x-auto` and `min-w-0` so that on very small screens the table can scroll horizontally instead of breaking layout (e.g. for long tags or meaning).

### 4. Docs

- In [docs/features/Manage Words.md](docs/features/Manage Words.md), add an "Implemented" line under **Requirements - Part 2** (e.g. "Implemented: POS and Gender merged into Text column as coloured spans, columns removed; table overflow wrapper; usable on small phones.").

## Out of scope (no changes)

- **Convex**: No changes to [convex/words.ts](convex/words.ts) or schema.
- **Convex tests**: No changes required.
- **ARCHITECTURE / DATA_MODEL**: No change; only the Manage Words feature doc is updated.

## Files to touch


| File                                                           | Action                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [src/routes/WordsPage.tsx](src/routes/WordsPage.tsx)           | Add formatter with coloured spans (two nbsp, POS + Gender pills), reduce to 3 columns, sr-only a11y, overflow wrapper. |
| [docs/features/Manage Words.md](docs/features/Manage Words.md) | Add implemented note for Part 2.                                                                                       |
| (Optional) `src/lib/words.ts`                                  | Extract `formatWordWithPos` here if desired for reuse/tests.                                                           |


## Verification

- `npm run typecheck` and `npm run lint` pass.
- Manually: narrow viewport shows three columns; first column shows word, two spaces, then coloured POS (and gender) pills; table scrolls horizontally when needed; screen reader announces full "Part of speech" and "Gender" where applicable.

