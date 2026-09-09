import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FocusTrap } from "./FocusTrap";

describe("FocusTrap", () => {
  it("renders children", () => {
    render(
      <FocusTrap>
        <button type="button">Inside</button>
      </FocusTrap>,
    );
    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
  });

  it("loops focus from the last back to the first focusable element when loop is set", async () => {
    const user = userEvent.setup();
    render(
      <FocusTrap loop trapped>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>,
    );

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    first.focus();
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it("loops focus backward from the first to the last focusable element with shift+tab when loop is set", async () => {
    const user = userEvent.setup();
    render(
      <FocusTrap loop trapped>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FocusTrap>,
    );

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });

    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(second);
  });

  // This is the component's own core, defining promise ("focus cannot
  // escape the trap via keyboard" — FocusTrap.types.ts's own `trapped` doc)
  // and previously had zero coverage: every prior test only verified
  // looping *among* the trap's own children, never that focus is actually
  // prevented from reaching something outside it. Verified directly, not
  // assumed: without `trapped`, the second test below confirms focus does
  // escape to the outside button, proving the first test's negative result
  // is a real effect of `trapped` rather than an artifact of the DOM
  // structure or jsdom's own Tab handling.
  it("trapped prevents Tab from escaping past the last element to an element outside the trap", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Before</button>
        <FocusTrap trapped>
          <button type="button">First</button>
          <button type="button">Second</button>
        </FocusTrap>
        <button type="button">After</button>
      </div>,
    );

    const second = screen.getByRole("button", { name: "Second" });
    second.focus();

    await user.tab();
    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "After" }));
  });

  it("without trapped, Tab escapes past the last element to an element outside the trap", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Before</button>
        <FocusTrap>
          <button type="button">First</button>
          <button type="button">Second</button>
        </FocusTrap>
        <button type="button">After</button>
      </div>,
    );

    const second = screen.getByRole("button", { name: "Second" });
    second.focus();

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "After" }));
  });

  it("forwards native div props", () => {
    render(
      <FocusTrap data-testid="trap">
        <button type="button">Inside</button>
      </FocusTrap>,
    );
    expect(screen.getByTestId("trap")).toBeInTheDocument();
  });

  // asChild merges the trap directly onto `children` (Radix `Slot`) instead
  // of rendering its own wrapping `<div>` — confirmed here since the type
  // fix (extending Radix's own FocusScopeProps instead of a hand-rolled
  // subset) is what makes this prop exist at all; a regression here would
  // mean the merge silently stopped working, not just a missing feature.
  it("merges onto children with no extra wrapper element when asChild is set", () => {
    const { container } = render(
      <FocusTrap asChild trapped>
        <div role="dialog" data-testid="dialog-root">
          <button type="button">Inside</button>
        </div>
      </FocusTrap>,
    );
    const root = screen.getByTestId("dialog-root");
    expect(root).toHaveAttribute("role", "dialog");
    expect(container.firstElementChild).toBe(root);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FocusTrap>
        <button type="button">Accessible</button>
      </FocusTrap>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with asChild", async () => {
    const { container } = render(
      <FocusTrap asChild trapped>
        <div role="dialog" aria-label="Example dialog">
          <button type="button">Accessible</button>
        </div>
      </FocusTrap>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // The four tests below codify real, confirmed Radix `FocusScope`
  // behavior found while chasing a user-reported bug on FocusTrap.mdx's
  // Docs page (2026-09-09): two simultaneously-mounted `FocusTrap`
  // instances interfere with each other's own Tab-key handling in ways no
  // prop combination can fully prevent (confirmed by reading
  // @radix-ui/react-focus-scope's own source — every mounted instance
  // unconditionally registers into one shared, page-wide stack; whichever
  // mounts *last* pauses every earlier instance's own keydown handling,
  // regardless of either instance's own `trapped`/`loop` values). The
  // Docs page's own actual fix ended up being architectural, not a prop
  // change — `MergedOntoChild` was removed from the Docs page's embed list
  // entirely (kept sidebar-only, the same treatment already established
  // for `BackToTop`'s/`Affix`'s own interaction-sensitive stories) rather
  // than trying to coexist with Playground's Canvas on one page. These
  // tests stay as general, evergreen regression coverage of the underlying
  // Radix behavior itself — true for any consumer composing more than one
  // `FocusTrap` at once, not specific to how this one Docs page works
  // around it.
  it("only one simultaneously-mounted trapped FocusTrap can own Tab — the later-mounted one wins, not DOM order", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Page chrome before</button>
        <FocusTrap trapped loop>
          <input placeholder="First trap's field" />
        </FocusTrap>
        <FocusTrap trapped loop>
          <input placeholder="Second trap's field" />
        </FocusTrap>
      </div>,
    );

    screen.getByRole("button", { name: "Page chrome before" }).focus();
    await user.tab();

    // The second (later-mounted) trap wins, even though the first trap
    // comes first in the DOM — this is the real, confirmed Radix behavior
    // the fix has to work around, not assumed.
    expect(document.activeElement).toBe(screen.getByPlaceholderText("Second trap's field"));
  });

  it("a non-trapped FocusTrap mounted after a trapped one does not steal Tab from it", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Page chrome before</button>
        <FocusTrap trapped loop>
          <input placeholder="First trap's field" />
        </FocusTrap>
        <FocusTrap>
          <input placeholder="Second trap's field" />
        </FocusTrap>
      </div>,
    );

    screen.getByRole("button", { name: "Page chrome before" }).focus();
    await user.tab();

    expect(document.activeElement).toBe(screen.getByPlaceholderText("First trap's field"));
  });

  // A second, independent bug in the same two-instance scenario above,
  // found the same day: Radix auto-focuses a FocusScope's own first
  // tabbable child on mount whenever nothing else is meaningfully focused
  // yet — confirmed this is NOT gated by `trapped` at all, unlike the
  // ongoing Tab-capture behavior the two tests above cover. A later-
  // mounted scope (trapped or not) still steals this *initial* auto-focus
  // from an earlier one. `onMountAutoFocus`'s documented `preventDefault()`
  // escape hatch is the fix; this test would fail without it even though
  // the two tests above (which only exercise Tab *after* an explicit
  // focus reset) would still pass.
  it("a later-mounted FocusTrap doesn't steal the page's initial auto-focus from an earlier one", () => {
    render(
      <div>
        <FocusTrap trapped loop>
          <input placeholder="First trap's field" />
        </FocusTrap>
        <FocusTrap trapped={false} onMountAutoFocus={(event) => event.preventDefault()}>
          <input placeholder="Second trap's field" />
        </FocusTrap>
      </div>,
    );

    expect(document.activeElement).toBe(screen.getByPlaceholderText("First trap's field"));
  });

  it("without onMountAutoFocus prevented, a later-mounted FocusTrap does steal the initial auto-focus", () => {
    render(
      <div>
        <FocusTrap trapped loop>
          <input placeholder="First trap's field" />
        </FocusTrap>
        <FocusTrap trapped={false}>
          <input placeholder="Second trap's field" />
        </FocusTrap>
      </div>,
    );

    expect(document.activeElement).toBe(screen.getByPlaceholderText("Second trap's field"));
  });

  // A third, independent facet of the same pause mechanism, found while
  // verifying the two fixes above didn't fully resolve the original
  // report: pausing disables a scope's own keydown handler entirely
  // (Radix's `handleKeyDown` returns early when `focusScope.paused`), so
  // `loop`'s wrap-around stops working too — not just the "does a later
  // instance steal Tab/auto-focus" cases above. This holds true even when
  // the second instance has `trapped={false}` (mere mounting is enough to
  // pause the first one; `trapped`'s own value is irrelevant to the pause
  // itself). There is no prop fix for this — it's why the real Docs page
  // stopped co-mounting a second FocusTrap instance at all, rather than
  // trying to prop its way out of it.
  it("a second mounted FocusTrap (even non-trapped) pauses the first one's own loop wrap-around", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FocusTrap trapped loop>
          <input placeholder="First field" />
          <input placeholder="Second field" />
          <button type="button">Third field</button>
        </FocusTrap>
        <FocusTrap trapped={false}>
          <input placeholder="Other trap's field" />
        </FocusTrap>
      </div>,
    );

    screen.getByPlaceholderText("First field").focus();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Third field" }));

    // Without a second FocusTrap mounted, this next tab would wrap back to
    // "First field" (already proven by the "loops focus from the last..."
    // test above). With one mounted, it doesn't — this is the real,
    // confirmed limitation, not a hypothetical.
    await user.tab();
    expect(document.activeElement).not.toBe(screen.getByPlaceholderText("First field"));
  });
});
