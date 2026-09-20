import { cx } from "@dbm-design-system/primitives";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useRef, useState } from "react";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text";
import { Tooltip } from "../../atoms/Tooltip";
import styles from "./Slider.module.css";
import type { SliderProps, SliderSize } from "./Slider.types";

const sizeClass: Record<SliderSize, string | undefined> = {
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
 * A single-value slider built on Radix Slider, with a token-driven track,
 * range fill, and thumb. Accepts both controlled (`value`/`onValueChange`)
 * and uncontrolled (`defaultValue`) usage, mirroring Radix's own pattern —
 * as a plain number, not the array the underlying primitive uses
 * internally (that shape only matters once a slider has more than one
 * thumb). `onValueCommit` fires once, on release, distinct from
 * `onValueChange`'s continuous firing while dragging. `ref` forwards to the
 * slider's own root element; the accessible name/description/id all land
 * on the thumb instead — the actual `role="slider"` element assistive tech
 * inspects, not the plain layout wrapper around it.
 *
 * A vertical slider (`orientation="vertical"`) has no intrinsic height of
 * its own — set one explicitly via `style`/`className`. That explicit
 * height always applies to this component's own true outermost rendered
 * element, whichever one that ends up being once `showValue`/
 * `showMinMaxLabels` add their own wrapping layers — never to `Root`
 * directly once it's nested inside one of them, since a CSS percentage
 * height (e.g. `style={{ height: "100%" }}`) can only ever resolve against
 * an ancestor that itself has a real, definite height.
 *
 * @example
 * ```tsx
 * <Slider aria-label="Volume" defaultValue={50} />
 * <Slider aria-label="Brightness" value={value} onValueChange={setValue} min={0} max={10} />
 * <Slider aria-label="Price" onValueCommit={runExpensiveFilter} showValue />
 * <Slider aria-label="Opacity" orientation="vertical" style={{ height: "12rem" }} />
 * <Slider aria-label="Zoom" showTicks tickInterval={25} showMinMaxLabels showValueTooltip />
 * ```
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  (
    {
      size = "md",
      hasError = false,
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      inverted = false,
      showValue = false,
      showValueTooltip = false,
      showMinMaxLabels = false,
      formatNumber,
      showTicks = false,
      tickInterval = step,
      disabled,
      name,
      form,
      autoFocus,
      className,
      style,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-valuetext": ariaValueText,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(
      () => defaultValue ?? min,
    );
    const currentValue = isControlled ? value : uncontrolledValue;
    const isVertical = orientation === "vertical";

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !ariaLabel &&
        !ariaLabelledBy &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Slider: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech has something to announce. A slider with no label is invisible to screen reader users.",
        );
      }
    }

    // Tracks hover/press/focus on the thumb independently of Radix
    // Tooltip's own uncontrolled hover/focus timing — found necessary live
    // (user-reported): once a pointer-driven drag starts, Radix Tooltip's
    // own uncontrolled trigger treats the `pointerdown` as a dismiss signal
    // and closes, even though the pointer never actually leaves the thumb.
    // Only wired up (and only read) when `showValueTooltip` is set; declared
    // unconditionally regardless, since hooks can't be called conditionally.
    const [isThumbHovering, setIsThumbHovering] = useState(false);
    const [isThumbPressed, setIsThumbPressed] = useState(false);
    const [isThumbFocused, setIsThumbFocused] = useState(false);
    // Clicking the thumb genuinely leaves it DOM-focused afterward (real,
    // confirmed browser behavior, not a bug) — found live, user-reported,
    // that counting *any* focus as a reason to keep the tooltip open made
    // it linger after a click/drag ends, until something else stole focus.
    // `:focus-visible` looked like the obvious browser-native way to tell
    // "keyboard-driven focus" apart from that click residue, but jsdom's
    // own implementation doesn't actually distinguish the two (confirmed
    // directly: it matched after a plain `pointerdown`/`pointerup` too),
    // so it can't be verified this way — tracked explicitly instead, fully
    // testable regardless of environment: a `pointerdown` immediately
    // preceding a `focus` event marks that focus as click-driven, so it's
    // not counted; a `focus` with no immediately-preceding `pointerdown`
    // (Tab) still is.
    const wasPointerDownRef = useRef(false);
    const tooltipOpen = isThumbHovering || isThumbPressed || isThumbFocused;

    const handleValueChange = ([next]: number[]) => {
      if (next === undefined) return;
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    };

    const handleValueCommit = ([next]: number[]) => {
      if (next === undefined) return;
      onValueCommit?.(next);
    };

    // Ticks are purely decorative (`aria-hidden`) — the same information is
    // already exposed to assistive tech via `aria-valuemin`/`aria-valuemax`/
    // `step`. Computed inclusive of `max` even when the range doesn't
    // divide evenly by `tickInterval` (the last real step still gets a
    // tick, rather than silently being dropped) — then `min`/`max`
    // themselves are excluded from what actually renders: a tick sitting
    // exactly on top of the track's own rounded end (and, at `min`, right
    // underneath a value-0 thumb) added visual noise without conveying
    // anything the track's own boundary doesn't already show.
    const ticks: number[] = [];
    if (showTicks && tickInterval > 0) {
      for (let tickValue = min; tickValue < max; tickValue += tickInterval) {
        ticks.push(tickValue);
      }
      ticks.push(max);
    }
    const visibleTicks = ticks.filter(
      (tickValue) => tickValue !== min && tickValue !== max,
    );

    // Shared by both the tooltip and every `showValue` label below — found
    // during this component's final review pass that only the tooltip
    // preferred `ariaValueText` over the raw number, while `showValue`'s own
    // persistent label always showed the raw number regardless. A sighted
    // user with both set (e.g. `aria-valuetext="Medium"` on a 1-3 scale)
    // would see "2" in the permanent label but "Medium" in the tooltip —
    // inconsistent with each other and with what's announced to assistive
    // tech, which always gets `ariaValueText` when set.
    // With no `formatNumber` the number is written exactly as before (`String`); `aria-valuetext` still wins.
    const format = formatNumber ?? String;
    const displayValue = ariaValueText || format(currentValue);

    let thumb = (
      <SliderPrimitive.Thumb
        className={styles.thumb}
        id={id}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- a real, documented opt-in prop (same caveat as Input's/NumberInput's own autoFocus), not an accidental default; must be routed here rather than left in the outer `...props` spread since Thumb, not Root, is the actual focusable element.
        autoFocus={autoFocus}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        // Announce what is shown: the consumer's own text, else the formatted number, but only when a formatter
        // was given — without one the plain number is announced, as before.
        aria-valuetext={ariaValueText ?? (formatNumber ? format(currentValue) : undefined)}
        {...(showValueTooltip
          ? {
              onPointerEnter: () => setIsThumbHovering(true),
              onPointerLeave: () => setIsThumbHovering(false),
              onPointerDown: () => {
                wasPointerDownRef.current = true;
                setIsThumbPressed(true);
              },
              onPointerUp: () => setIsThumbPressed(false),
              onPointerCancel: () => setIsThumbPressed(false),
              onFocus: () => {
                if (!wasPointerDownRef.current) setIsThumbFocused(true);
              },
              onBlur: () => {
                setIsThumbFocused(false);
                wasPointerDownRef.current = false;
              },
            }
          : null)}
        // Applied last (after every other Thumb prop above) so a
        // same-named consumer prop can never silently override it — the
        // same JSX-ordering bug already found and fixed across a dozen
        // other components (05-component-api-conventions.md §3).
        aria-invalid={hasError || undefined}
      />
    );

    if (showValueTooltip) {
      thumb = (
        <Tooltip
          content={displayValue}
          side={isVertical ? "right" : "top"}
          // Controlled explicitly (see the state above) rather than left to
          // Tooltip's own uncontrolled hover/focus handling, specifically
          // so it stays open through a pointer drag, not just a plain
          // hover. `delayDuration` no longer has any effect once `open` is
          // controlled — harmless to leave set, since it costs nothing and
          // documents the original intent (no artificial delay) if this
          // ever reverts to uncontrolled.
          delayDuration={0}
          open={tooltipOpen}
        >
          {thumb}
        </Tooltip>
      );
    }

    // Whether *any* extra layout wrapping happens around Root for vertical
    // orientation — the one case where a CSS percentage height (whatever
    // the caller passed via `style`, e.g. `height: "100%"`) needs to
    // resolve against a real, definite height rather than an intermediate
    // wrapper with none of its own. Horizontal has no such concern (its
    // cross-axis sizing is just intrinsic content width), so `style` always
    // stays directly on Root there regardless of any wrapping.
    const verticalNeedsWrapper = isVertical && (showValue || showMinMaxLabels);

    let control = (
      <SliderPrimitive.Root
        ref={ref}
        {...props}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        inverted={inverted}
        disabled={disabled}
        name={name}
        form={form}
        value={[currentValue]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className={cx(
          styles.root,
          sizeClass[size],
          hasError && styles.error,
          className,
        )}
        // `undefined`, not `style`, whenever about to be wrapped for
        // vertical orientation (see `verticalNeedsWrapper` above and this
        // component's own top-level doc comment for the full reasoning) —
        // found live, not assumed, after an earlier version left `style` on
        // Root in this case and rendered a 0-height slider. Every wrapping
        // layer between the true outermost element and Root itself instead
        // gets a plain CSS `height: 100%` (see Slider.module.css), forming
        // an unbroken chain back down to a real height. Every other case
        // (horizontal, or vertical with no wrapping at all) is unaffected
        // and keeps receiving `style` directly, unchanged.
        style={verticalNeedsWrapper ? undefined : style}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
          {visibleTicks.map((tickValue) => {
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
        </SliderPrimitive.Track>
        {thumb}
      </SliderPrimitive.Root>
    );

    if (isVertical) {
      // `showMinMaxLabels`'s own wrapper is pure absolutely-positioned
      // overlays (see below) that add zero real height of their own, so it
      // wraps bare `Root` first, then `showValue` wraps that afterward —
      // safe since the box it stacks against still has the same real
      // height, min/max overlays or not.
      if (showMinMaxLabels) {
        control = (
          <span className={styles.minMaxWrapperVertical}>
            {control}
            <Text
              size="xs"
              color="tertiary"
              className={cx(styles.minMaxLabel, styles.minMaxLabelTop)}
            >
              {format(max)}
            </Text>
            <Text
              size="xs"
              color="tertiary"
              className={cx(styles.minMaxLabel, styles.minMaxLabelBottom)}
            >
              {format(min)}
            </Text>
          </span>
        );
      }
      if (showValue) {
        control = (
          <span className={cx(styles.wrapper, styles.wrapperVertical)}>
            {control}
            <Text
              size={valueTextSize[size]}
              color="secondary"
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
              {displayValue}
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
      control = (
        <span className={styles.combinedWrapper}>
          <span className={styles.combinedSlider}>{control}</span>
          <Text
            size={valueTextSize[size]}
            color="secondary"
            className={cx(styles.value, styles.combinedValue)}
          >
            {displayValue}
          </Text>
          <span className={cx(styles.minMaxRow, styles.combinedMinMaxRow)}>
            <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
              {format(min)}
            </Text>
            <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
              {format(max)}
            </Text>
          </span>
        </span>
      );
    } else if (showValue) {
      control = (
        <span className={styles.wrapper}>
          {control}
          <Text size={valueTextSize[size]} color="secondary" className={styles.value}>
            {displayValue}
          </Text>
        </span>
      );
    } else if (showMinMaxLabels) {
      control = (
        <span className={styles.minMaxWrapper}>
          {control}
          <span className={styles.minMaxRow}>
            <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
              {format(min)}
            </Text>
            <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
              {format(max)}
            </Text>
          </span>
        </span>
      );
    }

    if (verticalNeedsWrapper) {
      // The true outermost element (built above, however many layers deep)
      // gets the caller's real `style` — see the top-level doc comment.
      return (
        <span className={styles.verticalStyleHost} style={style}>
          {control}
        </span>
      );
    }

    return control;
  },
);

Slider.displayName = "Slider";
