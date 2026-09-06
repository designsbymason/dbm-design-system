import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Blockquote } from "./Blockquote";

describe("Blockquote", () => {
  it("renders a native blockquote with its content", () => {
    render(<Blockquote>Design is how it works.</Blockquote>);
    expect(screen.getByText("Design is how it works.").closest("blockquote")).toBeInTheDocument();
  });

  it("applies the secondary (Lora) font family token", () => {
    render(<Blockquote>Design is how it works.</Blockquote>);
    expect(screen.getByText("Design is how it works.").closest("blockquote")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-secondary)",
    });
  });

  it("does not render a footer when attribution is omitted", () => {
    render(<Blockquote>Design is how it works.</Blockquote>);
    expect(screen.queryByText("—", { exact: false })).not.toBeInTheDocument();
  });

  it("renders attribution in a footer/cite when provided", () => {
    render(
      <Blockquote attribution="Steve Jobs">Design is how it works.</Blockquote>,
    );
    const cite = screen.getByText("Steve Jobs");
    expect(cite.tagName).toBe("CITE");
    expect(cite.closest("footer")).toBeInTheDocument();
  });

  it("forwards native blockquote props like cite", () => {
    render(
      <Blockquote cite="https://example.com">
        Design is how it works.
      </Blockquote>,
    );
    expect(
      screen.getByText("Design is how it works.").closest("blockquote"),
    ).toHaveAttribute("cite", "https://example.com");
  });

  it("forwards ref to the native blockquote", () => {
    const ref = createRef<HTMLQuoteElement>();
    render(<Blockquote ref={ref}>Design is how it works.</Blockquote>);
    expect(ref.current?.tagName).toBe("BLOCKQUOTE");
  });

  it("applies className", () => {
    render(
      <Blockquote className="custom">Design is how it works.</Blockquote>,
    );
    expect(
      screen.getByText("Design is how it works.").closest("blockquote"),
    ).toHaveClass("custom");
  });

  it("forwards id, style, and data-testid", () => {
    render(
      <Blockquote id="quote-1" style={{ opacity: 0.5 }} data-testid="quote">
        Design is how it works.
      </Blockquote>,
    );
    const blockquote = screen.getByTestId("quote");
    expect(blockquote).toHaveAttribute("id", "quote-1");
    expect(blockquote).toHaveStyle({ opacity: "0.5" });
  });

  it("does not render a decorative quote mark for the default variant", () => {
    render(<Blockquote>Design is how it works.</Blockquote>);
    expect(
      screen.getByText("Design is how it works.").closest("blockquote"),
    ).not.toHaveTextContent("“");
  });

  it("renders an aria-hidden decorative quote mark for the pull-quote variant", () => {
    render(
      <Blockquote variant="pull-quote">Design is how it works.</Blockquote>,
    );
    const mark = screen.getByText("“");
    expect(mark).toHaveAttribute("aria-hidden", "true");
  });

  it("has no accessibility violations, plain, with attribution, or as a pull-quote", async () => {
    const { container, rerender } = render(
      <Blockquote>Design is how it works.</Blockquote>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Blockquote attribution="Steve Jobs">Design is how it works.</Blockquote>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Blockquote variant="pull-quote" attribution="Steve Jobs">
        Design is how it works.
      </Blockquote>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
