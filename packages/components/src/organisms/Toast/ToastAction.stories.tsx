import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013): resolves `Toast.Action`'s own argTypes for its sub-part Properties table.
const meta: Meta<typeof Toast.Action> = {
  title: "Organisms/Feedback/Toast/Action",
  component: Toast.Action,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The action's label (or, with asChild, the element it is drawn onto)." },
    altText: {
      control: "text",
      description:
        "How to do the same thing without the toast — required. A toast goes away by itself, and a screen reader user or a keyboard user may never reach it in time, so this is read out with the toast in place of the button. The action must never be the only way.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      description:
        "How prominent it is, using the names Button uses for the same three treatments. How each looks depends on the toast's tone and variant, so that it always reads against it.",
      table: { defaultValue: { summary: '"primary"' } },
    },
    onClick: {
      control: false,
      description:
        "Called when it is pressed, and then the toast closes. Returning a promise holds the toast open while it runs (a spinner on the button, no second press, no timeout) and closes it when it resolves; a rejection keeps it open and goes to onClickError.",
    },
    onClickError: {
      control: false,
      description:
        "Called with what a promise returned by onClick rejected with. With none, the rejection is left unhandled so it surfaces where it can be seen rather than being dropped.",
    },
    asChild: {
      control: false,
      description: "Renders the action onto your own single child element instead of a button, a link to the page it belongs to, say.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables it, as Button does: it stays focusable and does nothing.",
      table: { defaultValue: { summary: "false" } },
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    id: { control: false, description: "Standard DOM id." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Toast.Action>;

export const Default: Story = {
  render: (args) => (
    <Toast.Provider>
      <Toast>
        <Toast.Title>Deleted</Toast.Title>
        <Toast.Action {...args} altText={args.altText ?? "Undo from the Edit menu"}>
          Undo
        </Toast.Action>
      </Toast>
    </Toast.Provider>
  ),
};
