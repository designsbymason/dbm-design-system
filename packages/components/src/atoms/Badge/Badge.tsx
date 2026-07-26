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
 * <Badge tone="danger" max={99}>{100}</Badge>
 * <Badge tone="danger" dot aria-label="Unread notifications" />
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = "neutral",
      variant = "subtle",
      max,
      dot = false,
      className,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      ...props
    },
    ref,
  ) => {
    const content =
      typeof children === "number" && max !== undefined && children > max
        ? `${max}+`
        : children;
    const isLabeledDot = dot && Boolean(ariaLabel || ariaLabelledby);

    return (
      <span
        ref={ref}
        role={isLabeledDot ? "img" : undefined}
        aria-hidden={dot && !isLabeledDot ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={cx(
          styles.root,
          classFor[variant][tone],
          dot && styles.dot,
          className,
        )}
        {...props}
      >
        {dot ? null : content}
      </span>
    );
  },
);

Badge.displayName = "Badge";
