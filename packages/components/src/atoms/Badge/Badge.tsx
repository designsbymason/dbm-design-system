import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Badge.module.css";
import type {
  BadgePosition,
  BadgeProps,
  BadgeSize,
  BadgeTone,
  BadgeVariant,
} from "./Badge.types";

const classFor: Record<BadgeVariant, Record<BadgeTone, string | undefined>> = {
  subtle: {
    brand: styles.subtleBrand,
    neutral: styles.subtleNeutral,
    info: styles.subtleInfo,
    success: styles.subtleSuccess,
    warning: styles.subtleWarning,
    danger: styles.subtleDanger,
  },
  solid: {
    brand: styles.solidBrand,
    neutral: styles.solidNeutral,
    info: styles.solidInfo,
    success: styles.solidSuccess,
    warning: styles.solidWarning,
    danger: styles.solidDanger,
  },
};

// dot always resolves its own fill via this map, ignoring `variant`
// entirely — see Badge.module.css's .dot* rules for why (the "subtle"
// variant's fill is only contrast-verified as a background for text, not
// as a small standalone non-text graphic).
const dotClassFor: Record<BadgeTone, string | undefined> = {
  brand: styles.dotBrand,
  neutral: styles.dotNeutral,
  info: styles.dotInfo,
  success: styles.dotSuccess,
  warning: styles.dotWarning,
  danger: styles.dotDanger,
};

const sizeClass: Record<BadgeSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// dot's own diameter per size — a separate, coarser map from sizeClass
// above (see Badge.module.css's .dotSize* rules for why: no text to size
// around, so a 3-tier ladder reads just as distinctly as 5 would).
const dotSizeClass: Record<BadgeSize, string | undefined> = {
  xs: styles.dotSizeXs,
  sm: styles.dotSizeSm,
  md: styles.dotSizeMd,
  lg: styles.dotSizeLg,
  xl: styles.dotSizeXl,
};

const positionClass: Record<BadgePosition, string | undefined> = {
  "top-right": styles.positionTopRight,
  "top-left": styles.positionTopLeft,
  "bottom-right": styles.positionBottomRight,
  "bottom-left": styles.positionBottomLeft,
};

/**
 * A small status/count indicator, in a low-emphasis subtle-background style
 * (default) or a high-emphasis solid-fill style.
 *
 * @example
 * ```tsx
 * <Badge>Failed</Badge>
 * <Badge tone="brand">New</Badge>
 * <Badge tone="success" variant="subtle">Active</Badge>
 * <Badge max={99}>{100}</Badge>
 * <Badge dot aria-label="Unread notifications" />
 * <Badge size="lg">Failed</Badge>
 * <Badge anchor={<BellIcon />} dot aria-label="Unread notifications" />
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = "danger",
      variant = "solid",
      size = "md",
      max,
      dot = false,
      anchor,
      position = "top-right",
      overlap = "rectangular",
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

    const badge = (
      <span
        ref={ref}
        role={isLabeledDot ? "img" : undefined}
        aria-hidden={dot && !isLabeledDot ? true : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={cx(
          styles.root,
          dot ? dotClassFor[tone] : classFor[variant][tone],
          dot ? styles.dot : sizeClass[size],
          dot && dotSizeClass[size],
          anchor !== undefined && styles.positioned,
          anchor !== undefined && positionClass[position],
          anchor !== undefined && overlap === "circular" && styles.overlapCircular,
          className,
        )}
        {...props}
      >
        {dot ? null : content}
      </span>
    );

    if (anchor === undefined) return badge;

    return (
      <span className={styles.anchorWrapper}>
        {anchor}
        {badge}
      </span>
    );
  },
);

Badge.displayName = "Badge";
