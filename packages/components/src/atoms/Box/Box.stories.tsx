import type { Meta, StoryObj } from "@storybook/react-vite";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  title: "Atoms/Layout/Box",
  component: Box,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Box>;

const demoStyle = {
  background: "var(--dbm-bg-brand-subtle)",
  borderRadius: "var(--dbm-radius-md)",
  color: "var(--dbm-text-primary)",
  padding: "var(--dbm-space-4)",
};

export const Default: Story = {
  render: () => <Box style={demoStyle}>A plain Box, rendered as a div.</Box>,
};

export const AsSection: Story = {
  name: "Polymorphic: as=\"section\"",
  render: () => (
    <Box as="section" style={demoStyle}>
      Rendered as a &lt;section&gt; element via the `as` prop.
    </Box>
  ),
};

export const AsButton: Story = {
  name: "Polymorphic: as=\"button\" (native button props type-check)",
  render: () => (
    <Box as="button" type="button" style={{ ...demoStyle, border: "none", cursor: "pointer" }}>
      Rendered as a &lt;button&gt; — `type=&quot;button&quot;` is a real, type-checked native
      prop.
    </Box>
  ),
};

interface CustomLabelProps extends ComponentPropsWithoutRef<"span"> {
  label: string;
}

const CustomLabel = forwardRef<HTMLSpanElement, CustomLabelProps>(
  ({ label, children, ...props }, ref) => (
    <span ref={ref} {...props}>
      <strong>{label}: </strong>
      {children}
    </span>
  ),
);
CustomLabel.displayName = "CustomLabel";

export const AsCustomComponent: Story = {
  name: "Polymorphic: as={CustomComponent} (renders another React component, not just a tag)",
  render: () => (
    <Box as={CustomLabel} label="Status" style={demoStyle}>
      Rendered via a custom React component passed to `as` — not just an intrinsic HTML tag.
    </Box>
  ),
};

export const Responsive: Story = {
  name: "Rendered at multiple viewport widths",
  parameters: {
    chromatic: { viewports: [375, 768, 1280] },
  },
  render: () => (
    <Box style={{ ...demoStyle, maxWidth: "100%" }}>
      This Box has no responsive behavior of its own (no layout props) — this story exists to
      confirm it never overflows or breaks at narrow widths. Use the viewport toolbar above to
      check 375px, 768px, and 1280px.
    </Box>
  ),
};
