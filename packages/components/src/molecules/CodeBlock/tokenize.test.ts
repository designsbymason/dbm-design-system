import { describe, expect, it } from "vitest";
import { goLanguage, javaLanguage, markdownLanguage, pythonLanguage, rustLanguage, sqlLanguage, yamlLanguage } from "./grammars";
import { registerCodeLanguage } from "./registry";
import { MAX_HIGHLIGHT_LENGTH, resolveLanguage, tokenize } from "./tokenize";

// The seven languages that ship outside the core are opt-in; this suite exercises their grammars through `tokenize`,
// as an app that registers them would. (`registry.test.ts` covers what registering does, and not doing it.)
for (const language of [pythonLanguage, yamlLanguage, sqlLanguage, markdownLanguage, goLanguage, rustLanguage, javaLanguage]) {
  registerCodeLanguage(language);
}

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

const languages = ["js", "jsx", "ts", "tsx", "json", "css", "html", "bash", "diff", "python", "yaml", "sql", "markdown", "go", "rust", "java", "text", undefined];

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
  '@app.route("/x")\nclass Foo(Base):\n    """Doc\n    string."""\n    def bar(self, n: int = 3) -> str:\n        return f"hi {n}"',
  "name: build\non:\n  push:\n    branches: [main]\n  - run: |\n      echo hi\n\"quoted\": &a yes\n",
  "-- comment\nSELECT a, COUNT(*) FROM \"T\" WHERE n LIKE 'O''B' AND d::date > $1;",
  "# Title\n\n- item **bold** `code` [l](u)\n\n```ts\nconst a = 1;\n```\n> q\n---\n<b>x</b>",
  "package main\nfunc (s *S) Run() error { return `raw\nstr` }",
  "#[derive(Debug)]\nstruct P<'a> { x: &'a str }\nlet r = r#\"raw \"q\" \"#; let c = 'x'; println!(\"{}\", 1u8);",
  "@Override\npublic class A { String s = \"\"\"\n  t\"\"\"; int n = 0x1F; }",
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

describe("Python", () => {
  it("colours keywords, literals, numbers, decorators, definitions, types and comments", () => {
    expect(typed('@app.route("/x")\nclass Foo(Base):\n    def bar(self, n: int = 3) -> str:\n        return None  # end', "python").map(([type, text]) => `${type}:${text}`)).toEqual([
      "function:@app.route",
      'string:"/x"',
      "keyword:class",
      "type:Foo",
      "type:Base",
      "keyword:def",
      "function:bar",
      "keyword:self",
      "type:int",
      "number:3",
      "type:str",
      "keyword:return",
      "number:None",
      "comment:# end",
    ]);
  });

  it("draws a triple-quoted string across lines, and reads a string prefix", () => {
    expect(tokenize('x = """one\ntwo"""', "py").map((line) => line.map((token) => token.type))).toEqual([[undefined, "string"], ["string"]]);
    expect(typed("a = f'{x}'; b = rb\"\\d\"; c = \"x\"", "python").filter(([type]) => type === "string").map(([, text]) => text)).toEqual(["f'{x}'", 'rb"\\d"', '"x"']);
  });

  it("does not take an @ in the middle of a statement for a decorator", () => {
    expect(typed("c = a @ b\nd = a@b", "python").filter(([type]) => type === "function")).toEqual([]);
  });

  it("runs a triple-quoted string that is never closed to the end of the text", () => {
    expect(tokenize('x = """never closed\nmore', "python").map((line) => line.map((token) => token.type))).toEqual([[undefined, "string"], ["string"]]);
  });

  it("does not take a digit inside a name for a number", () => {
    expect(typed("x1 = y2 + 3", "python")).toEqual([["number", "3"]]);
  });
});

