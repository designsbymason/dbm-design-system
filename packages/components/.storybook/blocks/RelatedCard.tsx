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
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        color: "inherit",
        display: "block",
        padding: "var(--dbm-space-4)",
        textDecoration: "none",
      }}
    >
      {/* Explicit reactive `color` (2026-08-10) — some previewed
          components (e.g. `CloseButton`) deliberately have no color of
          their own, inheriting `currentColor` from context by design (see
          that component's own doc comment). This card's `<a>` above only
          sets `color: inherit`, which — confirmed live, not assumed —
          resolves to a fixed black here: nothing between this slot and
          the document root sets an explicit `color` for `inherit` to
          actually pick up: the reactive text colors seen elsewhere on
          this page come from `docs.css` rules scoped to specific tags
          (`.sbdocs-content p`/`li`/etc.), not from any ambient color
          cascading down from the Docs wrapper's theme. Giving this slot
          its own explicit `text.primary` gives any `currentColor`-based
          child something reactive to actually inherit. */}
      <div
        style={{
          alignItems: "center",
          color: "var(--dbm-text-primary)",
          display: "flex",
          justifyContent: "center",
          marginBlockEnd: "var(--dbm-space-3)",
          minHeight: "var(--dbm-space-12)",
        }}
      >
        {children}
      </div>
      <div style={{ color: "var(--dbm-text-primary)", fontWeight: "var(--dbm-font-weight-semibold)" }}>
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
