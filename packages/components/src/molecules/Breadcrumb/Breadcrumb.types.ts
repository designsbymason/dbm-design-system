import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { LinkProps } from "../../atoms/Link";

/**
 * The size of the trail's text, icons and gaps, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — the same steps as `Button`.
 */
export type BreadcrumbSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What sits between two items. `"chevron"` (the default) is a small arrow
 * pointing along the reading direction (it flips under right-to-left text);
 * `"slash"` is a `/`. Anything else is drawn as given — a short string
 * (`"›"`, `"•"`) or an element (an icon). It is always hidden from assistive
 * technology: the list already tells a screen reader how many items there are
 * and which one it is on.
 */
export type BreadcrumbSeparator = "chevron" | "slash" | ReactNode;

/**
 * The text `Breadcrumb` supplies itself, translatable through the `labels`
 * prop (`ADR-0021`). A label that needs a number is a function of the plain
 * number.
 */
export interface BreadcrumbLabels {
  /** The `<nav>`'s accessible name. @default 'Breadcrumb' */
  navigation: string;
  /**
   * The accessible name of the button that stands in for collapsed items,
   * given how many are hidden. It is a button showing only "…", so this is its
   * whole name. @default (count) => `Show ${count} hidden page(s)`
   */
  expand: (hiddenCount: number) => string;
}

export interface BreadcrumbProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "className" | "style" | "id"> {
  /**
   * The trail, in order from the top of the site down to the current page: one
   * `Breadcrumb.Item` per level, the last holding `Breadcrumb.Page`. Only
   * `Breadcrumb.Item` elements are rendered — a fragment or plain text among
   * them is ignored (with a warning in development).
   */
  children: ReactNode;
  /**
   * The size of the text, icons and gaps.
   * @default 'md'
   */
  size?: BreadcrumbSize;
  /**
   * What sits between two items — see {@link BreadcrumbSeparator}.
   * @default 'chevron'
   */
  separator?: BreadcrumbSeparator;
  /**
   * Collapses a long trail: when there are more items than this, the ones in
   * the middle are replaced by a "…" button that shows them all when used. Left
   * out, the trail never collapses and simply wraps onto more lines when it is
   * too wide.
   */
  maxItems?: number;
  /**
   * How many items stay visible at the start of a collapsed trail, before the
   * "…" button. Has no effect without `maxItems`.
   * @default 1
   */
  itemsBeforeCollapse?: number;
  /**
   * How many items stay visible at the end of a collapsed trail, after the
   * "…" button — always at least 1, since the last item is the current page.
   * Has no effect without `maxItems`.
   * @default 2
   */
  itemsAfterCollapse?: number;
  /** The text the component supplies itself, each part replaceable. See {@link BreadcrumbLabels}. */
  labels?: Partial<BreadcrumbLabels>;
  /**
   * The `<nav>`'s accessible name, overriding `labels.navigation`. Give each
   * breadcrumb a distinct name when a page holds more than one.
   */
  "aria-label"?: string;
  /** The id of a visible element that names the `<nav>`, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id, on the `<nav>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface BreadcrumbItemProps
  extends Omit<ComponentPropsWithoutRef<"li">, "className" | "style" | "id"> {
  /** A `Breadcrumb.Link` for a page above the current one, or `Breadcrumb.Page` for the current one. */
  children?: ReactNode;
  /** Standard DOM id, on the `<li>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}

export interface BreadcrumbLinkProps extends Omit<LinkProps, "underline"> {
  /**
   * An icon shown before the text — a component reference from
   * `@dbm-design-system/icons`, not a string name. Decorative, so the link
   * still needs text (or an `aria-label`). Not drawn with `asChild`, since the
   * slotted element owns its own content; put the icon inside it instead.
   */
  icon?: PhosphorIcon;
}

export interface BreadcrumbPageProps extends Omit<ComponentPropsWithoutRef<"span">, "className" | "style" | "id"> {
  /** The current page's name. */
  children?: ReactNode;
  /**
   * An icon shown before the text — a component reference from
   * `@dbm-design-system/icons`, not a string name. Decorative.
   */
  icon?: PhosphorIcon;
  /** Standard DOM id, on the `<span>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute. */
  "data-testid"?: string;
}
