import { cx } from "@dbm-design-system/primitives";
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text";
import styles from "./Slider.module.css";
import type { SliderSize } from "./Slider.types";

/*
 * Internals shared by `Slider` and `RangeSlider` — not exported from the
 * package. Everything here is what the two components must do identically
 * (size classes, the value-label / min-max-label / vertical-wrapper layout,
 * tick marks, and the thumb-tooltip open state), so a layout fix lands in
 * one place. The styles they read live in `Slider.module.css`, which
 * `RangeSlider` imports directly.
 */

export const sliderSizeClass: Record<SliderSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The `showValue` label's own font size, scaled by the slider's `size` — a
// fixed "sm" regardless of size read fine at xs/sm/md (user-confirmed), but
// looked disproportionately small next to lg/xl's own larger thumb and
// thicker track (24px/32px). xs/sm/md deliberately unchanged; lg/xl step up
// one and two Text sizes respectively, matching how their own thumb
// diameters (24px, 32px) each step further ahead of md's own 20px.
const valueTextSize: Record<SliderSize, TextSize> = {
  xs: "sm",
  sm: "sm",
  md: "sm",
  lg: "base",
  xl: "md",
};

/**
 * Tracks hover/press/focus on one thumb independently of Radix Tooltip's own
 * uncontrolled hover/focus timing — found necessary live (user-reported):
 * once a pointer-driven drag starts, Radix Tooltip's own uncontrolled
 * trigger treats the `pointerdown` as a dismiss signal and closes, even
 * though the pointer never actually leaves the thumb. Only wired up (and
 * only read) when `enabled`; the hooks run regardless, since hooks can't be
 * called conditionally.
 *
 * Clicking the thumb genuinely leaves it DOM-focused afterward (real,
 * confirmed browser behavior, not a bug) — found live, user-reported, that
 * counting *any* focus as a reason to keep the tooltip open made it linger
 * after a click/drag ends, until something else stole focus. `:focus-visible`
 * looked like the obvious browser-native way to tell "keyboard-driven focus"
 * apart from that click residue, but jsdom's own implementation doesn't
 * actually distinguish the two (confirmed directly: it matched after a plain
 * `pointerdown`/`pointerup` too), so it can't be verified this way —
 * tracked explicitly instead, fully testable regardless of environment: a
 * `pointerdown` immediately preceding a `focus` event marks that focus as
 * click-driven, so it's not counted; a `focus` with no immediately-preceding
 * `pointerdown` (Tab) still is.
 */
export function useThumbTooltip(enabled: boolean) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wasPointerDownRef = useRef(false);

  const thumbProps = enabled
    ? {
        onPointerEnter: () => setIsHovering(true),
        onPointerLeave: () => setIsHovering(false),
        onPointerDown: () => {
          wasPointerDownRef.current = true;
          setIsPressed(true);
        },
        onPointerUp: () => setIsPressed(false),
        onPointerCancel: () => setIsPressed(false),
        onFocus: () => {
          if (!wasPointerDownRef.current) setIsFocused(true);
        },
        onBlur: () => {
          setIsFocused(false);
          wasPointerDownRef.current = false;
        },
      }
    : null;

  return { open: isHovering || isPressed || isFocused, thumbProps };
}

/**
 * The tick positions that actually render. Ticks are purely decorative
 * (`aria-hidden`) — the same information is already exposed to assistive
 * tech via `aria-valuemin`/`aria-valuemax`/`step`. Computed inclusive of
 * `max` even when the range doesn't divide evenly by `tickInterval` (the
 * last real step still gets a tick, rather than silently being dropped) —
 * then `min`/`max` themselves are excluded from what actually renders: a
 * tick sitting exactly on top of the track's own rounded end (and, at
 * `min`, right underneath a value-0 thumb) added visual noise without
 * conveying anything the track's own boundary doesn't already show.
 */
export function visibleTickValues(
  showTicks: boolean,
  min: number,
  max: number,
  tickInterval: number,
): number[] {
  const ticks: number[] = [];
  if (showTicks && tickInterval > 0) {
    for (let tickValue = min; tickValue < max; tickValue += tickInterval) {
      ticks.push(tickValue);
    }
    ticks.push(max);
  }
  return ticks.filter((tickValue) => tickValue !== min && tickValue !== max);
}

interface SliderTicksProps {
  values: number[];
  min: number;
  max: number;
  inverted: boolean;
  isVertical: boolean;
}

/** The decorative tick marks, positioned along the track. */
export function SliderTicks({
  values,
  min,
  max,
  inverted,
  isVertical,
}: SliderTicksProps) {
  return (
    <>
      {values.map((tickValue) => {
        let percent = ((tickValue - min) / (max - min)) * 100;
        if (inverted) percent = 100 - percent;
        return (
          <span
            key={tickValue}
            aria-hidden="true"
            className={styles.tick}
            style={
              isVertical
                ? { insetBlockEnd: `${percent}%` }
                : { insetInlineStart: `${percent}%` }
            }
          />
        );
      })}
    </>
  );
}

/**
 * Whether *any* extra layout wrapping happens around Root for vertical
 * orientation — the one case where a CSS percentage height (whatever the
 * caller passed via `style`, e.g. `height: "100%"`) needs to resolve against
 * a real, definite height rather than an intermediate wrapper with none of
 * its own. Horizontal has no such concern (its cross-axis sizing is just
 * intrinsic content width), so `style` always stays directly on Root there
 * regardless of any wrapping. When this is true, Root gets `undefined`
 * instead of `style` and `SliderLayout` puts the real `style` on the true
 * outermost element — found live, not assumed, after an earlier version
 * left `style` on Root and rendered a 0-height slider.
 */
