import { MagnifyingGlassIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../Icon";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Core/Input",
  component: Input,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    placeholder: "Enter text",
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "20rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Input key={size} size={size} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const WithPrefixIcon: Story = {
  name: "With prefix icon",
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Input prefix={<Icon icon={MagnifyingGlassIcon} size="sm" />} placeholder="Search" />
    </div>
  ),
};

export const WithSuffix: Story = {
  name: "With suffix text",
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Input suffix="@example.com" placeholder="username" />
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error state",
  args: { hasError: true, placeholder: "Email", defaultValue: "not-an-email" },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled" },
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (fills container width)",
  parameters: { chromatic: { viewports: [375] } },
  render: () => (
    <div style={{ width: "100%" }}>
      <Input placeholder="Full width on narrow screens" />
    </div>
  ),
};
