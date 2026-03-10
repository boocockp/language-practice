/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { SessionTypesTable } from "./SessionTypesTable";

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

describe("SessionTypesTable", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders column header Name", () => {
        customRender(<SessionTypesTable sessionTypes={[]} selectedSessionTypeId={null} onRowClick={() => {}} />);
        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    });

    it("renders each session type with name in cell", () => {
        const sessionTypes: Doc<"sessionTypes">[] = [
            mockSessionType({ _id: "st1" as Id<"sessionTypes">, name: "Type A" }),
            mockSessionType({ _id: "st2" as Id<"sessionTypes">, name: "Type B" }),
        ];
        customRender(
            <SessionTypesTable sessionTypes={sessionTypes} selectedSessionTypeId={null} onRowClick={() => {}} />,
        );
        const rows = screen.getAllByRole("row").slice(1);
        expect(rows).toHaveLength(2);
        const firstRowCells = rows[0].querySelectorAll("td");
        expect(firstRowCells[0]).toHaveTextContent("Type A");
        const secondRowCells = rows[1].querySelectorAll("td");
        expect(secondRowCells[0]).toHaveTextContent("Type B");
    });

    it("calls onRowClick with session type _id when a row is clicked", async () => {
        const onRowClick = vi.fn();
        const sessionTypes: Doc<"sessionTypes">[] = [
            mockSessionType({ _id: "st1" as Id<"sessionTypes">, name: "First" }),
            mockSessionType({ _id: "st2" as Id<"sessionTypes">, name: "Second" }),
        ];
        customRender(
            <SessionTypesTable sessionTypes={sessionTypes} selectedSessionTypeId={null} onRowClick={onRowClick} />,
        );
        const rows = screen.getAllByRole("row").slice(1);
        await user.click(rows[0]);
        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(onRowClick).toHaveBeenCalledWith("st1");
    });

    it("applies selected row styling when selectedSessionTypeId matches", () => {
        const sessionTypes: Doc<"sessionTypes">[] = [
            mockSessionType({ _id: "st1" as Id<"sessionTypes">, name: "First" }),
            mockSessionType({ _id: "st2" as Id<"sessionTypes">, name: "Second" }),
        ];
        customRender(
            <SessionTypesTable
                sessionTypes={sessionTypes}
                selectedSessionTypeId={"st2" as Id<"sessionTypes">}
                onRowClick={() => {}}
            />,
        );
        const rows = screen.getAllByRole("row").slice(1);
        const selectedRow = rows[1];
        expect(selectedRow).toHaveAttribute("data-selected", "true");
    });
});
