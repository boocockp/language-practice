import { useState } from "react";
import { Button, Empty, Select, Text, Textarea } from "@cloudflare/kumo";
import { Check, X } from "@phosphor-icons/react";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";

const BORDERED_BLOCK =
  "border border-slate-200 rounded-lg p-3 min-h-[2.5rem] bg-slate-50";

export function PracticePage() {
  const { user } = useAuth();
  const { language } = useCurrentLanguage();
  const [selectedQuestionTypeId, setSelectedQuestionTypeId] = useState<
    Id<"questionTypes"> | null
  >(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: Id<"questions">;
    text: string;
    expected: string;
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean } | null>(null);

  const questionTypes = useQuery(
    api.questionTypes.listByUserAndLanguage,
    { language },
  );
  const generateQuestion = useAction(api.practiceActions.generateQuestion);
  const submitAnswer = useMutation(api.practice.submitAnswer);

  const hasQuestionType = selectedQuestionTypeId !== null;
  const hasCurrentQuestion = currentQuestion !== null;
  const showNextButton =
    hasQuestionType && (!hasCurrentQuestion || feedback !== null);
  const showCheckButton = hasCurrentQuestion && feedback === null;

  async function handleNextQuestion() {
    if (selectedQuestionTypeId === null) return;
    try {
      const result = await generateQuestion({
        questionTypeId: selectedQuestionTypeId,
        language,
      });
      if (result) {
        setCurrentQuestion({
          questionId: result.questionId,
          text: result.text,
          expected: result.expected,
        });
        setAnswer("");
        setFeedback(null);
      }
    } catch (err) {
      console.error("Failed to generate question:", err);
    }
  }

  async function handleCheckAnswer() {
    if (!currentQuestion) return;
    try {
      await submitAnswer({
        questionId: currentQuestion.questionId,
        answerGiven: answer,
      });
      const isCorrect =
        answer.trim().toLowerCase() ===
        currentQuestion.expected.trim().toLowerCase();
      setFeedback({ isCorrect });
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
        <Empty
          title="Log in to practice"
          description="Sign in to generate and answer practice questions."
        />
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
            value={selectedQuestionTypeId}
            onValueChange={(v) =>
              setSelectedQuestionTypeId((v as Id<"questionTypes">) ?? null)
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

          <div>
            <label
              htmlFor="question-display"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Question
            </label>
            <div
              id="question-display"
              className={BORDERED_BLOCK}
              aria-label="Question"
            >
              {currentQuestion?.text ?? ""}
            </div>
          </div>

          <div>
            <label
              htmlFor="answer-input"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Answer
            </label>
            <Textarea
              id="answer-input"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!hasCurrentQuestion}
              className="min-h-[4rem]"
              aria-label="Answer"
            />
          </div>

          <div>
            <label
              htmlFor="expected-display"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Expected Answer
            </label>
            <div
              id="expected-display"
              className={BORDERED_BLOCK}
              aria-label="Expected Answer"
            >
              {feedback !== null && currentQuestion
                ? currentQuestion.expected
                : ""}
            </div>
          </div>

          <div>
            <label
              htmlFor="result-display"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Result
            </label>
            <div
              id="result-display"
              className={BORDERED_BLOCK}
              aria-label="Result"
            >
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
            {showNextButton && (
              <Button
                type="button"
                variant="primary"
                onClick={handleNextQuestion}
                aria-label="Next question"
              >
                Next Question
              </Button>
            )}
            {showCheckButton && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCheckAnswer}
                aria-label="Check answer"
                disabled={answer.trim() === ""}
              >
                Check Answer
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
