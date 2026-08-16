import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldHelperText } from "./FieldHelperText";

const meta: Meta<typeof FieldHelperText> = {
  title: "Atoms/Inputs/FieldHelperText",
  component: FieldHelperText,
  parameters: { layout: "padded" },
  args: {
    children: "At least 8 characters, including a number",
  },
};

export default meta;

type Story = StoryObj<typeof FieldHelperText>;

export const Default: Story = {};

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
