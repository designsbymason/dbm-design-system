import { describe, expect, it } from "vitest";
import { MAX_HIGHLIGHT_LENGTH, resolveLanguage, tokenize } from "./tokenize";

/** Every token of the first line, as `[type, text]`, leaving out plain text so a test says only what it means. */
const typed = (code: string, language: string) =>
  tokenize(code, language)
    .flat()
    .filter((token) => token.type)
    .map((token) => [token.type, token.text]);

const rejoin = (code: string, language: string) =>
  tokenize(code, language)
    .map((line) => line.map((token) => token.text).join(""))
    .join("\n");

const languages = ["js", "jsx", "ts", "tsx", "json", "css", "html", "bash", "diff", "text", undefined];

const samples = [
  "",
  "\n",
  "const a = 1;\nlet b = 'two' + \"three\" + `four ${five}`;\n// comment\n/* block\ncomment */",
  '<Button variant="primary" onClick={() => go()}>Save</Button>\n<div className="x" />',
  '{ "name": "dbm", "n": [1, 2.5e3, -4], "ok": true, "none": null }',
  ".btn:hover { color: #fff; margin: 0 auto !important; width: calc(100% - 2rem); }\n@media (min-width: 640px) { a { b: c } }",
  '<!doctype html>\n<a href="/x" data-y=\'z\' disabled>Link &amp; more</a><!-- note -->',
  "# comment\n$ npm install --save-dev foo\nif [ -f \"$FILE\" ]; then echo ${HOME} | grep -v x; fi",
  "diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n-old\n+new\n same",
  "unterminated 'string\nand /* comment\nand `template\nand <tag attr=\"open",
  "\r\nwindows\r\nline endings\r\n",
  "émoji 😀 and   separators \t tabs",
];

