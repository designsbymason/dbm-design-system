import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";

const DemoOptions = () => (
  <>
    <Select.Option value="primary">Primary</Select.Option>
    <Select.Option value="secondary">Secondary</Select.Option>
    <Select.Option value="tertiary">Tertiary</Select.Option>
    <Select.Option value="ghost">Ghost</Select.Option>
    <Select.Option value="destructive">Destructive</Select.Option>
  </>
);

const meta: Meta<typeof Select> = {
  title: "Molecules/Inputs/Select",
  component: Select,
  parameters: { layout: "padded" },
  // Ordered to match SelectProps' own declaration order (value,
  // defaultValue, onValueChange, placeholder, size, hasError, name,
  // required, open, defaultOpen, onOpenChange, dir, form, autoComplete,
  // side, align, asChild, trigger, id, className, style, data-testid,
  // aria-label, aria-labelledby, aria-describedby, children) — same
  // sequencing principle the Properties table uses
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    // `control: false` — driving `value` from Controls without a real
    // `onValueChange` wired back into `args` would freeze the select,
    // since a controlled value always wins over the user's own selection
    // (same reasoning as Input's own `value` argType). The Playground
    // demonstrates the uncontrolled path via `defaultValue` instead; the
    // dedicated `Controlled` story below demonstrates the real controlled
    // pattern with its own local state.
    value: {
      control: false,
      description: "The controlled selected value.",
    },
    defaultValue: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The initial selected value when uncontrolled.",
    },
    onValueChange: {
      control: false,
      description: "Called with the new value whenever the selection changes.",
    },
    placeholder: {
      control: "text",
      description:
        "Shown in the trigger when nothing is selected. No effect when asChild is set.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Visual size of the trigger.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the select as invalid, visually and via aria-invalid.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the select entirely.",
    },
    name: {
      control: "text",
      description: "Name submitted with the enclosing form.",
    },
    required: {
      control: "boolean",
      description: "Marks the field as required for native form validation.",
    },
    // `control: false` — same reasoning as `value` above: driving the
    // controlled `open` state without a real `onOpenChange` wired back
    // would freeze the dropdown open or closed. `defaultOpen` demonstrates
    // the uncontrolled path instead.
    open: {
      control: false,
      description: "The controlled open state of the dropdown.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state when uncontrolled.",
    },
    onOpenChange: {
      control: false,
      description: "Called whenever the dropdown opens or closes.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, passed through to Radix Select.",
    },
    form: {
      control: "text",
      description: "Associates the field with a <form> by id, for use outside one.",
    },
    autoComplete: {
      control: "text",
      description: "Native autocomplete hint, passed through to Radix Select.",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Which side of the trigger the dropdown opens on.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side.",
    },
    // `control: false` for both — `trigger` needs a real `ReactElement`, not
    // something a Storybook control can produce, and `asChild` alone
    // (without a matching `trigger`) would just show the dev-mode warning
    // and nothing else. See the dedicated `CustomTrigger` story below.
    asChild: {
      control: false,
      description: "Renders the trigger as a single provided element (Radix Slot).",
    },
    trigger: {
      control: false,
      description: "The custom trigger element used when asChild is set.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Auto-generated via useId when omitted — pass your own when another element's aria-labelledby/aria-describedby needs to point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
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
    "aria-label": {
      control: "text",
      description:
        "Accessible name — required unless a visible label is associated via aria-labelledby or a native label/id pair.",
    },
    "aria-labelledby": {
      control: false,
      description: "References the id of an element that labels this select.",
    },
    "aria-describedby": {
      control: false,
      description: "References the id of an element that describes this select.",
    },
    children: {
      control: false,
      description: "<Select.Option> elements.",
    },
  },
  // Every controllable prop gets an explicit value matching its real
  // component default where one exists (size='md', hasError=false,
  // disabled=false, side='bottom', align='start' — all real defaults per
  // SelectProps). `defaultValue`/`placeholder` have no true default
  // (genuinely unset shows the placeholder) and stay unset/a sensible demo
  // value respectively, per 06-engineering-standards.md §9.
  args: {
    "aria-label": "Variant",
    placeholder: "Choose a variant",
    size: "md",
    hasError: false,
    disabled: false,
    required: false,
    defaultOpen: false,
    side: "bottom",
    align: "start",
  },
  render: (args) => (
    <Select {...args}>
      <DemoOptions />
    </Select>
  ),
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  name: "Playground",
};

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <DemoOptions />
    </Select>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  // `size` is the deliberate varying axis (one instance per size, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception).
  // Every other prop stays live, shared across all five instances.
  argTypes: { size: { control: false } },
  args: { defaultValue: "md" },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Select key={size} {...args} aria-label={`Size ${size}`} size={size}>
          <Select.Option value="sm">Small</Select.Option>
          <Select.Option value="md">Medium</Select.Option>
          <Select.Option value="lg">Large</Select.Option>
        </Select>
      ))}
    </div>
  ),
};

