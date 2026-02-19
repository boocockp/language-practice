import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const listByUserAndLanguage = query({
  args: {
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const docs = await ctx.db
      .query("words")
      .withIndex("by_userId_language", (q) =>
        q.eq("userId", userId).eq("language", args.language),
      )
      .collect();

    const collator = new Intl.Collator(args.language);
    docs.sort((a, b) => collator.compare(a.text, b.text));
    return docs;
  },
});
