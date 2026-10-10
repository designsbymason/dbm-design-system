import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { InputSize } from "../../atoms/Input";

/** What `EditableText` does with an edit when focus leaves the field. */
export type EditableTextBlurBehavior = "commit" | "cancel";

/** The gesture that turns the text into a field. */
export type EditableTextActivation = "click" | "doubleClick";

/** When `EditableText` checks a draft: as the edit ends, or as it is typed. */
export type EditableTextValidateOn = "commit" | "change";

/** The text an `EditableText` writes itself. */
export interface EditableTextLabels {
  /** Describes the text's button to a screen reader: what pressing it does. @default "Edit" */
  edit: string;
  /** The accessible name of the confirm button shown by `showControls`. @default "Save" */
  confirm: string;
  /** The accessible name of the cancel button shown by `showControls`. @default "Cancel" */
  cancel: string;
  /** The message shown when `required` refuses an empty value. @default "This field is required" */
  required: string;
  /** Announced to screen readers when `isLoading` starts. @default "Saving" */
  saving: string;
}

/** What `EditableText`'s `actionRef` hands you, for starting or ending an edit from outside (a menu item, a shortcut). */
export interface EditableTextActions {
  /** Starts editing and moves focus into the field, as a click would. Does nothing while disabled, read-only or loading. */
  edit: () => void;
  /** Commits the draft as Enter would: refused by `required`/`validate`, a no-op when nothing is being edited. */
  commit: () => void;
  /** Throws the draft away as Escape would, and returns focus to the text. A no-op when nothing is being edited. */
  cancel: () => void;
}

