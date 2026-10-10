import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { AlertDialog } from "./AlertDialog";
import type { AlertDialogContentProps, AlertDialogProps } from "./AlertDialog.types";

/**
 * A box that keeps an open alert inside it, for Storybook only: every `<Canvas>` on a Docs page shares one
 * document, so a modal's fixed scrim would otherwise cover the whole page. A `transform` makes the box the
 * containing block of its fixed descendants, and the alert is portaled into it through `container`.
 */
export function AlertStage({
  children,
  minBlockSize = "28rem",
}: {
  children: (container: HTMLElement | null) => ReactNode;
  minBlockSize?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setContainer}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        minBlockSize,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
        background: "var(--dbm-bg-canvas)",
      }}
    >
      {children(container)}
    </div>
  );
}

/** The destructive confirmation every gallery story opens, so the stories differ in what they set on it. */
export function DeleteAlert({
  container,
  dialog,
  content,
  triggerLabel = "Delete project",
  onAction,
  busyAction = false,
}: {
  container: HTMLElement | null;
  dialog?: Omit<AlertDialogProps, "children">;
  content?: AlertDialogContentProps;
  triggerLabel?: string;
  onAction?: () => void;
  busyAction?: boolean;
}) {
  return (
    <AlertDialog {...dialog}>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content container={container} tone="danger" {...content}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>
            This removes the project and all of its files for good. It cannot be undone.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action
            isLoading={busyAction}
            onClick={(event) => {
              if (onAction) {
                // A story that works asynchronously keeps the alert open; the caller closes it when it is done.
                event.preventDefault();
                onAction();
              }
            }}
          >
            Delete
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
