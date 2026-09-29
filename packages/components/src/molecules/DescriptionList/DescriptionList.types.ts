import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * Padding and typography for every `DescriptionList.Item`, on the standard
 * 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale.
 */
export type DescriptionListSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * `"bordered"` (the default) draws an outer border and rounded corners
 * around the whole list — a self-contained block meant to stand on its own.
 * `"ghost"` removes the outer border/corners for embedding inside a
 * container that already provides its own boundary, e.g. a `Card`. Both
 * keep the hairline divider between items (see `DescriptionList`'s own
 * `columns` doc for when that divider is drawn at all).
 */
export type DescriptionListVariant = "bordered" | "ghost";

/**
 * How each item's term and details relate to one another.
 *
 * - `"horizontal"` (the default) — the term sits beside its details, like a
 *   label column next to a value column. The details wraps onto its own
 *   line below the term once the item's own width can't fit both side by
 *   side (a real, container-driven response to narrow space — no
 *   breakpoint configuration needed).
 * - `"vertical"` — the term stacks above its details, each on its own line.
 */
export type DescriptionListOrientation = "horizontal" | "vertical";

export interface DescriptionListProps
  extends Omit<ComponentPropsWithoutRef<"dl">, "children" | "className" | "style" | "id"> {
  /** One or more `DescriptionList.Item`s. */
  children: ReactNode;
  /**
   * The list's own visual treatment — a self-contained bordered block, or a
   * borderless treatment for embedding inside an already-bordered container
   * (e.g. a `Card`).
   * @default 'bordered'
   */
  variant?: DescriptionListVariant;
  /**
   * Padding and typography for every item, term, and details in this list.
   * @default 'md'
   */
  size?: DescriptionListSize;
  /**
   * How every item's term and details relate to one another — side by side,
   * or stacked.
   * @default 'horizontal'
   */
  orientation?: DescriptionListOrientation;
  /**
   * Lays the items out in a grid of this many columns, wrapping to a new row
   * after every `columns` items — for a compact "facts panel" of several
   * short fields side by side, instead of one long vertical list. Accepts a
   * mobile-first responsive map (e.g. `{ base: 1, md: 3 }`) so a wide,
   * multi-column layout can collapse to a single column on a narrow screen.
   *
   * The automatic hairline divider between items (see `variant`) only draws
   * when `columns` is left at its default of `1` — past that, items sit in
   * their own grid cell with no divider, since a single divider line can't
   * correctly represent both the row and column boundaries of a wrapping
   * grid without a real `<table>` underneath it (which a `<dl>` correctly
   * isn't). Give a multi-column list its own visual separation instead, e.g.
   * `variant="bordered"` around each item, or embed it in a `Card`.
   * @default 1
   */
  columns?: Responsive<number>;
  /**
   * Sizes every term to the width of the widest term in the list, so every
   * details value starts at the same position — a real aligned label
   * column, not just several independently-sized ones. Set `false` to let
   * each term hug its own content instead (the original, per-item width).
   *
   * Only has an effect for `orientation="horizontal"` (a stacked term has no
   * side-by-side width to align) and while `columns` is left at its default
   * of `1` — the same scoping as the automatic between-item divider, and for
   * the same reason: aligning terms needs every term/details pair to join
   * one shared 2-column grid, which only has one unambiguous shape when the
   * list is a single column. A multi-column list (or an `Item` with `span`
   * set) keeps each term sized to its own content regardless of this prop.
   * @default true
   */
  alignedDetails?: boolean;
  /** An accessible name for the list, for when there's no visible heading naming it (e.g. a nearby `Card.Header`). */
  "aria-label"?: string;
  /** The id of an element that names this list (e.g. a nearby heading), for when there's no visible heading naming it directly above. */
  "aria-labelledby"?: string;
  /** The id of an element that describes this list (e.g. a paragraph of context above it). */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the `<dl>` element. Rarely needed directly,
   * but required when another element's `aria-labelledby`/`aria-describedby`
   * needs to point at this list, or when a test or router needs a stable
   * anchor.
   */
  id?: string;
  /** Additional CSS classes for the `<dl>` element. */
  className?: string;
  /** Inline styles for the `<dl>` element, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the `<dl>`; has no visual or behavioral
   * effect.
   */
  "data-testid"?: string;
}

export interface DescriptionListItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /** One `DescriptionList.Term` and one `DescriptionList.Details`. */
  children: ReactNode;
  /**
   * How many of the list's `columns` this item spans — an escape hatch for
   * a wide value (notes, a long description) that should stretch across an
   * otherwise multi-column list, the same idea as `GridItem`'s `colSpan`.
   * Has no effect when the list's `columns` is left at its default of `1`.
   * Must be a positive integer; a zero or negative value is invalid per the
   * CSS Grid spec and is ignored with a development warning.
   * @default 1
   */
  span?: number;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * item, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DescriptionListTermProps
  extends Omit<ComponentPropsWithoutRef<"dt">, "children" | "className" | "style" | "id"> {
  /**
   * The term's own content — usually a field name or label, but any
   * content works (an icon, a `Tooltip` trigger, a `Badge`) — there's no
   * dedicated icon slot, so compose one inline. Wrap an icon with the word
   * right after it in a small `display: inline-flex` span (`align-items:
   * "center"`, a `space.1` `gap`) rather than a plain inline `Icon` next to
   * bare text: a browser can still break a line between an icon and its
   * word once the term column narrows, even with zero whitespace between
   * them (an atomic inline-level box like an SVG gets an implicit break
   * opportunity independent of whitespace) — found live, user-reported,
   * landing the icon alone on its own line. `inline-flex` children never
   * wrap between each other the way inline text-flow content can, so this
   * holds at any width. See the Docs page's own icon example.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * term, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DescriptionListDetailsProps
  extends Omit<ComponentPropsWithoutRef<"dd">, "children" | "className" | "style" | "id"> {
  /** The details' own content — the value for the paired term. */
  children: ReactNode;
  /**
   * Marks this details as holding a number: sets tabular figures
   * (`font-variant-numeric: tabular-nums`), so a value that changes doesn't
   * shift width digit by digit. Unlike `Table.Cell`'s `numeric`, this
   * doesn't change alignment — a details value isn't part of a dense
   * multi-row numeric column the way a table cell can be, so end-aligning a
   * single standalone value would just look adrift from its term.
   * @default false
   */
  numeric?: boolean;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * details, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
