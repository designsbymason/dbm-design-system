/**
 * Docs-page-only "Design tokens used" row — a color swatch for color-
 * category tokens (`bg.*`/`text.*`/`border.*`/`icon.*`, resolved live via
 * the CSS custom property so it always matches the current theme). Non-
 * color tokens (space/radius/motion/font) render no swatch at all — a
 * reserved-but-empty swatch slot left visible whitespace to the left of
 * the token name (fixed 2026-07-27) — so those rows start flush left.
 * Not part of the published package.
 */
export function TokenRow({ token, usage }: { token: string; usage: string }) {
  const isColorToken = /^(bg|text|border|icon)\./.test(token);
  const cssVarName = `--dbm-${token.replace(/\./g, "-")}`;

  return (
    <div
      style={{
        alignItems: "center",
        borderBlockEnd: "1px solid var(--dbm-border-subtle)",
        display: "flex",
        gap: "var(--dbm-space-3)",
        paddingBlock: "var(--dbm-space-2)",
      }}
    >
      {isColorToken && (
        <span
          style={{
            background: `var(${cssVarName})`,
            border: "1px solid var(--dbm-border-default)",
            borderRadius: "var(--dbm-radius-sm)",
            flexShrink: 0,
            height: "1.25rem",
            width: "1.25rem",
          }}
        />
      )}
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
