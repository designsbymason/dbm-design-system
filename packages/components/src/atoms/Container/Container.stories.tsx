import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";

const meta: Meta<typeof Container> = {
  title: "Atoms/Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl", "2xl", "3xl", "full"] },
  },
};

export default meta;

type Story = StoryObj<typeof Container>;

const demoContent = (
  <div
    style={{
      background: "var(--dbm-bg-brand-subtle)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-primary)",
      padding: "var(--dbm-space-4)",
    }}
  >
    This content is centered and constrained by the Container&apos;s `size`.
  </div>
);

export const Default: Story = {
  args: { size: "xl" },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};

export const AllSizes: Story = {
  name: "All sizes stacked",
  render: () => (
    <>
      {(["sm", "md", "lg", "xl", "2xl", "3xl", "full"] as const).map((size) => (
        <Container key={size} size={size} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
          <div
            style={{
              background: "var(--dbm-bg-brand-subtle)",
              borderRadius: "var(--dbm-radius-md)",
              color: "var(--dbm-text-primary)",
              padding: "var(--dbm-space-3)",
            }}
          >
            size=&quot;{size}&quot;
          </div>
        </Container>
      ))}
    </>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (padding never disappears)",
  parameters: { chromatic: { viewports: [375] } },
  args: { size: "xl" },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};
