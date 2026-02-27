/**
 * @vitest-environment jsdom
 */
import { LinkProvider } from "@cloudflare/kumo";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { PracticePage } from "./PracticePage";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
  useAction: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

function mockQuestionType(
  overrides: Partial<Doc<"questionTypes">> = {},
): Doc<"questionTypes"> {
  return {
    _id: "qt1" as Id<"questionTypes">,
    _creationTime: 1000,
    userId: "user1" as Id<"users">,
    language: "en",
    name: "Translate",
    dataTemplate: "",
    questionTemplate: "",
    answerTemplate: "",
    ...overrides,
  };
}

function renderPracticePage() {
  return render(
    <LinkProvider component={KumoRouterLink}>
      <MemoryRouter initialEntries={["/practice"]}>
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
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </AuthContext.Provider>
        </CurrentLanguageProvider>
      </MemoryRouter>
    </LinkProvider>,
  );
}

function renderPracticePageUnauthenticated() {
  return render(
    <LinkProvider component={KumoRouterLink}>
      <MemoryRouter initialEntries={["/practice"]}>
        <CurrentLanguageProvider>
          <AuthContext.Provider
            value={{
              user: null,
              isLoading: false,
              signIn: async () => {},
              signOut: async () => {},
            }}
          >
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </AuthContext.Provider>
        </CurrentLanguageProvider>
      </MemoryRouter>
    </LinkProvider>,
  );
}

describe("PracticePage", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue([
      mockQuestionType(),
      mockQuestionType({
        _id: "qt2" as Id<"questionTypes">,
        name: "Conjugate",
      }),
    ]);
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<
        typeof useMutation
      >,
    );
    vi.mocked(useAction).mockReturnValue(
      vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<
        typeof useAction
      >,
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows Loading when useQuery returns undefined", () => {
    vi.mocked(useQuery).mockReturnValue(undefined as unknown as Doc<"questionTypes">[]);
    renderPracticePage();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toHaveAttribute("aria-busy", "true");
  });

  it("shows Log in to practice when unauthenticated", () => {
    vi.mocked(useQuery).mockReturnValue([]);
    renderPracticePageUnauthenticated();
    expect(screen.getByText("Log in to practice")).toBeInTheDocument();
  });

  it("shows No question types yet when authenticated but no question types", () => {
    vi.mocked(useQuery).mockReturnValue([]);
    renderPracticePage();
    expect(screen.getByText("No question types yet")).toBeInTheDocument();
    expect(screen.getByText(/Add question types.*to practice/)).toBeInTheDocument();
  });

  it("shows question type select and Next Question after selecting type", async () => {
    const user = userEvent.setup();
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    expect(select).toBeInTheDocument();
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    expect(
      screen.getByRole("button", { name: "Next question" }),
    ).toBeInTheDocument();
  });

  it("Next Question triggers generateQuestion with questionTypeId and language", async () => {
    const user = userEvent.setup();
    const generateQuestion = vi.fn().mockResolvedValue({
      questionId: "q1" as Id<"questions">,
      text: "What is chat?",
      expected: "cat",
    });
    vi.mocked(useAction).mockReturnValue(
      generateQuestion as unknown as ReturnType<typeof useAction>,
    );
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(generateQuestion).toHaveBeenCalledWith({
      questionTypeId: "qt1",
      language: "en",
    });
  });

  it("after generate, shows question text and Check Answer button", async () => {
    const user = userEvent.setup();
    const generateQuestion = vi.fn().mockResolvedValue({
      questionId: "q1" as Id<"questions">,
      text: "What is chat?",
      expected: "cat",
    });
    vi.mocked(useAction).mockReturnValue(
      generateQuestion as unknown as ReturnType<typeof useAction>,
    );
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(await screen.findByText("What is chat?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check answer" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next question" }),
    ).not.toBeInTheDocument();
  });

  it("Check Answer triggers submitAnswer with questionId and answerGiven", async () => {
    const user = userEvent.setup();
    const generateQuestion = vi.fn().mockResolvedValue({
      questionId: "q1" as Id<"questions">,
      text: "What is chat?",
      expected: "cat",
    });
    const submitAnswer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAction).mockReturnValue(
      generateQuestion as unknown as ReturnType<typeof useAction>,
    );
    vi.mocked(useMutation).mockReturnValue(
      submitAnswer as unknown as ReturnType<typeof useMutation>,
    );
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    await user.click(screen.getByRole("button", { name: "Next question" }));
    await screen.findByText("What is chat?");
    await user.type(screen.getByLabelText("Answer"), "cat");
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    expect(submitAnswer).toHaveBeenCalledWith({
      questionId: "q1",
      answerGiven: "cat",
    });
  });

  it("after check, shows expected answer and result (Correct)", async () => {
    const user = userEvent.setup();
    const generateQuestion = vi.fn().mockResolvedValue({
      questionId: "q1" as Id<"questions">,
      text: "What is chat?",
      expected: "cat",
    });
    vi.mocked(useAction).mockReturnValue(
      generateQuestion as unknown as ReturnType<typeof useAction>,
    );
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<
        typeof useMutation
      >,
    );
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    await user.click(screen.getByRole("button", { name: "Next question" }));
    await screen.findByText("What is chat?");
    await user.type(screen.getByLabelText("Answer"), "cat");
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    const expectedDisplay = await screen.findByLabelText("Expected Answer");
    expect(expectedDisplay).toHaveTextContent("cat");
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next question" }),
    ).toBeInTheDocument();
  });

  it("Check Answer disabled when answer is empty", async () => {
    const user = userEvent.setup();
    const generateQuestion = vi.fn().mockResolvedValue({
      questionId: "q1" as Id<"questions">,
      text: "What is chat?",
      expected: "cat",
    });
    vi.mocked(useAction).mockReturnValue(
      generateQuestion as unknown as ReturnType<typeof useAction>,
    );
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    await user.click(screen.getByRole("button", { name: "Next question" }));
    await screen.findByText("What is chat?");
    const checkButton = screen.getByRole("button", { name: "Check answer" });
    expect(checkButton).toBeDisabled();
  });

  it("Select shows question type name when option is selected", async () => {
    const user = userEvent.setup();
    renderPracticePage();
    const select = screen.getByRole("combobox", { name: /question type/i });
    await user.click(select);
    const translateOption = await screen.findByRole("option", {
      name: "Translate",
    });
    await user.click(translateOption);
    expect(select).toHaveTextContent("Translate");
  });
});
