import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Badge.module.css";
import type { BadgeProps, BadgeTone } from "./Badge.types";

const toneClass: Record<BadgeTone, string | undefined> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

/**
 * A small status/count indicator. Currently subtle-background only — a
 * solid-fill variant would need `text.on-info`/`on-success`/`on-warning`
 * tokens verified the way `text.on-danger` was for `Button`, which is out
 * of scope for this pass.
 *
 * @example
 * ```tsx
 * <Badge tone="success">Active</Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = "neutral", className, ...props }, ref) => (
    <span ref={ref} className={cx(styles.root, toneClass[tone], className)} {...props} />
  ),
);

Badge.displayName = "Badge";
