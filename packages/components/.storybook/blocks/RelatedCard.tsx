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
    // The whole card used to be a single `<a>` wrapping both the preview
    // slot and the name/description — but the preview slot renders a real
    // live component (per this block's own doc comment above), and several
    // of those previews are themselves interactive elements (`IconButton`,
    // `CloseButton`, a removable `Tag`, `Link`) or contain one. Nesting a
    // real `<a>`/`<button>` inside another `<a>` is invalid HTML —
    // confirmed live as a React hydration warning on Button.mdx's "Link"
    // card, where the previewed `<Link>` renders its own `<a>` directly
    // inside this card's outer `<a>`. Splitting the link down to just the
    // name/description keeps a real, fully keyboard-accessible navigation
    // link (native `<a>`, not a hand-rolled ARIA button) while leaving the
    // preview slot a plain, non-interactive container that any live
    // component's own interactive elements can render into safely.
    <div
      style={{
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      {/* Explicit reactive `color` (2026-08-10) — some previewed
          components (e.g. `CloseButton`) deliberately have no color of
          their own, inheriting `currentColor` from context by design (see
          that component's own doc comment). This card's outer element only
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
      <a
        href={href}
        style={{ color: "inherit", display: "block", textDecoration: "none" }}
      >
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
    </div>
  );
}
