import { describe, expect, it } from "vitest";
import * as shipped from "./languages";
import { registerCodeLanguage } from "./registry";
import { tokenize } from "./tokenize";

// The languages that ship outside the core, one `describe` each: Python, YAML, SQL, Markdown, Go, Rust and Java, then C,
// C++, C#, Kotlin, Swift, Ruby, PHP and TOML. (The invariants that cover every language — lossless output, random text,
// timing — are in `tokenize.test.ts`.)
for (const language of Object.values(shipped)) registerCodeLanguage(language);

/** Every token, as `type:text`, leaving out plain text so a test says only what it means. */
const named = (code: string, language: string) =>
  tokenize(code, language)
    .flat()
    .filter((token) => token.type)
    .map((token) => `${token.type}:${token.text}`);

/** Every token as `[type, text]`, leaving out plain text (the form the first seven languages' tests were written in). */
const typed = (code: string, language: string) =>
  tokenize(code, language)
    .flat()
    .filter((token) => token.type)
    .map((token) => [token.type, token.text]);

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

describe("C", () => {
  it("colours keywords, types, calls, strings, numbers, NULL and comments", () => {
    expect(named('int main(int argc) { printf("hi %d\\n", 0x1F); // done\n FILE *f = NULL; return 0; }', "c")).toEqual([
      "type:int", "function:main", "type:int", "function:printf", 'string:"hi %d\\n"', "number:0x1F", "comment:// done",
      "type:FILE", "number:NULL", "keyword:return", "number:0",
    ]);
  });

  it("colours a directive at the start of a line, indented or not, and the header an include names", () => {
    expect(named("#include <stdio.h>\n  # define MAX 10\n#if X", "c")).toEqual(["keyword:#include", "string:<stdio.h>", "keyword:# define", "number:10", "keyword:#if"]);
  });

  it("does not take a # in the middle of a line for a directive, or a <…> for a header unless an include names it", () => {
    expect(named("a = b # c", "c")).toEqual([]);
    expect(named("if (a <b> c) {}", "c")).toEqual(["keyword:if"]);
  });

  it("reads number suffixes", () => {
    expect(named("x = 10UL + 1.5f + 0xFFu + 1e3", "c")).toEqual(["number:10UL", "number:1.5f", "number:0xFFu", "number:1e3"]);
  });

  it("runs a comment or string that is never closed to the end", () => {
    expect(named('a /* never\nmore', "c")).toEqual(["comment:/* never", "comment:more"]);
    expect(named('a "never\nmore', "c")).toEqual(['string:"never']);
  });
});

describe("C++", () => {
  it("colours C++ keywords, nullptr and the header of an include", () => {
    expect(named("#include <vector>\ntemplate <typename T> class Box final { constexpr auto x = nullptr; };", "cpp")).toEqual([
      "keyword:#include", "string:<vector>", "keyword:template", "keyword:typename", "keyword:class", "type:Box", "keyword:final",
      "keyword:constexpr", "keyword:auto", "number:nullptr",
    ]);
  });

  it("ends a raw string at the delimiter it opened with, however many quotes and parentheses are inside", () => {
    expect(named('auto s = R"x(a "b" )" c)x"; int n;', "cpp")).toEqual(["keyword:auto", 'string:R"x(a "b" )" c)x"', "type:int"]);
  });

  it("takes a raw string with a prefix, and one that is never closed runs to the end", () => {
    expect(named('a = u8R"(x)"; b = LR"d(y)d";', "cpp")).toEqual(['string:u8R"(x)"', 'string:LR"d(y)d"']);
    expect(named('a = R"(never closed\n) more', "cpp")).toEqual(['string:R"(never closed', "string:) more"]);
  });

  it("does not take an R at the end of a word for a raw string", () => {
    expect(named('xR"(a)"', "cpp")).toEqual(['string:"(a)"']);
    expect(named('FOOR"x(a)x"', "cpp")).toEqual(['string:"x(a)x"']);
  });

  it("keeps a digit separator inside its number, and still reads a character", () => {
    expect(named("n = 1'000'000; c = 'a';", "cpp")).toEqual(["number:1'000'000", "string:'a'"]);
    expect(named("h = 0xFF'FF; b = 0b1010'0101;", "cpp")).toEqual(["number:0xFF'FF", "number:0b1010'0101"]);
  });
});

