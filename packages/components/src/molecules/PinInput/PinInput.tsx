import { EyeIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { Fragment, forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import type { InputSize } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { IconButton } from "../../atoms/IconButton";
import styles from "./PinInput.module.css";
import type { PinInputLabels, PinInputProps, PinInputTransform, PinInputType } from "./PinInput.types";

const defaultLabels: PinInputLabels = { reveal: "Show code", loading: "Verifying code" };

const defaultLength = 6;
const maxLength = 32;

// What each type drops. `text` takes letters of any script and nothing else; characters outside the Basic
// Multilingual Plane are dropped from it too, so one character is always one cell and one selection index.
const rejected: Record<PinInputType, RegExp> = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^\p{L}0-9]|[\u{10000}-\u{10FFFF}]/gu,
  text: /[^\p{L}]|[\u{10000}-\u{10FFFF}]/gu,
};

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

function resolveLength(length: number): number {
  if (Number.isInteger(length) && length >= 1 && length <= maxLength) return length;
  if (process.env.NODE_ENV !== "production") {
    console.warn(`PinInput: \`length\` must be a whole number from 1 to ${maxLength}; got ${String(length)}. Using ${defaultLength}.`);
  }
  return defaultLength;
}

const spinnerSize: Record<InputSize, "xs" | "sm" | "md" | "lg"> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

function sanitize(raw: string, type: PinInputType, length: number, transform?: PinInputTransform): string {
  const accepted = raw.replace(rejected[type], "");
  // Converted before it is cut, since a letter can become two ("ß" is "SS" in capitals).
  const cased = transform === "uppercase" ? accepted.toUpperCase() : transform === "lowercase" ? accepted.toLowerCase() : accepted;
  return cased.slice(0, length);
}

// The groups the cells are split into, as lists of cell indexes. Cells left over after `groups` make a last group.
function layoutGroups(length: number, groups: number[] | undefined): number[][] {
  const sizes = (groups ?? []).filter((size) => Number.isInteger(size) && size > 0);
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (groups && total !== length && process.env.NODE_ENV !== "production") {
    console.warn(`PinInput: \`groups\` adds up to ${total}, not \`length\` (${length}).`);
  }
  const layout: number[][] = [];
  let next = 0;
  for (const size of sizes) {
    if (next >= length) break;
    const count = Math.min(size, length - next);
    layout.push(Array.from({ length: count }, (_, offset) => next + offset));
    next += count;
  }
  if (next < length) layout.push(Array.from({ length: length - next }, (_, offset) => next + offset));
  return layout;
}

/**
 * A code entry field — a one-time code, a verification code or a PIN — drawn as one cell per character. It is a
 * single real `<input>` lying invisibly over the cells, so a code that arrives by text message can be autofilled,
 * pasting works, a screen reader finds one field with one name, and a surrounding `<form>` submits it under `name`
 * as one string. Typing fills the cells in order, overwriting the character in the cell you are on; the arrow keys,
 * Home and End move between cells; and clicking a cell moves to it. The value is a plain string, kept to the
 * accepted `type` and `length`. `ref` forwards to the native `<input>`; `className` and `style` go on the outermost box.
 *
 * @example
 * ```tsx
 * <PinInput aria-label="Verification code" onComplete={verify} />
 * <PinInput aria-label="PIN" length={4} mask revealable />
 * <PinInput aria-label="Code" groups={[3, 3]} type="alphanumeric" />
 * <PinInput aria-label="Code" value={code} onValueChange={setCode} />
 * ```
 */
