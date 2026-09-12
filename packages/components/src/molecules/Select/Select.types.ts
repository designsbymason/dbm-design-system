import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";

export type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SelectSide = "top" | "right" | "bottom" | "left";
export type SelectAlign = "start" | "center" | "end";

export interface SelectProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "value" | "defaultValue" | "onChange" | "children"
  > {
  /** The controlled selected value. */
  value?: string;
  /** The initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the new value whenever the selection changes. */
  onValueChange?: (value: string) => void;
  /**
   * Shown in the trigger when nothing is selected. No effect when
   * `asChild` is set (the built-in value display isn't rendered in that
   * mode — see `asChild`'s own doc).
   */
  placeholder?: ReactNode;
  /** @default 'md' */
  size?: SelectSize;
  /**
   * Marks the select as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /** Name submitted with the enclosing form. */
  name?: string;
  /** Marks the field as required for native form validation. */
  required?: boolean;
  /** The controlled open state of the dropdown. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the dropdown opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Text direction, passed through to Radix Select. */
  dir?: "ltr" | "rtl";
  /** Associates the field with a `<form>` by id, for use outside one. */
  form?: string;
  autoComplete?: string;
  /**
   * Which side of the trigger the dropdown opens on. Radix repositions it
   * automatically to stay within the viewport if the requested side would
   * overflow.
   * @default 'bottom'
   */
  side?: SelectSide;
  /**
   * Alignment along the chosen `side`, matching `Tooltip`'s identical prop.
   * @default 'start'
   */
  align?: SelectAlign;
  /**
   * Renders the trigger as a single provided element (via Radix `Slot`
   * composition) instead of the built-in styled `<button>` — matching this
   * system's `asChild` convention elsewhere (`Button`, `Tooltip`'s own
   * `children`). Requires `trigger`; the built-in value/placeholder/caret
   * display isn't rendered in this mode, since `Slot` requires exactly one
   * child (warns in development if `trigger` isn't also provided).
   * @default false
   */
  asChild?: boolean;
  /**
   * The custom trigger element used when `asChild` is set — a single
   * element that accepts a ref, replacing the built-in value/caret display
   * entirely (warns in development if passed without `asChild`). Not
   * `children`, since that's already `<Select.Option>`s for the dropdown
   * — matching `Tooltip`'s own single-`ReactElement` trigger shape, just
   * under its own name here since `children` was already spoken for.
   */
  trigger?: ReactElement;
  /**
   * Standard DOM id. Auto-generated via `useId` when omitted — pass your
   * own when another element's `aria-labelledby`/`aria-describedby` needs
   * to point at this component, or a test/router needs a stable, known
   * anchor.
   */
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
  /**
   * Accessible name — required unless a visible `<label>`/`FieldLabel` is
   * associated via `aria-labelledby` or a native `<label for>`/`id` pair,
   * since the trigger has no visible text of its own until a value is
   * selected.
   */
  "aria-label"?: string;
  /**
   * References the id of an element that labels this select, as an
   * alternative to `aria-label`. Use instead of `aria-label` when a
   * visible label already exists.
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of a helper or error message associated with this
   * select (e.g. a paired `FieldHelperText` or `FieldError`) — announced
   * by assistive tech alongside the accessible name. Space-separate
   * multiple ids when pairing with both at once.
   */
  "aria-describedby"?: string;
  /** `<Select.Option>` elements. */
  children?: ReactNode;
}

export interface SelectOptionProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "children" | "id" | "className" | "style"> {
  /** The value submitted when this option is selected. */
  value: string;
  /** Prevents this specific option from being selected. */
  disabled?: boolean;
  /**
   * Plain-text label used for typeahead search (typing a letter to jump to
   * a matching option) when `children` isn't plain, searchable text.
   * Defaults to `children` itself when omitted, matching Radix's own
   * `Select.Item` behavior — only needed when that default wouldn't be a
   * sensible search string.
   */
  textValue?: string;
  /** The option's own visible content. */
  children?: ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * option, or a test/router needs a stable anchor.
   */
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
