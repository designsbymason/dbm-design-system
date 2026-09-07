import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Kbd.module.css";
import type { KbdProps } from "./Kbd.types";

/**
 * A keyboard shortcut or key name, styled like a physical keycap. Compose
 * multiple for a chord (e.g. `<Kbd>⌘</Kbd> + <Kbd>K</Kbd>`).
 *
 * Unlike `Code`, `Kbd`'s font size is fixed rather than inherited from its
 * surrounding context — a keycap should read as a consistent, compact
 * visual regardless of where it appears, the same way a physical key
 * doesn't change size depending on the sentence around it.
 *
 * For symbol-only content (`⌘`, `⇧`, `⌥`, `⌃`), pass `aria-label` with a
 * plain-language name — see the `aria-label` prop's own doc.
 *
 * @example
 * ```tsx
 * <Kbd>Esc</Kbd>
 * <Text as="span"><Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> to open the command palette</Text>
 * ```
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => (
    <kbd ref={ref} className={cx(styles.root, className)} {...props} />
  ),
);

Kbd.displayName = "Kbd";
