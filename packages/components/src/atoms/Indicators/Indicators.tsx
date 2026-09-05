import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./Indicators.module.css";
import type { IndicatorsProps, IndicatorsSize } from "./Indicators.types";

const defaultGetLabel = (index: number) => `Go to slide ${index + 1}`;

const sizeClass: Record<IndicatorsSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A row (or column) of clickable dots showing position within a fixed-size
 * sequence — `Carousel`/`ImageViewer`'s position indicator, direct-
 * navigable. Fully controlled (`activeIndex`/`onIndexChange`); supports
 * Arrow/Home/End keys with a roving tabindex (only the active dot is in
 * tab order), moving focus to the newly active dot only if focus was
 * already inside the group — so an external autoplay/next-button change
 * never steals focus.
 *
 * @example
 * ```tsx
 * <Indicators count={5} activeIndex={index} onIndexChange={setIndex} />
 * <Indicators count={5} activeIndex={index} onIndexChange={setIndex} orientation="vertical" />
 * ```
 */
export const Indicators = forwardRef<HTMLDivElement, IndicatorsProps>(
  (
    {
      count,
      size = "md",
      orientation = "horizontal",
      activeIndex,
      onIndexChange,
      getLabel = defaultGetLabel,
      className,
      "aria-label": ariaLabel = "Slide navigation",
      ...props
    },
    ref,
  ) => {
    const isVertical = orientation === "vertical";
    const rootRef = useRef<HTMLDivElement>(null);

    const hasWarnedOutOfRangeRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        (activeIndex < 0 || activeIndex >= count) &&
        !hasWarnedOutOfRangeRef.current
      ) {
        hasWarnedOutOfRangeRef.current = true;
        console.warn(
          `Indicators: \`activeIndex\` (${activeIndex}) is out of range for \`count\` (${count}) — no dot will match, so none will be focusable via Tab. Pass a value between 0 and ${count - 1}.`,
        );
      }
    }

    useEffect(() => {
      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement)) return;
      const activeButton = root.querySelector<HTMLButtonElement>(
        `[data-index="${activeIndex}"]`,
      );
      if (activeButton && activeButton !== document.activeElement) {
        activeButton.focus();
      }
    }, [activeIndex]);

    // Attached per-button (an interactive element) rather than on the
    // `role="group"` container, so each dot's own arrow/Home/End handling
    // is self-contained — still the same roving-tabindex composite-widget
    // pattern, just without a listener sitting on a non-interactive parent.
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    const previousKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === nextKey) {
        event.preventDefault();
        onIndexChange((activeIndex + 1) % count);
      } else if (event.key === previousKey) {
        event.preventDefault();
        onIndexChange((activeIndex - 1 + count) % count);
      } else if (event.key === "Home") {
        event.preventDefault();
        onIndexChange(0);
      } else if (event.key === "End") {
        event.preventDefault();
        onIndexChange(count - 1);
      }
    };

    return (
      <div
        ref={mergeRefs(ref, rootRef)}
        className={cx(
          styles.root,
          sizeClass[size],
          isVertical && styles.vertical,
          className,
        )}
        {...props}
        role="group"
        aria-label={ariaLabel}
      >
        {Array.from({ length: count }, (_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              // Fixed-size positional sequence (slide 0..count-1) that
              // never reorders — index is a stable, correct identity here.
              key={index}
              type="button"
              data-index={index}
              aria-label={getLabel(index)}
              aria-current={isActive || undefined}
              tabIndex={isActive ? 0 : -1}
              className={cx(styles.dot, isActive && styles.active)}
              onClick={() => onIndexChange(index)}
              onKeyDown={handleKeyDown}
            />
          );
        })}
      </div>
    );
  },
);

Indicators.displayName = "Indicators";
