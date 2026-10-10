import { XIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-design-system/primitives";
import { forwardRef, useId, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { FieldError } from "../../atoms/FieldError";
import { Icon } from "../../atoms/Icon";
import type { InputSize } from "../../atoms/Input";
import { Tag } from "../../atoms/Tag";
import type { TagSize } from "../../atoms/Tag";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./TagsInput.module.css";
import type { TagsInputLabels, TagsInputProps } from "./TagsInput.types";

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One step below the field, as `TableToolbar`'s chips are, so a row of them sits inside the box.
const tagSizeFor: Record<InputSize, TagSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
const iconSizeFor: Record<InputSize, "xs" | "sm" | "md" | "lg"> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const warned = new Set<string>();
function warnOnce(message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

const escapeForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A field that holds a list of short values as removable chips. Type a value and press Enter, or type a
 * separator, or paste a list: each piece becomes a chip. Backspace on an empty entry removes the last one.
 * The value is a `string[]`; `name` submits each tag as its own value.
 *
 * The chips are `Tag`s with real, named remove buttons, in a list; the entry is a single real `<input>` at the
 * end of them, in the same bordered box, so a row of chips wraps and the typing area follows. Adding, removing
 * and refusing are announced. `ref`, `id`, `data-testid` and the `aria-*` props go to the entry `<input>`;
 * `className` and `style` go to the outer box.
 *
 * @example
 * ```tsx
 * <TagsInput aria-label="Recipients" placeholder="Add an email" onValueChange={setEmails} />
 * <TagsInput aria-label="Labels" defaultValue={["urgent", "design"]} maxTags={5} />
 * <TagsInput aria-label="Emails" validate={(tag) => (tag.includes("@") ? undefined : "Not an email address")} />
 * <FormField label="Tags">{(fieldProps) => <TagsInput {...fieldProps} name="tags" />}</FormField>
 * ```
 */
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      inputValue,
      defaultInputValue = "",
      onInputValueChange,
      placeholder,
      size = "md",
      tone = "brand",
      variant = "subtle",
      separators = [","],
      addOnBlur = true,
      allowDuplicates = false,
      maxTags,
      maxTagLength,
      transform,
      validate,
      clearable = false,
      required = false,
      hasError = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      autoComplete,
      inputMode,
      enterKeyHint = "done",
      spellCheck,
      autoCapitalize,
      formatNumber = String,
      labels: labelOverrides,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      id,
      className,
      style,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const defaultLabels: TagsInputLabels = {
      remove: (tag) => `Remove ${tag}`,
      clear: "Clear all",
      added: (tag) => `${tag} added`,
      removed: (tag) => `${tag} removed`,
      duplicate: (tag) => `${tag} is already added`,
      maxReached: (max) => `No more than ${formatNumber(max)} tags`,
      pasted: (added, refused) => `${formatNumber(added)} added, ${formatNumber(refused)} not added`,
      required: "Add at least one tag",
    };
    const labels = mergeDefined(defaultLabels, labelOverrides);

    const isValueControlled = value !== undefined;
    const [uncontrolledTags, setUncontrolledTags] = useState<string[]>(defaultValue ?? []);
    // A value that isn't an array of strings (untyped data on its way) reads as empty rather than throwing.
    const rawTags = isValueControlled ? value : uncontrolledTags;
    const tags = Array.isArray(rawTags) ? rawTags.filter((tag): tag is string => typeof tag === "string") : [];

    const isInputControlled = inputValue !== undefined;
    const [uncontrolledText, setUncontrolledText] = useState(defaultInputValue);
    const text = isInputControlled ? inputValue : uncontrolledText;

    const [message, setMessage] = useState<string | undefined>(undefined);
    const { message: announcement, announce } = useAnnouncement();

    const reactId = useId();
    const errorId = `${reactId}-error`;

    const boxRef = useRef<HTMLDivElement>(null);
    const entryRef = useRef<HTMLInputElement>(null);
    const composing = useRef(false);
    // Focus goes to the entry after a chip is removed from the keyboard or pointer, never to a place the person left.
    const refocusEntry = useRef(false);

    const setTags = (next: string[]) => {
      if (!isValueControlled) setUncontrolledTags(next);
      onValueChange?.(next);
    };

    const setText = (next: string) => {
      if (!isInputControlled) setUncontrolledText(next);
      onInputValueChange?.(next);
    };

    // The consumer's functions are untrusted: a throw falls back to the plain behaviour with a warning.
    const normalize = (raw: string): string => {
      if (!transform) return raw.trim();
      try {
        const result = transform(raw);
        return typeof result === "string" ? result : raw.trim();
      } catch (thrown) {
        warnOnce(`TagsInput: \`transform\` threw (${String(thrown)}); the text was trimmed instead.`);
        return raw.trim();
      }
    };

    const check = (tag: string): string | undefined => {
      if (!validate) return undefined;
      try {
        const result = validate(tag);
        return typeof result === "string" && result !== "" ? result : undefined;
      } catch (thrown) {
        warnOnce(`TagsInput: \`validate\` threw (${String(thrown)}); the tag was accepted. Return a message instead of throwing.`);
        return undefined;
      }
    };

    /** Adds each piece in turn against the list as it grows, and says what happened. */
    const addPieces = (pieces: string[]): { added: string[]; refused: string[] } => {
      const next = [...tags];
      const added: string[] = [];
      const refused: string[] = [];
      for (const piece of pieces) {
        const tag = normalize(piece);
        if (tag === "") continue;
        if (maxTags !== undefined && next.length >= maxTags) {
          refused.push(labels.maxReached(maxTags));
          break;
        }
        if (!allowDuplicates && next.includes(tag)) {
          refused.push(labels.duplicate(tag));
          continue;
        }
        const reason = check(tag);
        if (reason) {
          refused.push(reason);
          continue;
        }
        next.push(tag);
        added.push(tag);
      }
      if (added.length > 0) setTags(next);
      if (pieces.length > 1 && (added.length > 0 || refused.length > 0)) {
        announce(labels.pasted(added.length, refused.length));
      } else if (added.length === 1) announce(labels.added(added[0] as string));
      else if (refused.length > 0) announce(refused[0] as string);
      setMessage(refused[0]);
      return { added, refused };
    };

    const removeAt = (index: number) => {
      const tag = tags[index];
      if (tag === undefined) return;
      const next = tags.filter((_, position) => position !== index);
      setTags(next);
      announce(labels.removed(tag));
      setMessage(undefined);
    };

    const removeFromChip = (index: number) => {
      // Only a person who was in the field keeps their place; focus on a chip that unmounts would fall to the page.
      const box = boxRef.current;
      refocusEntry.current = Boolean(box && box.contains(document.activeElement));
      removeAt(index);
    };

    useLayoutEffect(() => {
      if (!refocusEntry.current) return;
      refocusEntry.current = false;
      entryRef.current?.focus();
    }, [tags.length]);

    const separatorPattern = separators.length > 0 ? new RegExp(separators.map(escapeForPattern).join("|")) : null;
    const pastePattern = new RegExp([...separators.map(escapeForPattern), "\\r?\\n", "\\t"].join("|"));

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      if (message) setMessage(undefined);
      if (!separatorPattern || composing.current || !separatorPattern.test(next)) {
        setText(next);
        return;
      }
      // A separator was typed (or arrived inside a paste the browser handled): everything before the last one is
      // complete, whatever follows it is still being typed.
      const pieces = next.split(new RegExp(separators.map(escapeForPattern).join("|"), "g"));
      const rest = pieces.pop() ?? "";
      const { refused } = addPieces(pieces);
      // A single typed piece that was refused stays in the entry, with its message, so it can be fixed.
      setText(pieces.length === 1 && refused.length > 0 ? (pieces[0] as string) : rest);
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text");
      if (!pastePattern.test(pasted)) return;
      event.preventDefault();
      const pieces = (text + pasted).split(new RegExp(pastePattern.source, "g"));
      addPieces(pieces);
      setText("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      // An Enter or a separator that picks an input-method candidate isn't a tag.
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === "Enter") {
        if (text.trim() === "") return;
        event.preventDefault();
        const { refused } = addPieces([text]);
        if (refused.length === 0) setText("");
        return;
      }
      if (event.key === "Backspace" && text === "" && tags.length > 0) {
        event.preventDefault();
        removeAt(tags.length - 1);
        return;
      }
      if (event.key === "Escape" && text !== "") {
        // Only while there is text to clear: the key belongs to this field, not to whatever it sits in.
        event.preventDefault();
        event.stopPropagation();
        setText("");
        setMessage(undefined);
      }
    };

    // The field is one thing to its owner: leaving the whole box (not moving between a chip's button and the
    // entry) makes a tag of what was typed. A press elsewhere gives no relatedTarget, so look again once it settles.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (!addOnBlur || disabled || readOnly) return;
      const box = event.currentTarget;
      const next = event.relatedTarget as Node | null;
      if (next && box.contains(next)) return;
      const leave = () => {
        if (box.contains(document.activeElement)) return;
        if (entryRef.current && entryRef.current.value.trim() !== "") {
          const { refused } = addPieces([entryRef.current.value]);
          if (refused.length === 0) setText("");
        }
      };
      if (next) leave();
      else queueMicrotask(leave);
    };

    // A press anywhere in the box that isn't on a control puts the caret in the entry, as in a plain field.
    const handleBoxMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target === entryRef.current || target.closest("button, a, input")) return;
      event.preventDefault();
      entryRef.current?.focus();
    };

    if (process.env.NODE_ENV !== "production" && !ariaLabel && !ariaLabelledBy) {
      warnOnce(
        "TagsInput: no accessible name. Pass `aria-label` or `aria-labelledby`, or put it in a `FormField`, so the group and the entry have a name.",
      );
    }

    const invalid = hasError || Boolean(message);
    const canEdit = !disabled && !readOnly;
    const describedBy = [ariaDescribedBy, message ? errorId : undefined].filter(Boolean).join(" ") || undefined;

    return (
      <div {...props} className={cx(styles.root, sizeClass[size], className)} style={style}>
        {/* The mousedown only hands focus to the entry, which is itself fully keyboard-operable. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a hit-area extension of the entry, as `Input`'s box is */}
        <div
          ref={boxRef}
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={describedBy}
          aria-disabled={disabled || undefined}
          className={cx(styles.box, invalid && styles.invalid, disabled && styles.disabled)}
          onMouseDown={handleBoxMouseDown}
          onBlur={handleBlur}
        >
          {/* The explicit roles are deliberate: Safari with VoiceOver stops treating a list as one under
              `list-style: none` (05-component-api-conventions.md §6), which the lint rule calls redundant. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul role="list" className={styles.list}>
            {/* A chip drawn but never seen, so the row is as tall as a chip with none in it and adding the first
                does not move what is below. Hidden from everything: no tab stop, no accessible name, no width. */}
            <li aria-hidden="true" className={styles.sizer}>
              <Tag removable size={tagSizeFor[size]}>
                {"\u00A0"}
              </Tag>
            </li>
            {tags.map((tag, index) => (
              // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see the list above
              <li key={`${index}-${tag}`} role="listitem" className={styles.chip}>
                <Tag
                  tone={tone}
                  variant={variant}
                  size={tagSizeFor[size]}
                  removable={canEdit}
                  removeLabel={labels.remove(tag)}
                  onRemove={() => removeFromChip(index)}
                >
                  {tag}
                </Tag>
              </li>
            ))}
          </ul>
          <div className={styles.entryItem}>
              <input
                ref={mergeRefs(ref, entryRef)}
                type="text"
                id={id}
                data-testid={dataTestId}
                className={styles.entry}
                value={text}
                placeholder={tags.length === 0 ? placeholder : undefined}
                disabled={disabled}
                readOnly={readOnly}
                maxLength={maxTagLength}
                autoComplete={autoComplete}
                inputMode={inputMode}
                enterKeyHint={enterKeyHint}
                spellCheck={spellCheck}
                autoCapitalize={autoCapitalize}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                aria-required={required || undefined}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onCompositionStart={() => {
                  composing.current = true;
                }}
                onCompositionEnd={() => {
                  composing.current = false;
                }}
              />
          </div>
          {clearable && canEdit && tags.length > 0 && (
            <button
              type="button"
              className={styles.clear}
              aria-label={labels.clear}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                // The button unmounts with the last tag; a person who was in the field keeps their place.
                refocusEntry.current = Boolean(boxRef.current?.contains(document.activeElement));
                setTags([]);
                announce(labels.clear);
                setMessage(undefined);
              }}
            >
              <Icon icon={XIcon} size={iconSizeFor[size]} tone="default" />
            </button>
          )}
        </div>
        {message && (
          <FieldError id={errorId} className={styles.message}>
            {message}
          </FieldError>
        )}
        {name &&
          tags.map((tag, index) => (
            <input key={`${index}-${tag}`} type="hidden" name={name} form={form} value={tag} disabled={disabled} />
          ))}
        {/* A visually hidden, real control, so a surrounding form can refuse an empty required field. */}
        {required && (
          <input
            className={styles.validity}
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            required
            form={form}
            value={tags.length > 0 ? "1" : ""}
            // Not read-only: a read-only control is barred from constraint validation, which is its whole job.
            onChange={() => undefined}
            onFocus={() => entryRef.current?.focus()}
          />
        )}
        {/* In the page before it has anything to say, so changes are announced. */}
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      </div>
    );
  },
);

TagsInput.displayName = "TagsInput";
