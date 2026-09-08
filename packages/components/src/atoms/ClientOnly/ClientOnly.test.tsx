import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
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

  // A plain client-only render (React's `createRoot`, which is what RTL's
  // `render()` uses under the hood) has no server HTML to reconcile
  // against, so there's no hydration mismatch to guard against — children
  // render immediately, from the very first commit, with no intermediate
  // fallback frame. This is a real, verified behavioral fact, not an
  // assumption: see the `hydrateRoot`-based test below for the one context
  // where a fallback frame genuinely does appear first.
  it("renders children immediately in a plain client-only render, never showing fallback", () => {
    render(
      <ClientOnly fallback={<span>Fallback</span>}>
        <span>Children</span>
      </ClientOnly>,
    );
    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
  });

  describe("hydrating real server-rendered HTML", () => {
    let container: HTMLDivElement | undefined;
    let root: ReturnType<typeof hydrateRoot> | undefined;

    afterEach(() => {
      root?.unmount();
      container?.remove();
      container = undefined;
      root = undefined;
    });

    it("shows fallback on the hydration commit, then swaps to children once hydration finishes", async () => {
      const element = (
        <ClientOnly fallback={<span>Fallback</span>}>
          <span>Children</span>
        </ClientOnly>
      );
      container = document.createElement("div");
      container.innerHTML = renderToStaticMarkup(element);
      document.body.appendChild(container);

      // No `act()` here on purpose — `act()` flushes all pending work
      // synchronously, which collapses the two real, separate commits
      // (hydration's own snapshot, then the client's follow-up update)
      // into one and would hide the very frame this test exists to check.
      root = hydrateRoot(container, element);

      expect(container.textContent).toBe("Fallback");

      await waitFor(() => {
        expect(container?.textContent).toBe("Children");
      });
    });
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
