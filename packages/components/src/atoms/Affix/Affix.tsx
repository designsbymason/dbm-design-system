import { forwardRef, useEffect, useRef, useState } from "react";
import { cx } from "@dbm-design-system/primitives";
import styles from "./Affix.module.css";
import type { AffixProps } from "./Affix.types";

/**
 * A sticky-positioning wrapper — sticky table headers, filter bars, section
 * nav. Tracks its own stuck state via `IntersectionObserver` (a hidden
 * sentinel placed at the edge it sticks to), exposed as `data-stuck` and
 * via `onStickyChange`, so a shadow/border can be applied only once it's
 * actually stuck. SSR-safe: the observer only attaches client-side.
 *
 * Renders the sentinel as a plain sibling of the sticky element, not
 * wrapped together with it — a real, previously-shipped bug (found via
 * direct user report, not caught by any prior test): wrapping both in a
 * shared `position: relative` container made that wrapper the sticky
 * element's own CSS *containing block*, and since the wrapper was only
 * ever as tall as the sticky content itself (the sentinel adds no flow
 * height), there was almost no room for the element to actually stay
 * pinned — it would detach and scroll off-screen almost immediately
 * instead of remaining visible at the edge. Siblings inherit whatever
 * containing block the *consumer's* own surrounding layout provides,
 * which normally spans the whole scrollable region this is meant to
 * stick through.
 *
 * @example
 * ```tsx
 * <Affix offset={0}>
 *   <TableHeader />
 * </Affix>
 * <Affix side="bottom" onStickyChange={setIsStuck}>
 *   <FilterBar />
 * </Affix>
 * <Affix scrollContainerRef={panelRef}>
 *   <FilterBar />
 * </Affix>
 * ```
 */
export const Affix = forwardRef<HTMLDivElement, AffixProps>(
  (
    {
      side = "top",
      offset = 0,
      scrollContainerRef,
      onStickyChange,
      className,
      style,
      children,
      ...props
    },
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
          // Deliberately not `!entry.isIntersecting` — that's direction-
          // agnostic and can't tell "the sentinel scrolled past the edge"
          // (genuinely stuck) from "the sentinel hasn't been scrolled to
          // yet" (mounted below the fold, e.g. deep in a long page or
          // behind other content), since both report `isIntersecting:
          // false`. Comparing the sentinel's own edge against the
          // observed root's edge disambiguates: only actually having
          // crossed counts.
          //
          // Deliberately not `entry.rootBounds` either, despite that
          // looking like the obvious source for "the root's edge" — a
          // real, previously-shipped bug (found via direct user report,
          // reproduced only for `side="bottom"`): when this renders
          // inside a nested browsing context (an iframe within an
          // iframe, e.g. Storybook's own preview iframe) and `root` is
          // `null`, the browser resolves the *implicit* root to the
          // outermost top-level viewport, and reports `rootBounds` in
          // *that* viewport's own coordinate frame — while
          // `boundingClientRect` stays in the sentinel's own local
          // document frame. Confirmed directly: `rootBounds` read
          // `{ top: 0, bottom: 912 }` (the real browser tab's height)
          // while the sentinel's own document was only `572px` tall —
          // comparing across those two frames silently broke the
          // bottom-edge check specifically (`bottom` differs by frame;
          // `top` is always `0` in any frame, which is why `side="top"`
          // never showed this). Computing the reference edge locally
          // instead — from the same `root` this observer itself was
          // configured with — guarantees the same coordinate frame as
          // `entry.boundingClientRect` (both relative to the sentinel's
          // own document) no matter how deep it's nested.
          const root = scrollContainerRef?.current;
          const rootRect = root
            ? root.getBoundingClientRect()
            : { top: 0, bottom: sentinel.ownerDocument.defaultView?.innerHeight ?? 0 };
          const stuck =
            side === "top"
              ? entry.boundingClientRect.top < rootRect.top
              : entry.boundingClientRect.bottom > rootRect.bottom;
          setIsStuck(stuck);
          onStickyChange?.(stuck);
        },
        { root: scrollContainerRef?.current ?? null, threshold: 0 },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [side, onStickyChange, scrollContainerRef]);

    const sentinel = (
      <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
    );

    const root = (
      <div
        ref={ref}
        {...props}
        // Always applied last (after `...props`) so they can never be
        // silently overridden by a same-named prop the caller passes —
        // confirmed exploitable before this fix: a consumer-supplied
        // `data-stuck` landed in `...props` (never destructured out
        // above) and silently won over the real computed stuck state,
        // the same bug class already fixed on Skeleton/ProgressBar/
        // ProgressCircle/Spinner/Button/IconButton/Checkbox/FieldError/
        // Input (`05-component-api-conventions.md` §3).
        data-stuck={isStuck || undefined}
        className={cx(styles.root, className)}
        style={{ [side]: `var(--dbm-space-${offset})`, ...style }}
      >
        {children}
      </div>
    );

    // Sentinel ordering mirrors which edge it needs to detect crossing:
    // for `side="top"`, it sits immediately *before* the sticky content
    // (so it leaves the viewport's top edge right as the content would);
    // for `side="bottom"`, immediately *after* (so it leaves the
    // viewport's bottom edge right as the content would, scrolling the
    // other direction).
    return side === "top" ? (
      <>
        {sentinel}
        {root}
      </>
    ) : (
      <>
        {root}
        {sentinel}
      </>
    );
  },
);

Affix.displayName = "Affix";
