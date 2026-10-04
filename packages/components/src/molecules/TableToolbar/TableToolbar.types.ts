import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";
import type { TagTone } from "../../atoms/Tag";

/** On the shared 5-step scale; the same steps `Button`, `Tag` and the inputs use. */
export type TableToolbarSize = ButtonSize;

export interface TableToolbarProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /**
   * The bar's rows, in reading order: a `TableToolbar.Row` of the search field and toolbars, a `TableToolbar.Row` holding
   * `TableToolbar.ActiveFilters` and `TableToolbar.Summary`, then `TableToolbar.Selection`.
   */
  children?: ReactNode;
  /**
   * The size every part that draws text or controls itself (`Filter` outside a toolbar, `ActiveFilters`, `Summary`,
   * `Selection`) uses unless it sets its own, on the shared scale. Say the same `size` on the `SearchInput` and the
   * `Toolbar`s you put in a row, which are your own components and don't read this.
   * @default 'md'
   */
  size?: TableToolbarSize;
  /**
   * Names the bar for assistive tech ("Orders table tools"). Required unless `aria-labelledby` points at a visible label:
   * a `role="group"` with no name is just a set of controls.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the bar, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the bar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the bar's element; has no visual
   * or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableToolbarRowProps extends ComponentPropsWithoutRef<"div"> {
  /** What shares the row: the search slot, `Toolbar`s, a `Spacer`, `ActiveFilters`, `Summary`. */
  children?: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export type TableToolbarSearchProps = TableToolbarRowProps;

/** The words `TableToolbar.Filter` supplies itself. */
export interface TableToolbarFilterLabels {
  /** The panel's button that clears this filter. */
  clear: string;
  /** Said after the filter's name while some of it is applied: "Status, 2 active". Takes the plain count. */
  activeCount: (count: number) => string;
  /** The panel's accessible name: "Status filter". Takes the filter's `label`. */
  panel: (label: string) => string;
}

