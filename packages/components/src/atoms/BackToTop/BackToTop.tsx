import { ArrowUpIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useState } from "react";
import { IconButton } from "../IconButton";
import styles from "./BackToTop.module.css";
import type { BackToTopProps } from "./BackToTop.types";

/**
 * A floating button that appears once the page has been scrolled past
 * `threshold`, scrolling smoothly back to the top when activated. Stays
 * mounted at all times (fading/sliding in and out) rather than mounting on
 * demand, so its appearance is a transition instead of a layout jump —
 * hidden from the accessibility tree and removed from tab order while not
 * visible. SSR-safe: the scroll listener only attaches client-side.
 *
 * @example
 * ```tsx
 * <BackToTop />
 * <BackToTop threshold={800} label="Scroll to top" />
 * ```
 */
export const BackToTop = forwardRef<HTMLButtonElement, BackToTopProps>(
  ({ threshold = 400, label = "Back to top", className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const handleScroll = () => setVisible(window.scrollY > threshold);
      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <IconButton
        ref={ref}
        icon={ArrowUpIcon}
        aria-label={label}
        aria-hidden={!visible || undefined}
        tabIndex={visible ? undefined : -1}
        onClick={handleClick}
        rounded
        className={cx(styles.root, visible && styles.visible, className)}
        {...props}
      />
    );
  },
);

BackToTop.displayName = "BackToTop";
