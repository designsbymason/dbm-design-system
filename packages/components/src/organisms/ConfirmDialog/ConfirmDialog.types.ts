import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import type { BackdropOpacity } from "../../atoms/Backdrop/Backdrop.types";
import type { HeadingSize } from "../../atoms/Heading/Heading.types";
import type {
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogContentProps,
  AlertDialogTone,
} from "../AlertDialog/AlertDialog.types";

/**
 * What the confirmation is about. It picks the icon (a note for `neutral`, and one each for `info`, `warning` and
 * `danger`) and the look of the confirm button (`danger` makes it destructive). The same four tones as
 * `AlertDialog`.
 */
export type ConfirmDialogTone = AlertDialogTone;

/**
 * What closed (or opened) the dialog, given as the second argument of `onOpenChange`.
 * - `"trigger"`: a click on the `trigger`.
 * - `"escape"`: the Escape key.
 * - `"action"`: the confirm button (or Enter in the type-to-confirm field), after `onConfirm` finished.
 * - `"cancel"`: the cancel button.
 */
export type ConfirmDialogOpenChangeReason = "trigger" | "escape" | "action" | "cancel";

/** The second argument of `onOpenChange`. */
export interface ConfirmDialogOpenChangeDetails {
  /** What caused the change: see {@link ConfirmDialogOpenChangeReason}. */
  reason: ConfirmDialogOpenChangeReason;
}

/**
 * The words the dialog writes itself, each with an English default. Pass the ones to replace: a label left out (or
 * given as `undefined`) keeps its default.
 */
export interface ConfirmDialogLabels {
  /**
   * The confirm button. Name what it does ("Delete project") rather than leaving the default.
   * @default 'Confirm'
   */
  confirm: string;
  /**
   * The cancel button, the safe way out.
   * @default 'Cancel'
   */
  cancel: string;
  /**
   * The label of the type-to-confirm field, given the text that must be typed (see `requireText`).
   * @default (text) => `Type “${text}” to confirm`
   */
  requireText: (text: string) => string;
  /**
   * Announced to a screen reader when an answer starts to run (`onConfirm` returned a promise). Not drawn: the
   * button keeps its label so it doesn't change width.
   * @default 'Working…'
   */
  working: string;
  /**
   * Announced when `onConfirm`'s promise rejects and the dialog stays open. Show the reason yourself, in
   * `children`; this only tells a screen reader that something is there to read.
   * @default 'That didn’t work. You can try again.'
   */
  failed: string;
  /**
   * The label of the checkbox that `dontAskAgain` adds.
   * @default 'Don’t ask me again'
   */
  dontAskAgain: string;
  /**
   * The line shown while `confirmDelay` holds the confirm button back, given the whole seconds left. The number is
   * plain: write it with `formatNumber` if it is shown in a script with its own digits.
   * @default (seconds) => `You can confirm in ${seconds} second(s).`
   */
  confirmIn: (seconds: number) => string;
  /**
   * What the same line says once the delay has passed, and what is announced then.
   * @default 'You can confirm now.'
   */
  confirmReady: string;
}

/** The two ways `requireText` can be judged, or a function that judges it. */
export type ConfirmDialogTextMatch =
  | "exact"
  | "ignore-case"
  | ((typed: string, required: string) => boolean);

/** How a confirmation is remembered when `dontAskAgain` is set. */
export interface ConfirmDialogDontAskAgain {
  /**
   * Names the confirmation (`"delete-draft"`). Remembered under `dbm-dismissed:<key>`, the same store
   * `usePersistentDismiss` reads, so the same key there is how a settings page forgets it.
   */
  key: string;
  /**
   * Where to remember it: `"local"` survives closing the browser, `"session"` lasts for this tab only.
   * @default 'local'
   */
  storage?: "local" | "session";
  /**
   * How long the choice lasts, in milliseconds; after that the dialog asks again. Left out, it lasts until it is
   * reset or the browser's storage is cleared.
   */
  expiresAfter?: number;
}

/** Where focus starts when the dialog opens: one of its buttons, or an element of your own. */
export type ConfirmDialogInitialFocus = "cancel" | "confirm" | RefObject<HTMLElement | null>;

type PanelProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "title" | "onCancel" | "onError">;

