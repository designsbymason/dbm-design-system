import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Backdrop } from "./Backdrop";

describe("Backdrop", () => {
  it("renders into document.body by default (portaled)", () => {
    const { container } = render(<Backdrop data-testid="scrim" />);
    expect(container).not.toContainElement(screen.getByTestId("scrim"));
    expect(document.body).toContainElement(screen.getByTestId("scrim"));
  });

  it("renders in place when inPortal is false", () => {
    const { container } = render(
      <Backdrop inPortal={false} data-testid="scrim" />,
    );
    expect(container).toContainElement(screen.getByTestId("scrim"));
  });

  it("applies a token-driven background color, alpha mixed in rather than set via element opacity", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    const backgroundColor = getComputedStyle(
      screen.getByTestId("scrim"),
    ).backgroundColor;
    expect(backgroundColor).toContain("var(--dbm-bg-overlay)");
    expect(backgroundColor).toContain("color-mix");
  });

  it("defaults to opacity 60, applied via a CSS custom property rather than the element's own opacity", () => {
    // Deliberately not the element's own `opacity` — see Backdrop.tsx's
    // own comment: `opacity < 1` combined with `backdrop-filter` blends
    // the whole element back with the sharp content behind it, visibly
    // weakening the blur. The fill's alpha is mixed into the background
    // color instead, driven by this custom property.
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    const scrim = screen.getByTestId("scrim");
    expect(scrim).toHaveStyle({
      "--dbm-backdrop-fill-opacity": "var(--dbm-opacity-60)",
    });
    expect(scrim).not.toHaveStyle({ opacity: "var(--dbm-opacity-60)" });
  });

  it("applies a custom opacity via the same custom property", () => {
    render(<Backdrop inPortal={false} opacity={90} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      "--dbm-backdrop-fill-opacity": "var(--dbm-opacity-90)",
    });
  });

  it("does not blur by default", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).not.toHaveStyle({
      backdropFilter: "blur(var(--dbm-space-1))",
    });
  });

  it("applies a backdrop-filter blur when blur is true", () => {
    render(<Backdrop inPortal={false} blur data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      backdropFilter: "blur(var(--dbm-space-1))",
    });
  });

  it("calls onClick when clicked, for click-to-dismiss", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Backdrop inPortal={false} onClick={onClick} data-testid="scrim" />);
    await user.click(screen.getByTestId("scrim"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards ref to the scrim element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Backdrop inPortal={false} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className", () => {
    render(<Backdrop inPortal={false} className="custom" data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Backdrop inPortal={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("is present by default (open defaults to true)", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveAttribute("data-state", "open");
  });

  it("does not render when open is false", () => {
    render(<Backdrop inPortal={false} open={false} data-testid="scrim" />);
    expect(screen.queryByTestId("scrim")).not.toBeInTheDocument();
  });

  it("removes the scrim when open flips from true to false", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
          <Backdrop inPortal={false} open={open} data-testid="scrim" />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByTestId("scrim")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("scrim")).not.toBeInTheDocument();
  });

  it("does not let a same-named consumer prop override the computed data-state", () => {
    // Regression test for the {...props}-ordering bug class (see
    // 05-component-api-conventions.md §3) — {...props} must spread before
    // the computed data-state attribute, not after, or a same-named
    // consumer prop silently wins and breaks the fadeIn/fadeOut animation.
    render(
      // `data-state` isn't a declared prop, but TypeScript's `data-*`
      // exemption type-checks it anyway regardless (confirmed empirically
      // elsewhere in this codebase — see 05-component-api-conventions.md
      // §3), which is exactly why the computed value needs protecting.
      <Backdrop inPortal={false} data-state="banana" data-testid="scrim" />,
    );
    expect(screen.getByTestId("scrim")).toHaveAttribute("data-state", "open");
  });

  it("renders children centered on top of the dimming fill", () => {
    render(
      <Backdrop inPortal={false}>
        <span>Loading…</span>
      </Backdrop>,
    );
    expect(screen.getByText("Loading…")).toBeVisible();
  });
});
