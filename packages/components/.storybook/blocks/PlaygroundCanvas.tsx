import { DocsContext, useOf } from "@storybook/addon-docs/blocks";
import type { Of } from "@storybook/addon-docs/blocks";
import { useContext } from "react";
import { usePlaygroundArgs } from "./usePlaygroundArgs";

/**
 * Drop-in swap for `<Canvas of={X} />`, but for a story whose demo needs
 * genuine page-scroll (`position: sticky` with no `scrollContainerRef`,
 * the default/most common `Affix` usage) *and* live Controls-panel
 * interactivity on the Docs page — a combination the standard `<Canvas>`
 * block cannot provide for a single story at once. Real, previously-
 * shipped conflict found across two rounds of direct user reports:
 *
 * - Inlined (`<Canvas>`'s default): Storybook's own `.docs-story` wrapper
 *   always sets `overflow: auto` (to contain tall/wide demos), which per
 *   the CSS spec becomes `position: sticky`'s nearest scrolling-ancestor
 *   reference even though `.docs-story` itself never actually has real
 *   overflow (`scrollHeight === clientHeight`) — so a page-scroll `Affix`
 *   embedded this way can never get a real scroll delta to react to and
 *   silently never sticks, no matter how correct its own CSS/JS is.
 * - `docs.story.inline: false` (the story-level parameter that fixes the
 *   above by rendering into a genuinely separate iframe/document):
 *   confirmed by reading Storybook 10.5.7's own `IFrameStory` block
 *   (`@storybook/addon-docs/dist/blocks.js`) — it builds that iframe's
 *   `src` once from `getStoryHref(story.id, { viewMode: "story" })` with
 *   no args embedded and no subscription to args-change events at all.
 *   This isn't a bug to work around; live Controls-driven args syncing
 *   for an `inline: false` story simply isn't a capability Storybook
 *   ships. So `PlaygroundControls`'s widgets correctly showed newly
 *   picked values (they read Storybook's real args state directly) while
 *   the separate iframe silently kept rendering whatever args it loaded
 *   with — confirmed via the iframe's own DOM: `data-stuck`, computed
 *   style, and content never changed no matter what was selected.
 *
 * This block resolves the conflict Storybook doesn't: instead of a
 * static `src`, it rebuilds the iframe's `src` from the *current* live
 * args on every change (via `usePlaygroundArgs`, the same hook
 * `PlaygroundControls` already uses — both independently subscribe to
 * the same story's `STORY_ARGS_UPDATED` channel event, so they always
 * stay in sync with each other) and keys the `<iframe>` by that same
 * serialized string, forcing React to fully remount it — a real
 * navigation/reload, not a live patch — whenever a control changes.
 * That's a heavier update than an inlined story's instant re-render (a
 * brief reload flash, scroll position reset), but it's the only way to
 * get a genuinely separate document (so real page-scroll CSS behavior
 * works) that still reflects Controls-panel changes at all.
 *
 * Args are serialized using Storybook's own URL args format
 * (`key:value;key2:value2`, the same the story picks back up on load via
 * its own args-from-URL support) rather than the full `UPDATE_STORY_ARGS`
 * channel payload — the receiving end here is a fresh page load, which
 * only ever reads initial args from its own URL, not a live channel
 * message arriving after mount. Only JSON-primitive values are included:
 * functions (e.g. the `fn()` spy Storybook substitutes for callback
 * props like `onStickyChange`) and objects/refs can't round-trip through
 * a URL and are silently dropped — the reloaded story falls back to its
 * own `meta.args` default for those, which for a spy function is
 * observably identical to the original anyway.
 */
function serializeArgsForUrl(args: Record<string, unknown>): string {
  return Object.entries(args)
    .filter(([, value]) => {
      const type = typeof value;
      return value !== undefined && type !== "function" && type !== "object";
    })
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(";");
}

export function PlaygroundCanvas({ of, height = "500px" }: { of: Of; height?: string }) {
  const context = useContext(DocsContext);
  const resolved = useOf(of, ["story"]);
  const story = resolved.type === "story" ? resolved.story : undefined;
  const [args] = usePlaygroundArgs(context, story);

  if (!story) return null;

  const argsParam = serializeArgsForUrl(args);
  const params = new URLSearchParams();
  params.set("id", story.id);
  params.set("viewMode", "story");
  if (argsParam) params.set("args", argsParam);
  const src = `iframe.html?${params.toString()}`;

  return (
    <div
      style={{
        border: "var(--dbm-border-width-1) solid var(--dbm-border-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        height,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <iframe
        key={argsParam}
        src={src}
        title={story.name}
        style={{ border: "none", height: "100%", width: "100%" }}
      />
    </div>
  );
}
