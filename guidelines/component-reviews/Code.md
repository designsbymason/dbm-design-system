# Code

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-06

## Review pass (2026-09-06)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `Code.stories.tsx` previously had only three static stories
   (`Default`, `Within body text`, `Inherits surrounding font size`); now has a full interactive
   `Playground` with every prop wired through `args`/`argTypes`.

2. **`children` prop had no JSDoc at all** — fixed, now documented in `Code.types.ts`.

3. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `Code.types.ts` with
   their own JSDoc (previously only worked structurally via the native
   `ComponentPropsWithoutRef<"code">` extension, invisible to the Properties table per the
   confirmed Button/Box docgen gap). `<code>` has no non-global HTML-specific attributes beyond
   these, so no further native-prop audit gap existed (unlike Blockquote's `cite`).

4. **`argTypes` added** to the stories file for every prop, with real descriptions and appropriate
   controls.

5. **Real design-quality gap, found and fixed: zero vertical padding.** Computed live in the
   browser before the fix: `padding-block: 0px / 0px` — only 4px horizontal padding was applied,
   giving the pill a visually flat, cramped look. GitHub, Notion, MDN, and other comparable
   inline-code implementations all pad inline code in both directions. **Fixed as part of finding 7 below** (the
   token-consumer switch already brings its own, already-established padding values).

6. **Unit tests extended**: added coverage for `style`/`id`/`data-testid` passthrough. 7/7 passing
   (up from 6).

7. **Token-consumer switch, at explicit direction: adopted `bg.code`/`border.code` instead of
   `bg.neutral-subtle`.** These tokens existed since 2026-08-08 specifically for "inline
   code/token-reference pills," but were explicitly documented as "Storybook-docs-only — not
   consumed by the shipped Code atom," used only by `docs.css`'s own MDX-prose code-pill styling.
   Adopted the full matching visual treatment from that existing, already-proven rule
   (`.sbdocs-content code` in `docs.css`) rather than inventing a new one: `bg.code` (background),
   `border.code` (1px border — byte-identical to `bg.code` in dark mode at the time, an intentional
   flat/borderless look there — no longer true after the 2026-09-06 darker-dark-mode retuning pass
   moved `bg.code` off the value the two tokens briefly shared; see below), `radius.sm` (was
   `radius.xs`), `text.secondary` (was `text.primary` — switched to reuse the pairing already
   contrast-verified specifically against `bg.code`, 5.10:1 dark at the time (now 7.47:1 — see
   below), rather than assume `text.primary` would also pass against the new background),
   `font-weight.medium` (new), `padding-block: space.1` / `padding-inline: space.2`
   (was `space.1` horizontal only, `0` vertical — this is what resolves finding 5 above). Net
   effect: the real shipped `Code` atom and the Storybook-docs inline-code pill now look
   identical, rather than two different "code" treatments existing in the same design system.
   `font-size: inherit` was deliberately left untouched — that's Code's own, separately-tested
   design decision (inheriting the surrounding text's size rather than a fixed size), orthogonal
   to which background/border/text tokens it uses.
   - **New light-mode contrast pairing verified, not assumed:** `text.secondary` (gray.700) vs
     `bg.code` (blue.50) = **6.57:1**, computed directly (hex-to-luminance, not eyeballed) since
     `03-token-system-spec.md` had this cell as an unverified "—" (only the dark pairing, 5.10:1,
     had been measured before, for the Storybook-docs use case only).
   - **Guideline updates:** `bg.code`'s and `border.code`'s own `$description` in all 4 semantic
     theme files updated to note Code.tsx as a real consumer (previously said "not currently
     consumed by any published component"). `03-token-system-spec.md`'s own `bg.*`/`border.*`
     tables updated to match — the `bg.code` row now carries the newly-verified 6.57:1 light-mode
     figure instead of a dash.

   - **Post-finalization update (2026-09-06, same day, at explicit direction):** a separate
     darker-dark-mode token retuning pass moved `bg.code` from `gray.700` to `gray.800` in dark
     mode, then (after `border.code` briefly followed to stay byte-identical) moved `border.code`
     back to `gray.700` deliberately — so the dark-mode pill now has a real, intentional border
     (1.46:1 apart) rather than the flat/borderless look described above when this review was
     written. `text.secondary` vs `bg.code` dark also moved from 5.10:1 to 7.47:1 as a result. This
     was a token-layer change, not a re-opening of this component's own review — see
     `guidelines/03-token-system-spec.md`'s `bg.*`/`border.*` intro note and each token's own
     `$description` for the full history.

8. **Feature-completeness:** some comparable component libraries ship a `variant` scale
   (subtle/solid/outline) or `variant`/`color`/`size` combination for their own inline-code
   component — flagged and discussed; **decided to leave Code as a single fixed treatment**,
   matching GitHub/Notion/MDN's own inline code (none of which offer variants either) — the more
   directly comparable precedent for a single-purpose inline-code atom specifically, versus a
   broader decorative-UI-kit framing of the same concept.

9. **Docs page added** (`Code.mdx`), full 10-section template, first in the sidebar group.
   Live-verified: TOC renders all 10 section headings, Properties table renders all 5 props in
   the declared order with non-empty descriptions, all 4 story canvases render real content
   (including the inline-prose pill now visually matching the Storybook-docs one it's paired
   with), both `RelatedCard`s (`Text`, `Kbd` — linked via their own `--default` story since
   neither has a Docs page yet, matching the established fallback pattern from `Input.mdx`) render
   live previews with correct links, zero console errors.

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint`, full `vitest` unit suite (972/972 passing across
the whole package), `tsup` build, `check-foundations-token-coverage` (no new tokens — still in
sync), and `check-component-bundle-size` (0.19KB JS / 0.18KB CSS gzipped — trivial, nowhere near
budget) all run and passing. Live-verified in Storybook: both brand themes × both modes (bg.code/
border.code/text.secondary are brand-agnostic, so appearance is identical Purple vs. Emerald,
confirmed rather than assumed), computed padding/radius/color/border values all matched the
intended token values exactly, dark-mode flat/borderless treatment confirmed at the time (border
byte-identical to background — since superseded, see the post-finalization update above), Playground
controls actually driving the canvas, Docs page rendering end to end.

## Finalized

**2026-09-06** — confirmed by the user after the full checklist was verified end to end: baseline
correctness, feature-completeness (variant scale discussed and deliberately declined), accessibility
(jest-axe zero violations), responsiveness, design quality (vertical padding fixed, token-consumer
switch to bg.code/border.code), theming (both brand themes × both modes — brand-agnostic tokens,
confirmed identical rather than assumed), Storybook documentation (Docs page, Properties table,
Design Tokens table all consistent), and functional verification (`tsc`, `eslint`, full 972-test
suite, `tsup` build all clean). No further changes without asking first, per
`06-engineering-standards.md` §9's finalization rule.
