import { createContext } from "react";

export interface HoverCardProviderControls {
  /**
   * Called when a card opens. The provider closes whichever other card is
   * open, so two cards are never on screen at once.
   */
  reportOpen: (id: string, close: () => void) => void;
  /** Called when a card closes (or unmounts while open). */
  reportClosed: (id: string) => void;
}

export interface HoverCardProviderValue {
  controls: HoverCardProviderControls;
  /** True while a card is open, and for `skipDelayDuration` after the last one closed. */
  isWarm: boolean;
  openDelay: number | undefined;
  closeDelay: number | undefined;
}

/**
 * Read by `HoverCard` to detect an ambient `HoverCardProvider`. `null` when
 * there is none, so a standalone `HoverCard` keeps working with zero setup.
 * `controls` is stable for the provider's life (an effect depends on it),
 * while `isWarm` changes as cards open and close.
 */
export const HoverCardProviderContext = createContext<HoverCardProviderValue | null>(null);
