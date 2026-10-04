import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";
import type { FieldLabelSize } from "../../atoms/FieldLabel";

/** How the group draws itself: no box, a border, or a tinted fill. */
export type FieldGroupVariant = "ghost" | "outlined" | "filled";

/** Whether the group's fields are stacked or sit side by side (wrapping when they run out of room). */
export type FieldGroupOrientation = "vertical" | "horizontal";

export interface FieldGroupItemProps extends ComponentPropsWithoutRef<"div"> {
  /** The field (or fields) this cell holds. */
  children?: ReactNode;
  /**
   * How many of the group's `columns` this cell spans — a positive whole number, or a breakpoint map. Clamped
   * to the number of columns the group currently has, so a wide cell doesn't keep a narrow screen's grid wide.
   * It does nothing unless the group sets `columns`; outside that, `Item` is a plain wrapper.
   * @default 1
   */
  span?: Responsive<number>;
  /** Additional CSS classes for the cell. */
  className?: string;
  /** Inline styles for the cell. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
  /** Standard DOM id. */
  id?: string;
}

export interface FieldGroupProps
  extends Omit<ComponentPropsWithoutRef<"fieldset">, "children"> {
  /**
   * The group's visible name, rendered as the `<legend>` of a native `<fieldset>`, so assistive tech announces
   * it ahead of every field inside ("Shipping address, group").
   */
  legend: ReactNode;
  /** The fields in the group — usually `FormField`s. */
  children?: ReactNode;
  /**
   * Supplementary text under the legend, rendered via `FieldHelperText`, and described to assistive tech
   * through the group's `aria-describedby`. Hidden while `error` is set — the error replaces it, as
   * `FormField`'s `error` replaces its `helperText`, so there is one message at a time.
   */
  description?: ReactNode;
  /**
   * An error about the group as a whole (an "at least one of these" rule, a mismatch between two fields),
   * rendered via `FieldError` below the fields. Its presence marks the group invalid; each field's own `error`
   * stays on that field.
   */
  error?: ReactNode;
  /**
   * Marks the legend with a required-indicator asterisk, for a group whose fields are all mandatory. Purely
   * visual and hidden from assistive tech (a group role supports no `aria-required`); say what is required in
   * the `description`, and set `required` on the fields themselves for the real constraint.
   * @default false
   */
  required?: boolean;
  /**
   * Keeps the legend for assistive tech and removes it from the page — for a group whose purpose is clear from
   * the surrounding heading.
   * @default false
   */
  hideLegend?: boolean;
  /**
   * How the group draws itself: `ghost` (no box), `outlined` (a border) or `filled` (a tinted fill).
   * @default 'ghost'
   */
  variant?: FieldGroupVariant;
  /**
   * The default `size` of every `FormField` inside — its label, and (through the props the field hands its
   * control) the control itself — which a field can still override with its own. Also the legend's size unless
   * `legendSize` says otherwise.
   * @default 'md'
   */
  size?: FieldLabelSize;
  /**
   * Font size of the legend alone, so a large section title can sit over ordinary-sized fields. Defaults to the
   * group's `size`.
   */
  legendSize?: FieldLabelSize;
  /**
   * `vertical` stacks the fields; `horizontal` puts them side by side and wraps the next onto its own line
   * when a field would be narrower than a usable width. Takes a breakpoint map. Ignored when `columns` is set.
   * @default 'vertical'
   */
  orientation?: Responsive<FieldGroupOrientation>;
  /**
   * A fixed number of equal columns, or a breakpoint map (`{ base: 1, md: 3 }`), for fields of different
   * widths: wrap each field in `FieldGroup.Item` and give it a `span`. Takes precedence over `orientation`.
   * Unset by default (the group is stacked or `horizontal`).
   */
  columns?: Responsive<number>;
  /**
   * The space between rows of fields, as a step on the spacing scale — a single value, or a breakpoint map.
   * Also the space between columns unless `columnGap` is set.
   * @default 4
   */
  gap?: Responsive<SpaceValue>;
  /**
   * The space between side-by-side fields (`horizontal` or `columns`), when it should differ from `gap`.
   * Defaults to `gap`.
   */
  columnGap?: Responsive<SpaceValue>;
  /**
   * Disables the whole group: the native `<fieldset disabled>` disables every native control inside, each
   * `FormField` inside is dimmed and disabled too, and a nested group inherits it.
   * @default false
   */
  disabled?: boolean;
  /**
   * Associates the group with a `<form>` by that form's id, for a group rendered outside the form's own element.
   * The native `<fieldset form>` attribute.
   */
  form?: string;
  /**
   * The native `<fieldset name>` attribute: a name for the group in the form's `elements` collection. It is not
   * a field name, and nothing is submitted under it.
   */
  name?: string;
  /** Overrides the auto-generated base id used for the description's and error's own ids. */
  id?: string;
  /** Additional CSS classes for the `<fieldset>`. */
  className?: string;
  /** Inline styles for the `<fieldset>`. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
  /** Extra ids of elements that also describe the group, joined to the description's and error's own. */
  "aria-describedby"?: string;
}
