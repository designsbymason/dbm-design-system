import { describe, expect, it } from "vitest";
import * as shipped from "./languages";
import { registerCodeLanguage } from "./registry";
import { tokenize } from "./tokenize";

// The eight languages added in the second batch: C, C++, C#, Kotlin, Swift, Ruby, PHP and TOML. (The invariants that
// cover every language — lossless output, random text, timing — are in `tokenize.test.ts`.)
for (const language of Object.values(shipped)) registerCodeLanguage(language);

/** Every token, as `type:text`, leaving out plain text so a test says only what it means. */
const typed = (code: string, language: string) =>
  tokenize(code, language)
    .flat()
    .filter((token) => token.type)
    .map((token) => `${token.type}:${token.text}`);

describe("C", () => {
  it("colours keywords, types, calls, strings, numbers, NULL and comments", () => {
    expect(typed('int main(int argc) { printf("hi %d\\n", 0x1F); // done\n FILE *f = NULL; return 0; }', "c")).toEqual([
      "type:int", "function:main", "type:int", "function:printf", 'string:"hi %d\\n"', "number:0x1F", "comment:// done",
      "type:FILE", "number:NULL", "keyword:return", "number:0",
    ]);
  });

  it("colours a directive at the start of a line, indented or not, and the header an include names", () => {
    expect(typed("#include <stdio.h>\n  # define MAX 10\n#if X", "c")).toEqual(["keyword:#include", "string:<stdio.h>", "keyword:# define", "number:10", "keyword:#if"]);
  });

  it("does not take a # in the middle of a line for a directive, or a <…> for a header unless an include names it", () => {
    expect(typed("a = b # c", "c")).toEqual([]);
    expect(typed("if (a <b> c) {}", "c")).toEqual(["keyword:if"]);
  });

  it("reads number suffixes", () => {
    expect(typed("x = 10UL + 1.5f + 0xFFu + 1e3", "c")).toEqual(["number:10UL", "number:1.5f", "number:0xFFu", "number:1e3"]);
  });

  it("runs a comment or string that is never closed to the end", () => {
    expect(typed('a /* never\nmore', "c")).toEqual(["comment:/* never", "comment:more"]);
    expect(typed('a "never\nmore', "c")).toEqual(['string:"never']);
  });
});

describe("C++", () => {
  it("colours C++ keywords, nullptr and the header of an include", () => {
    expect(typed("#include <vector>\ntemplate <typename T> class Box final { constexpr auto x = nullptr; };", "cpp")).toEqual([
      "keyword:#include", "string:<vector>", "keyword:template", "keyword:typename", "keyword:class", "type:Box", "keyword:final",
      "keyword:constexpr", "keyword:auto", "number:nullptr",
    ]);
  });

  it("ends a raw string at the delimiter it opened with, however many quotes and parentheses are inside", () => {
    expect(typed('auto s = R"x(a "b" )" c)x"; int n;', "cpp")).toEqual(["keyword:auto", 'string:R"x(a "b" )" c)x"', "type:int"]);
  });

  it("takes a raw string with a prefix, and one that is never closed runs to the end", () => {
    expect(typed('a = u8R"(x)"; b = LR"d(y)d";', "cpp")).toEqual(['string:u8R"(x)"', 'string:LR"d(y)d"']);
    expect(typed('a = R"(never closed\n) more', "cpp")).toEqual(['string:R"(never closed', "string:) more"]);
  });

  it("does not take an R at the end of a word for a raw string", () => {
    expect(typed('xR"(a)"', "cpp")).toEqual(['string:"(a)"']);
    expect(typed('FOOR"x(a)x"', "cpp")).toEqual(['string:"x(a)x"']);
  });

  it("keeps a digit separator inside its number, and still reads a character", () => {
    expect(typed("n = 1'000'000; c = 'a';", "cpp")).toEqual(["number:1'000'000", "string:'a'"]);
    expect(typed("h = 0xFF'FF; b = 0b1010'0101;", "cpp")).toEqual(["number:0xFF'FF", "number:0b1010'0101"]);
  });
});

