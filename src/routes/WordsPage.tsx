import { useEffect, useRef } from "react";
import { Empty, Text, Button } from "@cloudflare/kumo";
import { Plus } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
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
  const isNewWord = wordId === "_new";
  const selectedWord = useQuery(
    api.words.getById,
    wordId && wordId !== "_new" && language
      ? { wordId: wordId as Id<"words">, language }
      : "skip",
  );
  const updateWord = useMutation(api.words.update);
  const createWord = useMutation(api.words.create);

  async function handleRowClick(id: Id<"words">) {
    const confirmLeave = confirmLeaveRef.current ?? (() => Promise.resolve(true));
    const ok = await confirmLeave();
    if (ok) navigate(`/words/${id}`);
  }

  async function handleAddClick() {
    if (showDetails) {
      const confirmLeave = confirmLeaveRef.current ?? (() => Promise.resolve(true));
      const ok = await confirmLeave();
      if (!ok) return;
    }
    navigate("/words/_new");
  }

  function goToWords() {
    navigate("/words");
  }

  async function handleSave(payload: WordUpdatePayload) {
    if (payload.wordId) {
      await updateWord({
        wordId: payload.wordId,
        text: payload.text,
        type: payload.type,
        meaning: payload.meaning,
        tags: payload.tags,
      });
    } else {
      await createWord({
        language,
        text: payload.text,
        type: payload.type,
        meaning: payload.meaning,
        tags: payload.tags,
      });
    }
    goToWords();
  }

  const selectedWordId = wordId ? (wordId as Id<"words">) : null;
  const showDetails = Boolean(wordId);
  const showTable = !showDetails || (words !== undefined && words.length > 0);

  // Clear stale confirmLeave when details form unmounts so row clicks navigate
  useEffect(() => {
    if (!showDetails) confirmLeaveRef.current = null;
  }, [showDetails]);

  function detailsForm(word: Doc<"words"> | null) {
    return <WordDetailsForm
      key={word?._id ?? "_new"} 
      word={word}
      onSave={handleSave}
      onCancel={goToWords}
      onClose={goToWords}
      onConfirmLeaveReady={(fn) => {
        confirmLeaveRef.current = fn;
      } } />;
  }

  return (
    <section className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <Text variant="heading2">Words</Text>
        <Button
          type="button"
          variant="primary"
          aria-label="Add word"
          onClick={handleAddClick}
        >
          <Plus size={20} aria-hidden />
          Add
        </Button>
      </div>

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
              {isNewWord ? (
                detailsForm(null)
              ) : selectedWord === undefined ? (
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
              ) : detailsForm(selectedWord)
              }
            </div>
          )}
        </div>
      )}
    </section>
  );

}
