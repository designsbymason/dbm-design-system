import type { ComboboxOption } from "./Combobox.types";

// The value of the "Create …" row. It holds a character no option's value will, so it never collides with one.
export const CREATE_VALUE = "\u0000create";

export const isDisabled = (option: ComboboxOption): boolean => Boolean(option.disabled);

export type Row =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; option: ComboboxOption; index: number };

/** Orders the options by group (groups in the order they first appear) and adds a heading row before each group. */
export function buildRows(visible: ComboboxOption[]): { rows: Row[]; flat: ComboboxOption[] } {
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

export const firstEnabled = (flat: ComboboxOption[]): number => flat.findIndex((option) => !isDisabled(option));

export const lastEnabled = (flat: ComboboxOption[]): number => {
  for (let index = flat.length - 1; index >= 0; index -= 1) {
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
};

/** The next enabled option from `from` in `direction`, wrapping round the ends, or `-1` when none is enabled. */
export function stepEnabled(flat: ComboboxOption[], from: number, direction: 1 | -1): number {
  const count = flat.length;
  for (let step = 1; step <= count; step += 1) {
    const index = (((from + direction * step) % count) + count) % count;
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
}
