import { Button, Textarea } from "@cloudflare/kumo";
import { Check, X } from "@phosphor-icons/react";

const BORDERED_BLOCK = "border border-slate-200 rounded-lg p-3 min-h-[2.5rem] bg-slate-50";

export type PracticeQuestionBlockProps = {
    questionText: string;
    expectedAnswer: string;
    answer: string;
    onAnswerChange: (value: string) => void;
    feedback: { isCorrect: boolean } | null;
    onCheckAnswer: () => void;
    answerDisabled?: boolean;
    checkAnswerDisabled?: boolean;
    /** Slot for the primary action button (e.g. "Next Question" or "Next" / "Continue"). Rendered after the Check Answer button. */
    children?: React.ReactNode;
};

export function PracticeQuestionBlock({
    questionText,
    expectedAnswer,
    answer,
    onAnswerChange,
    feedback,
    onCheckAnswer,
    answerDisabled = false,
    checkAnswerDisabled = false,
    children,
}: PracticeQuestionBlockProps) {
    const showCheckButton = feedback === null;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label htmlFor="question-display" className="block text-sm font-medium text-slate-700 mb-1">
                    Question
                </label>
                <div id="question-display" className={BORDERED_BLOCK} aria-label="Question">
                    {questionText}
                </div>
            </div>

            <div>
                <label htmlFor="answer-input" className="block text-sm font-medium text-slate-700 mb-1">
                    Answer
                </label>
                <Textarea
                    id="answer-input"
                    placeholder="Enter your answer"
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    disabled={answerDisabled}
                    className="min-h-[4rem]"
                    aria-label="Answer"
                />
            </div>

            <div>
                <label htmlFor="expected-display" className="block text-sm font-medium text-slate-700 mb-1">
                    Expected Answer
                </label>
                <div id="expected-display" className={BORDERED_BLOCK} aria-label="Expected Answer">
                    {expectedAnswer}
                </div>
            </div>

            <div>
                <label htmlFor="result-display" className="block text-sm font-medium text-slate-700 mb-1">
                    Result
                </label>
                <div id="result-display" className={BORDERED_BLOCK} aria-label="Result">
                    {feedback !== null &&
                        (feedback.isCorrect ? (
                            <span className="flex items-center gap-2 text-green-700">
                                <Check size={20} aria-hidden />
                                Correct
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-red-700">
                                <X size={20} aria-hidden />
                                Wrong
                            </span>
                        ))}
                </div>
            </div>

            <div className="flex gap-2">
                {showCheckButton && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCheckAnswer}
                        disabled={checkAnswerDisabled}
                        aria-label="Check answer"
                    >
                        Check Answer
                    </Button>
                )}
                {children}
            </div>
        </div>
    );
}
