import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Dialog } from "./Dialog";
import { dialogPlaygroundSnippet, dialogSnippets } from "./Dialog.snippets";
import type { DialogContentProps, DialogProps, DialogSize } from "./Dialog.types";
import { DialogStage, LongText, ProfileDialog } from "./DialogStoryKit";

// Combines Dialog's own root-level args (modal/onOpenChange) with Dialog.Content's (size/divided/…) in one
// Playground: `meta.component` can only resolve docgen argTypes for one component, so Content's are declared by
// hand below and threaded through `render`. Each sub-part still gets its own Properties table from a hidden,
// docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  modal: boolean;
  onOpenChange: (open: boolean) => void;
  size: DialogSize;
  fullScreen: boolean;
  divided: boolean;
  showCloseButton: boolean;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
}

const contentFromArgs = (args: PlaygroundArgs): DialogContentProps => ({
  size: args.size,
  fullScreen: args.fullScreen,
  divided: args.divided,
  showCloseButton: args.showCloseButton,
  closeOnOutsideClick: args.closeOnOutsideClick,
  closeOnEscape: args.closeOnEscape,
});

const rootFromArgs = (args: PlaygroundArgs): Omit<DialogProps, "children"> => ({
  modal: args.modal,
  onOpenChange: args.onOpenChange,
});

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => dialogPlaygroundSnippet(context.args),
};

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Overlay/Dialog",
  parameters: { layout: "padded" },
  argTypes: {
    modal: {
      control: "boolean",
      description:
        "Dims the page behind a scrim, locks its scroll, traps focus and makes the rest of the page inert. Turn off for a docked panel that coexists with the page.",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: { control: false, description: "Called with the new open state whenever it changes." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The panel's maximum width. On a narrower viewport the panel fills the width less a gutter.",
      table: { defaultValue: { summary: '"md"' } },
    },
    fullScreen: {
      control: "boolean",
      description:
        "Fills the whole viewport. Pass a mobile-first map such as { base: true, md: false } to switch at a breakpoint — shown here as a single boolean, with its own story below for the map.",
      table: { defaultValue: { summary: "false" } },
    },
    divided: {
      control: "boolean",
      description: "Draws a line between the header and the body and between the body and the footer.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows a CloseButton in the panel's top-end corner.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnOutsideClick: {
      control: "boolean",
      description: "Whether a press on the scrim closes the dialog.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the dialog.",
      table: { defaultValue: { summary: "true" } },
    },
  },
  args: {
    modal: true,
    size: "md",
    fullScreen: false,
    divided: false,
    showCloseButton: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    onOpenChange: fn(),
  },
  render: (args) => (
    <DialogStage>
      {(container) => <ProfileDialog container={container} dialog={rootFromArgs(args)} content={contentFromArgs(args)} />}
    </DialogStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: dialogSnippets.sizes } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <ProfileDialog
              key={size}
              container={container}
              dialog={rootFromArgs(args)}
              content={{ ...contentFromArgs(args), size }}
              triggerLabel={size}
            />
          ))}
        </div>
      )}
    </DialogStage>
  ),
};

export const FullScreenOnPhone: Story = {
  name: "Full screen on a phone, a panel from md up",
  parameters: { docs: { source: { code: dialogSnippets.fullScreen } } },
  argTypes: { fullScreen: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <ProfileDialog
          container={container}
          dialog={rootFromArgs(args)}
          content={{ ...contentFromArgs(args), fullScreen: { base: true, md: false } }}
          triggerLabel="Open (resize below md to see it fill the screen)"
        />
      )}
    </DialogStage>
  ),
};

export const LongContent: Story = {
  name: "Long content scrolls inside the panel",
  parameters: { docs: { source: { code: dialogSnippets.longContent } } },
  argTypes: { divided: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <Dialog {...rootFromArgs(args)}>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content container={container} {...contentFromArgs(args)} divided>
            <Dialog.Header>
              <Dialog.Title>Terms of service</Dialog.Title>
              <Dialog.Description>Scroll to the end to continue.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <LongText />
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button variant="secondary">Decline</Button>
              </Dialog.Close>
              <Button>Accept</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </DialogStage>
  ),
};

