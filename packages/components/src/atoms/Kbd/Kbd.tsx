import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Kbd.module.css";
import type { KbdProps } from "./Kbd.types";

/**
 * A keyboard shortcut or key name, styled like a physical keycap. Compose
 * multiple for a chord (e.g. `<Kbd>⌘</Kbd> + <Kbd>K</Kbd>`).
 *
 * @example
 * ```tsx
 * <Kbd>Esc</Kbd>
 * <Text as="span"><Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette</Text>
 * ```
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => (
    <kbd ref={ref} className={cx(styles.root, className)} {...props} />
  ),
);

Kbd.displayName = "Kbd";
