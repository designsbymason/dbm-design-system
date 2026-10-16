import { CaretDownIcon, CheckIcon, XIcon } from "@dbm-design-system/icons";
import {
  cx,
  mergeDefined,
  mergeRefs,
  useAnnouncement,
  useWindowedList,
} from "@dbm-design-system/primitives";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Highlight } from "../../atoms/Highlight";
import { Icon } from "../../atoms/Icon";
import { Input } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Combobox.module.css";
import type {
  ComboboxInputChangeReason,
  ComboboxLabels,
  ComboboxOption,
  ComboboxProps,
  ComboboxSize,
} from "./Combobox.types";

// Past this many rows only the ones in view are drawn (06 §4). Below it, drawing them all is cheaper than the
// bookkeeping, and keeps real group elements in the list.
const WINDOW_THRESHOLD = 100;
// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;
// The gap between the field and its list, in pixels (Radix takes a number, as `Popover`'s `sideOffset` does).
const SIDE_OFFSET = 4;

const sizeClass: Record<ComboboxSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const adornmentClass: Record<ComboboxSize, string | undefined> = {
  xs: styles.adornmentXs,
  sm: styles.adornmentSm,
  md: styles.adornmentMd,
  lg: styles.adornmentLg,
  xl: styles.adornmentXl,
};

// One step below the field's own size, the way `Input` sizes its clear icon.
const adornmentIconSize: Record<ComboboxSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const optionIconSize: Record<ComboboxSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
};

const buildDefaultLabels = (formatNumber: (value: number) => string): ComboboxLabels => ({
  clear: "Clear",
  toggle: "Toggle options",
  noResults: "No results",
  loading: "Loading…",
  error: "Something went wrong. Try again.",
  results: (count) => `${formatNumber(count)} results available`,
  pickAnOption: "Choose one of the options",
});

/** Lower-cases and drops accents, writing each character on its own so positions map back to the original text. */
function foldCharacters(text: string): { folded: string; origin: number[] } {
  let folded = "";
  const origin: number[] = [];
  let position = 0;
  for (const character of text) {
    const piece = character.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (let offset = 0; offset < piece.length; offset += 1) origin.push(position);
    folded += piece;
    position += character.length;
  }
  origin.push(position);
  return { folded, origin };
}

const fold = (text: string): string => foldCharacters(text).folded;

function defaultFilter(option: ComboboxOption, text: string): boolean {
  const query = fold(text.trim());
  if (query === "") return true;
  return fold(option.textValue ?? option.label).includes(query);
}

/** The first stretch of `label` that the typed text matches, ignoring case and accents, or `undefined`. */
function findMatch(label: string, text: string): [number, number] | undefined {
  const query = fold(text.trim());
  if (query === "") return undefined;
  const { folded, origin } = foldCharacters(label);
  const at = folded.indexOf(query);
  if (at === -1) return undefined;
  const from = origin[at];
  const to = origin[at + query.length];
  return from === undefined || to === undefined ? undefined : [from, to];
}

const ignoreChange = () => undefined;

const isDisabled = (option: ComboboxOption): boolean => Boolean(option.disabled);

type Row =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; option: ComboboxOption; index: number };

/** Orders the options by group (groups in the order they first appear) and adds a heading row before each group. */
function buildRows(visible: ComboboxOption[]): { rows: Row[]; flat: ComboboxOption[] } {
  const groups = new Map<string | undefined, ComboboxOption[]>();
  for (const option of visible) {
    const members = groups.get(option.group);
    if (members) members.push(option);
    else groups.set(option.group, [option]);
  }
  const rows: Row[] = [];
  const flat: ComboboxOption[] = [];
  for (const [group, members] of groups) {
    if (group !== undefined) rows.push({ kind: "group", key: `group:${group}`, label: group });
    for (const option of members) {
      rows.push({ kind: "option", key: `option:${option.value}`, option, index: flat.length });
      flat.push(option);
    }
  }
  return { rows, flat };
}

/** A length token such as `2.25rem` in pixels, or `undefined` when it can't be read (a server render). */
function readLengthToken(name: string): number | undefined {
  if (typeof document === "undefined") return undefined;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return undefined;
  if (raw.endsWith("rem")) return value * Number.parseFloat(root.fontSize);
  return raw.endsWith("px") ? value : undefined;
}

