import type { ComponentPropsWithoutRef, CSSProperties, SyntheticEvent } from "react";

/**
 * The size of every control in the row, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — the same steps as `Button`, whose heights the
 * controls match.
 */
export type PaginationSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Whether the row of page numbers collapses to a short "Page 3 of 20" summary between the
 * previous and next buttons.
 *
 * - `"auto"` (the default) — the numbers on a roomy screen, the summary below the `sm`
 *   breakpoint (a phone), where a full row of numbers doesn't fit. Decided by the width of
 *   the *screen*.
 * - `"container"` — the numbers whenever they fit the component's own width, the summary
 *   when they don't. Decided by the width the component is actually given, so it works in a
 *   narrow sidebar on a wide screen, or a wide panel on a narrow one. The component fills the
 *   space available to it (in a flex row it grows to take what the other items leave).
 * - `"always"` — always the summary, for a narrow place such as a sidebar.
 * - `"never"` — always the numbers; on a very narrow screen the row wraps onto more than
 *   one line rather than overflowing.
 */
export type PaginationCompact = "auto" | "container" | "always" | "never";

/**
 * How the page controls look, apart from the current page, which is always the filled brand
 * colour. Each maps to a `Button` variant.
 *
 * - `"ghost"` (the default) — no surface at rest; a tint appears on hover. The quietest.
 * - `"outlined"` — a brand-coloured border around every control.
 * - `"filled"` — a soft brand tint behind every control.
 */
export type PaginationVariant = "ghost" | "outlined" | "filled";

/** Where the controls sit across the width of the component. */
export type PaginationAlign = "start" | "center" | "end";

/**
 * Every piece of text the component supplies itself — the accessible names of the controls
 * and the compact summary. English by default; pass your own to translate them.
 */
export interface PaginationLabels {
  /** The accessible name of the `<nav>` landmark. @default "Pagination" */
  navigation: string;
  /** The accessible name of the previous-page button. @default "Previous page" */
  previous: string;
  /** The accessible name of the next-page button. @default "Next page" */
  next: string;
  /** The accessible name of the first-page button. @default "First page" */
  first: string;
  /** The accessible name of the last-page button. @default "Last page" */
  last: string;
  /** The accessible name of a page's button, given its number. @default `Page ${page}` */
  page: (page: number) => string;
  /**
   * The compact summary — also what is announced to a screen reader when the page changes — given
   * the current page and the page count. @default `Page ${page} of ${pageCount}`
   */
  summary: (page: number, pageCount: number) => string;
  /** The label of the jump-to-page field (`showJump`). @default "Go to page" */
  jump: string;
  /** The text of the jump-to-page field's button. @default "Go" */
  jumpSubmit: string;
}

