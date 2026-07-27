import type { ReactNode } from "react";

/**
 * Docs-page-only "Related components" card — a small live rendering of the
 * related component (passed as `children`) plus its name/description/link,
 * instead of a plain list of markdown links. Not part of the published
 * package.
 */
export function RelatedCard({
  name,
  description,
  href,
  children,
}: {
  name: string;
  description: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        border: "1px solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        color: "inherit",
        display: "block",
        padding: "var(--dbm-space-4)",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          marginBlockEnd: "var(--dbm-space-3)",
          minHeight: "3rem",
        }}
      >
        {children}
      </div>
      <div style={{ fontWeight: "var(--dbm-font-weight-semibold)" }}>
        {name}
      </div>
      <div
        style={{
          color: "var(--dbm-text-tertiary)",
          fontSize: "var(--dbm-font-size-sm)",
        }}
      >
        {description}
      </div>
    </a>
  );
}
