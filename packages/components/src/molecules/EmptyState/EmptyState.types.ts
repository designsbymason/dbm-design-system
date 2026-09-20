import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { HeadingLevel } from "../../atoms/Heading/Heading.types";

/**
 * The empty state's surface treatment.
 *
 * - `"ghost"` (the default) — no border or fill: just the centred layout, for an
 *   empty state that fills a page or sits inside a container that already
 *   provides its own boundary (a `Card`, a `Table` cell, a panel).
 * - `"outlined"` — a solid border around the empty area.
 * - `"dashed"` — a dashed border, the familiar "nothing here yet — put something
 *   here" placeholder look, well suited to an empty drop area or list.
 * - `"filled"` — a subtle neutral fill and no border, a quiet block on a plain
 *   page.
 */
export type EmptyStateVariant = "ghost" | "outlined" | "dashed" | "filled";

/**
 * A colour accent on the standard tone scale
 * (`05-component-api-conventions.md` §2), applied to the icon badge.
 * `"neutral"` (the default) is uncoloured. `"brand"` follows the active brand
 * theme; `"success"`, `"warning"`, `"danger"`, and `"info"` are fixed status
 * colours — so the same layout can say "nothing here yet" (neutral),
 * "you're all caught up" (success), or "something went wrong" (danger).
 */
export type EmptyStateTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Padding, gap, and the size of the icon and text, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — never a component-specific scale.
 * `xs`/`sm` suit an empty state inside a table cell or a narrow panel; `lg`/`xl`
 * suit one that is the main content of a page.
 */
export type EmptyStateSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Where the content sits across the width of the empty state.
 *
 * - `"center"` (the default) — centred, the usual look for a page or a panel.
 * - `"start"` — flush with the inline start edge (the left in left-to-right
 *   text, the right in right-to-left), with the text aligned the same way. For an
 *   empty state inside a layout that is start-aligned throughout, such as a
 *   settings section or a list header.
 */
export type EmptyStateAlign = "center" | "start";

export interface EmptyStateProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * `EmptyState.Media`, `EmptyState.Icon`, `EmptyState.Title`,
   * `EmptyState.Description`, and `EmptyState.Actions` — in reading order, any of
   * them optional. Anything else is laid out in the same column.
   */
  children: ReactNode;
  /**
   * The surface treatment — no surface at all, a solid or dashed border, or a
   * subtle fill.
   * @default 'ghost'
   */
  variant?: EmptyStateVariant;
  /**
   * A colour accent for the icon badge. `"brand"` follows the active
   * brand theme; `"success"`, `"warning"`, `"danger"`, and `"info"` are fixed
   * status colours that don't change with the brand. Decorative reinforcement
   * only: put the meaning in the title and description, not the colour.
   * @default 'neutral'
   */
  tone?: EmptyStateTone;
  /**
   * Padding, spacing, and the size of the icon and text.
   * @default 'md'
   */
  size?: EmptyStateSize;
  /**
   * Whether the content is centred or flush with the start edge.
   * @default 'center'
   */
  align?: EmptyStateAlign;
  /**
   * Announces the title and description to screen readers when the empty state
   * appears (and again if their text changes) — for an empty state that shows up
   * *because of something the user did*, such as a search or a filter that
   * returns nothing, where sighted users see it appear but a screen-reader user
   * would otherwise get no news of it. Renders a visually hidden status region
   * that starts empty and is filled a moment after mounting, because a live
   * region reliably announces a *change*, not content that arrives with it; the
   * text is cleared again shortly after, so it isn't read a second time in
   * browse mode. Leave it off for an empty state that is simply part of the page.
   * Don't combine it with `role="status"` on the root — that would announce
   * twice.
   * @default false
   */
  announce?: boolean;
  /**
   * The ARIA role. Unset by default: an empty state is static content and adds
   * no role. To have a screen reader announce an empty state that appears in
   * response to something the user did, use `announce` rather than a role here.
   */
  role?: ComponentPropsWithoutRef<"div">["role"];
  /**
   * An accessible name for the empty state, for when it acts as a labelled
   * region and has no visible title to name it.
   */
  "aria-label"?: string;
  /** The id of an element that names this empty state (e.g. its own title). */
  "aria-labelledby"?: string;
  /** The id of an element that describes this empty state. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this empty
   * state, or when a test or router needs a stable anchor.
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

export interface EmptyStateIconProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The Phosphor icon component to show — a component reference, not a string
   * name, so unused icons stay tree-shaken and references are type-checked.
   * @example
   * ```tsx
   * import { TrayIcon } from '@dbm-design-system/icons';
   * <EmptyState.Icon icon={TrayIcon} />
   * ```
   */
  icon: PhosphorIcon;
  /**
   * A text alternative for the icon. Unset by default, which hides the icon from
   * assistive technology — right when the title already says what the icon
   * shows. Set it only when the icon conveys something the text doesn't.
   */
  label?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this icon,
   * or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface EmptyStateMediaProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The illustration — an `<img>`, `<picture>`, `<video>`, or inline `<svg>`. It
   * is never allowed to grow wider than the empty state or than the largest size
   * for the empty state's `size` (6rem at `xs` up to 15rem at `xl`): a larger
   * image is scaled down, keeping its proportions, and a smaller one keeps its own
   * size. Give a purely decorative illustration empty `alt` text (`alt=""`), since
   * the title already says what is empty.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * media, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

// `color` is the obsolete HTML attribute on a heading; it would clash with `Heading`'s own
// (semantic) `color` prop, and the title's colour isn't configurable anyway.
export interface EmptyStateTitleProps
  extends Omit<ComponentPropsWithoutRef<"h3">, "children" | "className" | "style" | "id" | "color"> {
  /**
   * The title — a short statement of what is empty, or of what happened
   * ("No results found", "You're all caught up").
   */
  children: ReactNode;
  /**
   * The heading level, `1`–`6`, rendered as the matching `<h1>`–`<h6>`. Match
   * it to where the empty state sits in the page's outline — one level below the
   * heading of the section it's in.
   * @default 3
   */
  level?: HeadingLevel;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this title
   * (e.g. to name the empty state), or when a test or router needs a stable
   * anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface EmptyStateDescriptionProps
  extends Omit<ComponentPropsWithoutRef<"p">, "children" | "className" | "style" | "id"> {
  /**
   * The supporting text — why it's empty and, ideally, what to do about it.
   * Kept to a comfortable line length however wide the empty state is.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * description, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface EmptyStateActionsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The next step — usually one primary `Button` (the way out of the empty
   * state), optionally with a secondary one or a `Link`. Laid out in a row that
   * wraps on a narrow screen.
   */
  children: ReactNode;
  /**
   * Below the `sm` breakpoint (a phone), stacks the actions in a column with each
   * one the full width of the empty state — bigger touch targets, and the primary
   * action first. From `sm` up they sit in a row as usual. The breakpoint is a
   * viewport width, as everywhere else in the system.
   * @default false
   */
  stackOnMobile?: boolean;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at these
   * actions, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
