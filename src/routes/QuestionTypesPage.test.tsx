/**
 * @vitest-environment jsdom
 */
import { LinkProvider } from "@cloudflare/kumo";
import { useMutation, useQuery } from "convex/react";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { KumoRouterLink } from "../app/KumoLinkAdapter";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Id } from "../../convex/_generated/dataModel";
import { AuthContext } from "../contexts/AuthContext";
import { CurrentLanguageProvider } from "../contexts/CurrentLanguageContext";
import { screen } from "../test-utils";
import { QuestionTypesPage } from "./QuestionTypesPage";

vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

function mockQuestionType(overrides: Partial<Doc<"questionTypes">> = {}): Doc<"questionTypes"> {
    return {
        _id: "qt1" as Id<"questionTypes">,
        _creationTime: 1000,
        userId: "user1" as Id<"users">,
        language: "fr",
        name: "Translate",
        dataTemplate: "{{word}}",
        questionTemplate: "What is {{word}}?",
        answerTemplate: "{{meaning}}",
        ...overrides,
    };
}

function renderQuestionTypesPage(initialEntry: string) {
    return render(
        <LinkProvider component={KumoRouterLink}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <CurrentLanguageProvider>
                    <AuthContext.Provider
                        value={{
                            user: {
                                _id: "u1" as Id<"users">,
                                _creationTime: 0,
                            } as Doc<"users">,
                            isLoading: false,
                            signIn: async () => {},
                            signOut: async () => {},
                        }}
                    >
                        <Routes>
                            <Route path="/question-types" element={<QuestionTypesPage />} />
                            <Route path="/question-types/:questionTypeId" element={<QuestionTypesPage />} />
                        </Routes>
                    </AuthContext.Provider>
                </CurrentLanguageProvider>
            </MemoryRouter>
        </LinkProvider>,
    );
}

describe("QuestionTypesPage", () => {
    beforeEach(() => {
        vi.mocked(useQuery).mockImplementation(((_query: unknown, args: unknown) => {
            if (args === "skip" || args === undefined) return undefined;
            if (
                args &&
                typeof args === "object" &&
                "questionTypeId" in args &&
                (args as { questionTypeId?: Id<"questionTypes"> }).questionTypeId
            ) {
                return mockQuestionType({
                    _id: (args as { questionTypeId: Id<"questionTypes"> }).questionTypeId,
                });
            }
            return [
                mockQuestionType(),
                mockQuestionType({
                    _id: "qt2" as Id<"questionTypes">,
                    name: "Conjugate",
                }),
            ];
        }) as typeof useQuery);
        vi.mocked(useMutation).mockReturnValue(
            vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<typeof useMutation>,
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("shows table and no details form when at /question-types with none selected", () => {
        renderQuestionTypesPage("/question-types");
        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Translate")).not.toBeInTheDocument();
    });

    it("shows details form when at /question-types/:id and getById returns a question type", () => {
        renderQuestionTypesPage("/question-types/qt1");
        expect(screen.getByDisplayValue("Translate")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("shows Add button on same row as Question Types title and shows new form when clicked", async () => {
        const user = userEvent.setup();
        renderQuestionTypesPage("/question-types");
        const addButton = screen.getByRole("button", { name: /add/i });
        expect(addButton).toBeInTheDocument();
        await user.click(addButton);
        expect(screen.getByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
    });

    it("resets form to new defaults when Add is clicked while viewing an existing question type", async () => {
        const user = userEvent.setup();
        renderQuestionTypesPage("/question-types/qt1");
        expect(screen.getByDisplayValue("Translate")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /add/i }));
        expect(screen.getByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Descriptive name for this question type")).toHaveValue("");
    });

    it("shows save-or-discard dialog when Add is clicked with valid unsaved changes, then navigates on Discard", async () => {
        const user = userEvent.setup();
        renderQuestionTypesPage("/question-types/qt1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.type(nameInput, "edited");
        await user.click(screen.getByRole("button", { name: /add/i }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("Save changes?");
        expect(dialog).toHaveTextContent("You have unsaved changes. Do you want to save them?");
        expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(await screen.findByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Descriptive name for this question type")).toHaveValue("");
    });

    it("when Add is clicked with valid unsaved changes, Save changes saves and then navigates to new question type", async () => {
        const user = userEvent.setup();
        const updateMutation = vi.fn().mockResolvedValue(undefined);
        let mutationCallIndex = 0;
        vi.mocked(useMutation).mockImplementation(() => {
            mutationCallIndex += 1;
            return (mutationCallIndex === 1
                ? updateMutation
                : vi.fn().mockResolvedValue(undefined)) as unknown as ReturnType<typeof useMutation>;
        });

        renderQuestionTypesPage("/question-types/qt1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.type(nameInput, "edited");
        await user.click(screen.getByRole("button", { name: /add/i }));

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(updateMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "edited",
            }),
        );
        expect(screen.getByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
    });

    it("when Add is clicked with invalid unsaved changes, shows discard dialog without Save changes option", async () => {
        const user = userEvent.setup();
        renderQuestionTypesPage("/question-types/qt1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.click(screen.getByRole("button", { name: /add/i }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("Discard changes?");
        expect(dialog).toHaveTextContent("You have unsaved changes. Do you want to discard them?");
        expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(await screen.findByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
    });

    it("at /question-types/_new shows details form with New Question Type title and create mutation on Save", async () => {
        const user = userEvent.setup();
        const createMutation = vi.fn().mockResolvedValue(undefined);
        let mutationCallIndex = 0;
        vi.mocked(useMutation).mockImplementation(() => {
            mutationCallIndex += 1;
            return (mutationCallIndex === 2
                ? createMutation
                : vi.fn().mockResolvedValue(undefined)) as unknown as ReturnType<typeof useMutation>;
        });
        renderQuestionTypesPage("/question-types/_new");
        expect(screen.getByRole("heading", { name: "New Question Type" })).toBeInTheDocument();
        await user.type(screen.getByPlaceholderText("Descriptive name for this question type"), "Test type");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(createMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                language: "en",
                name: "Test type",
                dataTemplate: "",
                questionTemplate: "",
                answerTemplate: "",
            }),
        );
    });
});
