import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * Cell padding and typography, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — never a component-specific scale.
 * Applies to every `Table.Cell` and `Table.HeaderCell` inside the table.
 */
export type TableSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * `"bordered"` (the default) draws an outer border and rounded corners
 * around the whole table, with a hairline divider between rows — a
 * self-contained table meant to stand on its own. `"ghost"` removes the
 * outer border/corners (keeping the between-row dividers) for embedding
 * inside a container that already provides its own boundary, e.g. a `Card`.
 */
export type TableVariant = "bordered" | "ghost";

/**
 * The table's colour treatment, on the standard tone scale
 * (`05-component-api-conventions.md` §2). `"neutral"` (the default) has no
 * header or caption fill and neutral striping and hover. Every other tone
 * applies the same treatment in its own colour: a solid header and caption
 * fill (with the matching on-colour text), tinted striped rows, and a tinted
 * row hover. `"brand"` follows the active brand theme; `"success"`,
 * `"warning"`, `"danger"`, and `"info"` are fixed status colours.
 */
export type TableTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Horizontal alignment of a cell's content, in logical terms — `"start"`
 * follows reading direction (left in LTR, right in RTL) and `"end"` is its
 * opposite, so alignment mirrors correctly under RTL with no extra work.
 * Right-align (`"end"`) numeric columns so digits line up.
 */
export type TableCellAlign = "start" | "center" | "end";

export interface TableProps
  extends Omit<ComponentPropsWithoutRef<"table">, "children" | "className" | "style" | "id"> {
  /** `Table.Caption`, `Table.Header`, `Table.Body`, and (optionally) `Table.Footer`. */
  children: ReactNode;
  /**
   * The table's own visual treatment — a self-contained bordered table, or
   * a borderless treatment for embedding inside an already-bordered
   * container (e.g. a `Card`).
   * @default 'bordered'
   */
  variant?: TableVariant;
  /**
   * The table's colour treatment. `"neutral"` (the default) is uncoloured;
   * every other tone gives the header and the caption a solid fill in that
   * colour with matching on-colour text, and tints the `striped` and
   * `hoverable` row backgrounds to match. `"brand"` follows the active brand
   * theme (Purple or Emerald); `"success"`, `"warning"`, `"danger"`, and
   * `"info"` are fixed status colours that don't change with the brand.
   * @default 'neutral'
   */
  tone?: TableTone;
  /**
   * Cell padding and typography for every `Table.Cell`/`Table.HeaderCell`
   * inside this table.
   * @default 'md'
   */
  size?: TableSize;
  /**
   * Alternates the background of every other `Table.Body` row, to help the
   * eye track a row across a wide table.
   * @default false
   */
  striped?: boolean;
  /**
   * Highlights a `Table.Body` row while the pointer is over it, to help
   * track a row across wide columns. Purely a reading aid — the table
   * itself stays non-interactive; use `DataTable` (when it ships) for
   * selectable or clickable rows.
   * @default false
   */
  hoverable?: boolean;
  /**
   * Pins the `Table.Header` row to the top of the table's own scroll area
   * while the body scrolls beneath it. Only has an effect when the table's
   * height is actually constrained — set `maxHeight` (or constrain
   * `containerClassName` yourself); without one the table never scrolls
   * vertically, so there is nothing for the header to stay pinned against.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Caps the height of the table's own scroll container (any valid CSS
   * `max-height` value, e.g. `"24rem"`), so a long body scrolls inside it
   * instead of growing the page. Required for `stickyHeader` to have any
   * effect.
   */
  maxHeight?: CSSProperties["maxHeight"];
  /**
   * An accessible name for the table, for when there's no visible
   * `Table.Caption` to provide one. Also names the table's own scroll
   * region when the table overflows and becomes keyboard-focusable.
   */
  "aria-label"?: string;
  /**
   * The id of an element that names this table (e.g. a nearby heading), for
   * when there's no visible `Table.Caption` to provide one. Also names the
   * table's own scroll region when the table overflows and becomes
   * keyboard-focusable.
   */
  "aria-labelledby"?: string;
  /** The id of an element that describes this table (e.g. a paragraph of context above it). */
  "aria-describedby"?: string;
  /**
   * Additional CSS classes for the table's own scroll container — the
   * `<div>` wrapping the `<table>` that provides horizontal (and, with
   * `maxHeight`, vertical) scrolling. `className` targets the `<table>`
   * element itself; use this for anything that needs to affect the
   * scrolling frame instead (its width, its border, a constrained height).
   */
  containerClassName?: string;
  /** Additional CSS classes for the `<table>` element itself. */
  className?: string;
  /** Inline styles for the `<table>` element itself, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id, applied to the `<table>` element. Rarely needed
   * directly, but required when another element's
   * `aria-labelledby`/`aria-describedby` needs to point at this table, or
   * when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the `<table>`; has no visual or behavioral
   * effect.
   */
  "data-testid"?: string;
}

