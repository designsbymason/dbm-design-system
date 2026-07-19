import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import type { ThemeContextValue } from "./ThemeContext";

/**
 * Reads the brand/mode currently applied by the nearest ancestor
 * `ThemeProvider`, including the resolved `light`/`dark` value when
 * `mode="system"` is in effect. Throws if called outside a `ThemeProvider`.
 *
 * @example
 * ```tsx
 * function ModeToggle() {
 *   const { resolvedMode } = useTheme();
 *   return <span>{resolvedMode === "dark" ? "🌙" : "☀️"}</span>;
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
