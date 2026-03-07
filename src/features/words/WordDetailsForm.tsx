import { useCallback, useEffect, useRef, useReducer } from "react";
import { Button, Dialog, Field, Input } from "@cloudflare/kumo";
import { X } from "@phosphor-icons/react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { WORD_TYPES, type WordType } from "../../../convex/wordTypes";

export type WordUpdatePayload = {
    wordId?: Id<"words">;
    text: string;
    type: WordType;
    meaning: string;
    tags?: string;
};

export type ConfirmLeaveFn = () => Promise<boolean>;

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
    showDiscardConfirm: boolean;
};

type WordFormAction =
    | { type: "SET_FIELD"; payload: Partial<Pick<WordFormState, "text" | "type" | "meaning" | "tags">> }
    | { type: "SET_SUBMITTING"; payload: boolean }
    | { type: "SHOW_DISCARD_CONFIRM"; payload: boolean };

function getInitialWordFormState(word: Doc<"words"> | null): WordFormState {
    const v = word ?? NEW_WORD_DEFAULTS;
    return {
        text: v.text,
        type: v.type,
        meaning: v.meaning,
        tags: v.tags ?? "",
        isSubmitting: false,
        showDiscardConfirm: false,
    };
}

function wordFormReducer(state: WordFormState, action: WordFormAction): WordFormState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, ...action.payload };
        case "SET_SUBMITTING":
            return { ...state, isSubmitting: action.payload };
        case "SHOW_DISCARD_CONFIRM":
            return { ...state, showDiscardConfirm: action.payload };
        default:
            return state;
    }
}

type WordDetailsFormProps = {
    word: Doc<"words"> | null;
    onSave: (payload: WordUpdatePayload) => Promise<void>;
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
    onCancel,
    onClose,
    onConfirmLeaveReady,
    onDirtyChange,
}: WordDetailsFormProps) {
    const initialValues = word ?? NEW_WORD_DEFAULTS;
    const [state, dispatch] = useReducer(
        wordFormReducer,
        word,
        (w): WordFormState => getInitialWordFormState(w),
    );
    const pendingLeaveResolveRef = useRef<((value: boolean) => void) | null>(null);

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

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const confirmLeave = useCallback((): Promise<boolean> => {
        if (!isDirty) return Promise.resolve(true);
        dispatch({ type: "SHOW_DISCARD_CONFIRM", payload: true });
        return new Promise((resolve) => {
            pendingLeaveResolveRef.current = resolve;
        });
    }, [isDirty]);

    useEffect(() => {
        onConfirmLeaveReady?.(confirmLeave);
    }, [onConfirmLeaveReady, confirmLeave]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isTextValid) return;
        dispatch({ type: "SET_SUBMITTING", payload: true });
        try {
            const payload: WordUpdatePayload = {
                text: state.text.trim(),
                type: state.type,
                meaning: state.meaning,
                tags: state.tags || undefined,
            };
            if (word) payload.wordId = word._id;
            await onSave(payload);
            onClose();
        } finally {
            dispatch({ type: "SET_SUBMITTING", payload: false });
        }
    }

    function handleCloseClick() {
        if (isDirty) {
            dispatch({ type: "SHOW_DISCARD_CONFIRM", payload: true });
        } else {
            onClose();
        }
    }

    function handleConfirmDiscard() {
        pendingLeaveResolveRef.current?.(true);
        pendingLeaveResolveRef.current = null;
        dispatch({ type: "SHOW_DISCARD_CONFIRM", payload: false });
        onClose();
    }

    function handleKeepEditing() {
        pendingLeaveResolveRef.current?.(false);
        pendingLeaveResolveRef.current = null;
        dispatch({ type: "SHOW_DISCARD_CONFIRM", payload: false });
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-4">
                    <h2 className="text-lg font-semibold">{word ? word.meaning : "New Word"}</h2>
                    <Button type="button" variant="secondary" aria-label="Close" onClick={handleCloseClick}>
                        <X size={20} aria-hidden />
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col">
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
                    <div className="flex gap-2 pt-2 mt-auto">
                        <Button type="submit" variant="primary" disabled={state.isSubmitting || !isTextValid}>
                            Save
                        </Button>
                        <Button type="button" variant="secondary" disabled={state.isSubmitting} onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

            <Dialog.Root
                open={state.showDiscardConfirm}
                onOpenChange={(open) => dispatch({ type: "SHOW_DISCARD_CONFIRM", payload: open })}
            >
                <Dialog size="sm" className="p-6">
                    <Dialog.Title>Discard changes?</Dialog.Title>
                    <Dialog.Description>You have unsaved changes. Do you want to discard them?</Dialog.Description>
                    <div className="mt-4 flex gap-2 justify-end">
                        <Button variant="secondary" onClick={handleKeepEditing}>
                            Keep editing
                        </Button>
                        <Button variant="primary" onClick={handleConfirmDiscard}>
                            Discard changes
                        </Button>
                    </div>
                </Dialog>
            </Dialog.Root>
        </>
    );
}
