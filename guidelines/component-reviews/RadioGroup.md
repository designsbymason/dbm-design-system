# RadioGroup — Storybook/component review findings

**Inputs & Forms:** RadioGroup — initial build + full `06-engineering-standards.md` §9 review pass
complete (2026-09-14), the second item in the itemized molecule-tier build order
(`04-component-inventory.md`), immediately after `Radio` (its own prerequisite atom, Finalized the
same session).

**Architecture: exactly the design [ADR-0014](../adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md)
anticipated.** `RadioGroup` wraps Radix's real `RadioGroupPrimitive.Root` and provides
`RadioGroupContext` (imported cross-tier from `../../atoms/Radio/RadioGroupContext`, the same
inverted-ownership pattern ADR-0012 already blessed for `List`/`ListItem`) as `true` around its
`children` — every `Radio` composed inside then participates in this real, shared group instead of
self-wrapping its own private one. No new coordination code needed on `Radio`'s side; the context
signal was built for exactly this during `Radio`'s own review.

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable. `RadioGroup` composes plain
  `Radio` atoms as ordinary `children` (mirroring `List`/`ListItem`'s shape), not a dot-notation
  compound pattern (`RadioGroup.Item`) — there's no sub-part of `RadioGroup`'s own to check.
- **Atom-reuse audit** — `RadioGroup` renders no radio-option markup of its own at all; every
  option is a real, consumer-supplied `Radio`. Nothing to reimplement.
- **Consumed-atom defect handling** — none found. All 27 tests passed on the first run; `Radio`'s
  grouped-mode behavior worked exactly as designed with no follow-up fix needed on either side.
- **Radix-primitive prop audit** — every `RadioGroup.Root` prop from Radix's own real API (read
  from source during `Radio`'s own build: `name`, `form`, `required`, `disabled`, `orientation`,
  `dir`, `loop`, `value`, `defaultValue`, `onValueChange`) is redeclared on `RadioGroupProps` with
  full JSDoc, using `dir?: "ltr" | "rtl"` matching `Select`'s own established naming precedent
  rather than inventing a new `rtl: boolean` (caught and corrected during the build itself, not
  after).
- **Cross-part ARIA/id wiring** — not applicable in the sense `FormField` will need later
  (composing a label/control/helper-text triplet with auto-wired ids); `RadioGroup` composes
  multiple same-type `Radio` options, not distinct labeled parts. The group's own accessible name
  is left to the consumer (`aria-label`, or `aria-labelledby` pointing at a nearby `FieldLabel`),
  matching Radix's own unopinionated Root (no auto-rendered legend).
- **Composed tab order** — real roving-tabindex verified: `Tab` reaches only the checked (or
  first) option, arrow keys move focus *and* selection between the rest, `loop` (default `true`)
  wraps from last back to first — all covered by dedicated tests and a live interaction story,
  not just reasoned about.

**Layout: `RadioGroup` owns the gap between options**, not left to the consumer to hand-supply
(matching `List`'s own "container owns shared layout" role) — `space.2` vertical (the default
`orientation`), `space.2`/`space.4` row-gap/column-gap horizontal (wrapping via `flex-wrap` for
narrow viewports, so a long horizontal option set degrades to multiple rows rather than
overflowing).

**`hasError` is purely semantic (`aria-invalid` on the group), no visual treatment** — unlike
`Input`/`Textarea`/`Checkbox`/`Radio`, a bare `RadioGroup` has no bordered box of its own for a red
outline to live on; the visual error communication is expected to come from a paired `FieldError`
(future `FormField` territory), not a new box-drawing convention invented here without precedent.

**Named, concrete gap — flagged, then authorized and built (user-directed, 2026-09-14):** a
`size`-cascade feature (`<RadioGroup size="sm">` setting every child `Radio`'s size at once,
instead of repeating `size` on each one) was flagged rather than built during the initial pass,
since it meant editing the already-Finalized `Radio.tsx`. User confirmed, live in the Playground,
that per-`Radio` sizing was the only option without it, then authorized the change. Implemented via
a new, separate `RadioGroupSizeContext` (`RadioSize | undefined`, default `undefined`) — kept apart
from the existing `RadioGroupContext` boolean signal rather than changing that one's shape, so its
already-tested contract stays untouched. `RadioGroup` provides its own `size` prop through this
context; `Radio` resolves `size ?? inheritedSize ?? "md"`, so an explicit `size` on either side still
wins in the expected order and the fallback (`"md"`) is unchanged for every case that existed
before this feature. Added a dedicated `size` argType/control, a new `SizeCascade` variant story
(group-level size plus a per-item override, both visibly distinct), and `RadioGroup.mdx` updated
(`propOrder`, intro paragraph, Best practices, Code examples) to match. Full three-question
finalization test applied to `Radio` (`06-engineering-standards.md` §9) — see
[Radio.md](Radio.md)'s own entry; **`Radio` stays Finalized**, purely additive.

