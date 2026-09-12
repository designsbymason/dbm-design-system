import { CaretDownIcon, CheckIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import * as SelectPrimitive from "@radix-ui/react-select";
import { forwardRef, useId, useRef } from "react";
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
 * <Select aria-label="Variant" asChild trigger={<button type="button">Custom trigger</button>}>
 *   <Select.Option value="primary">Primary</Select.Option>
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
      side = "bottom",
      align = "start",
      asChild = false,
      trigger,
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

    const hasWarnedTriggerWithoutAsChildRef = useRef(false);
    const hasWarnedAsChildWithoutTriggerRef = useRef(false);
    const hasWarnedAsChildIgnoredPlaceholderRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (trigger && !asChild && !hasWarnedTriggerWithoutAsChildRef.current) {
        hasWarnedTriggerWithoutAsChildRef.current = true;
        console.warn(
          "Select: `trigger` has no effect without `asChild` — the built-in value/caret display renders instead. Pass `asChild`, or remove `trigger`.",
        );
      }
      if (asChild && !trigger && !hasWarnedAsChildWithoutTriggerRef.current) {
        hasWarnedAsChildWithoutTriggerRef.current = true;
        console.warn(
          "Select: `asChild` requires `trigger` — Radix `Slot` needs exactly one child element to merge the trigger's behavior onto. Pass `trigger`, or remove `asChild`.",
        );
      }
      if (asChild && placeholder && !hasWarnedAsChildIgnoredPlaceholderRef.current) {
        hasWarnedAsChildIgnoredPlaceholderRef.current = true;
        console.warn(
          "Select: `placeholder` has no effect when `asChild` is set — the built-in value display isn't rendered in that mode. Remove `asChild`/`trigger`, or remove `placeholder`.",
        );
      }
    }

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
          asChild={asChild}
          // `{...triggerProps}` spread first so none of the attributes
          // below can be silently overridden by a same-named prop the
          // caller passes — including `aria-invalid`, which isn't excluded
          // from `SelectProps`' own native-attribute passthrough and
          // TypeScript's JSX checker permits regardless (found and fixed
          // 2026-09-13: this was previously spread *last*, letting a
          // stray consumer-supplied `aria-invalid` silently win over this
          // component's own `hasError`-computed value — the same ordering
          // bug already fixed on Button/Skeleton/ProgressBar/FieldError/
          // List, see `05-component-api-conventions.md` §3).
          {...triggerProps}
          ref={ref}
          id={selectId}
          aria-invalid={hasError || undefined}
          className={cx(
            styles.trigger,
            sizeClass[size],
            hasError && styles.error,
            className,
          )}
        >
          {asChild ? (
            trigger
          ) : (
            <>
              <SelectPrimitive.Value placeholder={placeholder} />
              <SelectPrimitive.Icon className={styles.icon} asChild>
                <Icon icon={CaretDownIcon} size="xs" />
              </SelectPrimitive.Icon>
            </>
          )}
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            side={side}
            align={align}
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
  ({ className, style, children, value, disabled, textValue, id, ...props }, ref) => (
    <SelectPrimitive.Item
      // `{...props}` spread first — same "own computed/passed attributes
      // must win, not be silently overridable" ordering as `SelectRoot`
      // above, applied consistently to this sub-part too.
      {...props}
      ref={ref}
      id={id}
      value={value}
      disabled={disabled}
      textValue={textValue}
      className={cx(styles.option, className)}
      style={style}
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
