import { useState } from "react";

/**
 * A true-or-false setting a component either owns or is told: `controlled` when the parent passes it (and then only
 * the parent changes it), otherwise held here, from `initial`. Either way `onChange` hears the new value. It is the
 * `wrap` / `expanded` pattern the rest of the system writes as `value` / `defaultValue` / `onValueChange`.
 */
export function useControllableFlag(controlled: boolean | undefined, initial: boolean, onChange?: (next: boolean) => void): [boolean, (next: boolean) => void] {
  const [uncontrolled, setUncontrolled] = useState(initial);
  const change = (next: boolean) => {
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
  };
  return [controlled ?? uncontrolled, change];
}
