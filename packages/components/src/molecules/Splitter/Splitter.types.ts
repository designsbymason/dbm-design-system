import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive } from "@dbm-design-system/primitives";

/** `horizontal` puts the panes side by side (the handles are vertical bars); `vertical` stacks them. */
export type SplitterOrientation = "horizontal" | "vertical";

/** How the handles look: a thin `line`, or a line with a `grip` you can see at rest. */
export type SplitterVariant = "line" | "grip";

/**
 * A pane size limit: a plain number is a percentage of the space the panes share, `"240px"` is a fixed length
 * and `"20%"` is the same as `20`. The panes share the container less its handles.
 */
export type SplitterSize = number | `${number}px` | `${number}%`;

/** Text the splitter supplies itself (translate or replace it). */
export interface SplitterLabels {
  /**
   * The accessible name of a handle, from its position among the handles (1-based) and how many there are.
   * Default: "Resize panels", or "Resize panels 1 of 2" when there is more than one handle.
   */
  handle: (position: number, total: number) => string;
  /** What a handle reads while the pane before it is open, from that pane's size as a whole-number percentage. Default: "30%". */
  valueText: (percent: number) => string;
  /** What a handle reads while the pane before it is collapsed. Default: "Collapsed". */
  collapsed: string;
}

export interface SplitterProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "dir"> {
  /**
   * The panes — `Splitter.Pane` elements, as direct children. A handle is added between each pair.
   */
  children?: ReactNode;
  /**
   * `horizontal` puts the panes side by side; `vertical` stacks them (the splitter then needs a height of its
   * own to share out). Takes a breakpoint map, to stack the panes on a phone.
   * @default 'horizontal'
   */
  orientation?: Responsive<SplitterOrientation>;
  /**
   * The size of every pane as a percentage, in order, summing to 100 — for a layout you hold yourself. Pair it
   * with `onLayoutChange`.
   */
  layout?: number[];
  /**
   * The starting sizes when the splitter holds its own layout. Left out, each pane takes its own `defaultSize`
   * and the panes without one share what is left equally.
   */
  defaultLayout?: number[];
  /** Called with the new layout (percentages, summing to 100) on every change, including each step of a drag. */
  onLayoutChange?: (layout: number[]) => void;
  /** Called with the layout once a drag or a key press has finished — the moment to save it. */
  onLayoutCommit?: (layout: number[]) => void;
  /**
   * How the handles look.
   * @default 'line'
   */
  variant?: SplitterVariant;
  /**
   * How far an arrow key moves a handle, as a percentage. Page Up and Page Down move it twice as far.
   * @default 5
   */
  keyboardStep?: number;
  /**
   * Stops the handles resizing and collapsing anything. The handles stay in the tab order, marked disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The text direction, passed down rather than read from the page: in `rtl` the first pane is on the right and
   * the arrow keys follow.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** Text the splitter supplies itself — see `SplitterLabels`. Any you leave out keep their English default. */
  labels?: Partial<SplitterLabels>;
  /**
   * Writes the percentages a handle announces, in a locale's own digits. Defaults to plain digits.
   */
  formatNumber?: (value: number) => string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for the container. */
  className?: string;
  /** Inline styles for the container. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** What a pane's render-function `children` is told about the pane. */
export interface SplitterPaneState {
  /** Whether the pane is collapsed (to nothing, or to its strip). */
  collapsed: boolean;
  /** The pane's current size, as a percentage of the space the panes share. */
  size: number;
}

export interface SplitterPaneProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * What the pane holds — or a function of the pane's state, to show something else once it has collapsed to a
   * strip (an icon where a label was).
   */
  children?: ReactNode | ((state: SplitterPaneState) => ReactNode);
  /**
   * The pane's starting size as a percentage, when the splitter holds its own layout and gets no
   * `defaultLayout`. Panes without one share the rest equally.
   */
  defaultSize?: number;
  /**
   * The smallest the pane can be.
   * @default 10
   */
  minSize?: SplitterSize;
  /**
   * The largest the pane can be.
   * @default 100
   */
  maxSize?: SplitterSize;
  /**
   * Lets the pane collapse: pulled past halfway to its minimum it snaps shut, and Enter or a double click on a
   * neighbouring handle toggles it.
   * @default false
   */
  collapsible?: boolean;
  /**
   * The size a collapsed pane keeps — `0` makes it disappear (and hides its content from assistive tech),
   * `"48px"` leaves a strip.
   * @default 0
   */
  collapsedSize?: SplitterSize;
  /** Collapses or opens the pane from outside. Pair it with `onCollapsedChange`. */
  collapsed?: boolean;
  /**
   * Whether the pane starts collapsed, when it isn't controlled.
   * @default false
   */
  defaultCollapsed?: boolean;
  /** Called when the pane collapses or opens, whatever caused it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Standard DOM id; the handles next to the pane point at it with `aria-controls`. Generated when left out.
   */
  id?: string;
  /** Additional CSS classes for the pane. */
  className?: string;
  /** Inline styles for the pane. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
