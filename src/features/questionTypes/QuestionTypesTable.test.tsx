/**
 * @vitest-environment jsdom
 */
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { customRender, screen } from "../../test-utils";
import { QuestionTypesTable } from "./QuestionTypesTable";

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

describe("QuestionTypesTable", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders column headers Name and Question template", () => {
    customRender(
      <QuestionTypesTable
        questionTypes={[]}
        selectedQuestionTypeId={null}
        onRowClick={() => {}}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Question template" }),
    ).toBeInTheDocument();
  });

  it("renders each question type with name and questionTemplate in cells", () => {
    const questionTypes: Doc<"questionTypes">[] = [
      mockQuestionType({
        _id: "qt1" as Id<"questionTypes">,
        name: "Type A",
        questionTemplate: "Q: {{x}}",
      }),
      mockQuestionType({
        _id: "qt2" as Id<"questionTypes">,
        name: "Type B",
        questionTemplate: "Answer {{y}}",
      }),
    ];

    customRender(
      <QuestionTypesTable
        questionTypes={questionTypes}
        selectedQuestionTypeId={null}
        onRowClick={() => {}}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const firstRowCells = rows[0].querySelectorAll("td");
    expect(firstRowCells[0]).toHaveTextContent("Type A");
    expect(firstRowCells[1]).toHaveTextContent("Q: {{x}}");

    const secondRowCells = rows[1].querySelectorAll("td");
    expect(secondRowCells[0]).toHaveTextContent("Type B");
    expect(secondRowCells[1]).toHaveTextContent("Answer {{y}}");
  });

  it("calls onRowClick with question type _id when a row is clicked", async () => {
    const onRowClick = vi.fn();
    const questionTypes: Doc<"questionTypes">[] = [
      mockQuestionType({ _id: "qt1" as Id<"questionTypes">, name: "First" }),
      mockQuestionType({ _id: "qt2" as Id<"questionTypes">, name: "Second" }),
    ];
    customRender(
      <QuestionTypesTable
        questionTypes={questionTypes}
        selectedQuestionTypeId={null}
        onRowClick={onRowClick}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    await user.click(rows[0]);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith("qt1");
  });

  it("applies selected row styling when selectedQuestionTypeId matches", () => {
    const questionTypes: Doc<"questionTypes">[] = [
      mockQuestionType({ _id: "qt1" as Id<"questionTypes">, name: "First" }),
      mockQuestionType({ _id: "qt2" as Id<"questionTypes">, name: "Second" }),
    ];
    customRender(
      <QuestionTypesTable
        questionTypes={questionTypes}
        selectedQuestionTypeId={"qt2" as Id<"questionTypes">}
        onRowClick={() => {}}
      />,
    );
    const rows = screen.getAllByRole("row").slice(1);
    const selectedRow = rows[1];
    expect(selectedRow).toHaveAttribute("data-selected", "true");
  });
});