export interface TableToolbarFilterProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> {
  /** The filter's name, shown on its button ("Status"). */
  label: string;
  /**
   * The filter controls in the panel: a `CheckboxGroup`, a `RadioGroup`, a `Select`, a range. They are yours and their
   * state is yours; this part only opens and names the panel.
   */
  children?: ReactNode;
  /**
   * How many values of this filter are applied. Above zero the button shows the count, its accessible name says it
   * ("Status, 2 active"), and the panel offers `onClear`. Zero, the default, shows nothing.
   * @default 0
   */
  count?: number;
  /** Shows a "Clear" button in the panel while `count` is above zero, calling this when pressed. Left out, there is none. */
  onClear?: () => void;
  /** Whether the panel is open, when controlled. Pair with `onOpenChange`. */
  open?: boolean;
  /** Whether the panel starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The button's look. Inside a `Toolbar` it follows the toolbar's `variant` when left out; on its own it is `secondary`.
   */
  variant?: ButtonVariant;
  /**
   * The button's size. Inside a `Toolbar` it follows the toolbar's `size` when left out; on its own it is the bar's `size`.
   */
  size?: TableToolbarSize;
  /** An icon before the label, a component from `@dbm-design-system/icons` (a funnel for "Filter"). */
  icon?: PhosphorIcon;
  /**
   * Which edge of the button the panel lines up with.
   * @default 'start'
   */
  align?: "start" | "center" | "end";
  /** Replaces the words this part writes, per key. */
  labels?: Partial<TableToolbarFilterLabels>;
  /** Writes the count in a locale's own numerals. Plain `String` by default; also used by the default `activeCount`. */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the button; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** One applied filter, as `TableToolbar.ActiveFilters` shows it. */
export interface TableToolbarActiveFilter {
  /** Identifies the filter value; passed back to `onRemove`. Unique within the list. */
  id: string;
  /** What the chip says ("Open"). Plain text, so the remove button can be named after it. */
  label: string;
  /** The filter it belongs to, written before the label ("Status: Open"). */
  group?: string;
}

/** The words `TableToolbar.ActiveFilters` supplies itself. */
export interface TableToolbarActiveFiltersLabels {
  /** The list's accessible name. */
  list: string;
  /** The "Clear all" button. */
  clearAll: string;
  /** A chip's remove button: "Remove filter: Status: Open". Takes the chip's text. */
  remove: (label: string) => string;
  /** What is announced when the number of applied filters changes: "2 filters applied", "No filters applied". Takes the plain count. */
  applied: (count: number) => string;
}

export interface TableToolbarActiveFiltersProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick"> {
  /**
   * The filters applied right now. Empty (or left out), nothing is drawn, but the live region that announces changes stays
   * in the page, so going from some to none is still announced.
   */
  items?: TableToolbarActiveFilter[];
  /** Called with the chip's `id` when its remove button is pressed. */
  onRemove?: (id: string) => void;
  /** Shows a "Clear all" button while more than one filter is applied, calling this when pressed. */
  onClearAll?: () => void;
  /** The chips' size, on the shared scale. Defaults to the bar's `size`. */
  size?: TableToolbarSize;
  /**
   * The chips' colour.
   * @default 'neutral'
   */
  tone?: TagTone;
  /**
   * Announces a change in how many filters are applied to screen readers, never the first appearance.
   * @default true
   */
  announce?: boolean;
  /** Replaces the words this part writes, per key. */
  labels?: Partial<TableToolbarActiveFiltersLabels>;
  /** Writes the counts in the default announcements in a locale's own numerals. Plain `String` by default. */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** The words `TableToolbar.Summary` supplies itself. */
export interface TableToolbarSummaryLabels {
  /** "128 results", "1 result", "No results". Takes the plain count. */
  results: (count: number) => string;
  /** "12 of 128 results", for a filtered list: the count shown, then the total. Takes the plain numbers. */
  resultsOf: (count: number, total: number) => string;
}

export interface TableToolbarSummaryProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * How many results there are. Left out (`undefined`) it means "not known yet": nothing is shown, and the count that
   * arrives is not announced as if someone had changed something. `0` is a count, and says "No results".
   */
  count?: number;
  /** The unfiltered total. Given, and larger than `count`, the text reads "12 of 128 results". */
  total?: number;
  /** The text size, on the shared scale. Defaults to the bar's `size`. */
  size?: TableToolbarSize;
  /**
   * Announces a change in the count to screen readers, never the first count to appear.
   * @default true
   */
  announce?: boolean;
  /** Replaces the words this part writes, per key. */
  labels?: Partial<TableToolbarSummaryLabels>;
  /** Writes the numbers in a locale's own numerals. Plain `String` by default; also used by the default `results`. */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** The words `TableToolbar.Selection` supplies itself. */
export interface TableToolbarSelectionLabels {
  /** The row's accessible name. */
  group: string;
  /** "3 selected". Takes the plain count. */
  selected: (count: number) => string;
  /** Announced when the selection is emptied. */
  cleared: string;
  /** The button that clears the selection. */
  clear: string;
  /** The button that selects everything: "Select all 128". Takes the plain total. */
  selectAll: (total: number) => string;
}

export interface TableToolbarSelectionProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /**
   * How many rows are selected. At `0` (or less) the row is hidden, but its live region stays in the page, so emptying the
   * selection is still announced.
   */
  count: number;
  /** How many rows there are in all. With `onSelectAll`, a "Select all" button shows while fewer than this are selected. */
  totalCount?: number;
  /** Shows a "Clear selection" button, calling this when pressed. Left out, there is none. */
  onClear?: () => void;
  /** Shows a "Select all N" button while `count` is below `totalCount`, calling this when pressed. */
  onSelectAll?: () => void;
  /** The bulk actions: a `Toolbar` of `Toolbar.Button`s is the usual choice, so they are one tab stop. */
  children?: ReactNode;
  /** The text and button size, on the shared scale. Defaults to the bar's `size`. */
  size?: TableToolbarSize;
  /**
   * Announces a change in the selection to screen readers, never the first appearance.
   * @default true
   */
  announce?: boolean;
  /** Replaces the words this part writes, per key. */
  labels?: Partial<TableToolbarSelectionLabels>;
  /** Writes the counts in a locale's own numerals. Plain `String` by default; also used by the default labels. */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}
