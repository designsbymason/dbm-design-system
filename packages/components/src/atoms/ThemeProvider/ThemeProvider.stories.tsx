import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ThemeProvider } from "./ThemeProvider";
import type { Brand, ColorMode } from "./ThemeProvider.types";
import { useTheme } from "./useTheme";

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

const ResolvedThemeReadout = () => {
  const { brand, mode, resolvedMode } = useTheme();
  return (
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
        <code>useTheme()</code> reports brand=&quot;{brand}&quot;, mode=&quot;{mode}&quot;,
        resolvedMode=&quot;{resolvedMode}&quot;. Click the buttons above and watch this surface
        ease into its new colors instead of hard-cutting.
      </p>
    </div>
  );
};

const LiveToggleDemo = () => {
  const [brand, setBrand] = useState<Brand>("purple");
  const [mode, setMode] = useState<ColorMode>("light");

  return (
    <ThemeProvider brand={brand} mode={mode}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
          <button
            type="button"
            onClick={() => setBrand((current) => (current === "purple" ? "emerald" : "purple"))}
          >
            Toggle brand (currently {brand})
          </button>
          <button
            type="button"
            onClick={() => setMode((current) => (current === "light" ? "dark" : "light"))}
          >
            Toggle mode (currently {mode})
          </button>
        </div>
        <ResolvedThemeReadout />
      </div>
    </ThemeProvider>
  );
};

export const LiveThemeToggle: Story = {
  name: "Live brand/mode toggle (useTheme + transition demo)",
  render: () => <LiveToggleDemo />,
  parameters: { controls: { disable: true } },
};
