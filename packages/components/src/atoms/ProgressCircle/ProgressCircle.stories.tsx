import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressCircle } from "./ProgressCircle";

const meta: Meta<typeof ProgressCircle> = {
  title: "Atoms/Feedback/ProgressCircle",
  component: ProgressCircle,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    tone: {
      control: "select",
      options: ["brand", "info", "success", "warning", "danger"],
    },
    value: { control: { type: "range", min: 0, max: 100 } },
  },
  args: {
    value: 65,
    label: "Uploading file.zip",
  },
};

export default meta;

type Story = StoryObj<typeof ProgressCircle>;

export const Default: Story = {};

export const WithValueLabel: Story = {
  name: "With value label",
  args: { showValueLabel: true },
};

export const Indeterminate: Story = {
  args: { value: undefined, label: "Loading" },
};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["brand", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <ProgressCircle key={tone} value={70} tone={tone} label={tone} />
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ProgressCircle
          key={size}
          value={70}
          size={size}
          label={`Size ${size}`}
        />
      ))}
    </div>
  ),
};
