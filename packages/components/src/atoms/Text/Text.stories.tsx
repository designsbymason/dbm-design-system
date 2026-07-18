import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Atoms/Typography/Text",
  component: Text,
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
    },
    weight: { control: "select", options: ["regular", "medium", "semibold", "bold"] },
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "disabled",
        "link",
        "danger",
        "warning",
        "success",
        "info",
      ],
    },
  },
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <>
      {(["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"] as const).map((size) => (
        <Text key={size} size={size}>
          size=&quot;{size}&quot; — The quick brown fox jumps over the lazy dog.
        </Text>
      ))}
    </>
  ),
};

export const AllWeights: Story = {
  name: "All weights",
  render: () => (
    <>
      {(["regular", "medium", "semibold", "bold"] as const).map((weight) => (
        <Text key={weight} weight={weight}>
          weight=&quot;{weight}&quot; — The quick brown fox jumps over the lazy dog.
        </Text>
      ))}
    </>
  ),
};

export const AllColors: Story = {
  name: "All colors",
  render: () => (
    <>
      {(
        [
          "primary",
          "secondary",
          "tertiary",
          "disabled",
          "link",
          "danger",
          "warning",
          "success",
          "info",
        ] as const
      ).map((color) => (
        <Text key={color} color={color}>
          color=&quot;{color}&quot; — The quick brown fox jumps over the lazy dog.
        </Text>
      ))}
    </>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (wraps, never overflows)",
  parameters: { chromatic: { viewports: [375] } },
  args: {
    size: "lg",
    children:
      "This is a longer sentence meant to demonstrate that Text wraps naturally at narrow viewport widths rather than overflowing its container.",
  },
};
