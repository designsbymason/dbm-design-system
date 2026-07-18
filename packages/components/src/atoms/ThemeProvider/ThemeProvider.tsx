import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useState } from "react";
import styles from "./ThemeProvider.module.css";
import type { ThemeProviderProps } from "./ThemeProvider.types";

function getSystemColorMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Applies a DBM Design System brand + color mode by setting `data-theme` on
 * the document element (e.g. `data-theme="purple-light"`), matching the
 * `:root[data-theme="..."]`-scoped CSS custom properties emitted by
 * `@dbm-design-system/tokens`.
 *
 * Theming is applied document-wide — not scoped to this component's own DOM
 * subtree — so that portaled content (dialogs, tooltips, toasts mounted on
 * `document.body`) inherits the theme correctly. The component still renders
 * a `display: contents` wrapper around `children` so it has a DOM node to
 * forward its ref to, per this system's component conventions.
 *
 * `mode="system"` reads `prefers-color-scheme` on mount and updates live if
 * the OS preference changes while this component is mounted. Because the
 * initial system read only happens client-side, an app that server-renders
 * with `mode="system"` should expect a possible light/dark mismatch on the
 * very first paint before hydration settles — the standard tradeoff for
 * `prefers-color-scheme` detection without an inline pre-hydration script.
 *
 * @example
 * ```tsx
 * <ThemeProvider brand="emerald" mode="dark">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(
  ({ brand = "purple", mode = "system", className, children, ...props }, ref) => {
    const [systemMode, setSystemMode] = useState<"light" | "dark">(getSystemColorMode);

    useEffect(() => {
      if (mode !== "system") return undefined;

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (event: MediaQueryListEvent) => {
        setSystemMode(event.matches ? "dark" : "light");
      };

      setSystemMode(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [mode]);

    const resolvedMode = mode === "system" ? systemMode : mode;
    const theme = `${brand}-${resolvedMode}`;

    useEffect(() => {
      document.documentElement.dataset.theme = theme;
    }, [theme]);

    return (
      <div ref={ref} className={cx(styles.root, className)} data-theme={theme} {...props}>
        {children}
      </div>
    );
  },
);

ThemeProvider.displayName = "ThemeProvider";
