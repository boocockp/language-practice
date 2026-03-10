import { useReducer } from "react";
import { Field, Input } from "@cloudflare/kumo";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { DetailsFormShell } from "../../components/DetailsFormShell";
import type { ConfirmLeaveFn } from "../../lib/confirmLeave";

export type QuestionTypeUpdatePayload = {
    questionTypeId?: Id<"questionTypes">;
    name: string;
    dataTemplate: string;
    questionTemplate: string;
    answerTemplate: string;
};

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
};

type QuestionTypeFormAction =
    | {
          type: "SET_FIELD";
          payload: Partial<
              Pick<QuestionTypeFormState, "name" | "dataTemplate" | "questionTemplate" | "answerTemplate">
          >;
      }
    | { type: "SET_SUBMITTING"; payload: boolean };

function getInitialQuestionTypeFormState(questionType: Doc<"questionTypes"> | null): QuestionTypeFormState {
    const v = questionType ?? NEW_QUESTION_TYPE_DEFAULTS;
    return {
        name: v.name,
        dataTemplate: v.dataTemplate,
        questionTemplate: v.questionTemplate,
        answerTemplate: v.answerTemplate,
        isSubmitting: false,
    };
}

function questionTypeFormReducer(state: QuestionTypeFormState, action: QuestionTypeFormAction): QuestionTypeFormState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, ...action.payload };
        case "SET_SUBMITTING":
            return { ...state, isSubmitting: action.payload };
        default:
            return state;
    }
}

type QuestionTypeDetailsFormProps = {
    questionType: Doc<"questionTypes"> | null;
    onSave: (payload: QuestionTypeUpdatePayload) => Promise<void>;
    onSaveWithoutNavigate?: (payload: QuestionTypeUpdatePayload) => Promise<void>;
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
    onSaveWithoutNavigate,
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

    function buildPayload(): QuestionTypeUpdatePayload {
        const payload: QuestionTypeUpdatePayload = {
            name: state.name.trim(),
            dataTemplate: state.dataTemplate,
            questionTemplate: state.questionTemplate,
            answerTemplate: state.answerTemplate,
        };
        if (questionType) payload.questionTypeId = questionType._id;
        return payload;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isNameValid) return;
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
            title={questionType ? questionType.name : "New Question Type"}
            onClose={onClose}
            onConfirmLeaveReady={onConfirmLeaveReady}
            onDirtyChange={onDirtyChange}
            onSaveAndLeave={
                onSaveWithoutNavigate
                    ? async () => {
                          if (!isNameValid) return;
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
            isSubmitDisabled={!isNameValid}
            onSubmit={handleSubmit}
            onCancel={onCancel}
        >
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
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { questionTemplate: e.target.value } })}
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
                    onChange={(e) => dispatch({ type: "SET_FIELD", payload: { answerTemplate: e.target.value } })}
                    disabled={state.isSubmitting}
                    className={textareaClassName}
                    placeholder="Template for the answer"
                    aria-label="Answer template"
                    rows={4}
                />
            </Field>
        </DetailsFormShell>
    );
}