export interface EditableTextProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    | "children"
    | "defaultValue"
    | "onChange"
    | "onFocus"
    | "onBlur"
    | "role"
    | "id"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
  > {
  /**
   * The committed value, a plain string. Passing it makes the component controlled: an edit is reported
   * through `onValueChange` when the person confirms it, and the text shown stays this value until the prop
   * changes. Pair with `onValueChange`.
   */
  value?: string;
  /**
   * The initial value when uncontrolled.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called with the new value when an edit is committed (Enter, the confirm button, or leaving the field
   * under `blurBehavior="commit"`). It is not called for each keystroke, for a cancelled edit, or when the
   * text is unchanged.
   */
  onValueChange?: (value: string) => void;
  /**
   * Whether the field is showing. Passing it makes editing controlled: a gesture inside the component (a
   * click, Enter, Escape) calls `onEditingChange` with the state it wants and leaves this alone until the
   * prop changes, so an owner can keep the field open (to show a server error, say).
   */
  editing?: boolean;
  /**
   * Whether the field is showing at first, when `editing` is not passed. Does not move focus on mount.
   * @default false
   */
  defaultEditing?: boolean;
  /** Called when the component wants to start or stop editing, with the state it wants. */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Edits a multi-line value in a `Textarea` that grows with its content. Enter then adds a line and
   * Ctrl or Cmd + Enter commits; the text is shown with its line breaks.
   * @default false
   */
  multiline?: boolean;
  /**
   * The text and padding, on the shared size scale. The text and the field it becomes are the same height
   * at every step, so nothing around them moves when it is activated.
   * @default "md"
   */
  size?: InputSize;
  /**
   * Shown in place of the value while it is empty (and as the field's own placeholder). The empty text
   * stays a button, so it can still be activated.
   */
  placeholder?: string;
  /**
   * What happens to an edit when focus leaves the field by Tab or a press elsewhere: `commit` keeps it
   * (reporting it through `onValueChange`), `cancel` throws it away. A refused value (see `required` and
   * `validate`) keeps the field open with its message.
   * @default "commit"
   */
  blurBehavior?: EditableTextBlurBehavior;
  /**
   * The gesture that starts editing. `doubleClick` suits a table cell, where a single click selects the
   * row; the keyboard still starts it with Enter or Space either way.
   * @default "click"
   */
  activation?: EditableTextActivation;
  /**
   * Shows a confirm and a cancel button beside the field, for touch screens (which have no Escape key) and
   * for anyone who looks for them. Enter and Escape work either way.
   * @default false
   */
  showControls?: boolean;
  /**
   * Shows a pencil after the text, on hover and focus (always, where there is no hover, and for an empty
   * value). Its space is always reserved, so it never moves the text.
   * @default true
   */
  showEditIcon?: boolean;
  /**
   * Selects the whole value when the field opens, so typing replaces it. Turn it off to put the caret at
   * the end.
   * @default true
   */
  selectOnFocus?: boolean;
  /**
   * Takes the surrounding text's font size, family and weight, for a heading or a table cell that should
   * still read as part of its row. The padding still follows `size`.
   * @default false
   */
  inheritFont?: boolean;
  /**
   * Shows the value as being saved: the field (while open) is set aside from editing without being disabled,
   * so it keeps focus and its text, a spinner is drawn after it (in place of the pencil once it has closed),
   * Enter, Escape, the buttons and leaving the field do nothing, and `labels.saving` is announced. Set it from
   * `onValueChange` until your request answers; with `editing` controlled, keep the field open meanwhile and
   * close it (or set `hasError`) afterwards.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Shows a live `current/max` character count after the field, while it is editing. Only drawn when
   * `maxLength` is also set.
   * @default false
   */
  showCount?: boolean;
  /**
   * How the numbers in the `showCount` counter are written, for a language or region whose numerals differ
   * from the plain `5` and `1234`: given a number, returns the text to show.
   * @default (count) => String(count)
   */
  formatNumber?: (count: number) => string;
  /**
   * Called with the draft as it is typed, pasted or deleted, while editing. For a live counter or a live
   * check beside the field; the value is committed, and `onValueChange` called, only when the edit ends. It
   * is not called when the field opens or when an edit is cancelled.
   */
  onDraftChange?: (draft: string) => void;
  /**
   * Draws the resting text from the value, for a currency, a date or a status that should read formatted
   * while the field edits the raw string. Used for a non-empty value only, in the text's button and in
   * `readOnly`; keep it inline and non-interactive (it sits inside a button), and make it include the text
   * a screen reader should read, since the button's name is built from it. A function that throws falls back
   * to the raw value with a development warning.
   */
  renderValue?: (value: string) => ReactNode;
  /**
   * Receives `{ edit, commit, cancel }` for starting or ending an edit from outside: a "Rename" menu item, a
   * keyboard shortcut, a row action. With `editing` controlled, ask through that prop instead.
   */
  actionRef?: Ref<EditableTextActions>;
  /**
   * Refuses to commit an empty (or all-blank) value, keeping the field open with `labels.required`. It
   * does not stop a surrounding `<form>` submitting a value that was never edited.
   * @default false
   */
  required?: boolean;
  /**
   * Checks a draft before it is committed: return a message to refuse it (shown below the field, and the
   * field marked invalid), or nothing to accept it. It runs on commit, not on each keystroke, and must be
   * cheap and pure. A function that throws is ignored with a development warning.
   */
  validate?: (draft: string) => string | undefined | void;
  /**
   * When `required` and `validate` are checked. `commit` (the default) checks as the edit ends, so a message
   * appears only when Enter or leaving was refused. `change` also checks as it is typed, showing the message
   * while the draft is invalid and removing it as soon as it is not; a commit is refused while it shows. A
   * check on each keystroke makes `validate` run that often, so keep it cheap and pure.
   * @default "commit"
   */
  validateOn?: EditableTextValidateOn;
  /**
   * Marks the value as invalid from outside, visually and (while editing) with `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Prevents the text from being activated. It leaves the tab order and is drawn dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the value as plain text with no way to edit it, the same size as the editable one. Unlike
   * `disabled`, it is not dimmed and still submits under `name`.
   * @default false
   */
  readOnly?: boolean;
  /** Maximum number of characters the field accepts. */
  maxLength?: number;
  /** Minimum number of characters the field asks for. */
  minLength?: number;
  /** Hints which virtual keyboard a mobile device should show while editing. */
  inputMode?: ComponentPropsWithoutRef<"input">["inputMode"];
  /** Hints the browser's autofill while editing, such as `"name"` or `"off"`. */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /**
   * What a phone's Enter key is labelled while editing: `done` for a commit, `go`, `next`, `send`, `search`,
   * or `enter`. Left unset it is `"done"` for a single-line value, where Enter commits, and the browser's own
   * for `multiline`, where Enter adds a line.
   */
  enterKeyHint?: ComponentPropsWithoutRef<"input">["enterKeyHint"];
  /**
   * Whether the browser checks the spelling of the field while editing. Turn it off for a name, a code or an
   * identifier, where the red underline is noise. The browser decides when unset.
   */
  spellCheck?: boolean;
  /**
   * Whether a phone capitalizes what is typed: `off` for a username or an address, `words` for a name,
   * `sentences` for prose. The browser decides when unset.
   */
  autoCapitalize?: ComponentPropsWithoutRef<"input">["autoCapitalize"];
  /**
   * The fewest rows the multi-line field shows. Only used with `multiline`.
   * @default 1
   */
  minRows?: number;
  /** The most rows the multi-line field grows to before it scrolls. Only used with `multiline`. */
  maxRows?: number;
  /**
   * Form field name. The committed value (never the draft) is submitted under it in a surrounding
   * `<form>`, through a hidden input.
   */
  name?: string;
  /** Associates the submitted value with a `<form>` by `id`, outside that form's own subtree. */
  form?: string;
  /**
   * The text this component writes itself. Pass only what you want to change; an omitted or `undefined`
   * entry keeps the English default.
   */
  labels?: Partial<EditableTextLabels>;
  /**
   * Called once when focus arrives in the component (the text, the field or either control), not for each
   * move between them.
   */
  onFocus?: ComponentPropsWithoutRef<"div">["onFocus"];
  /**
   * Called once when focus leaves the component as a whole, after any commit or cancel it caused.
   */
  onBlur?: ComponentPropsWithoutRef<"div">["onBlur"];
  /**
   * What the value is, for assistive tech: it names the text's button together with the value, and names
   * the field while editing. Needed unless `aria-labelledby` or a `FormField` supplies a name.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of a visible element to use as the name, typically a `FieldLabel` (a `FormField`
   * passes this for you).
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of helper or error text associated with the value. Applied to whichever of the
   * button and the field is showing, joined with the component's own description.
   */
  "aria-describedby"?: string;
  /**
   * DOM id of whichever of the text's button and the field is showing, so a `FieldLabel`'s `htmlFor`
   * reaches it (a click on the label starts editing).
   */
  id?: string;
  /** Additional CSS classes, applied to the outer box in both modes. */
  className?: string;
  /** Inline styles, applied to the outer box in both modes. */
  style?: CSSProperties;
  /**
   * Test identifier, applied to whichever of the text's button and the field is showing. Has no visual or
   * behavioural effect.
   */
  "data-testid"?: string;
}
