import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HoverCardProviderContext } from "./HoverCardProviderContext";
import type { HoverCardProviderControls } from "./HoverCardProviderContext";
import type { HoverCardProviderProps } from "./HoverCardProvider.types";

/**
 * Wraps a subtree so every `HoverCard` inside it shares one timing instead
 * of each managing its own. Optional — a standalone `HoverCard` works with
 * zero setup. It matters once a page has a run of triggers (mentions in a
 * paragraph, names in a table): without it, each card waits out its full
 * `openDelay` even though the reader was just looking at the previous one.
 * With it, a card opens at once while another is open or has just closed
 * (`skipDelayDuration`), and only one card is ever open at a time.
 *
 * Also sets the default `openDelay` and `closeDelay` for the cards below it.
 * A card's own props win. Place it once, as high as makes sense for the
 * cards that should share timing.
 *
 * @example
 * ```tsx
 * <HoverCardProvider openDelay={400}>
 *   <p>
 *     <HoverCard>…@jane…</HoverCard> and <HoverCard>…@sam…</HoverCard>
 *   </p>
 * </HoverCardProvider>
 * ```
 */
export function HoverCardProvider({
  children,
  openDelay,
  closeDelay,
  skipDelayDuration = 300,
}: HoverCardProviderProps) {
  const [isWarm, setIsWarm] = useState(false);
  const openCard = useRef<{ id: string; close: () => void } | null>(null);
  const coolDownTimer = useRef<number | undefined>(undefined);
  // Read inside `reportClosed`, which has to stay the same function for the
  // provider's whole life: an open card's effect depends on it.
  const skipDelayRef = useRef(skipDelayDuration);
  useEffect(() => {
    skipDelayRef.current = skipDelayDuration;
  }, [skipDelayDuration]);

  const reportOpen = useCallback((id: string, close: () => void) => {
    window.clearTimeout(coolDownTimer.current);
    const previous = openCard.current;
    openCard.current = { id, close };
    setIsWarm(true);
    if (previous && previous.id !== id) previous.close();
  }, []);

  const reportClosed = useCallback((id: string) => {
    if (openCard.current?.id !== id) return;
    openCard.current = null;
    window.clearTimeout(coolDownTimer.current);
    coolDownTimer.current = window.setTimeout(() => setIsWarm(false), skipDelayRef.current);
  }, []);

  useEffect(() => () => window.clearTimeout(coolDownTimer.current), []);

  const controls = useMemo<HoverCardProviderControls>(() => ({ reportOpen, reportClosed }), [reportOpen, reportClosed]);
  const value = useMemo(
    () => ({ controls, isWarm, openDelay, closeDelay }),
    [controls, isWarm, openDelay, closeDelay],
  );

  return <HoverCardProviderContext.Provider value={value}>{children}</HoverCardProviderContext.Provider>;
}
