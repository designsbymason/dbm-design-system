import type { Responsive } from "@dbm-design-system/primitives";
import { createContext, useContext } from "react";
import type { AvatarShape, AvatarSize } from "./Avatar.types";

/**
 * What an `AvatarGroup` (a molecule) hands to the `Avatar`s inside it. Not exported from the package: it lives
 * beside the atom that reads it because an atom may not import from a molecule, and only `AvatarGroup` provides
 * it. Every field is a default — an avatar's own prop always wins.
 */
export interface AvatarGroupContextValue {
  size?: Responsive<AvatarSize>;
  shape?: AvatarShape;
  colorful?: boolean;
}

const AvatarGroupContext = createContext<AvatarGroupContextValue | null>(null);

export const AvatarGroupProvider = AvatarGroupContext.Provider;

/** The enclosing group's settings, or `null` outside one (so an avatar outside a group is exactly as it was). */
export function useAvatarGroup(): AvatarGroupContextValue | null {
  return useContext(AvatarGroupContext);
}
