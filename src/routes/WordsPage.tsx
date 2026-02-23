import { useEffect, useRef } from "react";
import { Empty, Text } from "@cloudflare/kumo";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import {
  WordDetailsForm,
  type ConfirmLeaveFn,
  type WordUpdatePayload,
} from "../features/words/WordDetailsForm";
import { WordsTable } from "../features/words/WordsTable";
import { cn } from "../lib/cn";

export function WordsPage() {
  const { user } = useAuth();
  const { language } = useCurrentLanguage();
  const { wordId } = useParams<{ wordId?: string }>();
  const navigate = useNavigate();
  const confirmLeaveRef = useRef<ConfirmLeaveFn | null>(null);

  const words = useQuery(api.words.listByUserAndLanguage, { language });
  const selectedWord = useQuery(
    api.words.getById,
    wordId && language
      ? { wordId: wordId as Id<"words">, language }
      : "skip",
  );
  const updateWord = useMutation(api.words.update);

  async function handleRowClick(id: Id<"words">) {
    const confirmLeave = confirmLeaveRef.current ?? (() => Promise.resolve(true));
    const ok = await confirmLeave();
    if (ok) navigate(`/words/${id}`);
  }

  function goToWords() {
    navigate("/words");
  }

  async function handleSave(payload: WordUpdatePayload) {
    await updateWord({
      wordId: payload.wordId,
      text: payload.text,
      pos: payload.pos,
      gender: payload.gender,
      meaning: payload.meaning,
      tags: payload.tags,
    });
    goToWords();
  }

  const selectedWordId = wordId ? (wordId as Id<"words">) : null;
  const showDetails = Boolean(wordId);
  const showTable = !showDetails || (words !== undefined && words.length > 0);

  // Clear stale confirmLeave when details form unmounts so row clicks navigate
  useEffect(() => {
    if (!showDetails) confirmLeaveRef.current = null;
  }, [showDetails]);

  return (
    <section className="flex flex-col min-h-0 flex-1">
      <Text variant="heading2">Words</Text>
      <p className="text-slate-600">Manage your vocabulary list here.</p>

      {words === undefined ? (
        <p className="text-slate-500 mt-4" aria-busy="true">
          Loading…
        </p>
      ) : words.length === 0 && !wordId ? (
        <Empty
          className="mt-4"
          title={user ? "No words yet" : "Log in to manage your words"}
          description={
            user
              ? "Add words for the current language to see them here."
              : "Sign in to view and manage your vocabulary."
          }
        />
      ) : (
        <div
          className={cn(
            "mt-4 flex flex-1 min-h-0 gap-4",
            "flex-col md:flex-row",
          )}
        >
          {showTable && words && words.length > 0 && (
            <div
              className={cn(
                "min-w-0 flex-1 md:max-w-md flex flex-col",
                showDetails && "hidden md:flex",
              )}
            >
              <WordsTable
                words={words}
                selectedWordId={selectedWordId}
                onRowClick={handleRowClick}
              />
            </div>
          )}
          {showDetails && (
            <div className="min-w-0 flex-1 md:min-w-[320px] flex flex-col border border-slate-200 rounded-lg p-4 bg-white">
              {selectedWord === undefined ? (
                <p className="text-slate-500" aria-busy="true">
                  Loading…
                </p>
              ) : selectedWord === null ? (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Word not found or you don’t have access to it.
                  </p>
                  <button
                    type="button"
                    onClick={goToWords}
                    className="text-blue-600 hover:underline"
                  >
                    Back to words
                  </button>
                </div>
              ) : (
                <WordDetailsForm
                  word={selectedWord}
                  onSave={handleSave}
                  onCancel={goToWords}
                  onClose={goToWords}
                  onConfirmLeaveReady={(fn) => {
                    confirmLeaveRef.current = fn;
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
