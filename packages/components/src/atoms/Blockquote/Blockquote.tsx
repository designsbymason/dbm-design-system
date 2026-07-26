import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Blockquote.module.css";
import type { BlockquoteProps } from "./Blockquote.types";

/**
 * A quoted passage set in Lora (the token system's editorial family), with
 * an accent border and an optional `attribution` rendered in the semantic
 * `<footer><cite>` pattern.
 *
 * @example
 * ```tsx
 * <Blockquote>Design is not just what it looks like — design is how it works.</Blockquote>
 * <Blockquote cite="https://example.com" attribution="Steve Jobs">
 *   Design is not just what it looks like — design is how it works.
 * </Blockquote>
 * ```
 */
export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ attribution, className, children, ...props }, ref) => (
    <blockquote ref={ref} className={cx(styles.root, className)} {...props}>
      <div>{children}</div>
      {attribution && (
        <footer className={styles.footer}>
          — <cite className={styles.cite}>{attribution}</cite>
        </footer>
      )}
    </blockquote>
  ),
);

Blockquote.displayName = "Blockquote";
