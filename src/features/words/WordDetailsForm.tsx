import { useReducer } from "react";
import { Field, Input } from "@cloudflare/kumo";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { WORD_TYPES, type WordType } from "../../../convex/wordTypes";
import { DetailsFormShell } from "../../components/DetailsFormShell";
import type { ConfirmLeaveFn } from "../../lib/confirmLeave";

export type WordUpdatePayload = {
    wordId?: Id<"words">;
    text: string;
    type: WordType;
    meaning: string;
    tags?: string;
};

const NEW_WORD_DEFAULTS = {
    text: "",
    type: "nf" as const,
    meaning: "",
    tags: "",
};

type WordFormState = {
    text: string;
    type: WordType;
    meaning: string;
    tags: string;
    isSubmitting: boolean;
};

type WordFormAction =
    | {
          type: "SET_FIELD";
          payload: Partial<Pick<WordFormState, "text" | "type" | "meaning" | "tags">>;
      }
    | { type: "SET_SUBMITTING"; payload: boolean };

function getInitialWordFormState(word: Doc<"words"> | null): WordFormState {
    const v = word ?? NEW_WORD_DEFAULTS;
    return {
        text: v.text,
        type: v.type,
        meaning: v.meaning,
        tags: v.tags ?? "",
        isSubmitting: false,
    };
}

function wordFormReducer(state: WordFormState, action: WordFormAction): WordFormState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, ...action.payload };
        case "SET_SUBMITTING":
            return { ...state, isSubmitting: action.payload };
        default:
            return state;
    }
}

type WordDetailsFormProps = {
    word: Doc<"words"> | null;
    onSave: (payload: WordUpdatePayload) => Promise<void>;
    onSaveWithoutNavigate?: (payload: WordUpdatePayload) => Promise<void>;
    onCancel: () => void;
    onClose: () => void;
    onConfirmLeaveReady?: (confirmLeave: ConfirmLeaveFn) => void;
    onDirtyChange?: (dirty: boolean) => void;
};

function formValuesEqual(
    a: { text: string; type: string; meaning: string; tags: string },
    b: { text: string; type: string; meaning: string; tags: string },
): boolean {
    return a.text === b.text && a.type === b.type && a.meaning === b.meaning && a.tags === b.tags;
}

export function WordDetailsForm({
    word,
    onSave,
    onSaveWithoutNavigate,
    onCancel,
    onClose,
    onConfirmLeaveReady,
    onDirtyChange,
}: WordDetailsFormProps) {
    const initialValues = word ?? NEW_WORD_DEFAULTS;
    const [state, dispatch] = useReducer(wordFormReducer, word, (w): WordFormState => getInitialWordFormState(w));

    const current = {
        text: state.text,
        type: state.type,
        meaning: state.meaning,
        tags: state.tags,
    };
    const initial = {
        text: initialValues.text,
        type: initialValues.type,
        meaning: initialValues.meaning,
        tags: initialValues.tags ?? "",
    };
    const isDirty = !formValuesEqual(current, initial);
    const isTextValid = state.text.trim() !== "";

    function buildPayload(): WordUpdatePayload {
        const payload: WordUpdatePayload = {
            text: state.text.trim(),
            type: state.type,
            meaning: state.meaning,
            tags: state.tags || undefined,
        };
        if (word) payload.wordId = word._id;
        return payload;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isTextValid) return;
        dispatch({ type: "SET_SUBMITTING", payload: true });
        try {
            await onSave(buildPayload());
            onClose();
        } finally {
            dispatch({ type: "SET_SUBMITTING", payload: false });
        }
    }

    return (
        <DetailsFormShell
            title={word ? word.meaning : "New Word"}
            onClose={onClose}
            onConfirmLeaveReady={onConfirmLeaveReady}
            onDirtyChange={onDirtyChange}
            onSaveAndLeave={
                onSaveWithoutNavigate
                    ? async () => {
                          if (!isTextValid) return;
                          dispatch({ type: "SET_SUBMITTING", payload: true });
                          try {
                              await onSaveWithoutNavigate(buildPayload());
                          } finally {
                              dispatch({ type: "SET_SUBMITTING", payload: false });
                          }
                      }
                    : undefined
            }
            isDirty={isDirty}
            isSubmitting={state.isSubmitting}
            isSubmitDisabled={!isTextValid}
            onSubmit={handleSubmit}
            onCancel={onCancel}
        >
            <Field label="Text" required>
                <Input
                    value={state.text}
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { text: e.target.value } })}
                    disabled={state.isSubmitting}
                    placeholder="The word you are learning"
                    aria-label="Text"
                />
            </Field>
            <Field label="Type" required>
                <select
                    value={state.type}
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { type: e.target.value as WordType } })}
                    disabled={state.isSubmitting}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    aria-label="Type"
                >
                    {WORD_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label="Meaning" required>
                <Input
                    value={state.meaning}
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { meaning: e.target.value } })}
                    disabled={state.isSubmitting}
                    placeholder="What the word means"
                    aria-label="Meaning"
                />
            </Field>
            <Field label="Tags (optional)">
                <Input
                    value={state.tags}
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { tags: e.target.value } })}
                    disabled={state.isSubmitting}
                    placeholder="Space-separated tags"
                    aria-label="Tags"
                />
            </Field>
        </DetailsFormShell>
    );
}