describe("C#", () => {
  it("colours keywords, built-in types, PascalCase calls and types, and directives", () => {
    expect(typed("using System;\npublic class Greeter { public async Task<int> Run() { Console.WriteLine(42); } }\n#region x", "csharp")).toEqual([
      "keyword:using", "type:System", "keyword:public", "keyword:class", "type:Greeter", "keyword:public", "keyword:async", "type:Task",
      "type:int", "function:Run", "type:Console", "function:WriteLine", "number:42", "keyword:#region",
    ]);
  });

  it("reads verbatim strings, with a doubled quote for a quote, and interpolated and raw ones", () => {
    expect(typed('a = @"C:\\x""y"; b = $"hi {n}"; c = $@"p ""q"""; d = """raw "q" """;', "csharp")).toEqual([
      'string:@"C:\\x""y"', 'string:$"hi {n}"', 'string:$@"p ""q"""', 'string:"""raw "q" """',
    ]);
  });

  it("reads number suffixes and hex", () => {
    expect(typed("a = 10L + 1.5f + 3u + 0x1F + 2.5m + 1e3", "csharp")).toEqual(["number:10L", "number:1.5f", "number:3u", "number:0x1F", "number:2.5m", "number:1e3"]);
  });

  it("takes the dollars before a raw interpolated string as part of it", () => {
    expect(typed('a = $"""hi {x}"""; b = $$"""{{x}}""";', "csharp")).toEqual(['string:$"""hi {x}"""', 'string:$$"""{{x}}"""']);
  });

  it("runs a verbatim or raw string that is never closed to the end", () => {
    expect(typed('a = @"never\nmore "" x', "csharp")).toEqual(['string:@"never', 'string:more "" x']);
    expect(typed('a = """never\nmore', "csharp")).toEqual(['string:"""never', "string:more"]);
  });

  it("colours an attribute on its own line, and not an index or an array type", () => {
    expect(typed('[Serializable]\n  [HttpGet("/x")]\nint[] a = b[Serializable];', "csharp")).toEqual(["function:[Serializable]", 'function:[HttpGet("/x")]', "type:int", "type:Serializable"]);
  });
});

describe("Kotlin", () => {
  it("colours fun names, types, annotations, strings, templates as part of their string, and numbers", () => {
    expect(typed('@Composable\nfun greet(n: String = "x"): Unit { println("Hi $n ${1 + 2}") /* c */ }\nval a = 0xFFL; val f = 1.5f', "kotlin")).toEqual([
      "function:@Composable", "keyword:fun", "function:greet", "type:String", 'string:"x"', "type:Unit", "function:println", 'string:"Hi $n ${1 + 2}"',
      "comment:/* c */", "keyword:val", "number:0xFFL", "keyword:val", "number:1.5f",
    ]);
  });

  it("reads a raw string across lines, and one never closed runs to the end", () => {
    expect(typed('a = """x\n  y""" + 1', "kotlin")).toEqual(['string:"""x', 'string:  y"""', "number:1"]);
    expect(typed('a = """never\nmore', "kotlin")).toEqual(['string:"""never', "string:more"]);
  });

  it("names a function that is written in PascalCase, and one whose name is not followed by a bracket", () => {
    expect(typed("@Composable\nfun Greeting(name: String) {}\nfun <T> map(x: T) {}\nfun String.shout() = 1", "kotlin")).toEqual([
      "function:@Composable", "keyword:fun", "function:Greeting", "type:String", "keyword:fun", "function:map", "keyword:fun", "type:String", "function:shout", "number:1",
    ]);
  });

  it("does not take a return label for an annotation", () => {
    expect(typed("return@loop", "kotlin")).toEqual(["keyword:return"]);
  });
});