export const NonModal: Story = {
  name: "Non-modal, no scrim",
  parameters: { docs: { source: { code: dialogSnippets.nonModal } } },
  argTypes: { modal: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <ProfileDialog
          container={container}
          dialog={{ ...rootFromArgs(args), modal: false }}
          content={contentFromArgs(args)}
        />
      )}
    </DialogStage>
  ),
};

export const UnsavedChanges: Story = {
  name: "Only the footer closes it",
  parameters: { docs: { source: { code: dialogSnippets.unsavedChanges } } },
  argTypes: {
    showCloseButton: { control: false },
    closeOnOutsideClick: { control: false },
    closeOnEscape: { control: false },
  },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <ProfileDialog
          container={container}
          dialog={rootFromArgs(args)}
          content={{
            ...contentFromArgs(args),
            showCloseButton: false,
            closeOnOutsideClick: false,
            closeOnEscape: false,
          }}
        />
      )}
    </DialogStage>
  ),
};

export const WithHiddenTitle: Story = {
  name: "With a visually hidden title",
  parameters: { docs: { source: { code: dialogSnippets.hiddenTitle } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <Dialog {...rootFromArgs(args)}>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content container={container} {...contentFromArgs(args)} size="sm">
            <VisuallyHidden asChild>
              <Dialog.Title>Image preview</Dialog.Title>
            </VisuallyHidden>
            <Dialog.Body>
              <Text>The dialog is named &quot;Image preview&quot; for screen readers; the design shows no heading.</Text>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
      )}
    </DialogStage>
  ),
};

export const Nested: Story = {
  name: "A confirmation opened from inside",
  parameters: { docs: { source: { code: dialogSnippets.nested } } },
  argTypes: { size: { control: false }, modal: { control: false } },
  render: (args) => (
    <DialogStage>
      {(container) => (
        <Dialog onOpenChange={args.onOpenChange}>
          <Dialog.Trigger asChild>
            <Button>Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content container={container} {...contentFromArgs(args)}>
            <Dialog.Header>
              <Dialog.Title>Delete project</Dialog.Title>
              <Dialog.Description>This removes the project and all of its files.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Dialog>
                <Dialog.Trigger asChild>
                  <Button variant="destructive">Delete</Button>
                </Dialog.Trigger>
                <Dialog.Content container={container} size="sm">
                  <Dialog.Header>
                    <Dialog.Title>Are you sure?</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Footer>
                    <Dialog.Close asChild>
                      <Button variant="secondary">Keep it</Button>
                    </Dialog.Close>
                    <Button variant="destructive">Delete</Button>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </DialogStage>
  ),
};

function ControlledExample({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Save</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content container={container} aria-label="Saved" size="xs">
          <Dialog.Body>
            <Text>Your changes were saved.</Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

export const Controlled: Story = {
  name: "Controlled from your own state",
  parameters: { docs: { source: { code: dialogSnippets.controlled } } },
  argTypes: {
    modal: { control: false },
    size: { control: false },
    fullScreen: { control: false },
    divided: { control: false },
    showCloseButton: { control: false },
    closeOnOutsideClick: { control: false },
    closeOnEscape: { control: false },
    onOpenChange: { control: false },
  },
  render: () => <DialogStage>{(container) => <ControlledExample container={container} />}</DialogStage>,
};

// A hidden twin of the Playground: opening and closing change the page's state, so a shown story must not do it
// on its own (07 §5). It still runs as a test.
export const OpenAndEscapeInteraction: Story = {
  name: "Open, then Escape — interaction test",
  tags: ["!dev"],
  render: Playground.render,
  play: async ({ canvasElement }) => {
    const stage = within(canvasElement);
    const trigger = await stage.findByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);
    const dialog = await within(canvasElement).findByRole("dialog", { name: "Edit profile" });
    await expect(dialog).toHaveAccessibleDescription("Changes are saved to your account.");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(canvasElement).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
