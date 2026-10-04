import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../../atoms/Input";
import { send } from "../CodeBlock/browserProtocol";
import { FormField } from "../FormField";
import { FieldGroup } from "./FieldGroup";
import { fieldGroupPlaygroundSnippet, fieldGroupSnippets } from "./FieldGroup.snippets";

const meta: Meta<typeof FieldGroup> = {
  title: "Molecules/Inputs/FieldGroup",
  component: FieldGroup,
  parameters: { layout: "padded" },
  // Keys follow the component's own `FieldGroupProps` declaration order (07 §4 item 3).
  argTypes: {
    legend: {
      control: "text",
      description:
        "The group's visible name, rendered as the legend of a native fieldset — the accessible name of the group.",
    },
    children: {
      control: false,
      description: "The fields in the group — usually FormFields.",
    },
    description: {
      control: "text",
      description: "Supplementary text under the legend, described to assistive tech through the group's aria-describedby.",
    },
    error: {
      control: "text",
      description: "An error about the group as a whole, shown below the fields. Its presence marks the group invalid.",
    },
    hideLegend: {
      description: "Keeps the legend for assistive tech and removes it from the page.",
      table: { defaultValue: { summary: "false" } },
    },
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description: "How the group draws itself: no box, a border, or a tinted fill.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size of the legend, and the default size of every FormField inside.",
      table: { defaultValue: { summary: '"md"' } },
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description:
        "Stack the fields, or put them side by side and wrap the next onto its own line when a field would be too narrow. Takes a breakpoint map.",
      table: { defaultValue: { summary: '"vertical"' } },
    },
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description: "The space between fields, as a step on the spacing scale.",
      table: { defaultValue: { summary: "4" } },
    },
    disabled: {
      description: "Disables the whole group: native controls through the fieldset, every FormField inside, and nested groups.",
      table: { defaultValue: { summary: "false" } },
    },
    id: { control: false, description: "Overrides the auto-generated base id used for the description's and error's own ids." },
    className: { control: false, description: "Additional CSS classes for the fieldset." },
    style: { control: false, description: "Inline styles for the fieldset." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
    "aria-describedby": {
      control: false,
      description: "Extra ids of elements that also describe the group, joined to the description's and error's own.",
    },
  },
  // Every controllable prop gets an explicit value, matching its real default (07 §5).
  args: {
    legend: "Shipping address",
    description: "",
    error: "",
    hideLegend: false,
    variant: "ghost",
    size: "md",
    orientation: "vertical",
    gap: 4,
    disabled: false,
  },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args}>
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        <FormField label="City">{(field) => <Input {...field} />}</FormField>
        <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof FieldGroup>;

const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", maxWidth: "40rem" } as const;
const two = (
  <>
    <FormField label="Email">{(field) => <Input {...field} type="email" />}</FormField>
    <FormField label="Phone">{(field) => <Input {...field} type="tel" />}</FormField>
  </>
);

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => fieldGroupPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  parameters: { docs: { source: { code: fieldGroupSnippets.variants } } },
  argTypes: { variant: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <FieldGroup key={variant} {...args} legend={`Shipping address (${variant})`} variant={variant}>
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup>
      ))}
    </div>
  ),
};

export const Horizontal: Story = {
  name: "Side by side",
  parameters: { docs: { source: { code: fieldGroupSnippets.horizontal } } },
  argTypes: { orientation: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "48rem" }}>
      <FieldGroup {...args} legend="Date of birth" orientation="horizontal">
        <FormField label="Day">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
        <FormField label="Month">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
        <FormField label="Year">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export const States: Story = {
  parameters: { a11y: { test: "todo" }, docs: { source: { code: fieldGroupSnippets.states } } },
  argTypes: { legend: { control: false }, description: { control: false }, error: { control: false }, disabled: { control: false } },
  render: (args) => (
    <div style={column}>
      <FieldGroup
        {...args}
        legend="Contact"
        description="We only use this to confirm your order."
        error="Give us an email address or a phone number."
      >
        {two}
      </FieldGroup>
      <FieldGroup {...args} legend="Contact (disabled)" description="We only use this to confirm your order." disabled>
        {two}
      </FieldGroup>
    </div>
  ),
};

