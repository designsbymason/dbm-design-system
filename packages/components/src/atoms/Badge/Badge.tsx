import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useRef, useState } from "react";
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
 * <Badge hideZero>{0}</Badge>
 * <Badge dot aria-label="Unread notifications" />
 * <Badge size="lg">Failed</Badge>
 * <Badge anchor={<Icon icon={Bell} size="lg" />} dot aria-label="Unread notifications" />
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = "danger",
      variant = "solid",
      size = "md",
      max,
      hideZero = false,
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

    // Pops the badge (see Badge.module.css's .pop/@keyframes pop) whenever
    // `content` changes to a new value after the initial mount — skipped on
    // mount itself (prevContentRef starts equal to content, so the first
    // effect run is a no-op) and in `dot` mode, which has no content to
    // change. Resets to false-then-true across a frame boundary rather than
    // just true, so two content changes landing inside one animation's
    // duration each still restart the animation instead of the second one
    // being a no-op (the class name/animation-name wouldn't otherwise
    // change, so the browser has nothing to signal a restart from).
    const prevContentRef = useRef(content);
    const [isPopping, setIsPopping] = useState(false);
    useEffect(() => {
      const changed = prevContentRef.current !== content;
      prevContentRef.current = content;
      if (dot || !changed) return;
      setIsPopping(false);
      const frame = requestAnimationFrame(() => setIsPopping(true));
      return () => cancelAnimationFrame(frame);
    }, [content, dot]);

    const hasWarnedDotChildrenRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (dot && children != null && !hasWarnedDotChildrenRef.current) {
        hasWarnedDotChildrenRef.current = true;
        console.warn(
          "Badge: `children` was provided alongside `dot` — `dot` always renders as a minimal dot with no visible content, so `children` is silently ignored. Remove `dot`, or remove `children` (using `aria-label` instead if the dot needs an accessible name).",
        );
      }
    }

    // Placed after every hook above (rules of hooks) so this can return
    // early without skipping any of them. Renders nothing at all — not
    // just visually hidden — matching MUI's own `showZero={false}`
    // default; `anchor` (if set) still renders on its own, since it's a
    // real element the caller passed in, not part of what "zero" hides.
    if (hideZero && !dot && children === 0) {
      return anchor === undefined ? null : anchor;
    }

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
          isPopping && styles.pop,
          className,
        )}
        // Cosmetic cleanup, not load-bearing: the effect above already
        // forces a false-then-true toggle on every genuine content change
        // regardless of whether this ever fires, so a stuck `pop` class
        // between two changes doesn't break the next pop. Confirmed
        // untestable under jsdom, which has no `AnimationEvent`
        // implementation — React never invokes `onAnimationEnd` from a
        // simulated dispatch there (same class of gap as this file's
        // `getBoundingClientRect()`-in-jsdom limitation elsewhere);
        // verified live in Storybook instead.
        onAnimationEnd={() => setIsPopping(false)}
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
