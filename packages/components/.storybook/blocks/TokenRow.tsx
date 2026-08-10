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
        borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-subtle)",
        display: "flex",
        gap: "var(--dbm-space-3)",
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
      <code style={{ flexShrink: 0, minWidth: "11rem" }}>{token}</code>
      <span
        style={{
          color: "var(--dbm-text-tertiary)",
          fontSize: "var(--dbm-font-size-sm)",
        }}
      >
        {usage}
      </span>
    </div>
  );
}
