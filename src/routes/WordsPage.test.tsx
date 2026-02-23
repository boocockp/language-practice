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
import { WordsPage } from "./WordsPage";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

function mockWord(overrides: Partial<Doc<"words">> = {}): Doc<"words"> {
  return {
    _id: "word1" as Id<"words">,
    _creationTime: 1000,
    userId: "user1" as Id<"users">,
    language: "fr",
    text: "maison",
    pos: "noun",
    gender: "F",
    meaning: "house",
    tags: "home",
    ...overrides,
  };
}

function renderWordsPage(initialEntry: string) {
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
              <Route path="/words" element={<WordsPage />} />
              <Route path="/words/:wordId" element={<WordsPage />} />
            </Routes>
          </AuthContext.Provider>
        </CurrentLanguageProvider>
      </MemoryRouter>
    </LinkProvider>,
  );
}

describe("WordsPage", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockImplementation(((_query: unknown, args: unknown) => {
      if (args === "skip" || args === undefined) return undefined;
      if (
        args &&
        typeof args === "object" &&
        "wordId" in args &&
        (args as { wordId?: Id<"words"> }).wordId
      ) {
        return mockWord({
          _id: (args as { wordId: Id<"words"> }).wordId,
        });
      }
      return [
        mockWord(),
        mockWord({ _id: "w2" as Id<"words">, text: "manger" }),
      ];
    }) as typeof useQuery);
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockResolvedValue(undefined) as unknown as ReturnType<
        typeof useMutation
      >,
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows table and no details form when at /words with no word selected", () => {
    renderWordsPage("/words");
    expect(screen.getByRole("columnheader", { name: "Text" })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("maison")).not.toBeInTheDocument();
  });

  it("shows details form when at /words/:wordId and getById returns a word", () => {
    renderWordsPage("/words/w1");
    expect(screen.getByDisplayValue("maison")).toBeInTheDocument();
    expect(screen.getByDisplayValue("house")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("displays details form again after making changes and clicking Cancel then a row", async () => {
    const user = userEvent.setup();
    renderWordsPage("/words/word1");
    expect(screen.getByDisplayValue("maison")).toBeInTheDocument();

    await user.clear(screen.getByDisplayValue("maison"));
    await user.type(screen.getByPlaceholderText("The word you are learning"), "changed");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    await user.click(rows[0]);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("maison")).toBeInTheDocument();
  });

  it("shows Add button on same row as Words title and shows new-word form when clicked", async () => {
    const user = userEvent.setup();
    renderWordsPage("/words");
    const addButton = screen.getByRole("button", { name: /add/i });
    expect(addButton).toBeInTheDocument();
    await user.click(addButton);
    expect(screen.getByRole("heading", { name: "New Word" })).toBeInTheDocument();
  });

  it("resets form to new-word defaults when Add is clicked while viewing an existing word", async () => {
    const user = userEvent.setup();
    renderWordsPage("/words/word1");
    expect(screen.getByDisplayValue("maison")).toBeInTheDocument();
    expect(screen.getByDisplayValue("house")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getByRole("heading", { name: "New Word" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("The word you are learning")).toHaveValue("");
    expect(screen.getByPlaceholderText("What the word means")).toHaveValue("");
  });

  it("shows discard confirm dialog when Add is clicked with unsaved changes, then navigates to new word on Discard", async () => {
    const user = userEvent.setup();
    renderWordsPage("/words/word1");
    await user.clear(screen.getByDisplayValue("maison"));
    await user.type(screen.getByPlaceholderText("The word you are learning"), "edited");
    await user.click(screen.getByRole("button", { name: /add/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/discard|abandon/i);
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByRole("heading", { name: "New Word" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("The word you are learning")).toHaveValue("");
  });

  it("shows discard confirm when Add clicked with unsaved changes, keeps editing on Keep editing", async () => {
    const user = userEvent.setup();
    renderWordsPage("/words/word1");
    await user.clear(screen.getByDisplayValue("maison"));
    await user.type(screen.getByPlaceholderText("The word you are learning"), "edited");
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/discard|abandon/i);
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("edited")).toBeInTheDocument();
  });

  it("at /words/_new shows details form with New Word title and create mutation on Save", async () => {
    const user = userEvent.setup();
    const createMutation = vi.fn().mockResolvedValue(undefined);
    let mutationCallIndex = 0;
    vi.mocked(useMutation).mockImplementation(() => {
      mutationCallIndex += 1;
      return (mutationCallIndex === 2
        ? createMutation
        : vi.fn().mockResolvedValue(undefined)) as unknown as ReturnType<
        typeof useMutation
      >;
    });
    renderWordsPage("/words/_new");
    expect(screen.getByRole("heading", { name: "New Word" })).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("The word you are learning"),
      "test",
    );
    await user.type(
      screen.getByPlaceholderText("What the word means"),
      "meaning",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(createMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "en",
        text: "test",
        pos: "noun",
        meaning: "meaning",
      }),
    );
  });
});
