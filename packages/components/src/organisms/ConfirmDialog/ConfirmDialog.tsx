import { mergeDefined } from "@dbm-design-system/primitives";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react";
import { Input } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { FormField } from "../../molecules/FormField";
import { AlertDialog } from "../AlertDialog";
import type {
  ConfirmDialogLabels,
  ConfirmDialogOpenChangeReason,
  ConfirmDialogProps,
} from "./ConfirmDialog.types";

const defaultLabels: ConfirmDialogLabels = {
  confirm: "Confirm",
  cancel: "Cancel",
  requireText: (text) => `Type “${text}” to confirm`,
};

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { then?: unknown }).then === "function";

interface ConfirmPanelProps {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  labels: ConfirmDialogLabels;
  requireText: string;
  /** An answer is out, or the owner has marked the dialog busy: it can't be answered. */
  pending: boolean;
  /** An answer of this dialog's own is out (as opposed to the owner's `busy`): drawn as a spinner. */
  working: boolean;
  fieldRef: RefObject<HTMLInputElement | null>;
  /** Runs `onConfirm`; `true` when the answer is still pending, so the dialog must stay open. */
  onAnswer: () => boolean;
  onClose: (reason: ConfirmDialogOpenChangeReason) => void;
}

/**
 * The dialog's sections. It is rendered inside the panel, so it mounts when the dialog opens and unmounts when
 * it closes: what is typed in the type-to-confirm field starts empty every time, with no reset to remember.
 */
function ConfirmPanel({
  title,
  description,
  children,
  labels,
  requireText,
  pending,
  working,
  fieldRef,
  onAnswer,
  onClose,
}: ConfirmPanelProps) {
  const [typed, setTyped] = useState("");
  const matches = !requireText || typed.trim() === requireText;

  const handleConfirmClick = (event: MouseEvent<HTMLButtonElement>) => {
    // `AlertDialog.Action` runs this before it looks at the busy state, so a busy dialog, a pending answer and a
    // mismatch are all refused here: nothing but a real answer ever reaches `onConfirm`.
    if (pending || !matches) {
      event.preventDefault();
      return;
    }
    // Stopping the event is what keeps Radix from closing the dialog while a promise is out.
    if (onAnswer()) event.preventDefault();
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (pending || !matches) return;
    if (!onAnswer()) onClose("action");
  };

  const hasBody = children !== undefined && children !== null && children !== false;

  return (
    <>
      <AlertDialog.Header>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        {description !== undefined && description !== null && (
          <AlertDialog.Description>{description}</AlertDialog.Description>
        )}
      </AlertDialog.Header>
      {(hasBody || requireText) && (
        <AlertDialog.Body>
          {children}
          {requireText && (
            <FormField label={labels.requireText(requireText)}>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  ref={fieldRef}
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  // Not `disabled`: that would drop focus from a field the person is in while it works.
                  readOnly={pending}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </FormField>
          )}
        </AlertDialog.Body>
      )}
      <AlertDialog.Footer>
        <AlertDialog.Cancel>{labels.cancel}</AlertDialog.Cancel>
        {/*
          `isLoading` is not used for the pending state: `Button` turns it into a native `disabled`, which takes a
          pressed button out of the tab order and drops its focus. The busy panel already marks the button
          `aria-disabled` and keeps it focusable, so a spinner is drawn in its label instead.
        */}
        <AlertDialog.Action disabled={!matches} onClick={handleConfirmClick}>
          {working && <Spinner size="xs" />}
          {labels.confirm}
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </>
  );
}

