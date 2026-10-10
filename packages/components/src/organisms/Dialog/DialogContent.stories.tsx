import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Content> = {
  title: "Organisms/Overlay/Dialog/Content",
  component: Dialog.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The dialog's content: usually Dialog.Header, Dialog.Body and Dialog.Footer, any of them optional.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The panel's maximum width. On a viewport narrower than the step the panel fills the width, less a gutter.",
      table: { defaultValue: { summary: '"md"' } },
    },
    fullScreen: {
      control: false,
      description:
        "Fills the whole viewport (no gutter, no rounded corners). A mobile-first map switches it at a breakpoint, e.g. { base: true, md: false } for full screen on a phone and a centred panel from md up.",
      table: { defaultValue: { summary: "false" } },
    },
    divided: {
      control: "boolean",
      description: "Draws a line between the header and the body and between the body and the footer.",
      table: { defaultValue: { summary: "false" } },
    },
    showCloseButton: {
      control: "boolean",
      description: "Shows a CloseButton in the panel's top-end corner. On by default: a modal needs a visible way out.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnOutsideClick: {
      control: "boolean",
      description: "Whether a press outside the panel (on the scrim) closes the dialog. Set false for a form with unsaved changes.",
      table: { defaultValue: { summary: "true" } },
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether Escape closes the dialog.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description: "The text the component supplies itself, each part replaceable: { close } for the close button's accessible name.",
      table: { defaultValue: { summary: "—" } },
    },
    container: {
      control: false,
      description: "Renders the dialog into a different DOM node than document.body — for a specific stacking-context requirement.",
    },
    onOpenAutoFocus: {
      control: false,
      description: "Called when focus moves into the dialog on open. Call event.preventDefault() to choose the element to focus yourself.",
    },
    onCloseAutoFocus: {
      control: false,
      description: "Called when focus would return to the trigger on close. Call event.preventDefault() to send focus elsewhere.",
    },
    onEscapeKeyDown: {
      control: false,
      description: "Called when Escape is pressed while open. Call event.preventDefault() to keep the dialog open.",
    },
    onPointerDownOutside: {
      control: false,
      description: "Called on a pointer-down outside the panel. Call event.preventDefault() to keep the dialog open.",
    },
    onFocusOutside: {
      control: false,
      description: "Called when focus moves outside the panel (only a non-modal dialog can lose focus this way). Call event.preventDefault() to keep it open.",
    },
    onInteractOutside: {
      control: false,
      description: "Called on any interaction outside the panel — a pointer-down or a focus move. Call event.preventDefault() to keep the dialog open.",
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the dialog, used when it has no visible title. A Dialog.Title is the preferred name.",
    },
    "aria-labelledby": {
      control: "text",
      description: "Points to the id of an existing element to use as the accessible name instead of a Dialog.Title.",
    },
    "aria-describedby": {
      control: "text",
      description: "Points to the id of an existing element that describes the dialog. Dialog.Description is wired in automatically.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the dialog panel itself.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Content>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog" {...args}>
        <Dialog.Body>Dialog content</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
};
