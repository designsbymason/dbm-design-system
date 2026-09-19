// The code shown under each story's "Show code" button on Avatar's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// is the same 13-line block on every panel — every default spelled out
// (`colorful={false}`, `disabled={false}`), empty placeholders (`aria-label=""`,
// `name=""`, `src=""`) and no-op handlers (`onClick={() => {}}`, `onError={() =>
// {}}`) even on a plain `<span>` avatar — and the size × status matrix is 348 lines.
// Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks
// that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { AvatarShape, AvatarSize, AvatarStatus } from "./Avatar.types";

export const avatarSnippets = {
  asButton: `{/* as="button" renders a real <button>: an interactive trigger that keeps its own content.
    handleClick is your handler. */}
<Avatar as="button" alt="Jane Doe" initials="JD" status="online" onClick={handleClick} />`,

  asButtonColorful: `{/* colorful gives each avatar a colour of its own, derived from its name (and initials from
    the name too); on a button, hover steps that colour's own token, not the brand colour. */}
<Avatar as="button" colorful name="Jane Doe" onClick={handleClick} />
<Avatar as="button" colorful name="John Smith" onClick={handleClick} />
<Avatar as="button" colorful name="Alex Kim" onClick={handleClick} />
<Avatar as="button" colorful name="Maria Garcia" onClick={handleClick} />`,

  asButtonSquare: `{/* shape="square" gives the button a square focus ring and a small corner radius */}
<Avatar as="button" shape="square" alt="Jane Doe" initials="JD" status="online" onClick={handleClick} />`,

  asButtonDisabled: `{/* disabled dims the avatar and keeps it from being pressed */}
<Avatar as="button" disabled alt="Jane Doe" initials="JD" status="online" onClick={handleClick} />`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Avatar size="lg" alt="Jane Doe" initials="JD" />`,

  responsiveSize: `{/* size takes a mobile-first map: sm on mobile, xl from md up */}
<Avatar size={{ base: "sm", md: "xl" }} alt="Jane Doe" initials="JD" />`,

  allStatuses: `{/* status: "online" | "offline" | "busy" | "away" — a presence dot on the avatar's corner */}
<Avatar status="busy" alt="Jane Doe" initials="JD" />`,

  sizeStatusMatrix: `{/* Every size takes every status */}
<Avatar size="xl" status="away" alt="Jane Doe" initials="JD" />
<Avatar size="xs" status="online" alt="Jane Doe" initials="JD" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface AvatarPlaygroundSnippetArgs {
  as?: string;
  src?: string;
  alt?: string;
  initials?: string;
  name?: string;
  colorful?: boolean;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, and only the content props that are actually set (so
 * an avatar with no image and no initials is just `<Avatar />`, showing the generic
 * icon). Also serves the stories that just change a few args (initials, with an
 * image, a broken image, no initials, square). As a button it gets a click handler,
 * which is the whole point of `as="button"`.
 */
export function avatarPlaygroundSnippet(args: AvatarPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  const button = args.as === "button";
  if (button) attributes.push('as="button"');
  if (args.src) attributes.push(`src="${args.src}"`);
  if (args.alt) attributes.push(`alt="${args.alt}"`);
  if (args.initials) attributes.push(`initials="${args.initials}"`);
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args.colorful) attributes.push("colorful");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.shape && args.shape !== "circle") attributes.push(`shape="${args.shape}"`);
  if (args.status) attributes.push(`status="${args.status}"`);
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  if (button) attributes.push("onClick={handleClick}");
  return attributes.length > 0 ? `<Avatar ${attributes.join(" ")} />` : "<Avatar />";
}
