import type { Responsive } from "@dbm-design-system/primitives";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  MouseEvent,
  SyntheticEvent,
} from "react";

/** Matches the standard xs|sm|md|lg|xl component size scale, mapped to Avatar's own component-level size tokens. */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";
export type AvatarShape = "circle" | "square";

export type AvatarProps<E extends ElementType = "span"> = {
  /**
   * The HTML element (or component) to render as — e.g. `as="button"` to
   * make the avatar an interactive trigger (a profile menu, say), keeping
   * all of its own generated image/initials/status content exactly as-is.
   * No `asChild`/Radix `Slot` here: unlike `Button`, Avatar's visual
   * content is entirely self-generated rather than supplied via
   * `children`, so `Slot`'s "consumer supplies the whole child" contract
   * doesn't fit — this `as` prop (the same polymorphism `Stack`/
   * `Container`/`GridItem` use) is what actually keeps the avatar looking
   * like an avatar once it's made interactive.
   * @default 'span'
   */
  as?: E;
  /** Image URL. Falls back to `initials` if unset or if the image fails to load. */
  src?: string;
  /** Accessible description of the image (e.g. the person's name). */
  alt?: string;
  /**
   * Fired when `src` fails to load, after the component has already
   * switched to its own fallback (`initials` or the generic icon) — use
   * for logging/retry/telemetry, not to control the fallback itself,
   * which always happens regardless of whether this is provided.
   */
  onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  /**
   * Passed through to the underlying `<img>` when an image is showing.
   * No effect in `initials`/icon fallback mode. Native browser default
   * (`eager`) applies when omitted — set `lazy` for avatars in a long
   * list that render off-screen.
   */
  loading?: "eager" | "lazy";
  /**
   * Fallback initials shown when there's no image, or it fails to load.
   * Falls back again to a generic person icon when this is also unset.
   * Takes priority over auto-derived initials from `name`.
   */
  initials?: string;
  /**
   * Person/entity name. When set, it's used to auto-derive `initials`
   * (first + last word's first letter, or just the first letter for a
   * single word) whenever `initials` isn't explicitly provided, and as a
   * fallback `alt` whenever `alt` isn't explicitly provided — pass this
   * once instead of repeating the name across both. Also the identity
   * seed for `colorful`'s deterministic per-person color (falling back to
   * `alt`, then `initials`, when `name` itself isn't set).
   */
  name?: string;
  /**
   * Derives a deterministic background/text color from the avatar's
   * identity (`name`, or `alt`/`initials` if `name` isn't set) instead of
   * the fixed brand color, so different people render in visibly
   * different — but still AA-contrast-verified — colors. Has no visible
   * effect once a real image is showing, since it only recolors the
   * initials/icon fallback's own background.
   * @default false
   */
  colorful?: boolean;
  /**
   * Controls the avatar's width/height (and, proportionally, its font size
   * and status dot) together as one step on the component's own size
   * scale — a single value, or a mobile-first responsive map keyed by
   * breakpoint (e.g. `{ base: "sm", md: "lg" }`), matching `Stack`'s
   * `gap`/`Container`'s `paddingInline` and the other layout primitives'
   * responsive props. The generic icon fallback (no `src`/`initials`)
   * isn't itself responsive — `Icon` has no `Responsive<T>` size of its
   * own — so it's sized off whichever step resolves at the `base`
   * breakpoint (or `md` if `size` has no `base` entry).
   * @default 'md'
   */
  size?: Responsive<AvatarSize>;
  /**
   * `circle` (the default) suits people; `square` (rounded corners, not a
   * hard edge) reads better for non-person entities like teams or bots.
   * @default 'circle'
   */
  shape?: AvatarShape;
  /** Optional presence indicator, rendered as a small dot. */
  status?: AvatarStatus;
  /**
   * Disables interaction — only meaningful when `as` makes the avatar an
   * interactive trigger (e.g. `as="button"`); has no effect on the default,
   * non-interactive `span`. Blocks `onClick` and applies `aria-disabled`
   * regardless of `as`; the native `disabled` attribute is additionally
   * applied when `as="button"` specifically, since that's the one case a
   * real HTML disabled state applies (an `<a>`, for instance, has no native
   * `disabled` — `aria-disabled` plus the blocked handler covers it there,
   * same as `Button`'s own `asChild` handling).
   * @default false
   */
  disabled?: boolean;
  /**
   * Fires on click — only meaningful (and only wired up at all) once `as`
   * makes the avatar an interactive trigger, e.g. `as="button"`; blocked
   * while `disabled`. Has no effect on the default, non-interactive `span`
   * — same gate `disabled` already documents on itself — since attaching a
   * click handler there would be clickable by mouse with no keyboard
   * equivalent and no button semantics, a real accessibility gap rather
   * than a harmless no-op. A dev-mode warning fires if provided without an
   * interactive `as`. Typed against the polymorphic root element
   * generically (`HTMLElement`, not the specific `E`) since the component
   * itself already re-widens it the same way internally (`Avatar.tsx`'s
   * own `onClickProp` cast) to accommodate every possible `as` value.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /**
   * Explicit accessible-label override. If omitted, a name is computed
   * automatically from `alt` — combined with `status`'s label into one
   * announcement when both are present, instead of two separate
   * `role="img"` stops. Providing this prop replaces that computed name
   * entirely, so it isn't itself combined with `status`.
   */
  "aria-label"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * avatar, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children" | "onClick">;
