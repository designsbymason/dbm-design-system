import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";
import type { SpacerProps } from "../../atoms/Spacer";

export type ToolbarOrientation = "horizontal" | "vertical";
export type ToolbarVariant = "ghost" | "outlined" | "filled";
export type ToolbarDirection = "ltr" | "rtl";

export interface ToolbarProps extends Omit<ComponentPropsWithoutRef<"div">, "role" | "dir"> {
  /**
   * The toolbar's contents: `Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Item`, `Toolbar.Group`,
   * `Toolbar.Separator` and `Toolbar.Spacer`. Only `Toolbar.Button`, `Toolbar.IconButton` and `Toolbar.Item` take
   * part in arrow-key movement; a plain `Button` inside a toolbar is just another tab stop.
   */
  children?: ReactNode;
  /**
   * How the bar itself is drawn: `ghost` (no surface of its own, the items sit on the page), `outlined` (a
   * bordered bar) or `filled` (a tinted bar).
   * @default 'ghost'
   */
  variant?: ToolbarVariant;
  /**
   * The visual style every `Toolbar.Button` and `Toolbar.IconButton` uses unless it sets its own `variant`.
   * `ghost` keeps a row of icon buttons quiet; use `secondary` or `primary` for a bar of labelled actions.
   * @default 'ghost'
   */
  itemVariant?: ButtonVariant;
  /**
   * The size of the bar's padding and gaps and the default `size` of every item, on the shared scale.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Fully rounded items, and a pill-shaped bar when `variant` draws one. Also the default for each item's own
   * `rounded`.
   * @default false
   */
  rounded?: boolean;
  /**
   * Disables every item in the toolbar. A disabled item can't be focused, so arrow keys skip it. An item that is
   * disabled itself stays disabled either way.
   * @default false
   */
  disabled?: boolean;
  /**
   * Lays the items out in a row or a column; the arrow keys that move between items follow it (left and right
   * for a row, up and down for a column). Also takes a mobile-first map keyed by breakpoint
   * (`{ base: "vertical", md: "horizontal" }`).
   * @default 'horizontal'
   */
  orientation?: Responsive<ToolbarOrientation>;
  /**
   * The reading direction, which decides which arrow key goes forwards in a row. Not read from the page: pass
   * `"rtl"` on a right-to-left page.
   * @default 'ltr'
   */
  dir?: ToolbarDirection;
  /**
   * Whether the arrow keys wrap from the last item to the first, and back. `false` stops at the ends.
   * @default true
   */
  loop?: boolean;
  /**
   * Stretches the bar to the width of its container. A bar is as wide as its items otherwise, so a `Toolbar.Spacer`
   * has nothing to take up until the bar is given more room than its items need — by this, or by a width of its own.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Lets a horizontal bar wrap its items onto more lines when they don't fit. Off, a bar wider than its container
   * overflows it. Arrow keys still follow DOM order, so a wrapped bar reads in the order written.
   * @default false
   */
  wrap?: boolean;
  /**
   * Names the toolbar for assistive tech ("Text formatting") — announced when focus enters it. Required unless
   * `aria-labelledby` points at a visible label.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the toolbar, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the toolbar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the toolbar's element;
   * has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface ToolbarItemProps {
  /**
   * The one focusable element to put in the toolbar's arrow-key order, as a single element that takes the props
   * it is handed (a `Button` with `asChild`, a menu or popover trigger, a native `<a>`). Prefer `Toolbar.Button`
   * and `Toolbar.IconButton` for plain buttons.
   */
  children: ReactElement;
  /**
   * Takes this item out of arrow-key movement. The toolbar's `disabled` does so for every item either way. The
   * element itself still needs its own disabled state.
   * @default false
   */
  disabled?: boolean;
}

export interface ToolbarGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /** The items in the group. */
  children?: ReactNode;
  /**
   * Names the group for assistive tech ("Text style"). Required unless `aria-labelledby` points at a visible label:
   * a group with no name is just a set of items.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the group, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface ToolbarSeparatorProps extends Omit<ComponentPropsWithoutRef<"div">, "role" | "children"> {
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export type ToolbarSpacerProps = SpacerProps;
