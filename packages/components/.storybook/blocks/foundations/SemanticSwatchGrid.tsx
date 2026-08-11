import { DocsContext } from "@storybook/addon-docs/blocks";
import { useContext } from "react";
import { LinkIcon } from "@dbm-design-system/icons";
import { emeraldDark, emeraldLight, primitives, purpleDark, purpleLight } from "@dbm-design-system/tokens";
import { Icon } from "../../../src/atoms/Icon";
import type { SemanticTokens } from "../../theme";
import { useThemeGlobals } from "./useThemeGlobals";

export interface SemanticToken {
  /** Dot-notation token name, e.g. "bg.brand". */
  token: string;
  usage: string;
}

type Brand = "purple" | "emerald";
type Mode = "light" | "dark";

const SEMANTIC_TOKENS: Record<Brand, Record<Mode, SemanticTokens>> = {
  purple: { light: purpleLight, dark: purpleDark },
  emerald: { light: emeraldLight, dark: emeraldDark },
};

const BRANDS: Brand[] = ["purple", "emerald"];
const MODES: Mode[] = ["light", "dark"];
// See the matching note in `theme.ts` — `noUncheckedIndexedAccess` types
// `BRANDS[0]`/`MODES[0]` as possibly `undefined`, so an explicit default is
// used instead of indexing into the array.
const DEFAULT_BRAND: Brand = "purple";
const DEFAULT_MODE: Mode = "light";

/**
 * hex → dotted primitive name (e.g. "#fafafb" → "color.gray.50"), built
 * once from `primitives.color` rather than hand-maintained — every
 * semantic token's resolved value traces back to exactly one of these
 * (confirmed no two primitive steps share a hex, so the reverse lookup is
 * unambiguous). Covers both the 7 scaled families (50–950) and the fixed
 * `neutral.white`/`neutral.black` pair, which — like every other family —
 * is itself a step map (`{ white: "...", black: "..." }`), not a bare
 * string; there is no top-level family in `primitives.color` whose value
 * is a plain string, so a single loop shape (nested `Object.entries`)
 * covers every family, `neutral` included, uniformly.
 */
const PRIMITIVE_BY_HEX: Record<string, string> = {};
for (const [family, steps] of Object.entries(primitives.color)) {
  for (const [step, hex] of Object.entries(steps)) {
    PRIMITIVE_BY_HEX[hex.toLowerCase()] = `color.${family}.${step}`;
  }
}

function resolvePrimitiveName(token: string, brand: Brand, mode: Mode): string {
  const [category, field] = token.split(".") as [keyof SemanticTokens, string];
  const categoryTokens = SEMANTIC_TOKENS[brand][mode][category] as Record<string, string> | undefined;
  const hex = categoryTokens?.[field];
  if (!hex) return "—";
  return PRIMITIVE_BY_HEX[hex.toLowerCase()] ?? hex;
}

/**
 * Foundations-only semantic color grid — swatches driven by the live
 * `--dbm-{token}` CSS custom property (the same mechanism
 * `.storybook/blocks/TokenRow.tsx` uses for component docs pages), so
 * every swatch automatically reflects whichever brand/mode the toolbar
 * toggles are currently set to. The primitive-name caption underneath
 * (e.g. "color.gray.50") is resolved separately, in plain JS, from the
 * same `purpleLight`/`purpleDark`/`emeraldLight`/`emeraldDark` resolved
 * hex maps `.storybook/theme.ts` uses for the manager chrome — the CSS
 * custom property alone only carries a color, not which primitive step it
 * came from, so a live brand/mode read via `useThemeGlobals` (the same
 * hook `ThemeSync` uses) plus a hex→primitive reverse lookup is the only
 * way to keep this caption in sync with the toolbar too. Not part of the
 * published package.
 */
export function SemanticSwatchGrid({ tokens }: { tokens: SemanticToken[] }) {
  const context = useContext(DocsContext);
  const globals = useThemeGlobals(context);
  const brand = BRANDS.includes(globals.brand as Brand) ? (globals.brand as Brand) : DEFAULT_BRAND;
  const mode = MODES.includes(globals.mode as Mode) ? (globals.mode as Mode) : DEFAULT_MODE;

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
        const primitiveName = resolvePrimitiveName(token, brand, mode);
        return (
          <div
            key={token}
            style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-1)" }}
          >
            <div
              style={{
                background: `var(${cssVar})`,
                border: "var(--dbm-border-width-1) solid var(--dbm-border-subtle)",
                borderRadius: "var(--dbm-radius-md)",
                height: "var(--dbm-space-12)",
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
            <div
              style={{
                alignItems: "center",
                color: "var(--dbm-text-tertiary)",
                display: "flex",
                gap: "var(--dbm-space-1)",
              }}
            >
              <Icon icon={LinkIcon} size="xs" />
              <span style={{ fontSize: "var(--dbm-font-size-xs)" }}>{primitiveName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