export interface PaginationProps
  extends Omit<
    ComponentPropsWithoutRef<"nav">,
    "children" | "className" | "style" | "id" | "defaultValue" | "onChange"
  > {
  /**
   * How many pages there are in total. With no pages (`0`) the component renders nothing,
   * so it can sit above data that hasn't arrived yet. A number that isn't a whole number
   * of at least zero is a mistake and warns in development. For a list of items, this is
   * `Math.ceil(totalItems / pageSize)`.
   */
  pageCount: number;
  /**
   * The current page, starting at 1 — controlled. Pair with `onValueChange` to update it,
   * or the component will appear frozen. A value outside `1` to `pageCount` is clamped
   * to it.
   */
  value?: number;
  /**
   * The starting page for an *uncontrolled* component, which then tracks the page itself.
   * Ignored once `value` is also provided.
   * @default 1
   */
  defaultValue?: number;
  /**
   * Called when the user chooses another page, with the new page number (starting at 1)
   * and the event that chose it — a click on a control, or the submission of the
   * jump-to-page field. In link mode (`getPageHref`), call `event.preventDefault()` to
   * handle the navigation yourself — for example with a client-side router — instead of
   * letting the link (or, for the jump field, the component) load the page. Not called
   * when the chosen page is already the current one, or for a click that asks the browser
   * to open a link elsewhere (with Ctrl, Cmd, Shift, or Alt held, or the middle button).
   */
  onValueChange?: (page: number, event: SyntheticEvent<HTMLElement>) => void;
  /**
   * How many pages to show either side of the current page. The row keeps the same number
   * of slots (`2 × boundaryCount + 2 × siblingCount + 3`, gaps included) wherever you are,
   * so the controls don't shift sideways as you move through the pages.
   * @default 1
   */
  siblingCount?: number;
  /**
   * How many pages to always show at each end.
   * @default 1
   */
  boundaryCount?: number;
  /**
   * Adds buttons that jump straight to the first and the last page, either side of the
   * previous and next buttons.
   * @default false
   */
  showFirstLast?: boolean;
  /**
   * The size of every control in the row.
   * @default 'md'
   */
  size?: PaginationSize;
  /**
   * Whether the page numbers collapse to a "Page 3 of 20" summary between the previous and
   * next buttons: on a phone-width screen (`auto`), when they don't fit the component's own
   * width (`container`), always, or never.
   * @default 'auto'
   */
  compact?: PaginationCompact;
  /**
   * How the page controls look. The current page is always the filled brand colour; this is
   * the treatment of every other control.
   * @default 'ghost'
   */
  variant?: PaginationVariant;
  /**
   * Makes every control round: a circle for a page number or an arrow, a pill for a page
   * number too wide to be a square. The "Go to page" field and its button are rounded too, so
   * the row doesn't end in a square-cornered field.
   * @default false
   */
  rounded?: boolean;
  /**
   * Adds a "Go to page" field and button after the row, for a list long enough that stepping
   * or picking from the window is slow. Type a page number and press Enter (or the button);
   * a number outside `1` to `pageCount` goes to the nearest page, and an empty field does
   * nothing. It stays available in the compact form, where it is the way to reach a page
   * that isn't beside the current one. In link mode it follows the page's link, unless
   * `onValueChange` cancels that with `event.preventDefault()`. A form control, so it is
   * natively disabled (not just `aria-disabled`) while `disabled` is set.
   * @default false
   */
  showJump?: boolean;
  /**
   * Announces the new page to screen readers whenever the page changes — "Page 3 of 20" (the
   * `summary` label) — through a visually hidden status region that stays in the page. A screen
   * reader user who chooses a page otherwise gets no news of it: focus stays on the control and
   * only `aria-current` moves. Set it to `false` if your own content region already announces
   * the change.
   * @default true
   */
  announce?: boolean;
  /**
   * Where the controls sit across the width: centred, or flush with the start or end edge
   * (the left or right in left-to-right text, mirrored in right-to-left) — end-aligned is
   * the usual place for the pagination under a table.
   * @default 'center'
   */
  align?: PaginationAlign;
  /**
   * Disables every control — while the next page is loading, say. They stay focusable (they
   * are `aria-disabled` rather than natively disabled), so keyboard focus isn't lost.
   * @default false
   */
  disabled?: boolean;
  /**
   * Makes each control a real link: given a page number, returns its URL. Use it when each
   * page has its own address — a server-rendered list, or a router — so a link can be
   * opened in a new tab, copied, or followed without JavaScript. Without it, every control
   * is a button.
   */
  getPageHref?: (page: number) => string;
  /**
   * The text the component supplies itself — accessible names, the compact summary (also what
   * is announced), and the jump-to-page field's label and button. Any you leave out keep their
   * English default.
   */
  labels?: Partial<PaginationLabels>;
  /**
   * An accessible name for the `<nav>` landmark. Defaults to `labels.navigation`
   * ("Pagination"). Give each one on a page its own name — "Search results", "Comments" —
   * since a screen reader lists landmarks by name.
   */
  "aria-label"?: string;
  /** The id of an element that names this landmark; takes the place of `aria-label`. */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another element's
   * `aria-labelledby`/`aria-describedby` needs to point at this component, or when a test
   * or router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`,
   * Playwright/Cypress selectors). Rendered as the DOM `data-testid` attribute; has no
   * visual or behavioral effect.
   */
  "data-testid"?: string;
}
