import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Code } from "./Code";

const meta: Meta<typeof Code> = {
  title: "Atoms/Typography/Code",
  component: Code,
  parameters: { layout: "padded" },
  args: {
    children: "pnpm install",
  },
};

export default meta;

type Story = StoryObj<typeof Code>;

export const Default: Story = {};

export const WithinText: Story = {
  name: "Within body text",
  render: () => (
    <Text>
      Run <Code>pnpm install</Code> to install dependencies, then{" "}
      <Code>pnpm dev</Code> to start the dev server.
    </Text>
  ),
};

export const InheritsSurroundingSize: Story = {
  name: "Inherits surrounding font size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      <Text size="sm">
        Small text with <Code>inline code</Code>
      </Text>
      <Text size="lg">
        Large text with <Code>inline code</Code>
      </Text>
    </div>
  ),
};
