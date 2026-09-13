import { CheckIcon, MinusIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef, useContext, useId, useRef } from "react";
import { Icon } from "../Icon";
import { CheckboxGroupContext } from "./CheckboxGroupContext";
import { CheckboxGroupSizeContext } from "./CheckboxGroupSizeContext";
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

const STANDALONE_VALUE_FALLBACK = "on";

/**
 * A tri-state checkbox (`true` / `false` / `"indeterminate"`) built on Radix
 * Checkbox, with a token-driven visual box and an optional inline label.
 * Accepts both controlled (`checked`/`onCheckedChange`) and uncontrolled
 * (`defaultChecked`) usage, mirroring Radix's own pattern. Composed inside a
 * `CheckboxGroup` instead, it participates in that shared group's own
 * multi-select `value`/`onValueChange` — pass a distinct `value` there to
 * identify this option, and inherits `size` from the group when it doesn't
 * set its own. `ref` forwards to the underlying `<button role="checkbox">`
 * in both cases.
 *
 * @example
 * ```tsx
 * <Checkbox defaultChecked>Accept terms</Checkbox>
 * <Checkbox checked="indeterminate">Select all</Checkbox>
 * <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Select row" />
 * <Checkbox hasError>Required field</Checkbox>
 * <Checkbox icon={StarIcon}>Favorite</Checkbox>
 * // Inside a CheckboxGroup:
 * <CheckboxGroup aria-label="Interests" defaultValue={["sports"]}>
 *   <Checkbox value="sports">Sports</Checkbox>
 *   <Checkbox value="music">Music</Checkbox>
 * </CheckboxGroup>
 * ```
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      size,
      hasError = false,
      disabled,
      className,
      children,
      checked,
      defaultChecked,
      onCheckedChange,
      value,
      name,
      form,
      icon = CheckIcon,
      indeterminateIcon = MinusIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const groupContext = useContext(CheckboxGroupContext);
    const isGrouped = groupContext !== undefined;
    const inheritedSize = useContext(CheckboxGroupSizeContext);
    const resolvedSize = size ?? inheritedSize ?? "md";
    const iconSize = iconSizeForCheckboxSize[resolvedSize];
    const itemValue = value ?? STANDALONE_VALUE_FALLBACK;
    const resolvedDisabled = isGrouped ? groupContext.disabled || disabled : disabled;

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
          "Checkbox: no accessible name — pass a visible label as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. A checkbox with no label is invisible to screen reader users.",
        );
      }
      if (
        isGrouped &&
        (checked !== undefined ||
          defaultChecked !== undefined ||
          onCheckedChange !== undefined) &&
        !hasWarnedStandaloneOnGroupedRef.current
      ) {
        hasWarnedStandaloneOnGroupedRef.current = true;
        console.warn(
          "Checkbox: `checked`/`defaultChecked`/`onCheckedChange` have no effect inside a `CheckboxGroup` — the group's own `value`/`onValueChange` controls which items are checked. Pass `value` on this `Checkbox` instead to identify it within the group.",
        );
      }
      if (isGrouped && value === undefined && !hasWarnedNoValueInGroupRef.current) {
        hasWarnedNoValueInGroupRef.current = true;
        console.warn(
          "Checkbox: rendered inside a `CheckboxGroup` with no `value` — every `Checkbox` in a group needs its own distinct `value` to identify which option it represents. Without one, every value-less `Checkbox` in the group shares the same fallback and can't be told apart.",
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
        checked={isGrouped ? groupContext.value.includes(itemValue) : checked}
        defaultChecked={isGrouped ? undefined : defaultChecked}
        onCheckedChange={
          isGrouped
            ? (next) => groupContext.onItemCheckedChange(itemValue, next === true)
            : onCheckedChange
        }
        disabled={resolvedDisabled}
        name={isGrouped ? (name ?? groupContext.name) : name}
        form={isGrouped ? (form ?? groupContext.form) : form}
        value={itemValue}
        aria-invalid={hasError || undefined}
        className={cx(
          styles.root,
          sizeClass[resolvedSize],
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
        className={cx(styles.label, resolvedDisabled && styles.labelDisabled)}
      >
        {control}
        <span className={styles.labelText}>{children}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
