import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";

const meta: Meta<typeof Container> = {
  title: "Atoms/Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "full"],
    },
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
        <Container
          key={size}
          size={size}
          style={{ marginBlockEnd: "var(--dbm-space-4)" }}
        >
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
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  args: { size: "xl" },
  render: (args) => <Container {...args}>{demoContent}</Container>,
};

export const ResponsivePadding: Story = {
  name: "Responsive paddingInline (tight on mobile, roomy from lg up)",
  // `parameters.chromatic` removed (2026-08-29) — see NarrowViewport above,
  // same file, for why.
  render: () => (
    <Container size="xl" paddingInline={{ base: 2, lg: 8 }}>
      {demoContent}
    </Container>
  ),
};

export const AsMain: Story = {
  name: 'Polymorphic: as="main" (real landmark element, Container layout behavior)',
  render: () => (
    <Container as="main" size="lg">
      {demoContent}
    </Container>
  ),
};
