/**
 * @vitest-environment jsdom
 */
import { LinkProvider } from "@cloudflare/kumo";
import { useAction, useMutation, useQuery } from "convex/react";
import { render, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { KumoRouterLink } from "../app/KumoLinkAdapter";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { AuthContextValue } from "../contexts/AuthContext";
import { AuthContext } from "../contexts/AuthContext";
import { CurrentLanguageProvider } from "../contexts/CurrentLanguageContext";
import { screen } from "../test-utils";
import { PracticeSessionPage } from "./PracticeSessionPage";

vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useAction: vi.fn(),
}));

const SESSION_TYPE_ID = "st1" as Id<"sessionTypes">;
const SESSION_ID = "sess1" as Id<"sessions">;
const USER_ID = "u1" as Id<"users">;

function mockSessionType(overrides: Partial<Doc<"sessionTypes">> = {}): Doc<"sessionTypes"> {
    return {
        _id: SESSION_TYPE_ID,
        _creationTime: 1000,
        userId: USER_ID,
        language: "en",
        name: "Daily drill",
        questions: [],
        ...overrides,
    };
}

function mockSession(overrides: Partial<Doc<"sessions">> = {}) {
    return {
        _id: SESSION_ID,
        _creationTime: 0,
        userId: USER_ID,
        language: "en",
        sessionTypeId: SESSION_TYPE_ID,
        numberCorrect: undefined as number | undefined,
        ...overrides,
    };
}

function mockQuestion(
    id: string,
    text: string,
    expected: string,
    opts?: { answerGiven?: string; isCorrect?: boolean; respondedAt?: number },
) {
    return {
        _id: id as Id<"questions">,
        _creationTime: 0,
        text,
        expected,
        answerGiven: opts?.answerGiven,
        isCorrect: opts?.isCorrect,
        respondedAt: opts?.respondedAt,
    };
}

const defaultAuth = {
    user: { _id: USER_ID, _creationTime: 0 } as Doc<"users">,
    isLoading: false,
    signIn: async () => {},
    signOut: async () => {},
};

function renderPage(auth: AuthContextValue = defaultAuth) {
    return render(
        <LinkProvider component={KumoRouterLink}>
            <MemoryRouter initialEntries={["/practice/session"]}>
                <CurrentLanguageProvider>
                    <AuthContext.Provider value={auth}>
                        <Routes>
                            <Route path="/practice/session" element={<PracticeSessionPage />} />
                        </Routes>
                    </AuthContext.Provider>
                </CurrentLanguageProvider>
            </MemoryRouter>
        </LinkProvider>,
    );
}

/** Configure useQuery: session types list and/or getWithQuestions result when sessionId is in args */
function setSessionTypes(data: Doc<"sessionTypes">[] | undefined) {
    vi.mocked(useQuery).mockImplementation(((_ref: unknown, args: unknown) => {
        if (args && typeof args === "object" && "sessionId" in args) return undefined;
        return data;
    }) as ReturnType<typeof useQuery>);
}

function setGetWithQuestions(data: { session: Doc<"sessions">; questions: Array<ReturnType<typeof mockQuestion>> }) {
    vi.mocked(useQuery).mockImplementation(((_ref: unknown, args: unknown) => {
        if (args && typeof args === "object" && "sessionId" in args) return data;
        return [mockSessionType()];
    }) as ReturnType<typeof useQuery>);
}

