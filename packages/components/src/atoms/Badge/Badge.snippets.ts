// The code shown under each story's "Show code" button on Badge's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`dot={false}`, `hideZero={false}`, `max={99}`), keeps
// the story's demo wrapper `div`s, and — for the four "Anchor" stories — prints the
// icon as `{{ $$typeof: Symbol(react.forward_ref), render: () => {} }}`, which is
// Storybook serializing the icon component and can't be pasted. Each snippet here
// is the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { BadgeOverlap, BadgePosition, BadgeSize, BadgeTone, BadgeVariant } from "./Badge.types";

export const badgeSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Badge size="lg">lg</Badge>`,

  allTonesSubtle: `{/* tone: "brand" | "neutral" | "info" | "success" | "warning" | "danger" (default) */}
<Badge variant="subtle" tone="success">success</Badge>`,

  allTonesSolid: `{/* variant: "solid" (default) | "subtle" — solid is the high-emphasis fill */}
<Badge variant="solid" tone="success">success</Badge>`,

  statusLabels: `{/* A subtle badge as a status label */}
<Badge variant="subtle" tone="success">Active</Badge>
<Badge variant="subtle" tone="warning">Pending</Badge>
<Badge variant="subtle" tone="danger">Failed</Badge>
<Badge variant="subtle" tone="neutral">Draft</Badge>`,

  solidStatusLabels: `{/* A solid badge as a high-emphasis status label */}
<Badge variant="solid" tone="success">Active</Badge>
<Badge variant="solid" tone="warning">Pending</Badge>
<Badge variant="solid" tone="danger">Failed</Badge>`,

  countWithMax: `{/* A count above max (99 by default) shows as "99+" */}
<Badge tone="danger">{42}</Badge>
<Badge tone="danger">{100}</Badge>`,

  hideZero: `{/* hideZero renders nothing when the count is 0 */}
<Badge hideZero tone="danger">{0}</Badge>
<Badge hideZero tone="danger">{3}</Badge>`,

  dot: `{/* dot is a small indicator with no content — give it an aria-label, since it has no text */}
<Badge dot tone="danger" aria-label="Unread notifications" />
<Badge dot tone="success" aria-label="Online" />
<Badge dot tone="neutral" aria-label="Offline" />`,

  anchorOnIcon: `{/* anchor pins the badge to a corner of another element. Bell comes from @dbm-design-system/icons. */}
<Badge dot tone="danger" anchor={<Icon icon={Bell} size="lg" />} aria-label="Unread notifications" />`,

  anchorWithCount: `{/* An anchored badge can carry a count. Bell comes from @dbm-design-system/icons. */}
<Badge tone="danger" variant="solid" anchor={<Icon icon={Bell} size="lg" />}>4</Badge>`,

  allPositions: `{/* position: which corner of the anchor the badge overlaps — "top-right" (default) | "top-left" |
    "bottom-right" | "bottom-left". Physical corners, so they don't mirror in right-to-left text.
    Bell comes from @dbm-design-system/icons. */}
<Badge
  dot
  tone="danger"
  position="bottom-left"
  anchor={<Icon icon={Bell} size="lg" />}
  aria-label="Unread notifications"
/>`,

  anchorOverlapComparison: `{/* overlap: "rectangular" (default) | "circular" — circular tucks the badge in a little further, so it
    doesn't overhang a round anchor such as an Avatar the way it can on a rectangular one. */}
<Badge tone="danger" variant="solid" overlap="circular" anchor={<Avatar initials="JD" />}>3</Badge>`,

  inlineInButton: `{/* Without an anchor a Badge sits inline, so it can live inside other content */}
<Button variant="secondary">
  Messages <Badge size="xs" tone="danger" variant="solid">3</Badge>
</Button>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface BadgePlaygroundSnippetArgs {
  children?: unknown;
  tone?: BadgeTone;
  size?: BadgeSize;
  variant?: BadgeVariant;
  max?: number;
  hideZero?: boolean;
  dot?: boolean;
  position?: BadgePosition;
  overlap?: BadgeOverlap;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A `dot` badge has no content, so it drops its children
 * and is given an `aria-label`, as one needs.
 */
export function badgePlaygroundSnippet(args: BadgePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.tone && args.tone !== "danger") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "solid") attributes.push(`variant="${args.variant}"`);
  if (args.max !== undefined && args.max !== 99) attributes.push(`max={${args.max}}`);
  if (args.hideZero) attributes.push("hideZero");
  if (args.position && args.position !== "top-right") attributes.push(`position="${args.position}"`);
  if (args.overlap && args.overlap !== "rectangular") attributes.push(`overlap="${args.overlap}"`);
  if (args.dot) {
    attributes.unshift("dot");
    attributes.push(`aria-label="${args["aria-label"] || "Unread notifications"}"`);
    return `<Badge ${attributes.join(" ")} />`;
  }
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  const content = typeof args.children === "number" ? `{${args.children}}` : String(args.children ?? "Badge");
  return `<Badge${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>${content}</Badge>`;
}
