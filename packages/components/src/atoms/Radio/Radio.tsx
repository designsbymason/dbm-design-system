import { cx } from "@dbm-design-system/primitives";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { forwardRef, useContext, useId, useRef } from "react";
import styles from "./Radio.module.css";
import { RadioGroupContext } from "./RadioGroupContext";
import type { RadioProps, RadioSize } from "./Radio.types";

const sizeClass: Record<RadioSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const STANDALONE_VALUE_FALLBACK = "on";

/**
 * A single radio input built on Radix UI's RadioGroup primitive (Radix has
 * no standalone single-radio primitive — only a Root + Item + Indicator
 * group), with a token-driven visual circle and an optional inline label.
 *
 * Functions correctly on its own: with no `RadioGroup` ancestor, it
 * silently wraps itself in a private, single-item Radix group so it still
 * gets real keyboard/ARIA radio behavior standalone, exposed as a boolean
 * `checked`/`defaultChecked`/`onCheckedChange` API mirroring `Checkbox`.
 * Composed inside a `RadioGroup` instead, it participates in that shared
 * group's own `value`/`onValueChange` — pass a distinct `value` there to
 * identify this option among its siblings. `ref` forwards to the
 * underlying `<button role="radio">` in both cases.
 *
 * @example
 * ```tsx
 * <Radio defaultChecked>Email</Radio>
 * <Radio checked={checked} onCheckedChange={setChecked} aria-label="Enable feature" />
 * <Radio hasError>Required field</Radio>
 * // Inside a RadioGroup:
 * <RadioGroup defaultValue="email">
 *   <Radio value="email">Email</Radio>
 *   <Radio value="sms">SMS</Radio>
 * </RadioGroup>
 * ```
 */
export const Radio = forwardRef<HTMLButtonElement, RadioProps>(
  (
    {
      size = "md",
      hasError = false,
      disabled,
      className,
      children,
      checked,
      defaultChecked,
      onCheckedChange,
      value,
      id,
      name,
      required,
      form,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;
    const isGrouped = useContext(RadioGroupContext);
    const itemValue = value ?? STANDALONE_VALUE_FALLBACK;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedStandaloneOnGroupedRef = useRef(false);
    const hasWarnedNoValueInGroupRef = useRef(false);

    if (process.env.NODE_ENV !== "production") {
      if (
        !children &&
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Radio: no accessible name — pass a visible label as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. A radio with no label is invisible to screen reader users.",
        );
      }
      if (
        isGrouped &&
        (checked !== undefined ||
          defaultChecked !== undefined ||
          onCheckedChange !== undefined ||
          name !== undefined ||
          required !== undefined ||
          form !== undefined) &&
        !hasWarnedStandaloneOnGroupedRef.current
      ) {
        hasWarnedStandaloneOnGroupedRef.current = true;
        console.warn(
          "Radio: `checked`/`defaultChecked`/`onCheckedChange`/`name`/`required`/`form` have no effect inside a `RadioGroup` — the group itself owns all of these. Pass `value` on this `Radio` instead to identify it within the group.",
        );
      }
      if (isGrouped && value === undefined && !hasWarnedNoValueInGroupRef.current) {
        hasWarnedNoValueInGroupRef.current = true;
        console.warn(
          "Radio: rendered inside a `RadioGroup` with no `value` — every `Radio` in a group needs its own distinct `value` to identify which option it represents.",
        );
      }
    }

    const item = (
      <RadioGroupPrimitive.Item
        ref={ref}
        {...props}
        id={radioId}
        value={itemValue}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        className={cx(
          styles.root,
          sizeClass[size],
          hasError && styles.error,
          className,
        )}
      >
        <RadioGroupPrimitive.Indicator className={styles.indicator} />
      </RadioGroupPrimitive.Item>
    );

    const control = isGrouped ? (
      item
    ) : (
      <RadioGroupPrimitive.Root
        className={styles.standaloneRoot}
        name={name}
        form={form}
        required={required}
        value={checked === undefined ? undefined : checked ? itemValue : null}
        defaultValue={defaultChecked ? itemValue : undefined}
        onValueChange={(next) => onCheckedChange?.(next === itemValue)}
      >
        {item}
      </RadioGroupPrimitive.Root>
    );

    if (!children) return control;

    return (
      <label
        htmlFor={radioId}
        className={cx(styles.label, disabled && styles.labelDisabled)}
      >
        {control}
        <span className={styles.labelText}>{children}</span>
      </label>
    );
  },
);

Radio.displayName = "Radio";
