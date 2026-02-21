import { Empty, Text } from "@cloudflare/kumo";
import { useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { WordsTable } from "../features/words/WordsTable";

export function WordsPage() {
  const { user } = useAuth();
  const { language } = useCurrentLanguage();
  const words = useQuery(api.words.listByUserAndLanguage, { language });

  return (
    <section className="space-y-4">
      <Text variant="heading2">Words</Text>
      <p className="text-slate-600">Manage your vocabulary list here.</p>

      {words === undefined ? (
        <p className="text-slate-500" aria-busy="true">
          Loading…
        </p>
      ) : words.length === 0 ? (
        <Empty
          title={user ? "No words yet" : "Log in to manage your words"}
          description={
            user
              ? "Add words for the current language to see them here."
              : "Sign in to view and manage your vocabulary."
          }
        />
      ) : (
        <WordsTable words={words} />
      )}
    </section>
  );
}
