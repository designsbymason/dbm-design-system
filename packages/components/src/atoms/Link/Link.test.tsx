import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Link } from "./Link";

describe("Link", () => {
  it("renders an anchor with the given href", () => {
    render(<Link href="/docs">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("does not treat a relative href as external", () => {
    render(<Link href="/docs">Docs</Link>);
    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("auto-detects an absolute http(s) href as external", () => {
    render(<Link href="https://example.com">External</Link>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("respects an explicit `external` override", () => {
    render(
      <Link href="/internal-but-forced-external" external>
        Forced
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the external-link icon only when external", () => {
    const { rerender } = render(<Link href="/docs">Docs</Link>);
    expect(document.querySelector("svg")).not.toBeInTheDocument();

    rerender(<Link href="https://example.com">External</Link>);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the single child via Slot when asChild is set, without the icon", () => {
    render(
      <Link asChild href="https://example.com" external>
        <button type="button">Custom element</button>
      </Link>,
    );
    const el = screen.getByRole("button", { name: "Custom element" });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("href", "https://example.com");
    expect(document.querySelector("svg")).not.toBeInTheDocument();
  });

  it("forwards ref to the underlying anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs">
        Docs
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards className and native props", () => {
    render(
      <Link href="/docs" className="custom" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId("link")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Link href="https://example.com">Accessible external link</Link>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
