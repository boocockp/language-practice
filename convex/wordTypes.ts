import { v } from "convex/values";

export const WORD_TYPES = ["nf", "nm", "nmf", "vtr", "vi", "adj", "adv"] as const;

export type WordType = (typeof WORD_TYPES)[number];

export const wordTypeValidator = v.union(
  ...WORD_TYPES.map((t) => v.literal(t)),
);
