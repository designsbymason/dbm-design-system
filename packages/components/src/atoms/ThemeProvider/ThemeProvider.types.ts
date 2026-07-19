import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** A v1 brand palette. */
export type Brand = "purple" | "emerald";

/** A color mode. `'system'` follows the OS preference via `prefers-color-scheme`. */
export type ColorMode = "light" | "dark" | "system";

export interface ThemeProviderProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Which brand palette to apply.
   * @default 'purple'
   */
  brand?: Brand;
  /**
   * Which color mode to apply. `'system'` follows `prefers-color-scheme` and
   * updates live if the OS preference changes while mounted.
   * @default 'system'
   */
  mode?: ColorMode;
  /** The subtree to render inside the theme wrapper. */
  children: ReactNode;
}
