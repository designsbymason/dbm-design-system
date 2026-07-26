import type { Meta, StoryObj } from "@storybook/react-vite";
import { Blockquote } from "./Blockquote";

const meta: Meta<typeof Blockquote> = {
  title: "Atoms/Typography/Blockquote",
  component: Blockquote,
  parameters: { layout: "padded" },
  args: {
    children:
      "Design is not just what it looks like and feels like. Design is how it works.",
  },
};

export default meta;

type Story = StoryObj<typeof Blockquote>;

export const Default: Story = {};

export const WithAttribution: Story = {
  name: "With attribution",
  args: {
    attribution: "Steve Jobs",
    cite: "https://en.wikiquote.org/wiki/Steve_Jobs",
  },
};