describe("Swift", () => {
  it("colours func names, types, attributes, directives and keywords", () => {
    expect(typed('@State var n = 0\nfunc greet(_ s: String) -> String { guard let x = Int("4") else { return "" } }\n#if DEBUG\n#endif', "swift")).toEqual([
      "function:@State", "keyword:var", "number:0", "keyword:func", "function:greet", "type:String", "type:String", "keyword:guard", "keyword:let",
      "type:Int", 'string:"4"', "keyword:else", "keyword:return", 'string:""', "keyword:#if", "keyword:#endif",
    ]);
  });

  it("reads a multi-line string, with or without # around it, and one never closed runs to the end", () => {
    expect(typed('a = """\n  x\n  """; b = #"""\n  y """#', "swift")).toEqual(['string:"""', "string:  x", 'string:  """', 'string:#"""', 'string:  y """#']);
    expect(typed('a = """never\nmore', "swift")).toEqual(['string:"""never', "string:more"]);
  });

  it("names a function whether or not a bracket follows its name", () => {
    expect(typed("func map<T>(_ f: T) {}\nfunc Greeting() {}", "swift")).toEqual(["keyword:func", "function:map", "keyword:func", "function:Greeting"]);
  });

  it("colours nil, true and false, and the digits of a number with underscores", () => {
    expect(typed("a = nil; b = true; c = 1_000; d = 0b101", "swift")).toEqual(["number:nil", "number:true", "number:1_000", "number:0b101"]);
  });
});

describe("Ruby", () => {
  it("colours keywords, symbols, instance variables, hash keys, method names and constants", () => {
    expect(typed("class Greeter < Base\n  attr_reader :name\n  def initialize(name, age: 3)\n    @name = name\n  end\nend", "ruby")).toEqual([
      "keyword:class", "type:Greeter", "type:Base", "keyword:attr_reader", "number::name", "keyword:def", "function:initialize", "property:age", "number:3",
      "property:@name", "keyword:end", "keyword:end",
    ]);
  });

  it("reads a heredoc from its opener to the line that closes it", () => {
    expect(typed("a = <<~EOS\n  body #{x}\n  EOS\nb = 1", "ruby")).toEqual(["string:<<~EOS", "string:  body #{x}", "string:  EOS", "number:1"]);
    expect(typed("a = <<-'END'\nraw\nEND\n", "ruby")).toEqual(["string:<<-'END'", "string:raw", "string:END"]);
  });

  it("runs a heredoc that is never closed to the end", () => {
    expect(typed("a = <<~EOS\nnever\nclosed", "ruby")).toEqual(["string:<<~EOS", "string:never", "string:closed"]);
  });

  it("does not take a shift or an append for a heredoc", () => {
    expect(typed("list << item\nlist << FOO\nx<<FOO", "ruby")).toEqual([]);
    expect(typed("x<<FOO\nbody\nFOO", "ruby")).toEqual([]);
    expect(typed("a = <<~eos\nx", "ruby")).toEqual([]);
  });

  it("reads =begin to =end at the start of a line only", () => {
    expect(typed("=begin\nx\n=end\ny", "ruby")).toEqual(["comment:=begin", "comment:x", "comment:=end"]);
    // Indented, it is not a comment: `begin` is the keyword it always is.
    expect(typed("  =begin\n", "ruby")).toEqual(["keyword:begin"]);
    expect(typed("=begin\nnever closed", "ruby")).toEqual(["comment:=begin", "comment:never closed"]);
  });

  it("colours a symbol, but not the :: of a scope or a colon after a space", () => {
    expect(typed('a = :ok; b = :"two words"; c = Foo::Bar; d = x ? y : z', "ruby")).toEqual(["number::ok", 'number::"two words"', "type:Foo", "type:Bar"]);
  });

  it("names a method that ends in ? or !, but not the ! of !=", () => {
    expect(typed("def valid?(x) = x != y\ndef save!\nfoo!", "ruby")).toEqual(["keyword:def", "function:valid?", "keyword:def", "function:save!"]);
  });

  it("does not take the ! of a != for part of a name", () => {
    expect(typed("nil!=x", "ruby")).toEqual(["number:nil"]);
    expect(typed("x = a!=b", "ruby")).toEqual([]);
  });

  it("colours defined? and a comment, and a string with an interpolation is one string", () => {
    expect(typed('defined?(x) # c\nputs "a #{b} c"', "ruby")).toEqual(["keyword:defined?", "comment:# c", 'string:"a #{b} c"']);
  });
});

