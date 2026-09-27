import { cFamilyRules, defineLanguage, directive, startsLine, wordSet } from "./kit";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const csharpRules = (): Rule[] =>
  cFamilyRules({
    before: [directive],
    strings: [
      // A raw string, `"""…"""` (interpolated with a leading `$`), then the verbatim (`@"…"`, doubled quote for a quote)
      // and interpolated (`$"…"`) forms; each runs to the end when it is never closed. The braces inside an
      // interpolated string are not read: the whole string is one colour.
      // (The run of `$` is bounded: an unbounded one is read again from every `$` of a long run and never closed.)
      { re: /\${0,8}"""[\s\S]*?(?:"""|$)/y, type: "string" },
      { re: /(?:\$@|@\$|@)"(?:[^"]|"")*"?/y, type: "string" },
      { re: /\$"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
      { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
      { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
    ],
    // An attribute on its own line: `[Serializable]`, `[HttpGet("/x")]`.
    extra: [{ re: /\[[A-Z]\w*(?:\([^()\n]*\))?\]/y, type: "function", when: startsLine }],
    number: /0[xX][\da-fA-F_]+[uUlL]*|0[bB][01_]+[uUlL]*|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[uUlLfFdDmM]*/y,
    word: {
      keywords: wordSet(
        "abstract add and as async await base break case catch checked class const continue default delegate do else enum " +
          "event explicit extern finally fixed for foreach from get global goto if implicit in init interface internal is lock " +
          "namespace new not operator or out override params partial private protected public readonly record ref remove " +
          "required return sealed select set sizeof stackalloc static struct switch this throw try typeof unchecked unsafe " +
          "using value var virtual volatile when where while with yield",
      ),
      literals: wordSet("true false null"),
      types: wordSet("bool byte char decimal double dynamic float int long nint nuint object sbyte short string uint ulong ushort void"),
      // Methods are written in PascalCase too, so a call is a call before it is a type.
      callBeforeType: true,
    },
  });

/** C#, for `registerCodeLanguage`. Also `cs` and `csharp`. */
export const csharpLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("csharp", ["cs", "c#"], csharpRules);
