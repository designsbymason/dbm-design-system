import { createContext, useCallback, useState, type MutableRefObject } from "react";
import type { MenuSize } from "./Menu.types";

/** What the root shares with its parts: whether it is open (for the trigger's own `aria-expanded`) and its direction. */
export interface MenuRootContextValue {
  open: boolean;
  dir: "ltr" | "rtl";
  /** Opens the menu and asks it to put focus on its last item instead of its first (ArrowUp on the trigger). */
  openToLast: () => void;
  /** Set by `openToLast` and read, once, by the content as it takes focus. */
  focusLastRef: MutableRefObject<boolean>;
}

export const MenuRootContext = createContext<MenuRootContextValue>({
  open: false,
  dir: "ltr",
  openToLast: () => undefined,
  focusLastRef: { current: false },
});

/** What a submenu root shares with its trigger. `null` outside any `Menu.Sub`. */
export interface MenuSubContextValue {
  open: boolean;
}

export const MenuSubContext = createContext<MenuSubContextValue | null>(null);

/** The size set by the nearest `Menu.Content` or `Menu.SubContent`, read by items, labels and the icons inside them. */
export const MenuSizeContext = createContext<MenuSize>("md");

/**
 * What a `Menu.Group` or `Menu.RadioGroup` shares with a `Menu.Label` inside it: the label reports its id, and the
 * group points `aria-labelledby` at it. `null` outside a group, where a label is only a heading.
 */
export interface MenuGroupContextValue {
  setLabelId: (id: string | undefined) => void;
}

export const MenuGroupContext = createContext<MenuGroupContextValue | null>(null);

/** The chosen value of the nearest `Menu.RadioGroup`, so an item can state its own `aria-checked`. */
export const MenuRadioValueContext = createContext<string | undefined>(undefined);

/**
 * A value that is either the caller's (controlled) or the component's own (uncontrolled), reporting every change.
 * The state is the component's own so that parts which draw from it (a trigger's `aria-expanded`, an item's
 * indicator) don't depend on a primitive's internal context.
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined,
): readonly [T, (next: T) => void] {
  const [own, setOwn] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const set = useCallback(
    (next: T) => {
      if (!isControlled) setOwn(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? controlled : own, set] as const;
}
