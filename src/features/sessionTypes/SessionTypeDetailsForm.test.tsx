/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { SessionTypeDetailsForm } from "./SessionTypeDetailsForm";

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

const defaultQuestionTypes: Doc<"questionTypes">[] = [
    mockQuestionType(),
    mockQuestionType({ _id: "qt2" as Id<"questionTypes">, name: "Conjugate" }),
];

function renderForm(overrides: Partial<React.ComponentProps<typeof SessionTypeDetailsForm>> = {}) {
    const props: React.ComponentProps<typeof SessionTypeDetailsForm> = {
        sessionType: mockSessionType(),
        questionTypes: defaultQuestionTypes,
        onSave: vi.fn(),
        onCancel: vi.fn(),
        onClose: vi.fn(),
        ...overrides,
    };
    return customRender(<SessionTypeDetailsForm {...props} />);
}

describe("SessionTypeDetailsForm", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders name field and Session Questions section with Save/Cancel/Close", () => {
        const st = mockSessionType({ name: "My session" });
        renderForm({ sessionType: st });
        expect(screen.getByDisplayValue("My session")).toBeInTheDocument();
        expect(screen.getByText("Session Questions")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("calls onSave with updated payload when Save is clicked after editing name", async () => {
        const st = mockSessionType({ name: "Original" });
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderForm({ sessionType: st, questionTypes: defaultQuestionTypes, onSave });
        const nameInput = screen.getByLabelText("Name");
        await user.clear(nameInput);
        await user.type(nameInput, "Updated");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionTypeId: st._id,
                name: "Updated",
                questions: [],
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
        await user.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("Cancel does not show discard confirm dialog when form is dirty", async () => {
        renderForm();
        await user.type(screen.getByLabelText("Name"), "x");
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("adds a session question row and Save includes it in payload", async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderForm({ sessionType: mockSessionType(), questionTypes: defaultQuestionTypes, onSave });
        await user.click(screen.getByRole("button", { name: "Add session question" }));
        expect(screen.getByRole("combobox", { name: "Question type" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(onSave).toHaveBeenCalledTimes(1);
        const payload = onSave.mock.calls[0][0];
        expect(payload.questions).toHaveLength(1);
        expect(payload.questions[0]).toMatchObject({ questionTypeId: "qt1", count: 1 });
    });

    it("remove row removes session question from payload", async () => {
        const qtId = "qt1" as Id<"questionTypes">;
        const st = mockSessionType({
            questions: [{ questionTypeId: qtId, count: 2 }],
        });
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderForm({ sessionType: st, questionTypes: defaultQuestionTypes, onSave });
        await user.click(screen.getByRole("button", { name: /Remove Translate/i }));
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Daily practice",
                questions: [],
            }),
        );
    });

    it("edit count updates payload", async () => {
        const qtId = "qt1" as Id<"questionTypes">;
        const st = mockSessionType({
            questions: [{ questionTypeId: qtId, count: 1 }],
        });
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderForm({ sessionType: st, questionTypes: defaultQuestionTypes, onSave });
        const countInput = screen.getByLabelText("Count");
        fireEvent.change(countInput, { target: { value: "5" } });
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                questions: [{ questionTypeId: qtId, count: 5 }],
            }),
        );
    });

    it("move down changes order in payload", async () => {
        const qt1 = "qt1" as Id<"questionTypes">;
        const qt2 = "qt2" as Id<"questionTypes">;
        const st = mockSessionType({
            questions: [
                { questionTypeId: qt1, count: 1 },
                { questionTypeId: qt2, count: 1 },
            ],
        });
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderForm({ sessionType: st, questionTypes: defaultQuestionTypes, onSave });
        const moveDownButtons = screen.getAllByRole("button", { name: "Move down" });
        await user.click(moveDownButtons[0]);
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                questions: [
                    { questionTypeId: qt2, count: 1 },
                    { questionTypeId: qt1, count: 1 },
                ],
            }),
        );
    });

    describe("new session type mode (sessionType is null)", () => {
        it("shows title New Session Type and empty name", () => {
            renderForm({ sessionType: null });
            expect(screen.getByRole("heading", { name: "New Session Type" })).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Descriptive name for this session type")).toHaveValue("");
        });

        it("calls onSave without sessionTypeId when Save is clicked with valid name", async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            renderForm({ sessionType: null, questionTypes: defaultQuestionTypes, onSave });
            await user.type(screen.getByPlaceholderText("Descriptive name for this session type"), "New session");
            await user.click(screen.getByRole("button", { name: "Save" }));
            expect(onSave).toHaveBeenCalledTimes(1);
            const payload = onSave.mock.calls[0][0];
            expect(payload).not.toHaveProperty("sessionTypeId");
            expect(payload).toMatchObject({
                name: "New session",
                questions: [],
            });
        });

        it("does not call onSave when Name is empty and user submits", async () => {
            const onSave = vi.fn();
            renderForm({ sessionType: null, onSave });
            await user.click(screen.getByRole("button", { name: "Save" }));
            expect(onSave).not.toHaveBeenCalled();
        });
    });
});
