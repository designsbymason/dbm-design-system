import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
} from "react";

/** An opacity-scale step, matching the primitive opacity token steps. */
export type BackdropOpacity = 0 | 5 | 10 | 20 | 40 | 60 | 80 | 90 | 100;

export interface BackdropProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional content rendered on top of the dimming fill, centered on
   * both axes — e.g. a `Spinner`/`ProgressCircle` for a full-page loading
   * overlay (matching MUI's `Backdrop` `children` prop). Most modal/
   * dialog composition doesn't need this: a dialog's own content renders
   * as a sibling of `Backdrop`, not inside it.
   */
  children?: ReactNode;
  /**
   * Whether the scrim is visible. A plain controlled boolean rather than
   * this system's usual controlled/uncontrolled trio
   * (`open`/`defaultOpen`/`onOpenChange`, as seen on `Collapse`/`Switch`)
   * — Backdrop has no built-in trigger that would ever call an
   * `onOpenChange` itself, so that pair would be dead API surface here.
   *
   * Two supported usage patterns: (1) conditionally render `<Backdrop>`
   * at all (`{isOpen && <Backdrop onClick={...} />}`) and leave `open` at
   * its default — the scrim still fades in on mount, but exit is
   * instant, since React unmounts the whole element the instant the
   * parent stops rendering it. (2) Always render `<Backdrop
   * open={isOpen} onClick={...} />` and toggle this prop instead — the
   * scrim fades out first and only actually leaves the DOM once that
   * exit animation finishes, via Radix `Presence`.
   * @default true
   */
  open?: boolean;
  /**
   * How opaque the dimming fill is, from the opacity token scale.
   * @default 60
   */
  opacity?: BackdropOpacity;
  /**
   * Applies a `backdrop-filter: blur(...)` in addition to the dimming
   * fill, for a frosted-glass effect.
   * @default false
   */
  blur?: boolean;
  /**
   * Fires on click — the primary way a consumer wires up click-to-dismiss
   * (clicking the scrim closes whatever it's behind). A plain native
   * passthrough; Backdrop applies no default behavior of its own.
   */
  onClick?: MouseEventHandler<HTMLDivElement>;
  /**
   * Renders into a portal (`document.body` by default) instead of in
   * place. Set to `false` when composing inside a parent that already
   * provides its own portal — e.g. a future `Dialog`, which portals its
   * backdrop and content together in one call, the same way Radix's own
   * `Dialog.Portal` wraps `Dialog.Overlay` + `Dialog.Content` as siblings.
   * @default true
   */
  inPortal?: boolean;
  /**
   * Standard DOM id. Useful when another element's
   * `aria-labelledby`/`aria-describedby` needs to point at this element,
   * or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
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
