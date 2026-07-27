import { StarIcon } from "@dbm-design-system/icons";
import { primitives } from "@dbm-design-system/tokens";
import { Icon } from "../../../src/atoms/Icon";
import type { IconSize } from "../../../src/atoms/Icon/Icon.types";

/**
 * Foundations-only icon-size scale — a real `Icon` atom rendered at each
 * step, using the real component (not a resized placeholder) so it's an
 * accurate preview. Sourced live from `primitives["icon-size"]`. Not part
 * of the published package.
 */
export function IconSizeScale() {
  const entries = Object.entries(primitives["icon-size"]) as [IconSize, string][];
  return (
    <div style={{ alignItems: "flex-end", display: "flex", gap: "var(--dbm-space-6)" }}>
      {entries.map(([step, value]) => (
        <div
          key={step}
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--dbm-space-2)",
          }}
        >
          <Icon icon={StarIcon} size={step} tone="brand" />
          <code style={{ fontSize: "var(--dbm-font-size-xs)" }}>icon-size.{step}</code>
          <span style={{ color: "var(--dbm-text-tertiary)", fontSize: "var(--dbm-font-size-xs)" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
