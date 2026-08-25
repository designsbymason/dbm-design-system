/**
 * Docs-page-only "Design tokens used" row — a color swatch for color-
 * category tokens (`bg.*`/`text.*`/`border.*`/`icon.*`, resolved live via
 * the CSS custom property so it always matches the current theme). Non-
 * color tokens (space/radius/motion/font) render an empty slot the exact
 * same dimensions as the swatch instead of skipping it (fixed 2026-08-10,
 * replacing an actually-omitted slot that left every non-color row's
 * token name flush against the container edge instead of lining up with
 * color rows' names one swatch-width over — confirmed via a live
 * side-by-side measurement, not assumed from the code alone) — so every
 * row's `<code>` starts at the same x position regardless of whether that
 * row has a swatch to show. Not part of the published package.
 */
export function TokenRow({ token, usage }: { token: string; usage: string }) {
  const isColorToken = /^(bg|text|border|icon)\./.test(token);
  const cssVarName = `--dbm-${token.replace(/\./g, "-")}`;

  return (
    <div
      style={{
        alignItems: "center",
        borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-neutral-subtle)",
        display: "flex",
        gap: "var(--dbm-space-3)",
        minWidth: 0,
        paddingBlock: "var(--dbm-space-2)",
      }}
    >
      <span
        style={{
          background: isColorToken ? `var(${cssVarName})` : "transparent",
          border: isColorToken
            ? "var(--dbm-border-width-1) solid var(--dbm-border-default)"
            : "var(--dbm-border-width-1) solid transparent",
          borderRadius: "var(--dbm-radius-sm)",
          flexShrink: 0,
          height: "var(--dbm-space-5)",
          width: "var(--dbm-space-5)",
        }}
      />
      {/* Fixed `width` (not a `maxWidth`/`minWidth` cap-or-floor) — every
          pill in this section is the same size regardless of its token's
          length, so the `usage` column lines up in a straight edge down
          the page (2026-08-24, per explicit design feedback: hugging
          short tokens read as "unbalanced" next to longer ones). Sized to
          fit the longest real semantic token across every `TokenRow`
          usage in the codebase, `motion.easing.emphasized` (Checkbox,
          Badge) at 24 characters, measured live via canvas
          `measureText` against this pill's own computed font/padding/
          border (`ui-monospace` @ 13.328px, 8px horizontal padding, 1px
          border, `box-sizing: border-box`): ~210.5px needed, rounded up
          to `13.5rem` (216px) for a small cross-platform font-metric
          safety margin. Component-layer/range tokens (e.g. IconButton's
          own `icon-button.size.xs–icon-button.size.xl`, Badge's
          `badge.size.xs–badge.size.xl`) are longer than this fixed width
          on purpose — `overflowWrap: "break-word"` lets those wrap
          *within* the pill (growing in height) rather than overflowing
          it, while `<code>` stays a direct flex item so it keeps CSS's
          flex-item "blockification" (confirmed live via
          `getComputedStyle`: a flex item's outer display computes to
          `block` regardless of how it's authored) — the one unified
          padded/bordered box that makes a wrap grow the pill's height
          cleanly, instead of a normal inline element's per-line-
          fragmented background (missing left padding + row overlap) that
          a wrapping span-wrapped `<code>` (tried and reverted
          2026-08-24) produced. `flexShrink: 0` keeps the fixed width
          fixed — without it, the default `flex-shrink: 1` lets the flex
          algorithm squeeze this item's content-based width down toward
          its break-word-enabled min-content size whenever the row is
          tight, which is also why an earlier `maxWidth`-only attempt
          (also 2026-08-24) still wrapped short tokens like `radius.sm`
          unnecessarily. */}
      <code
        style={{
          flexShrink: 0,
          overflowWrap: "break-word",
          width: "13.5rem",
        }}
      >
        {token}
      </code>
      {/* `overflowWrap: "break-word"` + `minWidth: 0` (2026-08-10) —
          several `usage` strings (e.g. "hover/focus/loading-state
          transitions") separate words with `/` rather than a space,
          which isn't a break opportunity by default. `overflow-wrap`
          alone didn't fix it: as a flex item, this span's default
          `min-width: auto` computes an "automatic minimum size" from its
          content that `overflow-wrap` is specifically excluded from —
          confirmed live (the rule applied, but the span still reported a
          width wider than its own flex row). `min-width: 0` is required
          alongside it for the break-word wrapping to actually take
          effect and let the span shrink on a narrow viewport instead of
          forcing the whole row wider. */}
      <span
        style={{
          color: "var(--dbm-text-tertiary)",
          fontSize: "var(--dbm-font-size-sm)",
          minWidth: 0,
          overflowWrap: "break-word",
        }}
      >
        {usage}
      </span>
    </div>
  );
}
