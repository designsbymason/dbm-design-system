import { cx, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import { forwardRef, useId, useMemo, useRef } from "react";
import { FieldError } from "../../atoms/FieldError";
import { FieldHelperText } from "../../atoms/FieldHelperText";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FieldGroupProvider, useFieldGroup } from "../../internal/fieldGroupContext";
import styles from "./FieldGroup.module.css";
import type {
  FieldGroupOrientation,
  FieldGroupProps,
  FieldGroupVariant,
} from "./FieldGroup.types";

const variantClass: Record<FieldGroupVariant, string | undefined> = {
  ghost: styles.ghost,
  outlined: styles.outlined,
  filled: styles.filled,
};

const sizeClass = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
} as const;

/**
 * Groups several fields under one legend, as a native `<fieldset>` with a `<legend>`: assistive tech announces
 * the legend ahead of each field in the group, which is what makes "Street", "City" and "Postcode" mean a
 * shipping address. Use it for fields that belong together — an address, a date of birth, a set of contact
 * methods; one field is a `FormField`, and a single choice among options is a `RadioGroup`.
 *
 * It holds the fields' layout (stacked, or side by side and wrapping), an optional description and a group-level
 * error, and hands its `disabled` and `size` to the `FormField`s inside as defaults — a field's own prop still
 * wins. A group inside another inherits the outer one's settings. It owns no values and runs no validation.
 * `ref` forwards to the `<fieldset>`.
 *
 * @example
 * ```tsx
 * <FieldGroup legend="Shipping address" description="Where should we send it?">
 *   <FormField label="Street">{(field) => <Input {...field} />}</FormField>
 *   <FormField label="City">{(field) => <Input {...field} />}</FormField>
 * </FieldGroup>
 * <FieldGroup legend="Date of birth" orientation="horizontal" variant="outlined">…</FieldGroup>
 * <FieldGroup legend="Contact" error="Give us an email or a phone number">…</FieldGroup>
 * ```
 */
export const FieldGroup = forwardRef<HTMLFieldSetElement, FieldGroupProps>(
  (
    {
      legend,
      children,
      description,
      error,
      hideLegend = false,
      variant = "ghost",
      size,
      orientation = "vertical",
      gap = 4,
      disabled = false,
      id,
      className,
      style,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const baseId = id ?? generatedId;
    const descriptionId = `${baseId}-description`;
    const errorId = `${baseId}-error`;

    const resolvedOrientation = useResolvedResponsiveValue<FieldGroupOrientation>(
      orientation,
      "vertical",
    );

    // A group inside another keeps what the outer one set: its own settings win, what it leaves out comes
    // from the outer group, and a disabled outer group disables the inner fields too. Without this the inner
    // provider would replace the outer value and silently drop both.
    const parent = useFieldGroup();
    const parentDisabled = parent?.disabled ?? false;
    const parentSize = parent?.size;
    const effectiveDisabled = disabled || parentDisabled;
    const effectiveSize = size ?? parentSize;
    const settings = useMemo(
      () => ({ disabled: effectiveDisabled, size: effectiveSize }),
      [effectiveDisabled, effectiveSize],
    );

    const hasError = Boolean(error);
    const hasDescription = Boolean(description);
    const hasLegend = legend !== null && legend !== undefined && legend !== false && legend !== "";
    const describedBy =
      [ariaDescribedBy, hasDescription ? descriptionId : undefined, hasError ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    const hasWarnedNoLegendRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!hasLegend && !hasWarnedNoLegendRef.current) {
        hasWarnedNoLegendRef.current = true;
        console.warn(
          "FieldGroup: empty `legend` — the legend is the group's accessible name, and a group with no name tells a screen reader user nothing about what its fields have in common. Pass text (use `hideLegend` to keep it out of the page).",
        );
      }
    }

    const legendClassName = cx(
      styles.legend,
      sizeClass[size ?? parentSize ?? "md"],
      effectiveDisabled && styles.disabled,
    );

    return (
      // `{...props}` first, so the computed `aria-describedby`, `className` and `style` can't be replaced by a
      // same-named prop a caller passes (05-component-api-conventions.md §3).
      <fieldset
        ref={ref}
        {...props}
        id={id}
        disabled={effectiveDisabled}
        aria-describedby={describedBy}
        data-invalid={hasError ? "" : undefined}
        className={cx(
          styles.root,
          variantClass[variant],
          hasError && styles.invalid,
          className,
        )}
        style={{ ["--field-group-gap" as string]: `var(--dbm-space-${gap})`, ...style }}
      >
        {hasLegend &&
          (hideLegend ? (
            <VisuallyHidden asChild>
              <legend>{legend}</legend>
            </VisuallyHidden>
          ) : (
            <legend className={legendClassName}>{legend}</legend>
          ))}
        {hasDescription && (
          <FieldHelperText id={descriptionId} disabled={effectiveDisabled} className={styles.description}>
            {description}
          </FieldHelperText>
        )}
        <div
          className={cx(
            styles.body,
            resolvedOrientation === "horizontal" && styles.horizontal,
            (hasDescription || (hasLegend && !hideLegend)) && styles.bodySpaced,
          )}
        >
          <FieldGroupProvider value={settings}>{children}</FieldGroupProvider>
        </div>
        {hasError && (
          <FieldError id={errorId} disabled={effectiveDisabled} className={styles.error}>
            {error}
          </FieldError>
        )}
      </fieldset>
    );
  },
);

FieldGroup.displayName = "FieldGroup";
