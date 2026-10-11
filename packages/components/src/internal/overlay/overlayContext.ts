import { createContext } from "react";

/**
 * What a modal panel's sections read from the panel that holds them: the registration of a title and a
 * description (so the panel knows what names and describes it), whether it is busy, and whether the body should
 * report which of its edges have content out of view (for `divided="auto"`).
 */
export interface OverlayContentContextValue {
  registerTitle: () => () => void;
  registerDescription: () => () => void;
  busy: boolean;
  /** Whether the body should watch its scroll position and report which edges have content out of view. */
  watchScroll: boolean;
  reportScroll: (edges: { start: boolean; end: boolean }) => void;
}

export const OverlayContentContext = createContext<OverlayContentContextValue | null>(null);
