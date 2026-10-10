import { CheckIcon, PencilSimpleIcon, XIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useCallback, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { FieldError } from "../../atoms/FieldError";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import { Input } from "../../atoms/Input";
import type { InputSize } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { Textarea } from "../../atoms/Textarea";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./EditableText.module.css";
import type { EditableTextLabels, EditableTextProps } from "./EditableText.types";

const defaultLabels: EditableTextLabels = {
  edit: "Edit",
  confirm: "Save",
  cancel: "Cancel",
  required: "This field is required",
  saving: "Saving",
};

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// `Input`'s own mapping: the pencil is one step down from the field's size, so it stays inside the row.
const iconSizeForSize: Record<InputSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const warned = new Set<string>();
function warnOnce(message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * A value shown as plain text that turns into a field when it is activated, for names, titles and cells in
 * a table or a detail view. Enter commits the edit and Escape throws it away; leaving the field does one or
 * the other (`blurBehavior`). Single-line values edit in an `Input`, `multiline` ones in a `Textarea`.
 * `onValueChange` is called with the committed value, once, never per keystroke.
 *
 * The text is a real `<button>` (so it is one tab stop and Enter or Space starts editing), the field takes
 * focus with the text selected, and focus returns to the button after a keyboard commit or cancel. The text
 * and the field are the same height at every `size`, so nothing around them moves. `ref` forwards to the
 * outer box, which carries `className` and `style`; `id`, `aria-*` and `data-testid` go to whichever of the
 * button and the field is showing.
 *
 * @example
 * ```tsx
 * <EditableText aria-label="Project name" defaultValue="Apollo" onValueChange={save} />
 * <EditableText aria-label="Notes" multiline placeholder="Add notes" showControls />
 * <EditableText aria-label="Title" activation="doubleClick" required />
 * <FormField label="Name">{(fieldProps) => <EditableText {...fieldProps} defaultValue="Ada" />}</FormField>
 * ```
 */
export const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(
  (
    {
      value,
      defaultValue = "",
      onValueChange,
      editing: editingProp,
      defaultEditing = false,
      onEditingChange,
      multiline = false,
      size = "md",
      placeholder,
      blurBehavior = "commit",
      activation = "click",
      showControls = false,
      showEditIcon = true,
      selectOnFocus = true,
      inheritFont = false,
      required = false,
      isLoading = false,
      showCount = false,
      formatNumber,
      onDraftChange,
      renderValue,
      actionRef,
      validate,
      validateOn = "commit",
      hasError = false,
      disabled = false,
      readOnly = false,
      maxLength,
      minLength,
      inputMode,
      enterKeyHint: enterKeyHintProp,
      spellCheck,
      autoCapitalize,
      autoComplete,
      minRows = 1,
      maxRows,
      name,
      form,
      labels: labelOverrides,
      onFocus,
      onBlur,
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
    const labels = mergeDefined(defaultLabels, labelOverrides);

    const isValueControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    // A value that isn't a string (untyped data on its way) reads as empty rather than throwing.
    const rawValue = isValueControlled ? value : uncontrolledValue;
    const current = typeof rawValue === "string" ? rawValue : "";

    const isEditingControlled = editingProp !== undefined;
    const [uncontrolledEditing, setUncontrolledEditing] = useState(defaultEditing);
    const editing = (isEditingControlled ? editingProp : uncontrolledEditing) && !readOnly;

    const [draft, setDraft] = useState(current);
    const [error, setError] = useState<string | undefined>(undefined);

    // Each time the field opens, whichever way (a gesture, or `editing` set from outside), it starts from the
    // committed value with no message left over from the last edit.
    const [wasEditing, setWasEditing] = useState(editing);
    if (wasEditing !== editing) {
      setWasEditing(editing);
      if (editing) {
        setDraft(current);
        setError(undefined);
      }
    }

    const reactId = useId();
    const textId = `${reactId}-text`;
    const nameId = `${reactId}-name`;
    const hintId = `${reactId}-hint`;
    const errorId = `${reactId}-error`;
    const detachedFormId = `${reactId}-no-form`;

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const setFieldRef = useCallback((element: HTMLInputElement | HTMLTextAreaElement | null) => {
      fieldRef.current = element;
    }, []);

    // An edit that has been committed or cancelled, so the blur its own unmount may cause isn't a second one.
    const settledRef = useRef(false);
    // Focus goes back to the text after a keyboard (or confirm-button) exit, never after a press elsewhere.
    const returnFocusRef = useRef(false);
    const insideRef = useRef(false);

    const requestEditing = (next: boolean) => {
      if (!isEditingControlled) setUncontrolledEditing(next);
      onEditingChange?.(next);
    };

    const validateDraft = (text: string): string | undefined => {
      if (required && text.trim() === "") return labels.required;
      if (!validate) return undefined;
      try {
        const message = validate(text);
        return typeof message === "string" && message !== "" ? message : undefined;
      } catch (thrown) {
        warnOnce(`EditableText: \`validate\` threw (${String(thrown)}); the value was accepted. Return a message instead of throwing.`);
        return undefined;
      }
    };

    const commit = (returnFocus: boolean): void => {
      if (!editing || isLoading) return;
      const message = validateDraft(draft);
      if (message) {
        setError(message);
        return;
      }
      settledRef.current = true;
      returnFocusRef.current = returnFocus;
      if (draft !== current) {
        if (!isValueControlled) setUncontrolledValue(draft);
        onValueChange?.(draft);
      }
      requestEditing(false);
    };

    const cancel = (returnFocus: boolean): void => {
      if (!editing || isLoading) return;
      settledRef.current = true;
      returnFocusRef.current = returnFocus;
      setDraft(current);
      setError(undefined);
      requestEditing(false);
    };

    const startEditing = () => {
      if (disabled || readOnly || isLoading) return;
      settledRef.current = false;
      returnFocusRef.current = false;
      requestEditing(true);
    };

    // What an asynchronous leave (below) needs to read after the render it was scheduled in.
    const latest = useRef({ editing, commit, cancel, isLoading });
    useLayoutEffect(() => {
      latest.current = { editing, commit, cancel, isLoading };
    });

    useImperativeHandle(actionRef, () => ({
      edit: startEditing,
      commit: () => commit(true),
      cancel: () => cancel(true),
    }));

    // Moves focus across the swap. The text's button unmounts as the field mounts, so focus is put on the
    // field by hand (`autoFocus` only works on a native control as it mounts, and the field is one only
    // because of this), and put back on the button after a keyboard exit. A first render never moves focus.
    const previousEditing = useRef(editing);
    useLayoutEffect(() => {
      if (previousEditing.current === editing) return;
      previousEditing.current = editing;
      if (editing) {
        settledRef.current = false;
        const field = fieldRef.current;
        if (!field) return;
        field.focus();
        if (selectOnFocus) field.select();
        else field.setSelectionRange(field.value.length, field.value.length);
      } else if (returnFocusRef.current) {
        returnFocusRef.current = false;
        // Only if focus is still here or nowhere: a save that finishes after the person has moved on mustn't
        // pull focus back from wherever they went.
        const active = document.activeElement;
        if (!active || active === document.body || rootRef.current?.contains(active)) triggerRef.current?.focus();
      }
    }, [editing, selectOnFocus]);

    if (process.env.NODE_ENV !== "production" && !ariaLabel && !ariaLabelledBy) {
      warnOnce(
        "EditableText: no accessible name. Pass `aria-label` or `aria-labelledby`, or put it in a `FormField`, so the text's button and the field have a name.",
      );
    }

    // The component is one field to its owner: focus and blur are reported on arriving at and leaving the
    // whole, not as focus moves between the text, the field and the two buttons.
    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (insideRef.current) return;
      insideRef.current = true;
      onFocus?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      const root = event.currentTarget;
      const next = event.relatedTarget as Node | null;
      if (next && root.contains(next)) return;
      const leave = () => {
        // Focus the browser has left in place (another window took it) or put back inside (the swap) isn't leaving.
        if (root.contains(document.activeElement)) return;
        insideRef.current = false;
        onBlur?.(event);
        const state = latest.current;
        if (state.editing && !settledRef.current && !latest.current.isLoading) {
          if (blurBehavior === "commit") state.commit(false);
          else state.cancel(false);
        }
      };
      // A press on a non-focusable area gives no `relatedTarget`; the swap does too. Look again once it settles.
      if (next) leave();
      else queueMicrotask(leave);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isLoading) {
        // The edit is on its way; the keys that would end it wait for the answer.
        if (event.key === "Escape" || (event.key === "Enter" && !multiline)) event.preventDefault();
        return;
      }
      if (event.key === "Escape") {
        // Only while editing: the key belongs to this field, not to whatever it sits in.
        event.preventDefault();
        event.stopPropagation();
        cancel(true);
        return;
      }
      if (event.key !== "Enter") return;
      // Enter that picks an IME candidate isn't a commit.
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (multiline && !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      commit(true);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      settledRef.current = false;
      setDraft(event.target.value);
      // `validateOn="change"` judges the draft as it is typed; otherwise a message waits for the next commit.
      if (validateOn === "change") setError(validateDraft(event.target.value));
      else if (error) setError(undefined);
      onDraftChange?.(event.target.value);
    };

    // Pressing a control must not blur the field first (Safari doesn't focus a pressed button, so the
    // relatedTarget test alone isn't enough), or the press would commit or cancel before it is read.
    const keepFieldFocus = (event: MouseEvent) => event.preventDefault();

    const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
      // A keyboard activation of the button is a click with no pointer (`detail === 0`), and starts editing
      // in either mode; a pointer click does only for `activation="click"`.
      if (activation === "click" || event.detail === 0) startEditing();
    };

    // Formatting is the consumer's function over the value: a throw falls back to the raw text.
    const formatted = (): ReactNode => {
      if (!renderValue) return current;
      try {
        return renderValue(current);
      } catch (thrown) {
        warnOnce(`EditableText: \`renderValue\` threw (${String(thrown)}); the raw value was shown instead.`);
        return current;
      }
    };
    // F2 starts editing from the keyboard, as in a spreadsheet or a file list.
    const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "F2") return;
      event.preventDefault();
      startEditing();
    };

    const empty = current === "";
    const shown: ReactNode = empty ? (placeholder ?? "") : formatted();
    const hasName = Boolean(ariaLabel);
    const nameIds = [ariaLabelledBy, hasName ? nameId : undefined].filter(Boolean).join(" ");
    const describedBy = (ids: Array<string | undefined>) => ids.filter(Boolean).join(" ") || undefined;

    const rootClass = cx(
      styles.root,
      sizeClass[size],
      multiline && styles.multiline,
      inheritFont && styles.inheritFont,
      className,
    );
    const invalid = hasError || Boolean(error);

    let content;
    if (editing) {
      const fieldProps = {
        id,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": describedBy([ariaDescribedBy, error ? errorId : undefined]),
        "data-testid": dataTestId,
        // The open field is a draft, not a member of the surrounding form: the committed value is what the form
        // submits (through the hidden input), so the field is given an owner that doesn't exist, and its own
        // `required` and `minLength` can't stop that form submitting.
        form: detachedFormId,
        value: draft,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        placeholder,
        size,
        hasError: invalid,
        disabled,
        readOnly: isLoading || undefined,
        "aria-busy": isLoading || undefined,
        showCount,
        formatNumber,
        required,
        maxLength,
        minLength,
        inputMode,
        enterKeyHint: enterKeyHintProp ?? (multiline ? undefined : "done"),
        spellCheck,
        autoCapitalize,
        autoComplete,
      };
      content = (
        <div className={styles.editor}>
          <div className={styles.row}>
            <div className={styles.field}>
              {multiline ? (
                <Textarea
                  ref={setFieldRef}
                  {...fieldProps}
                  rows={1}
                  autoResize
                  minRows={minRows}
                  maxRows={maxRows}
                />
              ) : (
                <Input ref={setFieldRef} {...fieldProps} />
              )}
            </div>
            {isLoading && <Spinner size={iconSizeForSize[size]} className={styles.spinner} />}
            {showControls && (
              <div className={styles.controls}>
                <IconButton
                  icon={CheckIcon}
                  variant="secondary"
                  size={size}
                  aria-label={labels.confirm}
                  disabled={isLoading}
                  onMouseDown={keepFieldFocus}
                  onClick={() => commit(true)}
                />
                <IconButton
                  icon={XIcon}
                  variant="ghost"
                  size={size}
                  aria-label={labels.cancel}
                  disabled={isLoading}
                  onMouseDown={keepFieldFocus}
                  onClick={() => cancel(true)}
                />
              </div>
            )}
          </div>
          {error && <FieldError id={errorId} className={styles.message}>{error}</FieldError>}
        </div>
      );
    } else if (readOnly) {
      content = (
        <div
          className={cx(styles.display, styles.static, hasError && styles.invalid)}
          id={id}
          data-testid={dataTestId}
          aria-describedby={ariaDescribedBy}
        >
          <span className={cx(styles.text, empty && styles.placeholder)}>{shown === "" ? "\u00A0" : shown}</span>
        </div>
      );
    } else {
      content = (
        <>
          {hasName && <VisuallyHidden id={nameId}>{ariaLabel}</VisuallyHidden>}
          <VisuallyHidden id={hintId}>{labels.edit}</VisuallyHidden>
          <button
            ref={triggerRef}
            type="button"
            id={id}
            data-testid={dataTestId}
            disabled={disabled}
            className={cx(
              styles.display,
              styles.trigger,
              hasError && styles.invalid,
              empty && styles.empty,
              activation === "doubleClick" && styles.doubleClick,
            )}
            aria-labelledby={describedBy([nameIds || undefined, textId])}
            aria-describedby={describedBy([ariaDescribedBy, hintId])}
            aria-busy={isLoading || undefined}
            onClick={handleTriggerClick}
            onDoubleClick={startEditing}
            onKeyDown={handleTriggerKeyDown}
          >
            <span id={textId} className={cx(styles.text, empty && styles.placeholder)}>
              {shown === "" ? "\u00A0" : shown}
            </span>
            {isLoading ? (
              <Spinner size={iconSizeForSize[size]} className={styles.spinner} />
            ) : (
              showEditIcon && (
                <Icon className={styles.icon} icon={PencilSimpleIcon} size={iconSizeForSize[size]} tone="default" />
              )
            )}
          </button>
        </>
      );
    }

    return (
      <div
        ref={mergeRefs(ref, rootRef)}
        {...props}
        className={rootClass}
        style={style}
        data-editing={editing ? "" : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {content}
        {/* In the page before it has anything to say, so the change is announced. */}
        <VisuallyHidden role="status">{isLoading ? labels.saving : ""}</VisuallyHidden>
        {name && <input type="hidden" name={name} form={form} value={current} disabled={disabled} />}
      </div>
    );
  },
);

EditableText.displayName = "EditableText";