export const HiddenLegend: Story = {
  name: "Legend hidden from view",
  parameters: { docs: { source: { code: fieldGroupSnippets.hiddenLegend } } },
  argTypes: { hideLegend: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Search filters" hideLegend orientation="horizontal">
        <FormField label="Keyword">{(field) => <Input {...field} />}</FormField>
        <FormField label="Location">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export const Nested: Story = {
  parameters: { docs: { source: { code: fieldGroupSnippets.nested } } },
  argTypes: { legend: { control: false }, variant: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Billing details" variant="outlined">
        <FieldGroup legend="Address">
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup>
        <FieldGroup legend="Contact">
          <FormField label="Email">{(field) => <Input {...field} type="email" />}</FormField>
        </FieldGroup>
      </FieldGroup>
    </div>
  ),
};

export const SizeCascade: Story = {
  name: "Size reaches the fields",
  parameters: { docs: { source: { code: fieldGroupSnippets.size } } },
  argTypes: { legend: { control: false }, size: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Large group" size="lg">
        <FormField label="Inherits lg">{(field) => <Input {...field} size="lg" />}</FormField>
        <FormField label="Own size: sm" size="sm">{(field) => <Input {...field} size="sm" />}</FormField>
      </FieldGroup>
    </div>
  ),
};

// --- Hidden tests (real browser; kept out of the sidebar and the Docs page) -------------------------------

const noControls = {
  legend: { control: false },
  description: { control: false },
  error: { control: false },
  hideLegend: { control: false },
  variant: { control: false },
  size: { control: false },
  orientation: { control: false },
  gap: { control: false },
  disabled: { control: false },
} as const;

export const LegendLayoutInteraction: Story = {
  name: "Legend sits inside the box, above the description and fields — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <FieldGroup key={variant} legend={`Group ${variant}`} description="A description" variant={variant} data-testid={variant}>
          {two}
        </FieldGroup>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of ["ghost", "outlined", "filled"]) {
      const group = within(canvasElement).getByTestId(variant);
      const box = group.getBoundingClientRect();
      const style = getComputedStyle(group);
      const legend = group.querySelector("legend")!.getBoundingClientRect();
      const description = group.querySelector("p")!.getBoundingClientRect();
      const firstField = group.querySelector("input")!.getBoundingClientRect();
      // Inside the border and padding, not straddling the top edge.
      await expect(legend.top).toBeGreaterThanOrEqual(box.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) - 0.5);
      await expect(legend.width).toBeGreaterThan(box.width / 2);
      await expect(description.top).toBeGreaterThanOrEqual(legend.bottom - 0.5);
      await expect(firstField.top).toBeGreaterThan(description.bottom);
      // The fields take the group's whole width (the body once collapsed to zero beside the floated legend).
      await expect(firstField.width).toBeGreaterThan((box.width - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd)) * 0.9);
    }
  },
};

export const HorizontalWrapInteraction: Story = {
  name: "Horizontal fields sit in a row, then wrap when the group gets narrow — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="frame" style={{ width: "48rem" }}>
      <FieldGroup legend="Date of birth" orientation="horizontal">
        <FormField label="Day">{(field) => <Input {...field} />}</FormField>
        <FormField label="Month">{(field) => <Input {...field} />}</FormField>
        <FormField label="Year">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    const tops = () => [...frame.querySelectorAll("input")].map((input) => Math.round(input.getBoundingClientRect().top));
    await waitFor(() => expect(new Set(tops()).size).toBe(1));
    frame.style.width = "20rem";
    await waitFor(() => expect(new Set(tops()).size).toBe(3));
    const fieldBoxes = [...frame.querySelectorAll("fieldset > div > div")];
    // Wrapped fields fill the narrow group rather than keeping their share of a row.
    await expect(fieldBoxes).toHaveLength(3);
    await expect(Math.round(fieldBoxes[0]!.getBoundingClientRect().width)).toBe(Math.round(frame.getBoundingClientRect().width));
  },
};

export const DisabledInteraction: Story = {
  name: "A disabled group stops typing in every field, and Tab skips them — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Contact" disabled>
      {two}
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const email = within(canvasElement).getByRole("textbox", { name: "Email" });
    await userEvent.click(email);
    await userEvent.keyboard("hello");
    await expect(email).toHaveValue("");
    await expect(email).toBeDisabled();
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement) && document.activeElement !== document.body).toBe(false);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left: the legend and the error accent start on the right — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div dir="rtl" data-testid="rtl" style={{ maxWidth: "30rem" }}>
      <FieldGroup legend="Contact" error="Required" variant="ghost">
        {two}
      </FieldGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rtl");
    const group = root.querySelector("fieldset")!;
    const legend = group.querySelector("legend")!.getBoundingClientRect();
    const box = group.getBoundingClientRect();
    // Accent border and the legend's text both sit at the right-hand edge.
    await expect(getComputedStyle(group).borderRightWidth).not.toBe("0px");
    await expect(getComputedStyle(group).borderLeftWidth).toBe("0px");
    await expect(box.right - legend.right).toBeLessThan(box.width / 2);
  },
};

export const ForcedColorsInteraction: Story = {
  name: "Forced colours: the filled box keeps an edge — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Contact" variant="filled" data-testid="filled">
      {two}
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const group = within(canvasElement).getByTestId("filled");
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(getComputedStyle(group).borderTopStyle).toBe("solid");
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.appendChild(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      await expect(getComputedStyle(group).borderTopColor).toBe(canvasText);
    } finally {
      await emulate("none");
    }
  },
};
