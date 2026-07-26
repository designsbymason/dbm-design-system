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
      "/iframe.html?id=atoms-core-button--all-variants&viewMode=story",
    );
    await expect(page.getByRole("button", { name: "primary" })).toBeVisible();
    await expect(page).toHaveScreenshot("button-all-variants.png");
  });
});
