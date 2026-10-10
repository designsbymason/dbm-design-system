import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { FieldLabel } from "../../atoms/FieldLabel";
import { Input } from "../../atoms/Input";
import { Stack } from "../../atoms/Stack";
import { Text } from "../../atoms/Text";
import { Dialog } from "./Dialog";
import type { DialogContentProps, DialogProps } from "./Dialog.types";

/**
 * A box that keeps an open dialog inside it, for Storybook only. Every `<Canvas>` on a Docs page shares one
 * document, so a dialog's `position: fixed` scrim would otherwise cover the whole page. A `transform` makes the
 * box the containing block of its fixed descendants, and the dialog is portaled into it through `container`.
 */
export function DialogStage({ children }: { children: (container: HTMLElement | null) => ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setContainer}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        minBlockSize: "28rem",
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

/** The profile form every gallery story opens, so the stories differ only in what they set on the dialog. */
export function ProfileDialog({
  container,
  dialog,
  content,
  triggerLabel = "Open dialog",
  withFooter = true,
}: {
  container: HTMLElement | null;
  dialog?: Omit<DialogProps, "children">;
  content?: DialogContentProps;
  triggerLabel?: string;
  withFooter?: boolean;
}) {
  return (
    <Dialog {...dialog}>
      <Dialog.Trigger asChild>
        <Button>{triggerLabel}</Button>
      </Dialog.Trigger>
      <Dialog.Content container={container} {...content}>
        <Dialog.Header>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Changes are saved to your account.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <Stack gap={3}>
            <div>
              <FieldLabel htmlFor="story-display-name">Display name</FieldLabel>
              <Input id="story-display-name" placeholder="Jane Doe" />
            </div>
            <div>
              <FieldLabel htmlFor="story-email">Email</FieldLabel>
              <Input id="story-email" type="email" placeholder="jane@example.com" />
            </div>
          </Stack>
        </Dialog.Body>
        {withFooter && (
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button>Save changes</Button>
          </Dialog.Footer>
        )}
      </Dialog.Content>
    </Dialog>
  );
}

const paragraphs = Array.from({ length: 14 }, (_, index) => index + 1);

/** Enough text to overflow the panel at every size, so the body has something to scroll. */
export function LongText() {
  return (
    <Stack gap={3}>
      {paragraphs.map((paragraph) => (
        <Text key={paragraph}>
          Paragraph {paragraph}. A dialog&apos;s body scrolls inside the panel while its header and footer stay in
          view, so a long form or a terms-of-service text never pushes the close button off the screen.
        </Text>
      ))}
    </Stack>
  );
}
