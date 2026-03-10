import { useEffect, useRef, type ReactNode } from "react";
import { Empty, Text, Button } from "@cloudflare/kumo";
import { Plus } from "@phosphor-icons/react";

import { cn } from "../lib/cn";

export type ConfirmLeaveFn = () => Promise<boolean>;

export type ListDetailPageProps<TId extends string, TDoc> = {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    backLinkText: string;
    addButtonAriaLabel: string;
    /** Message when selectedItem is null (not found). */
    notFoundMessage: string;
    list: TDoc[] | undefined;
    /** Must exclude _new (e.g. null when creating new). */
    selectedId: TId | null;
    selectedItem: TDoc | null | undefined;
    isNew: boolean;
    showDetails: boolean;
    showTable: boolean;
    /** e.g. "data-word-id" or "data-question-type-id" for scroll-into-view. */
    dataRowIdAttribute?: string;
    onRowClick: (id: TId) => void;
    onAddClick: () => void;
    onGoBack: () => void;
    onSave: (payload: unknown) => Promise<void>;
    renderTable: (opts: {
        containerRef: React.RefObject<HTMLDivElement | null>;
        onRowClick: (id: TId) => void;
    }) => ReactNode;
    renderDetailsForm: (opts: {
        confirmLeaveRef: React.MutableRefObject<ConfirmLeaveFn | null>;
    }) => ReactNode;
};

export function ListDetailPage<TId extends string, TDoc>({
    title,
    emptyTitle,
    emptyDescription,
    backLinkText,
    addButtonAriaLabel,
    notFoundMessage,
    list,
    selectedId,
    selectedItem,
    isNew,
    showDetails,
    showTable,
    dataRowIdAttribute,
    onRowClick,
    onAddClick,
    onGoBack,
    renderTable,
    renderDetailsForm,
}: ListDetailPageProps<TId, TDoc>) {
    const confirmLeaveRef = useRef<ConfirmLeaveFn | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!showDetails) confirmLeaveRef.current = null;
    }, [showDetails]);

    useEffect(() => {
        if (
            !selectedId ||
            !dataRowIdAttribute ||
            !tableContainerRef.current
        )
            return;
        const row = tableContainerRef.current.querySelector(
            `[${dataRowIdAttribute}="${selectedId}"]`,
        );
        const el = row as HTMLElement | null;
        if (el?.scrollIntoView) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedId, dataRowIdAttribute, list]);

    async function handleAddClick() {
        if (showDetails) {
            const confirmLeave = confirmLeaveRef.current ?? (() => Promise.resolve(true));
            const ok = await confirmLeave();
            if (!ok) return;
        }
        onAddClick();
    }

    async function handleRowClick(id: TId) {
        const confirmLeave = confirmLeaveRef.current ?? (() => Promise.resolve(true));
        const ok = await confirmLeave();
        if (ok) onRowClick(id);
    }

    return (
        <section className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between gap-2">
                <Text variant="heading2">{title}</Text>
                <Button
                    type="button"
                    variant="primary"
                    aria-label={addButtonAriaLabel}
                    onClick={handleAddClick}
                >
                    <Plus size={20} aria-hidden />
                    Add
                </Button>
            </div>

            {list === undefined ? (
                <p className="text-slate-500 mt-4" aria-busy="true">
                    Loading…
                </p>
            ) : list.length === 0 && !showDetails ? (
                <Empty
                    className="mt-4"
                    title={emptyTitle}
                    description={emptyDescription}
                />
            ) : (
                <div
                    className={cn(
                        "mt-4 flex flex-1 min-h-0 gap-4",
                        "flex-col md:flex-row",
                    )}
                >
                    {showTable && list && list.length > 0 && (
                        <div
                            ref={tableContainerRef}
                            className={cn(
                                "min-w-0 flex-1 md:max-w-md flex flex-col overflow-auto",
                                showDetails && "hidden md:flex",
                            )}
                        >
                            {renderTable({
                                containerRef: tableContainerRef,
                                onRowClick: handleRowClick,
                            })}
                        </div>
                    )}
                    {showDetails && (
                        <div className="min-w-0 flex-1 md:min-w-[320px] flex flex-col border border-slate-200 rounded-lg p-4 bg-white">
                            {isNew ? (
                                renderDetailsForm({
                                    confirmLeaveRef,
                                })
                            ) : selectedItem === undefined ? (
                                <p
                                    className="text-slate-500"
                                    aria-busy="true"
                                >
                                    Loading…
                                </p>
                            ) : selectedItem === null ? (
                                <div className="space-y-2">
                                    <p className="text-slate-600">
                                        {notFoundMessage}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onGoBack}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {backLinkText}
                                    </button>
                                </div>
                            ) : (
                                renderDetailsForm({
                                    confirmLeaveRef,
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