export interface ConfirmDialogProps extends PanelProps {
  /** The question, short enough to read at a glance: "Delete project?". Names the dialog. */
  title: ReactNode;
  /**
   * The size of the title's text, from `Heading`'s scale. It changes only how large the title is drawn; the
   * title stays a second-level heading.
   * @default 'xl'
   */
  titleSize?: HeadingSize;
  /**
   * What will happen and what can't be undone. Read out after the title when the dialog opens, so a
   * confirmation needs one (Radix warns in development when there is none).
   */
  description?: ReactNode;
  /**
   * Content between the description and the buttons: a list of what is affected, or your own error message
   * after a failed request. A scroll region that takes the height left over.
   */
  children?: ReactNode;
  /**
   * The element that opens the dialog, a single element such as a `Button` (rendered through `asChild`, so the
   * element itself is the trigger). Leave it out to open the dialog from your own state with `open`.
   */
  trigger?: ReactElement;
  /**
   * What the confirmation is about. `danger` makes the confirm button destructive.
   * @default 'neutral'
   */
  tone?: ConfirmDialogTone;
  /**
   * The icon drawn beside the title: a Phosphor icon component to replace the tone's own, or `false` for none
   * (every tone has one by default).
   */
  icon?: PhosphorIcon | false;
  /**
   * The panel's maximum width, on the standard scale. A confirmation is a short message, so the default is small.
   * @default 'sm'
   */
  size?: AlertDialogContentProps["size"];
  /** The words the dialog writes itself: see {@link ConfirmDialogLabels}. */
  labels?: Partial<ConfirmDialogLabels>;
  /**
   * Runs when the person confirms. Return nothing and the dialog closes at once. Return a promise and the dialog
   * stays open and busy until it settles: it closes when it resolves, and stays open (no longer busy) when it
   * rejects, reporting the error to `onConfirmError`. A second press while it is pending is ignored.
   */
  onConfirm?: () => void | Promise<unknown>;
  /** Runs when the person cancels: the cancel button, or Escape. Not called for a confirm. */
  onCancel?: () => void;
  /**
   * Receives the error when `onConfirm`'s promise rejects. The dialog stays open either way; with no handler the
   * rejection is left unhandled so it is not lost silently. Show a message of your own in `children`.
   */
  onConfirmError?: (error: unknown) => void;
  /**
   * Marks the dialog as working on something of your own (a request you run elsewhere): Escape, cancel and
   * confirm do nothing until it is `false` again, and the panel is `aria-busy`. Combined with the pending
   * state of a promise returned by `onConfirm`.
   * @default false
   */
  busy?: boolean;
  /**
   * Text the person has to type before the confirm button enables, for something that can't be recovered (the
   * project's name). Matched exactly and case-sensitively unless `requireTextMatch` says otherwise, ignoring
   * spaces at either end and treating composed and decomposed accents alike. A field labelled by
   * `labels.requireText` appears and takes focus when the dialog opens; Enter in it confirms once it matches.
   * Empty (or omitted) asks for nothing.
   */
  requireText?: string;
  /**
   * How what is typed is judged against `requireText`: `"exact"`, `"ignore-case"`, or a function given the typed
   * text (already trimmed) and the required text that returns whether it counts. Ignored without `requireText`.
   * @default 'exact'
   */
  requireTextMatch?: ConfirmDialogTextMatch;
  /**
   * Adds a "Don't ask me again" checkbox. When it is ticked and the person confirms, the choice is remembered, and
   * from then on opening the dialog (the trigger, or `open`) calls `onConfirm` at once and shows nothing. Not for
   * something destructive: a confirmation that can be switched off is one the person has stopped reading.
   */
  dontAskAgain?: ConfirmDialogDontAskAgain;
  /**
   * Holds the confirm button back for this many milliseconds after the dialog opens, with a line saying how long
   * is left, so a confirmation can't be pressed through by reflex. Restarts every time it opens.
   */
  confirmDelay?: number;
  /**
   * Writes a number the dialog shows (the seconds left of `confirmDelay`) with your own function, such as one
   * made from `Intl.NumberFormat`. The label functions in `labels` are handed the plain number.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Props for the confirm button, for what `tone` doesn't cover: another `variant`, an icon. `children`,
   * `onClick`, `disabled` and the loading props are the dialog's own.
   */
  confirmProps?: Omit<AlertDialogActionProps, "children" | "onClick" | "disabled" | "value" | "isLoading" | "loadingText">;
  /** Props for the cancel button, on the same terms as `confirmProps`. */
  cancelProps?: Omit<AlertDialogCancelProps, "children" | "onClick" | "disabled" | "value" | "isLoading" | "loadingText">;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the dialog manage its own open state. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage; ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes. The second argument says what caused it: a decision
   * (`"action"` or `"cancel"`) or a dismissal (`"escape"`). With a promise from `onConfirm`, it is called with
   * `false` and `"action"` once the promise has resolved.
   */
  onOpenChange?: (open: boolean, details: ConfirmDialogOpenChangeDetails) => void;
  /**
   * Called with `true` once the dialog has finished opening and with `false` once it has finished closing and is out
   * of the page: `onOpenChange` says a change *started*, this says it is *over*.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether Escape closes the dialog, as a cancel. A press on the scrim never does.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * A short pulse when something tries to dismiss the dialog and can't (a press on the scrim, Escape while it is
   * busy), so it doesn't read as broken. Under `prefers-reduced-motion` the border flashes instead.
   * @default true
   */
  nudge?: boolean;
  /**
   * Where focus starts when the dialog opens: `"cancel"` (the safe choice, and the default), `"confirm"` for a
   * low-stakes question people answer yes to, or a ref to an element of your own. With `requireText`, the field
   * is where it starts by default, and `"confirm"` falls back to it, since the button is disabled until it matches.
   */
  initialFocus?: ConfirmDialogInitialFocus;
  /**
   * How opaque the scrim is, from the opacity scale. Worth lightening when the dialog opens over another, since
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
   * Renders the dialog into a different DOM node than `document.body`, for a specific stacking-context
   * requirement. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Called when focus moves into the dialog on open. Call `event.preventDefault()` inside to choose the element
   * to focus yourself.
   */
  onOpenAutoFocus?: AlertDialogContentProps["onOpenAutoFocus"];
  /**
   * Called when focus would return to the trigger on close. Call `event.preventDefault()` inside to send focus
   * elsewhere instead.
   */
  onCloseAutoFocus?: AlertDialogContentProps["onCloseAutoFocus"];
  /**
   * Called when Escape is pressed while open. Call `event.preventDefault()` inside to keep the dialog open.
   * Runs before `closeOnEscape` is applied.
   */
  onEscapeKeyDown?: AlertDialogContentProps["onEscapeKeyDown"];
  /** Standard DOM id, applied to the dialog panel. */
  id?: string;
  /** Additional CSS classes for customization, on the dialog panel itself. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Points to the `id` of an existing element that describes the dialog. The `description` is wired in
   * automatically, so this is only for a description that isn't one.
   */
  "aria-describedby"?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
