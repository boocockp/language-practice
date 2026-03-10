# Chat transcript: Details form shell implementation

## 1. Plan implementation of shared details-form shell

**User:** Plan implementation of refactor plan section 2 (shared details-form shell).

**Outcome:** A plan was created (see `.cursor/plans/detailsformshell_implementation_c91763dc.plan.md`) covering: centralize `ConfirmLeaveFn` in `src/lib/confirmLeave.ts`; add `DetailsFormShell` owning header, discard dialog, confirm-leave behavior, and Save/Cancel; refactor `WordDetailsForm` and `QuestionTypeDetailsForm` to use the shell with fields as children; update `ListDetailPage` to import the type; verification and docs.

---

## 2. Implement the plan

**User:** Implement the plan as specified. Do NOT edit the plan file. Mark todos and complete all.

**Outcome:** Implemented in order:

1. **Centralize ConfirmLeaveFn** — Added `src/lib/confirmLeave.ts` with `export type ConfirmLeaveFn = () => Promise<boolean>`. Updated `ListDetailPage.tsx` to import and re-export from there. Removed local type from both details forms; they import from `../../lib/confirmLeave`.

2. **DetailsFormShell** — Added `src/components/DetailsFormShell.tsx` with props: `title`, `onClose`, `onConfirmLeaveReady`, `onDirtyChange`, `isDirty`, `isSubmitting`, `isSubmitDisabled`, `onSubmit`, `onCancel`, `children`. Shell owns `showDiscardConfirm` state, `pendingLeaveResolveRef`, `confirmLeave` callback, and effects for `onConfirmLeaveReady` / `onDirtyChange`. Renders header (title + close), form with children, Save/Cancel buttons, and discard dialog (same copy and behavior as before).

3. **WordDetailsForm** — Removed `showDiscardConfirm` and `SHOW_DISCARD_CONFIRM` from reducer; dropped duplicate type, discard dialog, and shell UI. Wrapped fields in `<DetailsFormShell ...>`; form keeps reducer (fields + `isSubmitting`), `formValuesEqual`, `isDirty`, `isTextValid`, and submit logic.

4. **QuestionTypeDetailsForm** — Same refactor: shell owns dialog/confirm-leave; form keeps state and fields, uses `DetailsFormShell` with same prop mapping.

5. **Verification** — `pnpm run typecheck`, `pnpm run lint`, and `pnpm run format` (then `pnpm run check`) pass. All 169 tests pass. Updated `docs/ARCHITECTURE.md` to describe `DetailsFormShell` and that new list+detail forms should use it.

---

## 3. Save transcript and commit

**User:** /commit

**Outcome:** New transcript file `.cursor/prompts/035_details_form_shell_implementation.md`. All changes staged and committed with a single message summarizing the feat and including plan/transcript.
