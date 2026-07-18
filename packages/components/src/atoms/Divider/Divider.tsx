import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Divider.module.css";
import type { DividerProps } from "./Divider.types";

/**
 * A visual separator between content, horizontal or vertical, with an
 * optional centered label (e.g. `"OR"`).
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * <Divider label="OR" />
 * ```
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = "horizontal", label, className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cx(styles.root, orientation === "horizontal" ? styles.horizontal : styles.vertical, className)}
      {...props}
    >
      {label != null ? (
        <>
          <span className={styles.line} />
          <span className={styles.label}>{label}</span>
          <span className={styles.line} />
        </>
      ) : (
        <span className={styles.line} />
      )}
    </div>
  ),
);

Divider.displayName = "Divider";
