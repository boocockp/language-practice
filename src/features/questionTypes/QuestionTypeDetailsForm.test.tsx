/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { QuestionTypeDetailsForm } from "./QuestionTypeDetailsForm";

function mockQuestionType(
  overrides: Partial<Doc<"questionTypes">> = {},
): Doc<"questionTypes"> {
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

function renderForm(
  overrides: Partial<
    React.ComponentProps<typeof QuestionTypeDetailsForm>
  > = {},
) {
  const props: React.ComponentProps<typeof QuestionTypeDetailsForm> = {
    questionType: mockQuestionType(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return customRender(<QuestionTypeDetailsForm {...props} />);
}

describe("QuestionTypeDetailsForm", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders all fields with the question type values", () => {
    const qt = mockQuestionType({
      name: "My type",
      dataTemplate: "d",
      questionTemplate: "q",
      answerTemplate: "a",
    });
    renderForm({ questionType: qt });
    expect(screen.getByDisplayValue("My type")).toBeInTheDocument();
    expect(screen.getByLabelText("Data template")).toHaveValue("d");
    expect(screen.getByLabelText("Question template")).toHaveValue("q");
    expect(screen.getByLabelText("Answer template")).toHaveValue("a");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onSave with updated payload when Save is clicked after editing", async () => {
    const qt = mockQuestionType({
      name: "Original",
      dataTemplate: "d1",
      questionTemplate: "q1",
      answerTemplate: "a1",
    });
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm({ questionType: qt, onSave });
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        questionTypeId: qt._id,
        name: "Updated",
        dataTemplate: "d1",
        questionTemplate: "q1",
        answerTemplate: "a1",
      }),
    );
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close is clicked and form is not dirty", async () => {
    const onClose = vi.fn();
    renderForm({ onClose });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows confirm dialog when Close is clicked and form is dirty", async () => {
    const onClose = vi.fn();
    renderForm({ onClose });
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "changed");
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
    renderForm();
    await user.type(screen.getByLabelText("Name"), "x");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("new question type mode (questionType is null)", () => {
    it("shows title New Question Type and empty fields", () => {
      renderForm({ questionType: null });
      expect(
        screen.getByRole("heading", { name: "New Question Type" }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Descriptive name for this question type"),
      ).toHaveValue("");
      expect(screen.getByLabelText("Data template")).toHaveValue("");
      expect(screen.getByLabelText("Question template")).toHaveValue("");
      expect(screen.getByLabelText("Answer template")).toHaveValue("");
    });

    it("calls onSave without questionTypeId when Save is clicked with valid fields", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderForm({ questionType: null, onSave });
      await user.type(
        screen.getByPlaceholderText("Descriptive name for this question type"),
        "New type",
      );
      await user.type(
        screen.getByLabelText("Data template"),
        "data",
      );
      await user.type(
        screen.getByLabelText("Question template"),
        "question",
      );
      await user.type(
        screen.getByLabelText("Answer template"),
        "answer",
      );
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(onSave).toHaveBeenCalledTimes(1);
      const payload = onSave.mock.calls[0][0];
      expect(payload).not.toHaveProperty("questionTypeId");
      expect(payload).toMatchObject({
        name: "New type",
        dataTemplate: "data",
        questionTemplate: "question",
        answerTemplate: "answer",
      });
    });

    it("does not call onSave when Name is empty and user submits", async () => {
      const onSave = vi.fn();
      renderForm({ questionType: null, onSave });
      await user.type(
        screen.getByLabelText("Data template"),
        "data",
      );
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
