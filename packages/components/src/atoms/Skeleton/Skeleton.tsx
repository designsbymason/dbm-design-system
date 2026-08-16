import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Skeleton.module.css";
import type {
  SkeletonAnimation,
  SkeletonProps,
  SkeletonVariant,
} from "./Skeleton.types";

const variantClass: Record<SkeletonVariant, string | undefined> = {
  text: styles.variantText,
  circular: styles.variantCircular,
  rectangular: styles.variantRectangular,
};

const animationClass: Record<SkeletonAnimation, string | undefined> = {
  pulse: styles.animationPulse,
  wave: styles.animationWave,
  none: undefined,
};

/**
 * A placeholder shape shown while real content is loading, with a `pulse`
 * (default) or `wave` animation. Purely decorative (hidden from the
 * accessibility tree) — pair with a live region elsewhere in the loading UI
 * if you need to announce loading state to assistive tech. Respects
 * `prefers-reduced-motion`.
 *
 * `variant="rectangular"` always carries a soft corner radius
 * (`--dbm-radius-md`) rather than sharp corners — intentional, matching this
 * system's house corner-radius style (soft/rounded throughout), not an
 * oversight. There's no separate sharp-cornered variant; use `className`/
 * `style` to override in the rare case a hard corner is genuinely needed.
 *
 * Deliberately standalone-only — there's no `children`-driven auto-sizing
 * (MUI's pattern) and no wrapping/`isLoaded`-style mode that swaps to real
 * content once loaded (Chakra's pattern). Compose multiple `Skeleton`
 * instances instead (see the "Composed: card loading placeholder" story) and
 * conditionally render between a `Skeleton` and the real content yourself —
 * both are already fully achievable without special support, so adding
 * either pattern here would grow this atom into a different kind of
 * component rather than close a real capability gap.
 *
 * @example
 * ```tsx
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="rectangular" animation="wave" />
 * ```
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      animation = "pulse",
      width,
      height,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // `children` isn't part of the public `SkeletonProps` type, but a caller
    // bypassing TypeScript could still pass one at runtime — discard it
    // explicitly rather than relying on the type alone, so this stays a pure
    // placeholder shape regardless of caller (same guard as the structurally
    // similar `Spacer` atom). Kept as a separate step from the defaults
    // above — rather than folded into one destructure — because Storybook's
    // docgen only resolves default values (the Properties table's "Default"
    // column) from a destructuring pattern directly in the function's own
    // parameter list; moving `variant`/`animation`'s defaults into a
    // body-level destructure (as an earlier version of this fix did)
    // silently broke that column for every prop, confirmed live before
    // landing this version.
    const { children: _children, ...rest } = props as typeof props & {
      children?: unknown;
    };

    return (
      <div
        ref={ref}
        className={cx(
          styles.root,
          variantClass[variant],
          animationClass[animation],
          className,
        )}
        style={{ width, height, ...style }}
        {...rest}
        // Always after `...rest`, so it can't be overridden by a caller
        // passing their own `aria-hidden` — this component is purely
        // decorative by design (see the component's own JSDoc), with no
        // legitimate case for un-hiding it from assistive tech.
        aria-hidden="true"
      />
    );
  },
);

Skeleton.displayName = "Skeleton";
