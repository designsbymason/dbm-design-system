import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("defaults to tone=neutral, variant=subtle", () => {
    render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-subtle)",
      color: "var(--dbm-text-secondary)",
    });
  });

  it("applies each subtle tone's background/text tokens", () => {
    const { rerender } = render(
      <Badge tone="danger" data-testid="badge">
        Error
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger-subtle)",
      color: "var(--dbm-text-danger)",
    });

    rerender(
      <Badge tone="success" data-testid="badge">
        Active
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-success-subtle)",
      color: "var(--dbm-text-success)",
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
      backgroundColor: "var(--dbm-bg-neutral-strong)",
      color: "var(--dbm-text-on-neutral)",
    });
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
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
