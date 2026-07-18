import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface FocusTrapProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * When `true`, tabbing from the last focusable element focuses the first
   * (and shift+tab from the first focuses the last).
   * @default false
   */
  loop?: boolean;
  /**
   * When `true`, focus cannot escape the trap via keyboard, pointer, or a
   * programmatic focus call.
   * @default false
   */
  trapped?: boolean;
  /** Called when focus moves into the trap on mount. Can be prevented. */
  onMountAutoFocus?: (event: Event) => void;
  /** Called when focus moves out of the trap on unmount. Can be prevented. */
  onUnmountAutoFocus?: (event: Event) => void;
  children: ReactNode;
}
