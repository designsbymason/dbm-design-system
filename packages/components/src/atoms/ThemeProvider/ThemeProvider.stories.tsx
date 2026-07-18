import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "./ThemeProvider";

// ThemeProvider is a non-visual, document-wide utility (no layout/breakpoint
// behavior of its own), so viewport-width variation isn't a meaningful axis
// for its stories the way it is for layout/typography/atom components later
// in this phase — its own definition of done is brand x mode coverage.
const Demo = () => (
  <div
    style={{
      background: "var(--dbm-bg-surface)",
      border: "1px solid var(--dbm-border-default)",
      borderRadius: "var(--dbm-radius-md)",
      color: "var(--dbm-text-primary)",
      padding: "var(--dbm-space-4)",
    }}
  >
    <p style={{ margin: 0 }}>
      This surface, its border, and this text all trace to semantic tokens that flip with the
      active theme.
    </p>
  </div>
);

const meta: Meta<typeof ThemeProvider> = {
  title: "Atoms/Utility/ThemeProvider",
  component: ThemeProvider,
  parameters: { layout: "padded" },
  args: {
    children: <Demo />,
  },
};

export default meta;

type Story = StoryObj<typeof ThemeProvider>;

export const PurpleLight: Story = {
  args: { brand: "purple", mode: "light" },
};

export const PurpleDark: Story = {
  args: { brand: "purple", mode: "dark" },
};

export const EmeraldLight: Story = {
  args: { brand: "emerald", mode: "light" },
};

export const EmeraldDark: Story = {
  args: { brand: "emerald", mode: "dark" },
};

export const SystemMode: Story = {
  name: "System mode (follows OS preference)",
  args: { brand: "purple", mode: "system" },
};
