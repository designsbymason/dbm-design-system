import type * as DialogPrimitive from "@radix-ui/react-dialog";
import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { HeadingLevel, HeadingSize } from "../../atoms/Heading/Heading.types";

type DialogPrimitiveContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

/**
 * The panel's maximum width, on the standard 5-step scale (`05-component-api-conventions.md` §2). Each step maps to
 * a `dialog.max-width.*` component token; on a viewport narrower than the step, the panel fills the width less a
 * gutter instead.
 */
export type DialogSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Where the buttons in a `Dialog.Footer` sit along its row. */
export type DialogFooterAlign = "start" | "end" | "between" | "stretch";

/**
 * The text `Dialog` supplies itself, translatable through the `labels` prop on `Dialog.Content`. Nothing here needs
 * a number, so there is no `formatNumber`.
 */
export interface DialogLabels {
  /** The accessible name of the built-in close button. @default 'Close' */
  close: string;
}

export interface DialogProps {
  /** `Dialog.Trigger` and `Dialog.Content`. */
  children?: ReactNode;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the dialog manage its own open state. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes — a trigger click, Escape, a press on the scrim, a
   * `Dialog.Close`, or the built-in close button.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether the dialog is modal. A modal dialog dims the page behind it with a scrim, locks the page's scroll,
   * traps focus inside it and makes the rest of the page inert to assistive technology. Set `false` for a docked
   * tool panel that coexists with the page: no scrim, no scroll lock, and the page stays usable behind it.
   * @default true
   */
  modal?: boolean;
}

