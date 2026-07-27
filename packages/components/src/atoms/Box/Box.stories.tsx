import type { Meta, StoryObj } from "@storybook/react-vite";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  title: "Atoms/Layout/Box",
  component: Box,
  // No `tags: ["autodocs"]` — Box.mdx is a hand-authored Docs page (see
  // guidelines/07-storybook-and-documentation-standards.md §4) that embeds
  // this file's stories via `<Meta of={BoxStories} />`; autodocs would
  // generate a second, competing, auto-generated Docs entry alongside it.
  parameters: { layout: "padded" },
  argTypes: {
    as: {
      control: "select",
      options: ["div", "span", "section", "article", "aside", "header", "footer", "nav", "main"],
      description: "The HTML element (or component) to render as.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    children: { control: "text" },
    style: {
      description:
        "Inline styles — the primary way to visually style a Box, since it has no CSS module of its own. Should still reference semantic tokens (`var(--dbm-*)`), not raw values.",
    },
  },
  args: {
    as: "div",
    children: "A Box, rendered as a div.",
    style: {
      background: "var(--dbm-bg-brand-subtle)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-primary)",
      padding: "var(--dbm-space-4)",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Box>;

/**
 * Drive every prop live — switch `as` to see the rendered tag change in the
 * DOM (inspect via your browser devtools) while the component itself never
 * re-renders its own markup, only the underlying element.
 */
export const Playground: Story = {};

export const AsSection: Story = {
  name: 'Polymorphic: as="section"',
  args: { as: "section", children: 'Rendered as a <section> element via the `as` prop.' },
};

export const AsButton: Story = {
  name: 'Polymorphic: as="button" (native button props type-check)',
  render: () => (
    <Box
      as="button"
      type="button"
      style={{
        background: "var(--dbm-bg-brand-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-primary)",
        padding: "var(--dbm-space-4)",
        border: "none",
        cursor: "pointer",
      }}
    >
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
    <Box
      as={CustomLabel}
      label="Status"
      style={{
        background: "var(--dbm-bg-brand-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-primary)",
        padding: "var(--dbm-space-4)",
      }}
    >
      Rendered via a custom React component passed to `as` — not just an intrinsic HTML tag.
    </Box>
  ),
};

/**
 * Verifies the polymorphic `as` prop produces a genuinely interactive,
 * clickable, keyboard-focusable native `<button>` — not just a styled
 * `<div>` — since that's the entire point of `as` over a fixed element.
 */
export const ClickableAsButton: Story = {
  name: "Interaction: clickable when as=\"button\"",
  args: {
    as: "button",
    onClick: fn(),
    children: "Click me",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.tab();
    button.focus();
    await expect(button).toHaveFocus();
  },
};