const firstEnabled = (flat: ComboboxOption[]): number => flat.findIndex((option) => !isDisabled(option));

const lastEnabled = (flat: ComboboxOption[]): number => {
  for (let index = flat.length - 1; index >= 0; index -= 1) {
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
};

/** The next enabled option from `from` in `direction`, wrapping round the ends, or `-1` when none is enabled. */
function stepEnabled(flat: ComboboxOption[], from: number, direction: 1 | -1): number {
  const count = flat.length;
  for (let step = 1; step <= count; step += 1) {
    const index = (((from + direction * step) % count) + count) % count;
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
}

/**
 * A text field with a list of options under it: type to narrow the list, then choose one with the keyboard, a
 * mouse or a finger. A single-select combobox — the value is one option's `value`, and the field shows its label.
 * "Autocomplete" is the same control. Focus stays in the field while the list is open; the highlighted option is
 * pointed at with `aria-activedescendant`.
 *
 * The options are an `options` array rather than child parts, so the list can be filtered, counted, announced,
 * fetched as the person types and drawn a window at a time when it is long. By default the value is always one of
 * the options: text that matches none is put back to the last choice when the field is left (`allowCustomValue`
 * lets the text itself be the value). The caller owns fetching: pass `filter={false}` and a new `options` array as
 * `onInputValueChange` reports typing.
 *
 * `ref` forwards to the native `<input>`. `className` and `style` go on the outermost box; `id`, `data-testid`,
 * `name` and the `aria-*` props go on the input. Inside a `Form`, a visually hidden input carries `name`, `required`
 * and the chosen value so the form can refuse an unchosen field.
 *
 * @example
 * ```tsx
 * <Combobox
 *   aria-label="Country"
 *   options={[
 *     { value: "ca", label: "Canada" },
 *     { value: "mx", label: "Mexico" },
 *   ]}
 *   onValueChange={(value) => setCountry(value)}
 * />
 *
 * // Options fetched as the person types
 * <Combobox
 *   aria-label="User"
 *   options={users}
 *   filter={false}
 *   loading={isFetching}
 *   onInputValueChange={(text, reason) => reason === "input" && search(text)}
 * />
 * ```
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options = [],
      value: valueProp,
      defaultValue = "",
      onValueChange,
      inputValue: inputValueProp,
      defaultInputValue,
      onInputValueChange,
      allowCustomValue = false,
      filter,
      autoHighlight,
      loading = false,
      error = false,
      emptyContent,
      renderOption,
      clearable = false,
      onClear,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      openOnFocus = false,
      prefix,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      placeholder,
      name,
      form,
      autoComplete = "off",
      side = "bottom",
      align = "start",
      dir = "ltr",
      labels: labelOverrides,
      formatNumber = String,
      id,
      className,
      style,
      onKeyDown,
      onFocus,
      onBlur,
      onClick,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `${reactId}-input`;
    const listId = `${reactId}-list`;
    const optionDomId = (index: number) => `${listId}-option-${index}`;
    const labels = useMemo(
      () => mergeDefined(buildDefaultLabels(formatNumber), labelOverrides),
      [formatNumber, labelOverrides],
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const { message: announcement, announce } = useAnnouncement();

    // The chosen value.
    const isValueControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = useState(defaultValue);
    const value = isValueControlled ? valueProp : innerValue;
    const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

    // The text in the field. `typed` is the text the person has entered since the last choice, `null` while the
    // field just shows the chosen option's label. Keeping it apart means a label that arrives late (a value whose
    // option isn't loaded yet) shows by itself, and a choice the owner refuses isn't left on screen.
    const [typed, setTyped] = useState<string | null>(defaultInputValue ?? null);
    const dirty = typed !== null;
    const restingText = selected?.label ?? (allowCustomValue ? value : "");
    const inputValue = inputValueProp ?? typed ?? restingText;

    // Open state.
    const isOpenControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const interactive = !disabled && !readOnly;
    const open = (isOpenControlled ? openProp : innerOpen) && interactive;
    const setOpen = useCallback(
      (next: boolean) => {
        if (next && !interactive) return;
        if (!isOpenControlled) setInnerOpen(next);
        if (next !== open) onOpenChange?.(next);
      },
      [interactive, isOpenControlled, open, onOpenChange],
    );

    // The options on show and the rows that draw them.
    const filterText = dirty ? inputValue : "";
    const visible = useMemo(() => {
      if (filter === false) return options;
      const matches = filter ?? defaultFilter;
      return options.filter((option) => matches(option, filterText));
    }, [options, filter, filterText]);
    const { rows, flat } = useMemo(() => buildRows(visible), [visible]);
    const rowIndexOfOption = useMemo(() => {
      const map: number[] = [];
      rows.forEach((row, rowIndex) => {
        if (row.kind === "option") map[row.index] = rowIndex;
      });
      return map;
    }, [rows]);

    // The highlight. `navigated` is the option the person moved to with a key or the pointer; until they do, the
    // highlight is the first match while typing (`autoHighlight`) and the chosen option otherwise.
    const [navigated, setNavigated] = useState<string | null>(null);
    const autoHighlightOn = autoHighlight ?? !allowCustomValue;
    const highlighted = useMemo(() => {
      if (!open) return -1;
      if (navigated !== null) {
        const index = flat.findIndex((option) => option.value === navigated);
        if (index !== -1) return index;
      }
      if (dirty) return autoHighlightOn ? firstEnabled(flat) : -1;
      const chosen = flat.findIndex((option) => option.value === value);
      return chosen !== -1 && !isDisabled(flat[chosen] as ComboboxOption) ? chosen : -1;
    }, [open, navigated, flat, dirty, autoHighlightOn, value]);

    // Windowing: rows are a fixed height, so a long list draws only the ones in view.
    const windowed = open && rows.length > WINDOW_THRESHOLD;
    const rowSizes = useMemo(() => {
      if (!windowed) return undefined;
      const plain = readLengthToken(`--dbm-combobox-option-height-${size}`);
      const described = readLengthToken(`--dbm-combobox-option-height-described-${size}`);
      return plain !== undefined && described !== undefined ? { plain, described } : undefined;
    }, [windowed, size]);
    const getItemSize = useCallback(
      (rowIndex: number) => {
        const row = rows[rowIndex];
        const described = row?.kind === "option" && Boolean(row.option.description);
        return (described ? rowSizes?.described : rowSizes?.plain) ?? 0;
      },
      [rows, rowSizes],
    );
    const windowedList = useWindowedList({
      count: rows.length,
      getItemSize,
      enabled: windowed && rowSizes !== undefined,
    });
    const { containerRef: windowRef, scrollToIndex, viewportSize } = windowedList;
    const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
    const setListRef = useCallback(
      (element: HTMLDivElement | null) => {
        setListElement(element);
        windowRef(element);
      },
      [windowRef],
    );

    // Keeps the highlighted option in view after a key moved it. A pointer hover doesn't scroll, so the list
    // doesn't jump under the pointer.
    const scrollOnHighlight = useRef(false);
    useEffect(() => {
      if (!scrollOnHighlight.current || highlighted === -1 || !listElement) return;
      scrollOnHighlight.current = false;
      if (!windowed) {
        listElement
          .querySelector<HTMLElement>(`[id="${optionDomId(highlighted)}"]`)
          ?.scrollIntoView({ block: "nearest" });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `optionDomId` only reads `listId`, which is stable
    }, [highlighted, listElement, windowed]);

    // When the list opens on a chosen option far down a long list, bring it into view. The box is only as tall as it
    // will be once the floating layer has measured the room there is, so this runs again when its height settles.
    useEffect(() => {
      if (!open || !windowed || !listElement) return;
      const target = highlighted === -1 ? undefined : rowIndexOfOption[highlighted];
      if (target !== undefined) scrollToIndex(target);
      // Not on every highlight: moving it with a key scrolls from the key handler.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, windowed, listElement, viewportSize]);

    const moveHighlight = (index: number) => {
      const option = flat[index];
      if (!option) return;
      scrollOnHighlight.current = true;
      setNavigated(option.value);
      if (windowed) {
        const target = rowIndexOfOption[index];
        if (target !== undefined) scrollToIndex(target);
      }
    };

    // Announcements: the number of matches changing while the person types. A list that merely opens, or whose
    // options are all there on arrival, is a first appearance and isn't read.
    const lastAnnounced = useRef<string>("");
    useEffect(() => {
      if (!open || !dirty) {
        lastAnnounced.current = "";
        return;
      }
      const key = `${filterText}|${flat.length}|${loading}`;
      if (key === lastAnnounced.current) return;
      lastAnnounced.current = key;
      if (!loading) announce(flat.length === 0 ? labels.noResults : labels.results(flat.length));
    }, [open, dirty, filterText, flat.length, loading, labels, announce]);
    const lastError = useRef(false);
    useEffect(() => {
      if (error && !lastError.current) announce(labels.error);
      lastError.current = error;
    }, [error, labels.error, announce]);

    // Changing things.
    const setText = (next: string, reason: ComboboxInputChangeReason) => {
      onInputValueChange?.(next, reason);
    };
    const updateValue = (next: string, option: ComboboxOption | undefined) => {
      if (!isValueControlled) setInnerValue(next);
      if (next !== value) onValueChange?.(next, option);
    };
    const choose = (option: ComboboxOption) => {
      if (isDisabled(option)) return;
      updateValue(option.value, option);
      setTyped(null);
      setText(option.label, "select");
      setNavigated(null);
      setOpen(false);
    };
    const exactMatch = (text: string) => {
      const wanted = fold(text.trim());
      return wanted === "" ? undefined : options.find((option) => !isDisabled(option) && fold(option.label) === wanted);
    };
    // Settles whatever is typed once the person is done with it (Enter, or leaving the field).
    const settle = () => {
      if (typed === null) return;
      const exact = exactMatch(typed);
      if (exact) {
        choose(exact);
        return;
      }
      if (allowCustomValue) {
        updateValue(typed, undefined);
        setTyped(null);
        return;
      }
      if (typed.trim() === "") {
        updateValue("", undefined);
        setTyped(null);
        setText("", "reset");
        return;
      }
      setTyped(null);
      setText(selected?.label ?? "", "reset");
    };
    const clear = () => {
      updateValue("", undefined);
      setTyped(null);
      setText("", "clear");
      setNavigated(null);
      onClear?.();
      inputRef.current?.focus();
    };

    // The accessible name for the list, taken from the field's own label when it isn't named with `aria-label`.
    const [fieldLabel, setFieldLabel] = useState<string | undefined>();
    const readFieldLabel = () => {
      const text = inputRef.current?.labels?.[0]?.textContent?.trim();
      setFieldLabel(text || undefined);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!interactive) return;
      setTyped(event.target.value);
      setText(event.target.value, "input");
      setNavigated(null);
      setOpen(true);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      readFieldLabel();
      if (openOnFocus) setOpen(true);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      const next = event.relatedTarget;
      if (next instanceof Node && rootRef.current?.contains(next)) return;
      settle();
      setNavigated(null);
      setOpen(false);
    };

    const handleClick = (event: MouseEvent<HTMLInputElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented && interactive && !open) setOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing || !interactive) return;
      const key = event.key;
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        const direction = key === "ArrowDown" ? 1 : -1;
        if (event.altKey) {
          setOpen(direction === 1);
          return;
        }
        if (!open) {
          setOpen(true);
          const resting = !dirty ? flat.findIndex((option) => option.value === value) : -1;
          const start = resting !== -1 ? resting : direction === 1 ? firstEnabled(flat) : lastEnabled(flat);
          if (start !== -1) moveHighlight(start);
          return;
        }
        const next = highlighted === -1 ? (direction === 1 ? firstEnabled(flat) : lastEnabled(flat)) : stepEnabled(flat, highlighted, direction);
        if (next !== -1) moveHighlight(next);
        return;
      }
      if ((key === "PageDown" || key === "PageUp") && open) {
        event.preventDefault();
        const direction = key === "PageDown" ? 1 : -1;
        const from = highlighted === -1 ? (direction === 1 ? -1 : flat.length) : highlighted;
        let next = Math.min(flat.length - 1, Math.max(0, from + direction * PAGE_STEP));
        while (next >= 0 && next < flat.length && isDisabled(flat[next] as ComboboxOption)) next += direction;
        if (next >= 0 && next < flat.length) moveHighlight(next);
        return;
      }
      if (key === "Enter" && open) {
        event.preventDefault();
        const option = highlighted === -1 ? undefined : flat[highlighted];
        if (option) choose(option);
        else {
          settle();
          setOpen(false);
        }
        return;
      }
    };

    // Radix's dismissable layer closes the list on Escape (and marks the key handled, which is why this isn't in the
    // key handler); this puts back the label of the last choice.
    const handleEscape = () => {
      if (dirty) {
        setTyped(null);
        setText(selected?.label ?? "", "reset");
      }
      setNavigated(null);
    };

    // The form control. The visible field holds text, so a form reads the chosen value (and refuses an unchosen
    // field) from a hidden input, as `TimePicker` does. With `allowCustomValue` the visible field is the control.
    const unchosenText = !allowCustomValue && dirty && inputValue.trim() !== "";
    useEffect(() => {
      hiddenRef.current?.setCustomValidity(unchosenText ? labels.pickAnOption : "");
    }, [unchosenText, labels.pickAnOption]);

    const activeRendered =
      highlighted !== -1 &&
      (!windowed ||
        (() => {
          const rowIndex = rowIndexOfOption[highlighted];
          return rowIndex !== undefined && rowIndex >= windowedList.start && rowIndex < windowedList.end;
        })());

    const showClear = clearable && interactive && (value !== "" || inputValue !== "");
    const markText = dirty ? inputValue : "";

    const renderRowContent = (option: ComboboxOption, isHighlighted: boolean, isSelected: boolean): ReactNode => {
      if (renderOption) return renderOption(option, { highlighted: isHighlighted, selected: isSelected });
      const match = findMatch(option.label, markText);
      const label = match ? (
        <>
          {option.label.slice(0, match[0])}
          <Highlight tone="highlight" className={styles.match}>
            {option.label.slice(match[0], match[1])}
          </Highlight>
          {option.label.slice(match[1])}
        </>
      ) : (
        option.label
      );
      return (
        <>
          {option.icon ? (
            <Icon icon={option.icon} size={optionIconSize[size]} tone="default" className={styles.optionIcon} />
          ) : null}
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>{label}</span>
            {option.description ? <span className={styles.optionDescription}>{option.description}</span> : null}
          </span>
        </>
      );
    };

    const renderOptionRow = (row: Extract<Row, { kind: "option" }>) => {
      const { option, index } = row;
      const isSelected = option.value === value;
      const isHighlighted = index === highlighted;
      const reason = typeof option.disabled === "string" ? option.disabled : undefined;
      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- an option of a combobox is never focused: focus stays in the field, which points at the highlighted option with aria-activedescendant and answers the keys itself (the ARIA combobox pattern).
        <div
          key={row.key}
          id={optionDomId(index)}
          role="option"
          aria-selected={isSelected}
          aria-disabled={isDisabled(option) || undefined}
          data-highlighted={isHighlighted || undefined}
          data-selected={isSelected || undefined}
          data-disabled={isDisabled(option) || undefined}
          title={reason}
          className={cx(styles.option, Boolean(option.description) && styles.optionDescribed)}
          onClick={() => choose(option)}
          onMouseMove={() => {
            if (!isDisabled(option) && navigated !== option.value) setNavigated(option.value);
          }}
        >
          {renderRowContent(option, isHighlighted, isSelected)}
          {reason ? <VisuallyHidden>{`, ${reason}`}</VisuallyHidden> : null}
          {isSelected ? (
            <Icon icon={CheckIcon} size={optionIconSize[size]} tone="brand" className={styles.optionCheck} />
          ) : null}
        </div>
      );
    };

    const renderHeading = (row: Extract<Row, { kind: "group" }>) => (
      <div key={row.key} id={`${listId}-${row.key}`} role="presentation" className={styles.groupLabel}>
        {row.label}
      </div>
    );

    const drawn = windowed && rowSizes ? rows.slice(windowedList.start, windowedList.end) : rows;

    const renderRows = (): ReactNode => {
      if (flat.length === 0) {
        return (
          <div role="option" aria-selected="false" aria-disabled="true" className={cx(styles.option, styles.status)}>
            {loading ? labels.loading : (emptyContent ?? labels.noResults)}
          </div>
        );
      }
      if (windowed && rowSizes) {
        return drawn.map((row) => (row.kind === "group" ? renderHeading(row) : renderOptionRow(row)));
      }
      const sections: ReactNode[] = [];
      let group: { heading: Extract<Row, { kind: "group" }>; items: ReactNode[] } | undefined;
      const flush = () => {
        if (!group) return;
        sections.push(
          <div key={group.heading.key} role="group" aria-labelledby={`${listId}-${group.heading.key}`}>
            {renderHeading(group.heading)}
            {group.items}
          </div>,
        );
        group = undefined;
      };
      for (const row of rows) {
        if (row.kind === "group") {
          flush();
          group = { heading: row, items: [] };
        } else if (group) group.items.push(renderOptionRow(row));
        else sections.push(renderOptionRow(row));
      }
      flush();
      return sections;
    };

    const windowStyle =
      windowed && rowSizes
        ? { paddingBlockStart: windowedList.before, paddingBlockEnd: windowedList.after }
        : undefined;

    const hiddenControl = !allowCustomValue ? (
      <VisuallyHidden asChild>
        <input
          ref={hiddenRef}
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          name={name}
          form={form}
          value={value}
          required={required}
          disabled={disabled}
          // Not `readOnly`: a read-only input is barred from constraint validation, which is the point of this one.
          onChange={ignoreChange}
          // A form focuses an invalid control it can find; send that focus to the field a person can see.
          onFocus={() => inputRef.current?.focus()}
        />
      </VisuallyHidden>
    ) : null;

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>
          <div ref={rootRef} className={cx(styles.root, className)} style={style} dir={dir}>
            <Input
              {...rest}
              ref={mergeRefs(ref, inputRef)}
              id={inputId}
              size={size}
              prefix={prefix}
              hasError={hasError}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              autoComplete={autoComplete}
              name={allowCustomValue ? name : undefined}
              form={allowCustomValue ? form : undefined}
              value={inputValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              suffix={
                <span className={styles.adornments}>
                  {loading ? <Spinner size="xs" tone="default" /> : null}
                  {showClear ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={labels.clear}
                      className={cx(styles.adornment, adornmentClass[size])}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={clear}
                    >
                      <Icon icon={XIcon} size={adornmentIconSize[size]} tone="default" />
                    </button>
                  ) : null}
                  {interactive ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={labels.toggle}
                      className={cx(styles.adornment, adornmentClass[size])}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        inputRef.current?.focus();
                        setOpen(!open);
                      }}
                    >
                      <Icon icon={CaretDownIcon} size={adornmentIconSize[size]} tone="default" />
                    </button>
                  ) : null}
                </span>
              }
              role="combobox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-haspopup="listbox"
              aria-expanded={open}
              // Points at the list for as long as it is in the page, which includes the moment it fades out after closing.
              aria-controls={listElement ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={open && activeRendered ? optionDomId(highlighted) : undefined}
              aria-required={required || undefined}
            />
            {hiddenControl}
            <VisuallyHidden role="status">{announcement}</VisuallyHidden>
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            role="presentation"
            dir={dir}
            side={side}
            align={align}
            sideOffset={SIDE_OFFSET}
            collisionPadding={SIDE_OFFSET * 2}
            className={cx(styles.content, sizeClass[size])}
            // Focus stays in the field: nothing here takes it, and a press on the list isn't the field losing it.
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={handleEscape}
            onFocusOutside={(event) => event.preventDefault()}
            // A press in the field or its buttons is not "outside"; one anywhere else closes the list.
            onInteractOutside={(event) => {
              const target = event.target;
              if (target instanceof Node && rootRef.current?.contains(target)) event.preventDefault();
            }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <div
              ref={setListRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? fieldLabel)}
              aria-labelledby={ariaLabelledBy}
              aria-busy={loading || undefined}
              className={styles.list}
            >
              {/* The spacers of a windowed list are this box's padding, not the scrolling box's own: a box can't
                  shrink below its padding, so padding on it would stop it being capped. */}
              <div role="presentation" style={windowStyle}>
                {renderRows()}
              </div>
            </div>
            {error ? <div className={styles.footer}>{labels.error}</div> : null}
            {loading && flat.length > 0 ? (
              <div className={styles.footer}>
                <Spinner size="xs" tone="default" />
                {labels.loading}
              </div>
            ) : null}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  },
);

Combobox.displayName = "Combobox";
