import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

export interface CollapseProps extends ComponentPropsWithoutRef<"div"> {
  /** The controlled open state. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** @default false */
  disabled?: boolean;
  /**
   * An optional trigger element rendered above the content, toggling
   * `open` when activated (via Radix `Slot` composition, matching this
   * system's `asChild` convention). Omit to drive `open` entirely
   * externally — e.g. `Accordion`'s own trigger UI, which uses `Collapse`
   * only for its animated content region.
   */
  trigger?: ReactElement;
  children: ReactNode;
}