describe("C#", () => {
  it("colours keywords, built-in types, PascalCase calls and types, and directives", () => {
    expect(named("using System;\npublic class Greeter { public async Task<int> Run() { Console.WriteLine(42); } }\n#region x", "csharp")).toEqual([
      "keyword:using", "type:System", "keyword:public", "keyword:class", "type:Greeter", "keyword:public", "keyword:async", "type:Task",
      "type:int", "function:Run", "type:Console", "function:WriteLine", "number:42", "keyword:#region",
    ]);
  });

  it("reads verbatim strings, with a doubled quote for a quote, and interpolated and raw ones", () => {
    expect(named('a = @"C:\\x""y"; b = $"hi {n}"; c = $@"p ""q"""; d = """raw "q" """;', "csharp")).toEqual([
      'string:@"C:\\x""y"', 'string:$"hi {n}"', 'string:$@"p ""q"""', 'string:"""raw "q" """',
    ]);
  });

  it("reads number suffixes and hex", () => {
    expect(named("a = 10L + 1.5f + 3u + 0x1F + 2.5m + 1e3", "csharp")).toEqual(["number:10L", "number:1.5f", "number:3u", "number:0x1F", "number:2.5m", "number:1e3"]);
  });

  it("takes the dollars before a raw interpolated string as part of it", () => {
    expect(named('a = $"""hi {x}"""; b = $$"""{{x}}""";', "csharp")).toEqual(['string:$"""hi {x}"""', 'string:$$"""{{x}}"""']);
  });

  it("runs a verbatim or raw string that is never closed to the end", () => {
    expect(named('a = @"never\nmore "" x', "csharp")).toEqual(['string:@"never', 'string:more "" x']);
    expect(named('a = """never\nmore', "csharp")).toEqual(['string:"""never', "string:more"]);
  });

  it("colours an attribute on its own line, and not an index or an array type", () => {
    expect(named('[Serializable]\n  [HttpGet("/x")]\nint[] a = b[Serializable];', "csharp")).toEqual(["function:[Serializable]", 'function:[HttpGet("/x")]', "type:int", "type:Serializable"]);
  });
});

describe("Kotlin", () => {
  it("colours fun names, types, annotations, strings, templates as part of their string, and numbers", () => {
    expect(named('@Composable\nfun greet(n: String = "x"): Unit { println("Hi $n ${1 + 2}") /* c */ }\nval a = 0xFFL; val f = 1.5f', "kotlin")).toEqual([
      "function:@Composable", "keyword:fun", "function:greet", "type:String", 'string:"x"', "type:Unit", "function:println", 'string:"Hi $n ${1 + 2}"',
      "comment:/* c */", "keyword:val", "number:0xFFL", "keyword:val", "number:1.5f",
    ]);
  });

  it("reads a raw string across lines, and one never closed runs to the end", () => {
    expect(named('a = """x\n  y""" + 1', "kotlin")).toEqual(['string:"""x', 'string:  y"""', "number:1"]);
    expect(named('a = """never\nmore', "kotlin")).toEqual(['string:"""never', "string:more"]);
  });

  it("names a function that is written in PascalCase, and one whose name is not followed by a bracket", () => {
    expect(named("@Composable\nfun Greeting(name: String) {}\nfun <T> map(x: T) {}\nfun String.shout() = 1", "kotlin")).toEqual([
      "function:@Composable", "keyword:fun", "function:Greeting", "type:String", "keyword:fun", "function:map", "keyword:fun", "type:String", "function:shout", "number:1",
    ]);
  });

  it("does not take a return label for an annotation", () => {
    expect(named("return@loop", "kotlin")).toEqual(["keyword:return"]);
  });
});

