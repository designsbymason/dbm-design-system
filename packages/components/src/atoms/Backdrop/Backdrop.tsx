import { cx } from "@dbm-design-system/primitives";
import { Presence } from "@radix-ui/react-presence";
import { forwardRef } from "react";
import type { CSSProperties } from "react";
import { Portal } from "../Portal";
import styles from "./Backdrop.module.css";
import type { BackdropProps } from "./Backdrop.types";

/**
 * A full-viewport dimming scrim — the visual layer behind Dialog/Drawer/
 * modal-style overlays. Purely visual: *whether to render `Backdrop` at
 * all* is still the consumer's call, since there's no built-in trigger,
 * but visibility itself is driven by the `open` prop so the scrim can
 * fade out before actually leaving the DOM — see `open`'s own JSDoc for
 * the two supported usage patterns. Portals to `document.body` by
 * default.
 *
 * @example
 * ```tsx
 * {isOpen && <Backdrop onClick={() => setOpen(false)} />}
 * <Backdrop open={isOpen} onClick={() => setOpen(false)} />
 * <Backdrop blur opacity={80} inPortal={false} />
 * ```
 */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(
  (
    {
      inPortal = true,
      blur = false,
      opacity = 60,
      open = true,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const scrim = (
      <Presence present={open}>
        <div
          ref={ref}
          className={cx(styles.root, blur && styles.blur, className)}
          // `opacity` (the prop) sets a CSS custom property consumed by
          // `.root`'s own `color-mix()`-based background fill in
          // Backdrop.module.css — deliberately *not* the element's own
          // `opacity` CSS property. An element with `opacity < 1` renders
          // to an intermediate layer and blends that whole layer (fill +
          // any `backdrop-filter`) back with the sharp, unblurred content
          // behind it — at the default 60%, that let 40% of the original,
          // unblurred page bleed back through, which is why `blur` read as
          // barely-there even though `backdrop-filter` was genuinely being
          // applied (confirmed by isolating the variable outside React/
          // Storybook entirely). Baking the alpha into the background
          // color instead keeps the element's own opacity at 1, so the
          // blur (and any `children` rendered on top) render at full
          // fidelity, not diluted by whatever's behind them.
          style={
            {
              "--dbm-backdrop-fill-opacity": `var(--dbm-opacity-${opacity})`,
              ...style,
            } as CSSProperties
          }
          {...props}
          // Spread after `{...props}`, never before — `data-state` drives
          // the `fadeIn`/`fadeOut` CSS animation above, and TypeScript's
          // `data-*` exemption means a consumer can pass their own
          // `data-state` even though it isn't a declared prop; if it were
          // set before the spread, that value would silently win and
          // break the enter/exit animation (the same JSX-attribute-
          // ordering bug class tracked in `05-component-api-conventions.md`
          // §3, found here during Backdrop's final pre-finalization pass).
          data-state={open ? "open" : "closed"}
        >
          {children}
        </div>
      </Presence>
    );

    return inPortal ? <Portal>{scrim}</Portal> : scrim;
  },
);

Backdrop.displayName = "Backdrop";
