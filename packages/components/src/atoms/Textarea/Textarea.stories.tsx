import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Inputs/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    resize: {
      control: "select",
      options: ["none", "vertical", "horizontal", "both"],
    },
  },
  args: {
    placeholder: "Add a comment…",
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
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
        gap: "0.75rem",
        maxWidth: "24rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Textarea key={size} size={size} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const AutoResize: Story = {
  name: "Auto-resize",
  render: function AutoResizeStory() {
    const [value, setValue] = useState("");
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
          autoResize
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type multiple lines and watch it grow…"
        />
      </div>
    );
  },
};

export const CharacterCount: Story = {
  name: "With character count",
  render: function CharacterCountStory() {
    const [value, setValue] = useState("Getting started…");
    return (
      <div style={{ maxWidth: "24rem" }}>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={140}
          showCount
        />
      </div>
    );
  },
};

export const ErrorState: Story = {
  name: "Error state",
  args: { hasError: true, defaultValue: "" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Can't edit this" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (fills container width)",
  parameters: { chromatic: { viewports: [375] } },
  render: () => (
    <div style={{ width: "100%" }}>
      <Textarea placeholder="Full width on narrow screens" />
    </div>
  ),
};
