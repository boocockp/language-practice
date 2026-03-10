import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ListDetailPage } from "../components/ListDetailPage";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { WordDetailsForm, type WordUpdatePayload } from "../features/words/WordDetailsForm";
import { WordsTable } from "../features/words/WordsTable";

export function WordsPage() {
    const { user } = useAuth();
    const { language } = useCurrentLanguage();
    const { wordId } = useParams<{ wordId?: string }>();
    const navigate = useNavigate();

    const words = useQuery(api.words.listByUserAndLanguage, { language });
    const isNewWord = wordId === "_new";
    const selectedWord = useQuery(
        api.words.getById,
        wordId && wordId !== "_new" && language ? { wordId: wordId as Id<"words">, language } : "skip",
    );
    const updateWord = useMutation(api.words.update);
    const createWord = useMutation(api.words.create);

    const selectedWordId = wordId && wordId !== "_new" ? (wordId as Id<"words">) : null;
    const showDetails = Boolean(wordId);
    const showTable = !showDetails || (words !== undefined && words.length > 0);

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

    return (
        <ListDetailPage
            title="Words"
            emptyTitle={user ? "No words yet" : "Log in to manage your words"}
            emptyDescription={
                user
                    ? "Add words for the current language to see them here."
                    : "Sign in to view and manage your vocabulary."
            }
            backLinkText="Back to words"
            addButtonAriaLabel="Add word"
            notFoundMessage="Word not found or you don't have access to it."
            list={words}
            selectedId={selectedWordId}
            selectedItem={isNewWord ? null : selectedWord}
            isNew={isNewWord}
            showDetails={showDetails}
            showTable={showTable}
            dataRowIdAttribute="data-word-id"
            onRowClick={(id) => navigate(`/words/${id}`)}
            onAddClick={() => navigate("/words/_new")}
            onGoBack={goToWords}
            onSave={async () => {}}
            renderTable={({ onRowClick }) =>
                words ? <WordsTable words={words} selectedWordId={selectedWordId} onRowClick={onRowClick} /> : null
            }
            renderDetailsForm={({ onConfirmLeaveReady, onDirtyChange }) => (
                <WordDetailsForm
                    key={isNewWord ? "_new" : (selectedWord?._id ?? "_new")}
                    word={isNewWord ? null : (selectedWord ?? null)}
                    onSave={handleSave}
                    onCancel={goToWords}
                    onClose={goToWords}
                    onConfirmLeaveReady={onConfirmLeaveReady}
                    onDirtyChange={onDirtyChange}
                />
            )}
        />
    );
}
