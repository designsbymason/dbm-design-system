import type { CSSProperties } from "react";
import type { Responsive } from "../types/tokens";

/**
 * Shared by every component with a responsive prop (Stack's direction/align/
 * justify/wrap/gap, Grid's columns/gap, GridItem's colSpan/rowSpan/colStart/
 * rowStart): a plain value becomes the `base` breakpoint, so each
 * component's CSS only ever has to cascade one shape of CSS custom property
 * per prop. `undefined` (a genuinely-optional prop, like GridItem's, with no
 * universal default) produces no custom properties at all, letting the
 * CSS's own fallback value apply.
 *
 * `cssVarPrefix` is the full custom property name up to the breakpoint
 * suffix, e.g. `"--stack-direction"` or `"--grid-cols"`.
 */
export function responsiveStyle<T>(
  value: Responsive<T> | undefined,
  cssVarPrefix: string,
  toCssValue: (value: T) => string,
): CSSProperties {
  if (value === undefined) return {};
  const entries: Partial<Record<string, T>> =
    typeof value === "object" && value !== null ? value : { base: value };
  const style: Record<string, string> = {};
  for (const [breakpoint, entryValue] of Object.entries(entries)) {
    if (entryValue !== undefined) {
      style[`${cssVarPrefix}-${breakpoint}`] = toCssValue(entryValue);
    }
  }
  return style as CSSProperties;
}
