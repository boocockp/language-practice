import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ListDetailPage } from "../components/ListDetailPage";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { SessionTypeDetailsForm, type SessionTypeUpdatePayload } from "../features/sessionTypes/SessionTypeDetailsForm";
import { SessionTypesTable } from "../features/sessionTypes/SessionTypesTable";

export function SessionTypesPage() {
    const { user } = useAuth();
    const { language } = useCurrentLanguage();
    const { sessionTypeId } = useParams<{ sessionTypeId?: string }>();
    const navigate = useNavigate();

    const sessionTypes = useQuery(api.sessionTypes.listByUserAndLanguage, { language });
    const questionTypes = useQuery(api.questionTypes.listByUserAndLanguage, { language });
    const isNewSessionType = sessionTypeId === "_new";
    const selectedSessionType = useQuery(
        api.sessionTypes.getById,
        sessionTypeId && sessionTypeId !== "_new" && language
            ? {
                  sessionTypeId: sessionTypeId as Id<"sessionTypes">,
                  language,
              }
            : "skip",
    );
    const updateSessionType = useMutation(api.sessionTypes.update);
    const createSessionType = useMutation(api.sessionTypes.create);

    const selectedSessionTypeId =
        sessionTypeId && sessionTypeId !== "_new" ? (sessionTypeId as Id<"sessionTypes">) : null;
    const showDetails = Boolean(sessionTypeId);
    const showTable = !showDetails || (sessionTypes !== undefined && sessionTypes.length > 0);

    function goToSessionTypes() {
        navigate("/session-types");
    }

    async function saveSessionType(payload: SessionTypeUpdatePayload) {
        if (payload.sessionTypeId) {
            await updateSessionType({
                sessionTypeId: payload.sessionTypeId,
                name: payload.name,
                questions: payload.questions,
            });
        } else {
            await createSessionType({
                language,
                name: payload.name,
                questions: payload.questions,
            });
        }
    }

    async function handleSave(payload: SessionTypeUpdatePayload) {
        await saveSessionType(payload);
        goToSessionTypes();
    }

    return (
        <ListDetailPage
            title="Session Types"
            emptyTitle={user ? "No session types yet" : "Log in to manage your session types"}
            emptyDescription={
                user
                    ? "Add session types for the current language to see them here."
                    : "Sign in to view and manage your session types."
            }
            backLinkText="Back to session types"
            addButtonAriaLabel="Add session type"
            notFoundMessage="Session type not found or you don't have access to it."
            list={sessionTypes}
            selectedId={selectedSessionTypeId}
            selectedItem={isNewSessionType ? null : selectedSessionType}
            isNew={isNewSessionType}
            showDetails={showDetails}
            showTable={showTable}
            dataRowIdAttribute="data-session-type-id"
            onRowClick={(id) => navigate(`/session-types/${id}`)}
            onAddClick={() => navigate("/session-types/_new")}
            onGoBack={goToSessionTypes}
            onSave={async () => {}}
            renderTable={({ onRowClick }) =>
                sessionTypes ? (
                    <SessionTypesTable
                        sessionTypes={sessionTypes}
                        selectedSessionTypeId={selectedSessionTypeId}
                        onRowClick={onRowClick}
                    />
                ) : null
            }
            renderDetailsForm={({ onConfirmLeaveReady, onDirtyChange }) => (
                <SessionTypeDetailsForm
                    key={isNewSessionType ? "_new" : (selectedSessionType?._id ?? "_new")}
                    sessionType={isNewSessionType ? null : (selectedSessionType ?? null)}
                    questionTypes={questionTypes ?? []}
                    onSave={handleSave}
                    onSaveWithoutNavigate={saveSessionType}
                    onCancel={goToSessionTypes}
                    onClose={goToSessionTypes}
                    onConfirmLeaveReady={onConfirmLeaveReady}
                    onDirtyChange={onDirtyChange}
                />
            )}
        />
    );
}
