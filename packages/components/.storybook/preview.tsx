import type { Decorator, Preview } from "@storybook/react-vite";
import { dbmStorybookTheme } from "./theme";

import "@dbm-design-system/tokens/css/primitives.css";
import "@dbm-design-system/tokens/css/purple-light.css";
import "@dbm-design-system/tokens/css/purple-dark.css";
import "@dbm-design-system/tokens/css/emerald-light.css";
import "@dbm-design-system/tokens/css/emerald-dark.css";
import "../src/styles/global.css";
import "./docs.css";

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
        // Full viewport height only in the standalone story view — a
        // handful of stories genuinely rely on it (Affix's scroll demo,
        // BackToTop, Center). Embedded inline in a Docs page's Canvas
        // block (`viewMode === "docs"`), the same 100vh instead forced
        // every preview into a huge box with mostly empty space below the
        // actual content — this lets Docs previews hug their content
        // while standalone story views keep the full-height background.
        minHeight: context.viewMode === "docs" ? undefined : "100vh",
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
    docs: {
      theme: dbmStorybookTheme,
      // Restricted to `h2` only (default is `h2, h3`) so the TOC reflects
      // just the template's fixed section list (Overview, Import,
      // Playground, ...) — identical across every component's Docs page —
      // rather than also indexing each component's own `h3` variant
      // subheadings, which differ per component and would make the TOC
      // read as a list of variants instead of a consistent page nav.
      toc: { headingSelector: "h2" },
    },
    options: {
      // Storybook's story-index generator statically extracts this
      // parameter server-side, so it must be written inline here — a
      // reference to a function defined elsewhere in this module fails
      // with "Unexpected 'storySort'" at startup.
      //
      // Top-level group order: Foundations (token reference — read this
      // first) before Atoms before anything else, since alphabetical would
      // otherwise put Atoms first. Within Foundations, an explicit reading
      // order (Overview first, then roughly increasing specialization) —
      // alphabetical would scatter Overview into the middle of the list.
      // Within Atoms (and any future tier), the hand-authored Docs page
      // (see guidelines/07-storybook-and-documentation-standards.md §4)
      // always sorts first within its component group, then the Playground
      // story, then everything else in file order — across different
      // components, alphabetical by title.
      storySort: (a, b) => {
        const topLevelGroup = (title) => title.split("/")[0];
        const groupPriority = ["Foundations", "Atoms"];
        const foundationsOrder = [
          "Foundations/Overview",
          "Foundations/Color",
          "Foundations/Typography",
          "Foundations/Spacing",
          "Foundations/Radius",
          "Foundations/Shadows",
          "Foundations/Motion",
          "Foundations/IconSizes",
          "Foundations/Miscellaneous",
          "Foundations/Breakpoints",
        ];

        const aGroup = topLevelGroup(a.title);
        const bGroup = topLevelGroup(b.title);
        if (aGroup !== bGroup) {
          const aRank = groupPriority.indexOf(aGroup);
          const bRank = groupPriority.indexOf(bGroup);
          if (aRank !== bRank) {
            return (
              (aRank === -1 ? groupPriority.length : aRank) -
              (bRank === -1 ? groupPriority.length : bRank)
            );
          }
          return aGroup.localeCompare(bGroup, undefined, { numeric: true });
        }
        if (aGroup === "Foundations") {
          return foundationsOrder.indexOf(a.title) - foundationsOrder.indexOf(b.title);
        }
        if (a.title !== b.title) {
          return a.title.localeCompare(b.title, undefined, { numeric: true });
        }
        if (a.type === "docs" || b.type === "docs") {
          return a.type === "docs" ? -1 : 1;
        }
        if (a.name === "Playground" || b.name === "Playground") {
          return a.name === "Playground" ? -1 : 1;
        }
        return 0;
      },
    },
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
