import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "./Button.types";

/**
 * What a `ButtonGroup` (a molecule) hands to the `Button`s and `IconButton`s inside it. Not exported from the
 * package: it lives beside the atoms that read it because an atom may not import from a molecule, and only
 * `ButtonGroup` provides it. Every field is a default — a button's own prop always wins — except `disabled`,
 * which disables the button when either the group or the button says so.
 */
export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  rounded?: boolean;
  disabled?: boolean;
}

const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

export const ButtonGroupProvider = ButtonGroupContext.Provider;

/** The enclosing group's settings, or `null` outside one (so a button outside a group is exactly as it was). */
export function useButtonGroup(): ButtonGroupContextValue | null {
  return useContext(ButtonGroupContext);
}

/**
 * Puts the group's settings out of reach of what is inside: a `Button` or `IconButton` in it reads none and is exactly as it would be
 * outside a group. React context crosses a portal, so a dialog, popover, menu or tooltip opened from inside a `ButtonGroup`, a `Toolbar`
 * or `Navbar.Actions` would otherwise draw its own buttons in that group's size, variant and tone. Each overlay wraps what a consumer
 * puts in it with this.
 */
export function ButtonGroupReset({ children }: { children?: ReactNode }) {
  return createElement(ButtonGroupProvider, { value: null }, children);
}
