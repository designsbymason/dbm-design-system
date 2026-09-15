import { cx } from "@dbm-design-system/primitives";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useRef, useState } from "react";
import { Text } from "../../atoms/Text";
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

    const control = (
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
        style={style}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
        </SliderPrimitive.Track>
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
      </SliderPrimitive.Root>
    );

    if (!showValue) return control;

    return (
      <span
        className={cx(
          styles.wrapper,
          orientation === "vertical" && styles.wrapperVertical,
        )}
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
