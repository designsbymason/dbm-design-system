import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Blockquote.module.css";
import type { BlockquoteProps } from "./Blockquote.types";

const variantClass = {
  default: undefined,
  "pull-quote": styles.pullQuote,
} as const;

/**
 * A quoted passage set in Lora (the token system's editorial family), with
 * an accent border and an optional `attribution` rendered in the semantic
 * `<footer><cite>` pattern. `variant="pull-quote"` switches to a larger,
 * centered treatment with a decorative quote mark, for a standalone
 * editorial callout rather than a quote embedded in running text.
 *
 * @example
 * ```tsx
 * <Blockquote>Design is not just what it looks like — design is how it works.</Blockquote>
 * <Blockquote cite="https://example.com" attribution="Steve Jobs">
 *   Design is not just what it looks like — design is how it works.
 * </Blockquote>
 * <Blockquote variant="pull-quote" attribution="Steve Jobs">
 *   Design is not just what it looks like — design is how it works.
 * </Blockquote>
 * ```
 */
export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ variant = "default", attribution, className, children, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cx(styles.root, variantClass[variant], className)}
      {...props}
    >
      {variant === "pull-quote" && (
        <span aria-hidden="true" className={styles.quoteMark}>
          “
        </span>
      )}
      <div>{children}</div>
      {attribution && (
        <footer
          className={cx(
            styles.footer,
            variant === "pull-quote" && styles.pullQuoteFooter,
          )}
        >
          — <cite className={styles.cite}>{attribution}</cite>
        </footer>
      )}
    </blockquote>
  ),
);

Blockquote.displayName = "Blockquote";
