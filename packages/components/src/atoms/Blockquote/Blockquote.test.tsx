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

  it("has no accessibility violations, plain or with attribution", async () => {
    const { container, rerender } = render(
      <Blockquote>Design is how it works.</Blockquote>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Blockquote attribution="Steve Jobs">Design is how it works.</Blockquote>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
