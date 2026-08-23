import { CheckIcon, MinusIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef, useId, useRef } from "react";
import { Icon } from "../Icon";
import styles from "./Checkbox.module.css";
import type { CheckboxProps, CheckboxSize } from "./Checkbox.types";

const sizeClass: Record<CheckboxSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForCheckboxSize: Record<CheckboxSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "md",
};

/**
 * A tri-state checkbox (`true` / `false` / `"indeterminate"`) built on Radix
 * Checkbox, with a token-driven visual box and an optional inline label.
 * Accepts both controlled (`checked`/`onCheckedChange`) and uncontrolled
 * (`defaultChecked`) usage, mirroring Radix's own pattern. `ref` forwards to
 * the underlying `<button role="checkbox">`.
 *
 * @example
 * ```tsx
 * <Checkbox defaultChecked>Accept terms</Checkbox>
 * <Checkbox checked="indeterminate">Select all</Checkbox>
 * <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Select row" />
 * <Checkbox hasError>Required field</Checkbox>
 * <Checkbox icon={StarIcon}>Favorite</Checkbox>
 * ```
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
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
      icon = CheckIcon,
      indeterminateIcon = MinusIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const iconSize = iconSizeForCheckboxSize[size];

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !children &&
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Checkbox: no accessible name — pass a visible label as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. A checkbox with no label is invisible to screen reader users.",
        );
      }
    }

    const control = (
      <CheckboxPrimitive.Root
        ref={ref}
        {...props}
        // These are always applied last (after `...props`) so they can
        // never be silently overridden by a same-named prop the caller
        // passes — including `aria-invalid`, which TypeScript's JSX
        // checker permits on any component regardless of whether it's
        // declared in its prop type (same confirmed bug class already
        // fixed on Button/Skeleton/ProgressBar/ProgressCircle/Spinner).
        id={checkboxId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        className={cx(
          styles.root,
          sizeClass[size],
          hasError && styles.error,
          className,
        )}
      >
        <CheckboxPrimitive.Indicator className={styles.indicator}>
          <Icon icon={icon} size={iconSize} className={styles.checkIcon} />
          <Icon
            icon={indeterminateIcon}
            size={iconSize}
            className={styles.minusIcon}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!children) return control;

    return (
      <label
        htmlFor={checkboxId}
        className={cx(styles.label, disabled && styles.labelDisabled)}
      >
        {control}
        <span className={styles.labelText}>{children}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
