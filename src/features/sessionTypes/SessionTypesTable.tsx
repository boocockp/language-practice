import { Table } from "@cloudflare/kumo";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/cn";

type SessionTypesTableProps = {
    sessionTypes: Doc<"sessionTypes">[];
    selectedSessionTypeId: Id<"sessionTypes"> | null;
    onRowClick: (sessionTypeId: Id<"sessionTypes">) => void;
};

export function SessionTypesTable({ sessionTypes, selectedSessionTypeId, onRowClick }: SessionTypesTableProps) {
    function handleKeyDown(e: React.KeyboardEvent, sessionTypeId: Id<"sessionTypes">) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowClick(sessionTypeId);
        }
    }

    return (
        <div className="min-w-0 overflow-x-auto">
            <Table className="w-full" layout="auto">
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {sessionTypes.map((st) => {
                        const isSelected = st._id === selectedSessionTypeId;
                        return (
                            <Table.Row
                                key={st._id}
                                data-session-type-id={st._id}
                                className={cn("cursor-pointer", isSelected && "bg-slate-100")}
                                data-selected={isSelected ? "true" : undefined}
                                tabIndex={0}
                                onClick={() => onRowClick(st._id)}
                                onKeyDown={(e) => handleKeyDown(e, st._id)}
                            >
                                <Table.Cell>
                                    <span className="block min-w-0 truncate" title={st.name}>
                                        {st.name}
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
