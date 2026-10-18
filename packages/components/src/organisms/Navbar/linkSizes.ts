import type { IconSize } from "../../atoms/Icon";
import type { NavbarLinkSize, NavbarSize } from "./Navbar.types";

/** What a link's size is when nobody sets one: today's text size for each height step, so a bar that sets no `linkSize` is as it was. */
export const defaultLinkSize: Record<NavbarSize, NavbarLinkSize> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "md",
};

const steps: NavbarLinkSize[] = ["xs", "sm", "md", "lg", "xl"];

/** One step smaller, never below `xs`: what a `quiet` set reads when its size is set. */
export function stepDown(size: NavbarLinkSize): NavbarLinkSize {
  return steps[Math.max(0, steps.indexOf(size) - 1)]!;
}

/** A link's icon for each step, the scale `Menu`'s own icons follow. */
export const linkIconSize: Record<NavbarLinkSize, Extract<IconSize, "xs" | "sm" | "md" | "lg">> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "lg",
};
