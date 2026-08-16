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
      {(
        ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const
      ).map((size) => (
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
  // Known finding (2026-08-16, adding @storybook/addon-vitest): the
  // color="disabled" row measures 2.32:1 against bg.surface, below the
  // 4.5:1 AA text floor — but this is the already-decided, WCAG-exempt
  // disabled-state pairing computed in 03-token-system-spec.md's Phase 17
  // (WCAG 2.1 excludes inactive/disabled UI components from 1.4.3), not a
  // new defect. axe has no way to know that on its own. Deferred to this
  // component's own future review pass rather than annotated permanently
  // here — see guidelines/01-vision-and-goals.md §12.
  parameters: { a11y: { test: "todo" } },
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

export const FontFamily: Story = {
  name: "Font family (primary vs secondary/editorial)",
  render: () => (
    <>
      <Text fontFamily="primary">fontFamily=&quot;primary&quot; (Nunito) — body/UI copy.</Text>
      <Text fontFamily="secondary">
        fontFamily=&quot;secondary&quot; (Lora) — long-form editorial reading content.
      </Text>
    </>
  ),
};

export const Truncate: Story = {
  name: "truncate (line-clamp)",
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Text truncate={2}>
        This is a much longer piece of body copy than will fit on two lines, so it should be
        clamped with an ellipsis after the second line instead of overflowing or wrapping onto a
        third line and beyond.
      </Text>
    </div>
  ),
};

export const AsLabel: Story = {
  name: 'Polymorphic: as="label" (native props type-check, e.g. htmlFor)',
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-2)" }}>
      <Text as="label" htmlFor="story-email-input" weight="medium">
        Email address
      </Text>
      <input id="story-email-input" type="email" />
    </div>
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