describe("Swift", () => {
  it("colours func names, types, attributes, directives and keywords", () => {
    expect(named('@State var n = 0\nfunc greet(_ s: String) -> String { guard let x = Int("4") else { return "" } }\n#if DEBUG\n#endif', "swift")).toEqual([
      "function:@State", "keyword:var", "number:0", "keyword:func", "function:greet", "type:String", "type:String", "keyword:guard", "keyword:let",
      "type:Int", 'string:"4"', "keyword:else", "keyword:return", 'string:""', "keyword:#if", "keyword:#endif",
    ]);
  });

  it("reads a multi-line string, with or without # around it, and one never closed runs to the end", () => {
    expect(named('a = """\n  x\n  """; b = #"""\n  y """#', "swift")).toEqual(['string:"""', "string:  x", 'string:  """', 'string:#"""', 'string:  y """#']);
    expect(named('a = """never\nmore', "swift")).toEqual(['string:"""never', "string:more"]);
  });

  it("names a function whether or not a bracket follows its name", () => {
    expect(named("func map<T>(_ f: T) {}\nfunc Greeting() {}", "swift")).toEqual(["keyword:func", "function:map", "keyword:func", "function:Greeting"]);
  });

  it("colours nil, true and false, and the digits of a number with underscores", () => {
    expect(named("a = nil; b = true; c = 1_000; d = 0b101", "swift")).toEqual(["number:nil", "number:true", "number:1_000", "number:0b101"]);
  });
});

describe("Ruby", () => {
  it("colours keywords, symbols, instance variables, hash keys, method names and constants", () => {
    expect(named("class Greeter < Base\n  attr_reader :name\n  def initialize(name, age: 3)\n    @name = name\n  end\nend", "ruby")).toEqual([
      "keyword:class", "type:Greeter", "type:Base", "keyword:attr_reader", "number::name", "keyword:def", "function:initialize", "property:age", "number:3",
      "property:@name", "keyword:end", "keyword:end",
    ]);
  });

  it("reads a heredoc from its opener to the line that closes it", () => {
    expect(named("a = <<~EOS\n  body #{x}\n  EOS\nb = 1", "ruby")).toEqual(["string:<<~EOS", "string:  body #{x}", "string:  EOS", "number:1"]);
    expect(named("a = <<-'END'\nraw\nEND\n", "ruby")).toEqual(["string:<<-'END'", "string:raw", "string:END"]);
  });

  it("runs a heredoc that is never closed to the end", () => {
    expect(named("a = <<~EOS\nnever\nclosed", "ruby")).toEqual(["string:<<~EOS", "string:never", "string:closed"]);
  });

  it("does not take a shift or an append for a heredoc", () => {
    expect(named("list << item\nlist << FOO\nx<<FOO", "ruby")).toEqual([]);
    expect(named("x<<FOO\nbody\nFOO", "ruby")).toEqual([]);
    expect(named("a = <<~eos\nx", "ruby")).toEqual([]);
  });

  it("reads =begin to =end at the start of a line only", () => {
    expect(named("=begin\nx\n=end\ny", "ruby")).toEqual(["comment:=begin", "comment:x", "comment:=end"]);
    // Indented, it is not a comment: `begin` is the keyword it always is.
    expect(named("  =begin\n", "ruby")).toEqual(["keyword:begin"]);
    expect(named("=begin\nnever closed", "ruby")).toEqual(["comment:=begin", "comment:never closed"]);
  });

  it("colours a symbol, but not the :: of a scope or a colon after a space", () => {
    expect(named('a = :ok; b = :"two words"; c = Foo::Bar; d = x ? y : z', "ruby")).toEqual(["number::ok", 'number::"two words"', "type:Foo", "type:Bar"]);
  });

  it("names a method that ends in ? or !, but not the ! of !=", () => {
    expect(named("def valid?(x) = x != y\ndef save!\nfoo!", "ruby")).toEqual(["keyword:def", "function:valid?", "keyword:def", "function:save!"]);
  });

  it("does not take the ! of a != for part of a name", () => {
    expect(named("nil!=x", "ruby")).toEqual(["number:nil"]);
    expect(named("x = a!=b", "ruby")).toEqual([]);
  });

  it("colours defined? and a comment, and a string with an interpolation is one string", () => {
    expect(named('defined?(x) # c\nputs "a #{b} c"', "ruby")).toEqual(["keyword:defined?", "comment:# c", 'string:"a #{b} c"']);
  });
});