export const States: Story = {
  // `hasError`/`disabled` are the deliberate varying axes here (each of
  // the four instances demonstrates a different fixed combination) — same
  // multi-instance-gallery exception as `AllSizes` above. Every other prop
  // (size, placeholder, etc.) stays live, shared across all four.
  argTypes: { hasError: { control: false }, disabled: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Select {...args} aria-label="Empty">
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Filled" defaultValue="primary" placeholder={undefined}>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Disabled" disabled>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select {...args} aria-label="Error state" hasError>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
    </div>
  ),
};

export const DisabledOption: Story = {
  name: "Disabled option",
  render: (args) => (
    <Select {...args}>
      <Select.Option value="primary">Primary</Select.Option>
      <Select.Option value="secondary" disabled>
        Secondary (unavailable)
      </Select.Option>
      <Select.Option value="tertiary">Tertiary</Select.Option>
    </Select>
  ),
};

export const LongList: Story = {
  name: "Long list (scroll buttons)",
  args: { "aria-label": "Country", placeholder: "Choose a country" },
  render: (args) => (
    <Select {...args}>
      {[
        "Argentina", "Australia", "Belgium", "Brazil", "Canada", "Chile",
        "Denmark", "Egypt", "Finland", "France", "Germany", "Greece",
        "India", "Indonesia", "Ireland", "Italy", "Japan", "Kenya",
        "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway",
        "Poland", "Portugal", "Spain", "Sweden", "Switzerland",
        "United Kingdom", "United States",
      ].map((country) => (
        <Select.Option key={country} value={country}>
          {country}
        </Select.Option>
      ))}
    </Select>
  ),
};

export const SideAndAlign: Story = {
  name: "side/align (dropdown placement)",
  args: { side: "right", align: "start" },
  render: (args) => (
    <div style={{ paddingBlock: "var(--dbm-space-16)" }}>
      <Select {...args}>
        <DemoOptions />
      </Select>
    </div>
  ),
};

export const CustomTrigger: Story = {
  name: 'asChild + trigger (custom trigger element)',
  // `asChild`/`trigger` stay disabled at the meta level (no Storybook
  // control can produce a real `ReactElement`) — this story demonstrates
  // them with a real, hardcoded custom trigger instead. Every other
  // Select-level prop still applies via Radix's own prop-merging onto the
  // custom element (confirmed live: size/hasError's own classes still
  // apply), except `placeholder` (see that argType's own comment).
  argTypes: { placeholder: { control: false } },
  args: { placeholder: undefined },
  render: (args) => (
    <Select
      {...args}
      asChild
      trigger={
        <button type="button" style={{ font: "inherit" }}>
          Open the custom trigger ▾
        </button>
      }
    >
      <DemoOptions />
    </Select>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Select
          aria-label="Variant"
          placeholder="Choose a variant"
          value={value}
          onValueChange={setValue}
        >
          <Select.Option value="primary">Primary</Select.Option>
          <Select.Option value="secondary">Secondary</Select.Option>
        </Select>
        <span style={{ color: "var(--dbm-text-secondary)", fontSize: "var(--dbm-font-size-sm)" }}>
          Selected: {value ?? "none"}
        </span>
      </div>
    );
  },
};
