import type { Decorator, Preview } from "@storybook/react-vite";

import "@dbm-design-system/tokens/css/primitives.css";
import "@dbm-design-system/tokens/css/purple-light.css";
import "@dbm-design-system/tokens/css/purple-dark.css";
import "@dbm-design-system/tokens/css/emerald-light.css";
import "@dbm-design-system/tokens/css/emerald-dark.css";
import "../src/styles/global.css";

// Token CSS is scoped under `:root[data-theme="..."]` (see packages/tokens),
// and `:root` only ever matches the document element — never a wrapper <div> —
// so the theme attribute has to go on document.documentElement, the same place
// ThemeProvider sets it in a real app. This also makes portaled content (which
// mounts on document.body, outside any story wrapper) inherit the theme correctly.
const withTheme: Decorator = (Story, context) => {
  const { brand, mode } = context.globals;
  document.documentElement.dataset.theme = `${brand}-${mode}`;
  return (
    <div
      style={{
        background: "var(--dbm-bg-canvas)",
        color: "var(--dbm-text-primary)",
        fontFamily: "var(--dbm-font-family-primary)",
        minHeight: "100vh",
        padding: "var(--dbm-space-6)",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },
  globalTypes: {
    brand: {
      description: "Brand theme",
      defaultValue: "purple",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: [
          { value: "purple", title: "Purple" },
          { value: "emerald", title: "Emerald" },
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Color mode",
      defaultValue: "light",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
