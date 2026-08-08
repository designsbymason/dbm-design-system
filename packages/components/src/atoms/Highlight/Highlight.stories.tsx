import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Highlight } from "./Highlight";

const meta: Meta<typeof Highlight> = {
  title: "Atoms/Typography/Highlight",
  component: Highlight,
  parameters: { layout: "padded" },
  args: {
    children: "design",
  },
};

export default meta;

type Story = StoryObj<typeof Highlight>;

export const Default: Story = {};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["warning", "success", "info", "danger"] as const).map((tone) => (
        <Highlight key={tone} tone={tone}>
          {tone}
        </Highlight>
      ))}
    </div>
  ),
};

export const SearchMatch: Story = {
  name: "Search-match emphasis",
  render: () => (
    <Text>
      Showing results for &quot;<Highlight>design</Highlight> system&quot; —
      3 matches found.
    </Text>
  ),
};
