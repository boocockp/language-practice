import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Dialog } from "@cloudflare/kumo";
import { X } from "@phosphor-icons/react";

import type { ConfirmLeaveFn } from "../lib/confirmLeave";

export type DetailsFormShellProps = {
    title: string;
    onClose: () => void;
    onConfirmLeaveReady?: (confirmLeave: ConfirmLeaveFn) => void;
    onDirtyChange?: (dirty: boolean) => void;
    isDirty: boolean;
    isSubmitting: boolean;
    isSubmitDisabled: boolean;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    children: ReactNode;
};

export function DetailsFormShell({
    title,
    onClose,
    onConfirmLeaveReady,
    onDirtyChange,
    isDirty,
    isSubmitting,
    isSubmitDisabled,
    onSubmit,
    onCancel,
    children,
}: DetailsFormShellProps) {
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const pendingLeaveResolveRef = useRef<((value: boolean) => void) | null>(null);

    useEffect(() => {
        onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const confirmLeave = useCallback((): Promise<boolean> => {
        if (!isDirty) return Promise.resolve(true);
        setShowDiscardConfirm(true);
        return new Promise((resolve) => {
            pendingLeaveResolveRef.current = resolve;
        });
    }, [isDirty]);

    useEffect(() => {
        onConfirmLeaveReady?.(confirmLeave);
    }, [onConfirmLeaveReady, confirmLeave]);

    function handleCloseClick() {
        if (isDirty) {
            setShowDiscardConfirm(true);
        } else {
            onClose();
        }
    }

    function handleConfirmDiscard() {
        pendingLeaveResolveRef.current?.(true);
        pendingLeaveResolveRef.current = null;
        setShowDiscardConfirm(false);
        onClose();
    }

    function handleKeepEditing() {
        pendingLeaveResolveRef.current?.(false);
        pendingLeaveResolveRef.current = null;
        setShowDiscardConfirm(false);
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <Button type="button" variant="secondary" aria-label="Close" onClick={handleCloseClick}>
                        <X size={20} aria-hidden />
                    </Button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col">
                    {children}
                    <div className="flex gap-2 pt-2 mt-auto">
                        <Button type="submit" variant="primary" disabled={isSubmitting || isSubmitDisabled}>
                            Save
                        </Button>
                        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

            <Dialog.Root open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
                <Dialog size="sm" className="p-6">
                    <Dialog.Title>Discard changes?</Dialog.Title>
                    <Dialog.Description>You have unsaved changes. Do you want to discard them?</Dialog.Description>
                    <div className="mt-4 flex gap-2 justify-end">
                        <Button variant="secondary" onClick={handleKeepEditing}>
                            Keep editing
                        </Button>
                        <Button variant="primary" onClick={handleConfirmDiscard}>
                            Discard changes
                        </Button>
                    </div>
                </Dialog>
            </Dialog.Root>
        </>
    );
}
