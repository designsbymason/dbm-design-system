import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds the two
// together. A row may name several tokens, separated by " / ". (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms/Navbar");
const css = readFileSync(join(folder, "Navbar.module.css"), "utf8");
const mdx = readFileSync(join(folder, "Navbar.mdx"), "utf8");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set(
  [...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) =>
    (match[1] as string).split("/").map((token) => token.trim().replace(/\./g, "-")),
  ),
);

describe("Navbar's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(20);
    expect(listedTokens.size).toBeGreaterThan(20);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheet does not use", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});

// A prop that is in the types but missing from a Properties table or the Controls panel, or listed in a different order from the
// types, is the kind of drift this holds off: one order for the types, the Docs tables (the `*PropOrder` arrays in the Docs page),
// each part's stories and the Playground's args.
const types = readFileSync(join(folder, "Navbar.types.ts"), "utf8");

function declaredProps(interfaceName: string): string[] {
  const body = new RegExp(`export interface ${interfaceName}[^{]*\\{(.*?)\\n\\}\\n`, "s").exec(types)?.[1] ?? "";
  return [...body.matchAll(/^ {2}("?[A-Za-z][\w-]*"?)\??:/gm)].map((match) => (match[1] as string).replace(/"/g, ""));
}

function docsOrder(name: string): string[] {
  const body = new RegExp(`export const ${name} = \\[(.*?)\\];`, "s").exec(mdx)?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((match) => match[1] as string);
}

function argTypeKeys(file: string): string[] {
  const source = readFileSync(join(folder, file), "utf8");
  const body = /argTypes: \{\n(.*?)\n {2}\},\n/s.exec(source)?.[1] ?? "";
  return [...body.matchAll(/^ {4}("?[A-Za-z][\w-]*"?): [{r]/gm)].map((match) => (match[1] as string).replace(/"/g, ""));
}

const parts: Array<[string, string, string]> = [
  ["NavbarProps", "propOrder", "NavbarRoot.stories.tsx"],
  ["NavbarBrandProps", "brandPropOrder", "NavbarBrand.stories.tsx"],
  ["NavbarLinksProps", "linksPropOrder", "NavbarLinks.stories.tsx"],
  ["NavbarLinkProps", "linkPropOrder", "NavbarLink.stories.tsx"],
  ["NavbarGroupProps", "groupPropOrder", "NavbarGroup.stories.tsx"],
  ["NavbarActionProps", "actionPropOrder", "NavbarAction.stories.tsx"],
  ["NavbarPanelActionsProps", "panelActionsPropOrder", "NavbarPanelActions.stories.tsx"],
  ["NavbarSkipLinkProps", "skipLinkPropOrder", "NavbarSkipLink.stories.tsx"],
  ["NavbarActionsProps", "actionsPropOrder", "NavbarActions.stories.tsx"],
  ["NavbarMenuButtonProps", "menuButtonPropOrder", "NavbarMenuButton.stories.tsx"],
];

describe("Navbar's props, in the types, the Docs tables and the Controls panels", () => {
  it.each(parts)("%s: the types, the Docs table order and the part's stories list the same props in the same order", (name, orderName, file) => {
    const declared = declaredProps(name);
    expect(declared.length).toBeGreaterThan(3);
    expect(docsOrder(orderName)).toEqual(declared);
    expect(argTypeKeys(file)).toEqual(declared);
  });

  it("the Playground lists every root prop in the same order, and its editable ones in the Docs panel's order", () => {
    const source = readFileSync(join(folder, "Navbar.stories.tsx"), "utf8");
    const argsBody = /\n {2}args: \{\n(.*?)\n {2}\},\n/s.exec(source)?.[1] ?? "";
    const argKeys = [...argsBody.matchAll(/^ {4}("?[A-Za-z][\w-]*"?): /gm)].map((match) => (match[1] as string).replace(/"/g, ""));
    expect(argKeys).toEqual(declaredProps("NavbarProps"));
    const meta = argTypeKeys("Navbar.stories.tsx");
    expect(meta).toEqual(declaredProps("NavbarProps"));
    const panel = docsOrder("playgroundOrder");
    expect(panel).toEqual(declaredProps("NavbarProps").filter((prop) => panel.includes(prop)));
  });
});

describe("Navbar's snippets and stories", () => {
  const snippets = readFileSync(join(folder, "Navbar.snippets.ts"), "utf8");
  const stories = readFileSync(join(folder, "Navbar.stories.tsx"), "utf8");
  const keys = [...(/export const navbarSnippets = \{(.*?)\n\} as const;/s.exec(snippets)?.[1] ?? "").matchAll(/^ {2}(\w+): `/gm)].map(
    (match) => match[1] as string,
  );

  it("has a snippet key for every visible story, and no snippet that no story shows", () => {
    const used = new Set([...stories.matchAll(/navbarSnippets\.(\w+)/g)].map((match) => match[1] as string));
    expect(keys.length).toBeGreaterThan(15);
    expect(keys.filter((key) => !used.has(key))).toEqual([]);
    expect([...used].filter((key) => !keys.includes(key))).toEqual([]);
  });
});
