import { cx, responsiveStyle, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import type { Responsive } from "@dbm-design-system/primitives";
import { createContext, forwardRef, useContext, useRef } from "react";
import styles from "./DescriptionList.module.css";
import type {
  DescriptionListDetailsProps,
  DescriptionListItemProps,
  DescriptionListOrientation,
  DescriptionListProps,
  DescriptionListSize,
  DescriptionListTermProps,
} from "./DescriptionList.types";

interface DescriptionListContextValue {
  size: DescriptionListSize;
  orientation: DescriptionListOrientation;
  columns: Responsive<number>;
  alignDetails: boolean;
}

// Each `DescriptionList` provides its own value, so a list nested inside a
// details value reads its own settings rather than leaking the outer list's
// — sub-parts style themselves from this context (never from descendant
// selectors keyed off the root alone), the same reasoning as `Table`'s
// identical context. The between-item divider doesn't need a context entry
// of its own — it's a plain descendant selector off the root's own class
// (`DescriptionList.module.css`'s `.dividers > .item:not(:first-child)`).
const DescriptionListContext = createContext<DescriptionListContextValue>({
  size: "md",
  orientation: "horizontal",
  columns: 1,
  alignDetails: false,
});

const itemSizeClass: Record<DescriptionListSize, string | undefined> = {
  xs: styles.itemSizeXs,
  sm: styles.itemSizeSm,
  md: styles.itemSizeMd,
  lg: styles.itemSizeLg,
  xl: styles.itemSizeXl,
};

const termSizeClass: Record<DescriptionListSize, string | undefined> = {
  xs: styles.termSizeXs,
  sm: styles.termSizeSm,
  md: styles.termSizeMd,
  lg: styles.termSizeLg,
  xl: styles.termSizeXl,
};

const detailsSizeClass: Record<DescriptionListSize, string | undefined> = {
  xs: styles.detailsSizeXs,
  sm: styles.detailsSizeSm,
  md: styles.detailsSizeMd,
  lg: styles.detailsSizeLg,
  xl: styles.detailsSizeXl,
};

const orientationClass: Record<DescriptionListOrientation, string> = {
  horizontal: styles.orientationHorizontal ?? "",
  vertical: styles.orientationVertical ?? "",
};

/**
 * A compact key/value display block — real `<dl>` semantics (`DescriptionList`
 * itself is the `<dl>`; each `DescriptionList.Item` wraps one
 * `DescriptionList.Term`/`DescriptionList.Details` pair in its own `<div>`,
 * an HTML5-valid grouping) with DBM's own styling, density, and layout.
 *
 * Deliberately non-interactive and read-only — for an editable set of
 * fields, use `Form`/`FormField` instead.
 *
 * @example
 * ```tsx
 * <DescriptionList>
 *   <DescriptionList.Item>
 *     <DescriptionList.Term>Customer</DescriptionList.Term>
 *     <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
 *   </DescriptionList.Item>
 *   <DescriptionList.Item>
 *     <DescriptionList.Term>Status</DescriptionList.Term>
 *     <DescriptionList.Details>Paid</DescriptionList.Details>
 *   </DescriptionList.Item>
 * </DescriptionList>
 * ```
 */
const DescriptionListRoot = forwardRef<HTMLDListElement, DescriptionListProps>(
  (descriptionListProps, ref) => {
    const {
      children,
      variant = "bordered",
      size = "md",
      orientation = "horizontal",
      columns = 1,
      alignedDetails = true,
      className,
      style,
      id,
      "data-testid": dataTestId,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...rest
    } = descriptionListProps;

    // The automatic between-item divider only reads correctly for a genuine
    // single column — see `DescriptionListProps.columns`'s own doc for why a
    // multi-column grid drops it rather than drawing a misleading partial line.
    const singleColumn = columns === 1;
    const dividers = singleColumn;

    // Aligning every term to one shared width means every term/details pair
    // must join a single 2-column grid — only unambiguous for a genuine
    // single column, and only meaningful when a term sits beside its details
    // in the first place (see `DescriptionListProps.alignedDetails`'s own doc).
    const alignDetails = alignedDetails && orientation === "horizontal" && singleColumn;

    return (
      <DescriptionListContext.Provider value={{ size, orientation, columns, alignDetails }}>
        <dl
          {...rest}
          ref={ref}
          id={id}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cx(
            styles.root,
            variant === "bordered" && styles.bordered,
            dividers && styles.dividers,
            alignDetails && styles.alignedDetails,
            className,
          )}
          style={{
            ...responsiveStyle(columns, "--dl-cols", (value: number) => String(value)),
            ...style,
          }}
        >
          {children}
        </dl>
      </DescriptionListContext.Provider>
    );
  },
);
DescriptionListRoot.displayName = "DescriptionList";

