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

export const AllSizes: Story = {
  name: "All sizes (including md and 6xl, not any level's default)",
  render: () => (
    <>
      {(["md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const).map((size) => (
        <Heading key={size} level={2} size={size}>
          size=&quot;{size}&quot;
        </Heading>
      ))}
    </>
  ),
};

export const FontFamily: Story = {
  name: "Font family (secondary/editorial vs primary)",
  render: () => (
    <>
      <Heading level={2} fontFamily="secondary">
        fontFamily=&quot;secondary&quot; (Lora, default) — editorial heading.
      </Heading>
      <Heading level={2} fontFamily="primary">
        fontFamily=&quot;primary&quot; (Nunito) — UI-dense/enterprise heading.
      </Heading>
    </>
  ),
};

export const Truncate: Story = {
  name: "truncate (line-clamp)",
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Heading level={3} truncate={2}>
        A much longer card title than will fit on two lines, so it should be clamped with an
        ellipsis instead of overflowing or wrapping onto a third line.
      </Heading>
    </div>
  ),
};

export const AsCardTitle: Story = {
  name: 'Polymorphic: as="div" (card title, kept out of the page heading outline)',
  render: () => (
    <div
      style={{
        background: "var(--dbm-bg-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <Heading level={3} as="div" size="lg">
        Product card title
      </Heading>
      <p style={{ color: "var(--dbm-text-secondary)", margin: 0 }}>
        Renders as a real page heading (h1) above; this one is a &lt;div&gt; with
        role=&quot;heading&quot; aria-level=&quot;3&quot;, so it&apos;s still announced correctly
        to screen readers without adding another entry to the page&apos;s actual heading outline.
      </p>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (large heading wraps, never overflows)",
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  args: {
    level: 1,
    children: "A longer heading that should wrap gracefully on narrow screens",
  },
};
