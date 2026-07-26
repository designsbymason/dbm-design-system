import { forwardRef, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cx } from "@dbm-design-system/primitives";
import styles from "./Affix.module.css";
import type { AffixProps } from "./Affix.types";

const sentinelStyleFor: Record<"top" | "bottom", CSSProperties> = {
  top: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 1 },
};

/**
 * A sticky-positioning wrapper — sticky table headers, filter bars, section
 * nav. Tracks its own stuck state via `IntersectionObserver` (a hidden
 * sentinel placed at the edge it sticks to), exposed as `data-stuck` and
 * via `onStickyChange`, so a shadow/border can be applied only once it's
 * actually stuck. SSR-safe: the observer only attaches client-side.
 *
 * @example
 * ```tsx
 * <Affix offset={0}>
 *   <TableHeader />
 * </Affix>
 * <Affix side="bottom" onStickyChange={setIsStuck}>
 *   <FilterBar />
 * </Affix>
 * ```
 */
export const Affix = forwardRef<HTMLDivElement, AffixProps>(
  (
    { side = "top", offset = 0, onStickyChange, className, style, children, ...props },
    ref,
  ) => {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return undefined;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const stuck = !entry.isIntersecting;
          setIsStuck(stuck);
          onStickyChange?.(stuck);
        },
        { threshold: 0 },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [onStickyChange]);

    return (
      <div className={styles.wrapper}>
        <div ref={sentinelRef} aria-hidden="true" style={sentinelStyleFor[side]} />
        <div
          ref={ref}
          data-stuck={isStuck || undefined}
          className={cx(styles.root, className)}
          style={{ [side]: `var(--dbm-space-${offset})`, ...style }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

Affix.displayName = "Affix";
