import { createContext } from "react";

export interface CheckboxGroupContextValue {
  /** The group's own current checked values (controlled or uncontrolled, resolved). */
  value: string[];
  /** Called by a grouped `Checkbox` when its own checked state changes. */
  onItemCheckedChange: (itemValue: string, checked: boolean) => void;
  /** The group's own `disabled` — ORed with each `Checkbox`'s own, mirroring Radix's own RadioGroup precedent. */
  disabled: boolean;
  /**
   * The group's own `name`, cascaded to every `Checkbox` that doesn't set
   * its own — unlike `Radio`/`RadioGroup` (where Radix's own primitive
   * reserves `name` exclusively for the ambient Root), each Radix Checkbox
   * already renders its own independent hidden native input, so sharing one
   * `name` across every grouped item is what makes them submit as a real
   * native checkbox group (`?interests=sports&interests=music`), not a
   * restriction to work around.
   */
  name?: string;
  /** The group's own `form`, cascaded the same way as `name`. */
  form?: string;
}

/**
 * Internal coordination signal between `Checkbox` (atom) and `CheckboxGroup`
 * (molecule) — not part of either component's public API, not exported from
 * the package barrel.
 *
 * Unlike `Radio`/`RadioGroupContext` (a plain boolean, since Radix's own
 * `RadioGroup` primitive does the actual value coordination internally),
 * Radix has no group primitive for checkboxes at all — `Checkbox` is
 * already a fully standalone primitive. `CheckboxGroup` has to implement
 * the array-based multi-select coordination itself, so this context carries
 * the real state and callback, not just a presence signal. `undefined`
 * (the default) means no `CheckboxGroup` ancestor at all.
 */
export const CheckboxGroupContext = createContext<
  CheckboxGroupContextValue | undefined
>(undefined);
