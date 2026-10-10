import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { InputSize } from "../../atoms/Input";
import type { TagTone, TagVariant } from "../../atoms/Tag";

/** How `TagsInput` treats a tag that `validate` rejects. */
export type TagsInputInvalidBehavior = "refuse" | "flag";

/** Where a tag came from when it was added. */
export type TagsInputAddSource = "enter" | "separator" | "blur" | "paste";

/** What removed a tag. */
export type TagsInputRemoveSource = "backspace" | "button" | "keyboard" | "clear";

/** The text a `TagsInput` writes itself: names, announcements and messages. */
export interface TagsInputLabels {
  /** The accessible name of a chip's remove button. @default (tag) => `Remove ${tag}` */
  remove: (tag: string) => string;
  /** The accessible name of the clear-all button shown by `clearable`. @default "Clear all" */
  clear: string;
  /** Announced when a tag is added, and the text shown for nothing else. @default (tag) => `${tag} added` */
  added: (tag: string) => string;
  /** Announced when a tag is removed. @default (tag) => `${tag} removed` */
  removed: (tag: string) => string;
  /** The message shown, and announced, when a tag that is already there is refused. @default (tag) => `${tag} is already added` */
  duplicate: (tag: string) => string;
  /**
   * The message shown, and announced, when `maxTags` has been reached. Receives the limit as a plain number;
   * write it with `formatNumber` if you pass your own.
   * @default (max) => `No more than ${max} tags`
   */
  maxReached: (max: number) => string;
  /**
   * Announced after a paste that was split into several tags, with how many were added and how many were
   * refused. Plain numbers; write them with `formatNumber` if you pass your own.
   * @default (added, refused) => `${added} added, ${refused} not added`
   */
  pasted: (added: number, refused: number) => string;
  /** The message a form shows when `required` is set and it is submitted with no tags. @default "Add at least one tag" */
  required: string;
  /**
   * Announced when a tag is added but flagged (`invalidBehavior="flag"`), and read after the tag by a screen
   * reader. Receives the tag and the reason `validate` gave.
   * @default (tag, reason) => `${tag} added, not valid: ${reason}`
   */
  flagged: (tag: string, reason: string) => string;
  /**
   * The message a form shows when flagged tags are still in the field. @default "Remove or correct the tags that are not valid"
   */
  invalid: string;
  /**
   * The visible text, and the name, of the button that shows the tags collapsed by `maxVisible`. Receives how
   * many are hidden, as a plain number; write it with `formatNumber` if you pass your own.
   * @default (hidden) => `+${hidden} more`
   */
  more: (hidden: number) => string;
  /** The text of the button that collapses the tags again after `more` was used. @default "Show less" */
  less: string;
  /**
   * Describes the entry once there are tags: how to reach them with the keyboard.
   * @default "Use the left arrow key to move to the tags"
   */
  chipsHint: string;
}

