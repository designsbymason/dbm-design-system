import { cx } from "@dbm-system/utils";
import { forwardRef, useEffect, useId } from "react";
import { FieldError } from "../../atoms/FieldError";
import { FieldHelperText } from "../../atoms/FieldHelperText";
import { FieldLabel } from "../../atoms/FieldLabel";
import { useFieldGroup } from "../../internal/fieldGroupContext";
import { useForm } from "../../internal/formContext";
import styles from "./FormField.module.css";
import type { FormFieldProps } from "./FormField.types";

/**
 * Composes a `FieldLabel`, a form control, and helper/error text into one
 * correctly-wired field — computing the `id`/`aria-labelledby`/
 * `aria-describedby` relationships between them and handing them to the
 * control via a render-prop `children`, rather than rendering the control
 * itself (there's no single primitive every possible control — `Input`,
 * `Textarea`, `Checkbox`, `RadioGroup`, `Select`, etc. — could share). Spread
 * the received `FormFieldControlProps` directly onto whatever control is
 * being labeled; every field-control atom in this system already accepts
 * that exact shape, so none of them need any change to work here. Inside a
 * `Form`, its `name` is the key the form finds its value, error and rule by
 * (`validate` is the field's own rule). `ref` forwards to the outer wrapper
 * `<div>`.
 *
 * @example
 * ```tsx
 * <FormField label="Email address" helperText="We'll never share this">
 *   {(fieldProps) => <Input {...fieldProps} type="email" />}
 * </FormField>
 * <FormField label="Username" name="username" validate={(value) => (String(value).length < 3 ? "Use 3 or more characters" : undefined)}>
 *   {(fieldProps) => <Input {...fieldProps} />}
 * </FormField>
 * <FormField label="Password" error={errors.password} required>
 *   {(fieldProps) => <Input {...fieldProps} type="password" />}
 * </FormField>
 * <FormField label="Interests">
 *   {(fieldProps) => (
 *     <CheckboxGroup {...fieldProps} value={interests} onValueChange={setInterests}>
 *       <Checkbox value="sports">Sports</Checkbox>
 *       <Checkbox value="music">Music</Checkbox>
 *     </CheckboxGroup>
 *   )}
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      children,
      helperText,
      error: errorProp,
      name,
      validate,
      required = false,
      disabled: disabledProp = false,
      size: sizeProp,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    // Inside a FieldGroup, its `disabled` and `size` are this field's defaults: a disabled group disables the
    // field, and the field's own `size` wins over the group's.
    const group = useFieldGroup();
    const disabled = disabledProp || Boolean(group?.disabled);
    const size = sizeProp ?? group?.size ?? "md";
    // Only a group that sets a size reaches the control with it; a field on its own sizes just its label.
    const controlSize = group?.size !== undefined ? size : undefined;

    const generatedId = useId();
    const baseId = id ?? generatedId;
    const controlId = `${baseId}-control`;
    const labelId = `${baseId}-label`;
    const helperId = `${baseId}-helper`;
    const errorId = `${baseId}-error`;

    // Inside a `Form`, the error stored under this field's name (or control id, with no name) is the one to show
    // when none is passed. The `Form` also reads this field's rule and label through the registration.
    const form = useForm();
    const fieldKey = name ?? controlId;
    const error = errorProp || form?.errors[fieldKey];
    const registerField = form?.registerField;
    useEffect(() => {
      if (!registerField) return undefined;
      return registerField({ key: fieldKey, name, controlId, label, validate, required });
    }, [registerField, fieldKey, name, controlId, label, validate, required]);

    // An asynchronous rule for this field is running: say so to assistive technology without moving anything.
    const validating = Boolean(form?.validatingKeys.has(fieldKey));

    const hasError = Boolean(error);
    const describedBy = hasError ? errorId : helperText ? helperId : undefined;

    return (
      <div
        ref={ref}
        {...props}
        {...(validating ? { "aria-busy": true } : {})}
        className={cx(styles.root, className)}
      >
        <FieldLabel
          id={labelId}
          htmlFor={controlId}
          size={size}
          required={required}
          disabled={disabled}
        >
          {label}
        </FieldLabel>
        {children({
          id: controlId,
          "aria-labelledby": labelId,
          "aria-describedby": describedBy,
          hasError,
          disabled,
          required,
          ...(controlSize ? { size: controlSize } : {}),
          ...(name ? { name } : {}),
        })}
        {hasError ? (
          <FieldError id={errorId} disabled={disabled}>
            {error}
          </FieldError>
        ) : helperText ? (
          <FieldHelperText id={helperId} disabled={disabled}>
            {helperText}
          </FieldHelperText>
        ) : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
