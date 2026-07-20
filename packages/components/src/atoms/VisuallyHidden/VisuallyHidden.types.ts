import type { VisuallyHiddenProps as RadixVisuallyHiddenProps } from "@radix-ui/react-visually-hidden";
import type { ReactNode } from "react";

export interface VisuallyHiddenProps extends RadixVisuallyHiddenProps {
  /** The content to visually hide (while keeping it in the accessibility tree). */
  children: ReactNode;
  /**
   * Keeps the content visually hidden by default, but reveals it in normal
   * document flow when it (or a focusable descendant) receives focus — the
   * classic "skip link" pattern: hidden for mouse/screen-reader users,
   * visible the moment a sighted keyboard user tabs to it. Matches
   * Bootstrap's `.visually-hidden-focusable` and react-aria's `isFocusable`.
   * Revealing only restores normal layout flow — it adds no background,
   * positioning, or chrome of its own, so style the revealed state yourself
   * if it needs to stand out (e.g. a real skip link).
   * @default false
   */
  focusable?: boolean;
}
