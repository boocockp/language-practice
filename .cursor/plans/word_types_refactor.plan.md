---
name: ""
overview: ""
todos: []
isProject: false
---

# Refactor: Centralize WORD_TYPES and WordType

## Goal

- Single source of truth for word type values
- Derive Convex validator from `WORD_TYPES`
- Use `WordType` type instead of `Doc<"words">["type"]` where appropriate
- Avoid circular dependencies between schema and words

---

## 1. Create shared module `convex/wordTypes.ts`

Create a new file that both schema and words can import from (no Convex-specific or schema imports).

```ts
import { v } from "convex/values";

export const WORD_TYPES = ["nf", "nm", "nmf", "vtr", "vi", "adj", "adv"] as const;

export type WordType = (typeof WORD_TYPES)[number];

export const wordTypeValidator = v.union(
  ...WORD_TYPES.map((t) => v.literal(t)),
);
```

- `WORD_TYPES`: single source of truth for valid values
- `WordType`: `"nf" | "nm" | "nmf" | "vtr" | "vi" | "adj" | "adv"`
- `wordTypeValidator`: Convex validator built from `WORD_TYPES` via `v.union(...WORD_TYPES.map(t => v.literal(t)))`

---

## 2. Update `convex/schema.ts`

- Remove the inline `wordType` validator (lines 5–14).
- Import `wordTypeValidator` from `./wordTypes`.
- Use `wordTypeValidator` in the words table definition.

```ts
import { wordTypeValidator } from "./wordTypes";

// In words table:
type: wordTypeValidator,
```

---

## 3. Update `convex/words.ts`

- Remove the inline `wordType` validator (lines 5–14).
- Import `wordTypeValidator`, `WORD_TYPES`, and `WordType` from `./wordTypes`.
- Re-export `WORD_TYPES` and `WordType` for frontend use.
- Replace all uses of `wordType` with `wordTypeValidator`.
- In `backfillType`, use `WordType` for the default (`"nm"`).

```ts
import { wordTypeValidator, WORD_TYPES, type WordType } from "./wordTypes";

// Re-export for frontend
export { WORD_TYPES, type WordType };

// Use wordTypeValidator in wordDocValidator, create args, update args
// backfillType: use "nm" as WordType for default
```

---

## 4. Update `src/features/words/WordDetailsForm.tsx`

- Remove `const WORD_TYPES = [...]`.
- Import `WORD_TYPES` and `WordType` from `"../../../convex/words"`.
- Replace `Doc<"words">["type"]` with `WordType` in:
  - `WordUpdatePayload`
  - `useState<Doc<"words">["type"]>`
  - `setType(e.target.value as Doc<"words">["type"])`
- Use `WORD_TYPES` in the dropdown options (unchanged usage).

---

## 5. Update `src/features/words/WordsTable.tsx`

- Import `WordType` from `"../../../convex/words"`.
- Replace `Doc<"words">["type"]` with `WordType` in:
  - `TYPE_BG: Record<WordType, string>`
  - `formatWordWithType(word: Pick<Doc<"words">, "text" | "type">)` – can stay as is, or use `{ text: string; type: WordType }` for the param type.

---

## 6. Other files

- Search for `Doc<"words">["type"]` and replace with `WordType` where it makes sense.
- Tests: `convex/words.test.ts` uses literal types like `"nf"` in `insertWord`; those remain valid as `WordType`. No change required unless we want to tighten types (e.g. `insertWord(..., { type: "nf" })` is already assignable to `WordType`).

---

## 7. Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm test`
- Confirm `Doc<"words">["type"]` and `WordType` are equivalent (schema and `WordType` both derive from the same `WORD_TYPES`).

---

## Summary of files


| File                                     | Changes                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `convex/wordTypes.ts`                    | New file: `WORD_TYPES`, `WordType`, `wordTypeValidator`                                                            |
| `convex/schema.ts`                       | Import `wordTypeValidator` from `wordTypes`; remove inline validator                                               |
| `convex/words.ts`                        | Import from `wordTypes`; use `wordTypeValidator`; re-export `WORD_TYPES`, `WordType`                               |
| `src/features/words/WordDetailsForm.tsx` | Remove `WORD_TYPES`; import `WORD_TYPES`, `WordType` from convex; use `WordType` instead of `Doc<"words">["type"]` |
| `src/features/words/WordsTable.tsx`      | Import `WordType`; use in `TYPE_BG` and `formatWordWithType`                                                       |


---

## Why `convex/wordTypes.ts` instead of only `convex/words.ts`?

`schema.ts` must not depend on `words.ts`, since `words.ts` uses `_generated/server`, which is generated from the schema. Putting the shared definition in `wordTypes.ts` keeps both schema and words free of circular imports.