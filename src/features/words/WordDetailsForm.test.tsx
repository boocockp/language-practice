/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { WordDetailsForm } from "./WordDetailsForm";

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
    tags: "home building",
    ...overrides,
  };
}

describe("WordDetailsForm", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders all fields with the word values", () => {
    const word = mockWord({
      text: "bonjour",
      pos: "verb",
      gender: "M",
      meaning: "hello",
      tags: "greeting",
    });
    customRender(
      <WordDetailsForm
        word={word}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("bonjour")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
    expect(screen.getByDisplayValue("greeting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onSave with updated payload when Save is clicked after editing", async () => {
    const word = mockWord({ text: "original", meaning: "first" });
    const onSave = vi.fn().mockResolvedValue(undefined);
    customRender(
      <WordDetailsForm
        word={word}
        onSave={onSave}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const textInput = screen.getByDisplayValue("original");
    await user.clear(textInput);
    await user.type(textInput, "updated");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        wordId: word._id,
        text: "updated",
        meaning: "first",
        pos: "noun",
      }),
    );
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    customRender(
      <WordDetailsForm
        word={mockWord()}
        onSave={vi.fn()}
        onCancel={onCancel}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close is clicked and form is not dirty", async () => {
    const onClose = vi.fn();
    customRender(
      <WordDetailsForm
        word={mockWord()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows confirm dialog when Close is clicked and form is dirty", async () => {
    const onClose = vi.fn();
    customRender(
      <WordDetailsForm
        word={mockWord()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onClose={onClose}
      />,
    );
    const textInput = screen.getByDisplayValue("maison");
    await user.clear(textInput);
    await user.type(textInput, "changed");
    await user.click(screen.getByRole("button", { name: "Close" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/discard|abandon/i);
    onClose.mockClear();
    await user.click(
      screen.getByRole("button", { name: "Discard changes" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Cancel does not show discard confirm dialog when form is dirty", async () => {
    customRender(
      <WordDetailsForm
        word={mockWord()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const textInput = screen.getByDisplayValue("maison");
    await user.type(textInput, "x");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
