import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SelectProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "value" | "defaultValue" | "onChange" | "children"
  > {
  /** The controlled selected value. */
  value?: string;
  /** The initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the new value whenever the selection changes. */
  onValueChange?: (value: string) => void;
  /** Shown in the trigger when nothing is selected. */
  placeholder?: ReactNode;
  /** @default 'md' */
  size?: SelectSize;
  /**
   * Marks the select as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /** Name submitted with the enclosing form. */
  name?: string;
  /** Marks the field as required for native form validation. */
  required?: boolean;
  /** The controlled open state of the dropdown. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the dropdown opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Text direction, passed through to Radix Select. */
  dir?: "ltr" | "rtl";
  /** Associates the field with a `<form>` by id, for use outside one. */
  form?: string;
  autoComplete?: string;
  /** `<Select.Option>` elements. */
  children?: ReactNode;
}

export interface SelectOptionProps {
  /** The value submitted when this option is selected. */
  value: string;
  /** Prevents this specific option from being selected. */
  disabled?: boolean;
  /** Additional CSS classes. */
  className?: string;
  children?: ReactNode;
}