/**
 * A confirmation in one element: the question, what it will do, and the two answers, drawn as an
 * `AlertDialog` (`role="alertdialog"`, no dismissal by a press outside, focus starting on the safe choice). Give
 * it a `title`, a `description` and an `onConfirm`, and a `trigger` to open it from.
 *
 * `onConfirm` may return a promise: the dialog then stays open and busy until it settles, closes when it
 * resolves, and stays open when it rejects. `requireText` asks for a name to be typed before the confirm enables.
 *
 * Prop-driven, with no sub-parts. For anything it doesn't cover (a second choice with its own value, an
 * acknowledge-only alert, custom sections) compose `AlertDialog` itself; for a window with fields to fill in, use
 * `Dialog`.
 *
 * `ref` and the native `<div>` props go to the dialog panel.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   trigger={<Button variant="destructive">Delete project</Button>}
 *   tone="danger"
 *   title="Delete project?"
 *   description="This removes the project and all of its files for good. It cannot be undone."
 *   labels={{ confirm: "Delete", cancel: "Keep it" }}
 *   onConfirm={() => deleteProject()}
 * />
 * ```
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      title,
      description,
      children,
      trigger,
      tone = "neutral",
      icon,
      size,
      labels: labelOverrides,
      onConfirm,
      onCancel,
      onConfirmError,
      busy = false,
      requireText = "",
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      initialFocus,
      ...contentProps
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels, labelOverrides);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;

    // `pending` drives what is drawn; the ref answers "is one out already?" within the tick a double press shares.
    const [pending, setPending] = useState(false);
    const pendingRef = useRef(false);
    const mountedRef = useRef(false);
    const fieldRef = useRef<HTMLInputElement | null>(null);

    // The callbacks a promise settles into are the ones from the render that started it; this keeps the latest.
    const latest = useRef({ isControlled, onOpenChange, onCancel, onConfirm, onConfirmError });
    useEffect(() => {
      latest.current = { isControlled, onOpenChange, onCancel, onConfirm, onConfirmError };
    });
    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    // Nothing could ever open it: a development-only warning, from an effect since it reads the props only.
    const unopenable = !trigger && openProp === undefined && !defaultOpen;
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && unopenable) {
        console.warn(
          "ConfirmDialog: nothing can open it. Pass a `trigger`, or control it with `open` (or `defaultOpen`).",
        );
      }
    }, [unopenable]);

    const requestClose = useCallback((reason: ConfirmDialogOpenChangeReason) => {
      const current = latest.current;
      if (!current.isControlled) setUncontrolledOpen(false);
      current.onOpenChange?.(false, { reason });
    }, []);

    const handleOpenChange = (next: boolean, details: { reason: ConfirmDialogOpenChangeReason }) => {
      // Nothing closes it while an answer is out; the busy panel already blocks every way, this is the net.
      if (!next && pendingRef.current) return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, { reason: details.reason });
      if (!next && (details.reason === "cancel" || details.reason === "escape")) onCancel?.();
    };

    const settle = useCallback(
      async (answer: PromiseLike<unknown>) => {
        try {
          await answer;
        } catch (error) {
          pendingRef.current = false;
          if (mountedRef.current) setPending(false);
          const handler = latest.current.onConfirmError;
          // Left unhandled when there is no handler, so a failed answer is never lost silently.
          if (!handler) throw error;
          handler(error);
          return;
        }
        pendingRef.current = false;
        if (!mountedRef.current) return;
        setPending(false);
        requestClose("action");
      },
      [requestClose],
    );

    const answer = (): boolean => {
      if (pendingRef.current) return true;
      const result = onConfirm?.();
      if (!isThenable(result)) return false;
      pendingRef.current = true;
      setPending(true);
      void settle(result);
      return true;
    };

    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        {trigger && <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>}
        <AlertDialog.Content
          {...contentProps}
          ref={ref}
          tone={tone}
          icon={icon}
          size={size}
          busy={busy || pending}
          // With a field to type in, that is where focus starts; Cancel is one Shift+Tab away.
          initialFocus={initialFocus ?? (requireText ? fieldRef : undefined)}
        >
          <ConfirmPanel
            title={title}
            description={description}
            labels={labels}
            requireText={requireText}
            pending={pending || busy}
            working={pending}
            fieldRef={fieldRef}
            onAnswer={answer}
            onClose={requestClose}
          >
            {children}
          </ConfirmPanel>
        </AlertDialog.Content>
      </AlertDialog>
    );
  },
);

ConfirmDialog.displayName = "ConfirmDialog";