export interface TableHeaderProps extends Omit<ComponentPropsWithoutRef<"thead">, "children" | "className" | "style" | "id"> {
  /** One or more `Table.Row`s of `Table.HeaderCell`s. */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * header group, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableBodyProps extends Omit<ComponentPropsWithoutRef<"tbody">, "children" | "className" | "style" | "id"> {
  /** One or more `Table.Row`s. */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * body group, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableFooterProps extends Omit<ComponentPropsWithoutRef<"tfoot">, "children" | "className" | "style" | "id"> {
  /** One or more `Table.Row`s — typically totals or a summary. */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * footer group, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableRowProps extends Omit<ComponentPropsWithoutRef<"tr">, "children" | "className" | "style" | "id" | "align"> {
  /** One or more `Table.Cell`s and/or `Table.HeaderCell`s. */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * row, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableHeaderCellProps
  extends Omit<ComponentPropsWithoutRef<"th">, "children" | "className" | "style" | "id" | "align" | "scope"> {
  /** The header cell's own content — a column or row label. */
  children?: ReactNode;
  /**
   * Which cells this header labels, for assistive technology: `"col"` for
   * a column header (the default, and correct inside `Table.Header`),
   * `"row"` for a row header (the first cell of a body row that labels
   * the rest of that row). Also accepts `"colgroup"`/`"rowgroup"` for
   * headers spanning a group of columns/rows.
   * @default 'col'
   */
  scope?: "col" | "row" | "colgroup" | "rowgroup";
  /**
   * Horizontal alignment of the cell's content, in logical terms.
   * @default 'start'
   */
  align?: TableCellAlign;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * cell's `headers` attribute (for a complex, multi-level header
   * relationship) or an `aria-labelledby` needs to point at this header
   * cell, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableCellProps extends Omit<ComponentPropsWithoutRef<"td">, "children" | "className" | "style" | "id" | "align"> {
  /** The cell's own content — text, a `Badge`, an `Avatar`, anything. */
  children?: ReactNode;
  /**
   * Horizontal alignment of the cell's content, in logical terms.
   * Right-align (`"end"`) numeric columns so digits line up.
   * @default 'start'
   */
  align?: TableCellAlign;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` (or a header cell's
   * `headers` attribute) needs to point at this cell, or when a test or
   * router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableCaptionProps extends Omit<ComponentPropsWithoutRef<"caption">, "children" | "className" | "style" | "id"> {
  /**
   * The table's visible title/description. Names the table for assistive
   * technology automatically (the native `<caption>` relationship), and
   * also names the table's own scroll region when it overflows — prefer
   * this over `aria-label` whenever a visible title makes sense.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. When omitted, a stable id is generated automatically
   * so the table's own scroll region can name itself after this caption.
   * Rarely needed directly — pass one only when another element needs a
   * predictable id to point at.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
