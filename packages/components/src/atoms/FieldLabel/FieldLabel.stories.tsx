import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldLabel } from "./FieldLabel";

const meta: Meta<typeof FieldLabel> = {
  title: "Atoms/Inputs/FieldLabel",
  component: FieldLabel,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    htmlFor: "email",
    children: "Email address",
  },
};

export default meta;

type Story = StoryObj<typeof FieldLabel>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const Disabled: Story = {
  args: { disabled: true },
  // Known finding (2026-08-16, adding @storybook/addon-vitest): text.disabled
  // measures 2.32:1 against bg.surface, below the 4.5:1 AA text floor — but
  // this is the already-decided, WCAG-exempt disabled-state pairing
  // computed in 03-token-system-spec.md's Phase 17 (WCAG 2.1 excludes
  // inactive/disabled UI components from 1.4.3), not a new defect. axe has
  // no way to know that on its own. Deferred to this component's own
  // future review pass rather than annotated permanently here — see
  // guidelines/01-vision-and-goals.md §12.
  parameters: { a11y: { test: "todo" } },
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <FieldLabel key={size} htmlFor={`field-${size}`} size={size}>
          Size {size}
        </FieldLabel>
      ))}
    </div>
  ),
};
