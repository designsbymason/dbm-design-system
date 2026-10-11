import type * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";
import type { ButtonProps } from "../../atoms/Button";
import type { HeadingLevel, HeadingSize } from "../../atoms/Heading/Heading.types";
import type { DialogBodyProps, DialogFooterProps, DialogSize } from "../Dialog/Dialog.types";

type AlertDialogPrimitiveContentProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>;

/**
 * What the alert is about, set on `AlertDialog.Content`. It picks the icon (a note for `neutral`, and one each for
 * `info`, `warning` and `danger`, in the tone's colour) and the look of `AlertDialog.Action` (`danger` makes it
 * destructive). There is no `success`: a success needs no answer, so it isn't an alert dialog.
 */
export type AlertDialogTone = "neutral" | "info" | "warning" | "danger";

/**
 * What closed (or opened) the dialog, given as the second argument of `onOpenChange`.
 * - `"trigger"`: a click on `AlertDialog.Trigger`.
 * - `"escape"`: the Escape key.
 * - `"action"`: `AlertDialog.Action`, the choice the alert exists to ask for.
 * - `"cancel"`: `AlertDialog.Cancel`.
 */
export type AlertDialogOpenChangeReason = "trigger" | "escape" | "action" | "cancel";

/** The second argument of `onOpenChange`. */
export interface AlertDialogOpenChangeDetails {
  /** What caused the change — see {@link AlertDialogOpenChangeReason}. */
  reason: AlertDialogOpenChangeReason;
  /**
   * The `value` of the `AlertDialog.Action` or `AlertDialog.Cancel` that closed it, when it has one. What tells
   * apart the answers of an alert with more than one: "Save", "Don't save" and Cancel.
   */
  value?: string;
}

export interface AlertDialogProps {
  /** `AlertDialog.Trigger` and `AlertDialog.Content`. */
  children?: ReactNode;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the dialog manage its own open state. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes. The second argument says what caused it: a decision
   * (`"action"` or `"cancel"`) or a dismissal (`"escape"`), so a caller can tell an answer from a walk-away.
   */
  onOpenChange?: (open: boolean, details: AlertDialogOpenChangeDetails) => void;
}

