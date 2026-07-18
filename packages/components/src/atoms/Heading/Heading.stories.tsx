import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Atoms/Typography/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  argTypes: {
    level: { control: "select", options: [1, 2, 3, 4, 5, 6] },
    size: {
      control: "select",
      options: ["md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
    },
    weight: { control: "select", options: ["regular", "medium", "semibold", "bold"] },
  },
  args: {
    children: "The quick brown fox",
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: { level: 2 },
};

export const AllLevels: Story = {
  name: "All levels (h1-h6, matched default sizes)",
  render: () => (
    <>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </>
  ),
};

export const SizeIndependentOfLevel: Story = {
  name: "Size set independently of level",
  render: () => (
    <Heading level={2} size="xl">
      Semantic h2, visually smaller (size=&quot;xl&quot;)
    </Heading>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (large heading wraps, never overflows)",
  parameters: { chromatic: { viewports: [375] } },
  args: {
    level: 1,
    children: "A longer heading that should wrap gracefully on narrow screens",
  },
};
