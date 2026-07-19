import { createContext } from "react";
import type { Brand, ColorMode } from "./ThemeProvider.types";

/** The value `useTheme` reads from the nearest ancestor `ThemeProvider`. */
export interface ThemeContextValue {
  /** The active brand palette. */
  brand: Brand;
  /** The `mode` prop as passed to the nearest `ThemeProvider` — may be `'system'`. */
  mode: ColorMode;
  /** The concrete `light`/`dark` value `mode` currently resolves to. */
  resolvedMode: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
