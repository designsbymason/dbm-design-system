import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Atoms/Feedback/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    tone: {
      control: "select",
      options: ["default", "secondary", "brand", "disabled"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: { tone: "brand" },
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Spinner key={size} size={size} tone="brand" />
      ))}
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      {(["default", "secondary", "brand", "disabled"] as const).map((tone) => (
        <Spinner key={tone} tone={tone} />
      ))}
    </div>
  ),
};

export const Labeled: Story = {
  name: "With an accessible label",
  args: { tone: "brand", label: "Loading" },
};
