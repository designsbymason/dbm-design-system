# 0018 — Accordion wraps Radix Accordion's own Content directly, not the Collapse atom

**Status:** Accepted · **Date:** 2026-09-17

## Context

Two prior documents both anticipated `Accordion` literally reusing the already-Finalized `Collapse`
atom for each item's expand/collapse animation: `04-component-inventory.md`'s own Layout row note
("wraps Radix Accordion + the already-Finalized Collapse atom") and, more specifically, `Collapse`'s
own component-level JSDoc ("the building block `Accordion` composes for each of its items").

Radix's `Accordion` and `Collapsible` (what `Collapse` wraps) are separate, independently-implemented
primitives that happen to use the same technique (a measured-height CSS custom property driving a
`slideDown`/`slideUp` keyframe animation) but don't share any code or context between them.
`AccordionPrimitive.Trigger`/`.Content` are tightly coupled to `AccordionPrimitive.Root`/`.Item`'s own
internal context (open-state tracking, id generation linking a trigger to its panel via
`aria-controls`/`aria-labelledby`, roving-tabindex keyboard navigation across triggers) — none of
which is publicly exported as a hook. Swapping Radix's own `Accordion.Content` for `Collapse` inside
an `Accordion.Item` would mean either (a) still using `Accordion.Trigger`, which requires the very
same Radix Item context that `Accordion.Content` also reads open-state from, making `Collapse`
redundant rather than a replacement, or (b) abandoning Radix's `Root`/`Item`/`Trigger` entirely and
re-deriving their open-state tracking, id-linking, and keyboard navigation by hand — directly against
[ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md)'s standing rule to lean on Radix for
interaction/accessibility logic rather than hand-roll it.

## Decision

`Accordion` wraps `@radix-ui/react-accordion`'s full compound primitive — `Root`, `Item`, `Header`
(folded into the exported `Accordion.Trigger`, not a separate sub-part — see the component's own
JSDoc), `Trigger`, and `Content` — end to end, the same way `Popover`/`Select` each wrap their own
Radix primitive fully rather than mixing in another primitive's pieces. `Accordion.Content`'s
expand/collapse animation reuses `Collapse.module.css`'s exact CSS technique (a `slideDown`/`slideUp`
keyframe pair driven by the primitive's own measured-height custom property), just written against
`--radix-accordion-content-height` instead of `--radix-collapsible-content-height` — the visual result
and the underlying technique are identical; only the literal Collapsible-vs-Accordion custom-property
name differs, since each Radix primitive exposes its own copy of the same mechanism, not a shared one.

## Alternatives considered

**Literal `<Collapse>` reuse inside `Accordion.Item`, as both prior documents assumed** — rejected per
the Context above: Radix's own `Trigger`/`Content` are a matched pair reading from the same Item
context, so using one without the other either duplicates work for no benefit or forces hand-rolling
the coupling `Collapse` can't provide on its own.

**Hand-roll `Accordion`'s open-state/id-linking/keyboard-nav to keep `Collapse` as the real content
renderer** — rejected: re-derives exactly the interaction/accessibility logic
[ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md) says to get from Radix instead,
for a worse (self-maintained, unverified against Radix's own accessibility testing) result.

## Consequences

- Corrects the plan in `04-component-inventory.md`'s Layout-adjacent Accordion row and in `Collapse`'s
  own component-level JSDoc, both written before this trade-off was actually worked through. `Collapse`
  is Finalized, so its own JSDoc correction needs explicit authorization before editing per
  `06-engineering-standards.md` §9's finalization rule, even though the fix is doc-only — flagged
  separately, not applied silently by this ADR.
- Standing precedent for any future molecule/organism wrapping a Radix compound primitive that has a
  content-animation equivalent to an existing DBM atom (none currently on the roadmap, but the same
  question could recur): prefer the wrapped primitive's own matching piece over swapping in this
  system's separately-built atom, when the primitive's internal context makes mixing the two
  infeasible without re-deriving state Radix already manages internally.
- No new runtime dependency category — `@radix-ui/react-accordion` is added the same way
  `@radix-ui/react-popover`/`@radix-ui/react-slider` were for their own molecules.

## Related

`04-component-inventory.md` — Overlay & Disclosure category, `Accordion` row (build-order note
corrected alongside this ADR).
`guidelines/component-reviews/Accordion.md` — the component's own build/review record.
[ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md) — the standing "Radix over hand-rolled
interaction logic" rule this decision follows.
[ADR-0013](0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) — names
`Accordion` as a future compound-heavy review this pattern might need to scale for; not hit yet with
three sub-parts (`Item`/`Trigger`/`Content`), each getting its own hidden docs-only stories file.
