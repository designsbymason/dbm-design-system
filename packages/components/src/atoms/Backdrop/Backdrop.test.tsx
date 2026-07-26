import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
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

  it("applies a token-driven background color", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-overlay)",
    });
  });

  it("defaults to opacity 60", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      opacity: "var(--dbm-opacity-60)",
    });
  });

  it("applies a custom opacity", () => {
    render(<Backdrop inPortal={false} opacity={90} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      opacity: "var(--dbm-opacity-90)",
    });
  });

  it("does not blur by default", () => {
    render(<Backdrop inPortal={false} data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).not.toHaveStyle({
      backdropFilter: "blur(var(--dbm-space-2))",
    });
  });

  it("applies a backdrop-filter blur when blur is true", () => {
    render(<Backdrop inPortal={false} blur data-testid="scrim" />);
    expect(screen.getByTestId("scrim")).toHaveStyle({
      backdropFilter: "blur(var(--dbm-space-2))",
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
});
