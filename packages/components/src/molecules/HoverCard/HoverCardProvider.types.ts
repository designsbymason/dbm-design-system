import type { ReactNode } from "react";

export interface HoverCardProviderProps {
  /** The subtree whose `HoverCard`s should share timing. */
  children?: ReactNode;
  /**
   * Milliseconds before a card opens, for every `HoverCard` below that
   * doesn't set its own `openDelay`. Doesn't apply while the provider is
   * "warm" (see `skipDelayDuration`) — then a card opens at once.
   * @default 300
   */
  openDelay?: number;
  /**
   * Milliseconds a card stays open after the pointer or focus leaves, for
   * every `HoverCard` below that doesn't set its own `closeDelay`.
   * @default 300
   */
  closeDelay?: number;
  /**
   * How long, in milliseconds, the provider stays "warm" after the last card
   * closes. While one card is open, or within this window after it closed,
   * the next card opens immediately instead of waiting out `openDelay` — so
   * moving along a row of mentions or a table of names reads as one
   * continuous preview. Set `0` to wait on every card.
   * @default 300
   */
  skipDelayDuration?: number;
}
