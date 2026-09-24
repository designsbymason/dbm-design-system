# 0024 — `Alert.Action`, a `Button` that reads the alert's colours, over tone and surface props on `Button` or unrestricted children

**Status:** Accepted · **Date:** 2026-09-24

## Context
`Button`'s colours are the brand's (`bg.brand`, `text.brand`, `border.brand`), with one red `destructive` variant. Placed in an `Alert`, they clash with the alert's tone on a subtle or outlined alert, and on a **solid** alert they all but disappear: measured for every tone, variant and brand, in light and dark, the brand button on a solid alert is 1.0–1.6:1 against it, against the 4.5:1 a label and 3:1 an edge need. The obvious fixes each pull a different way: give `Button` a `tone` and a "surface" prop; leave the children of `Alert.Actions` open and document the risk (which is what shipped first, with guidance to "choose a variant that reads"); or restrict them.

## Decision
Add **`Alert.Action`**: a compound part that renders `Button`, takes its **size** from the alert and its **colours** from the alert's tone and variant, and takes everything else `Button` takes except `variant` (here `primary` / `secondary` / `tertiary`) and `size`. `Button` itself is not changed.

- **How it looks** depends on the alert variant. On a `solid` alert the primary is an inverted fill (`bg.on-<tone>`) with the tone's own colour as its label, the secondary is outlined in `border.on-<tone>`, the tertiary is plain `text.on-<tone>`. On a `subtle` or `outlined` alert the primary is the tone's solid fill, and the secondary and tertiary have a neutral label. Neutral keeps a gray primary on subtle and outlined, and uses `text.secondary` for its inverted label (there is no `text.neutral`).
- **Colours are applied by CSS** in `Alert.module.css`, one selector deeper than `Button`'s own rules (which are one class deep, hover rules five selectors deep), reading the tone variables the alert already sets. The alert passes only its variant and size to its parts, through a small React context.
- **Ten new semantic tokens** — `bg.on-{info,success,warning,danger,neutral}` and `border.on-{…}` — hold the inverted fill and outline. Their values equal `text.on-<tone>` (white in light, the tone's 900 step in dark); they are separate so a component never uses a text token as a fill or a border, the same as `bg.brand` / `text.brand` / `border.brand`. Every pairing is one already verified for the alert itself, and a real-browser test measures every combination from the colours actually drawn, in light, dark and Emerald.
- **`Alert.Actions` stays open**: anything can go in it. Only an `Alert.Action` takes the alert's colours; the docs say so and say to check anything else.

## Alternatives considered
- **A `tone` prop and a "surface" prop on `Button`.** Rejected: `tone` alone makes `Button` a 6 × 5 matrix to design, measure and document, and does not fix a solid alert (an amber button on an amber alert vanishes); the surface prop makes every button responsible for knowing what it sits on, which the alert already knows. `Button` is also Finalized, and a new tone × variant axis is a large change to it for one container. Worth revisiting only if a second container needs it.
- **A context-aware `Button`** that adapts itself inside an alert (no new component). Rejected for now: it changes the internals of a Finalized atom and makes it depend on a container's context, and every consumer of `Button` would carry it.
- **Restricting what `Alert.Actions` accepts.** Rejected: React children are opaque, so it cannot be enforced, and "guidance over restriction" (`01-vision-and-goals.md` §8) argues against trying. The specific component is the guidance.
- **Documenting safe pairings only.** Rejected: it left a footgun that a screenshot found within a day.

## Consequences
Any container that draws its own coloured surface and hosts controls (a `Toast`, a toned `Card`, a page-level banner) has a pattern to follow: a part that wraps `Button` and reads the container's tone and variant, backed by tokens for controls on that surface, before anyone adds props to `Button`. `bg.on-*` and `border.on-*` are the tokens for a control on a solid tone surface. The cost is duplicated *intent* — `Alert.Action`'s colour rules restate a small part of `Button`'s — and the CSS-specificity coupling to `Button`'s class structure: a change to how `Button` writes its variant rules can break the overrides, which the contrast tests would catch.

## Related
[ADR-0023](0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md), `03-token-system-spec.md` (`bg.*`, `border.*`), `05-component-api-conventions.md` §2, `component-reviews/Alert.md`. `Button` is unchanged and stays Finalized.
