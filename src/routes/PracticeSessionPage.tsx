import { useReducer } from "react";
import { Button, Empty, Select, Text } from "@cloudflare/kumo";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PracticeQuestionBlock } from "../components/PracticeQuestionBlock";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { getBrowserLanguageCode } from "../lib/languages";

type Phase = "initial" | "running" | "ended";

type PracticeSessionState = {
    phase: Phase;
    selectedSessionTypeId: Id<"sessionTypes"> | null;
    sessionId: Id<"sessions"> | null;
    currentQuestionIndex: number;
    answer: string;
    feedback: { isCorrect: boolean } | null;
    isGenerating: boolean;
};

type PracticeSessionAction =
    | { type: "SELECT_SESSION_TYPE"; payload: Id<"sessionTypes"> | null }
    | { type: "START_SESSION"; payload: Id<"sessions"> }
    | { type: "SET_QUESTION_INDEX"; payload: number }
    | { type: "SET_ANSWER"; payload: string }
    | { type: "SET_FEEDBACK"; payload: { isCorrect: boolean } | null }
    | { type: "SET_GENERATING"; payload: boolean }
    | { type: "END_SESSION" };

const initialSessionState: PracticeSessionState = {
    phase: "initial",
    selectedSessionTypeId: null,
    sessionId: null,
    currentQuestionIndex: 0,
    answer: "",
    feedback: null,
    isGenerating: false,
};

function practiceSessionReducer(state: PracticeSessionState, action: PracticeSessionAction): PracticeSessionState {
    switch (action.type) {
        case "SELECT_SESSION_TYPE":
            return { ...state, selectedSessionTypeId: action.payload };
        case "START_SESSION":
            return {
                ...state,
                phase: "running",
                sessionId: action.payload,
                currentQuestionIndex: 0,
                answer: "",
                feedback: null,
                isGenerating: false,
            };
        case "SET_QUESTION_INDEX":
            return { ...state, currentQuestionIndex: action.payload, answer: "", feedback: null };
        case "SET_ANSWER":
            return { ...state, answer: action.payload };
        case "SET_FEEDBACK":
            return { ...state, feedback: action.payload };
        case "SET_GENERATING":
            return { ...state, isGenerating: action.payload };
        case "END_SESSION":
            return { ...state, phase: "ended" };
        default:
            return state;
    }
}

