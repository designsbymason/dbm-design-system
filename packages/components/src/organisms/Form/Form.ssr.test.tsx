import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../../atoms/Input";
import { FormField } from "../../molecules/FormField";
import { Form } from "./Form";
import type { FormProps } from "./Form.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

function Tree(props: Omit<FormProps, "children">) {
  return (
    <Form aria-label="Sign up" {...props}>
      <FormField label="Email" name="email" required>
        {(field) => <Input {...field} type="email" />}
      </FormField>
      <Form.Summary />
      <Form.Actions align="end">
        <Form.Submit>Create account</Form.Submit>
      </Form.Actions>
    </Form>
  );
}

const variants: Array<[string, Omit<FormProps, "children">]> = [
  ["a plain form", {}],
  ["a sized, gapped form", { size: "lg", gap: { base: 2, md: 6 } }],
  ["a disabled form", { disabled: true }],
  ["errors set from outside", { errors: { email: "That email is taken" } }],
  ["a form that validates on blur", { validateOn: "blur", focusTarget: "summary" }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Form on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(html).toContain("<form");
    expect(html.toLowerCase()).toContain("novalidate");
    expect(html).toContain("Create account");
    // the registration happens in an effect, so the server draws no field's error from a name it hasn't met
    if (props.errors) expect(html).toContain("That email is taken");
  });
});

describe("Form hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    let root!: ReturnType<typeof hydrateRoot>;
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <Tree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      expect(screen.getByRole("form", { name: "Sign up" })).toBeInTheDocument();
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
    error.mockRestore();
    warn.mockRestore();
  });
});
