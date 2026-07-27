/**
 * Docs-page-only "Design tokens used" row — a color swatch for color-
 * category tokens (`bg.*`/`text.*`/`border.*`/`icon.*`, resolved live via
 * the CSS custom property so it always matches the current theme), or a
 * blank-space placeholder for non-color tokens (space/radius/motion/font),
 * where a colored square wouldn't mean anything. Not part of the published
 * package.
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
      <span
        style={{
          background: isColorToken ? `var(${cssVarName})` : "transparent",
          border: isColorToken
            ? "1px solid var(--dbm-border-default)"
            : "none",
          borderRadius: "var(--dbm-radius-sm)",
          flexShrink: 0,
          height: "1.25rem",
          width: "1.25rem",
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
