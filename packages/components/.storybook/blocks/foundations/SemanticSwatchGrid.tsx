export interface SemanticToken {
  /** Dot-notation token name, e.g. "bg.brand". */
  token: string;
  usage: string;
}

/**
 * Foundations-only semantic color grid — swatches driven by the live
 * `--dbm-{token}` CSS custom property (the same mechanism
 * `.storybook/blocks/TokenRow.tsx` uses for component docs pages), so
 * every swatch automatically reflects whichever brand/mode the toolbar
 * toggles are currently set to. Not part of the published package.
 */
export function SemanticSwatchGrid({ tokens }: { tokens: SemanticToken[] }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
      }}
    >
      {tokens.map(({ token, usage }) => {
        const cssVar = `--dbm-${token.replace(/\./g, "-")}`;
        return (
          <div
            key={token}
            style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}
          >
            <div
              style={{
                background: `var(${cssVar})`,
                border: "1px solid var(--dbm-border-subtle)",
                borderRadius: "var(--dbm-radius-md)",
                height: "3rem",
              }}
            />
            <code style={{ fontSize: "var(--dbm-font-size-xs)" }}>{token}</code>
            <div
              style={{
                color: "var(--dbm-text-tertiary)",
                fontSize: "var(--dbm-font-size-xs)",
                lineHeight: "var(--dbm-line-height-snug)",
              }}
            >
              {usage}
            </div>
          </div>
        );
      })}
    </div>
  );
}
