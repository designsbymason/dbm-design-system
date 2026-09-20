import { CaretDoubleLeftIcon, CaretDoubleRightIcon, CaretLeftIcon, CaretRightIcon } from "@dbm-design-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs, useAnnouncement } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, MouseEvent, ReactNode, SyntheticEvent } from "react";
import { Button } from "../../atoms/Button";
import type { ButtonVariant } from "../../atoms/Button/Button.types";
import { FieldLabel } from "../../atoms/FieldLabel";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { Input } from "../../atoms/Input";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Pagination.module.css";
import { getPaginationRange } from "./paginationRange";
import type {
  PaginationAlign,
  PaginationLabels,
  PaginationProps,
  PaginationSize,
  PaginationVariant,
} from "./Pagination.types";

// `useLayoutEffect` on the client, `useEffect` on the server — avoids React's "does nothing on the
// server" warning, and the measurement below only ever runs where there is a layout to measure.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const defaultLabels: PaginationLabels = {
  navigation: "Pagination",
  previous: "Previous page",
  next: "Next page",
  first: "First page",
  last: "Last page",
  page: (page) => `Page ${page}`,
  summary: (page, pageCount) => `Page ${page} of ${pageCount}`,
  jump: "Go to page",
  jumpSubmit: "Go",
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

// The `Button` variant each treatment uses for every control but the current page (which is `primary`).
const variantForControl: Record<PaginationVariant, ButtonVariant> = {
  ghost: "tertiary",
  outlined: "secondary",
  filled: "ghost",
};

// The same icon step `Button` uses at each of its sizes, and its font step for the summary.
const iconSize: Record<PaginationSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };
const summarySize: Record<PaginationSize, TextSize> = { xs: "xs", sm: "sm", md: "base", lg: "md", xl: "lg" };

/** Where the row is, in `compact="container"`: not measured yet, all of it fits, or it doesn't. */
type Fit = "unknown" | "expanded" | "collapsed";

/** A page count that isn't a whole number of at least zero is a mistake; treat it as no pages. */
const wholeCount = (count: number): number => (Number.isInteger(count) && count > 0 ? count : 0);
/** A sibling or boundary count: a fraction is truncated, and anything below zero or not a number is zero. */
const nonNegative = (count: number): number => Math.max(Math.trunc(count) || 0, 0);