describe("YAML", () => {
  it("finds a key at the start of a line, after indentation and a list dash", () => {
    expect(typed("name: build\non:\n  push:\n    - uses: actions/checkout@v4\n    - run: x", "yaml").filter(([type]) => type === "property").map(([, text]) => text)).toEqual(["name", "on", "push", "uses", "run"]);
  });

  it("does not take a value, or a colon in one, for a key", () => {
    expect(typed("url: http://x.y/z\ntime: 12:30\n- plain text here", "yaml").filter(([type]) => type === "property").map(([, text]) => text)).toEqual(["url", "time"]);
  });

  it("does not take a word before a colon inside a value for a key", () => {
    expect(typed("title: Note: read this\n- item: a: b", "yaml").filter(([type]) => type === "property").map(([, text]) => text)).toEqual(["title", "item"]);
  });

  it("colours quoted keys and strings, anchors, aliases, tags, block scalars, literals, numbers and comments", () => {
    expect(typed('"quoted key": &a yes\nref: *a\nn: 1.5\ns: \'x\' # note\nt: !!str 5\nd: |\n  text', "yaml").map(([type, text]) => `${type}:${text}`)).toEqual([
      'property:"quoted key"',
      "type:&a",
      "number:yes",
      "property:ref",
      "type:*a",
      "property:n",
      "number:1.5",
      "property:s",
      "string:'x'",
      "comment:# note",
      "property:t",
      "keyword:!!str",
      "number:5",
      "property:d",
      "keyword:|",
    ]);
  });

  it("colours the document markers, and does not take a # inside a word for a comment", () => {
    expect(typed("---\na: b#c\n...", "yml").map(([type, text]) => `${type}:${text}`)).toEqual(["keyword:---", "property:a", "keyword:..."]);
  });
});

describe("SQL", () => {
  it("colours keywords in any case, types, functions, literals, numbers, comments and parameters", () => {
    expect(typed("select count(*) from t where a >= 18 and b is null and c::date > $1 -- hi", "sql").map(([type, text]) => `${type}:${text}`)).toEqual([
      "keyword:select",
      "function:count",
      "keyword:from",
      "keyword:where",
      "number:18",
      "keyword:and",
      "keyword:is",
      "number:null",
      "keyword:and",
      "type:date",
      "property:$1",
      "comment:-- hi",
    ]);
  });

  it("reads a doubled quote inside a string, and a quoted identifier as a name", () => {
    expect(typed("SELECT 'O''Brien', \"Users\".`id` FROM x", "sql").filter(([type]) => type === "string" || type === "property").map(([type, text]) => `${type}:${text}`)).toEqual([
      "string:'O''Brien'",
      'property:"Users"',
      "property:`id`",
    ]);
  });

  it("draws a block comment across lines", () => {
    expect(tokenize("/* a\nb */ SELECT", "postgres").map((line) => line.map((token) => token.type))).toEqual([["comment"], ["comment", undefined, "keyword"]]);
  });
});

describe("Markdown", () => {
  it("colours headings, lists, quotes, rules, inline code, links, bold and HTML", () => {
    expect(typed("# Title\n\n- one **bold** `code` [a](u)\n1. two\n> quote\n---\n<b>x</b>", "md").map(([type, text]) => `${type}:${text}`)).toEqual([
      "keyword:# Title",
      "keyword:-",
      "type:**bold**",
      "string:`code`",
      "function:[a](u)",
      "keyword:1.",
      "comment:> quote",
      "comment:---",
      "tag:<b>",
      "tag:</b>",
    ]);
  });

  it("draws a fenced block's lines as they are, and finds Markdown again after it", () => {
    expect(typed("```ts\n# not a heading\n- not a list\n```\n# Heading", "markdown").map(([type, text]) => `${type}:${text}`)).toEqual([
      "tag:```ts",
      "string:# not a heading",
      "string:- not a list",
      "tag:```",
      "keyword:# Heading",
    ]);
  });

  it("runs an unclosed fence to the end of the text", () => {
    expect(typed("text\n```\n# a\nb", "markdown").filter(([type]) => type === "string").map(([, text]) => text)).toEqual(["# a", "b"]);
  });

  it("does not take a # that isn't followed by a space for a heading, or a mid-line one at all", () => {
    expect(typed("#hashtag and a # mid-line", "markdown")).toEqual([]);
  });
});