export interface DialogTriggerProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot` composition) instead of the built-in, unstyled
   * native `<button>`. Reach for this to use one of this system's own interactive components (`Button`,
   * `IconButton`) as the visible trigger.
   * @default false
   */
  asChild?: boolean;
  /** The trigger's own content — a single element when `asChild` is set. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role"> {
  /** The dialog's content: usually `Dialog.Header`, `Dialog.Body` and `Dialog.Footer`, any of them optional. */
  children?: ReactNode;
  /**
   * The panel's maximum width — see {@link DialogSize}. On a viewport narrower than the step the panel fills the
   * width, less a gutter.
   * @default 'md'
   */
  size?: DialogSize;
  /**
   * Fills the whole viewport (no gutter, no rounded corners). A mobile-first responsive map switches it at a
   * breakpoint, e.g. `{ base: true, md: false }` for a full-screen dialog on a phone that becomes a centred panel
   * from `md` up.
   * @default false
   */
  fullScreen?: Responsive<boolean>;
  /**
   * Draws a line between the header and the body and between the body and the footer, so a body that scrolls
   * reads as running under them. Same name and meaning as `Card`'s `divided`.
   * @default false
   */
  divided?: boolean;
  /**
   * Shows a `CloseButton` in the panel's top-end corner. Unlike `Popover`'s, it is on by default: a modal needs a
   * visible way out. Turn it off only when the footer carries its own close action, and keep Escape available.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Whether a press outside the panel (on the scrim) closes the dialog. Set `false` for a form with unsaved
   * changes, where a stray click shouldn't throw the work away. Also stops a focus move outside from closing a
   * non-modal dialog. For finer control, use `onInteractOutside` and call `event.preventDefault()`.
   * @default true
   */
  closeOnOutsideClick?: boolean;
  /**
   * Whether Escape closes the dialog. Set `false` only when closing has to go through an explicit choice; for
   * finer control use `onEscapeKeyDown` and call `event.preventDefault()`.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * The text the component supplies itself, each part replaceable — see {@link DialogLabels}. A part left
   * `undefined` keeps its English default.
   */
  labels?: Partial<DialogLabels>;
  /**
   * Renders the dialog into a different DOM node than `document.body` (Radix's own default) — for a specific
   * stacking-context requirement, or to keep an embedded demo inside its own box. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Called when focus moves into the dialog on open. Call `event.preventDefault()` inside to choose the element to
   * focus yourself instead of the default, the first focusable element in the panel.
   */
  onOpenAutoFocus?: DialogPrimitiveContentProps["onOpenAutoFocus"];
  /**
   * Called when focus would return to the trigger on close. Call `event.preventDefault()` inside to send focus
   * elsewhere instead.
   */
  onCloseAutoFocus?: DialogPrimitiveContentProps["onCloseAutoFocus"];
  /**
   * Called when Escape is pressed while open. Call `event.preventDefault()` inside to keep the dialog open (e.g.
   * while a nested confirmation is showing). Runs before `closeOnEscape` is applied.
   */
  onEscapeKeyDown?: DialogPrimitiveContentProps["onEscapeKeyDown"];
  /**
   * Called on a pointer-down outside the panel. Call `event.preventDefault()` inside to keep the dialog open.
   */
  onPointerDownOutside?: DialogPrimitiveContentProps["onPointerDownOutside"];
  /**
   * Called when focus moves outside the panel. Only a non-modal dialog can lose focus this way. Call
   * `event.preventDefault()` inside to keep the dialog open.
   */
  onFocusOutside?: DialogPrimitiveContentProps["onFocusOutside"];
  /**
   * Called on any interaction outside the panel — a pointer-down or a focus move. Call `event.preventDefault()`
   * inside to keep the dialog open. Fires alongside `onPointerDownOutside`/`onFocusOutside`, not instead of them.
   */
  onInteractOutside?: DialogPrimitiveContentProps["onInteractOutside"];
  /**
   * Accessible name for the dialog, used when it has no visible title. A `Dialog.Title` is the preferred name
   * (wrapped in `VisuallyHidden` if the design has no visible heading), and is wired in automatically.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing element to use as the accessible name instead of a `Dialog.Title`. Rarely
   * needed: `Dialog.Title` is wired in automatically.
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of an existing element that describes the dialog. `Dialog.Description` is wired in
   * automatically, so this is only for a description that isn't one.
   */
  "aria-describedby"?: string;
  /** Standard DOM id, applied to the dialog element. */
  id?: string;
  /**
   * Additional CSS classes for customization, on the dialog panel itself.
   */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogHeaderProps extends ComponentPropsWithoutRef<"div"> {
  /** The header's content, usually a `Dialog.Title` and optionally a `Dialog.Description`. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/**
 * `Dialog.Title` and `Dialog.Description` take no `id`: the dialog generates both and points its own
 * `aria-labelledby` and `aria-describedby` at them, and a replaced id would leave those pointing at nothing.
 */
export interface DialogTitleProps extends Omit<ComponentPropsWithoutRef<"h2">, "color" | "id"> {
  /** The title text. It names the dialog for assistive technology, so every dialog should have one. */
  children?: ReactNode;
  /**
   * The heading level it is rendered as (`h1`–`h6`). Pick the level that fits the page's outline; it doesn't
   * change the size.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * The text size, from `Heading`'s scale.
   * @default 'xl'
   */
  size?: HeadingSize;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogDescriptionProps extends Omit<ComponentPropsWithoutRef<"p">, "color" | "id"> {
  /** One or two sentences saying what the dialog is for. Read out after the title when the dialog opens. */
  children?: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogBodyProps extends ComponentPropsWithoutRef<"div"> {
  /** The main content. It scrolls inside the panel while the header and footer stay put. */
  children?: ReactNode;
  /**
   * Text direction of the scroll region, which decides the side the scrollbar sits on. Defaults to left-to-right,
   * like every Radix-based component here; pass `"rtl"` in a right-to-left app.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Accessible name for the scroll region, read when keyboard focus lands on a body that scrolls. Optional: a
   * body with neither this nor `aria-labelledby` is still focusable and scrollable.
   */
  "aria-label"?: string;
  /** Points to the `id` of an existing element that names the scroll region. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization, on the scroll region's outer frame. */
  className?: string;
  /** Inline styles, merged onto the scroll region's outer frame. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogFooterProps extends ComponentPropsWithoutRef<"div"> {
  /** The footer's actions, usually `Button`s, one of them a `Dialog.Close`. */
  children?: ReactNode;
  /**
   * Where the actions sit along the row. `"stretch"` makes each one fill an equal share, which suits a phone.
   * @default 'end'
   */
  align?: DialogFooterAlign;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface DialogCloseProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot` composition) instead of the built-in, unstyled
   * native `<button>` — for a `Button` reading "Cancel" or "Done" that should still close the dialog on click.
   * @default false
   */
  asChild?: boolean;
  /** The close control's own content — a single element when `asChild` is set. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