export function PracticeSessionPage() {
    const { user } = useAuth();
    const { language } = useCurrentLanguage();
    const [state, dispatch] = useReducer(practiceSessionReducer, initialSessionState);

    const sessionTypes = useQuery(api.sessionTypes.listByUserAndLanguage, { language });
    const sessionData = useQuery(
        api.sessions.getWithQuestions,
        state.sessionId !== null ? { sessionId: state.sessionId, language } : "skip",
    );
    const generateSession = useAction(api.sessionsActions.generateSession);
    const submitAnswer = useMutation(api.practice.submitAnswer);
    const endSession = useMutation(api.sessions.endSession);

    const questions = sessionData?.questions ?? [];
    const count = questions.length;
    const currentQuestion = count > 0 ? questions[state.currentQuestionIndex] : null;
    const isLastQuestion = count > 0 && state.currentQuestionIndex === count - 1;
    const answeredCount = questions.filter((q) => q.respondedAt !== undefined).length;
    const score = questions.filter((q) => q.isCorrect === true).length;
    const allAnswered = count > 0 && answeredCount === count;
    const showContinue = isLastQuestion && state.feedback !== null && allAnswered;
    const showNext = currentQuestion !== null && state.feedback !== null && !isLastQuestion;

    const hasSessionType = state.selectedSessionTypeId !== null;
    const canStart = hasSessionType && !state.isGenerating;

    async function handleStart() {
        if (state.selectedSessionTypeId === null) return;
        dispatch({ type: "SET_GENERATING", payload: true });
        try {
            const result = await generateSession({
                sessionTypeId: state.selectedSessionTypeId,
                language,
                userLanguage: getBrowserLanguageCode(),
            });
            if (result !== null) {
                dispatch({ type: "START_SESSION", payload: result.sessionId });
            }
        } catch (err) {
            console.error("Failed to generate session:", err);
        } finally {
            dispatch({ type: "SET_GENERATING", payload: false });
        }
    }

    async function handleCheckAnswer() {
        if (currentQuestion === null) return;
        try {
            await submitAnswer({
                questionId: currentQuestion._id,
                answerGiven: state.answer,
            });
            const isCorrect = state.answer.trim().toLowerCase() === currentQuestion.expected.trim().toLowerCase();
            dispatch({ type: "SET_FEEDBACK", payload: { isCorrect } });
        } catch (err) {
            console.error("Failed to submit answer:", err);
        }
    }

    function handleNext() {
        if (state.currentQuestionIndex < count - 1) {
            dispatch({ type: "SET_QUESTION_INDEX", payload: state.currentQuestionIndex + 1 });
        }
    }

    async function handleContinue() {
        if (state.sessionId === null) return;
        try {
            await endSession({ sessionId: state.sessionId });
            dispatch({ type: "END_SESSION" });
        } catch (err) {
            console.error("Failed to end session:", err);
        }
    }

    async function handleStop() {
        if (state.sessionId === null) return;
        try {
            await endSession({ sessionId: state.sessionId });
            dispatch({ type: "END_SESSION" });
        } catch (err) {
            console.error("Failed to end session:", err);
        }
    }

    return (
        <section className="flex flex-col gap-4">
            <Text variant="heading2">Practice Session</Text>

            {sessionTypes === undefined ? (
                <p className="text-slate-500" aria-busy="true">
                    Loading…
                </p>
            ) : !user ? (
                <Empty title="Log in to practice" description="Sign in to generate and run a practice session." />
            ) : sessionTypes.length === 0 ? (
                <Empty
                    title="No session types yet"
                    description="Add session types for the current language to run a practice session."
                />
            ) : (
                <div className="flex flex-col gap-4 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            label="Session Type"
                            placeholder="Select a Session Type"
                            value={state.selectedSessionTypeId}
                            onValueChange={(v) =>
                                (state.phase === "initial" || state.phase === "ended") &&
                                dispatch({
                                    type: "SELECT_SESSION_TYPE",
                                    payload: (v as Id<"sessionTypes">) ?? null,
                                })
                            }
                            renderValue={(id) => {
                                if (id == null) return "Select a Session Type";
                                const st = sessionTypes.find((s) => s._id === id);
                                return st?.name ?? "Select a Session Type";
                            }}
                            className="w-full min-w-0 max-w-xs"
                            disabled={state.phase === "running"}
                            aria-readonly={state.phase === "running"}
                        >
                            {sessionTypes.map((st) => (
                                <Select.Option key={st._id} value={st._id}>
                                    {st.name}
                                </Select.Option>
                            ))}
                        </Select>
                        {(state.phase === "initial" || state.phase === "ended") && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleStart}
                                disabled={!canStart}
                                aria-busy={state.isGenerating}
                                className="self-end"
                            >
                                {state.isGenerating ? "Loading…" : "Start"}
                            </Button>
                        )}
                        {state.phase === "running" && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleStop}
                                aria-label="Stop session"
                                className="self-end"
                            >
                                Stop
                            </Button>
                        )}
                    </div>

                    {state.phase === "initial" && (
                        <p className="text-sm text-slate-600">Choose a session type and click Start.</p>
                    )}

                    {state.phase === "running" && (
                        <>
                            {sessionData === undefined ? (
                                <p className="text-slate-500" aria-busy="true">
                                    Loading session…
                                </p>
                            ) : (
                                <>
                                    {count > 0 && (
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                                            <span>
                                                Question {state.currentQuestionIndex + 1} of {count}
                                            </span>
                                            <span>Score {score}</span>
                                        </div>
                                    )}

                                    {currentQuestion !== undefined && currentQuestion !== null && (
                                        <PracticeQuestionBlock
                                            questionText={currentQuestion.text}
                                            expectedAnswer={state.feedback !== null ? currentQuestion.expected : ""}
                                            answer={state.answer}
                                            onAnswerChange={(value) => dispatch({ type: "SET_ANSWER", payload: value })}
                                            feedback={state.feedback}
                                            onCheckAnswer={handleCheckAnswer}
                                            checkAnswerDisabled={state.answer.trim() === ""}
                                        >
                                            {showNext && (
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={handleNext}
                                                    aria-label="Next question"
                                                >
                                                    Next
                                                </Button>
                                            )}
                                            {showContinue && (
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={handleContinue}
                                                    aria-label="Continue"
                                                >
                                                    Continue
                                                </Button>
                                            )}
                                        </PracticeQuestionBlock>
                                    )}

                                    {count === 0 && sessionData !== undefined && (
                                        <p className="text-slate-500">No questions in this session.</p>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {state.phase === "ended" && sessionData && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <h3 className="text-sm font-medium text-slate-700">Summary</h3>
                            <p className="mt-2 text-slate-900">
                                You answered {answeredCount} question{answeredCount !== 1 ? "s" : ""}.
                            </p>
                            <p className="mt-1 text-slate-900">
                                {score} correct out of {answeredCount}.
                            </p>
                            <p className="mt-1 text-slate-900">
                                {answeredCount > 0 ? `${Math.round((100 * score) / answeredCount)}% correct` : "—"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
