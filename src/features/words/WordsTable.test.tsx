/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { WordsTable } from "./WordsTable";

function mockWord(overrides: Partial<Doc<"words">> = {}): Doc<"words"> {
  return {
    _id: "word1" as Id<"words">,
    _creationTime: 1000,
    userId: "user1" as Id<"users">,
    language: "fr",
    text: "bonjour",
    pos: "noun",
    meaning: "hello",
    ...overrides,
  };
}

describe("WordsTable", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders column headers Text, Meaning, Tags", () => {
    customRender(
      <WordsTable
        words={[]}
        selectedWordId={null}
        onRowClick={() => {}}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Text" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Meaning" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tags" })).toBeInTheDocument();
  });

  it("renders each word with correct text, meaning, and tags in cells", () => {
    const words: Doc<"words">[] = [
      mockWord({
        _id: "w1" as Id<"words">,
        text: "maison",
        pos: "noun",
        gender: "F",
        meaning: "house",
        tags: "home building",
      }),
      mockWord({
        _id: "w2" as Id<"words">,
        text: "manger",
        pos: "verb",
        meaning: "to eat",
        // no tags
      }),
    ];

    customRender(
      <WordsTable
        words={words}
        selectedWordId={null}
        onRowClick={() => {}}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const firstRowCells = rows[0].querySelectorAll("td");
    expect(firstRowCells[0]).toHaveTextContent("maison");
    expect(firstRowCells[0]).toHaveTextContent("Part of speech: noun");
    expect(firstRowCells[0]).toHaveTextContent("Gender: F");
    const firstRowBadges = firstRowCells[0].querySelectorAll('span[aria-hidden="true"]');
    expect(firstRowBadges).toHaveLength(2);
    expect(firstRowBadges[0]).toHaveTextContent("n");
    expect(firstRowBadges[1]).toHaveTextContent("f");
    expect(firstRowCells[1]).toHaveTextContent("house");
    expect(firstRowCells[2]).toHaveTextContent("home building");

    const secondRowCells = rows[1].querySelectorAll("td");
    expect(secondRowCells[0]).toHaveTextContent("manger");
    const secondRowBadges = secondRowCells[0].querySelectorAll('span[aria-hidden="true"]');
    expect(secondRowBadges).toHaveLength(1);
    expect(secondRowBadges[0]).toHaveTextContent("v");
    expect(secondRowCells[1]).toHaveTextContent("to eat");
    expect(secondRowCells[2]).toHaveTextContent("—");
  });

  it("calls onRowClick with word _id when a row is clicked", async () => {
    const onRowClick = vi.fn();
    const words: Doc<"words">[] = [
      mockWord({ _id: "w1" as Id<"words">, text: "maison" }),
      mockWord({ _id: "w2" as Id<"words">, text: "manger" }),
    ];
    customRender(
      <WordsTable
        words={words}
        selectedWordId={null}
        onRowClick={onRowClick}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    await user.click(rows[0]);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith("w1");
  });

  it("applies selected row styling when selectedWordId matches", () => {
    const words: Doc<"words">[] = [
      mockWord({ _id: "w1" as Id<"words">, text: "maison" }),
      mockWord({ _id: "w2" as Id<"words">, text: "manger" }),
    ];
    customRender(
      <WordsTable
        words={words}
        selectedWordId={"w2" as Id<"words">}
        onRowClick={() => {}}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    const selectedRow = rows[1];
    expect(selectedRow).toHaveAttribute("data-selected", "true");
  });
});
