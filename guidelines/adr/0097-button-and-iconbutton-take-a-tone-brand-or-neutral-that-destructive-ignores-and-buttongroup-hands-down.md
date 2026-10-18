# 0097 — `Button` and `IconButton` take a `tone` (`brand` or `neutral`) that `destructive` ignores, and `ButtonGroup` hands it down

**Status:** Accepted · **Date:** 2026-10-18

## Context
Every `Button` and `IconButton` variant but `destructive` was drawn in the brand colour, so a quiet control in a bar or a toolbar (a menu button, a cancel beside a primary action) could not be grey. Other components already vary colour with a `tone` prop (`Card`, `Stat`, `Tag`), and the semantic layer has a full neutral family (`bg.neutral`, `bg.neutral-hover`, `bg.neutral-subtle`, `bg.neutral-subtle-hover`, `border.neutral-strong`, `text.on-neutral`, `icon.on-neutral`), so no new token is needed.

## Decision
- **`Button` and `IconButton` take `tone?: "brand" | "neutral"`, default `"brand"`**, shared as `ButtonTone`. It sits after `variant` in the prop order.
- **`destructive` ignores it** and stays danger-coloured: a neutral destructive action would hide what the control does. The JSDoc says so; there is no warning.
- **The neutral mapping**, per variant (`Button` text / `IconButton` icon):

  | Variant | Rest | Hover | Label / icon | Border |
  |---|---|---|---|---|
  | `primary` | `bg.neutral` | `bg.neutral-hover` | `text.on-neutral` / `icon.on-neutral` | none |
  | `secondary` | transparent | `bg.neutral-subtle-hover` | `text.secondary` / `icon.default` | `border.neutral-strong` |
  | `tertiary` | transparent | `bg.neutral-subtle-hover` | `text.secondary` / `icon.default` | none |
  | `ghost` | `bg.neutral-subtle` | `bg.neutral-subtle-hover` | `text.secondary` / `icon.default` | none |

  An `IconButton` toggle's pressed state follows the brand pattern in neutral tokens: `primary` pressed goes to `bg.neutral-subtle` with `icon.default`, the other three to `bg.neutral` with `icon.on-neutral`.
- **No new tokens.** There is no `text.neutral` or `icon.neutral` semantic token; `text.secondary` and `icon.default` are the neutral text and icon greys, and they meet the contrast the pairings need in all four themes (Purple and Emerald, light and dark).
- **The `secondary` outline is `border.neutral-strong`, not `border.neutral`.** `border.neutral` is 2.3:1 on the light surface, under the 3:1 a control's boundary needs; `border.neutral-strong` is 4.7:1 light and 6.1:1 dark.
- **`ButtonGroup` takes `tone` as a default for its buttons**, as it does `variant`, `size` and `rounded` (a button's own prop wins; an inner group keeps what it leaves out from the outer one). A `Button` or `IconButton` in a group that is neutral carries `data-tone="neutral"`, so an attached group draws its `tertiary` separator in `border.neutral-subtle` and its `ghost` one in `border.neutral`; the solid and `secondary` separators are neutral already.

## Alternatives considered
- **A `neutral` variant.** Rejected: it would be a sixth style on a scale that means emphasis, and each of the four emphasis levels would then need a neutral twin as a variant name.
- **New `text.neutral` and `icon.neutral` tokens.** Rejected: they would be aliases of `text.secondary` and `icon.default` with no visual change.
- **A type that rejects `tone` on `destructive`.** Rejected: a group's `tone` has to be allowed to reach a destructive button inside it and be ignored there.
- **Colouring the demo's buttons with an override only.** Rejected: every app that wants a quiet bar would write the same override.

## Consequences
- `Button`, `IconButton` and `ButtonGroup` gain one optional prop each; nothing changes for code that doesn't set it. Both atoms stay as they were reviewed: this is additive (`06-engineering-standards.md` §9, question 1).
- `Navbar.MenuButton` and `Navbar.Search` don't pass `tone` through yet; that is a follow-up for the bar. *(Amended 2026-10-18: done. `Navbar.MenuButton` takes `tone` and `Navbar.Search` a `buttonTone`, as they take `variant` and `buttonVariant`.)*
- A neutral `secondary` outline is darker than the brand one is faint, by design: it is the boundary of the control.

## Related
`03-token-system-spec.md` (contrast method), `05-component-api-conventions.md`, ADR-0025; `component-reviews/Button.md`, `IconButton.md`, `ButtonGroup.md`.
