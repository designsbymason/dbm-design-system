import { ArrowUpIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useState } from "react";
import { IconButton } from "../IconButton";
import styles from "./BackToTop.module.css";
import type { BackToTopProps } from "./BackToTop.types";

/**
 * A floating button that appears once the page (or a custom scroll
 * container) has been scrolled past `threshold`, scrolling smoothly back
 * to the top when activated. Stays mounted at all times (fading/sliding in
 * and out) rather than mounting on demand, so its appearance is a
 * transition instead of a layout jump — hidden from the accessibility tree
 * and removed from tab order while not visible. SSR-safe: the scroll
 * listener only attaches client-side.
 *
 * @example
 * ```tsx
 * <BackToTop />
 * <BackToTop threshold={800} label="Scroll to top" />
 * <BackToTop size="sm" variant="secondary" />
 * <BackToTop scrollContainerRef={panelRef} />
 * ```
 */
export const BackToTop = forwardRef<HTMLButtonElement, BackToTopProps>(
  (
    {
      size = "md",
      variant = "primary",
      threshold = 400,
      scrollContainerRef,
      label = "Back to top",
      className,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const container = scrollContainerRef?.current;
      const getScrollPosition = () =>
        container ? container.scrollTop : window.scrollY;
      const handleScroll = () => setVisible(getScrollPosition() > threshold);
      handleScroll();
      const scrollTarget: EventTarget = container ?? window;
      scrollTarget.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      return () => scrollTarget.removeEventListener("scroll", handleScroll);
    }, [threshold, scrollContainerRef]);

    const handleClick = () => {
      const container = scrollContainerRef?.current;
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    return (
      <IconButton
        ref={ref}
        icon={ArrowUpIcon}
        size={size}
        variant={variant}
        rounded
        {...props}
        aria-hidden={!visible || undefined}
        tabIndex={visible ? undefined : -1}
        aria-label={label}
        onClick={handleClick}
        className={cx(styles.root, visible && styles.visible, className)}
      />
    );
  },
);

BackToTop.displayName = "BackToTop";
