import { useCallback, useEffect, useRef, useReducer } from "react";
import { Button, Dialog, Field, Input } from "@cloudflare/kumo";
import { X } from "@phosphor-icons/react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type QuestionTypeUpdatePayload = {
    questionTypeId?: Id<"questionTypes">;
    name: string;
    dataTemplate: string;
    questionTemplate: string;
    answerTemplate: string;
};

export type ConfirmLeaveFn = () => Promise<boolean>;

const NEW_QUESTION_TYPE_DEFAULTS = {
    name: "",
    dataTemplate: "",
    questionTemplate: "",
    answerTemplate: "",
};

type QuestionTypeFormState = {
    name: string;
    dataTemplate: string;
    questionTemplate: string;
    answerTemplate: string;
    isSubmitting: boolean;
    showDiscardConfirm: boolean;
};

type QuestionTypeFormAction =
    | {
          type: "SET_FIELD";
          payload: Partial<
              Pick<QuestionTypeFormState, "name" | "dataTemplate" | "questionTemplate" | "answerTemplate">
          >;
      }
    | { type: "SET_SUBMITTING"; payload: boolean }
    | { type: "SHOW_DISCARD_CONFIRM"; payload: boolean };

function getInitialQuestionTypeFormState(questionType: Doc<"questionTypes"> | null): QuestionTypeFormState {
    const v = questionType ?? NEW_QUESTION_TYPE_DEFAULTS;
    return {
        name: v.name,
        dataTemplate: v.dataTemplate,
        questionTemplate: v.questionTemplate,
        answerTemplate: v.answerTemplate,
        isSubmitting: false,
        showDiscardConfirm: false,
    };
}

function questionTypeFormReducer(state: QuestionTypeFormState, action: QuestionTypeFormAction): QuestionTypeFormState {
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

type QuestionTypeDetailsFormProps = {
    questionType: Doc<"questionTypes"> | null;
    onSave: (payload: QuestionTypeUpdatePayload) => Promise<void>;
    onCancel: () => void;
    onClose: () => void;
    onConfirmLeaveReady?: (confirmLeave: ConfirmLeaveFn) => void;
    onDirtyChange?: (dirty: boolean) => void;
};

function formValuesEqual(
    a: {
        name: string;
        dataTemplate: string;
        questionTemplate: string;
        answerTemplate: string;
    },
    b: {
        name: string;
        dataTemplate: string;
        questionTemplate: string;
        answerTemplate: string;
    },
): boolean {
    return (
        a.name === b.name &&
        a.dataTemplate === b.dataTemplate &&
        a.questionTemplate === b.questionTemplate &&
        a.answerTemplate === b.answerTemplate
    );
}

const textareaClassName = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[80px] font-mono";

export function QuestionTypeDetailsForm({
    questionType,
    onSave,
    onCancel,
    onClose,
    onConfirmLeaveReady,
    onDirtyChange,
}: QuestionTypeDetailsFormProps) {
    const initialValues = questionType ?? NEW_QUESTION_TYPE_DEFAULTS;
    const [state, dispatch] = useReducer(
        questionTypeFormReducer,
        questionType,
        (qt): QuestionTypeFormState => getInitialQuestionTypeFormState(qt),
    );
    const pendingLeaveResolveRef = useRef<((value: boolean) => void) | null>(null);

    const current = {
        name: state.name,
        dataTemplate: state.dataTemplate,
        questionTemplate: state.questionTemplate,
        answerTemplate: state.answerTemplate,
    };
    const initial = {
        name: initialValues.name,
        dataTemplate: initialValues.dataTemplate,
        questionTemplate: initialValues.questionTemplate,
        answerTemplate: initialValues.answerTemplate,
    };
    const isDirty = !formValuesEqual(current, initial);
    const isNameValid = state.name.trim() !== "";

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
        if (!isNameValid) return;
        dispatch({ type: "SET_SUBMITTING", payload: true });
        try {
            const payload: QuestionTypeUpdatePayload = {
                name: state.name.trim(),
                dataTemplate: state.dataTemplate,
                questionTemplate: state.questionTemplate,
                answerTemplate: state.answerTemplate,
            };
            if (questionType) payload.questionTypeId = questionType._id;
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
                    <h2 className="text-lg font-semibold">{questionType ? questionType.name : "New Question Type"}</h2>
                    <Button type="button" variant="secondary" aria-label="Close" onClick={handleCloseClick}>
                        <X size={20} aria-hidden />
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col">
                    <Field label="Name" required>
                        <Input
                            value={state.name}
                            onChange={(e) => dispatch({ type: "SET_FIELD", payload: { name: e.target.value } })}
                            disabled={state.isSubmitting}
                            placeholder="Descriptive name for this question type"
                            aria-label="Name"
                        />
                    </Field>
                    <Field label="Data template">
                        <textarea
                            value={state.dataTemplate}
                            onChange={(e) => dispatch({ type: "SET_FIELD", payload: { dataTemplate: e.target.value } })}
                            disabled={state.isSubmitting}
                            className={textareaClassName}
                            placeholder="Template for question data"
                            aria-label="Data template"
                            rows={4}
                        />
                    </Field>
                    <Field label="Question template">
                        <textarea
                            value={state.questionTemplate}
                            onChange={(e) =>
                                dispatch({ type: "SET_FIELD", payload: { questionTemplate: e.target.value } })
                            }
                            disabled={state.isSubmitting}
                            className={textareaClassName}
                            placeholder="Template for the question text"
                            aria-label="Question template"
                            rows={4}
                        />
                    </Field>
                    <Field label="Answer template">
                        <textarea
                            value={state.answerTemplate}
                            onChange={(e) =>
                                dispatch({ type: "SET_FIELD", payload: { answerTemplate: e.target.value } })
                            }
                            disabled={state.isSubmitting}
                            className={textareaClassName}
                            placeholder="Template for the answer"
                            aria-label="Answer template"
                            rows={4}
                        />
                    </Field>
                    <div className="flex gap-2 pt-2 mt-auto">
                        <Button type="submit" variant="primary" disabled={state.isSubmitting || !isNameValid}>
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