describe("tokenize", () => {
  it.each(languages.flatMap((language) => samples.map((sample) => [language, sample] as const)))(
    "gives back exactly what it was given (%s)",
    (language, sample) => {
      const expected = sample.replace(/\r\n?/g, "\n").replace(/\n$/, "");
      expect(rejoin(sample, language ?? "")).toBe(expected);
    },
  );

  it("gives back arbitrary text unchanged, and always finishes", () => {
    // A deterministic stream of awkward characters, so a rule that could loop or drop a character fails.
    const alphabet = "abc XYZ_$0189.,;:=+-*/\\'\"`<>{}()[]#@!&%\n\t-";
    let seed = 42;
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296);
    for (let round = 0; round < 60; round++) {
      let text = "";
      for (let index = 0; index < 400; index++) text += alphabet[next() % alphabet.length];
      for (const language of languages) {
        expect(rejoin(text, language ?? "")).toBe(text.replace(/\n$/, ""));
      }
    }
  });

  it("returns one line per line of the text, and one empty line for no text", () => {
    expect(tokenize("a\nb\nc", "js")).toHaveLength(3);
    expect(tokenize("", "js")).toEqual([[]]);
    expect(tokenize("a\n\nb", "text")).toEqual([[{ text: "a" }], [], [{ text: "b" }]]);
  });

  it("drops one trailing newline and normalises line endings", () => {
    expect(tokenize("a\n", "text")).toHaveLength(1);
    expect(tokenize("a\n\n", "text")).toHaveLength(2);
    expect(tokenize("a\r\nb", "text")).toEqual([[{ text: "a" }], [{ text: "b" }]]);
  });

  it("draws an unknown language, and no language, as plain text", () => {
    expect(typed("const a = 1", "cobol")).toEqual([]);
    expect(typed("const a = 1", "")).toEqual([]);
    expect(tokenize("const a = 1", undefined)).toEqual([[{ text: "const a = 1" }]]);
  });

  it("draws text past the size limit as plain text", () => {
    const long = "const a = 1;\n".repeat(Math.ceil(MAX_HIGHLIGHT_LENGTH / 12) + 1);
    expect(long.length).toBeGreaterThan(MAX_HIGHLIGHT_LENGTH);
    expect(typed(long, "js")).toEqual([]);
    expect(typed("const a = 1;", "js").length).toBeGreaterThan(0);
  });

  it("finishes quickly on a large unterminated input", () => {
    const start = performance.now();
    tokenize(`/* ${"x".repeat(MAX_HIGHLIGHT_LENGTH - 10)}`, "js");
    tokenize(`"${"\\".repeat(MAX_HIGHLIGHT_LENGTH - 10)}`, "js");
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

describe("resolveLanguage", () => {
  it("knows the aliases, in any case", () => {
    expect(resolveLanguage("TypeScript")).toBe("ts");
    expect(resolveLanguage(" sh ")).toBe("bash");
    expect(resolveLanguage("patch")).toBe("diff");
    expect(resolveLanguage("svg")).toBe("html");
    expect(resolveLanguage("cobol")).toBeUndefined();
    expect(resolveLanguage(undefined)).toBeUndefined();
  });
});

describe("JavaScript and TypeScript", () => {
  it("recognises keywords, literals, numbers, strings and comments", () => {
    expect(typed("const n = 42; // note", "ts")).toEqual([
      ["keyword", "const"],
      ["number", "42"],
      ["comment", "// note"],
    ]);
    expect(typed("return true && null", "js")).toEqual([
      ["keyword", "return"],
      ["number", "true"],
      ["number", "null"],
    ]);
    expect(typed("x = 'a' + \"b\" + `c`", "js").map(([type]) => type)).toEqual(["string", "string", "string"]);
    expect(typed("0xFF 1_000 2.5e3 10n", "js").map(([, text]) => text)).toEqual(["0xFF", "1_000", "2.5e3", "10n"]);
  });

  it("spans lines with a block comment or a template literal", () => {
    const lines = tokenize("/* one\ntwo */ x\n`a\nb`", "js");
    expect(lines.map((line) => line.map((token) => token.type))).toEqual([["comment"], ["comment", undefined], ["string"], ["string"]]);
  });

  it("tells a call from a name, and a type from a value", () => {
    expect(typed("run(1); const user = new User(); Promise.all(x)", "ts")).toEqual([
      ["function", "run"],
      ["number", "1"],
      ["keyword", "const"],
      ["keyword", "new"],
      ["type", "User"],
      ["type", "Promise"],
      ["function", "all"],
    ]);
  });

  it("colours TypeScript's built-in type names in ts and tsx only", () => {
    expect(typed("let a: string | number", "ts").filter(([type]) => type === "type").map(([, text]) => text)).toEqual(["string", "number"]);
    expect(typed("const x: unknown = 1", "tsx").filter(([type]) => type === "type").map(([, text]) => text)).toEqual(["unknown"]);
    expect(typed("let string = number", "js").filter(([type]) => type === "type")).toEqual([]);
    expect(typed("let string = number", "jsx").filter(([type]) => type === "type")).toEqual([]);
  });

  it("does not take a digit inside a name for a number", () => {
    expect(typed("const a1 = b2 + c_3", "js")).toEqual([["keyword", "const"]]);
  });

  it("treats from and type as keywords only where a statement uses them", () => {
    expect(typed("import { a } from 'x'", "ts")).toEqual([
      ["keyword", "import"],
      ["keyword", "from"],
      ["string", "'x'"],
    ]);
    expect(typed("const from = 1; const type = 2", "ts").map(([, text]) => text)).toEqual(["const", "1", "const", "2"]);
    expect(typed("export type Props = { a: 1 }", "ts").slice(0, 3)).toEqual([
      ["keyword", "export"],
      ["keyword", "type"],
      ["type", "Props"],
    ]);
  });

  it("colours JSX tags and attributes only in jsx and tsx", () => {
    expect(typed('<Button variant="primary">Go</Button>', "tsx")).toEqual([
      ["tag", "<Button"],
      ["property", "variant"],
      ["string", '"primary"'],
      ["tag", ">"],
      ["tag", "</Button"],
      ["tag", ">"],
    ]);
    expect(typed("<div />", "ts")).toEqual([]);
  });

  it("draws the text between tags, and a word inside it, as plain text", () => {
    expect(typed("<Button>Save Now</Button>", "tsx").filter(([type]) => type === "type" || type === "keyword")).toEqual([]);
    expect(typed("<p>const if new</p>", "jsx").filter(([type]) => type === "keyword")).toEqual([]);
  });

  it("goes back to code inside a { expression } in the text, and back to text after it", () => {
    expect(typed("<p>Hi {user.name ?? 'x'} there</p>", "jsx").filter(([type]) => type === "string" || type === "type")).toEqual([["string", "'x'"]]);
    expect(typed("<p>{list.map((i) => <b>{i}</b>)} tail</p>", "jsx").filter(([type]) => type === "tag").map(([, text]) => text)).toEqual([
      "<p", ">", "<b", ">", "</b", ">", "</p", ">",
    ]);
  });

  it("colours a fragment and a self-closing tag, and keeps an arrow's > inside an attribute", () => {
    expect(typed("<><Icon onClick={() => go()} /></>", "tsx").filter(([type]) => type === "tag").map(([, text]) => text)).toEqual(["<", ">", "<Icon", "/>", "</", ">"]);
    expect(typed("<Icon onClick={() => go()} />x", "tsx").filter(([type]) => type === "function")).toEqual([["function", "go"]]);
  });

  it("goes back to code after an element is closed", () => {
    expect(typed("const a = <b>x const</b>;\nconst c = 1;", "jsx").filter(([type]) => type === "keyword").map(([, text]) => text)).toEqual(["const", "const"]);
    expect(typed("<a><b>x</b>y if</a>\nreturn 1", "jsx").filter(([type]) => type === "keyword").map(([, text]) => text)).toEqual(["return"]);
  });

  it("does not take a generic or a comparison for a tag", () => {
    expect(typed("const a: Array<string> = []; if (a < b) {}", "tsx").filter(([type]) => type === "tag")).toEqual([]);
  });

  it("does not take an assignment for an attribute outside a tag", () => {
    expect(typed("a=1; b == c", "jsx").filter(([type]) => type === "property")).toEqual([]);
  });
});

describe("JSON", () => {
  it("tells a key from a string value", () => {
    expect(typed('{ "a": "b", "c": [1, -2.5, true, null] }', "json")).toEqual([
      ["property", '"a"'],
      ["string", '"b"'],
      ["property", '"c"'],
      ["number", "1"],
      ["number", "-2.5"],
      ["number", "true"],
      ["number", "null"],
    ]);
  });
});

describe("CSS", () => {
  it("tells a property from a pseudo-class, and colours values, at-rules and selectors", () => {
    expect(typed("a:hover { color: #fff; margin: 0 auto !important; }", "css")).toEqual([
      ["property", "color"],
      ["number", "#fff"],
      ["property", "margin"],
      ["number", "0"],
      ["keyword", "!important"],
    ]);
    expect(typed("@media (min-width: 640px) { .btn { width: calc(100% - 2rem); --x: 1px } }", "css")).toEqual([
      ["keyword", "@media"],
      ["number", "640px"],
      ["type", ".btn"],
      ["property", "width"],
      ["function", "calc"],
      ["number", "100%"],
      ["number", "2rem"],
      ["property", "--x"],
      ["number", "1px"],
    ]);
  });

  it("does not take a digit in a name for a number", () => {
    expect(typed("h1 { grid-column: col-2 }", "css")).toEqual([["property", "grid-column"]]);
  });
});

describe("HTML", () => {
  it("colours tags, attributes, strings, comments and entities, but not the text between tags", () => {
    expect(typed('<a href="/x" disabled>It\'s &amp; fine</a><!-- n -->', "html")).toEqual([
      ["tag", "<a"],
      ["property", "href"],
      ["string", '"/x"'],
      ["property", "disabled"],
      ["tag", ">"],
      ["number", "&amp;"],
      ["tag", "</a"],
      ["tag", ">"],
      ["comment", "<!-- n -->"],
    ]);
  });
});

describe("HTML text", () => {
  it("does not take a quote in the text between tags for a string", () => {
    expect(typed('He said "hi" and it\'s <b>x</b>', "html").filter(([type]) => type === "string")).toEqual([]);
  });
});

describe("shell", () => {
  it("colours commands, flags, variables, strings, keywords and comments", () => {
    expect(typed('$ npm install --save-dev foo # go', "bash")).toEqual([
      ["function", "npm"],
      ["property", "--save-dev"],
      ["comment", "# go"],
    ]);
    expect(typed('if [ -f "$F" ]; then echo ${HOME} | grep -v x; fi', "bash").map(([type, text]) => `${type}:${text}`)).toEqual([
      "keyword:if",
      "property:-f",
      "string:\"$F\"",
      "keyword:then",
      "function:echo",
      "property:${HOME}",
      "function:grep",
      "property:-v",
      "keyword:fi",
    ]);
  });

  it("does not take a digit inside a word for a number", () => {
    expect(typed("echo file2 x10 7", "bash").filter(([type]) => type === "number")).toEqual([["number", "7"]]);
  });

  it("does not take a # inside a word for a comment", () => {
    expect(typed("echo a#b", "bash").filter(([type]) => type === "comment")).toEqual([]);
  });
});

describe("diff", () => {
  it("colours a line by how it starts", () => {
    expect(tokenize("diff --git a b\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-old\n+new\n same", "diff").map((line) => line[0]?.type)).toEqual([
      "comment",
      "comment",
      "comment",
      "keyword",
      "deleted",
      "inserted",
      undefined,
    ]);
  });
});
