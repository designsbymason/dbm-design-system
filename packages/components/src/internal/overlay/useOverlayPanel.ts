import { cx } from "@dbm-design-system/primitives";
import { useCallback, useMemo, useState } from "react";
import type { OverlayContentContextValue } from "./overlayContext";
import styles from "./OverlaySections.module.css";

/**
 * The state a modal panel keeps for its sections: how many titles and descriptions are mounted (Radix wires
 * `aria-labelledby`/`aria-describedby` to them by id, and reports a missing one, so a panel named only by
 * `aria-label` still needs something for it to point at, and one with no description must say so), which edges of
 * the body have content out of view, and the context the sections read.
 */
export function useOverlayPanel({ divided, busy }: { divided: boolean | "auto"; busy: boolean }) {
  const [titleCount, setTitleCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);
  const registerTitle = useCallback(() => {
    setTitleCount((count) => count + 1);
    return () => setTitleCount((count) => count - 1);
  }, []);
  const registerDescription = useCallback(() => {
    setDescriptionCount((count) => count + 1);
    return () => setDescriptionCount((count) => count - 1);
  }, []);

  // Which edges of the body have content out of view, reported by the body for `divided="auto"`.
  const [edges, setEdges] = useState({ start: false, end: false });
  const reportScroll = useCallback((next: { start: boolean; end: boolean }) => {
    setEdges((previous) => (previous.start === next.start && previous.end === next.end ? previous : next));
  }, []);

  const contentContext = useMemo<OverlayContentContextValue>(
    () => ({ registerTitle, registerDescription, busy, watchScroll: divided === "auto", reportScroll }),
    [registerTitle, registerDescription, busy, divided, reportScroll],
  );

  return { contentContext, titleCount, descriptionCount, edges };
}

/**
 * The `aria-describedby` to give a panel: the consumer's own when given, none at all when no description is
 * mounted (so Radix doesn't warn about a dangling reference), and otherwise Radix's own wiring (left out).
 */
export function describedByProps(
  ariaDescribedBy: string | undefined,
  descriptionCount: number,
): { "aria-describedby": string | undefined } | Record<string, never> {
  if (ariaDescribedBy !== undefined) return { "aria-describedby": ariaDescribedBy };
  if (descriptionCount === 0) return { "aria-describedby": undefined };
  return {};
}

/** The classes a panel takes for its sections: the lines between them, and room for the corner button. */
export function overlayPanelClassName({
  divided,
  showCloseButton,
}: {
  divided: boolean | "auto";
  showCloseButton: boolean;
}): string {
  return cx(divided === true && styles.divided, divided === "auto" && styles.dividedAuto, showCloseButton && styles.withCloseButton);
}

/** The class of the undrawn element every section sits in (and a kept-mounted panel moves in and out). */
export const overlaySlotClassName: string = styles.slot ?? "";

/** The class of the corner close button, and of the default (unstyled) trigger. */
export const overlayCloseButtonClassName: string = styles.closeButton ?? "";
export const overlayTriggerClassName: string = styles.trigger ?? "";
