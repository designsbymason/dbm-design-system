import { CheckCircleIcon, InfoIcon, XCircleIcon } from "@dbm-design-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ReactNode } from "react";
import { Icon } from "../../src/atoms/Icon";

export type CalloutTone = "success" | "danger" | "info";

const toneConfig: Record<
  CalloutTone,
  { bg: string; text: string; icon: PhosphorIcon }
> = {
  success: {
    bg: "var(--dbm-bg-success-subtle)",
    text: "var(--dbm-text-success)",
    icon: CheckCircleIcon,
  },
  danger: {
    bg: "var(--dbm-bg-danger-subtle)",
    text: "var(--dbm-text-danger)",
    icon: XCircleIcon,
  },
  info: {
    bg: "var(--dbm-bg-info-subtle)",
    text: "var(--dbm-text-info)",
    icon: InfoIcon,
  },
};

/**
 * Docs-page-only colored callout — Do/Don't cards, Accessibility notes.
 * Children are authored as regular markdown (a blank-line-separated list)
 * directly between the JSX tags in the `.mdx` file; MDX parses that content
 * as markdown even though it's nested inside a component. Not part of the
 * published package.
 */
export function Callout({
  tone,
  title,
  children,
}: {
  tone: CalloutTone;
  title: string;
  children: ReactNode;
}) {
  const config = toneConfig[tone];
  return (
    // `minWidth: 0` (2026-08-10) — every current usage sits in a 2-column
    // `1fr 1fr` grid (Do/Don't cards); as a grid item this div's default
    // `min-width: auto` refused to shrink below its content's intrinsic
    // width whenever a list item held an unbreakable run of text (e.g.
    // "Stack/Grid/Container", `/`-separated with no spaces), forcing the
    // whole card — and the page — wider on a narrow viewport instead of
    // wrapping. Confirmed live across the 9 doc pages using this pattern.
    <div
      style={{
        background: config.bg,
        borderRadius: "var(--dbm-radius-md)",
        minWidth: 0,
        padding: "var(--dbm-space-4)",
      }}
    >
      <div
        style={{
          alignItems: "center",
          color: config.text,
          display: "flex",
          fontWeight: "var(--dbm-font-weight-semibold)",
          gap: "var(--dbm-space-2)",
          marginBlockEnd: "var(--dbm-space-2)",
        }}
      >
        <Icon icon={config.icon} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
