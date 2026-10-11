import { mergeDefined, useAnnouncement, usePersistentDismiss } from "@dbm-design-system/primitives";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react";
import { Checkbox } from "../../atoms/Checkbox";
import { Input } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FormField } from "../../molecules/FormField";
import { AlertDialog } from "../AlertDialog";
import type {
  ConfirmDialogLabels,
  ConfirmDialogOpenChangeReason,
  ConfirmDialogProps,
  ConfirmDialogTextMatch,
} from "./ConfirmDialog.types";

const makeDefaultLabels = (formatNumber: (value: number) => string): ConfirmDialogLabels => ({
  confirm: "Confirm",
  cancel: "Cancel",
  requireText: (text) => `Type “${text}” to confirm`,
  working: "Working…",
  failed: "That didn’t work. You can try again.",
  dontAskAgain: "Don’t ask me again",
  confirmIn: (seconds) => `You can confirm in ${formatNumber(seconds)} second${seconds === 1 ? "" : "s"}.`,
  confirmReady: "You can confirm now.",
});

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { then?: unknown }).then === "function";

/**
 * Whether what was typed counts. Composed and decomposed accents are alike (a Mac can type either), spaces at
 * either end are ignored, and a function of the caller's is untrusted: what it throws counts as "no".
 */
function textMatches(typed: string, required: string, mode: ConfirmDialogTextMatch): boolean {
  const entered = typed.trim().normalize("NFC");
  const wanted = required.normalize("NFC");
  if (typeof mode === "function") {
    try {
      return Boolean(mode(entered, wanted));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("ConfirmDialog: `requireTextMatch` threw, so the text was treated as not matching.", error);
      }
      return false;
    }
  }
  return mode === "ignore-case" ? entered.toLowerCase() === wanted.toLowerCase() : entered === wanted;
}