describe("PracticeSessionPage", () => {
    let mutationMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mutationMock = vi.fn().mockResolvedValue(undefined);
        // Single mock for both useMutation(api.practice.submitAnswer) and useMutation(api.sessions.endSession).
        vi.mocked(useMutation).mockReturnValue(mutationMock as unknown as ReturnType<typeof useMutation>);
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<typeof useAction>,
        );
        setSessionTypes([mockSessionType()]);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("shows Loading when session types query returns undefined", () => {
        vi.mocked(useQuery).mockReturnValue(undefined as unknown as Doc<"sessionTypes">[]);
        renderPage();
        expect(screen.getByText("Loading…")).toBeInTheDocument();
        expect(screen.getByText("Loading…")).toHaveAttribute("aria-busy", "true");
    });

    it("shows Log in to practice when unauthenticated", () => {
        setSessionTypes([]);
        renderPage({ ...defaultAuth, user: null });
        expect(screen.getByText("Log in to practice")).toBeInTheDocument();
    });

    it("shows No session types yet when authenticated but no session types", () => {
        setSessionTypes([]);
        renderPage();
        expect(screen.getByText("No session types yet")).toBeInTheDocument();
        expect(screen.getByText(/Add session types.*to run a practice session/)).toBeInTheDocument();
    });

    it("shows session type select, Start disabled until selection, and instruction", async () => {
        const user = userEvent.setup();
        renderPage();
        const select = screen.getByRole("combobox", { name: /session type/i });
        expect(select).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
        expect(screen.getByText("Choose a session type and click Start.")).toBeInTheDocument();
        await user.click(select);
        const option = await screen.findByRole("option", { name: "Daily drill" });
        await user.click(option);
        expect(screen.getByRole("button", { name: "Start" })).not.toBeDisabled();
    });

    it("Start calls generateSession with sessionTypeId, language, and userLanguage", async () => {
        const user = userEvent.setup();
        const generateSession = vi.fn().mockResolvedValue({
            sessionId: SESSION_ID,
            questionIds: ["q1" as Id<"questions">],
        });
        vi.mocked(useAction).mockReturnValue(generateSession as unknown as ReturnType<typeof useAction>);
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "First question?", "yes")],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        expect(generateSession).toHaveBeenCalledWith({
            sessionTypeId: SESSION_TYPE_ID,
            language: "en",
            userLanguage: expect.any(String),
        });
    });

    it("after Start shows Question n of N, Score, Stop, and question text", async () => {
        const user = userEvent.setup();
        const generateSession = vi.fn().mockResolvedValue({
            sessionId: SESSION_ID,
            questionIds: ["q1" as Id<"questions">],
        });
        vi.mocked(useAction).mockReturnValue(generateSession as unknown as ReturnType<typeof useAction>);
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "First question?", "yes")],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        expect(await screen.findByText("Question 1 of 1")).toBeInTheDocument();
        expect(screen.getByText("Score 0")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Stop session" })).toBeInTheDocument();
        expect(screen.getByText("First question?")).toBeInTheDocument();
    });

    it("Check Answer calls submitAnswer with questionId and answerGiven", async () => {
        const user = userEvent.setup();
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue({
                sessionId: SESSION_ID,
                questionIds: ["q1" as Id<"questions">],
            }) as unknown as ReturnType<typeof useAction>,
        );
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "Q?", "A")],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        await screen.findByText("Q?");
        await user.type(screen.getByLabelText("Answer"), "A");
        await user.click(screen.getByRole("button", { name: "Check answer" }));
        await waitFor(() => {
            expect(mutationMock).toHaveBeenCalledWith({
                questionId: "q1",
                answerGiven: "A",
            });
        });
    });

    it("Next advances to next question", async () => {
        const user = userEvent.setup();
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue({
                sessionId: SESSION_ID,
                questionIds: ["q1", "q2"] as Id<"questions">[],
            }) as unknown as ReturnType<typeof useAction>,
        );
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "First?", "A1"), mockQuestion("q2", "Second?", "A2")],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        await screen.findByText("First?");
        await user.type(screen.getByLabelText("Answer"), "A1");
        await user.click(screen.getByRole("button", { name: "Check answer" }));
        await user.click(await screen.findByRole("button", { name: "Next question" }));
        expect(await screen.findByText("Second?")).toBeInTheDocument();
        expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
    });

    it("Continue on last question calls endSession and shows ended state", async () => {
        const user = userEvent.setup();
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue({
                sessionId: SESSION_ID,
                questionIds: ["q1" as Id<"questions">],
            }) as unknown as ReturnType<typeof useAction>,
        );
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "Only?", "yes", { answerGiven: "yes", isCorrect: true, respondedAt: 1 })],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        await screen.findByText("Only?");
        await user.type(screen.getByLabelText("Answer"), "yes");
        await user.click(screen.getByRole("button", { name: "Check answer" }));
        await user.click(await screen.findByRole("button", { name: "Continue" }));
        expect(mutationMock).toHaveBeenCalledWith({ sessionId: SESSION_ID });
        expect(await screen.findByText(/You answered 1 question/)).toBeInTheDocument();
        expect(screen.getByText(/1 correct out of 1/)).toBeInTheDocument();
    });

    it("Stop calls endSession and shows ended state", async () => {
        const user = userEvent.setup();
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue({
                sessionId: SESSION_ID,
                questionIds: ["q1" as Id<"questions">],
            }) as unknown as ReturnType<typeof useAction>,
        );
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "Q?", "A")],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        await screen.findByText("Q?");
        await user.click(screen.getByRole("button", { name: "Stop session" }));
        expect(mutationMock).toHaveBeenCalledWith({ sessionId: SESSION_ID });
        expect(await screen.findByText(/You answered 0 questions/)).toBeInTheDocument();
    });

    it("ended state shows summary with answered count, correct count, and percentage", async () => {
        const user = userEvent.setup();
        vi.mocked(useAction).mockReturnValue(
            vi.fn().mockResolvedValue({
                sessionId: SESSION_ID,
                questionIds: ["q1" as Id<"questions">],
            }) as unknown as ReturnType<typeof useAction>,
        );
        setGetWithQuestions({
            session: mockSession(),
            questions: [mockQuestion("q1", "Q?", "A", { answerGiven: "A", isCorrect: true, respondedAt: 1 })],
        });
        renderPage();
        await user.click(screen.getByRole("combobox", { name: /session type/i }));
        await user.click(await screen.findByRole("option", { name: "Daily drill" }));
        await user.click(screen.getByRole("button", { name: "Start" }));
        await screen.findByText("Q?");
        await user.type(screen.getByLabelText("Answer"), "A");
        await user.click(screen.getByRole("button", { name: "Check answer" }));
        await user.click(await screen.findByRole("button", { name: "Continue" }));
        expect(screen.getByText(/You answered 1 question/)).toBeInTheDocument();
        expect(screen.getByText(/1 correct out of 1/)).toBeInTheDocument();
        expect(screen.getByText("100% correct")).toBeInTheDocument();
    });
});
