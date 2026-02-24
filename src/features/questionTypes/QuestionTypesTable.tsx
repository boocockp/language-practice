import { Table } from "@cloudflare/kumo";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/cn";

type QuestionTypesTableProps = {
  questionTypes: Doc<"questionTypes">[];
  selectedQuestionTypeId: Id<"questionTypes"> | null;
  onRowClick: (questionTypeId: Id<"questionTypes">) => void;
};

export function QuestionTypesTable({
  questionTypes,
  selectedQuestionTypeId,
  onRowClick,
}: QuestionTypesTableProps) {
  function handleKeyDown(
    e: React.KeyboardEvent,
    questionTypeId: Id<"questionTypes">,
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(questionTypeId);
    }
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <Table className="w-full" layout="auto">
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Question template</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {questionTypes.map((qt) => {
            const isSelected = qt._id === selectedQuestionTypeId;
            return (
              <Table.Row
                key={qt._id}
                data-question-type-id={qt._id}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-slate-100",
                )}
                data-selected={isSelected ? "true" : undefined}
                tabIndex={0}
                onClick={() => onRowClick(qt._id)}
                onKeyDown={(e) => handleKeyDown(e, qt._id)}
              >
                <Table.Cell>
                  <span className="block min-w-0 truncate" title={qt.name}>
                    {qt.name}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span
                    className="block min-w-0 truncate"
                    title={qt.questionTemplate}
                  >
                    {qt.questionTemplate || "—"}
                  </span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
