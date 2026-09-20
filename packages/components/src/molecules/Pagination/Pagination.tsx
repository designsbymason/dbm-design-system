import { CaretDoubleLeftIcon, CaretDoubleRightIcon, CaretLeftIcon, CaretRightIcon } from "@dbm-design-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import styles from "./Pagination.module.css";
import { getPaginationRange } from "./paginationRange";
import type {
  PaginationAlign,
  PaginationCompact,
  PaginationLabels,
  PaginationProps,
  PaginationSize,
} from "./Pagination.types";

const defaultLabels: PaginationLabels = {
  navigation: "Pagination",
  previous: "Previous page",
  next: "Next page",
  first: "First page",
  last: "Last page",
  page: (page) => `Page ${page}`,
  summary: (page, pageCount) => `Page ${page} of ${pageCount}`,
};

const sizeClass: Record<PaginationSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const alignClass: Record<PaginationAlign, string | undefined> = {
  start: styles.alignStart,
  center: undefined,
  end: styles.alignEnd,
};

// `never` has no class: the numbers simply show.
const compactClass: Record<PaginationCompact, string | undefined> = {
  auto: styles.compactAuto,
  always: styles.compactAlways,
  never: undefined,
};

// The same icon step `Button` uses at each of its sizes, and its font step for the summary.
const iconSize: Record<PaginationSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };
const summarySize: Record<PaginationSize, TextSize> = { xs: "xs", sm: "sm", md: "base", lg: "md", xl: "lg" };

/** A page count that isn't a whole number of at least zero is a mistake; treat it as no pages. */
const wholeCount = (count: number): number => (Number.isInteger(count) && count > 0 ? count : 0);
/** A sibling or boundary count: a fraction is truncated, and anything below zero or not a number is zero. */
const nonNegative = (count: number): number => Math.max(Math.trunc(count) || 0, 0);

