import { createContext, useContext } from "react";
import type { ButtonSize, ButtonVariant } from "./Button.types";

/**
 * What a `ButtonGroup` (a molecule) hands to the `Button`s and `IconButton`s inside it. Not exported from the
 * package: it lives beside the atoms that read it because an atom may not import from a molecule, and only
 * `ButtonGroup` provides it. Every field is a default — a button's own prop always wins — except `disabled`,
 * which disables the button when either the group or the button says so.
 */
export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
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
