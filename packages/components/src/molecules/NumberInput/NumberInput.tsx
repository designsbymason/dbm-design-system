import { CaretDownIcon, CaretUpIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Input } from "../../atoms/Input";
import type { InputSize } from "../../atoms/Input";
import styles from "./NumberInput.module.css";
import type { NumberInputProps } from "./NumberInput.types";

const stepperIconSizeForInputSize: Record<InputSize, "xs" | "sm"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "sm",
};

const stepperSizeClass: Record<InputSize, string | undefined> = {
  xs: styles.stepperXs,
  sm: styles.stepperSm,
  md: styles.stepperMd,
  lg: styles.stepperLg,
  xl: styles.stepperXl,
};

// The number of decimal places `step` implies (e.g. `0.1` → 1, `0.25` → 2,
// `1` → 0) — used to round stepped values back to a clean number, since
// repeated floating-point addition/subtraction (`0.1 + 0.2`) drifts to
// values like `0.30000000000000004` otherwise.
function decimalPlacesOf(step: number): number {
  const str = String(step);
  const dot = str.indexOf(".");
  return dot === -1 ? 0 : str.length - dot - 1;
}

/**
 * A number input with increment/decrement stepper buttons, wrapping
 * `Input`. Works with real numbers throughout — `value`/`defaultValue`/
 * `onValueChange` are all typed `number`, not strings to parse yourself —
 * while the raw native `onChange` (string-based, firing only on direct
 * typing) is still available for anyone who needs it. `min`/`max` bound
 * the stepper buttons (each disables once the value reaches that edge) and
 * pass straight through as native HTML5 validation attributes; typing
 * itself isn't force-clamped, matching a native `<input type="number">`'s
 * own unopinionated behavior. `ref` forwards to the native `<input>`
 * element, same as `Input`'s own.
 *
 * @example
 * ```tsx
 * <NumberInput defaultValue={1} min={0} max={10} />
 * <NumberInput value={quantity} onValueChange={setQuantity} step={0.5} />
 * <NumberInput hasError min={0} />
 * ```
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      size = "md",
      value,
      defaultValue,
      onValueChange,
      onChange,
      min,
      max,
      step = 1,
      onClear,
      disabled,
      readOnly,
      className,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const effectiveValue = isControlled ? value : uncontrolledValue;

    const commit = (next: number | undefined) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    };

    const clamp = (next: number) => {
      let result = next;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      const decimals = decimalPlacesOf(step);
      return decimals === 0 ? result : Number(result.toFixed(decimals));
    };

    const handleStep = (direction: 1 | -1) => {
      const base = effectiveValue ?? (direction === 1 ? (min ?? 0) : (max ?? 0));
      commit(clamp(base + direction * step));
      inputRef.current?.focus();
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const parsed = raw === "" ? undefined : Number(raw);
      commit(parsed === undefined || Number.isNaN(parsed) ? undefined : parsed);
      onChange?.(event);
    };

    // Unlike `Input`'s own `onClear` — a bare notification with no value of
    // its own to clear — `NumberInput` tracks its own value (controlled or
    // not), so the clear button needs to actually reset it via `commit`,
    // the same path the stepper buttons and typing both already go
    // through. Passing `onClear` straight through to `Input` (the original
    // implementation) only ever fired the caller's own callback: it never
    // touched `uncontrolledValue`, so an uncontrolled field's displayed
    // value silently stayed put after a "successful" clear — found during
    // this component's own final review pass, since neither the unit test
    // nor the interaction story for this button asserted the value
    // actually changed, only that the callback fired.
    const handleClear = () => {
      commit(undefined);
      onClear?.();
    };

    const stepperDisabled = disabled || readOnly;
    const incrementDisabled =
      stepperDisabled ||
      (max !== undefined && effectiveValue !== undefined && effectiveValue >= max);
    const decrementDisabled =
      stepperDisabled ||
      (min !== undefined && effectiveValue !== undefined && effectiveValue <= min);

    return (
      <Input
        ref={mergeRefs(ref, inputRef)}
        {...props}
        type="number"
        size={size}
        disabled={disabled}
        readOnly={readOnly}
        value={effectiveValue === undefined ? "" : String(effectiveValue)}
        onChange={handleChange}
        onClear={onClear ? handleClear : undefined}
        min={min}
        max={max}
        step={step}
        className={cx(styles.wrapper, className)}
        suffix={
          <div className={cx(styles.stepper, stepperSizeClass[size])}>
            <button
              type="button"
              aria-label="Increase value"
              disabled={incrementDisabled}
              className={styles.stepperButton}
              onClick={() => handleStep(1)}
            >
              <Icon icon={CaretUpIcon} size={stepperIconSizeForInputSize[size]} />
            </button>
            <button
              type="button"
              aria-label="Decrease value"
              disabled={decrementDisabled}
              className={styles.stepperButton}
              onClick={() => handleStep(-1)}
            >
              <Icon icon={CaretDownIcon} size={stepperIconSizeForInputSize[size]} />
            </button>
          </div>
        }
      />
    );
  },
);

NumberInput.displayName = "NumberInput";
