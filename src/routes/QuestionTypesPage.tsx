import { useEffect, useRef } from "react";
import { Empty, Text, Button } from "@cloudflare/kumo";
import { Plus } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import {
  QuestionTypeDetailsForm,
  type ConfirmLeaveFn,
  type QuestionTypeUpdatePayload,
} from "../features/questionTypes/QuestionTypeDetailsForm";
import { QuestionTypesTable } from "../features/questionTypes/QuestionTypesTable";
import { cn } from "../lib/cn";

export function QuestionTypesPage() {
  const { user } = useAuth();
  const { language } = useCurrentLanguage();
  const { questionTypeId } = useParams<{ questionTypeId?: string }>();
  const navigate = useNavigate();
  const confirmLeaveRef = useRef<ConfirmLeaveFn | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const questionTypes = useQuery(
    api.questionTypes.listByUserAndLanguage,
    { language },
  );
  const isNewQuestionType = questionTypeId === "_new";
  const selectedQuestionType = useQuery(
    api.questionTypes.getById,
    questionTypeId &&
      questionTypeId !== "_new" &&
      language
      ? {
          questionTypeId: questionTypeId as Id<"questionTypes">,
          language,
        }
      : "skip",
  );
  const updateQuestionType = useMutation(api.questionTypes.update);
  const createQuestionType = useMutation(api.questionTypes.create);

  async function handleRowClick(id: Id<"questionTypes">) {
    const confirmLeave =
      confirmLeaveRef.current ?? (() => Promise.resolve(true));
    const ok = await confirmLeave();
    if (ok) navigate(`/question-types/${id}`);
  }

  async function handleAddClick() {
    if (showDetails) {
      const confirmLeave =
        confirmLeaveRef.current ?? (() => Promise.resolve(true));
      const ok = await confirmLeave();
      if (!ok) return;
    }
    navigate("/question-types/_new");
  }

  function goToQuestionTypes() {
    navigate("/question-types");
  }

  async function handleSave(payload: QuestionTypeUpdatePayload) {
    if (payload.questionTypeId) {
      await updateQuestionType({
        questionTypeId: payload.questionTypeId,
        name: payload.name,
        dataTemplate: payload.dataTemplate,
        questionTemplate: payload.questionTemplate,
        answerTemplate: payload.answerTemplate,
      });
    } else {
      await createQuestionType({
        language,
        name: payload.name,
        dataTemplate: payload.dataTemplate,
        questionTemplate: payload.questionTemplate,
        answerTemplate: payload.answerTemplate,
      });
    }
    goToQuestionTypes();
  }

  const selectedQuestionTypeId =
    questionTypeId && questionTypeId !== "_new"
      ? (questionTypeId as Id<"questionTypes">)
      : null;
  const showDetails = Boolean(questionTypeId);
  const showTable =
    !showDetails ||
    (questionTypes !== undefined && questionTypes.length > 0);

  useEffect(() => {
    if (!showDetails) confirmLeaveRef.current = null;
  }, [showDetails]);

  // Scroll selected row into view when selection or list changes (e.g. deep link)
  useEffect(() => {
    if (
      !selectedQuestionTypeId ||
      selectedQuestionTypeId === "_new" ||
      !tableContainerRef.current
    )
      return;
    const row = tableContainerRef.current.querySelector(
      `[data-question-type-id="${selectedQuestionTypeId}"]`,
    );
    const el = row as HTMLElement | null;
    if (el?.scrollIntoView) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedQuestionTypeId, questionTypes]);

  function detailsForm(questionType: Doc<"questionTypes"> | null) {
    return (
      <QuestionTypeDetailsForm
        key={questionType?._id ?? "_new"}
        questionType={questionType}
        onSave={handleSave}
        onCancel={goToQuestionTypes}
        onClose={goToQuestionTypes}
        onConfirmLeaveReady={(fn) => {
          confirmLeaveRef.current = fn;
        }}
      />
    );
  }

  return (
    <section className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <Text variant="heading2">Question Types</Text>
        <Button
          type="button"
          variant="primary"
          aria-label="Add question type"
          onClick={handleAddClick}
        >
          <Plus size={20} aria-hidden />
          Add
        </Button>
      </div>

      {questionTypes === undefined ? (
        <p className="text-slate-500 mt-4" aria-busy="true">
          Loading…
        </p>
      ) : questionTypes.length === 0 && !questionTypeId ? (
        <Empty
          className="mt-4"
          title={
            user
              ? "No question types yet"
              : "Log in to manage your question types"
          }
          description={
            user
              ? "Add question types for the current language to see them here."
              : "Sign in to view and manage your question types."
          }
        />
      ) : (
        <div
          className={cn(
            "mt-4 flex flex-1 min-h-0 gap-4",
            "flex-col md:flex-row",
          )}
        >
          {showTable && questionTypes && questionTypes.length > 0 && (
            <div
              ref={tableContainerRef}
              className={cn(
                "min-w-0 flex-1 md:max-w-md flex flex-col overflow-auto",
                showDetails && "hidden md:flex",
              )}
            >
              <QuestionTypesTable
                questionTypes={questionTypes}
                selectedQuestionTypeId={selectedQuestionTypeId}
                onRowClick={handleRowClick}
              />
            </div>
          )}
          {showDetails && (
            <div className="min-w-0 flex-1 md:min-w-[320px] flex flex-col border border-slate-200 rounded-lg p-4 bg-white">
              {isNewQuestionType ? (
                detailsForm(null)
              ) : selectedQuestionType === undefined ? (
                <p className="text-slate-500" aria-busy="true">
                  Loading…
                </p>
              ) : selectedQuestionType === null ? (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Question type not found or you don’t have access to it.
                  </p>
                  <button
                    type="button"
                    onClick={goToQuestionTypes}
                    className="text-blue-600 hover:underline"
                  >
                    Back to question types
                  </button>
                </div>
              ) : (
                detailsForm(selectedQuestionType)
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