describe("PHP", () => {
  it("colours the tags, variables, keywords in any case, types and comments of every form", () => {
    expect(named("<?php\nFUNCTION f(int $a): void { // one\n # two\n /* three */ return NULL; }\n?>", "php")).toEqual([
      "tag:<?php", "keyword:FUNCTION", "function:f", "type:int", "property:$a", "type:void", "comment:// one", "comment:# two", "comment:/* three */",
      "keyword:return", "number:NULL", "tag:?>",
    ]);
  });

  it("colours a variable variable, and a function whether or not it is written in PascalCase", () => {
    expect(named("$$name = 1; function Greeting() {}\nfunction &GetRef() {}", "php")).toEqual([
      "property:$$name", "number:1", "keyword:function", "function:Greeting", "keyword:function", "function:GetRef",
    ]);
  });

  it("takes #[ for an attribute and a # for a comment", () => {
    expect(named('#[Route("/x")]\n# note', "php")).toEqual(['tag:#[Route("/x")]', "comment:# note"]);
  });

  it("reads a heredoc and a nowdoc, and one never closed runs to the end", () => {
    expect(named("a = <<<EOT\n  hi $x\n  EOT;\nb = <<<'RAW'\nraw\nRAW;", "php")).toEqual(["string:<<<EOT", "string:  hi $x", "string:  EOT", "string:<<<'RAW'", "string:raw", "string:RAW"]);
    expect(named("a = <<<EOT\nnever\nclosed", "php")).toEqual(["string:<<<EOT", "string:never", "string:closed"]);
  });

  it("draws the text outside the tags as plain text", () => {
    expect(named("?>\n<div>hello world</div>\n<?php echo 1; ?>", "php")).toEqual(["tag:?>", "tag:<?php", "keyword:echo", "number:1", "tag:?>"]);
  });

  it("reads a string with an escaped quote as one string", () => {
    expect(named('a = "say \\"hi\\""; b = \'it\\\'s\';', "php")).toEqual(['string:"say \\"hi\\""', "string:'it\\'s'"]);
  });
});

describe("TOML", () => {
  it("colours comments, table headers, keys (dotted and quoted), strings, numbers, dates and booleans", () => {
    expect(
      named('# c\ntitle = "TOML"\nowner.name = \'Tom\'\n"quoted key" = 1\n[database]\n[[servers]]\non = true\nd = 1979-05-27T07:32:00Z\nn = -1.5e3\nx = 0xDEAD_BEEF', "toml"),
    ).toEqual([
      "comment:# c", "property:title", 'string:"TOML"', "property:owner.name", "string:'Tom'", 'property:"quoted key"', "number:1", "tag:[database]", "tag:[[servers]]",
      "property:on", "number:true", "property:d", "number:1979-05-27T07:32:00Z", "property:n", "number:-1.5e3", "property:x", "number:0xDEAD_BEEF",
    ]);
  });

  it("colours a key at the start of a line, indented or not, and only there", () => {
    expect(named("  a = 1\nb = c = 2", "toml")).toEqual(["property:a", "number:1", "property:b", "number:2"]);
  });

  it("takes a header only at the start of a line, and not an array of arrays inside a value", () => {
    expect(named("a = [ [1, 2], [3] ]\n[t]", "toml")).toEqual(["property:a", "number:1", "number:2", "number:3", "tag:[t]"]);
    expect(named("nested = [\n  [1, 2],\n]", "toml")).toEqual(["property:nested", "number:1", "number:2"]);
  });

  it("reads a # inside a string as part of the string, and one after a value as a comment", () => {
    expect(named('a = "x # y" # real', "toml")).toEqual(["property:a", 'string:"x # y"', "comment:# real"]);
  });

  it("reads multi-line strings, and one never closed runs to the end", () => {
    expect(named("a = \"\"\"\nline # not a comment\n\"\"\"\nb = '''\nraw\n'''", "toml")).toEqual([
      "property:a", 'string:"""', "string:line # not a comment", 'string:"""', "property:b", "string:'''", "string:raw", "string:'''",
    ]);
    expect(named('a = """never\nclosed', "toml")).toEqual(["property:a", 'string:"""never', "string:closed"]);
  });

  it("reads inf and nan and numbers with underscores or signs", () => {
    expect(named("a = inf\nb = -inf\nc = nan\nd = +1_000", "toml")).toEqual(["property:a", "number:inf", "property:b", "number:-inf", "property:c", "number:nan", "property:d", "number:+1_000"]);
    expect(named("a = +nan\nb = -infinity", "toml")).toEqual(["property:a", "number:+nan", "property:b"]);
  });
});
