import { cx, useResolvedResponsiveValue, type SpaceValue } from "@dbm-design-system/primitives";
import { forwardRef, useId, useMemo, useRef, type CSSProperties } from "react";
import { FieldError } from "../../atoms/FieldError";
import { FieldHelperText } from "../../atoms/FieldHelperText";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { FieldGroupProvider, useFieldGroup } from "../../internal/fieldGroupContext";
import styles from "./FieldGroup.module.css";
import { FieldGroupLayoutProvider, useFieldGroupColumns } from "./fieldGroupLayoutContext";
import type {
  FieldGroupItemProps,
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
const FieldGroupRoot = forwardRef<HTMLFieldSetElement, FieldGroupProps>(
  (
    {
      legend,
      children,
      description,
      error,
      required = false,
      hideLegend = false,
      variant = "ghost",
      size,
      legendSize,
      orientation = "vertical",
      columns,
      gap = 4,
      columnGap,
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

    const resolvedColumns = useResolvedResponsiveValue<number | undefined>(columns, undefined);
    const resolvedGap = useResolvedResponsiveValue<SpaceValue>(gap, 4);
    const resolvedColumnGap = useResolvedResponsiveValue<SpaceValue | undefined>(columnGap, undefined);
    const gridColumns =
      resolvedColumns !== undefined && Number.isInteger(resolvedColumns) && resolvedColumns > 0
        ? resolvedColumns
        : null;

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
    // One message at a time, as in FormField: the error replaces the description.
    const showDescription = hasDescription && !hasError;
    const describedBy =
      [ariaDescribedBy, showDescription ? descriptionId : undefined, hasError ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    const hasWarnedColumnsRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (resolvedColumns !== undefined && gridColumns === null && !hasWarnedColumnsRef.current) {
        hasWarnedColumnsRef.current = true;
        console.warn(
          "FieldGroup: `columns` must be a positive whole number (or a breakpoint map of them) — anything else is ignored and the group is laid out as if `columns` were not set.",
        );
      }
    }

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
      sizeClass[legendSize ?? size ?? parentSize ?? "md"],
      effectiveDisabled && styles.disabled,
    );
    const legendContent = (
      <>
        {legend}
        {required && !hideLegend && (
          <span className={styles.required} aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </>
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
        style={style}
      >
        {hasLegend &&
          (hideLegend ? (
            <VisuallyHidden asChild>
              <legend>{legendContent}</legend>
            </VisuallyHidden>
          ) : (
            <legend className={legendClassName}>{legendContent}</legend>
          ))}
        {showDescription && (
          <FieldHelperText id={descriptionId} disabled={effectiveDisabled} className={styles.description}>
            {description}
          </FieldHelperText>
        )}
        <div
          className={cx(
            styles.body,
            gridColumns === null && resolvedOrientation === "horizontal" && styles.horizontal,
            gridColumns !== null && styles.columns,
            (showDescription || (hasLegend && !hideLegend)) && styles.bodySpaced,
          )}
          style={
            {
              "--field-group-gap": `var(--dbm-space-${resolvedGap})`,
              "--field-group-column-gap": `var(--dbm-space-${resolvedColumnGap ?? resolvedGap})`,
              ...(gridColumns !== null ? { "--field-group-columns": String(gridColumns) } : {}),
            } as CSSProperties
          }
        >
          <FieldGroupProvider value={settings}>
            <FieldGroupLayoutProvider value={gridColumns}>{children}</FieldGroupLayoutProvider>
          </FieldGroupProvider>
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

FieldGroupRoot.displayName = "FieldGroup";

function hasNonPositiveSpan(span: number | undefined) {
  return span !== undefined && (!Number.isInteger(span) || span <= 0);
}

/**
 * One cell of a `FieldGroup` that sets `columns`: holds a field, and takes a `span` of the columns. Elsewhere
 * (a stacked or `horizontal` group) it is a plain wrapper and the span does nothing.
 *
 * @example
 * ```tsx
 * <FieldGroup legend="Address" columns={{ base: 1, md: 3 }}>
 *   <FieldGroup.Item span={{ base: 1, md: 3 }}>…street…</FieldGroup.Item>
 *   <FieldGroup.Item span={2}>…city…</FieldGroup.Item>
 *   <FieldGroup.Item>…postcode…</FieldGroup.Item>
 * </FieldGroup>
 * ```
 */
const FieldGroupItem = forwardRef<HTMLDivElement, FieldGroupItemProps>(
  ({ span = 1, className, style, ...props }, ref) => {
    const columns = useFieldGroupColumns();
    const resolvedSpan = useResolvedResponsiveValue<number>(span, 1);

    const hasWarnedRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (hasNonPositiveSpan(resolvedSpan) && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        console.warn(
          "FieldGroup.Item: `span` must be a positive whole number — anything else is invalid per the CSS Grid spec, so the browser would ignore the placement instead of clamping it.",
        );
      }
    }

    // A span wider than the grid forces the browser to widen the grid to fit it, which would keep a narrow
    // screen's one-column grid wide, so clamp it to the columns the group has right now.
    const effective = hasNonPositiveSpan(resolvedSpan) ? 1 : resolvedSpan;
    const clamped = columns === null ? effective : Math.min(effective, columns);

    return (
      <div
        {...props}
        ref={ref}
        className={cx(styles.item, className)}
        style={{ ...(clamped !== 1 ? { gridColumn: `span ${clamped}` } : {}), ...style }}
      />
    );
  },
);
FieldGroupItem.displayName = "FieldGroup.Item";

type FieldGroupComponent = typeof FieldGroupRoot & { Item: typeof FieldGroupItem };

export const FieldGroup: FieldGroupComponent = Object.assign(FieldGroupRoot, { Item: FieldGroupItem });
