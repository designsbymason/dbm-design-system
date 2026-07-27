import { primitives } from "@dbm-design-system/tokens";
import { ColorSwatch } from "./ColorSwatch";

const STEPS = [
  "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950",
] as const;

type ColorFamily = Exclude<keyof typeof primitives.color, "neutral">;

/**
 * Foundations-only primitive color scale — one row of 11 swatches (50–950)
 * for a given color family, sourced live from the built `primitives`
 * export so it can never drift from the actual token values. `anchor`
 * marks the brand-mandated fixed step (purple-600/emerald-600 — see
 * guidelines/03-token-system-spec.md). Not part of the published package.
 */
export function ColorScaleGrid({
  family,
  anchor,
}: {
  family: ColorFamily;
  anchor?: string;
}) {
  const scale = primitives.color[family] as Record<string, string>;
  return (
    <div>
      <div
        style={{
          fontWeight: "var(--dbm-font-weight-semibold)",
          marginBlockEnd: "var(--dbm-space-2)",
          textTransform: "capitalize",
        }}
      >
        {family}
      </div>
      <div
        style={{
          display: "grid",
          gap: "var(--dbm-space-2)",
          gridTemplateColumns: "repeat(11, 1fr)",
        }}
      >
        {STEPS.map((step) => (
          <ColorSwatch
            key={step}
            color={scale[step]}
            label={step === anchor ? `${step} ★` : step}
            sublabel={scale[step]}
          />
        ))}
      </div>
    </div>
  );
}