/** A click that means "take me there", as opposed to "open this link somewhere else". */
const isPlainClick = (event: MouseEvent<HTMLElement>): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/** Follows a link the way a click on it would, for the jump field (which is a form, not a link). */
const followLink = (href: string): void => {
  const link = document.createElement("a");
  link.href = href;
  link.click();
};

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
 * jump-to-last buttons, and `showJump` adds a "Go to page" field for long lists.
 *
 * With `getPageHref`, every control is a real link to its page, so it can be opened in a
 * new tab or followed without JavaScript. The numbers collapse to a short "Page 3 of 20"
 * on a phone-width screen (`compact="auto"`), or when they don't fit the component's own
 * width (`compact="container"`). The previous and next buttons at either end are
 * `aria-disabled` rather than natively disabled, so keyboard focus is never lost when you
 * reach the first or last page. `variant` sets how the controls look, `rounded` makes them
 * round, and a page change is
 * announced to screen readers (`announce`). Text the component supplies itself can be
 * replaced with `labels`.
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
 *
 * // A long list: a jump-to-page field, and the numbers collapse to fit whatever width it has
 * <Pagination pageCount={500} value={page} onValueChange={setPage} showJump compact="container" />
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
    variant = "ghost",
    rounded = false,
    showJump = false,
    announce = true,
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
  const [fit, setFit] = useState<Fit>("unknown");
  const [draft, setDraft] = useState("");
  const jumpId = useId();
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, navRef), [ref]);
  const naturalWidth = useRef(0);

  const pageCount = wholeCount(rawPageCount);
  const siblingCount = nonNegative(rawSiblingCount);
  const boundaryCount = nonNegative(rawBoundaryCount);
  const current = Math.min(Math.max(Math.trunc(value ?? uncontrolledPage) || 1, 1), Math.max(pageCount, 1));
  const labels: PaginationLabels = { ...defaultLabels, ...labelOverrides };
  const items = getPaginationRange({ page: current, pageCount, siblingCount, boundaryCount });

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

  // Announce a page change. The status region is in the page from the start and only its text
  // changes, which is what a live region needs to be announced reliably.
  const { message: announcement, announce: announcePage } = useAnnouncement();
  const previousPage = useRef(current);
  const summaryLabel = labels.summary;
  useEffect(() => {
    if (previousPage.current === current) return;
    previousPage.current = current;
    if (announce && pageCount > 0) announcePage(summaryLabel(current, pageCount));
  }, [announce, announcePage, current, pageCount, summaryLabel]);

  // `compact="container"`: show the numbers only while they fit the width this component is given.
  // The row's natural width can only be read while the numbers are showing (collapsed, they are
  // `display: none`), so it is measured then and remembered; the decision is that width against the
  // component's own. Until the first measurement (and on the server) it behaves like `auto`, so
  // there's no jump. The measurement runs before the browser paints.
  const containerMode = compact === "container";
  useIsomorphicLayoutEffect(() => {
    if (!containerMode) return;
    const nav = navRef.current;
    const list = listRef.current;
    if (!nav || !list) return;
    if (fit === "unknown") {
      // Render the numbers first, so there is something to measure.
      setFit("expanded");
      return;
    }
    const measure = () => {
      if (fit === "expanded") naturalWidth.current = list.scrollWidth;
      setFit(naturalWidth.current > nav.clientWidth ? "collapsed" : "expanded");
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [containerMode, fit, items.length, showFirstLast, size]);

  // Nothing to paginate: no pages yet, or none at all.
  if (pageCount === 0) return null;

  const icon = iconSize[size];

  const goTo = (page: number, event: MouseEvent<HTMLElement>) => {
    if (disabled || page === current || page < 1 || page > pageCount) return;
    // In link mode a modified click (Ctrl-click to open in a new tab, say) is the browser's to handle,
    // not a page change here.
    if (getPageHref && !isPlainClick(event)) return;
    if (value === undefined) setUncontrolledPage(page);
    onValueChange?.(page, event);
  };

  // The jump field: a number outside 1..pageCount goes to the nearest page, and an empty field does
  // nothing. It is a form, so it must never submit natively; the consumer may also cancel the default
  // in `onValueChange` (to route the page themselves), which in link mode is what stops the component
  // following the link.
  const submitJump = (event: FormEvent<HTMLFormElement>) => {
    const typed = Number.parseInt(draft, 10);
    const target = Number.isNaN(typed) ? undefined : Math.min(Math.max(typed, 1), pageCount);
    setDraft("");
    if (target === undefined || disabled || target === current) {
      event.preventDefault();
      return;
    }
    if (value === undefined) setUncontrolledPage(target);
    onValueChange?.(target, event as SyntheticEvent<HTMLElement>);
    const cancelled = event.isDefaultPrevented();
    event.preventDefault();
    if (getPageHref && !cancelled) followLink(getPageHref(target));
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
        variant={isCurrent ? "primary" : variantForControl[variant]}
        size={size}
        rounded={rounded}
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

  // How the numbers collapse. `container` starts as `auto` (until measured), then is settled by the
  // measurement: the summary (`always`) when the row doesn't fit, the numbers (`never`) when it does.
  const compactClasses = containerMode
    ? cx(styles.compactContainer, fit === "unknown" && styles.compactAuto, fit === "collapsed" && styles.compactAlways)
    : { auto: styles.compactAuto, always: styles.compactAlways, never: undefined }[compact as "auto" | "always" | "never"];

  return (
    <nav
      {...rest}
      ref={mergedRef}
      id={id}
      style={style}
      data-testid={dataTestId}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
      aria-labelledby={ariaLabelledBy}
      className={cx(styles.root, sizeClass[size], alignClass[align], compactClasses, className)}
    >
      <ul ref={listRef} className={styles.list}>
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
      {showJump && (
        // `noValidate`: the browser would otherwise refuse to submit a number outside `min`..`max`,
        // where this goes to the nearest page instead. `min`/`max` stay as hints (the spinner's limits).
        <form className={styles.jump} onSubmit={submitJump} noValidate>
          <FieldLabel htmlFor={jumpId} size={size}>
            {labels.jump}
          </FieldLabel>
          <Input
            id={jumpId}
            type="number"
            inputMode="numeric"
            min={1}
            max={pageCount}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            size={size}
            disabled={disabled}
            className={styles.jumpInput}
          />
          <Button type="submit" variant="secondary" size={size} disabled={disabled}>
            {labels.jumpSubmit}
          </Button>
        </form>
      )}
      {announce && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
    </nav>
  );
});

Pagination.displayName = "Pagination";
