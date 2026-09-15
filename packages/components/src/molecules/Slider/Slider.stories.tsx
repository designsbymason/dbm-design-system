import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Molecules/Inputs/Slider",
  component: Slider,
  parameters: { layout: "padded" },
  // Ordered core visual props first, then behavioral/state props, then
  // advanced/escape-hatch props last — same sequencing principle as every
  // other component's own stories file (07-storybook-and-documentation-
  // standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Thumb diameter and track thickness, matching the shared size scale.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the slider as invalid, visually and via aria-invalid.",
    },
    // `control: false` — driving `value` from Controls without a real
    // `onValueChange` wired back would freeze the slider, same reasoning as
    // Switch's own `checked`. The Playground demonstrates the uncontrolled
    // path via `defaultValue` instead.
    value: { control: false, description: "The controlled value, as a real number." },
    defaultValue: {
      control: "number",
      description: "The initial value when uncontrolled. Defaults to min when omitted.",
    },
    onValueChange: {
      control: false,
      description: "Called continuously with the new value while dragging or stepping.",
    },
    onValueCommit: {
      control: false,
      description: "Called once, with the final value, when the user finishes interacting.",
    },
    min: { control: "number", description: "The minimum allowed value." },
    max: { control: "number", description: "The maximum allowed value." },
    step: { control: "number", description: "The increment each arrow-key press changes the value by." },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Lays the slider out horizontally or vertically.",
    },
    inverted: {
      control: "boolean",
      description: "Reverses which end of the track represents the minimum.",
    },
    showValue: {
      control: "boolean",
      description: "Shows the current numeric value as live text next to the slider.",
    },
    showValueTooltip: {
      control: "boolean",
      description: "Shows the current value in a tooltip above the thumb while hovering, dragging, or focused.",
    },
    showMinMaxLabels: {
      control: "boolean",
      description: "Shows min and max as text labels at each end of the track.",
    },
    showTicks: {
      control: "boolean",
      description: "Shows a small tick mark at every tickInterval between min and max.",
    },
    tickInterval: {
      control: "number",
      description: "The spacing between tick marks, in the same units as value. Only meaningful when showTicks is set.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the slider natively.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the slider's thumb automatically on mount. Use sparingly.",
    },
    name: {
      control: "text",
      description:
        "Form field name — when set inside a real <form>, Radix renders a hidden native input for real form submission.",
    },
    // `control: false` — only meaningful paired with a real <form> whose id
    // it points to, which the Playground's own plain demo doesn't have.
    form: {
      control: false,
      description: "Associates the slider with a <form> by id.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech when there's no visible label (e.g. no paired FieldLabel).",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    "aria-describedby": {
      control: false,
      description:
        "Points to the id of a helper or error message associated with this slider.",
    },
    "aria-valuetext": {
      control: "text",
      description: "A human-readable alternative to the raw numeric value announced by assistive tech.",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the slider's own root element.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization. Applies to the slider control itself.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles. Set an explicit height here for orientation=\"vertical\".",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    size: "md",
    hasError: false,
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    orientation: "horizontal",
    inverted: false,
    showValue: false,
    showValueTooltip: false,
    showMinMaxLabels: false,
    showTicks: false,
    tickInterval: 10,
    disabled: false,
    name: "",
    "aria-label": "Volume",
    "aria-valuetext": "",
    onValueChange: fn(),
    onValueCommit: fn(),
  },
  render: (args) => (
    <div style={{ maxWidth: "16rem" }}>
      <Slider {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Slider>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  // `size` is the whole point of this grid — each instance intentionally
  // varies it, so no single control value could represent them.
  // `hasError`/`disabled` still stay live and shared via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-5)",
        maxWidth: "16rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Slider key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ height: "12rem" }}>
      <Slider {...args} style={{ height: "100%" }} />
    </div>
  ),
};

export const WithValue: Story = {
  name: "With the live value shown",
  args: { showValue: true },
  argTypes: { showValue: { control: false } },
};

export const WithValueTooltip: Story = {
  name: "With a value tooltip",
  args: { showValueTooltip: true },
  argTypes: { showValueTooltip: { control: false } },
};

export const WithMinMaxLabels: Story = {
  name: "With min/max labels",
  args: { showMinMaxLabels: true },
  argTypes: { showMinMaxLabels: { control: false } },
};

export const WithTicks: Story = {
  name: "With tick marks",
  args: { showTicks: true, tickInterval: 10 },
  argTypes: { showTicks: { control: false }, tickInterval: { control: false } },
};

export const FullyDecorated: Story = {
  name: "Every decoration combined",
  args: {
    showValue: true,
    showValueTooltip: true,
    showMinMaxLabels: true,
    showTicks: true,
    tickInterval: 25,
  },
  argTypes: {
    showValue: { control: false },
    showValueTooltip: { control: false },
    showMinMaxLabels: { control: false },
    showTicks: { control: false },
    tickInterval: { control: false },
  },
};

export const VerticalWithMinMaxLabels: Story = {
  name: "Vertical, with min/max labels",
  args: { orientation: "vertical", showMinMaxLabels: true },
  argTypes: { orientation: { control: false }, showMinMaxLabels: { control: false } },
  render: (args) => (
    <div style={{ height: "12rem", paddingInlineStart: "var(--dbm-space-6)" }}>
      <Slider {...args} style={{ height: "100%" }} />
    </div>
  ),
};

export const CustomRange: Story = {
  name: "Custom min/max/step",
  args: { min: -10, max: 10, step: 5, defaultValue: 0, showValue: true },
  argTypes: { min: { control: false }, max: { control: false }, step: { control: false } },
};

export const ErrorState: Story = {
  name: "Error state",
  args: { hasError: true, defaultValue: 20 },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 50 },
};

export const Controlled: Story = {
  name: "Controlled, with onValueCommit for an expensive operation",
  // `value`/`onValueChange` are driven by this story's own local state (the
  // whole point of the demo) — but `size`/`hasError`/`disabled` are still
  // meaningful to preview here and stay live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled-conflict fix as every other component's own
  // Controlled/Clearable story — this story sets its own controlled
  // `value` below.
  args: { defaultValue: undefined },
  argTypes: {
    defaultValue: { control: false },
    onValueChange: { control: false },
    onValueCommit: { control: false },
  },
  render: function ControlledStory(args) {
    const [value, setValue] = useState(50);
    const [committedValue, setCommittedValue] = useState(50);
    return (
      <div style={{ maxWidth: "16rem" }}>
        <Slider {...args} value={value} onValueChange={setValue} onValueCommit={setCommittedValue} />
        <p style={{ marginTop: "var(--dbm-space-2)", fontSize: "var(--dbm-font-size-sm)" }}>
          Live: {value} · Committed: {committedValue}
        </p>
      </div>
    );
  },
};

export const KeyboardInteraction: Story = {
  name: "Interaction: arrow keys step, Home/End jump to the extremes",
  args: { defaultValue: 50 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");

    // Purely for human legibility when watching this replay in the
    // Interactions panel — the assertions themselves need none of these
    // pauses (same pattern as NumberInput's/SearchInput's own interaction
    // stories).
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    slider.focus();
    await pause(500);

    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuenow", "51");
    await expect(args.onValueChange).toHaveBeenCalledWith(51);
    await expect(args.onValueCommit).toHaveBeenCalledWith(51);
    await pause(500);

    await userEvent.keyboard("{End}");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    await pause(500);

    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await pause(600);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks keyboard input",
  args: { disabled: true, defaultValue: 50 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await pause(500);
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(slider).toHaveAttribute("aria-valuenow", "50");
    await pause(800);
  },
};