export interface AlertDialogTriggerProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot` composition) instead of the built-in, unstyled
   * native `<button>`. Reach for this to use a `Button` as the visible trigger.
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

export interface AlertDialogContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role"> {
  /**
   * The alert's content: an `AlertDialog.Header` holding a `Title` and a `Description`, an optional
   * `AlertDialog.Body`, and an `AlertDialog.Footer` holding the `Cancel` and `Action`.
   */
  children?: ReactNode;
  /**
   * What the alert is about — see {@link AlertDialogTone}. Chooses the icon and, for `"danger"`, makes
   * `AlertDialog.Action` destructive.
   * @default 'neutral'
   */
  tone?: AlertDialogTone;
  /**
   * The icon drawn beside the title: a Phosphor icon component to replace the tone's own, or `false` for none
   * (every tone has one by default).
   * The icon is decorative; the tone is carried by the words.
   */
  icon?: PhosphorIcon | false;
  /**
   * The panel's maximum width, on the standard scale. An alert is a short message, so the default is small; on a
   * narrower viewport the panel fills the width less a gutter.
   * @default 'sm'
   */
  size?: Exclude<DialogSize, "xl">;
  /**
   * Marks the alert as working on something (the answer is being sent): Escape, `AlertDialog.Cancel` and
   * `AlertDialog.Action` do nothing until it is `false` again, and the panel is `aria-busy`. Show your own
   * progress on the Action with its `isLoading`.
   * @default false
   */
  busy?: boolean;
  /**
   * Whether Escape closes the alert, as a cancel. Set `false` only for an alert that has to be answered with
   * one of its buttons. A press on the scrim never closes an alert dialog, and there is no prop to change that.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Gives a short pulse when something tries to dismiss the alert and can't (a press on the scrim, Escape while
   * `closeOnEscape` is off or the alert is `busy`), so it doesn't read as broken. Under
   * `prefers-reduced-motion` the border flashes instead of the panel swelling. Set `false` to turn it off.
   * @default true
   */
  nudge?: boolean;
  /**
   * An element to focus when the alert opens. By default `AlertDialog.Cancel` gets focus (the safe choice), and
   * `AlertDialog.Action` when there is no Cancel. Ignored if `onOpenAutoFocus` calls `event.preventDefault()`.
   */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * How opaque the scrim is, from the opacity scale. Worth lightening when the alert opens over a dialog, since
   * the two scrims stack.
   * @default 60
   */
  scrimOpacity?: BackdropOpacity;
  /**
   * Blurs the page behind the scrim as well as dimming it.
   * @default false
   */
  scrimBlur?: boolean;
  /**
   * Renders the alert into a different DOM node than `document.body` (Radix's own default) — for a specific
   * stacking-context requirement. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Called when focus moves into the alert on open. Call `event.preventDefault()` inside to choose the element to
   * focus yourself.
   */
  onOpenAutoFocus?: AlertDialogPrimitiveContentProps["onOpenAutoFocus"];
  /**
   * Called when focus would return to the trigger on close. Call `event.preventDefault()` inside to send focus
   * elsewhere instead.
   */
  onCloseAutoFocus?: AlertDialogPrimitiveContentProps["onCloseAutoFocus"];
  /**
   * Called when Escape is pressed while open. Call `event.preventDefault()` inside to keep the alert open.
   * Runs before `closeOnEscape` is applied.
   */
  onEscapeKeyDown?: AlertDialogPrimitiveContentProps["onEscapeKeyDown"];
  /**
   * Points to the `id` of an existing element that describes the alert. `AlertDialog.Description` is wired in
   * automatically, so this is only for a description that isn't one.
   */
  "aria-describedby"?: string;
  /** Standard DOM id, applied to the dialog element. */
  id?: string;
  /** Additional CSS classes for customization, on the dialog panel itself. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface AlertDialogHeaderProps extends ComponentPropsWithoutRef<"div"> {
  /** The header's content: a `Title` and a `Description`. The tone's icon is drawn beside it. */
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
 * `AlertDialog.Title` and `AlertDialog.Description` take no `id`: the dialog generates both and points its own
 * `aria-labelledby` and `aria-describedby` at them, and a replaced id would leave those pointing at nothing.
 */
export interface AlertDialogTitleProps extends Omit<ComponentPropsWithoutRef<"h2">, "color" | "id"> {
  /** The question or statement, short enough to read at a glance: "Delete project?". Names the alert. */
  children?: ReactNode;
  /**
   * The heading level it is rendered as (`h1`–`h6`). It doesn't change the size.
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

export interface AlertDialogDescriptionProps extends Omit<ComponentPropsWithoutRef<"p">, "color" | "id"> {
  /** What the choice will do, and what can't be undone. Read out after the title when the alert opens. */
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

/** Content between the header and the footer: a list of what is affected, say. Scrolls on its own. */
export type AlertDialogBodyProps = DialogBodyProps;

/** The bottom section holding `Cancel` and `Action`. Below `sm` its buttons stack full width, Action on top. */
export type AlertDialogFooterProps = DialogFooterProps;

export interface AlertDialogActionProps extends Omit<ButtonProps, "asChild" | "onClick"> {
  /** The label of the choice the alert exists to ask for: "Delete", "Discard changes". */
  children?: ReactNode;
  /**
   * A name for this choice, reported as `details.value` by `onOpenChange` when it closes the alert. Give each
   * `Action` one when there are two ("save", "discard"), since both report the reason `"action"`.
   */
  value?: string;
  /**
   * Runs before the alert closes. Call `event.preventDefault()` inside to keep it open (to wait for a request,
   * say, together with `busy` on the content).
   */
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
}

export interface AlertDialogCancelProps extends Omit<ButtonProps, "asChild" | "onClick"> {
  /** The label of the safe way out: "Cancel", "Keep it". */
  children?: ReactNode;
  /** A name for this choice, reported as `details.value` by `onOpenChange` when it closes the alert. */
  value?: string;
  /** Runs before the alert closes. Call `event.preventDefault()` inside to keep it open. */
  onClick?: ComponentPropsWithoutRef<"button">["onClick"];
}