// A zero or negative `span` is invalid per the CSS Grid spec — the browser
// silently ignores the whole placement rather than clamping it, which reads
// as "span did nothing" with no error anywhere. Mirrors `GridItem`'s
// identical guard.
function hasNonPositiveSpan(span: number | undefined) {
  return span !== undefined && span <= 0;
}

/**
 * A single term/details pair (`<div>`) inside a `DescriptionList` — one
 * `DescriptionList.Term` and one `DescriptionList.Details`.
 */
const DescriptionListItem = forwardRef<HTMLDivElement, DescriptionListItemProps>(
  ({ span = 1, className, style, ...props }, ref) => {
    const { size, orientation, columns, alignDetails } = useContext(DescriptionListContext);

    const hasWarnedNonPositiveSpanRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (hasNonPositiveSpan(span) && !hasWarnedNonPositiveSpanRef.current) {
        hasWarnedNonPositiveSpanRef.current = true;
        console.warn(
          "DescriptionList.Item: `span` must be a positive integer — a zero or negative value is invalid per the CSS Grid spec, so the browser silently ignores the whole placement instead of clamping it.",
        );
      }
    }

    // A span wider than the grid's own current column count forces the
    // browser to implicitly widen the grid to fit it — breaking a
    // responsive `columns` map's collapse to fewer columns on a narrow
    // screen (found live: a span={3} item kept a 3-column grid alive even
    // once `columns` resolved to 1). Clamping against the resolved column
    // count needs a real value, not just CSS cascade, so it uses the same
    // `matchMedia`-based resolution `Popover`'s `side` and others already
    // do for this exact "can't be pure CSS" case.
    const resolvedColumns = useResolvedResponsiveValue(columns, 1);
    const effectiveSpan = hasNonPositiveSpan(span) ? 1 : Math.min(span, resolvedColumns);

    return (
      <div
        {...props}
        ref={ref}
        className={cx(
          styles.item,
          itemSizeClass[size],
          orientationClass[orientation],
          alignDetails && styles.itemContents,
          className,
        )}
        style={{
          ...(effectiveSpan !== 1 ? { gridColumn: `span ${effectiveSpan}` } : {}),
          ...style,
        }}
      />
    );
  },
);
DescriptionListItem.displayName = "DescriptionList.Item";

/** A term (`<dt>`) — a field name or label, inside a `DescriptionList.Item`. Sized by the list's own `size`. */
const DescriptionListTerm = forwardRef<HTMLElement, DescriptionListTermProps>(
  ({ className, ...props }, ref) => {
    const { size } = useContext(DescriptionListContext);
    return (
      <dt
        {...props}
        ref={ref}
        className={cx(styles.term, termSizeClass[size], className)}
      />
    );
  },
);
DescriptionListTerm.displayName = "DescriptionList.Term";

/** The details (`<dd>`) for the paired term, inside a `DescriptionList.Item`. Sized by the list's own `size`. */
const DescriptionListDetails = forwardRef<HTMLElement, DescriptionListDetailsProps>(
  ({ numeric = false, className, ...props }, ref) => {
    const { size } = useContext(DescriptionListContext);
    return (
      <dd
        {...props}
        ref={ref}
        className={cx(styles.details, detailsSizeClass[size], numeric && styles.numeric, className)}
      />
    );
  },
);
DescriptionListDetails.displayName = "DescriptionList.Details";

type DescriptionListComponent = typeof DescriptionListRoot & {
  Item: typeof DescriptionListItem;
  Term: typeof DescriptionListTerm;
  Details: typeof DescriptionListDetails;
};

export const DescriptionList: DescriptionListComponent = Object.assign(DescriptionListRoot, {
  Item: DescriptionListItem,
  Term: DescriptionListTerm,
  Details: DescriptionListDetails,
});
