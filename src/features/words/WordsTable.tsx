import { Table } from "@cloudflare/kumo";
import type { ReactNode } from "react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { WordType } from "../../../convex/words";
import { cn } from "../../lib/cn";

const TYPE_BG: Record<WordType, string> = {
  nf: "bg-fuchsia-500 text-white",
  nm: "bg-cyan-500 text-white",
  nmf: "bg-teal-500 text-white",
  vtr: "bg-red-500 text-white",
  vi: "bg-orange-500 text-white",
  adj: "bg-blue-500 text-white",
  adv: "bg-amber-700 text-white",
};

function formatWordWithType(word: {
  text: string;
  type: WordType;
}): ReactNode {
  return (
    <>
      <span>
        {word.text}
        <span className="sr-only">, Type: {word.type}</span>
      </span>
      <span className={`inline-block px-1 ml-auto ${TYPE_BG[word.type]}`} aria-hidden>
        {word.type}
      </span>
    </>
  );
}

type WordsTableProps = {
  words: Doc<"words">[];
  selectedWordId: Id<"words"> | null;
  onRowClick: (wordId: Id<"words">) => void;
};

export function WordsTable({
  words,
  selectedWordId,
  onRowClick,
}: WordsTableProps) {
  function handleKeyDown(
    e: React.KeyboardEvent,
    wordId: Id<"words">,
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(wordId);
    }
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <Table className="w-full" layout="auto">
        <Table.Header>
          <Table.Row>
            <Table.Head>Text</Table.Head>
            <Table.Head>Meaning</Table.Head>
            <Table.Head>Tags</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {words.map((word) => {
            const isSelected = word._id === selectedWordId;
            return (
              <Table.Row
                key={word._id}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-slate-100",
                )}
                data-selected={isSelected ? "true" : undefined}
                tabIndex={0}
                onClick={() => onRowClick(word._id)}
                onKeyDown={(e) => handleKeyDown(e, word._id)}
              >
                <Table.Cell>
                  <div className="flex justify-between items-baseline">
                    {formatWordWithType(word)}
                  </div>
                </Table.Cell>
                <Table.Cell>{word.meaning}</Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap">{word.tags ?? "—"}</span>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