describe("Go", () => {
  it("colours keywords, types, definitions, calls, strings, runes, numbers and nil", () => {
    expect(typed('func (s *Server) Start() error {\n\tfmt.Println("hi", \'x\', 3.5, nil)\n}', "go").map(([type, text]) => `${type}:${text}`)).toEqual([
      "keyword:func",
      "type:Server",
      "function:Start",
      "type:error",
      "function:Println",
      'string:"hi"',
      "string:'x'",
      "number:3.5",
      "number:nil",
    ]);
  });

  it("names a generic function, whose name is followed by a bracket and not a call", () => {
    expect(typed("func Map[T any](x T) T { return x }", "go").filter(([type]) => type === "function").map(([, text]) => text)).toEqual(["Map"]);
  });

  it("draws a raw string across lines", () => {
    expect(tokenize("x := `a\nb`", "golang").map((line) => line.map((token) => token.type))).toEqual([[undefined, "string"], ["string"]]);
  });
});

describe("Rust", () => {
  it("tells a character from a lifetime, and colours attributes, macros, definitions and numbers", () => {
    expect(typed("#[derive(Debug)]\nfn f<'a>(x: &'a str) { let c = 'x'; println!(\"{}\", 1_000u32); }", "rust").map(([type, text]) => `${type}:${text}`)).toEqual([
      "tag:#[derive(Debug)]",
      "keyword:fn",
      "function:f",
      "type:'a",
      "type:'a",
      "type:str",
      "keyword:let",
      "string:'x'",
      "function:println!",
      'string:"{}"',
      "number:1_000u32",
    ]);
  });

  it("ends a raw string at a quote and as many # as it opened with", () => {
    expect(typed('let r = r#"a "q" b"#; let n = 1;', "rs").filter(([type]) => type === "string").map(([, text]) => text)).toEqual(['r#"a "q" b"#']);
  });

  it("runs a raw string that is never closed to the end of the text", () => {
    expect(typed('let r = r#"never closed\nmore', "rust").filter(([type]) => type === "string").map(([, text]) => text)).toEqual(['r#"never closed', "more"]);
  });

  it("does not take a != for a macro", () => {
    expect(typed("if a != b { }", "rust").filter(([type]) => type === "function")).toEqual([]);
  });
});

describe("Java", () => {
  it("colours annotations, keywords, types, calls, numbers and text blocks", () => {
    expect(typed('@Override\npublic class Foo { private final int n = 0x1F; String s = """\n  t"""; void go() { System.out.println("x"); } }', "java").map(([type, text]) => `${type}:${text}`)).toEqual([
      "function:@Override",
      "keyword:public",
      "keyword:class",
      "type:Foo",
      "keyword:private",
      "keyword:final",
      "type:int",
      "number:0x1F",
      "type:String",
      'string:"""',
      'string:  t"""',
      "keyword:void",
      "function:go",
      "type:System",
      "function:println",
      'string:"x"',
    ]);
  });
});

describe("tokenize speed", () => {
  // A long unbroken word (a `data:` URI, a hash, a minified name) must cost time in proportion to its length. A
  // lookahead written into a word's pattern retries from every letter and goes quadratic: 29,000 characters took
  // 0.7 seconds in CSS, 1.6 inside a rule, and stalled the page.
  const word = "a".repeat(MAX_HIGHLIGHT_LENGTH - 1000);
  const budget = 250;
  it.each([
    ["css", word],
    ["css", `a{${word}`],
    ["css", "-".repeat(MAX_HIGHLIGHT_LENGTH - 1000)],
    ["css", `.a{background:url(data:image/png;base64,${word})}`],
    ["tsx", `<A ${word}`],
    ["html", `<a ${word}`],
    ["bash", word],
    ["json", word],
    ["ts", word],
    ["python", word],
    ["python", `"${word}`],
    ["python", `"""${word}`],
    ["yaml", word],
    ["yaml", `${word}: x`],
    ["yaml", `a: ${word}`],
    ["yaml", `- ${word}`],
    ["sql", word],
    ["sql", `'${word}`],
    ["sql", `/* ${word}`],
    ["markdown", word],
    ["markdown", `# ${word}`],
    ["markdown", "-".repeat(MAX_HIGHLIGHT_LENGTH - 1000)],
    ["markdown", `\`\`\`\n${word}`],
    ["markdown", `[${word}`],
    ["go", word],
    ["go", `\`${word}`],
    ["rust", word],
    ["rust", `r#"${word}`],
    ["rust", `'${word}`],
    ["java", word],
    ["java", `"""${word}`],
  ])("finishes a long word promptly in %s", (language, code) => {
    const start = performance.now();
    tokenize(code, language);
    expect(performance.now() - start).toBeLessThan(budget);
  });
});

