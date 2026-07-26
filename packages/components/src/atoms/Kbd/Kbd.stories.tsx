import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Kbd } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Atoms/Typography/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
  args: {
    children: "Esc",
  },
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Default: Story = {};

export const Chord: Story = {
  name: "A keyboard chord",
  render: () => (
    <Text as="span">
      <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette
    </Text>
  ),
};
