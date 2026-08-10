import { CaretDownIcon, CheckIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import * as SelectPrimitive from "@radix-ui/react-select";
import { forwardRef, useId } from "react";
import { Icon } from "../../atoms/Icon";
import styles from "./Select.module.css";
import type { SelectOptionProps, SelectProps, SelectSize } from "./Select.types";

const sizeClass: Record<SelectSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A single-value select built on Radix Select, styled to match `Input`'s
 * resting/focus/error chrome so the two read as the same form-field
 * family. Accepts both controlled (`value`/`onValueChange`) and
 * uncontrolled (`defaultValue`) usage, mirroring Radix's own pattern.
 * Options are declared as children via `Select.Option`, not a flat
 * `options` array — matches Radix's own compositional idiom and leaves
 * room for grouped options later without a breaking API change. `ref`
 * forwards to the underlying `<button>` trigger; all other native button
 * attributes (`aria-label`, `data-testid`, etc.) pass through to it too.
 *
 * @example
 * ```tsx
 * <Select aria-label="Variant" placeholder="Choose a variant" value={variant} onValueChange={setVariant}>
 *   <Select.Option value="primary">Primary</Select.Option>
 *   <Select.Option value="secondary">Secondary</Select.Option>
 * </Select>
 * <Select aria-label="Size" defaultValue="md" size="sm" hasError>
 *   <Select.Option value="sm">Small</Select.Option>
 *   <Select.Option value="md">Medium</Select.Option>
 * </Select>
 * ```
 */
const SelectRoot = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      size = "md",
      hasError = false,
      disabled,
      placeholder,
      className,
      children,
      value,
      defaultValue,
      onValueChange,
      name,
      required,
      open,
      defaultOpen,
      onOpenChange,
      dir,
      form,
      autoComplete,
      id,
      ...triggerProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        required={required}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        dir={dir}
        form={form}
        autoComplete={autoComplete}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={selectId}
          aria-invalid={hasError || undefined}
          className={cx(
            styles.trigger,
            sizeClass[size],
            hasError && styles.error,
            className,
          )}
          {...triggerProps}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className={styles.icon} asChild>
            <Icon icon={CaretDownIcon} size="xs" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={styles.content}
          >
            <SelectPrimitive.ScrollUpButton className={styles.scrollButton}>
              <Icon icon={CaretDownIcon} size="xs" className={styles.scrollUpIcon} />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className={styles.viewport}>
              {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className={styles.scrollButton}>
              <Icon icon={CaretDownIcon} size="xs" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);

SelectRoot.displayName = "Select";

/** A single selectable option inside a `<Select>`. */
const SelectOption = forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ className, children, value, disabled }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      disabled={disabled}
      className={cx(styles.option, className)}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className={styles.optionIndicator}>
        <Icon icon={CheckIcon} size="xs" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  ),
);

SelectOption.displayName = "Select.Option";

export const Select = Object.assign(SelectRoot, { Option: SelectOption });
