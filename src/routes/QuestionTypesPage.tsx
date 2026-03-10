import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ListDetailPage } from "../components/ListDetailPage";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import {
    QuestionTypeDetailsForm,
    type QuestionTypeUpdatePayload,
} from "../features/questionTypes/QuestionTypeDetailsForm";
import { QuestionTypesTable } from "../features/questionTypes/QuestionTypesTable";

export function QuestionTypesPage() {
    const { user } = useAuth();
    const { language } = useCurrentLanguage();
    const { questionTypeId } = useParams<{ questionTypeId?: string }>();
    const navigate = useNavigate();

    const questionTypes = useQuery(api.questionTypes.listByUserAndLanguage, { language });
    const isNewQuestionType = questionTypeId === "_new";
    const selectedQuestionType = useQuery(
        api.questionTypes.getById,
        questionTypeId && questionTypeId !== "_new" && language
            ? {
                  questionTypeId: questionTypeId as Id<"questionTypes">,
                  language,
              }
            : "skip",
    );
    const updateQuestionType = useMutation(api.questionTypes.update);
    const createQuestionType = useMutation(api.questionTypes.create);

    const selectedQuestionTypeId =
        questionTypeId && questionTypeId !== "_new" ? (questionTypeId as Id<"questionTypes">) : null;
    const showDetails = Boolean(questionTypeId);
    const showTable = !showDetails || (questionTypes !== undefined && questionTypes.length > 0);

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

    return (
        <ListDetailPage
            title="Question Types"
            emptyTitle={user ? "No question types yet" : "Log in to manage your question types"}
            emptyDescription={
                user
                    ? "Add question types for the current language to see them here."
                    : "Sign in to view and manage your question types."
            }
            backLinkText="Back to question types"
            addButtonAriaLabel="Add question type"
            notFoundMessage="Question type not found or you don't have access to it."
            list={questionTypes}
            selectedId={selectedQuestionTypeId}
            selectedItem={isNewQuestionType ? null : selectedQuestionType}
            isNew={isNewQuestionType}
            showDetails={showDetails}
            showTable={showTable}
            dataRowIdAttribute="data-question-type-id"
            onRowClick={(id) => navigate(`/question-types/${id}`)}
            onAddClick={() => navigate("/question-types/_new")}
            onGoBack={goToQuestionTypes}
            onSave={async () => {}}
            renderTable={({ onRowClick }) =>
                questionTypes ? (
                    <QuestionTypesTable
                        questionTypes={questionTypes}
                        selectedQuestionTypeId={selectedQuestionTypeId}
                        onRowClick={onRowClick}
                    />
                ) : null
            }
            renderDetailsForm={({ onConfirmLeaveReady, onDirtyChange }) => (
                <QuestionTypeDetailsForm
                    key={isNewQuestionType ? "_new" : (selectedQuestionType?._id ?? "_new")}
                    questionType={isNewQuestionType ? null : (selectedQuestionType ?? null)}
                    onSave={handleSave}
                    onCancel={goToQuestionTypes}
                    onClose={goToQuestionTypes}
                    onConfirmLeaveReady={onConfirmLeaveReady}
                    onDirtyChange={onDirtyChange}
                />
            )}
        />
    );
}
