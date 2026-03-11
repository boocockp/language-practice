/**
 * @vitest-environment jsdom
 */
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PracticeQuestionBlock } from "./PracticeQuestionBlock";

const defaultProps = {
    questionText: "Q?",
    expectedAnswer: "A",
    answer: "",
    onAnswerChange: vi.fn(),
    feedback: null as { isCorrect: boolean } | null,
    onCheckAnswer: vi.fn(),
};

describe("PracticeQuestionBlock", () => {
    it("renders question text, answer textarea, labels", () => {
        const { container } = render(<PracticeQuestionBlock {...defaultProps} />);
        const scoped = within(container);
        expect(scoped.getByLabelText("Question")).toHaveTextContent("Q?");
        expect(scoped.getByLabelText("Answer")).toBeInTheDocument();
        expect(scoped.getByLabelText("Expected Answer")).toBeInTheDocument();
        expect(scoped.getByLabelText("Result")).toBeInTheDocument();
    });

    it("shows Check Answer button when feedback is null", () => {
        const { container } = render(<PracticeQuestionBlock {...defaultProps} />);
        const buttons = within(container).getAllByRole("button", { name: /check answer/i });
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it("hides Check Answer and shows expected answer and Correct when feedback is set", () => {
        const { container } = render(
            <PracticeQuestionBlock {...defaultProps} feedback={{ isCorrect: true }} expectedAnswer="yes" />,
        );
        const scoped = within(container);
        expect(scoped.queryAllByRole("button", { name: /check answer/i })).toHaveLength(0);
        expect(scoped.getByLabelText("Expected Answer")).toHaveTextContent("yes");
        expect(scoped.getByText("Correct")).toBeInTheDocument();
    });

    it("shows Wrong when feedback.isCorrect is false", () => {
        const { container } = render(<PracticeQuestionBlock {...defaultProps} feedback={{ isCorrect: false }} />);
        expect(within(container).getByText("Wrong")).toBeInTheDocument();
    });

    it("calls onCheckAnswer when Check Answer is clicked", async () => {
        const user = userEvent.setup();
        const onCheckAnswer = vi.fn();
        const { container } = render(<PracticeQuestionBlock {...defaultProps} onCheckAnswer={onCheckAnswer} />);
        const checkButton = within(container).getAllByRole("button", { name: /check answer/i })[0];
        await user.click(checkButton);
        expect(onCheckAnswer).toHaveBeenCalledTimes(1);
    });

    it("calls onAnswerChange when typing in answer", async () => {
        const user = userEvent.setup();
        const onAnswerChange = vi.fn();
        const { container } = render(<PracticeQuestionBlock {...defaultProps} onAnswerChange={onAnswerChange} />);
        const textarea = within(container).getByLabelText("Answer");
        await user.type(textarea, "x");
        expect(onAnswerChange).toHaveBeenCalled();
        expect(onAnswerChange).toHaveBeenLastCalledWith("x");
    });

    it("Check Answer disabled when checkAnswerDisabled is true", () => {
        const { container } = render(<PracticeQuestionBlock {...defaultProps} checkAnswerDisabled />);
        const checkButton = within(container).getAllByRole("button", { name: /check answer/i })[0];
        expect(checkButton).toBeDisabled();
    });

    it("renders children (action slot)", () => {
        const { container } = render(
            <PracticeQuestionBlock {...defaultProps}>
                <button type="button">Next</button>
            </PracticeQuestionBlock>,
        );
        expect(within(container).getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    it("Answer textarea disabled when answerDisabled is true", () => {
        const { container } = render(<PracticeQuestionBlock {...defaultProps} answerDisabled />);
        const textarea = within(container).getByRole("textbox", { name: /^answer$/i });
        expect(textarea).toBeDisabled();
    });
});
