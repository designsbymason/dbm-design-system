import { CaretRightIcon, DotsThreeIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { Children, createContext, forwardRef, isValidElement, useContext, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Link } from "../../atoms/Link";
import styles from "./Breadcrumb.module.css";
import type {
  BreadcrumbItemProps,
  BreadcrumbLabels,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparator,
  BreadcrumbSize,
} from "./Breadcrumb.types";

interface BreadcrumbContextValue {
  size: BreadcrumbSize;
  separator: BreadcrumbSeparator;
}

// Every part reads the root's settings from here rather than each taking them as a prop, so one `size` on
// `Breadcrumb` styles the whole trail.
const BreadcrumbContext = createContext<BreadcrumbContextValue>({ size: "md", separator: "chevron" });

/** Whether the item is the last one drawn, which is the only one with no separator after it. */
const ItemPositionContext = createContext({ isLast: true });

const sizeClass: Record<BreadcrumbSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One step down from the text's own size at the small end, the mapping `Button` and `Tabs` use.
const iconSizeForSize: Record<BreadcrumbSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// The "…" button is the smallest `IconButton` (30px) up to `lg`, so it disturbs the height of its line as little as
// it can — an `IconButton` of the trail's own size is as tall as a `Button` of that size, far taller than a line of text.
const expandSizeForSize: Record<BreadcrumbSize, BreadcrumbSize> = { xs: "xs", sm: "xs", md: "xs", lg: "xs", xl: "sm" };

const defaultLabels: BreadcrumbLabels = {
  navigation: "Breadcrumb",
  expand: (count) => `Show ${count} hidden ${count === 1 ? "page" : "pages"}`,
};

/** A count that isn't a whole number of at least zero is treated as zero. */
const nonNegative = (count: number): number => Math.max(Math.trunc(count) || 0, 0);

/**
 * One item of the trail's list. Its `listitem` role is stated outright: Safari with VoiceOver stops treating a
 * list as one once its markers are removed (`list-style: none`), and the items with it — the same fix `List`
 * and `Pagination` apply. Redundant on paper, which is what the lint rule objects to.
 */
const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(({ className, children, ...props }, ref) => {
  const { size, separator } = useContext(BreadcrumbContext);
  const { isLast } = useContext(ItemPositionContext);
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
    <li {...props} ref={ref} role="listitem" className={cx(styles.item, className)}>
      {children}
      {!isLast && <Separator separator={separator} size={size} />}
    </li>
  );
});
BreadcrumbItem.displayName = "Breadcrumb.Item";

function Separator({ separator, size }: { separator: BreadcrumbSeparator; size: BreadcrumbSize }) {
  let content: ReactNode = separator;
  if (separator === "chevron") {
    content = <Icon icon={CaretRightIcon} size={iconSizeForSize[size]} className={styles.flip} />;
  } else if (separator === "slash") {
    content = "/";
  }
  return (
    <span aria-hidden="true" className={styles.separator}>
      {content}
    </span>
  );
}

/**
 * A link to a page above the current one. Renders the `Link` atom — so it takes an `href`, opens an external
 * one in a new tab with the usual affordances, supports `disabled`, and takes `asChild` to render a router's
 * own link — restyled to sit quietly in a trail: the underline shows on hover only, since a link in a
 * navigation list isn't running through body text to be told apart from it.
 */
const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ icon, className, children, asChild = false, ...props }, ref) => {
    const { size } = useContext(BreadcrumbContext);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && asChild && icon) {
        console.warn(
          "Breadcrumb.Link: `icon` is not drawn together with `asChild`, since the slotted element owns its own content. Put the icon inside that element instead.",
        );
      }
    }, [asChild, icon]);
    return (
      <Link {...props} ref={ref} asChild={asChild} underline="hover" className={cx(styles.link, className)}>
        {asChild ? (
          children
        ) : (
          <>
            {icon && <Icon icon={icon} size={iconSizeForSize[size]} />}
            {children}
          </>
        )}
      </Link>
    );
  },
);
BreadcrumbLink.displayName = "Breadcrumb.Link";

/** The current page: plain text, marked `aria-current="page"` so a screen reader announces it as the current page. */
const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ icon, className, children, ...props }, ref) => {
    const { size } = useContext(BreadcrumbContext);
    return (
      <span
        {...props}
        // After `...props`, so a caller's own `aria-current` can't replace it.
        ref={ref}
        aria-current="page"
        className={cx(styles.page, className)}
      >
        {icon && <Icon icon={icon} size={iconSizeForSize[size]} />}
        {children}
      </span>
    );
  },
);
BreadcrumbPage.displayName = "Breadcrumb.Page";