export function needsVerticalWrapper(
  isVertical: boolean,
  showValue: boolean,
  showMinMaxLabels: boolean,
): boolean {
  return isVertical && (showValue || showMinMaxLabels);
}

/**
 * The numbers a slider's value can be widest at: the two ends, and one step in
 * from each (a step of 0.01 makes 0.99 wider than the end 1). The `showValue`
 * label reserves the width of the widest once they are written.
 */
export function widestValueCandidates(min: number, max: number, step: number): number[] {
  const decimals = (String(step).split(".")[1] ?? "").length;
  const round = (n: number) => Number(n.toFixed(decimals));
  return [min, max, round(Math.min(max, min + step)), round(Math.max(min, max - step))];
}

interface SliderLayoutProps {
  /** The Radix `Root` element (with its track, range and thumb(s)). */
  control: ReactNode;
  size: SliderSize;
  isVertical: boolean;
  showValue: boolean;
  showMinMaxLabels: boolean;
  /** The text of the `showValue` label. */
  valueText: string;
  /**
   * Every text the `showValue` label can show, or the widest of them: the label
   * reserves the width of the widest, so it never changes size as the value
   * does (see `valueSizer`).
   */
  valueSizer: string[];
  minText: string;
  maxText: string;
  /** The caller's `style`, applied to the true outermost element when wrapping vertically. */
  style: CSSProperties | undefined;
}

/**
 * Wraps the control in whichever of the `showValue` / `showMinMaxLabels`
 * layouts apply. Each of the six layouts below exists because a simpler one
 * was tried and failed live — the reasons are on each branch.
 */
export function SliderLayout({
  control,
  size,
  isVertical,
  showValue,
  showMinMaxLabels,
  valueText,
  valueSizer,
  minText,
  maxText,
  style,
}: SliderLayoutProps) {
  let result = control;
  // Read by `.value::before` in the stylesheet, which lays the lines out
  // invisibly so the label is always as wide as the widest of them. Without
  // it the label is as wide as its text, so a value going from 99 to 100 gives
  // the track 8px less (horizontal), or shifts the whole column sideways as
  // the wider label re-centres it (vertical).
  const sizer = valueSizer.join("\n");

  if (isVertical) {
    // `showMinMaxLabels`'s own wrapper is pure absolutely-positioned
    // overlays (see below) that add zero real height of their own, so it
    // wraps bare `Root` first, then `showValue` wraps that afterward —
    // safe since the box it stacks against still has the same real
    // height, min/max overlays or not.
    if (showMinMaxLabels) {
      result = (
        <span className={styles.minMaxWrapperVertical}>
          {result}
          <Text
            size="xs"
            color="tertiary"
            className={cx(styles.minMaxLabel, styles.minMaxLabelTop)}
          >
            {maxText}
          </Text>
          <Text
            size="xs"
            color="tertiary"
            className={cx(styles.minMaxLabel, styles.minMaxLabelBottom)}
          >
            {minText}
          </Text>
        </span>
      );
    }
    if (showValue) {
      result = (
        <span className={cx(styles.wrapper, styles.wrapperVertical)}>
          {result}
          <Text
            size={valueTextSize[size]}
            color="secondary"
            data-sizer={sizer}
            // `showMinMaxLabels`'s own "min" overlay hangs below `Root`'s
            // real box (it consumes no normal-flow space of its own — see
            // above), so this row's ordinary `gap` alone doesn't know to
            // clear it — found live, user-reported (the value visibly
            // overlapped the min label). Extra top margin only added when
            // that overlay actually exists.
            className={cx(
              styles.value,
              showMinMaxLabels && styles.valueClearsMinMaxOverlay,
            )}
          >
            {valueText}
          </Text>
        </span>
      );
    }
  } else if (showValue && showMinMaxLabels) {
    // Both together, horizontal: a dedicated CSS Grid layout, not the
    // same nested-flex approach the single-feature cases below use.
    // Found live, user-reported: nesting `showValue`'s row inside (or
    // outside) `showMinMaxLabels`'s column always sized the min/max row
    // against the *combined* [slider + value label] width, misaligning
    // `max` with the value label instead of the slider's own end. Grid
    // placement instead puts the slider and the min/max row in the same
    // column — sized to the slider alone — independent of however wide
    // the value label in the adjacent column happens to be.
    result = (
      <span className={styles.combinedWrapper}>
        <span className={styles.combinedSlider}>{result}</span>
        <Text
          size={valueTextSize[size]}
          color="secondary"
          data-sizer={sizer}
          className={cx(styles.value, styles.combinedValue)}
        >
          {valueText}
        </Text>
        <span className={cx(styles.minMaxRow, styles.combinedMinMaxRow)}>
          <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
            {minText}
          </Text>
          <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
            {maxText}
          </Text>
        </span>
      </span>
    );
  } else if (showValue) {
    result = (
      <span className={styles.wrapper}>
        {result}
        <Text size={valueTextSize[size]} color="secondary" data-sizer={sizer} className={styles.value}>
          {valueText}
        </Text>
      </span>
    );
  } else if (showMinMaxLabels) {
    result = (
      <span className={styles.minMaxWrapper}>
        {result}
        <span className={styles.minMaxRow}>
          <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
            {minText}
          </Text>
          <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
            {maxText}
          </Text>
        </span>
      </span>
    );
  }

  if (needsVerticalWrapper(isVertical, showValue, showMinMaxLabels)) {
    // The true outermost element (built above, however many layers deep)
    // gets the caller's real `style`.
    return (
      <span className={styles.verticalStyleHost} style={style}>
        {result}
      </span>
    );
  }

  return result;
}
