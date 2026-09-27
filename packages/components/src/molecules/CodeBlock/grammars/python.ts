import { defineLanguage, startsLine, word, wordClassifier, wordSet } from "./kit";
import { notAfterWord } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const pythonRules = (): Rule[] => [
  { re: /#[^\n]*/y, type: "comment" },
  // A decorator: an `@` that starts a statement (an `@` in the middle of one is matrix multiplication).
  { re: /@[A-Za-z_][\w.]*/y, type: "function", when: startsLine },
  {
    // A string with an optional prefix (`r`, `b`, `f`, `rb`…), triple-quoted ones running across lines.
    re: /(?:[rRuUbBfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)/y,
    type: "string",
    when: notAfterWord,
  },
  { re: /0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[jJ]?/y, type: "number" },
  word(
    wordClassifier({
      keywords: wordSet(
        "and as assert async await break class continue def del elif else except finally for from global if import in is " +
          "lambda nonlocal not or pass raise return try while with yield self cls",
      ),
      literals: wordSet("True False None"),
      types: wordSet("int str float bool list dict set tuple bytes complex object frozenset bytearray"),
    }),
  ),
];

/** Python, for `registerCodeLanguage`. Also `py` and `python3`. */
export const pythonLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("python", ["py", "python3"], pythonRules);
