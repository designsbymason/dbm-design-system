import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Badge.module.css";
import type { BadgeProps, BadgeTone, BadgeVariant } from "./Badge.types";

const classFor: Record<BadgeVariant, Record<BadgeTone, string | undefined>> = {
  subtle: {
    neutral: styles.subtleNeutral,
    info: styles.subtleInfo,
    success: styles.subtleSuccess,
    warning: styles.subtleWarning,
    danger: styles.subtleDanger,
  },
  solid: {
    neutral: styles.solidNeutral,
    info: styles.solidInfo,
    success: styles.solidSuccess,
    warning: styles.solidWarning,
    danger: styles.solidDanger,
  },
};

/**
 * A small status/count indicator, in a low-emphasis subtle-background style
 * (default) or a high-emphasis solid-fill style.
 *
 * @example
 * ```tsx
 * <Badge tone="success">Active</Badge>
 * <Badge tone="danger" variant="solid">Failed</Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = "neutral", variant = "subtle", className, ...props }, ref) => (
    <span ref={ref} className={cx(styles.root, classFor[variant][tone], className)} {...props} />
  ),
);

Badge.displayName = "Badge";
