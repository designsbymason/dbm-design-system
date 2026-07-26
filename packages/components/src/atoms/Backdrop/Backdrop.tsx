import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import { Portal } from "../Portal";
import styles from "./Backdrop.module.css";
import type { BackdropProps } from "./Backdrop.types";

/**
 * A full-viewport dimming scrim — the visual layer behind Dialog/Drawer/
 * modal-style overlays. Purely visual; mounting/unmounting and click-to-
 * dismiss orchestration are the consumer's responsibility (pass an
 * `onClick`). Portals to `document.body` by default.
 *
 * @example
 * ```tsx
 * {open && <Backdrop onClick={() => setOpen(false)} />}
 * <Backdrop blur opacity={80} inPortal={false} />
 * ```
 */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(
  ({ inPortal = true, blur = false, opacity = 60, className, style, ...props }, ref) => {
    const scrim = (
      <div
        ref={ref}
        className={cx(styles.root, blur && styles.blur, className)}
        style={{ opacity: `var(--dbm-opacity-${opacity})`, ...style }}
        {...props}
      />
    );

    return inPortal ? <Portal>{scrim}</Portal> : scrim;
  },
);

Backdrop.displayName = "Backdrop";
