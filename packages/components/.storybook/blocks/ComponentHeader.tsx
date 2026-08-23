import { Badge } from "../../src/atoms/Badge";

export type ComponentTier = "Atom" | "Molecule" | "Organism" | "Template";

/**
 * Docs-page-only header: the component's name plus a tier badge, reusing
 * our own `Badge` atom rather than plain markdown — the docs pages
 * themselves are a chance to show the system in use, not just describe it.
 * Not part of the published package; lives under `.storybook/` alongside
 * the other Docs-page-only building blocks.
 */
export function ComponentHeader({
  title,
  tier = "Atom",
}: {
  title: string;
  tier?: ComponentTier;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--dbm-space-3)",
      }}
    >
      <h1 style={{ margin: 0 }}>{title}</h1>
      <Badge tone="info">{tier}</Badge>
    </div>
  );
}
