# Architecture Decision Records

Short, immutable records of *why* a real architectural or API decision was made — not a changelog, not a debugging log, not a place to narrate how a bug was found and fixed. The numbered docs in `guidelines/` (`01`–`07`) are the current-state reference (what's true right now); an ADR is the "why" behind a specific fork-in-the-road decision, kept separate so the numbered docs can stay short and scannable instead of carrying the full reasoning inline.

See `CLAUDE.md`'s own note on this split before adding either kind of entry.

## When something earns an ADR

A real fork in the road — a choice between genuine alternatives where the reasoning would otherwise get re-derived or re-litigated — or a decision that constrains how future components must be built (a pattern every future component of that kind now has to follow).

**Not every decision qualifies.** A bug fix, a verification pass, a debugging dead-end, a copy tweak, an intermediate wrong turn — none of these get a permanent record anywhere; they belong in the commit that made the change. Recreating the same narrative bloat here that this folder exists to get *out* of the numbered docs defeats the point.

## Naming

`NNNN-short-kebab-title.md` — sequential, zero-padded to 4 digits, numbered in the order written. A number is never reused or reassigned, even if the ADR it belonged to is later superseded.

## Immutability

Once written, an ADR's Context/Decision/Alternatives/Consequences don't get rewritten in place. If a decision later changes, write a **new** ADR that supersedes the old one — update only the old one's `Status` line to point at the new one. This is the whole point of the format: history stays as a sequence of clean, dated files instead of one file accumulating "note (superseded ...): this reasoning no longer applies" corrections stacked on corrections.

## Template

```markdown
# NNNN — <Decision, phrased as a choice: "X over Y">

**Status:** Accepted · **Date:** YYYY-MM-DD

## Context
The problem or conflict that forced this decision.

## Decision
What was decided, stated plainly.

## Alternatives considered
What was rejected, and why. Usually the most useful section for a future reader.

## Consequences
What this enables, what it costs, what it constrains going forward.

## Related
Pointers to the relevant `guidelines/*.md` section and affected component(s).
```

A superseded ADR's `Status` line becomes: `Status: Superseded by [NNNN](./NNNN-new-title.md) · Date: YYYY-MM-DD` — the rest of the file stays as originally written, unedited.

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-avatar-keeps-hand-rolled-image-state-machine.md) | Avatar keeps its own hand-rolled image-load state machine over `@radix-ui/react-avatar` | Accepted |
| [0002](./0002-aa-contrast-floor-aaa-target-for-error-text.md) | WCAG AA is the enforced contrast floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only | Accepted |
| [0003](./0003-a11y-panel-gated-behind-addon-vitest.md) | Storybook's Accessibility addon panel requires `@storybook/addon-vitest`, not just `@storybook/addon-a11y` | Accepted |
| [0004](./0004-radix-ui-primitives-for-accessibility-logic.md) | Radix UI Primitives for accessibility/interaction logic, not hand-rolled | Accepted |
| [0005](./0005-dark-mode-light-fill-dark-text-pattern.md) | Dark-mode solid fills use a light tone-appropriate fill paired with dark text, not a mid-tone fill paired with white text | Accepted |
| [0006](./0006-functional-categories-over-atomic-tier-navigation.md) | Organize the component inventory by functional category, not atomic-design tier | Accepted |
| [0007](./0007-as-vs-aschild-by-content-source.md) | `as` vs. `asChild`: pick based on where the component's visual content comes from | Accepted |
| [0008](./0008-closebutton-reserved-for-modal-surfaces.md) | `CloseButton` is reserved for modal-style overlay surfaces; tone-varying components get their own local remove control | Accepted |
| [0009](./0009-rtl-mirroring-is-a-per-component-judgment-call.md) | Whether a component's rendered result mirrors under RTL is a separate, per-component judgment call | Accepted |

*(Extracted from `01-vision-and-goals.md`/`02-tech-stack-and-structure.md`/`03-token-system-spec.md`/`04-component-inventory.md`/`05-component-api-conventions.md`/`06-engineering-standards.md` during the guidelines retrofit pass, 2026-08-31 — more get added the same way, file by file, as the retrofit continues.)*

## This folder is public and permanent

Same rule as the rest of `guidelines/` (see its own `README.md`): the repo is public and git history doesn't forget. Never record secrets, credentials, personal identifying information, or client/business-sensitive details in an ADR.