/** How long, in milliseconds, `confirmDelay` still has to run. It is counted from when the panel mounted. */
function useRemainingDelay(delay: number | undefined): number {
  const enabled = delay !== undefined && delay > 0;
  const [remaining, setRemaining] = useState(enabled ? delay : 0);
  useEffect(() => {
    if (!enabled) return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.max(0, delay - (Date.now() - startedAt));
      setRemaining(left);
      if (left === 0) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [enabled, delay]);
  return remaining;
}

/** How an answer is being given: from the open dialog, or with no dialog shown at all (remembered). */
type AnswerMode = "dialog" | "skipped-trigger" | "skipped-open";

interface ConfirmPanelProps {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  labels: ConfirmDialogLabels;
  requireText: string;
  requireTextMatch: ConfirmDialogTextMatch;
  showDontAskAgain: boolean;
  confirmDelay: number | undefined;
  /** An answer is out, or the owner has marked the dialog busy: it can't be answered. */
  pending: boolean;
  /** An answer of this dialog's own is out (as opposed to the owner's `busy`): drawn as a spinner. */
  working: boolean;
  message: string;
  announce: (text: string) => void;
  fieldRef: RefObject<HTMLInputElement | null>;
  confirmRef: RefObject<HTMLButtonElement | null>;
  cancelRef: RefObject<HTMLButtonElement | null>;
  confirmProps: ConfirmDialogProps["confirmProps"];
  cancelProps: ConfirmDialogProps["cancelProps"];
  /** Runs `onConfirm`; `true` when the answer is still pending, so the dialog must stay open. */
  onAnswer: (remember: boolean) => boolean;
  onClose: (reason: ConfirmDialogOpenChangeReason) => void;
}

/**
 * The dialog's sections. It is rendered inside the panel, so it mounts when the dialog opens and unmounts when
 * it closes: what is typed, the checkbox and the delay all start afresh every time, with no reset to remember.
 */
function ConfirmPanel({
  title,
  description,
  children,
  labels,
  requireText,
  requireTextMatch,
  showDontAskAgain,
  confirmDelay,
  pending,
  working,
  message,
  announce,
  fieldRef,
  confirmRef,
  cancelRef,
  confirmProps,
  cancelProps,
  onAnswer,
  onClose,
}: ConfirmPanelProps) {
  const [typed, setTyped] = useState("");
  const [remember, setRemember] = useState(false);
  const remaining = useRemainingDelay(confirmDelay);
  const delayed = confirmDelay !== undefined && confirmDelay > 0;
  const released = delayed && remaining === 0;
  const matches = (!requireText || textMatches(typed, requireText, requireTextMatch)) && remaining === 0;

  // Said once, when the line below changes from a count to "you can confirm now".
  const readyLabel = labels.confirmReady;
  useEffect(() => {
    if (released) announce(readyLabel);
  }, [released, announce, readyLabel]);

  const handleConfirmClick = (event: MouseEvent<HTMLButtonElement>) => {
    // `AlertDialog.Action` runs this before it looks at the busy state, so a busy dialog, a pending answer and a
    // mismatch are all refused here: nothing but a real answer ever reaches `onConfirm`.
    if (pending || !matches) {
      event.preventDefault();
      return;
    }
    // Stopping the event is what keeps Radix from closing the dialog while a promise is out.
    if (onAnswer(remember)) event.preventDefault();
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (pending || !matches) return;
    if (!onAnswer(remember)) onClose("action");
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
      {(hasBody || requireText || showDontAskAgain || delayed) && (
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
          {delayed && (
            // One line whose words change and whose height doesn't, so nothing moves when the delay ends.
            <Text size="sm" color="secondary">
              {released ? labels.confirmReady : labels.confirmIn(Math.ceil(remaining / 1000))}
            </Text>
          )}
          {showDontAskAgain && (
            <Checkbox checked={remember} onCheckedChange={(next) => setRemember(next === true)}>
              {labels.dontAskAgain}
            </Checkbox>
          )}
        </AlertDialog.Body>
      )}
      {/* In the page before its text changes, as a live region has to be; the words come from `announce`. */}
      <VisuallyHidden role="status">{message}</VisuallyHidden>
      <AlertDialog.Footer>
        <AlertDialog.Cancel {...cancelProps} ref={cancelRef}>
          {labels.cancel}
        </AlertDialog.Cancel>
        {/*
          `isLoading` is not used for the pending state: `Button` turns it into a native `disabled`, which takes a
          pressed button out of the tab order and drops its focus. The busy panel already marks the button
          `aria-disabled` and keeps it focusable, so a spinner is drawn in its label instead.
        */}
        <AlertDialog.Action {...confirmProps} ref={confirmRef} disabled={!matches} onClick={handleConfirmClick}>
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
 * resolves, and stays open when it rejects. `requireText` asks for a name to be typed before the confirm enables,
 * `confirmDelay` holds the button back for a moment, and `dontAskAgain` lets the person switch the question off.
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
      formatNumber = String,
      onConfirm,
      onCancel,
      onConfirmError,
      busy = false,
      requireText = "",
      requireTextMatch = "exact",
      dontAskAgain,
      confirmDelay,
      confirmProps,
      cancelProps,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      initialFocus,
      ...contentProps
    },
    ref,
  ) => {
    const labels = mergeDefined(makeDefaultLabels(formatNumber), labelOverrides);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;

    // `pending` drives what is drawn; the ref answers "is one out already?" within the tick a double press shares.
    const [pending, setPending] = useState(false);
    const pendingRef = useRef(false);
    const mountedRef = useRef(false);
    const fieldRef = useRef<HTMLInputElement | null>(null);
    const confirmRef = useRef<HTMLButtonElement | null>(null);
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const { message, announce } = useAnnouncement();

    // A confirmation the person asked never to be asked again: it is not drawn, and `onConfirm` just runs.
    const remembered = usePersistentDismiss(dontAskAgain?.key ?? "", {
      storage: dontAskAgain?.storage,
      expiresAfter: dontAskAgain?.expiresAfter,
    });
    const skip = Boolean(dontAskAgain) && remembered.ready && remembered.dismissed;

    // The callbacks a promise settles into are the ones from the render that started it; this keeps the latest.
    const latest = useRef<{
      isControlled: boolean;
      onOpenChange: ConfirmDialogProps["onOpenChange"];
      onConfirmError: ConfirmDialogProps["onConfirmError"];
      failed: string;
      answer: (options: { remember?: boolean; mode: AnswerMode }) => boolean;
    } | null>(null);
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
      if (!current) return;
      if (!current.isControlled) setUncontrolledOpen(false);
      current.onOpenChange?.(false, { reason });
    }, []);

    const settle = useCallback(
      async (promise: PromiseLike<unknown>, mode: AnswerMode, onSuccess: () => void) => {
        try {
          await promise;
        } catch (error) {
          pendingRef.current = false;
          if (mountedRef.current) setPending(false);
          const current = latest.current;
          announce(current?.failed ?? "");
          const handler = current?.onConfirmError;
          // Left unhandled when there is no handler, so a failed answer is never lost silently.
          if (!handler) throw error;
          handler(error);
          return;
        }
        pendingRef.current = false;
        onSuccess();
        if (!mountedRef.current) return;
        setPending(false);
        if (mode !== "skipped-trigger") requestClose("action");
      },
      [announce, requestClose],
    );

    /**
     * Runs `onConfirm`. `true` means a promise is out and the dialog must stay open; `false` means it finished (the
     * caller, or Radix, closes the dialog). A remembered answer has no dialog to close in one mode, and closes
     * the one `open` asked for in the other.
     */
    const answer = ({ remember = false, mode }: { remember?: boolean; mode: AnswerMode }): boolean => {
      if (pendingRef.current) return true;
      const rememberChoice = () => {
        if (remember) remembered.dismiss();
      };
      const result = onConfirm?.();
      if (!isThenable(result)) {
        rememberChoice();
        if (mode === "skipped-open") requestClose("action");
        return false;
      }
      pendingRef.current = true;
      setPending(true);
      announce(labels.working);
      void settle(result, mode, rememberChoice);
      return true;
    };

    useEffect(() => {
      latest.current = {
        isControlled,
        onOpenChange,
        onConfirmError,
        failed: labels.failed,
        answer,
      };
    });

    const handleOpenChange = (next: boolean, details: { reason: ConfirmDialogOpenChangeReason }) => {
      // Nothing closes it while an answer is out; the busy panel already blocks every way, this is the net.
      if (!next && pendingRef.current) return;
      if (next && skip) {
        // Remembered: the question is not asked, the answer is simply given.
        answer({ mode: "skipped-trigger" });
        return;
      }
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, { reason: details.reason });
      if (!next && (details.reason === "cancel" || details.reason === "escape")) onCancel?.();
    };

    // Asked to be open (`open`, `defaultOpen`) while the question is switched off: answer it, then say it closed.
    const skippedOpenRef = useRef(false);
    useEffect(() => {
      if (open && skip) {
        if (!skippedOpenRef.current) {
          skippedOpenRef.current = true;
          latest.current?.answer({ mode: "skipped-open" });
        }
      } else {
        skippedOpenRef.current = false;
      }
    }, [open, skip]);

    // Where focus starts. With a field to type in, or a button held back, the confirm can't take it yet.
    const gated = Boolean(requireText) || (confirmDelay !== undefined && confirmDelay > 0);
    let focusTarget: RefObject<HTMLElement | null> | undefined;
    if (initialFocus !== undefined && typeof initialFocus === "object") focusTarget = initialFocus;
    else if (initialFocus === "cancel") focusTarget = cancelRef;
    else if (initialFocus === "confirm") focusTarget = requireText ? fieldRef : gated ? undefined : confirmRef;
    else focusTarget = requireText ? fieldRef : undefined;

    return (
      <AlertDialog open={open && !skip} onOpenChange={handleOpenChange}>
        {trigger && <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>}
        <AlertDialog.Content
          {...contentProps}
          ref={ref}
          tone={tone}
          icon={icon}
          size={size}
          busy={busy || pending}
          initialFocus={focusTarget}
        >
          <ConfirmPanel
            title={title}
            description={description}
            labels={labels}
            requireText={requireText}
            requireTextMatch={requireTextMatch}
            showDontAskAgain={Boolean(dontAskAgain)}
            confirmDelay={confirmDelay}
            pending={pending || busy}
            working={pending}
            message={message}
            announce={announce}
            fieldRef={fieldRef}
            confirmRef={confirmRef}
            cancelRef={cancelRef}
            confirmProps={confirmProps}
            cancelProps={cancelProps}
            onAnswer={(remember) => answer({ remember, mode: "dialog" })}
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
