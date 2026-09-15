import { cx } from "@dbm-design-system/primitives";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useRef, useState } from "react";
import { Text } from "../../atoms/Text";
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
    // `step`. Computed inclusive of both `min` and `max`, even when the
    // range doesn't divide evenly by `tickInterval` (the last real step
    // still gets a tick, at `max`, rather than silently being dropped).
    const ticks: number[] = [];
    if (showTicks && tickInterval > 0) {
      for (let tickValue = min; tickValue < max; tickValue += tickInterval) {
        ticks.push(tickValue);
      }
      ticks.push(max);
    }

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
        aria-valuetext={ariaValueText}
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
          content={ariaValueText || currentValue}
          side={isVertical ? "right" : "top"}
          // Standalone tooltips default to a 400ms hover delay, tuned for
          // discoverability hints — wrong for a value readout that should
          // track the drag immediately, so this opens as soon as the
          // thumb is hovered/focused, not after a pause.
          delayDuration={0}
        >
          {thumb}
        </Tooltip>
      );
    }

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
        // `undefined`, not `style`, specifically when about to be wrapped
        // in `.minMaxWrapperVertical` below — a CSS percentage height only
        // resolves against an ancestor with an *explicit* height, and that
        // wrapper has none of its own (by design: it shrink-wraps to
        // Root's real rendered size). Passing `style` (e.g. `height:
        // "100%"`) to Root in that case would compute against nothing and
        // collapse to 0 — found live, not assumed, when the first version
        // of this rendered a 0-height slider. The wrapper gets the real
        // explicit height instead, in that one case only; every other case
        // (no wrapper at all) is unaffected and keeps receiving `style`
        // directly, unchanged.
        style={isVertical && showMinMaxLabels ? undefined : style}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
          {ticks.map((tickValue) => {
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

    if (showMinMaxLabels) {
      if (isVertical) {
        // Absolutely positioned overlays anchored to this wrapper's own
        // box. The wrapper (not Root — see the `style` comment above)
        // carries the caller's real explicit height, so Root's own
        // existing `height: 100%` CSS resolves against a genuine, definite
        // height instead of an ancestor with none of its own.
        control = (
          <span className={styles.minMaxWrapperVertical} style={style}>
            {control}
            <Text
              size="xs"
              color="tertiary"
              className={cx(styles.minMaxLabel, styles.minMaxLabelTop)}
            >
              {max}
            </Text>
            <Text
              size="xs"
              color="tertiary"
              className={cx(styles.minMaxLabel, styles.minMaxLabelBottom)}
            >
              {min}
            </Text>
          </span>
        );
      } else {
        control = (
          <span className={styles.minMaxWrapper}>
            {control}
            <span className={styles.minMaxRow}>
              <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
                {min}
              </Text>
              <Text size="xs" color="tertiary" className={styles.minMaxLabel}>
                {max}
              </Text>
            </span>
          </span>
        );
      }
    }

    if (!showValue) return control;

    return (
      <span
        className={cx(styles.wrapper, isVertical && styles.wrapperVertical)}
      >
        {control}
        <Text size="sm" color="secondary" className={styles.value}>
          {currentValue}
        </Text>
      </span>
    );
  },
);

Slider.displayName = "Slider";
