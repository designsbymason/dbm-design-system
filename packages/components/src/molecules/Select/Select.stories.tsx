import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Molecules/Inputs/Select",
  component: Select,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    "aria-label": "Variant",
    placeholder: "Choose a variant",
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <Select.Option value="primary">Primary</Select.Option>
      <Select.Option value="secondary">Secondary</Select.Option>
      <Select.Option value="tertiary">Tertiary</Select.Option>
      <Select.Option value="ghost">Ghost</Select.Option>
      <Select.Option value="destructive">Destructive</Select.Option>
    </Select>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Select key={size} aria-label={`Size ${size}`} size={size} defaultValue="md">
          <Select.Option value="sm">Small</Select.Option>
          <Select.Option value="md">Medium</Select.Option>
          <Select.Option value="lg">Large</Select.Option>
        </Select>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Select aria-label="Empty" placeholder="Choose a variant">
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select aria-label="Filled" defaultValue="primary">
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select aria-label="Disabled" placeholder="Choose a variant" disabled>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
      <Select aria-label="Error state" placeholder="Choose a variant" hasError>
        <Select.Option value="primary">Primary</Select.Option>
      </Select>
    </div>
  ),
};

export const DisabledOption: Story = {
  name: "Disabled option",
  render: () => (
    <Select aria-label="Variant" placeholder="Choose a variant">
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
  render: () => (
    <Select aria-label="Country" placeholder="Choose a country">
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