export interface TagsInputProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    | "children"
    | "defaultValue"
    | "onChange"
    | "role"
    | "id"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
  > {
  /**
   * The tags, as an array of strings (a new array on every change; never mutated). Passing it makes the field
   * controlled: a change is reported through `onValueChange` and the chips stay this array until the prop
   * changes. Pair with `onValueChange`.
   */
  value?: string[];
  /**
   * The initial tags when uncontrolled.
   * @default []
   */
  defaultValue?: string[];
  /** Called with the new array of tags each time one is added or removed. */
  onValueChange?: (value: string[]) => void;
  /**
   * The text typed but not yet made into a tag. Passing it makes the entry controlled; pair with
   * `onInputValueChange`. Use it to clear what is typed after a save, or to count it.
   */
  inputValue?: string;
  /**
   * The initial pending text when uncontrolled.
   * @default ""
   */
  defaultInputValue?: string;
  /** Called with the pending text as it changes: typed, pasted, cleared, or emptied by adding a tag. */
  onInputValueChange?: (inputValue: string) => void;
  /**
   * What is shown while there are no tags. Once there is a tag it goes, so the entry reads as the end of the
   * row.
   */
  placeholder?: string;
  /**
   * The size of the box, on the shared size scale. The box is as tall as an `Input` of the same size, and the
   * chips are one step smaller, so a row of them sits inside it.
   * @default "md"
   */
  size?: InputSize;
  /**
   * The colour of every chip, from `Tag`'s own tones.
   * @default "brand"
   */
  tone?: TagTone;
  /**
   * The treatment of every chip, from `Tag`'s own variants.
   * @default "subtle"
   */
  variant?: TagVariant;
  /**
   * The strings that end a tag when typed (or pasted). Enter always adds, and a paste is also split at line
   * breaks and tabs. Each is matched as written, so `", "` is a comma followed by a space.
   * @default [","]
   */
  separators?: string[];
  /**
   * Makes a tag of the typed text when focus leaves the field, so a value typed but not confirmed is not lost.
   * @default true
   */
  addOnBlur?: boolean;
  /**
   * What happens to a tag `validate` rejects. `refuse` (the default) keeps it out and leaves the typed text in the
   * entry with the message. `flag` adds it anyway, drawn in the `danger` tone with its reason read after it, and
   * stops a surrounding `<form>` submitting until it is corrected or removed; a repeat or a tag past `maxTags` is
   * still refused. Whether a tag is flagged is worked out from `validate` each render, so a tag passed in through
   * `value` is flagged too.
   * @default "refuse"
   */
  invalidBehavior?: TagsInputInvalidBehavior;
  /**
   * Allows the same tag more than once. By default a repeat is refused with `labels.duplicate`.
   * @default false
   */
  allowDuplicates?: boolean;
  /**
   * The most tags the field holds. Adding more is refused with `labels.maxReached`, and the entry stays
   * available for a paste that is cut short.
   */
  maxTags?: number;
  /** The most characters a single tag may have (the entry's native `maxLength`). */
  maxTagLength?: number;
  /**
   * Shows a live `count/max` after the tags while the field has a `maxTags`. Written with `formatNumber`.
   * @default false
   */
  showCount?: boolean;
  /**
   * Collapses a long row: while the field isn't being used, only this many chips show, followed by a
   * "+N more" button that shows the rest (and "Show less" to go back). The field shows every tag while the entry or
   * a chip has focus, so what is typed is always in view. The hidden tags are still submitted under `name`.
   */
  maxVisible?: number;
  /**
   * Called for each tag as it is added, after `onValueChange`, with where it came from (a paste calls it once
   * for every piece that was accepted).
   */
  onTagAdd?: (tag: string, details: { source: TagsInputAddSource }) => void;
  /**
   * Called for each tag as it is removed, after `onValueChange`, with its position before the removal and what
   * removed it. Clearing all calls it once for every tag.
   */
  onTagRemove?: (tag: string, details: { index: number; source: TagsInputRemoveSource }) => void;
  /**
   * Normalizes each piece before it is checked and added: trim, change the case, strip a prefix. A piece that
   * comes out empty is dropped. A function that throws is ignored with a development warning.
   * @default (raw) => raw.trim()
   */
  transform?: (raw: string) => string;
  /**
   * Checks a tag before it is added: return a message to refuse it (shown below the field, and announced), or
   * nothing to accept it. Runs for each piece, after `transform`; keep it cheap and pure. A function that
   * throws is ignored with a development warning.
   */
  validate?: (tag: string) => string | undefined | void;
  /**
   * Shows a clear-all button after the tags once there are any.
   * @default false
   */
  clearable?: boolean;
  /**
   * Asks for at least one tag. Marks the entry `aria-required` and stops a surrounding `<form>` submitting
   * with none, through a visually hidden control.
   * @default false
   */
  required?: boolean;
  /**
   * Marks the field as invalid, visually and with `aria-invalid` on the entry.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables the field: no typing, no removing, dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the tags with no way to change them, without dimming; the entry is read-only and the chips have no
   * remove buttons. Still submitted under `name`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Form field name. Each tag is submitted as its own value under it (read them with `getAll`), through hidden
   * inputs.
   */
  name?: string;
  /** Associates the submitted values with a `<form>` by `id`, outside that form's own subtree. */
  form?: string;
  /** Hints the browser's autofill for the entry, such as `"off"`. */
  autoComplete?: ComponentPropsWithoutRef<"input">["autoComplete"];
  /** Hints which virtual keyboard a mobile device should show for the entry. */
  inputMode?: ComponentPropsWithoutRef<"input">["inputMode"];
  /**
   * What a phone's Enter key is labelled for the entry.
   * @default "done"
   */
  enterKeyHint?: ComponentPropsWithoutRef<"input">["enterKeyHint"];
  /** Whether the browser checks the spelling of the entry. Turn it off for emails, handles and identifiers. */
  spellCheck?: boolean;
  /** Whether a phone capitalizes what is typed: `off` for emails and handles. */
  autoCapitalize?: ComponentPropsWithoutRef<"input">["autoCapitalize"];
  /**
   * How the numbers in the default `maxReached` and `pasted` messages are written, for a language or region
   * whose numerals differ: given a number, returns the text to show. Your own `labels` functions receive plain
   * numbers and use this too.
   * @default (n) => String(n)
   */
  formatNumber?: (n: number) => string;
  /**
   * The text this component writes itself. Pass only what you want to change; an omitted or `undefined` entry
   * keeps the English default.
   */
  labels?: Partial<TagsInputLabels>;
  /**
   * Names the field for assistive tech, for the group and for the entry. Needed unless `aria-labelledby` or a
   * `FormField` supplies a name.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of a visible element to use as the name, typically a `FieldLabel` (a `FormField` passes
   * this for you).
   */
  "aria-labelledby"?: string;
  /**
   * Points to the `id` of helper or error text associated with the field. Applied to the group and the entry,
   * joined with the component's own message.
   */
  "aria-describedby"?: string;
  /**
   * DOM id of the entry `<input>`, so a `FieldLabel`'s `htmlFor` reaches it (a click on the label focuses it).
   */
  id?: string;
  /** Additional CSS classes, applied to the outer box. */
  className?: string;
  /** Inline styles, applied to the outer box. */
  style?: CSSProperties;
  /**
   * Test identifier, applied to the entry `<input>`. Has no visual or behavioural effect.
   */
  "data-testid"?: string;
}
