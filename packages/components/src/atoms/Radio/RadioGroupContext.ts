import { createContext } from "react";

/**
 * Internal coordination signal between `Radio` (atom) and `RadioGroup`
 * (molecule, not yet built) — not part of either component's public API,
 * and not exported from the package barrel.
 *
 * `RadioGroup` will provide `true` around every `Radio` it renders, so each
 * one knows to participate in the real, shared Radix `RadioGroup.Root` that
 * `RadioGroup` owns, instead of wrapping a private one of its own. Defaults
 * to `false` — the correct behavior for a `Radio` used standalone, with no
 * `RadioGroup` ancestor at all.
 *
 * Mirrors the cross-tier context pattern already established between `List`
 * (molecule, owns `ListMarkerContext`) and `ListItem` (atom, reads it) per
 * ADR-0012 — here the ownership direction is inverted only because `Radio`
 * was built before `RadioGroup` exists; the ADR's own reasoning ("no lint
 * rule enforces tier-import direction") applies the same either way.
 */
export const RadioGroupContext = createContext(false);
