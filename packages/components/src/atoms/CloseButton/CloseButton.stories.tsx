import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CloseButton } from "./CloseButton";

const meta: Meta<typeof CloseButton> = {
  title: "Atoms/Inputs/CloseButton",
  component: CloseButton,
  parameters: { layout: "padded" },
  // Ordered core visual props → behavioral/state props → advanced/
  // escape-hatch props last, the same sequencing principle the future
  // Properties table will use (guidelines/
  // 07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Controls the button's clickable box and its glyph together, as one step — matches IconButton's own size scale (box sized generously around the glyph, not a tight fit).",
    },
    "aria-label": {
      control: "text",
      description:
        'Accessible label, announced by assistive tech. Defaults to "Close" — override for context, e.g. "Dismiss notification".',
    },
    type: { control: "select", options: ["button", "submit", "reset"] },
    disabled: {
      description: "Disables the button natively.",
    },
    // A function prop was never meant to be live-editable (guidelines/
    // 07-storybook-and-documentation-standards.md §5) — set explicitly
    // rather than relying on inference, same guard every other reviewed
    // component's own onClick needed.
    onClick: { control: false },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead of aria-label.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four (Button, IconButton, ProgressBar, Checkbox…).
    id: { control: false, description: "Standard DOM id." },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    // `data-testid` isn't redeclared on `CloseButtonProps` yet (finding #7
    // — Storybook's argTypes are typed against the component's own props,
    // so an undeclared-but-inherited native prop can't be given an
    // explicit argType entry until then). It still works at runtime via
    // native passthrough; add this back once #7 lands.
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set boolean" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md
  // §5).
  args: {
    size: "md",
    "aria-label": "Close",
    type: "button",
    disabled: false,
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof CloseButton>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <CloseButton key={size} size={size} aria-label={`Close (${size})`} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
