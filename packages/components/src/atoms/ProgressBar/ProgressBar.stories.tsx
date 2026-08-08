import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Atoms/Feedback/ProgressBar",
  component: ProgressBar,
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
    value: 40,
    label: "Uploading file.zip",
  },
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: undefined, label: "Loading" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "24rem",
      }}
    >
      {(["brand", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <ProgressBar key={tone} value={60} tone={tone} label={tone} />
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "24rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ProgressBar key={size} value={60} size={size} label={`Size ${size}`} />
      ))}
    </div>
  ),
};
