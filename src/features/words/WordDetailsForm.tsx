import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Dialog, Field, Input } from "@cloudflare/kumo";
import { X } from "@phosphor-icons/react";

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { WORD_TYPES, type WordType } from "../../../convex/wordTypes";

export type WordUpdatePayload = {
  wordId?: Id<"words">;
  text: string;
  type: WordType;
  meaning: string;
  tags?: string;
};

export type ConfirmLeaveFn = () => Promise<boolean>;

const NEW_WORD_DEFAULTS = {
  text: "",
  type: "nf" as const,
  meaning: "",
  tags: "",
};

type WordDetailsFormProps = {
  word: Doc<"words"> | null;
  onSave: (payload: WordUpdatePayload) => Promise<void>;
  onCancel: () => void;
  onClose: () => void;
  onConfirmLeaveReady?: (confirmLeave: ConfirmLeaveFn) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function formValuesEqual(
  a: { text: string; type: string; meaning: string; tags: string },
  b: { text: string; type: string; meaning: string; tags: string },
): boolean {
  return (
    a.text === b.text &&
    a.type === b.type &&
    a.meaning === b.meaning &&
    a.tags === b.tags
  );
}

export function WordDetailsForm({
  word,
  onSave,
  onCancel,
  onClose,
  onConfirmLeaveReady,
  onDirtyChange,
}: WordDetailsFormProps) {
  const initialValues = word ?? NEW_WORD_DEFAULTS;
  const [text, setText] = useState(initialValues.text);
  const [type, setType] = useState<WordType>(initialValues.type);
  const [meaning, setMeaning] = useState(initialValues.meaning);
  const [tags, setTags] = useState(initialValues.tags ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const pendingLeaveResolveRef = useRef<((value: boolean) => void) | null>(
    null,
  );

  const current = {
    text,
    type,
    meaning,
    tags,
  };
  const initial = {
    text: initialValues.text,
    type: initialValues.type,
    meaning: initialValues.meaning,
    tags: initialValues.tags ?? "",
  };
  const isDirty = !formValuesEqual(current, initial);
  const isTextValid = text.trim() !== "";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isTextValid) return;
    setIsSubmitting(true);
    try {
      const payload: WordUpdatePayload = {
        text: text.trim(),
        type,
        meaning,
        tags: tags || undefined,
      };
      if (word) payload.wordId = word._id;
      await onSave(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <h2 className="text-lg font-semibold">
            {word ? word.meaning : "New Word"}
          </h2>
          <Button
            type="button"
            variant="secondary"
            aria-label="Close"
            onClick={handleCloseClick}
          >
            <X size={20} aria-hidden />
          </Button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex-1 min-h-0 flex flex-col"
        >
          <Field label="Text" required>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              placeholder="The word you are learning"
              aria-label="Text"
            />
          </Field>
          <Field label="Type" required>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as WordType)
              }
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Type"
            >
              {WORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meaning" required>
            <Input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              disabled={isSubmitting}
              placeholder="What the word means"
              aria-label="Meaning"
            />
          </Field>
          <Field label="Tags (optional)">
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isSubmitting}
              placeholder="Space-separated tags"
              aria-label="Tags"
            />
          </Field>
          <div className="flex gap-2 pt-2 mt-auto">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isTextValid}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <Dialog.Root
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <Dialog size="sm" className="p-6">
          <Dialog.Title>Discard changes?</Dialog.Title>
          <Dialog.Description>
            You have unsaved changes. Do you want to discard them?
          </Dialog.Description>
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