/** Where in the trail keyboard focus goes once the "…" button that held it has gone. */
const FOCUSABLE = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * A breadcrumb trail: the path from the top of a site down to the page the reader is on, as a list of links
 * ending in the current page. A compound component — put one `Breadcrumb.Item` per level inside `Breadcrumb`,
 * each holding a `Breadcrumb.Link` (or `Breadcrumb.Page`, for the last).
 *
 * Renders a `<nav>` around an ordered list, named "Breadcrumb" (`labels.navigation`, or `aria-label`). The
 * separator between items is drawn by the component, hidden from assistive technology. A long trail wraps onto
 * more lines, or — with `maxItems` — collapses its middle into a "…" button that reveals the rest.
 *
 * `ref` forwards to the `<nav>`.
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <Breadcrumb.Item><Breadcrumb.Link href="/" icon={HouseIcon}>Home</Breadcrumb.Link></Breadcrumb.Item>
 *   <Breadcrumb.Item><Breadcrumb.Link href="/products">Products</Breadcrumb.Link></Breadcrumb.Item>
 *   <Breadcrumb.Item><Breadcrumb.Page>Keyboards</Breadcrumb.Page></Breadcrumb.Item>
 * </Breadcrumb>
 * ```
 */
const BreadcrumbRoot = forwardRef<HTMLElement, BreadcrumbProps>(
  (
    {
      children,
      size = "md",
      separator = "chevron",
      maxItems,
      itemsBeforeCollapse = 1,
      itemsAfterCollapse = 2,
      labels: labelOverrides,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      ...props
    },
    ref,
  ) => {
    const [expanded, setExpanded] = useState(false);
    const listRef = useRef<HTMLOListElement>(null);
    const focusRevealed = useRef(false);

    const labels: BreadcrumbLabels = { ...defaultLabels, ...labelOverrides };
    const all = Children.toArray(children);
    const items = all.filter((child): child is ReactElement => isValidElement(child));

    const before = nonNegative(itemsBeforeCollapse);
    // The last item is the current page, so it is never the one that collapses.
    const after = Math.max(nonNegative(itemsAfterCollapse), 1);
    const hiddenCount = items.length - before - after;
    // Hiding a single item would swap it for a button of the same size, which helps nobody.
    const collapsed = !expanded && maxItems !== undefined && items.length > maxItems && hiddenCount >= 2;

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (all.length !== items.length) {
        console.warn("Breadcrumb: only `Breadcrumb.Item` elements are rendered — a fragment or plain text among the children is ignored.");
      }
    }, [all.length, items.length]);
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && maxItems !== undefined && before + after >= maxItems) {
        console.warn(
          `Breadcrumb: \`itemsBeforeCollapse\` (${before}) and \`itemsAfterCollapse\` (${after}) together fill \`maxItems\` (${maxItems}), so there is nothing left to collapse into the "…" button.`,
        );
      }
    }, [before, after, maxItems]);

    // The "…" button is what has keyboard focus when it is used, and expanding removes it — so focus moves on to
    // the first item it revealed instead of dropping to the top of the document.
    useEffect(() => {
      if (!expanded || !focusRevealed.current) return;
      focusRevealed.current = false;
      const revealed = listRef.current?.children[before];
      revealed?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, [expanded, before]);

    const expand = () => {
      focusRevealed.current = true;
      setExpanded(true);
    };

    type Entry = { key: string; node: ReactNode; isLast: boolean };
    const visible: Array<ReactElement | "ellipsis"> = collapsed
      ? [...items.slice(0, before), "ellipsis", ...items.slice(items.length - after)]
      : items;
    const entries: Entry[] = visible.map((entry, index) => {
      const isLast = index === visible.length - 1;
      if (entry === "ellipsis") {
        return {
          key: "ellipsis",
          isLast,
          node: (
            <BreadcrumbItem>
              <IconButton
                icon={DotsThreeIcon}
                variant="tertiary"
                size={expandSizeForSize[size]}
                aria-label={labels.expand(hiddenCount)}
                onClick={expand}
                className={styles.expand}
              />
            </BreadcrumbItem>
          ),
        };
      }
      return { key: String(entry.key ?? index), isLast, node: entry };
    });

    return (
      <BreadcrumbContext.Provider value={{ size, separator }}>
        <nav
          {...props}
          ref={ref}
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.navigation)}
          aria-labelledby={ariaLabelledBy}
          className={cx(styles.root, sizeClass[size], className)}
        >
          {/* The `list` role is stated outright, for the reason given at `BreadcrumbItem`. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `BreadcrumbItem`. */}
          <ol ref={listRef} role="list" className={styles.list}>
            {entries.map(({ key, node, isLast }) => (
              <ItemPositionContext.Provider key={key} value={{ isLast }}>
                {node}
              </ItemPositionContext.Provider>
            ))}
          </ol>
        </nav>
      </BreadcrumbContext.Provider>
    );
  },
);
BreadcrumbRoot.displayName = "Breadcrumb";

type BreadcrumbComponent = typeof BreadcrumbRoot & {
  Item: typeof BreadcrumbItem;
  Link: typeof BreadcrumbLink;
  Page: typeof BreadcrumbPage;
};

export const Breadcrumb: BreadcrumbComponent = Object.assign(BreadcrumbRoot, {
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
});

