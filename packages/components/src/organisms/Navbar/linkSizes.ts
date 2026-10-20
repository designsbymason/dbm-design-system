import type { IconSize } from "../../atoms/Icon";
import type { NavbarLinkSize, NavbarSize } from "./Navbar.types";

/** What a link's size is when nobody sets one: the step of the same name, so a taller bar has larger links. */
export const defaultLinkSize: Record<NavbarSize, NavbarLinkSize> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
};

const steps: NavbarLinkSize[] = ["xs", "sm", "md", "lg", "xl"];

/** One step smaller, never below `xs`: what a `quiet` set reads. */
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

/** A link's trailing icon (the external-link arrow, a group's caret): a step smaller than its leading icon, never below `xs`. */
export const linkTrailingIconSize: Record<NavbarLinkSize, Extract<IconSize, "xs" | "sm" | "md">> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "md",
};
