import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";

/**
 * The size of the outline's text and spacing, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — the same steps as `Breadcrumb`.
 */
export type TableOfContentsSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The colour of the current entry and of the marker beside it, on the tone scale
 * (`05-component-api-conventions.md` §2) — the two that make sense for a marker.
 *
 * - `"brand"` (the default) — the active brand theme's accent (`text.brand`, `border.brand`).
 * - `"neutral"` — primary text (`text.primary`) and a strong neutral marker (`border.neutral-strong`), for an outline
 *   that should stay quiet, or that sits on `bg.canvas`, where brand text falls under the 4.5:1 floor.
 */
export type TableOfContentsTone = "brand" | "neutral";

/** One entry of an outline you write yourself. */
export interface TableOfContentsItem {
  /** The id of the element this entry points at. The link goes to `#id`. */
  id: string;
  /** The entry's text. */
  label: ReactNode;
  /**
   * How deeply nested the entry is, from 1 (the top level) to 4. Each level is indented one step.
   * @default 1
   */
  level?: 1 | 2 | 3 | 4;
}

/**
 * The text `TableOfContents` supplies itself, translatable through the `labels` prop (`ADR-0021`).
 */
export interface TableOfContentsLabels {
  /** The visible heading above the list, which also names the `<nav>` while it is shown. @default 'On this page' */
  title: string;
  /** The `<nav>`'s accessible name when the heading is hidden (`showTitle={false}`). @default 'Table of contents' */
  navigation: string;
}

export interface TableOfContentsProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "className" | "style" | "id"> {
  /**
   * The entries, written out. Leave it out to read them from the page instead (see `contentRef` and `selector`).
   * An empty list renders nothing.
   */
  items?: TableOfContentsItem[];
  /**
   * With no `items`, the element whose headings make the outline. Left out, the whole document is searched. The
   * headings are read in the browser after the first render — and again when the container's content changes — so a
   * server-rendered page has no outline until it loads, and an element with no `id` is skipped (with a warning in
   * development), since there is nothing to link to.
   */
  contentRef?: RefObject<HTMLElement | null>;
  /**
   * With no `items`, which elements are entries: a CSS selector. An `h1`–`h6` is indented by how far its level is
   * below the highest one found (`h2` and `h3` give two levels); any other element is a top-level entry, or takes a
   * level from its `data-toc-level` attribute.
   * @default 'h2, h3'
   */
  selector?: string;
  /**
   * The id of the entry marked as current — controlled. Pair it with `onActiveIdChange`. While it is set, scrolling
   * no longer changes the marked entry on its own.
   */
  activeId?: string;
  /**
   * The id of the entry marked as current at first — uncontrolled. Afterwards the outline follows the scroll position:
   * the last heading that has reached the top of the scrolling area, or, before any has, the first one showing in it.
   */
  defaultActiveId?: string;
  /** Called when the current entry changes, by scrolling or by a click, with its id (or `undefined` when none). */
  onActiveIdChange?: (id: string | undefined) => void;
  /**
   * The scrolling element the headings live in. Left out, the page itself. It sets what is measured and what a click
   * scrolls, the same name and shape as on `Affix` and `BackToTop`.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * How far from the top of the scrolling area, in pixels, a heading counts as reached and a click leaves it — the
   * height of a sticky header sitting over the content.
   * @default 0
   */
  scrollOffset?: number;
  /**
   * Whether a click scrolls smoothly. It never does while the person prefers reduced motion.
   * @default true
   */
  smoothScroll?: boolean;
  /**
   * The size of the text and spacing.
   * @default 'md'
   */
  size?: TableOfContentsSize;
  /**
   * The colour of the current entry and its marker — see {@link TableOfContentsTone}.
   * @default 'brand'
   */
  tone?: TableOfContentsTone;
  /**
   * Whether the heading above the list is shown. Hidden, the list keeps `labels.navigation` as its name.
   * @default true
   */
  showTitle?: boolean;
  /** Translatable text. @default { title: 'On this page', navigation: 'Table of contents' } */
  labels?: Partial<TableOfContentsLabels>;
  /** The `<nav>`'s accessible name, replacing the one from `labels` — for a page that has more than one outline. */
  "aria-label"?: string;
  /** The id of an element that names the `<nav>`, replacing the one from `labels`. */
  "aria-labelledby"?: string;
  /** Standard DOM id, set on the `<nav>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test id, passed through to the `<nav>`. */
  "data-testid"?: string;
}
