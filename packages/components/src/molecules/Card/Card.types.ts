import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * The card's surface treatment.
 *
 * - `"outlined"` (the default) — a border on the surface colour.
 * - `"elevated"` — a soft shadow instead of a border, so the card lifts off the
 *   page (in dark mode a hairline border accompanies the shadow, since a shadow
 *   alone barely reads on a dark surface).
 * - `"filled"` — a subtle neutral fill and no border, a quieter card on a plain
 *   page.
 * - `"ghost"` — no border, fill, or shadow: just the layout, for a card sitting
 *   inside a container that already provides its own boundary.
 */
export type CardVariant = "outlined" | "elevated" | "filled" | "ghost";

/**
 * A colour accent on the standard tone scale
 * (`05-component-api-conventions.md` §2). `"neutral"` (the default) is
 * uncoloured. Every other tone gives the card a border in that colour and a
 * subtle tint behind `Card.Header`. `"brand"` follows the active brand theme;
 * `"success"`, `"warning"`, `"danger"`, and `"info"` are fixed status colours.
 * A `"ghost"` card has no border, so a tone only tints its header.
 */
export type CardTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Section padding (and therefore the card's overall density), on the standard
 * 5-step scale (`05-component-api-conventions.md` §2) — never a
 * component-specific scale.
 */
export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

/** How `Card.Footer` lays out its content along the row. */
export type CardFooterAlign = "start" | "center" | "end" | "between";

export interface CardProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /** `Card.Media`, `Card.Header`, `Card.Body`, and `Card.Footer` — in any order, any of them optional. */
  children: ReactNode;
  /**
   * The card's surface treatment — a bordered card, a shadowed one, a filled
   * one, or a bare layout with no surface at all.
   * @default 'outlined'
   */
  variant?: CardVariant;
  /**
   * A colour accent: every non-neutral tone gives the card a border in that
   * colour and a subtle tint behind `Card.Header`. `"brand"` follows the active
   * brand theme; `"success"`, `"warning"`, `"danger"`, and `"info"` are fixed
   * status colours that don't change with the brand.
   * @default 'neutral'
   */
  tone?: CardTone;
  /**
   * Section padding, and so the card's overall density.
   * @default 'md'
   */
  size?: CardSize;
  /**
   * Styles the card as clickable as a whole — a pointer cursor, and hover,
   * focus, and pressed states. This is styling only: to make the card genuinely
   * interactive, also set `asChild` and render the card *as* a link or button
   * (`<Card asChild interactive><a href="…">…</a></Card>`), so it gets real
   * semantics and keyboard support. Avoid placing other interactive controls
   * inside a card that is itself a link.
   * @default false
   */
  interactive?: boolean;
  /**
   * Renders the card's styling onto a single provided child element (via Radix
   * `Slot`) instead of a `<div>` — the way to make the card itself a link or a
   * button. The child must be a single element, and it holds the card's
   * sections: `<Card asChild><a href="…"><Card.Header>…</Card.Header></a></Card>`.
   * @default false
   */
  asChild?: boolean;
  /**
   * An accessible name for the card, for when it acts as a labelled region or
   * link and has no visible heading to name it.
   */
  "aria-label"?: string;
  /** The id of an element that names this card (e.g. its own heading). */
  "aria-labelledby"?: string;
  /** The id of an element that describes this card. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this card,
   * or when a test or router needs a stable anchor.
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

export interface CardHeaderProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The header's content — typically a title (and perhaps a description) on the
   * start side, and an action such as a `Badge` or `IconButton` on the end.
   * Laid out as a row with the space between, so a lone title just starts at
   * the start edge.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * header, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface CardBodyProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The card's main content. It grows to fill any spare height, so in a row of
   * equal-height cards the footers still line up along the bottom.
   */
  children: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * body, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface CardFooterProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /** The footer's content — typically actions (buttons) or supporting meta. */
  children: ReactNode;
  /**
   * How the footer's content is laid out along the row: packed at the start,
   * the center, or the end, or spread with the space between.
   * @default 'end'
   */
  align?: CardFooterAlign;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * footer, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface CardMediaProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style" | "id"> {
  /**
   * The media itself — an image, a video, a chart, any full-bleed content. It
   * runs edge to edge (the card carries no padding of its own) and is clipped
   * to the card's rounded corners.
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
