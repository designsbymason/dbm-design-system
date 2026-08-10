import { useCallback, useEffect, useState } from "react";
import type { DocsContextProps } from "@storybook/addon-docs/blocks";
import {
  RESET_STORY_ARGS,
  STORY_ARGS_UPDATED,
  UPDATE_STORY_ARGS,
} from "storybook/internal/core-events";
import type { PreparedStory } from "storybook/internal/types";

/**
 * A `useArgs`-equivalent scoped to one explicit story, for building custom
 * doc blocks that read/mutate a specific story's args (as `<Controls of=
 * {X}>` does) rather than "whichever story is current" (as the public
 * `useArgs()` from `storybook/preview-api` does — it has no `of` param,
 * because it's designed for a single-story context like an addon panel,
 * not a Docs page that can embed several stories).
 *
 * Storybook's own internal version of this (`src/blocks/blocks/useArgs.ts`
 * in `@storybook/addon-docs`) isn't exported from the public
 * `@storybook/addon-docs/blocks` entry point, so this reimplements it
 * directly against the same public primitives `useThemeGlobals.ts` already
 * uses successfully elsewhere in this codebase: `DocsContext`'s `channel`
 * (confirmed public on `DocsContextProps`) and the
 * `UPDATE_STORY_ARGS`/`STORY_ARGS_UPDATED`/`RESET_STORY_ARGS` event
 * constants from `storybook/internal/core-events` (the same import path
 * already used there for `SET_GLOBALS`/`UPDATE_GLOBALS` — established
 * precedent in this repo, not a new risk). Confirmed by reading Storybook
 * 10.5.2's actual `blocks.js` output that this is exactly what the
 * internal hook does.
 *
 * Unlike `useThemeGlobals`, this doesn't need a module-level cache: args
 * are scoped to one specific `story.id`, read fresh from
 * `context.getStoryContext(story).args` on every mount, so there's no
 * cross-navigation staleness to guard against — if this component
 * remounts, the initial `useState` read is already current.
 *
 * `argType.mapping` (e.g. Button's `icon`/`trailingIcon`, which map a
 * string option like `"Trash"` to an actual icon component) does **not**
 * need to be applied here — confirmed by reading Storybook's
 * `prepareContext`, which re-applies `mapping` on every render
 * regardless of how args were updated. `updateArgs` below only ever needs
 * to send the raw pre-mapping value.
 */
export function usePlaygroundArgs(
  context: DocsContextProps,
  story: PreparedStory | undefined,
): [
  Record<string, unknown>,
  (updatedArgs: Record<string, unknown>) => void,
  (argNames?: string[]) => void,
] {
  const storyId = story?.id ?? "none";
  const [args, setArgs] = useState<Record<string, unknown>>(
    () => (story ? context.getStoryContext(story).args : {}),
  );

  useEffect(() => {
    const onArgsUpdated = (changed: { storyId: string; args: Record<string, unknown> }) => {
      if (changed.storyId === storyId) setArgs(changed.args);
    };
    context.channel.on(STORY_ARGS_UPDATED, onArgsUpdated);
    return () => context.channel.off(STORY_ARGS_UPDATED, onArgsUpdated);
  }, [storyId, context.channel]);

  const updateArgs = useCallback(
    (updatedArgs: Record<string, unknown>) =>
      context.channel.emit(UPDATE_STORY_ARGS, { storyId, updatedArgs }),
    [storyId, context.channel],
  );

  const resetArgs = useCallback(
    (argNames?: string[]) =>
      context.channel.emit(RESET_STORY_ARGS, { storyId, argNames }),
    [storyId, context.channel],
  );

  return [args, updateArgs, resetArgs];
}