describe("PHP", () => {
  it("colours the tags, variables, keywords in any case, types and comments of every form", () => {
    expect(typed("<?php\nFUNCTION f(int $a): void { // one\n # two\n /* three */ return NULL; }\n?>", "php")).toEqual([
      "tag:<?php", "keyword:FUNCTION", "function:f", "type:int", "property:$a", "type:void", "comment:// one", "comment:# two", "comment:/* three */",
      "keyword:return", "number:NULL", "tag:?>",
    ]);
  });

  it("colours a variable variable, and a function whether or not it is written in PascalCase", () => {
    expect(typed("$$name = 1; function Greeting() {}\nfunction &GetRef() {}", "php")).toEqual([
      "property:$$name", "number:1", "keyword:function", "function:Greeting", "keyword:function", "function:GetRef",
    ]);
  });

  it("takes #[ for an attribute and a # for a comment", () => {
    expect(typed('#[Route("/x")]\n# note', "php")).toEqual(['tag:#[Route("/x")]', "comment:# note"]);
  });

  it("reads a heredoc and a nowdoc, and one never closed runs to the end", () => {
    expect(typed("a = <<<EOT\n  hi $x\n  EOT;\nb = <<<'RAW'\nraw\nRAW;", "php")).toEqual(["string:<<<EOT", "string:  hi $x", "string:  EOT", "string:<<<'RAW'", "string:raw", "string:RAW"]);
    expect(typed("a = <<<EOT\nnever\nclosed", "php")).toEqual(["string:<<<EOT", "string:never", "string:closed"]);
  });

  it("draws the text outside the tags as plain text", () => {
    expect(typed("?>\n<div>hello world</div>\n<?php echo 1; ?>", "php")).toEqual(["tag:?>", "tag:<?php", "keyword:echo", "number:1", "tag:?>"]);
  });

  it("reads a string with an escaped quote as one string", () => {
    expect(typed('a = "say \\"hi\\""; b = \'it\\\'s\';', "php")).toEqual(['string:"say \\"hi\\""', "string:'it\\'s'"]);
  });
});

describe("TOML", () => {
  it("colours comments, table headers, keys (dotted and quoted), strings, numbers, dates and booleans", () => {
    expect(
      typed('# c\ntitle = "TOML"\nowner.name = \'Tom\'\n"quoted key" = 1\n[database]\n[[servers]]\non = true\nd = 1979-05-27T07:32:00Z\nn = -1.5e3\nx = 0xDEAD_BEEF', "toml"),
    ).toEqual([
      "comment:# c", "property:title", 'string:"TOML"', "property:owner.name", "string:'Tom'", 'property:"quoted key"', "number:1", "tag:[database]", "tag:[[servers]]",
      "property:on", "number:true", "property:d", "number:1979-05-27T07:32:00Z", "property:n", "number:-1.5e3", "property:x", "number:0xDEAD_BEEF",
    ]);
  });

  it("colours a key at the start of a line, indented or not, and only there", () => {
    expect(typed("  a = 1\nb = c = 2", "toml")).toEqual(["property:a", "number:1", "property:b", "number:2"]);
  });

  it("takes a header only at the start of a line, and not an array of arrays inside a value", () => {
    expect(typed("a = [ [1, 2], [3] ]\n[t]", "toml")).toEqual(["property:a", "number:1", "number:2", "number:3", "tag:[t]"]);
    expect(typed("nested = [\n  [1, 2],\n]", "toml")).toEqual(["property:nested", "number:1", "number:2"]);
  });

  it("reads a # inside a string as part of the string, and one after a value as a comment", () => {
    expect(typed('a = "x # y" # real', "toml")).toEqual(["property:a", 'string:"x # y"', "comment:# real"]);
  });

  it("reads multi-line strings, and one never closed runs to the end", () => {
    expect(typed("a = \"\"\"\nline # not a comment\n\"\"\"\nb = '''\nraw\n'''", "toml")).toEqual([
      "property:a", 'string:"""', "string:line # not a comment", 'string:"""', "property:b", "string:'''", "string:raw", "string:'''",
    ]);
    expect(typed('a = """never\nclosed', "toml")).toEqual(["property:a", 'string:"""never', "string:closed"]);
  });

  it("reads inf and nan and numbers with underscores or signs", () => {
    expect(typed("a = inf\nb = -inf\nc = nan\nd = +1_000", "toml")).toEqual(["property:a", "number:inf", "property:b", "number:-inf", "property:c", "number:nan", "property:d", "number:+1_000"]);
    expect(typed("a = +nan\nb = -infinity", "toml")).toEqual(["property:a", "number:+nan", "property:b"]);
  });
});
