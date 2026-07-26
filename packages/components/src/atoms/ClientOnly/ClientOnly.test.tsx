import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClientOnly } from "./ClientOnly";

describe("ClientOnly", () => {
  it("renders the fallback, not children, during server-side rendering", () => {
    const html = renderToStaticMarkup(
      <ClientOnly fallback={<span>Fallback</span>}>
        <span>Children</span>
      </ClientOnly>,
    );
    expect(html).toContain("Fallback");
    expect(html).not.toContain("Children");
  });

  it("renders nothing during server-side rendering when fallback is omitted", () => {
    const html = renderToStaticMarkup(
      <ClientOnly>
        <span>Children</span>
      </ClientOnly>,
    );
    expect(html).toBe("");
  });

  it("renders children after mounting on the client", async () => {
    render(
      <ClientOnly fallback={<span>Fallback</span>}>
        <span>Children</span>
      </ClientOnly>,
    );
    expect(await screen.findByText("Children")).toBeInTheDocument();
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
  });

  it("has no accessibility violations once mounted", async () => {
    const { container } = render(
      <ClientOnly>
        <button type="button">Click me</button>
      </ClientOnly>,
    );
    await screen.findByText("Click me");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
