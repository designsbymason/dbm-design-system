// The code shown under each story's "Show code" button on AvatarGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`stacked={true}`, `colorful={false}`) and the demo scaffolding around the group. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const avatarGroupSnippets = {
  overflow: `{/* max: the most avatars drawn; the rest collapse into one "+N" tile after them */}
<AvatarGroup aria-label="Project members" max={3}>
  <Avatar name="Jane Doe" src="/jane.jpg" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
  <Avatar name="Maria Garcia" />
  <Avatar name="Sam Lee" />
</AvatarGroup>`,

  total: `{/* total: the real number of people, when the group holds only the ones loaded so far.
    The tile reads total minus the avatars drawn: here "+21". */}
<AvatarGroup aria-label="Reviewers" total={24} max={3}>
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
</AvatarGroup>`,

  overflowButton: `{/* onOverflowClick makes the tile a button, named "Show 2 more". Open whatever lists the rest:
    a dialog, or, as here, a list you reveal yourself.
    const [showAll, setShowAll] = useState(false); */}
<AvatarGroup aria-label="Project members" max={3} onOverflowClick={() => setShowAll(true)}>
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
  <Avatar name="Maria Garcia" />
  <Avatar name="Sam Lee" />
</AvatarGroup>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — every avatar's default, and how far they overlap */}
<AvatarGroup aria-label="Project members" size="sm">
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
</AvatarGroup>`,

  responsive: `{/* A mobile-first map: small on a phone, large from the md breakpoint up */}
<AvatarGroup aria-label="Project members" size={{ base: "sm", md: "lg" }} max={4}>
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
  <Avatar name="Maria Garcia" />
  <Avatar name="Sam Lee" />
</AvatarGroup>`,

  square: `{/* shape="square": for teams, bots or organisations rather than people; the ring follows it */}
<AvatarGroup aria-label="Teams" shape="square">
  <Avatar name="Design" />
  <Avatar name="Platform" />
  <Avatar name="Growth" />
</AvatarGroup>`,

  colorful: `{/* colorful: each avatar's colour comes from its name. The "+N" tile stays the brand colour. */}
<AvatarGroup aria-label="Project members" colorful max={3}>
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
  <Avatar name="Maria Garcia" />
</AvatarGroup>`,

  spaced: `{/* stacked={false} keeps the avatars apart, with a gap, and lets a row wrap onto more lines */}
<AvatarGroup aria-label="Project members" stacked={false} max={4}>
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Alex Kim" />
  <Avatar name="Maria Garcia" />
  <Avatar name="Sam Lee" />
</AvatarGroup>`,

  images: `{/* Images, and a presence dot: the first avatar is on top, so no dot is ever covered by the next */}
<AvatarGroup aria-label="Online now">
  <Avatar name="Jane Doe" src="/jane.jpg" status="online" />
  <Avatar name="John Smith" src="/john.jpg" status="away" />
  <Avatar name="Alex Kim" status="busy" />
  <Avatar name="Maria Garcia" status="offline" />
</AvatarGroup>`,

  interactive: `{/* Each avatar can be a button, or wrapped in a Tooltip; it still takes the group's size and shape */}
<AvatarGroup aria-label="Project members" size="lg">
  <Tooltip content="Jane Doe">
    <Avatar as="button" name="Jane Doe" onClick={openProfile} />
  </Tooltip>
  <Tooltip content="John Smith">
    <Avatar as="button" name="John Smith" onClick={openProfile} />
  </Tooltip>
</AvatarGroup>`,

  own: `{/* An avatar's own props win over the group's: here the last one is a small square */}
<AvatarGroup aria-label="Project members" size="lg">
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
  <Avatar name="Design" shape="square" size="sm" />
</AvatarGroup>`,

  translated: `{/* labels and formatNumber translate the tile: its accessible name and the digits it draws */}
<AvatarGroup
  aria-label="أعضاء المشروع"
  max={2}
  labels={{ overflow: (count) => \`\${count} آخرين\` }}
  formatNumber={(count) => new Intl.NumberFormat("ar-EG").format(count)}
>
  <Avatar name="جين" />
  <Avatar name="جون" />
  <Avatar name="أليكس" />
  <Avatar name="ماريا" />
  <Avatar name="سام" />
</AvatarGroup>`,

  rtl: `{/* The group follows the page's text direction: wrap it (or the page) in dir="rtl" */}
<div dir="rtl">
  <AvatarGroup aria-label="Project members" max={3}>
    <Avatar name="Jane Doe" />
    <Avatar name="John Smith" />
    <Avatar name="Alex Kim" />
    <Avatar name="Maria Garcia" />
  </AvatarGroup>
</div>`,

  labelled: `{/* A visible label names the group */}
<span id="members-label">Members</span>
<AvatarGroup aria-labelledby="members-label">
  <Avatar name="Jane Doe" />
  <Avatar name="John Smith" />
</AvatarGroup>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface AvatarGroupPlaygroundSnippetArgs {
  size?: string;
  shape?: string;
  colorful?: boolean;
  max?: number;
  /** Storybook only: 0 leaves `total` out. */
  total?: number;
  stacked?: boolean;
  /** Storybook only: whether the "+N" tile is a button. */
  overflowButton?: boolean;
  /** Storybook only: how many avatars the demo group holds. */
  count?: number;
  "aria-label"?: string;
}

const names = ["Jane Doe", "John Smith", "Alex Kim", "Maria Garcia", "Sam Lee", "Chris Park", "Dana Cruz", "Eli Novak"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around as many avatars as the demo shows. Also serves the stories that just change a few args.
 */
export function avatarGroupPlaygroundSnippet(args: AvatarGroupPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Project members"}"`];
  if (args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size)) attributes.push(`size="${args.size}"`);
  if (args.shape === "square") attributes.push('shape="square"');
  if (args.colorful) attributes.push("colorful");
  if (typeof args.max === "number" && args.max >= 0) attributes.push(`max={${Math.floor(args.max)}}`);
  if (typeof args.total === "number" && args.total > 0) attributes.push(`total={${Math.floor(args.total)}}`);
  if (args.stacked === false) attributes.push("stacked={false}");
  if (args.overflowButton) attributes.push("onOverflowClick={showAll}");
  const count = Math.min(Math.max(args.count ?? 5, 1), names.length);
  const avatars = names.slice(0, count).map((name) => `  <Avatar name="${name}" />`);
  return `<AvatarGroup ${attributes.join(" ")}>\n${avatars.join("\n")}\n</AvatarGroup>`;
}
