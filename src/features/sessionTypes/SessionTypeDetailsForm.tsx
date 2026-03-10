import { useReducer } from "react";
import { Button, Field, Input } from "@cloudflare/kumo";
import { CaretDown, CaretUp, Plus, Trash } from "@phosphor-icons/react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { DetailsFormShell } from "../../components/DetailsFormShell";
import type { ConfirmLeaveFn } from "../../lib/confirmLeave";
import { cn } from "../../lib/cn";

export type SessionQuestionItem = {
    questionTypeId: Id<"questionTypes">;
    count: number;
};

export type SessionTypeUpdatePayload = {
    sessionTypeId?: Id<"sessionTypes">;
    name: string;
    questions: SessionQuestionItem[];
};

const NEW_SESSION_TYPE_DEFAULTS = {
    name: "",
    questions: [] as SessionQuestionItem[],
};

type SessionTypeFormState = {
    name: string;
    questions: SessionQuestionItem[];
    isSubmitting: boolean;
};

type SessionTypeFormAction =
    | { type: "SET_FIELD"; payload: Partial<Pick<SessionTypeFormState, "name">> }
    | { type: "SET_QUESTIONS"; payload: SessionQuestionItem[] }
    | { type: "ADD_QUESTION"; payload: SessionQuestionItem }
    | { type: "REMOVE_QUESTION"; payload: number }
    | { type: "UPDATE_QUESTION"; payload: { index: number; questionTypeId?: Id<"questionTypes">; count?: number } }
    | { type: "MOVE_UP"; payload: number }
    | { type: "MOVE_DOWN"; payload: number }
    | { type: "SET_SUBMITTING"; payload: boolean };

function getInitialState(sessionType: Doc<"sessionTypes"> | null): SessionTypeFormState {
    const v = sessionType ?? NEW_SESSION_TYPE_DEFAULTS;
    return {
        name: typeof v.name === "string" ? v.name : "",
        questions: Array.isArray(v.questions)
            ? v.questions.map((q) => ({ questionTypeId: q.questionTypeId, count: q.count }))
            : [],
        isSubmitting: false,
    };
}

function sessionTypeFormReducer(state: SessionTypeFormState, action: SessionTypeFormAction): SessionTypeFormState {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, ...action.payload };
        case "SET_QUESTIONS":
            return { ...state, questions: action.payload };
        case "ADD_QUESTION":
            return { ...state, questions: [...state.questions, action.payload] };
        case "REMOVE_QUESTION": {
            const next = state.questions.slice();
            next.splice(action.payload, 1);
            return { ...state, questions: next };
        }
        case "UPDATE_QUESTION": {
            const { index, questionTypeId, count } = action.payload;
            const next = state.questions.slice();
            const item = next[index];
            if (!item) return state;
            if (questionTypeId !== undefined) item.questionTypeId = questionTypeId;
            if (count !== undefined) item.count = Math.max(1, count);
            return { ...state, questions: next };
        }
        case "MOVE_UP": {
            if (action.payload <= 0) return state;
            const next = state.questions.slice();
            const i = action.payload;
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            return { ...state, questions: next };
        }
        case "MOVE_DOWN": {
            if (action.payload >= state.questions.length - 1) return state;
            const next = state.questions.slice();
            const i = action.payload;
            [next[i], next[i + 1]] = [next[i + 1], next[i]];
            return { ...state, questions: next };
        }
        case "SET_SUBMITTING":
            return { ...state, isSubmitting: action.payload };
        default:
            return state;
    }
}

function formValuesEqual(
    a: { name: string; questions: SessionQuestionItem[] },
    b: { name: string; questions: SessionQuestionItem[] },
): boolean {
    if (a.name !== b.name || a.questions.length !== b.questions.length) return false;
    for (let i = 0; i < a.questions.length; i++) {
        const pa = a.questions[i];
        const pb = b.questions[i];
        if (pa.questionTypeId !== pb.questionTypeId || pa.count !== pb.count) return false;
    }
    return true;
}

type SessionTypeDetailsFormProps = {
    sessionType: Doc<"sessionTypes"> | null;
    questionTypes: Doc<"questionTypes">[];
    onSave: (payload: SessionTypeUpdatePayload) => Promise<void>;
    onSaveWithoutNavigate?: (payload: SessionTypeUpdatePayload) => Promise<void>;
    onCancel: () => void;
    onClose: () => void;
    onConfirmLeaveReady?: (confirmLeave: ConfirmLeaveFn) => void;
    onDirtyChange?: (dirty: boolean) => void;
};

