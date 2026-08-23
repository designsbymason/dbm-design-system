import { expect, test } from "@playwright/test";

/**
 * A first, working example of the visual-regression pipeline described in
 * `guidelines/02-tech-stack-and-structure.md` — proves the Storybook +
 * Playwright screenshot/compare loop actually works end to end. Extend with
 * one entry per component as each gets a dedicated visual-regression pass;
 * this isn't meant to cover every story for every component from day one.
 */
test.describe("visual regression", () => {
  test("Button — all variants", async ({ page }) => {
    await page.goto(
      // Was "atoms-core-button--all-variants" — stale since the sidebar
      // taxonomy was corrected (`07-storybook-and-documentation-
      // standards.md` §3, "Atoms/Core" was split up), so this test had been
      // silently broken (404) since then. Fixed alongside the hover
      // regression test below (found while adding it).
      "/iframe.html?id=atoms-inputs-button--all-variants&viewMode=story",
    );
    await expect(page.getByRole("button", { name: "primary" })).toBeVisible();
    await expect(page).toHaveScreenshot("button-all-variants.png");
  });

  // Real-browser regression pair for `06-engineering-standards.md` §9
  // Finding #3 (Button review, 2026-08-23): every hover rule in
  // `Button.module.css` is guarded by both `:not(:disabled)` (the native
  // <button> path) and `:not(.disabled)` (the `asChild` path — `:disabled`
  // can never match a non-form slotted element like an <a>). jsdom can't
  // exercise real `:hover` cascade at all, so this couldn't be a Vitest/RTL
  // test (`Button.test.tsx`) — computed-style assertions in a real browser,
  // not a screenshot diff, so there's nothing to eyeball or update when it
  // fails.
  test("Button — asChild + disabled ignores hover (no interactive fill under the dimmed opacity)", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=atoms-inputs-button--as-child-disabled&viewMode=story",
    );
    const link = page.getByRole("link", { name: "Continue as a link" });
    await expect(link).toBeVisible();
    const before = await link.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await link.hover();
    // `background-color` transitions over `--dbm-motion-duration-fast`
    // (120ms) — wait past that so a real (buggy) hover fill has time to
    // finish animating in before asserting it never applied. There's no
    // "eventually true" condition to poll for here, since the whole point
    // is confirming *no* change happens — a fixed wait is the correct tool,
    // not `expect.poll`.
    await page.waitForTimeout(300);
    const after = await link.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(after).toBe(before);
  });

  test("Button — asChild without disabled still applies the interactive hover fill", async ({
    page,
  }) => {
    // The other half of the pair — proves the guard above suppresses hover
    // specifically *because* the element is disabled, not because `asChild`
    // links can never receive a hover fill at all.
    await page.goto(
      "/iframe.html?id=atoms-inputs-button--as-child&viewMode=story",
    );
    const link = page.getByRole("link", { name: "Continue as a link" });
    await expect(link).toBeVisible();
    const before = await link.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await link.hover();
    // Poll rather than a fixed wait — here there genuinely is an
    // "eventually true" condition (the hover-fill transition completing).
    await expect
      .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before);
  });

  // `secondary`'s brand-colored border can't be verified in Vitest/RTL —
  // jsdom's CSS parser (`cssstyle`) silently drops a `var()` inside the
  // `border: ... solid ...` shorthand (confirmed directly: `borderColor`
  // comes back empty even for a literal-width `border: 1px solid var(--x)`,
  // and even the `border-color` *longhand* resolves to black instead of
  // preserving the reference) — see the note in `Button.test.tsx`'s own
  // variant-color test. Real-browser computed-style check instead.
  test("Button — secondary variant: brand border/text/icon, transparent by default, brand-subtle-hover on hover", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=atoms-inputs-button--playground&viewMode=story&args=variant:secondary;leadingIcon:Wallet",
    );
    const button = page.getByRole("button", { name: "Button" });
    await expect(button).toBeVisible();

    const before = await button.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, color: cs.color };
    });
    expect(before.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // `border.brand` and `text.brand` resolve to the identical purple.600
    // step in this theme — comparing them to each other, rather than
    // hardcoding a literal rgb string, keeps this test theme-agnostic.
    expect(before.borderColor).toBe(before.color);

    const iconColor = await button
      .locator("svg")
      .evaluate((el) => getComputedStyle(el).color);
    expect(iconColor).toBe(before.color); // icon.brand === text.brand's resolved value too

    await button.hover();
    await expect
      .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before.backgroundColor);
  });

  // Not caught by the "all variants" screenshot test above — `tertiary`'s
  // text-only color change (dark gray → brand purple) is subtle enough on
  // thin glyph strokes that Playwright's default pixel-diff threshold
  // doesn't flag it (confirmed empirically: that test kept passing against
  // the pre-restyle baseline). Computed-style assertions instead, same
  // reasoning as the `secondary` test above (no border here, so no jsdom
  // limitation to work around — this could be a Vitest test too, but kept
  // alongside `secondary`'s for a single source of truth on this pair).
  test("Button — tertiary variant: brand text/icon, transparent by default, brand-subtle-hover on hover", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=atoms-inputs-button--playground&viewMode=story&args=variant:tertiary;leadingIcon:Wallet",
    );
    const button = page.getByRole("button", { name: "Button" });
    await expect(button).toBeVisible();

    const before = await button.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { backgroundColor: cs.backgroundColor, color: cs.color };
    });
    expect(before.backgroundColor).toBe("rgba(0, 0, 0, 0)");

    const iconColor = await button
      .locator("svg")
      .evaluate((el) => getComputedStyle(el).color);
    expect(iconColor).toBe(before.color); // icon.brand === text.brand's resolved value

    await button.hover();
    await expect
      .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before.backgroundColor);
  });

  // Same reasoning as `tertiary` above — a subtle recolor that a screenshot
  // diff can't be trusted to catch. `ghost` is the odd one out among the
  // three brand-colored variants here: its default fill is `bg.brand-subtle`
  // (a visible light tint), not transparent, so this asserts the fill is
  // present and non-transparent rather than asserting `rgba(0, 0, 0, 0)`.
  test("Button — ghost variant: brand text/icon, bg.brand-subtle by default, brand-subtle-hover on hover", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=atoms-inputs-button--playground&viewMode=story&args=variant:ghost;leadingIcon:Wallet",
    );
    const button = page.getByRole("button", { name: "Button" });
    await expect(button).toBeVisible();

    const before = await button.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { backgroundColor: cs.backgroundColor, color: cs.color };
    });
    expect(before.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    const iconColor = await button
      .locator("svg")
      .evaluate((el) => getComputedStyle(el).color);
    expect(iconColor).toBe(before.color); // icon.brand === text.brand's resolved value

    await button.hover();
    await expect
      .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before.backgroundColor);
  });
});
