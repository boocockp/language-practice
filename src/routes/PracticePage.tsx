import { useReducer } from "react";
import { Button, Empty, Select, Text } from "@cloudflare/kumo";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PracticeQuestionBlock } from "../components/PracticeQuestionBlock";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { getBrowserLanguageCode } from "../lib/languages";

type PracticeState = {
    selectedQuestionTypeId: Id<"questionTypes"> | null;
    currentQuestion: {
        questionId: Id<"questions">;
        text: string;
        expected: string;
    } | null;
    answer: string;
    feedback: { isCorrect: boolean } | null;
    isGenerating: boolean;
};

type PracticeAction =
    | { type: "SELECT_QUESTION_TYPE"; payload: Id<"questionTypes"> | null }
    | {
          type: "SET_CURRENT_QUESTION";
          payload: {
              questionId: Id<"questions">;
              text: string;
              expected: string;
          } | null;
      }
    | { type: "SET_ANSWER"; payload: string }
    | { type: "SET_FEEDBACK"; payload: { isCorrect: boolean } | null }
    | { type: "SET_GENERATING"; payload: boolean };

const initialPracticeState: PracticeState = {
    selectedQuestionTypeId: null,
    currentQuestion: null,
    answer: "",
    feedback: null,
    isGenerating: false,
};

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
    switch (action.type) {
        case "SELECT_QUESTION_TYPE":
            return { ...state, selectedQuestionTypeId: action.payload };
        case "SET_CURRENT_QUESTION":
            return { ...state, currentQuestion: action.payload };
        case "SET_ANSWER":
            return { ...state, answer: action.payload };
        case "SET_FEEDBACK":
            return { ...state, feedback: action.payload };
        case "SET_GENERATING":
            return { ...state, isGenerating: action.payload };
        default:
            return state;
    }
}

export function PracticePage() {
    const { user } = useAuth();
    const { language } = useCurrentLanguage();
    const [state, dispatch] = useReducer(practiceReducer, initialPracticeState);

    const questionTypes = useQuery(api.questionTypes.listByUserAndLanguage, { language });
    const generateQuestion = useAction(api.practiceActions.generateQuestion);
    const submitAnswer = useMutation(api.practice.submitAnswer);

    const hasQuestionType = state.selectedQuestionTypeId !== null;
    const hasCurrentQuestion = state.currentQuestion !== null;
    const showNextButton = hasQuestionType && (!hasCurrentQuestion || state.feedback !== null) && !state.isGenerating;

    async function handleNextQuestion() {
        if (state.selectedQuestionTypeId === null) return;
        dispatch({ type: "SET_GENERATING", payload: true });
        try {
            const result = await generateQuestion({
                questionTypeId: state.selectedQuestionTypeId,
                language,
                userLanguage: getBrowserLanguageCode(),
            });
            if (result) {
                dispatch({
                    type: "SET_CURRENT_QUESTION",
                    payload: {
                        questionId: result.questionId,
                        text: result.text,
                        expected: result.expected,
                    },
                });
                dispatch({ type: "SET_ANSWER", payload: "" });
                dispatch({ type: "SET_FEEDBACK", payload: null });
            }
        } catch (err) {
            console.error("Failed to generate question:", err);
        } finally {
            dispatch({ type: "SET_GENERATING", payload: false });
        }
    }

    async function handleCheckAnswer() {
        if (!state.currentQuestion) return;
        try {
            await submitAnswer({
                questionId: state.currentQuestion.questionId,
                answerGiven: state.answer,
            });
            const isCorrect = state.answer.trim().toLowerCase() === state.currentQuestion.expected.trim().toLowerCase();
            dispatch({ type: "SET_FEEDBACK", payload: { isCorrect } });
        } catch (err) {
            console.error("Failed to submit answer:", err);
        }
    }

    return (
        <section className="flex flex-col gap-4">
            <Text variant="heading2">Practice</Text>

            {questionTypes === undefined ? (
                <p className="text-slate-500" aria-busy="true">
                    Loading…
                </p>
            ) : !user ? (
                <Empty title="Log in to practice" description="Sign in to generate and answer practice questions." />
            ) : questionTypes.length === 0 ? (
                <Empty
                    title="No question types yet"
                    description="Add question types for the current language to practice."
                />
            ) : (
                <div className="flex flex-col gap-4 max-w-xl">
                    <Select
                        label="Question Type"
                        placeholder="Select a Question Type"
                        value={state.selectedQuestionTypeId}
                        onValueChange={(v) =>
                            dispatch({ type: "SELECT_QUESTION_TYPE", payload: (v as Id<"questionTypes">) ?? null })
                        }
                        renderValue={(id) => {
                            if (id == null) return "Select a Question Type";
                            const qt = questionTypes.find((q) => q._id === id);
                            return qt?.name ?? "Select a Question Type";
                        }}
                        className="w-full min-w-0"
                    >
                        {questionTypes.map((qt) => (
                            <Select.Option key={qt._id} value={qt._id}>
                                {qt.name}
                            </Select.Option>
                        ))}
                    </Select>

                    <PracticeQuestionBlock
                        questionText={state.currentQuestion?.text ?? ""}
                        expectedAnswer={
                            state.feedback !== null && state.currentQuestion ? state.currentQuestion.expected : ""
                        }
                        answer={state.answer}
                        onAnswerChange={(value) => dispatch({ type: "SET_ANSWER", payload: value })}
                        feedback={state.feedback}
                        onCheckAnswer={handleCheckAnswer}
                        answerDisabled={!hasCurrentQuestion}
                        checkAnswerDisabled={state.answer.trim() === ""}
                    >
                        {showNextButton && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleNextQuestion}
                                disabled={state.isGenerating}
                                aria-label="Next question"
                                aria-busy={state.isGenerating}
                            >
                                {state.isGenerating ? "Loading…" : "Next Question"}
                            </Button>
                        )}
                    </PracticeQuestionBlock>
                </div>
            )}
        </section>
    );
}