const inputClassName =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export function SessionTypeDetailsForm({
    sessionType,
    questionTypes,
    onSave,
    onSaveWithoutNavigate,
    onCancel,
    onClose,
    onConfirmLeaveReady,
    onDirtyChange,
}: SessionTypeDetailsFormProps) {
    const initialValues = sessionType ?? NEW_SESSION_TYPE_DEFAULTS;
    const initialQuestions =
        initialValues.questions?.map((q) => ({ questionTypeId: q.questionTypeId, count: q.count })) ?? [];
    const [state, dispatch] = useReducer(sessionTypeFormReducer, sessionType, getInitialState);

    const initial = {
        name: initialValues.name ?? "",
        questions: initialQuestions,
    };
    const current = { name: state.name, questions: state.questions };
    const isDirty = !formValuesEqual(current, initial);
    const isNameValid = state.name.trim() !== "";

    function buildPayload(): SessionTypeUpdatePayload {
        const payload: SessionTypeUpdatePayload = {
            name: state.name.trim(),
            questions: state.questions.map((q) => ({ questionTypeId: q.questionTypeId, count: q.count })),
        };
        if (sessionType) payload.sessionTypeId = sessionType._id;
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

    function questionTypeName(id: Id<"questionTypes">): string {
        const qt = questionTypes.find((q) => q._id === id);
        return qt?.name ?? "Unknown";
    }

    const canAddQuestion = questionTypes.length > 0;

    return (
        <DetailsFormShell
            title={sessionType ? sessionType.name : "New Session Type"}
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
                    placeholder="Descriptive name for this session type"
                    aria-label="Name"
                />
            </Field>

            <Field label="Session Questions">
                <div className="space-y-2">
                    {state.questions.length === 0 && (
                        <p className="text-sm text-slate-500">No session questions yet. Add one below.</p>
                    )}
                    <ul className="space-y-2" aria-label="Session questions list">
                        {state.questions.map((q, index) => (
                            <li
                                key={`${q.questionTypeId}-${index}`}
                                className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2"
                            >
                                <select
                                    value={q.questionTypeId}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "UPDATE_QUESTION",
                                            payload: {
                                                index,
                                                questionTypeId: e.target.value as Id<"questionTypes">,
                                            },
                                        })
                                    }
                                    disabled={state.isSubmitting}
                                    className={cn(inputClassName, "min-w-0 flex-1")}
                                    aria-label="Question type"
                                >
                                    {questionTypes.map((qt) => (
                                        <option key={qt._id} value={qt._id}>
                                            {qt.name}
                                        </option>
                                    ))}
                                </select>
                                <label className="sr-only" htmlFor={`session-question-count-${index}`}>
                                    Count
                                </label>
                                <input
                                    id={`session-question-count-${index}`}
                                    type="number"
                                    min={1}
                                    value={q.count}
                                    onChange={(e) => {
                                        const n = e.target.valueAsNumber;
                                        dispatch({
                                            type: "UPDATE_QUESTION",
                                            payload: { index, count: Number.isFinite(n) ? n : 1 },
                                        });
                                    }}
                                    disabled={state.isSubmitting}
                                    className={cn(inputClassName, "w-20")}
                                />
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        aria-label="Move up"
                                        disabled={index === 0 || state.isSubmitting}
                                        className="min-h-8 min-w-8 p-0"
                                        onClick={() => dispatch({ type: "MOVE_UP", payload: index })}
                                    >
                                        <CaretUp size={18} aria-hidden />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        aria-label="Move down"
                                        disabled={index === state.questions.length - 1 || state.isSubmitting}
                                        className="min-h-8 min-w-8 p-0"
                                        onClick={() => dispatch({ type: "MOVE_DOWN", payload: index })}
                                    >
                                        <CaretDown size={18} aria-hidden />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        aria-label={`Remove ${questionTypeName(q.questionTypeId)}`}
                                        disabled={state.isSubmitting}
                                        className="min-h-8 min-w-8 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => dispatch({ type: "REMOVE_QUESTION", payload: index })}
                                    >
                                        <Trash size={18} aria-hidden />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {!canAddQuestion && (
                        <p className="text-sm text-amber-600">Add question types first to include them in a session.</p>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={!canAddQuestion || state.isSubmitting}
                        onClick={() =>
                            dispatch({
                                type: "ADD_QUESTION",
                                payload: {
                                    questionTypeId: questionTypes[0]._id,
                                    count: 1,
                                },
                            })
                        }
                        aria-label="Add session question"
                    >
                        <Plus size={18} aria-hidden className="mr-1 inline" />
                        Add session question
                    </Button>
                </div>
            </Field>
        </DetailsFormShell>
    );
}