export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      length: lengthProp = defaultLength,
      type = "numeric",
      transform,
      value,
      defaultValue = "",
      onValueChange,
      onComplete,
      size = "md",
      groups,
      separator = "–",
      mask = false,
      revealable = false,
      revealed: revealedProp,
      defaultRevealed = false,
      onRevealedChange,
      placeholder,
      isLoading = false,
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      autoComplete = "one-time-code",
      labels: labelOverrides,
      className,
      style,
      onFocus,
      onBlur,
      onKeyDown,
      onSelect,
      onClick,
      onPointerDown,
      onPointerCancel,
      onCompositionStart,
      onCompositionEnd,
      ...props
    },
    ref,
  ) => {
    const length = resolveLength(lengthProp);
    const labels = mergeDefined(defaultLabels, labelOverrides);

    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    // A value that isn't a string (untyped data on its way) reads as empty rather than throwing.
    const rawValue = isControlled ? value : uncontrolledValue;
    const current = sanitize(typeof rawValue === "string" ? rawValue : "", type, length, transform);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (value !== undefined && defaultValue !== "") {
        console.warn("PinInput: pass either `value` or `defaultValue`, not both. `defaultValue` is ignored once `value` is set.");
      }
      if (revealable && !mask) {
        console.warn("PinInput: `revealable` has no effect without `mask`, so there is no show/hide button.");
      }
    }, [value, defaultValue, revealable, mask]);

    const isRevealControlled = revealedProp !== undefined;
    const [uncontrolledRevealed, setUncontrolledRevealed] = useState(defaultRevealed);
    const revealed = isRevealControlled ? revealedProp : uncontrolledRevealed;
    const hidden = mask && !revealed;

    const inputRef = useRef<HTMLInputElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(false);
    // The cells shake once when an error appears after the field is on the page: remembered by comparing with the
    // last render, so a field that starts invalid doesn't.
    const [previousError, setPreviousError] = useState(hasError);
    const [shaking, setShaking] = useState(false);
    if (hasError !== previousError) {
      setPreviousError(hasError);
      setShaking(hasError);
    }
    // Whether a press is on the way to being a click, which picks the cell itself.
    const pressing = useRef(false);
    const lengthRef = useRef(0);
    // Whether the edit being made adds to the end of a full code: read from the input itself just before the edit,
    // since the selection kept in state can be a render behind.
    const typingAtEnd = useRef(false);
    // An input method (Japanese, Chinese, Korean) is mid-composition: the selection is left alone, since changing
    // it would end the composition.
    const composing = useRef(false);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    // A caret between characters becomes the character after it selected, so typing overwrites the cell you are
    // on instead of pushing the rest along. Reads the real input, which the browser keeps.
    const syncSelection = useCallback(() => {
      const input = inputRef.current;
      if (!input || composing.current) return;
      let start = input.selectionStart ?? 0;
      let end = input.selectionEnd ?? 0;
      if (start === end && start < input.value.length) {
        end = start + 1;
        input.setSelectionRange(start, end);
      } else if (start === end && input.value.length >= length) {
        // A full code has no empty cell to go on to: the last one is the one typing replaces.
        start = length - 1;
        end = length;
        input.setSelectionRange(start, end);
      }
      start = Math.min(start, end);
      setSelection((previous) => (previous.start === start && previous.end === end ? previous : { start, end }));
    }, [length]);

    const selectCell = (index: number) => {
      const input = inputRef.current;
      if (!input) return;
      const target = Math.max(0, Math.min(index, current.length, length - 1));
      if (target < current.length) input.setSelectionRange(target, target + 1);
      else input.setSelectionRange(target, target);
      syncSelection();
    };

    // The value can change from outside (a controlled reset), or by being cut back to the accepted characters.
    useEffect(() => {
      if (focused) syncSelection();
    }, [current, focused, syncSelection]);

    // Characters the type does not accept never reach the input: left to the change handler, a rejected key would
    // still move the caret past the cell (the next cell lights up, this one stays empty), and typed over a selected
    // character it would delete it. A paste that is only partly accepted still gets through, and is cleaned.
    useEffect(() => {
      const input = inputRef.current;
      if (!input) return;
      const block = (event: InputEvent) => {
        if (event.isComposing) return;
        typingAtEnd.current =
          input.selectionStart === input.selectionEnd && (input.selectionStart ?? 0) >= length && input.value.length >= length;
        if (event.data && sanitize(event.data, type, length) === "") event.preventDefault();
      };
      input.addEventListener("beforeinput", block);
      return () => input.removeEventListener("beforeinput", block);
    }, [type, length]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      let raw = event.target.value;
      // Characters added to the end of a full code (a caret that has not been moved onto the last cell yet, or text
      // inserted all at once) replace its last character, as typing on a selected last cell does.
      if (typingAtEnd.current && current.length === length && raw.length > length && raw.startsWith(current)) {
        raw = current.slice(0, length - 1) + raw.slice(length);
      }
      const next = sanitize(raw, type, length, transform);
      if (!isControlled) setUncontrolledValue(next);
      if (next !== current) {
        onValueChange?.(next);
        if (next.length === length) onComplete?.(next);
      }
      syncSelection();
    };

    lengthRef.current = current.length;

    // Arriving by keyboard goes to the first empty cell. Browsers select all of an input's text on a Tab, and do
    // it after the focus event, so it is put right on the next frame as well.
    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (!pressing.current) {
        selectCell(current.length);
        requestAnimationFrame(() => {
          if (!pressing.current && document.activeElement === inputRef.current) selectCell(lengthRef.current);
        });
      }
      onFocus?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
      syncSelection();
      onSelect?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      const collapsed = selection.start === selection.end;
      const cell = collapsed ? Math.min(selection.start, length - 1) : selection.start;
      const lastCell = collapsed ? cell : selection.end - 1;
      if (event.key === "ArrowLeft") selectCell(cell - 1);
      else if (event.key === "ArrowRight") selectCell(lastCell + 1);
      else if (event.key === "Home") selectCell(0);
      else if (event.key === "End") selectCell(current.length);
      else return;
      event.preventDefault();
    };

    // The input covers every cell, so a press lands on it wherever it falls; this works out which cell that is.
    const handleClick = (event: MouseEvent<HTMLInputElement>) => {
      pressing.current = false;
      onClick?.(event);
      const cells = fieldRef.current?.querySelectorAll<HTMLElement>("[data-cell]");
      if (!cells || cells.length === 0) return;
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      cells.forEach((cell, index) => {
        const box = cell.getBoundingClientRect();
        const distance = Math.abs(event.clientX - (box.left + box.width / 2));
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      selectCell(nearest);
    };

    const isActive = (index: number) => {
      if (!focused || disabled) return false;
      if (selection.start === selection.end) return index === Math.min(selection.start, length - 1);
      return index >= selection.start && index < selection.end;
    };
    const showCaret = selection.start === selection.end;

    const placeholderFor = (index: number) =>
      placeholder === undefined ? "" : placeholder.length === 1 ? placeholder : (placeholder[index] ?? "");

    const layout = layoutGroups(length, groups);

    return (
      <div
        className={cx(styles.root, sizeClass[size], hasError && styles.error, disabled && styles.disabled, className)}
        style={style}
        // A code reads left to right whatever the page's direction, like a phone number.
        dir="ltr"
      >
        <div className={styles.field} ref={fieldRef}>
          <div className={cx(styles.cells, shaking && styles.shake)} aria-hidden="true" onAnimationEnd={() => setShaking(false)}>
            {layout.map((group, groupIndex) => (
              <Fragment key={group[0]}>
                {groupIndex > 0 ? <span className={styles.separator}>{separator}</span> : null}
                <div className={styles.group}>
                  {group.map((index) => {
                    const character = current[index];
                    const active = isActive(index);
                    return (
                      <span key={index} className={styles.cell} data-cell="" data-active={active} data-filled={character !== undefined}>
                        {character !== undefined ? (
                          hidden ? (
                            "•"
                          ) : (
                            character
                          )
                        ) : showCaret && active ? (
                          <span className={styles.caret} />
                        ) : (
                          <span className={styles.placeholder}>{placeholderFor(index)}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </Fragment>
            ))}
          </div>
          <input
            {...props}
            ref={mergeRefs(ref, inputRef)}
            className={styles.input}
            type={hidden ? "password" : "text"}
            inputMode={type === "numeric" ? "numeric" : "text"}
            pattern={type === "numeric" ? "[0-9]*" : undefined}
            minLength={length}
            value={current}
            autoComplete={autoComplete}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            readOnly={readOnly || isLoading}
            aria-busy={isLoading || undefined}
            required={required}
            aria-invalid={hasError || undefined}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onCompositionStart={(event) => {
              composing.current = true;
              onCompositionStart?.(event);
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              syncSelection();
              onCompositionEnd?.(event);
            }}
            onClick={handleClick}
            onPointerDown={(event) => {
              pressing.current = true;
              onPointerDown?.(event);
            }}
            onPointerCancel={(event) => {
              pressing.current = false;
              onPointerCancel?.(event);
            }}
          />
        </div>
        {isLoading ? <Spinner size={spinnerSize[size]} className={styles.spinner} /> : null}
        {/* In the page before it has anything to say, so the change is announced. */}
        <VisuallyHidden role="status">{isLoading ? labels.loading : ""}</VisuallyHidden>
        {mask && revealable ? (
          <IconButton
            icon={EyeIcon}
            aria-label={labels.reveal}
            variant="ghost"
            size={size}
            disabled={disabled}
            pressed={revealed}
            onPressedChange={(next) => {
              if (!isRevealControlled) setUncontrolledRevealed(next);
              onRevealedChange?.(next);
            }}
          />
        ) : null}
      </div>
    );
  },
);

PinInput.displayName = "PinInput";
