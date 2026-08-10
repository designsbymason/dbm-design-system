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
          color: "var(--dbm-text-primary)",
          fontWeight: "var(--dbm-font-weight-semibold)",
          marginBlockEnd: "var(--dbm-space-2)",
          textTransform: "capitalize",
        }}
      >
        {family}
      </div>
      {/* 11 across on wide screens, wrapping to 3-per-row on mobile
          (`.dbm-color-scale-grid`'s own media query in docs.css) — tried
          horizontal scroll first (2026-08-10), reasoning that the
          left-to-right 50→950 progression shouldn't get broken across
          rows, but reverted the same day per explicit direction: wrapping
          reads better on a phone than a hidden-until-you-swipe strip. */}
      <div className="dbm-color-scale-grid">
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
