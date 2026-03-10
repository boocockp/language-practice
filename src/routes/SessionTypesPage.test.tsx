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
import { SessionTypesPage } from "./SessionTypesPage";

vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

function mockSessionType(overrides: Partial<Doc<"sessionTypes">> = {}): Doc<"sessionTypes"> {
    return {
        _id: "st1" as Id<"sessionTypes">,
        _creationTime: 1000,
        userId: "user1" as Id<"users">,
        language: "fr",
        name: "Daily practice",
        questions: [],
        ...overrides,
    };
}

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

function renderSessionTypesPage(initialEntry: string) {
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
                            <Route path="/session-types" element={<SessionTypesPage />} />
                            <Route path="/session-types/:sessionTypeId" element={<SessionTypesPage />} />
                        </Routes>
                    </AuthContext.Provider>
                </CurrentLanguageProvider>
            </MemoryRouter>
        </LinkProvider>,
    );
}

describe("SessionTypesPage", () => {
    beforeEach(() => {
        let callIndex = 0;
        vi.mocked(useQuery).mockImplementation(((_query: unknown, args: unknown) => {
            if (args === "skip" || args === undefined) return undefined;
            callIndex += 1;
            if (args && typeof args === "object" && "sessionTypeId" in args) {
                return mockSessionType({
                    _id: (args as { sessionTypeId: Id<"sessionTypes"> }).sessionTypeId,
                });
            }
            if (callIndex === 1) {
                return [
                    mockSessionType(),
                    mockSessionType({
                        _id: "st2" as Id<"sessionTypes">,
                        name: "Quick quiz",
                    }),
                ];
            }
            return [mockQuestionType(), mockQuestionType({ _id: "qt2" as Id<"questionTypes">, name: "Conjugate" })];
        }) as typeof useQuery);
        vi.mocked(useMutation).mockReturnValue(
            vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<typeof useMutation>,
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("shows table and no details form when at /session-types with none selected", () => {
        renderSessionTypesPage("/session-types");
        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Daily practice")).not.toBeInTheDocument();
    });

    it("shows details form when at /session-types/:id and getById returns a session type", () => {
        renderSessionTypesPage("/session-types/st1");
        expect(screen.getByDisplayValue("Daily practice")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("shows Add button on same row as Session Types title and shows new form when clicked", async () => {
        const user = userEvent.setup();
        renderSessionTypesPage("/session-types");
        const addButton = screen.getByRole("button", { name: "Add session type" });
        expect(addButton).toBeInTheDocument();
        await user.click(addButton);
        expect(screen.getByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
    });

    it("resets form to new defaults when Add is clicked while viewing an existing session type", async () => {
        const user = userEvent.setup();
        renderSessionTypesPage("/session-types/st1");
        expect(screen.getByDisplayValue("Daily practice")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Add session type" }));
        expect(screen.getByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Descriptive name for this session type")).toHaveValue("");
    });

    it("shows save-or-discard dialog when Add is clicked with valid unsaved changes, then navigates on Discard", async () => {
        const user = userEvent.setup();
        renderSessionTypesPage("/session-types/st1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.type(nameInput, "edited");
        await user.click(screen.getByRole("button", { name: "Add session type" }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("Save changes?");
        expect(dialog).toHaveTextContent("You have unsaved changes. Do you want to save them?");
        expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(await screen.findByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Descriptive name for this session type")).toHaveValue("");
    });

    it("when Add is clicked with valid unsaved changes, Save changes saves and then navigates to new session type", async () => {
        const user = userEvent.setup();
        const updateMutation = vi.fn().mockResolvedValue(undefined);
        let mutationCallIndex = 0;
        vi.mocked(useMutation).mockImplementation(() => {
            mutationCallIndex += 1;
            return (mutationCallIndex === 1
                ? updateMutation
                : vi.fn().mockResolvedValue(undefined)) as unknown as ReturnType<typeof useMutation>;
        });

        renderSessionTypesPage("/session-types/st1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.type(nameInput, "edited");
        await user.click(screen.getByRole("button", { name: "Add session type" }));

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(updateMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "edited",
            }),
        );
        expect(await screen.findByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
    });

    it("when Add is clicked with invalid unsaved changes, shows discard dialog without Save changes option", async () => {
        const user = userEvent.setup();
        renderSessionTypesPage("/session-types/st1");
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.click(screen.getByRole("button", { name: "Add session type" }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("Discard changes?");
        expect(dialog).toHaveTextContent("You have unsaved changes. Do you want to discard them?");
        expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(await screen.findByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
    });

    it("at /session-types/_new shows details form with New Session Type title and create mutation on Save", async () => {
        const user = userEvent.setup();
        const createMutation = vi.fn().mockResolvedValue(undefined);
        let mutationCallIndex = 0;
        vi.mocked(useMutation).mockImplementation(() => {
            mutationCallIndex += 1;
            return (mutationCallIndex === 2
                ? createMutation
                : vi.fn().mockResolvedValue(undefined)) as unknown as ReturnType<typeof useMutation>;
        });
        renderSessionTypesPage("/session-types/_new");
        expect(screen.getByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
        await user.type(screen.getByPlaceholderText("Descriptive name for this session type"), "Test session");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(createMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                language: "en",
                name: "Test session",
                questions: [],
            }),
        );
    });
});
