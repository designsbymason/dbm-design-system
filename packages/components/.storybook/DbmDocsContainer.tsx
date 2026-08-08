import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import type { PropsWithChildren } from "react";
import { useThemeGlobals } from "./blocks/foundations/useThemeGlobals";
import { dbmStorybookTheme, dbmStorybookThemeDark } from "./theme";

/**
 * Reads the live Mode global straight from the attached story's own context
 * — synchronous, no subscription/cache needed — for any docs page that has
 * one (every component `ComponentName.mdx`, via `<Meta of={ComponentStories} />`).
 * Returns `undefined` on Foundations pages, which use `<Meta title="..." />`
 * with no attached CSF file, so `storyById()` has nothing to resolve.
 *
 * This is the ONLY reliable read on a component page (added 2026-08-08,
 * after `useThemeGlobals`'s channel-subscription approach — copied from
 * `ThemeSync`, which only ever ran on Foundations pages — turned out not to
 * survive there): logging a random id assigned at module-eval time proved
 * the whole `useThemeGlobals.ts` module gets **freshly re-evaluated**
 * (not just the React component remounting) every time the embedded
 * `<Canvas>` re-prepares its story in response to a globals change, wiping
 * any module-level cache along with it — the JS realm this module runs in
 * is torn down and rebuilt, not merely the one component. A synchronous
 * read at render time has nothing to lose across that: it doesn't matter
 * how many times the module reloads if every fresh instance computes the
 * same correct answer straight from Storybook's own live story context
 * instead of remembering a previous one.
 */
function readModeFromAttachedStory(context: DocsContainerProps["context"]): string | undefined {
  try {
    const story = context.storyById();
    return context.getStoryContext(story).globals?.mode as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * The Docs addon's own wrapper/typography (`.sbdocs-wrapper`/`.sbdocs-content`
 * — Storybook's chrome around MDX content, not our component classes) runs
 * outside the preview iframe, so it can't read the Mode toolbar global via
 * a decorator. `Docs.tsx` (Storybook's own MDX entry point) accepts a
 * `parameters.docs.container` override and hands it `{ context, theme }` —
 * wired in `preview.tsx` in place of a static `docs.theme` — so this picks
 * the matching theme object itself, ignoring the static `theme` prop
 * `Docs.tsx` would otherwise pass through.
 *
 * Two different sources for the live Mode value, tried in order:
 * 1. `readModeFromAttachedStory` — component pages (have an attached CSF
 *    story). Reliable specifically because this component gets torn down
 *    and rebuilt on every globals change there (see that function's own
 *    comment) — a stateless read just recomputes correctly every time.
 * 2. `useThemeGlobals` (the same channel-subscription hook `ThemeSync`
 *    uses) — Foundations pages, which have no attached story for (1) to
 *    read, but also never trigger the module-reloading churn that made
 *    (1) necessary in the first place, so the subscription approach that
 *    already works for `ThemeSync` there works equally well here.
 */
export function DbmDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const storyMode = readModeFromAttachedStory(props.context);
  const { mode: fallbackMode } = useThemeGlobals(props.context);
  const mode = storyMode ?? fallbackMode;
  return (
    <DocsContainer {...props} theme={mode === "dark" ? dbmStorybookThemeDark : dbmStorybookTheme} />
  );
}
