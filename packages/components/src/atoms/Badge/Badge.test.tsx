import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./Badge";
import styles from "./Badge.module.css";

const popClass = styles.pop as string;

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("defaults to tone=danger, variant=solid", () => {
    render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-text-on-danger)",
    });
  });

  it("applies each subtle tone's background/text tokens", () => {
    // `variant="subtle"` must be explicit here — `solid` is the real
    // component default, so without this override every instance below
    // would silently render solid instead of subtle.
    const { rerender } = render(
      <Badge tone="danger" variant="subtle" data-testid="badge">
        Error
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger-subtle)",
      color: "var(--dbm-text-danger)",
    });

    rerender(
      <Badge tone="success" variant="subtle" data-testid="badge">
        Active
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-success-subtle)",
      color: "var(--dbm-text-success)",
    });

    rerender(
      <Badge tone="brand" variant="subtle" data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-brand-subtle)",
      color: "var(--dbm-text-brand)",
    });
  });

  it("applies each solid tone's background/on-tone text tokens", () => {
    const { rerender } = render(
      <Badge tone="danger" variant="solid" data-testid="badge">
        Error
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-text-on-danger)",
    });

    rerender(
      <Badge tone="success" variant="solid" data-testid="badge">
        Active
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-success)",
      color: "var(--dbm-text-on-success)",
    });

    rerender(
      <Badge tone="neutral" variant="solid" data-testid="badge">
        Draft
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-neutral)",
      color: "var(--dbm-text-on-neutral)",
    });

    rerender(
      <Badge tone="brand" variant="solid" data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-brand)",
      color: "var(--dbm-text-on-brand)",
    });
  });

  it("caps numeric children at max and appends a + suffix", () => {
    render(<Badge max={99}>{100}</Badge>);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders numeric children as-is when at or under max", () => {
    render(<Badge max={99}>{99}</Badge>);
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("ignores max for non-numeric children", () => {
    render(<Badge max={99}>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders nothing when hideZero is set and children is exactly 0", () => {
    const { container } = render(
      <Badge hideZero data-testid="badge">
        {0}
      </Badge>,
    );
    expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only anchor, with no badge, when hideZero hides a zero-count anchored badge", () => {
    render(
      <Badge hideZero anchor={<span data-testid="anchor">bell</span>} data-testid="badge">
        {0}
      </Badge>,
    );
    expect(screen.getByTestId("anchor")).toBeInTheDocument();
    expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
  });

  it("still renders normally when hideZero is set but children isn't exactly 0", () => {
    render(
      <Badge hideZero data-testid="badge">
        {3}
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveTextContent("3");
  });

  it("does not hide a zero count by default (hideZero defaults to false)", () => {
    render(<Badge data-testid="badge">{0}</Badge>);
    expect(screen.getByTestId("badge")).toHaveTextContent("0");
  });

  it("has no effect in dot mode", () => {
    render(<Badge dot hideZero aria-label="Unread" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("does not pop on initial mount", () => {
    render(<Badge data-testid="badge">5</Badge>);
    expect(screen.getByTestId("badge")).not.toHaveClass(popClass);
  });

  it("pops when content changes to a new value", async () => {
    const { rerender } = render(<Badge data-testid="badge">5</Badge>);
    rerender(<Badge data-testid="badge">6</Badge>);

    await waitFor(() => expect(screen.getByTestId("badge")).toHaveClass(popClass));
  });

  it("does not pop when rerendered with the same content", async () => {
    const { rerender } = render(<Badge data-testid="badge">5</Badge>);
    rerender(<Badge data-testid="badge">5</Badge>);

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.getByTestId("badge")).not.toHaveClass(popClass);
  });

  it("never pops in dot mode, even as its underlying tone/content context changes", async () => {
    const { rerender } = render(<Badge dot tone="danger" data-testid="badge" />);
    rerender(<Badge dot tone="success" data-testid="badge" />);

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(screen.getByTestId("badge")).not.toHaveClass(popClass);
  });

  it("renders no visible content and is aria-hidden when dot is set", () => {
    render(<Badge dot data-testid="badge" />);
    const badge = screen.getByTestId("badge");
    expect(badge).toBeEmptyDOMElement();
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("uses its own contrast-verified indicator fill per tone when dot is set, ignoring variant", () => {
    const { rerender } = render(<Badge dot tone="danger" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
    });

    // `variant="solid"` must not change the dot's fill — dot always uses
    // its own indicator token, never classFor[variant][tone].
    rerender(
      <Badge dot tone="danger" variant="solid" data-testid="badge" />,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
    });

    rerender(<Badge dot tone="warning" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-warning)",
    });

    rerender(<Badge dot tone="success" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-success)",
    });

    rerender(<Badge dot tone="info" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-info)",
    });

    rerender(<Badge dot tone="neutral" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-neutral)",
    });

    rerender(<Badge dot tone="brand" data-testid="badge" />);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-brand)",
    });
  });

  it("exposes role=img and is not aria-hidden when dot is set alongside an explicit aria-label", () => {
    render(<Badge dot aria-label="Unread notifications" />);
    const badge = screen.getByRole("img", { name: "Unread notifications" });
    expect(badge).not.toHaveAttribute("aria-hidden");
  });

  it("does not warn when dot and children aren't combined", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Badge dot aria-label="Unread notifications" />);
    render(<Badge>New</Badge>);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when children is provided alongside dot", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Badge dot>New</Badge>);
    rerender(<Badge dot>Newer</Badge>);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`children` was provided alongside `dot`"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("forwards ref to the underlying span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>New</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards className and native props", () => {
    render(
      <Badge className="custom" data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("custom");
  });

  it("defaults to size=md", () => {
    render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId("badge")).toHaveStyle({
      fontSize: "var(--dbm-font-size-sm)",
      paddingInline: "var(--dbm-badge-padding-inline-md)",
      height: "var(--dbm-badge-size-md)",
      minWidth: "var(--dbm-badge-size-md)",
    });
  });

  it("gives every size its own distinct dot diameter", () => {
    const expected: Record<string, string> = {
      xs: "var(--dbm-space-1)",
      sm: "var(--dbm-space-2)",
      md: "var(--dbm-space-3)",
      lg: "var(--dbm-space-4)",
      xl: "var(--dbm-space-5)",
    };
    const { rerender } = render(<Badge dot size="xs" data-testid="badge" />);
    for (const [size, width] of Object.entries(expected)) {
      rerender(
        <Badge dot size={size as "xs" | "sm" | "md" | "lg" | "xl"} data-testid="badge" />,
      );
      expect(screen.getByTestId("badge")).toHaveStyle({ width, height: width });
    }
    // No two sizes should collapse to the same diameter.
    expect(new Set(Object.values(expected)).size).toBe(5);
  });

  it("gives every size a height/min-width sized to fit its own padding-inline", () => {
    const expected: Record<string, { paddingInline: string; diameter: string }> = {
      xs: { paddingInline: "var(--dbm-badge-padding-inline-xs)", diameter: "var(--dbm-badge-size-xs)" },
      sm: { paddingInline: "var(--dbm-badge-padding-inline-sm)", diameter: "var(--dbm-badge-size-sm)" },
      md: { paddingInline: "var(--dbm-badge-padding-inline-md)", diameter: "var(--dbm-badge-size-md)" },
      lg: { paddingInline: "var(--dbm-badge-padding-inline-lg)", diameter: "var(--dbm-badge-size-lg)" },
      xl: { paddingInline: "var(--dbm-badge-padding-inline-xl)", diameter: "var(--dbm-badge-size-xl)" },
    };
    const { rerender } = render(<Badge size="xs" data-testid="badge" />);
    for (const [size, { paddingInline, diameter }] of Object.entries(expected)) {
      rerender(<Badge size={size as "xs" | "sm" | "md" | "lg" | "xl"} data-testid="badge" />);
      expect(screen.getByTestId("badge")).toHaveStyle({
        paddingInline,
        height: diameter,
        minWidth: diameter,
      });
    }
  });

  // jsdom doesn't implement real text layout (getBoundingClientRect() is
  // always zeroed), so the actual circle-vs-pill rendering is verified
  // visually in Storybook, not here — this asserts the CSS mechanism
  // that produces it is wired correctly: a fixed `height` (never grows)
  // paired with `min-width` rather than a fixed `width` (so content wider
  // than the diameter is free to push the box wider, elongating it into a
  // pill; a single character has nothing to push past the floor, and
  // `border-radius: full` turns the resulting square into a circle).
  it("fixes height but leaves width free to grow past min-width", () => {
    render(<Badge size="lg" data-testid="badge" />);
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveStyle({
      height: "var(--dbm-badge-size-lg)",
      minWidth: "var(--dbm-badge-size-lg)",
    });
    expect(getComputedStyle(badge).width).toBe("auto");
  });

  it("renders as a single element with no wrapper when anchor is unset", () => {
    const { container } = render(<Badge data-testid="badge">New</Badge>);
    expect(container.firstChild).toBe(screen.getByTestId("badge"));
  });

  it("renders anchor content alongside the badge when anchor is set", () => {
    render(
      <Badge
        anchor={<span data-testid="icon">🔔</span>}
        dot
        tone="danger"
        aria-label="Unread notifications"
      />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Unread notifications" })).toBeInTheDocument();
  });

  it("forwards ref to the badge itself, not the anchor wrapper", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} anchor={<span>icon</span>} data-testid="badge">
        3
      </Badge>,
    );
    expect(ref.current).toBe(screen.getByTestId("badge"));
  });

  it("only positions itself absolutely when anchor is set", () => {
    const { rerender } = render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId("badge")).not.toHaveStyle({ position: "absolute" });

    rerender(
      <Badge anchor={<span>icon</span>} data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({ position: "absolute" });
  });

  it("positions the badge at the requested corner", () => {
    // Checked via the `--badge-position-transform` custom property, not a
    // resolved `transform` value — `.positioned` reads it back through
    // `var(--badge-position-transform, none)` (rather than each position
    // class setting `transform` directly) so the pop animation's own
    // `scale(...)` can compose with it instead of one clobbering the
    // other; jsdom doesn't resolve custom properties into the final
    // `transform` value the way a real browser would.
    const { rerender } = render(
      <Badge anchor={<span>icon</span>} data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      "--badge-position-transform": "translate(50%,-50%)",
    });

    rerender(
      <Badge anchor={<span>icon</span>} position="bottom-left" data-testid="badge">
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      "--badge-position-transform": "translate(-50%,50%)",
    });
  });

  it("has no accessibility violations across tones and variants", async () => {
    const { container, rerender } = render(<Badge tone="neutral">Draft</Badge>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Badge tone="danger">Error</Badge>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Badge tone="warning" variant="solid">
        Pending
      </Badge>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Badge tone="brand" variant="subtle">
        New
      </Badge>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations in anchor mode", async () => {
    const { container } = render(
      <Badge
        anchor={<button type="button">Notifications</button>}
        dot
        tone="danger"
        aria-label="Unread notifications"
      />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