/** A click that means "take me there", as opposed to "open this link somewhere else". */
const isPlainClick = (event: MouseEvent<HTMLElement>): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * Page navigation for a list or table that is split into pages: previous and next
 * buttons around a row of page numbers, with a gap standing in for the pages that
 * don't fit. Every control is a `Button`, laid out as a list inside a `<nav>` landmark,
 * and the current page is marked `aria-current="page"`.
 *
 * `pageCount` is how many pages there are, and `value` / `onValueChange` (or an
 * uncontrolled `defaultValue`) hold the current page, counted from 1. `siblingCount`
 * and `boundaryCount` set how many page numbers show around the current page and at each
 * end; the row keeps the same number of slots wherever you are, so the controls don't
 * shift as you move through the pages. `showFirstLast` adds jump-to-first and
 * jump-to-last buttons.
 *
 * With `getPageHref`, every control is a real link to its page, so it can be opened in a
 * new tab or followed without JavaScript. Below the `sm` breakpoint the numbers collapse
 * to a short "Page 3 of 20" (`compact` controls that). The previous and next buttons at
 * either end are `aria-disabled` rather than natively disabled, so keyboard focus is
 * never lost when you reach the first or last page. Text the component supplies itself
 * can be replaced with `labels`.
 *
 * `ref` forwards to the `<nav>` element.
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(1);
 *
 * <Pagination pageCount={20} value={page} onValueChange={setPage} />
 *
 * // Each page has its own address, so the controls are links
 * <Pagination
 *   pageCount={20}
 *   defaultValue={3}
 *   getPageHref={(page) => `/results?page=${page}`}
 *   aria-label="Search results"
 * />
 * ```
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>((paginationProps, ref) => {
  const {
    pageCount: rawPageCount,
    value,
    defaultValue = 1,
    onValueChange,
    siblingCount: rawSiblingCount = 1,
    boundaryCount: rawBoundaryCount = 1,
    showFirstLast = false,
    size = "md",
    compact = "auto",
    align = "center",
    disabled = false,
    getPageHref,
    labels: labelOverrides,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = paginationProps;

  const [uncontrolledPage, setUncontrolledPage] = useState(defaultValue);

  const pageCount = wholeCount(rawPageCount);
  const siblingCount = nonNegative(rawSiblingCount);
  const boundaryCount = nonNegative(rawBoundaryCount);
  const current = Math.min(Math.max(Math.trunc(value ?? uncontrolledPage) || 1, 1), Math.max(pageCount, 1));

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!Number.isInteger(rawPageCount) || rawPageCount < 0) {
      console.warn(
        `Pagination: \`pageCount\` must be a whole number of at least 0, but got ${String(rawPageCount)} — it is treated as 0, so nothing renders. For a list of items, pass \`Math.ceil(totalItems / pageSize)\`.`,
      );
    }
  }, [rawPageCount]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && value !== undefined && paginationProps.defaultValue !== undefined) {
      console.warn(
        "Pagination: both `value` and `defaultValue` were given. `value` makes the component controlled, so `defaultValue` is ignored — remove one.",
      );
    }
  }, [value, paginationProps.defaultValue]);

  // Nothing to paginate: no pages yet, or none at all.
  if (pageCount === 0) return null;

  const labels: PaginationLabels = { ...defaultLabels, ...labelOverrides };
  const items = getPaginationRange({ page: current, pageCount, siblingCount, boundaryCount });
  const icon = iconSize[size];

  const goTo = (page: number, event: MouseEvent<HTMLElement>) => {
    if (disabled || page === current || page < 1 || page > pageCount) return;
    // In link mode a modified click (Ctrl-click to open in a new tab, say) is the browser's
    // to handle, not a page change here.
    if (getPageHref && !isPlainClick(event)) return;
    if (value === undefined) setUncontrolledPage(page);
    onValueChange?.(page, event);
  };

  // One control: a `Button` slotted onto a real `<a>` (link mode) or `<button>`. Always
  // slotted, even for a button, so a disabled one is `aria-disabled` and stays focusable
  // instead of dropping out of the tab order — otherwise pressing Previous to reach page 1
  // would disable the very button that has focus, and focus would fall back to the page.
  const control = (
    target: number,
    accessibleName: string,
    content: ReactNode,
    options: { isCurrent?: boolean; isDisabled?: boolean; isNav?: boolean },
  ) => {
    const { isCurrent = false, isDisabled = false, isNav = false } = options;
    const controlClass = cx(styles.item, isNav && styles.navItem);
    const handleClick = (event: MouseEvent<HTMLElement>) => goTo(target, event);
    return (
      <Button
        asChild
        variant={isCurrent ? "primary" : "tertiary"}
        size={size}
        disabled={disabled || isDisabled}
        className={controlClass}
      >
        {getPageHref ? (
          <a
            href={getPageHref(isDisabled ? current : target)}
            aria-label={accessibleName}
            aria-current={isCurrent ? "page" : undefined}
            onClick={handleClick}
          >
            {content}
          </a>
        ) : (
          <button
            type="button"
            aria-label={accessibleName}
            aria-current={isCurrent ? "page" : undefined}
            onClick={handleClick}
          >
            {content}
          </button>
        )}
      </Button>
    );
  };

  const arrow = (glyph: PhosphorIcon) => <Icon icon={glyph} size={icon} tone="brand" className={styles.flip} />;
  const atStart = current === 1;
  const atEnd = current === pageCount;

  return (
    <nav
      {...rest}
      ref={ref}
      id={id}
      style={style}
      data-testid={dataTestId}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
      aria-labelledby={ariaLabelledBy}
      className={cx(styles.root, sizeClass[size], alignClass[align], compactClass[compact], className)}
    >
      <ul className={styles.list}>
        {showFirstLast && (
          <li>{control(1, labels.first, arrow(CaretDoubleLeftIcon), { isDisabled: atStart, isNav: true })}</li>
        )}
        <li>{control(current - 1, labels.previous, arrow(CaretLeftIcon), { isDisabled: atStart, isNav: true })}</li>
        <li className={styles.summary}>
          <Text as="span" size={summarySize[size]} color="secondary">
            {labels.summary(current, pageCount)}
          </Text>
        </li>
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item} className={styles.pageItem}>
              {control(item, labels.page(item), item, { isCurrent: item === current })}
            </li>
          ) : (
            <li key={item} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ),
        )}
        <li>{control(current + 1, labels.next, arrow(CaretRightIcon), { isDisabled: atEnd, isNav: true })}</li>
        {showFirstLast && (
          <li>{control(pageCount, labels.last, arrow(CaretDoubleRightIcon), { isDisabled: atEnd, isNav: true })}</li>
        )}
      </ul>
    </nav>
  );
});

Pagination.displayName = "Pagination";