describe("tokenize on input built to make a match repeat", () => {
  // Each of these makes a pattern that fails, and is tried again, at every start: an opener with no closer, over and
  // over. A never-closed string or comment must run to the end once, not be rescanned from every opener.
  const size = MAX_HIGHLIGHT_LENGTH - 1000;
  it.each([
    ["rust", 'r#"'.repeat(size / 3)],
    ["rust", 'r"'.repeat(size / 2)],
    ["rust", "'a ".repeat(size / 3)],
    ["python", '"""'.repeat(size / 3)],
    ["python", "f'".repeat(size / 2)],
    ["java", '"""'.repeat(size / 3)],
    ["sql", "'".repeat(size)],
    ["sql", "/*".repeat(size / 2)],
    ["markdown", "```\n".repeat(size / 4)],
    ["markdown", "[a](".repeat(size / 4)],
    ["markdown", "<!--".repeat(size / 4)],
    ["yaml", "a:\n".repeat(size / 3)],
    ["yaml", "- ".repeat(size / 2)],
    ["yaml", '"'.repeat(size)],
    ["go", "`".repeat(size)],
  ])("finishes promptly in %s", (language, code) => {
    const start = performance.now();
    tokenize(code, language);
    expect(performance.now() - start).toBeLessThan(250);
  });
});

describe("tokenize: cost grows in proportion to length", () => {
  // A fixed budget at one size can't tell linear from quadratic (a quadratic input took 80ms here and 380ms on a slow
  // CI machine, and a 250ms budget passed it on the first and failed the second), so this measures how the cost
  // scales: four times the text must cost about four times as much, not sixteen. Best of three, so a slow moment on
  // the machine doesn't decide it; the floor keeps a cost too small to measure from producing a ratio.
  const best = (language: string, code: string) => {
    let fastest = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 3; run++) {
      const start = performance.now();
      tokenize(code, language);
      fastest = Math.min(fastest, performance.now() - start);
    }
    return fastest;
  };
  const small = 6_000;
  const large = 24_000;
  const repeated = (unit: string, length: number) => unit.repeat(Math.ceil(length / unit.length));

  it.each([
    // An opener with no closer, over and over, in every grammar with a rule that could read to the line's end.
    ["markdown", "["], ["markdown", "[a"], ["markdown", "!["], ["markdown", "[a]("], ["markdown", "<a"], ["markdown", "</a"], ["markdown", "[["],
    ["markdown", "`"], ["markdown", "**"], ["markdown", "```\n"], ["markdown", "<!--"],
    ["rust", "#["], ["rust", "#[a"], ["rust", "#!["], ["rust", 'r#"'], ["rust", "'a "],
    ["python", '"""'], ["python", "f'"], ["java", '"""'], ["sql", "'"], ["sql", "/*"], ["go", "`"],
    ["yaml", "a:\n"], ["yaml", "- "], ["yaml", '"'],
    ["ts", "`"], ["ts", "/*"], ["ts", "'"], ["tsx", "<a"], ["tsx", "<a b={"], ["tsx", "{`"], ["jsx", "</"],
    ["css", "/*"], ["css", "url("], ["css", "a{"], ["css", "@media "], ["html", "<a"], ["html", "<!--"], ["html", '<a b="'],
    ["bash", "'"], ["bash", '"'], ["bash", "$("], ["bash", "${"], ["json", '"'], ["json", "["],
  ])("of a repeated opener in %s: %j", (language, unit) => {
    const ratio = best(language, repeated(unit, large)) / Math.max(best(language, repeated(unit, small)), 2);
    // Linear is 4, quadratic 16.
    expect(ratio).toBeLessThan(9);
  });
});

describe("tokenize with values that are not text", () => {
  it("draws a language that is not a string as plain text, and a missing code as empty", () => {
    expect(tokenize("const a = 1", 5 as never)).toEqual([[{ text: "const a = 1" }]]);
    expect(tokenize(undefined as never, "ts")).toEqual([[]]);
    expect(tokenize(null as never, "ts")).toEqual([[]]);
    expect(resolveLanguage({} as never)).toBeUndefined();
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

  it("does not take a name every object has (constructor, toString, __proto__) for a language", () => {
    for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"]) expect(resolveLanguage(name)).toBeUndefined();
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
