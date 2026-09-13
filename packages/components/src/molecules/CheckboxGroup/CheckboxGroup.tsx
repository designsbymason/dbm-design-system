import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import { CheckboxGroupContext } from "../../atoms/Checkbox/CheckboxGroupContext";
import { CheckboxGroupSizeContext } from "../../atoms/Checkbox/CheckboxGroupSizeContext";
import styles from "./CheckboxGroup.module.css";
import type {
  CheckboxGroupOrientation,
  CheckboxGroupProps,
} from "./CheckboxGroup.types";

const orientationClass: Record<CheckboxGroupOrientation, string | undefined> = {
  vertical: styles.orientationVertical,
  horizontal: styles.orientationHorizontal,
};

/**
 * Manages a group of `Checkbox` options sharing one multi-select array of
 * checked values. Radix has no group primitive for checkboxes — each
 * `Checkbox` is already a fully standalone primitive — so this component
 * implements the array coordination itself via `CheckboxGroupContext`,
 * mirroring `RadioGroup`'s own composition pattern. Pass a distinct `value`
 * on each `Checkbox` child to identify it. Accepts both controlled
 * (`value`/`onValueChange`) and uncontrolled (`defaultValue`) usage. `ref`
 * forwards to the underlying `<div role="group">`.
 *
 * @example
 * ```tsx
 * <CheckboxGroup aria-label="Interests" defaultValue={["sports"]}>
 *   <Checkbox value="sports">Sports</Checkbox>
 *   <Checkbox value="music">Music</Checkbox>
 * </CheckboxGroup>
 * <CheckboxGroup
 *   aria-label="Interests"
 *   value={interests}
 *   onValueChange={setInterests}
 *   orientation="horizontal"
 * >
 *   <Checkbox value="sports">Sports</Checkbox>
 *   <Checkbox value="music">Music</Checkbox>
 * </CheckboxGroup>
 * <CheckboxGroup aria-label="Interests" size="sm" defaultValue={["sports"]}>
 *   <Checkbox value="sports">Sports</Checkbox>
 *   <Checkbox value="music">Music</Checkbox>
 * </CheckboxGroup>
 * ```
 */
export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      children,
      size,
      value,
      defaultValue,
      onValueChange,
      hasError = false,
      disabled = false,
      name,
      form,
      orientation = "vertical",
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(
      () => defaultValue ?? [],
    );
    const effectiveValue = isControlled ? value : uncontrolledValue;

    const handleItemCheckedChange = (itemValue: string, checked: boolean) => {
      const next = checked
        ? effectiveValue.includes(itemValue)
          ? effectiveValue
          : [...effectiveValue, itemValue]
        : effectiveValue.filter((v) => v !== itemValue);
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    };

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "CheckboxGroup: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech announces what this group of options represents. A group with no accessible name is confusing for screen reader users.",
        );
      }
    }

    return (
      <div
        ref={ref}
        role="group"
        {...props}
        id={id}
        className={cx(
          styles.root,
          orientationClass[orientation],
          hasError && styles.error,
          className,
        )}
      >
        <CheckboxGroupContext.Provider
          value={{
            value: effectiveValue,
            onItemCheckedChange: handleItemCheckedChange,
            disabled,
            name,
            form,
          }}
        >
          <CheckboxGroupSizeContext.Provider value={size}>
            {children}
          </CheckboxGroupSizeContext.Provider>
        </CheckboxGroupContext.Provider>
      </div>
    );
  },
);

CheckboxGroup.displayName = "CheckboxGroup";