Self-verification, both components, all real runs: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` project (1569/1569 whole package; `Radio` 41/41, `RadioGroup`
30/30) and `storybook` browser-mode project (400/400), `tsup` build, `check-component-bundle-size`
(`Radio` 1.09KB JS / 0.59KB CSS, `RadioGroup` 0.67KB JS / 0.15KB CSS, both still within budget).
Live-verified: the `SizeCascade` story (three visibly distinct sizes, zero Accessibility-panel
violations, both Light and Dark) and the Playground's own live `size` control actually resizing the
canvas in real time.

**Self-verification, whole package, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1561/1561 passed (27 for `RadioGroup` itself)
- Vitest `storybook` (browser-mode play-function/a11y) project: 399/399 passed
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: RadioGroup 0.64KB JS / 0.11KB CSS gzipped, within budget, in line
  with peer lightweight molecules (`Grid`)
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all 10 sections, Playground live,
  Properties table), `Vertical vs. horizontal`/`States`/`Controlled, with a live selection summary`
  variant galleries, all three interaction stories (click-to-select, arrow-key navigation +
  Space-to-select, disabled-blocks-every-option) replayed and confirmed `PASS`, zero
  Accessibility-panel violations across every story checked, all 4 themes (Purple/Emerald ×
  Light/Dark) — checked-state fill/border/dot colors and layout both orientations read correctly in
  every combination, mutual exclusivity and the controlled live-summary both confirmed by clicking
- Confirmed sidebar placement: **Molecules → Inputs → RadioGroup**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Post-review fix (user-reported, 2026-09-14): `States` story had a visual duplicate and a missing
real state.** Two real gaps in the same story, found by direct question rather than by this review's
own pass: (1) the "Error state" row rendered pixel-identical to "Default" — `hasError` only sets
`aria-invalid` on `RadioGroup` (no CSS hook applies any visual treatment, by the same deliberate
"no bordered box to color" reasoning documented above), so showing it alone in a *visual* states
gallery demonstrated nothing. Fixed by pairing that row with a real `FieldError` underneath — which
is also the actual documented, correct real-world usage (this component's own Usage guidelines
already say to pair `hasError` with `FieldError`), not just a workaround to make the row look
different. (2) No row showed the group with nothing selected at all — every row set
`defaultValue="email"`. Added a "No selection" row. Confirmed live (5 visually distinct rows now,
zero Accessibility-panel violations) and via a full re-run: `tsc`, `eslint`, both Vitest projects
(`unit`: 1561/1561, `storybook`: 399/399) all clean.

**Design decision (user-directed, 2026-09-14): `hasError` gained a real visual treatment — a
colored left-border accent.** Follow-up to the `States`-story fix above: live-testing the Playground
surfaced that toggling `hasError` alone (no paired `FieldError` in that story) produced zero visible
feedback, reading as broken rather than "semantic-only by design." Presented three options
(a full visual treatment built into the real component; semantic-only with a `FieldError` paired
into the Playground too; documentation-only) — user chose the real component treatment, then asked
specifically whether it would be a Storybook-only skin or shipped in the actual package (confirmed:
the latter — Storybook only ever renders the real, shipped component). Presented five concrete
options grounded in general accessible-forms/enterprise-UI practice for flagging a *group* of
controls (no bounded box to color, unlike `Input`): a left-border accent, a full bounding border
(with a real layout-shift trade-off), a background wash, an outline (avoids that trade-off), and
cascading `hasError` to each child `Radio`'s own already-existing error ring (blocked by the same
Finalized-`Radio`-authorization issue as the `size`-cascade gap noted above). **User chose the
left-border accent** — real, direct precedent already in this codebase (`Blockquote`'s own
`border-width.4` + `space.4` inline-start pairing), mirrored here with `border.danger` in place of
`border.brand`. No new tokens needed; `border.danger` against `bg.surface` was already
AA-contrast-verified for this exact pairing. `RadioGroup.types.ts`'s `hasError` JSDoc,
`RadioGroup.mdx`'s Accessibility callout, and its Design tokens used section all updated to match.
Confirmed live: toggling `hasError` in the Playground now shows the accent immediately (no paired
`FieldError` needed to see *some* feedback, though one is still recommended for the full message);
the `States` story's error row now shows the accent *and* the `FieldError` together; zero
Accessibility-panel violations; `border.danger` renders correctly (and stays brand-agnostic red, by
design) across all 4 themes. Full re-run: `tsc` (package + `.storybook`), `eslint`, both Vitest
projects (`unit`: 1561/1561, `storybook`: 399/399), `tsup` build, `check-component-bundle-size`
(RadioGroup 0.65KB JS / 0.15KB CSS gzipped, still within budget) — all clean.

**Not yet Finalized** — awaiting explicit confirmation per `06-engineering-standards.md` §9's
reporting convention.
